import { Vector2 } from '../utils/mathHelpers';
import { MAX_SPEED, SEPARATION_THRESHOLD, PERCEPTION_RADIUS } from './NeuralBoid';

// Constantes de fitness - Standards académiques Cornell (ajustés)
const IDEAL_COHESION_DIST = 30;     // Distance idéale entre voisins (75% de PERCEPTION_RADIUS)
const IDEAL_SPEED = 4.5;            // Vitesse idéale = 75% de MAX_SPEED (6)
const EDGE_PENALTY_FACTOR = 0.01;   // Pénalité douce pour dissuader bords sans exploser

/**
 * Calcule la fitness d'un boid pour une frame
 * VERSION REYNOLDS PURE optimisée selon RAPPORT.md
 * La fitness s'accumule frame par frame pendant toute la génération
 *
 * @param {NeuralBoid} boid - Le boid à évaluer
 * @param {Array} neighbors - Voisins proches du boid
 * @param {number} screenWidth - Largeur de l'écran
 * @param {number} screenHeight - Hauteur de l'écran
 * @returns {number} - Score de fitness pour cette frame
 */
export function calculateFitness(boid, neighbors, screenWidth, screenHeight) {
  let score = 0;

  // 1. COHÉSION — distance idéale aux voisins (RÉCOMPENSE ÉQUILIBRÉE)
  if (neighbors.length > 0) {
    const avgDist = neighbors.reduce((sum, n) =>
      sum + Vector2.dist(boid.position, n.position), 0) / neighbors.length;

    // Récompense gaussienne pour distance idéale (RAPPORT.md recommandation)
    const idealDistScore = Math.exp(-Math.pow((avgDist - IDEAL_COHESION_DIST) / 15, 2));
    score += idealDistScore * 2.0; // Réduit de 3.0 → 2.0

    // Ancienne formule linéaire (backup, commentée)
    // const cohesionScore = Math.max(0, 1 - Math.abs(avgDist - IDEAL_COHESION_DIST) / IDEAL_COHESION_DIST);
    // score += cohesionScore * 1.5;
  } else {
    score -= 0.3; // Pénalité modérée pour isolement
  }

  // 2. SÉPARATION — éviter collisions (RENFORCÉE)
  const tooClose = neighbors.filter(n =>
    Vector2.dist(boid.position, n.position) < SEPARATION_THRESHOLD);
  score -= tooClose.length * 2.0; // Augmenté de 0.5 → 2.0 (RAPPORT.md)

  // 3. ALIGNEMENT — direction moyenne (récompense augmentée)
  if (neighbors.length > 0) {
    const avgAlignment = neighbors.reduce((sum, n) => {
      const dot = boid.velocity.x * n.velocity.x + boid.velocity.y * n.velocity.y;
      const mag1 = boid.velocity.mag(), mag2 = n.velocity.mag();
      return sum + (mag1 && mag2 ? dot / (mag1 * mag2) : 0);
    }, 0) / neighbors.length;
    score += avgAlignment * 2.0; // Augmenté de 1.2 → 2.0
  }

  // 3.5 DIRECTIONALITÉ GLOBALE — récompenser mouvement coordonné (anti-tourbillon)
  if (neighbors.length > 3) {
    // Calculer le vecteur vitesse moyen du groupe
    const avgVelX = neighbors.reduce((sum, n) => sum + n.velocity.x, 0) / neighbors.length;
    const avgVelY = neighbors.reduce((sum, n) => sum + n.velocity.y, 0) / neighbors.length;

    // Magnitude du momentum global (0 si tourbillon, élevé si direction claire)
    const globalMomentum = Math.sqrt(avgVelX * avgVelX + avgVelY * avgVelY);

    // Normaliser par MAX_SPEED et récompenser modérément (×0.8 pour ne pas dominer)
    const directionScore = (globalMomentum / MAX_SPEED) * 0.8;
    score += directionScore;
  }

  // 4. DISTANCE AUX BORDS — pénalité EXPONENTIELLE forte (anti-camping)
  const margin = 50;
  const distToEdge = Math.min(
    boid.position.x, boid.position.y,
    screenWidth - boid.position.x, screenHeight - boid.position.y
  );
  if (distToEdge < margin) {
    // Pénalité exponentielle : plus proche = beaucoup plus pénalisé
    // (50px → -0, 0px → -10.0 par frame) - Renforcée pour PERCEPTION_RADIUS=60
    const edgePenalty = Math.pow((margin - distToEdge) / margin, 2) * 10.0;
    score -= edgePenalty;
  }

  // 5. MOUVEMENT — récompense pour vitesse
  const speed = boid.velocity.mag();
  score += speed * 0.3;

  // 6. VITESSE IDÉALE — récompense pour vitesse proche de l'idéal
  score += (IDEAL_SPEED - Math.abs(speed - IDEAL_SPEED)) * 0.2;

  // 7. PÉNALITÉ VITESSE EXCESSIVE
  if (speed > MAX_SPEED * 0.9) score -= 0.2;

  // 8. BONUS DE SURVIE (nouveau - encourage existence)
  score += 0.5; // Bonus passif pour équilibrer

  // 9. LIMITER FITNESS NÉGATIVES EXTRÊMES (anti-toxicité)
  // Empêche un boid "toxique" de polluer la sélection génétique
  return Math.max(score, -100); // Floor à -100 par frame max
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
