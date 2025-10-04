import { NeuralBoid } from './NeuralBoid';
import { crossover as brainCrossover, mutateBrain } from '../ml/BrainModel';
import { normalizeFitnesses } from './FitnessEvaluator';

// Paramètres évolutionnaires
export const MUTATION_RATE = 0.3;  // 30% pour accélérer l'apprentissage initial
export const ELITE_COUNT = 5;       // Top 5 préservés intacts
export const CROSSOVER_RATE = 0.7;  // 70% crossover, 30% clones

/**
 * Sélection par tournoi
 * Choisit le meilleur parmi N candidats aléatoires
 *
 * @param {Array} population - Population de boids
 * @param {number} tournamentSize - Taille du tournoi (défaut: 3)
 * @returns {NeuralBoid} - Boid sélectionné
 */
export function tournamentSelection(population, tournamentSize = 3) {
  let best = null;
  let bestFitness = -Infinity;

  for (let i = 0; i < tournamentSize; i++) {
    const candidate = population[Math.floor(Math.random() * population.length)];
    if (candidate.fitness > bestFitness) {
      best = candidate;
      bestFitness = candidate.fitness;
    }
  }

  return best;
}

/**
 * Sélection par roulette (probabilité proportionnelle à la fitness)
 *
 * @param {Array} population - Population de boids
 * @returns {NeuralBoid} - Boid sélectionné
 */
export function rouletteSelection(population) {
  const normalizedFitnesses = normalizeFitnesses(population);
  const totalFitness = normalizedFitnesses.reduce((sum, f) => sum + f, 0);

  if (totalFitness === 0) {
    // Si toutes les fitness sont nulles, sélection aléatoire
    return population[Math.floor(Math.random() * population.length)];
  }

  let random = Math.random() * totalFitness;
  let sum = 0;

  for (let i = 0; i < population.length; i++) {
    sum += normalizedFitnesses[i];
    if (random <= sum) {
      return population[i];
    }
  }

  return population[population.length - 1];
}

/**
 * Crée une nouvelle génération par évolution
 *
 * @param {Array} currentPopulation - Population actuelle
 * @param {number} populationSize - Taille de la population
 * @returns {Array} - Nouvelle population
 */
export function evolvePopulation(currentPopulation, populationSize) {
  // Trier par fitness décroissante
  const sorted = [...currentPopulation].sort((a, b) => b.fitness - a.fitness);

  const newPopulation = [];

  // 1. Élitisme : garder les meilleurs intacts
  for (let i = 0; i < ELITE_COUNT && i < sorted.length; i++) {
    const elite = sorted[i].clone();
    elite.fitness = 0; // Reset fitness pour la nouvelle génération
    newPopulation.push(elite);
  }

  // 2. Reproduction jusqu'à remplir la population
  while (newPopulation.length < populationSize) {
    let child;

    if (Math.random() < CROSSOVER_RATE) {
      // Crossover entre deux parents
      const parentA = tournamentSelection(sorted);
      const parentB = tournamentSelection(sorted);

      // Créer l'enfant par crossover des cerveaux
      const childBrain = brainCrossover(parentA.brain, parentB.brain);

      // Position aléatoire
      const x = (Math.random() - 0.5) * window.innerWidth;
      const y = (Math.random() - 0.5) * window.innerHeight;
      child = new NeuralBoid(x, y, childBrain);
    } else {
      // Clone d'un parent sélectionné
      const parent = tournamentSelection(sorted);
      child = parent.clone();
    }

    // 3. Mutation
    mutateBrain(child.brain, MUTATION_RATE);

    // Reset fitness
    child.fitness = 0;

    newPopulation.push(child);
  }

  return newPopulation;
}

/**
 * Sélectionne les meilleurs boids (top 50%)
 *
 * @param {Array} population - Population actuelle
 * @returns {Array} - Survivants
 */
export function selectBest(population) {
  const sorted = [...population].sort((a, b) => b.fitness - a.fitness);
  const survivorCount = Math.floor(population.length / 2);
  return sorted.slice(0, survivorCount);
}
