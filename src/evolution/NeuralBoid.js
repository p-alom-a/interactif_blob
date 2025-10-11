import { Vector2 } from '../utils/mathHelpers';
import { createBrain, predict, cloneBrain } from '../ml/BrainModel';

// Constantes de mouvement - Standards académiques Cornell
const MAX_FORCE = 0.6;          // Force maximale appliquée par le NN
const MAX_SPEED = 6;            // Vitesse maximale (Cornell: 6)
const MIN_SPEED = 3;            // Vitesse minimale pour éviter immobilité
const FRICTION = 0.985;         // Friction pour mouvements fluides
const PERCEPTION_RADIUS = 60;   // Distance de perception (augmentée 40→60 pour groupe unifié)
const SEPARATION_THRESHOLD = 8; // Distance de séparation (Cornell: 2-8)
const EDGE_MARGIN = 50;         // Marge avant application forces de bord
const TURN_FACTOR = 0.5;        // Force de retournement aux bords (augmentée 0.2 → 0.5)

// Exports pour FitnessEvaluator
export { MAX_SPEED, SEPARATION_THRESHOLD, PERCEPTION_RADIUS };

// Fonction utilitaire pour normalisation stricte
function clamp(value, min = -1, max = 1) {
  return Math.max(min, Math.min(max, value));
}

export class NeuralBoid {
  constructor(x, y, brain = null) {
    this.position = new Vector2(x, y);
    this.velocity = Vector2.random2D();
    this.velocity.setMag(Math.random() * 2 + 1);
    this.acceleration = new Vector2();

    // Réseau de neurones
    this.brain = brain || createBrain();

    // Fitness pour l'évolution
    this.fitness = 0;

    // Historique de positions pour les trails
    this.trail = [];
    this.maxTrailLength = 10;
  }

  /**
   * Perçoit l'environnement et crée les inputs pour le réseau de neurones
   * VERSION REYNOLDS PURE : 8 inputs (RAPPORT.md optimisé)
   * Tous les inputs sont strictement normalisés entre -1 et 1
   * @param {Array} boids - Population complète
   * @param {number} screenWidth - Largeur écran
   * @param {number} screenHeight - Hauteur écran
   * @param {Array} cachedNeighbors - Voisins pré-calculés (optionnel, pour optimisation)
   */
  perceive(boids, screenWidth, screenHeight, cachedNeighbors = null) {
    const inputs = [];
    const neighbors = cachedNeighbors || this.findNearestNeighbors(boids, 5);

    if (neighbors.length > 0) {
      // 1. Distance moyenne aux voisins (centrée -1 à 1) - RAPPORT.md fix
      const avgDist = neighbors.reduce((sum, n) =>
        sum + Vector2.dist(this.position, n.position), 0) / neighbors.length;
      inputs.push((clamp(avgDist / PERCEPTION_RADIUS, 0, 1) - 0.5) * 2);

      // 2. Alignement moyen avec voisins (-1 à 1)
      const avgAlignment = neighbors.reduce((sum, n) => {
        const dot = this.velocity.x * n.velocity.x + this.velocity.y * n.velocity.y;
        const mag1 = this.velocity.mag();
        const mag2 = n.velocity.mag();
        return sum + (mag1 && mag2 ? dot / (mag1 * mag2) : 0);
      }, 0) / neighbors.length;
      inputs.push(clamp(avgAlignment));

      // 3. Angle vers centre du groupe (-1 à 1)
      const center = neighbors.reduce((acc, n) => {
        acc.x += n.position.x;
        acc.y += n.position.y;
        return acc;
      }, new Vector2(0, 0));
      center.div(neighbors.length);
      const cohesionAngle = Vector2.angleBetween(this.position, center);
      inputs.push(clamp(cohesionAngle / Math.PI));

      // 4. Direction moyenne des voisins (angle normalisé -1 à 1)
      const avgVelX = neighbors.reduce((sum, n) => sum + n.velocity.x, 0) / neighbors.length;
      const avgVelY = neighbors.reduce((sum, n) => sum + n.velocity.y, 0) / neighbors.length;
      const avgVelAngle = Math.atan2(avgVelY, avgVelX);
      inputs.push(clamp(avgVelAngle / Math.PI));
    } else {
      // Pas de voisins : valeurs neutres
      inputs.push(0, 0, 0, 0); // Distance, alignement, cohésion, direction
    }

    // 5. Vitesse actuelle (centrée -1 à 1) - RAPPORT.md fix
    inputs.push((clamp(this.velocity.mag() / MAX_SPEED, 0, 1) - 0.5) * 2);

    // 6. Distance au bord le plus proche (centrée -1 à 1) - RAPPORT.md fix
    const distToEdge = Math.min(
      this.position.x,
      this.position.y,
      screenWidth - this.position.x,
      screenHeight - this.position.y
    );
    inputs.push((clamp(distToEdge / 100, 0, 1) - 0.5) * 2);

    // 7. Position X globale normalisée (-1 à 1) - NOUVEAU (RAPPORT.md)
    inputs.push(clamp((this.position.x / screenWidth) * 2 - 1));

    // 8. Position Y globale normalisée (-1 à 1) - NOUVEAU (RAPPORT.md)
    inputs.push(clamp((this.position.y / screenHeight) * 2 - 1));

    return inputs;
  }

  /**
   * Trouve les N voisins les plus proches
   */
  findNearestNeighbors(boids, count) {
    const neighbors = boids
      .filter(b => b !== this)
      .map(b => ({
        boid: b,
        dist: Vector2.dist(this.position, b.position)
      }))
      .filter(({ dist }) => dist < PERCEPTION_RADIUS)
      .sort((a, b) => a.dist - b.dist)
      .slice(0, count)
      .map(({ boid }) => boid);

    return neighbors;
  }

  /**
   * Pense et décide de l'action à prendre
   */
  think(inputs) {
    const output = predict(this.brain, inputs);
    const force = new Vector2(output[0], output[1]);
    force.mult(MAX_FORCE);

    // Note: MIN_SPEED est maintenant appliqué dans update()
    return force;
  }

  /**
   * Applique une force
   */
  applyForce(force) {
    this.acceleration.add(force);
  }

  /**
   * Met à jour la position (méthode Cornell standard)
   */
  update(screenWidth, screenHeight) {
    // 1. Appliquer accélération (décision du NN)
    this.velocity.add(this.acceleration);
    this.acceleration.mult(0); // Reset APRÈS application

    // 2. Forces de bords PROPORTIONNELLES (RAPPORT.md correction)
    // Force progressive selon distance au bord (évite coins attracteurs)

    // Bord gauche/droite
    if (this.position.x < EDGE_MARGIN) {
      const edgeStrength = (EDGE_MARGIN - this.position.x) / EDGE_MARGIN;
      this.velocity.x += TURN_FACTOR * edgeStrength;
    } else if (this.position.x > screenWidth - EDGE_MARGIN) {
      const edgeStrength = (this.position.x - (screenWidth - EDGE_MARGIN)) / EDGE_MARGIN;
      this.velocity.x -= TURN_FACTOR * edgeStrength;
    }

    // Bord haut/bas
    if (this.position.y < EDGE_MARGIN) {
      const edgeStrength = (EDGE_MARGIN - this.position.y) / EDGE_MARGIN;
      this.velocity.y += TURN_FACTOR * edgeStrength;
    } else if (this.position.y > screenHeight - EDGE_MARGIN) {
      const edgeStrength = (this.position.y - (screenHeight - EDGE_MARGIN)) / EDGE_MARGIN;
      this.velocity.y -= TURN_FACTOR * edgeStrength;
    }

    // 3. Appliquer friction
    this.velocity.mult(FRICTION);

    // 4. Encourager vitesse minimale (anti-paresse douce)
    const currentSpeed = this.velocity.mag();
    if (currentSpeed < MIN_SPEED && currentSpeed > 0.1) {
      // Au lieu de forcer, on booste progressivement vers MIN_SPEED
      const boost = (MIN_SPEED - currentSpeed) * 0.1; // 10% du manque
      this.velocity.setMag(currentSpeed + boost);
    } else if (currentSpeed < 0.1) {
      // Si quasi-immobile, petite impulsion aléatoire
      this.velocity.add(Vector2.random2D().mult(0.5));
    }

    // 5. Limiter vitesse maximale
    this.velocity.limit(MAX_SPEED);

    // 6. Mettre à jour position
    this.position.add(this.velocity);

    // 6.5. Rebond doux aux bords (au lieu de clamp strict qui "colle")
    if (this.position.x < 0 || this.position.x > screenWidth) {
      this.velocity.x *= -0.8; // Rebond avec friction
      this.position.x = Math.max(0, Math.min(screenWidth, this.position.x));
    }
    if (this.position.y < 0 || this.position.y > screenHeight) {
      this.velocity.y *= -0.8; // Rebond avec friction
      this.position.y = Math.max(0, Math.min(screenHeight, this.position.y));
    }

    // 7. Mettre à jour le trail
    this.trail.unshift({ x: this.position.x, y: this.position.y });
    if (this.trail.length > this.maxTrailLength) {
      this.trail.pop();
    }
  }

  /**
   * Vérifie si le boid est hors limites
   */
  isOutOfBounds(screenWidth, screenHeight, margin = 50) {
    return this.position.x < -margin ||
           this.position.x > screenWidth + margin ||
           this.position.y < -margin ||
           this.position.y > screenHeight + margin;
  }

  /**
   * Clone ce boid (pour l'évolution)
   */
  clone() {
    const clonedBrain = cloneBrain(this.brain);
    const newBoid = new NeuralBoid(this.position.x, this.position.y, clonedBrain);
    return newBoid;
  }

  /**
   * Dispose proprement les ressources
   */
  dispose() {
    if (this.brain) {
      this.brain.dispose();
    }
  }
}
