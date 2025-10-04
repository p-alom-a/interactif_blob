import { Vector2 } from '../utils/mathHelpers';
import { createBrain, predict, cloneBrain } from '../ml/BrainModel';
import * as THREE from 'three';

// Constantes de mouvement
const MAX_FORCE = 0.3;
const MAX_SPEED = 4;
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

    // Mesh Three.js (sera initialisé par la scène)
    this.mesh = null;

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

    // 7-8. Position X et Y relative (normalisée 0-1, coordonnées centrées)
    inputs.push((this.position.x / screenWidth) + 0.5);
    inputs.push((this.position.y / screenHeight) + 0.5);

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
    this.velocity.limit(MAX_SPEED);
    this.position.add(this.velocity);
    this.acceleration.mult(0);

    // Wraparound aux bords (coordonnées centrées)
    const halfW = screenWidth / 2;
    const halfH = screenHeight / 2;
    if (this.position.x < -halfW) this.position.x = halfW;
    if (this.position.x > halfW) this.position.x = -halfW;
    if (this.position.y < -halfH) this.position.y = halfH;
    if (this.position.y > halfH) this.position.y = -halfH;

    // Mettre à jour le trail
    this.trail.unshift({ x: this.position.x, y: this.position.y });
    if (this.trail.length > this.maxTrailLength) {
      this.trail.pop();
    }

    // Mettre à jour le mesh Three.js si présent
    if (this.mesh) {
      this.mesh.position.x = this.position.x;
      this.mesh.position.y = this.position.y;
    }
  }

  /**
   * Vérifie si le boid est hors limites
   */
  isOutOfBounds(screenWidth, screenHeight, margin = 50) {
    const halfW = screenWidth / 2;
    const halfH = screenHeight / 2;
    return this.position.x < -halfW - margin ||
           this.position.x > halfW + margin ||
           this.position.y < -halfH - margin ||
           this.position.y > halfH + margin;
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
    if (this.mesh) {
      this.mesh.geometry.dispose();
      this.mesh.material.dispose();
    }
  }
}
