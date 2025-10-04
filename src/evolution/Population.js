import { NeuralBoid } from './NeuralBoid';
import { calculateFitness, calculatePopulationStats } from './FitnessEvaluator';
import { evolvePopulation } from './GeneticAlgorithm';

const GENERATION_DURATION = 20; // secondes par génération
const POPULATION_SIZE = 100;

export class Population {
  constructor(size = POPULATION_SIZE) {
    this.size = size;
    this.generation = 1;
    this.boids = [];
    this.generationTimer = 0;
    this.generationDuration = GENERATION_DURATION;
    this.stats = { avg: 0, best: 0, worst: 0, median: 0 };
    this.fitnessHistory = [];
    this.isEvolving = true;

    // Initialiser la première génération
    this.initializePopulation();
  }

  /**
   * Crée la population initiale avec des cerveaux aléatoires
   */
  initializePopulation() {
    this.boids = [];

    for (let i = 0; i < this.size; i++) {
      const x = (Math.random() - 0.5) * window.innerWidth;
      const y = (Math.random() - 0.5) * window.innerHeight;
      const boid = new NeuralBoid(x, y);
      this.boids.push(boid);
    }

    console.log(`🧬 Génération ${this.generation} : ${this.boids.length} boids créés`);
  }

  /**
   * Met à jour la population (à chaque frame)
   * - Calcule les décisions des boids via leurs NN
   * - Accumule la fitness
   * - Gère le timer de génération
   */
  update(cursor, screenWidth, screenHeight, deltaTime) {
    if (!this.isEvolving) return;

    // Mettre à jour chaque boid
    this.boids.forEach(boid => {
      // 1. Percevoir l'environnement
      const inputs = boid.perceive(cursor, this.boids, screenWidth, screenHeight);

      // 2. Penser (décision du NN)
      const decision = boid.think(inputs);

      // 3. Agir
      boid.applyForce(decision);

      // 4. Mettre à jour physique
      boid.update(screenWidth, screenHeight);

      // 5. Trouver voisins pour fitness
      const neighbors = boid.findNearestNeighbors(this.boids, 5);

      // 6. Accumuler fitness
      const frameFitness = calculateFitness(boid, cursor, neighbors, screenWidth, screenHeight);
      boid.fitness += frameFitness;
    });

    // Incrémenter timer de génération
    this.generationTimer += deltaTime;

    // Si génération terminée → évolution
    if (this.generationTimer >= this.generationDuration) {
      this.nextGeneration();
    }
  }

  /**
   * Passe à la génération suivante
   */
  nextGeneration() {
    // Calculer stats de la génération
    this.stats = calculatePopulationStats(this.boids);

    // Sauvegarder historique
    this.fitnessHistory.push({
      generation: this.generation,
      ...this.stats
    });

    // Log console
    console.log(
      `📊 Génération ${this.generation} terminée - ` +
      `Avg: ${this.stats.avg.toFixed(2)}, ` +
      `Best: ${this.stats.best.toFixed(2)}, ` +
      `Worst: ${this.stats.worst.toFixed(2)}`
    );

    // Faire évoluer
    const newBoids = evolvePopulation(this.boids, this.size);

    // Disposer anciens boids
    this.boids.forEach(b => b.dispose());

    // Remplacer population
    this.boids = newBoids;

    // Nouvelle génération
    this.generation++;
    this.generationTimer = 0;

    console.log(`✨ Génération ${this.generation} créée par évolution`);
  }

  /**
   * Reset la population (génération 1)
   */
  reset() {
    // Disposer tous les boids
    this.boids.forEach(b => b.dispose());

    // Réinitialiser
    this.generation = 1;
    this.generationTimer = 0;
    this.fitnessHistory = [];
    this.stats = { avg: 0, best: 0, worst: 0, median: 0 };

    // Nouvelle population aléatoire
    this.initializePopulation();
  }

  /**
   * Pause/Resume évolution
   */
  toggleEvolution() {
    this.isEvolving = !this.isEvolving;
  }

  /**
   * Ajuste la durée d'une génération
   */
  setGenerationDuration(duration) {
    this.generationDuration = duration;
  }

  /**
   * Obtient le temps restant dans la génération actuelle
   */
  getRemainingTime() {
    return Math.max(0, this.generationDuration - this.generationTimer);
  }

  /**
   * Obtient le progrès de la génération (0-1)
   */
  getProgress() {
    return Math.min(1, this.generationTimer / this.generationDuration);
  }

  /**
   * Dispose proprement toute la population
   */
  dispose() {
    this.boids.forEach(b => b.dispose());
    this.boids = [];
  }
}
