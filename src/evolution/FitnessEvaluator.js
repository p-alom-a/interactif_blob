import { Vector2 } from '../utils/mathHelpers';

// Constantes de fitness
const DANGER_RADIUS = 100;          // Distance critique au curseur
const IDEAL_COHESION_DIST = 80;     // Distance idéale entre voisins
const COHESION_WEIGHT = 1.2;        // ⬆️ de 1.0 (groupes serrés)
const AVOIDANCE_WEIGHT = 2.0;       // ⚪ Évitement curseur prioritaire
const ALIGNMENT_WEIGHT = 1.0;       // ⬆️ de 0.5 (mouvements coordonnés)
const BOUNDARY_PENALTY = 20;        // ⚪ Pénalité sortie écran
const SPEED_PENALTY = 2;

/**
 * Calcule la fitness d'un boid pour une frame
 * La fitness s'accumule frame par frame pendant toute la génération
 *
 * @param {NeuralBoid} boid - Le boid à évaluer
 * @param {Vector2} cursor - Position du curseur
 * @param {Array} neighbors - Voisins proches du boid
 * @param {number} screenWidth - Largeur de l'écran
 * @param {number} screenHeight - Hauteur de l'écran
 * @returns {number} - Score de fitness pour cette frame
 */
export function calculateFitness(boid, cursor, neighbors, screenWidth, screenHeight) {
  let score = 0;

  // 1. Évitement curseur (prioritaire)
  const distToCursor = Vector2.dist(boid.position, cursor);

  if (distToCursor < DANGER_RADIUS) {
    // Pénalité forte si trop proche
    score -= (DANGER_RADIUS - distToCursor) / 10 * AVOIDANCE_WEIGHT;
  } else {
    // Récompense si loin du curseur
    score += Math.min(distToCursor * 0.01, 5) * AVOIDANCE_WEIGHT;
  }

  // 2. Cohésion du groupe
  if (neighbors.length > 0) {
    const avgDistToNeighbors = neighbors.reduce((sum, n) =>
      sum + Vector2.dist(boid.position, n.position), 0) / neighbors.length;

    // Récompense si distance aux voisins proche de l'idéal
    const cohesionDiff = Math.abs(avgDistToNeighbors - IDEAL_COHESION_DIST);
    score += (IDEAL_COHESION_DIST - cohesionDiff) * 0.05 * COHESION_WEIGHT;
  } else {
    // Légère pénalité si isolé
    score -= 1;
  }

  // 3. Alignement avec le groupe
  if (neighbors.length > 0) {
    const avgAlignment = neighbors.reduce((sum, n) => {
      const dot = boid.velocity.x * n.velocity.x + boid.velocity.y * n.velocity.y;
      const mag1 = boid.velocity.mag();
      const mag2 = n.velocity.mag();
      return sum + (mag1 && mag2 ? dot / (mag1 * mag2) : 0);
    }, 0) / neighbors.length;

    // Récompense si bien aligné (avgAlignment proche de 1)
    score += avgAlignment * ALIGNMENT_WEIGHT;
  }

  // 4. Survie (rester dans les limites de l'écran)
  if (boid.isOutOfBounds(screenWidth, screenHeight)) {
    score -= BOUNDARY_PENALTY;
  }

  // 5. Pénalité vitesse excessive (économie d'énergie)
  const MAX_SPEED = 8; // Doit correspondre à MAX_SPEED dans NeuralBoid
  if (boid.velocity.mag() > MAX_SPEED * 0.9) {
    score -= SPEED_PENALTY;
  }

  // Bonus de survie basique (être en vie = bon)
  score += 0.1;

  return score;
}

/**
 * Calcule les statistiques de fitness pour toute la population
 *
 * @param {Array} boids - Population de boids
 * @returns {Object} - Stats { avg, best, worst, median }
 */
export function calculatePopulationStats(boids) {
  if (boids.length === 0) {
    return { avg: 0, best: 0, worst: 0, median: 0 };
  }

  const fitnesses = boids.map(b => b.fitness).sort((a, b) => b - a);

  const sum = fitnesses.reduce((acc, f) => acc + f, 0);
  const avg = sum / fitnesses.length;
  const best = fitnesses[0];
  const worst = fitnesses[fitnesses.length - 1];
  const median = fitnesses[Math.floor(fitnesses.length / 2)];

  return { avg, best, worst, median };
}

/**
 * Normalise la fitness pour la sélection (évite les valeurs négatives)
 *
 * @param {Array} boids - Population de boids
 * @returns {Array} - Fitnesses normalisées
 */
export function normalizeFitnesses(boids) {
  const fitnesses = boids.map(b => b.fitness);
  const minFitness = Math.min(...fitnesses);

  // Décaler toutes les fitness pour qu'elles soient positives
  const offset = minFitness < 0 ? Math.abs(minFitness) + 1 : 0;

  return boids.map(b => b.fitness + offset);
}
