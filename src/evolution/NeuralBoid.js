import { Vector2 } from '../utils/mathHelpers';
import { createBrain, predict, cloneBrain } from '../ml/BrainModel';

// Constantes de mouvement
const MAX_FORCE = 1.5;  // Forces plus fortes = réactions plus vives
const MAX_SPEED = 8;     // Vitesse max augmentée
const FRICTION = 0.95;   // Moins de friction = plus de fluidité
const PERCEPTION_RADIUS = 100;

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
   */
  perceive(cursorPos, boids, screenWidth, screenHeight) {
    const inputs = [];

    // 1. Distance au curseur (normalisée)
    const distToCursor = Vector2.dist(this.position, cursorPos);
    inputs.push(distToCursor / Math.max(screenWidth, screenHeight));

    // 2. Angle vers curseur
    const angleToCursor = Vector2.angleBetween(this.position, cursorPos);
    inputs.push(angleToCursor / Math.PI); // Normalisé entre -1 et 1

    // 3-5. Distance moyenne, alignement et cohésion avec 3 voisins les plus proches
    const neighbors = this.findNearestNeighbors(boids, 3);

    if (neighbors.length > 0) {
      // Distance moyenne
      const avgDist = neighbors.reduce((sum, n) =>
        sum + Vector2.dist(this.position, n.position), 0) / neighbors.length;
      inputs.push(avgDist / PERCEPTION_RADIUS);

      // Alignement moyen (similarité de direction)
      const avgAlignment = neighbors.reduce((sum, n) => {
        const dot = this.velocity.x * n.velocity.x + this.velocity.y * n.velocity.y;
        const mag1 = this.velocity.mag();
        const mag2 = n.velocity.mag();
        return sum + (mag1 && mag2 ? dot / (mag1 * mag2) : 0);
      }, 0) / neighbors.length;
      inputs.push(avgAlignment);

      // Cohésion (direction vers centre du groupe)
      const center = neighbors.reduce((acc, n) => {
        acc.x += n.position.x;
        acc.y += n.position.y;
        return acc;
      }, new Vector2(0, 0));
      center.div(neighbors.length);
      const cohesionAngle = Vector2.angleBetween(this.position, center);
      inputs.push(cohesionAngle / Math.PI);
    } else {
      inputs.push(0.5, 0, 0); // Valeurs neutres si pas de voisins
    }

    // 6. Vitesse actuelle (magnitude)
    inputs.push(this.velocity.mag() / MAX_SPEED);

    // 7-8. Position X et Y relative (normalisée 0-1)
    inputs.push(this.position.x / screenWidth);
    inputs.push(this.position.y / screenHeight);

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

    // Petit biais de mouvement pour éviter l'immobilité
    const currentSpeed = this.velocity.mag();
    if (currentSpeed < 1) {
      // Si presque immobile, ajouter une petite force aléatoire
      force.add(Vector2.random2D().mult(0.3));
    }

    return force;
  }

  /**
   * Applique une force
   */
  applyForce(force) {
    this.acceleration.add(force);
  }

  /**
   * Met à jour la position
   */
  update(screenWidth, screenHeight) {
    // Physique
    this.velocity.add(this.acceleration);
    this.velocity.mult(FRICTION);  // Friction pour mouvements fluides
    this.velocity.limit(MAX_SPEED);
    this.position.add(this.velocity);
    this.acceleration.mult(0);

    // Wraparound aux bords (coordonnées normales 0 → width/height)
    if (this.position.x < 0) this.position.x = screenWidth;
    if (this.position.x > screenWidth) this.position.x = 0;
    if (this.position.y < 0) this.position.y = screenHeight;
    if (this.position.y > screenHeight) this.position.y = 0;

    // Mettre à jour le trail
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
