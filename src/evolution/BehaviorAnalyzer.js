import { Vector2 } from '../utils/mathHelpers';

/**
 * Détecte les comportements émergents dans une population
 */
export function detectBehavior(boids, cursor) {
  if (boids.length === 0) return '🧬 Initialisation';

  const behaviors = {
    coordinated: checkCoordination(boids),
    exploring: checkExploration(boids),
    huddling: checkHuddling(boids),
    fleeing: checkFleeing(boids, cursor),
    zigzagging: checkZigzag(boids)
  };

  // Clamp de sécurité : garantir tous les scores entre 0 et 1
  Object.keys(behaviors).forEach(key => {
    behaviors[key] = Math.max(0, Math.min(1, behaviors[key]));
  });

  console.log('📊 SCORES COMPORTEMENTS:', {
    coordinated: behaviors.coordinated.toFixed(3),
    exploring: behaviors.exploring.toFixed(3),
    huddling: behaviors.huddling.toFixed(3),
    fleeing: behaviors.fleeing.toFixed(3),
    zigzagging: behaviors.zigzagging.toFixed(3)
  });

  // Retourner le comportement dominant
  const dominant = Object.entries(behaviors)
    .sort(([, a], [, b]) => b - a)[0];

  console.log('🏆 Dominant:', dominant[0], 'score:', dominant[1].toFixed(3));

  return formatBehaviorName(dominant[0]);
}

/**
 * Vérifie si les boids sont bien coordonnés (alignement élevé)
 */
function checkCoordination(boids) {
  let totalAlignment = 0;
  let count = 0;

  for (let i = 0; i < boids.length; i++) {
    for (let j = i + 1; j < Math.min(boids.length, i + 5); j++) {
      const dot = boids[i].velocity.x * boids[j].velocity.x +
                  boids[i].velocity.y * boids[j].velocity.y;
      const mag1 = boids[i].velocity.mag();
      const mag2 = boids[j].velocity.mag();

      if (mag1 > 0 && mag2 > 0) {
        totalAlignment += dot / (mag1 * mag2);
        count++;
      }
    }
  }

  // Mapper de [-1, 1] vers [0, 1]
  const alignment = count > 0 ? totalAlignment / count : 0;
  return (alignment + 1) / 2;
}

/**
 * Vérifie si les boids explorent (vitesse élevée, dispersion)
 */
function checkExploration(boids) {
  const avgSpeed = boids.reduce((sum, b) => sum + b.velocity.mag(), 0) / boids.length;
  const avgDistance = calculateAverageDistance(boids);

  // Exploration = vitesse élevée + distance élevée
  // Seuils ajustés : vitesse max=8, distance réaliste=100
  const speedScore = Math.min(1, avgSpeed / 8);
  const distScore = Math.min(1, avgDistance / 100);
  return speedScore * 0.5 + distScore * 0.5;
}

/**
 * Vérifie si les boids sont regroupés (huddling)
 */
function checkHuddling(boids) {
  const avgDistance = calculateAverageDistance(boids);

  // Plus la distance est faible, plus le score est élevé
  // Seuil ajusté à 80 (distance réaliste de regroupement)
  return Math.max(0, 1 - avgDistance / 80);
}

/**
 * Vérifie si les boids fuient le curseur
 */
function checkFleeing(boids, cursor) {
  let fleeingCount = 0;

  boids.forEach(boid => {
    const distToCursor = Vector2.dist(boid.position, cursor);
    const dirToCursor = new Vector2(
      cursor.x - boid.position.x,
      cursor.y - boid.position.y
    ).normalize();

    const velocityNorm = boid.velocity.copy().normalize();

    // Produit scalaire : -1 = fuite parfaite, 1 = attraction
    const dot = velocityNorm.x * dirToCursor.x + velocityNorm.y * dirToCursor.y;

    // Condition assouplie : distance 300px, seuil -0.3
    // Pondération : plus proche du prédateur = score plus élevé
    if (distToCursor < 300 && dot < -0.3) {
      const weight = 1 - (distToCursor / 300);
      fleeingCount += weight;
    }
  });

  return fleeingCount / boids.length;
}

/**
 * Vérifie si les boids font du zigzag (changement de direction fréquent)
 */
function checkZigzag(boids) {
  // Analyser les trails pour détecter les changements de direction
  let zigzagScore = 0;
  let count = 0;

  boids.forEach(boid => {
    if (boid.trail.length < 3) return;

    for (let i = 0; i < boid.trail.length - 2; i++) {
      const p1 = boid.trail[i];
      const p2 = boid.trail[i + 1];
      const p3 = boid.trail[i + 2];

      const v1 = new Vector2(p2.x - p1.x, p2.y - p1.y);
      const v2 = new Vector2(p3.x - p2.x, p3.y - p2.y);

      if (v1.mag() > 0 && v2.mag() > 0) {
        v1.normalize();
        v2.normalize();

        const dot = v1.x * v2.x + v1.y * v2.y;
        // Changement de direction si dot < 0.5
        if (dot < 0.5) {
          zigzagScore++;
        }
        count++;
      }
    }
  });

  return count > 0 ? zigzagScore / count : 0;
}

/**
 * Calcule la distance moyenne entre tous les boids
 */
function calculateAverageDistance(boids) {
  if (boids.length < 2) return 0;

  let totalDist = 0;
  let count = 0;

  for (let i = 0; i < boids.length; i++) {
    for (let j = i + 1; j < Math.min(boids.length, i + 10); j++) {
      totalDist += Vector2.dist(boids[i].position, boids[j].position);
      count++;
    }
  }

  return count > 0 ? totalDist / count : 0;
}

/**
 * Formate le nom du comportement pour l'affichage
 */
function formatBehaviorName(behavior) {
  const names = {
    coordinated: '🎯 Mouvement coordonné',
    exploring: '🔍 Exploration active',
    huddling: '🤝 Regroupement',
    fleeing: '🏃 Fuite du curseur',
    zigzagging: '⚡ Zigzag évasif'
  };

  return names[behavior] || '🧬 Évolution en cours';
}
