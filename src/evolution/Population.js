import { NeuralBoid } from './NeuralBoid';
import { calculateFitness, calculatePopulationStats } from './FitnessEvaluator';
import { evolvePopulation } from './GeneticAlgorithm';
import { saveBrain, loadBrain, downloadBrain } from '../ml/BrainModel';
import { detectBehavior } from './BehaviorAnalyzer';
import { ArtificialCursor } from '../utils/ArtificialCursor';

const GENERATION_DURATION = 30; // ⬆️ de 20s (plus de temps pour apprendre)
const POPULATION_SIZE = 50; // Réduit pour meilleures performances

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
    this.currentBehavior = '🧬 Initialisation';
    this.lastCursor = null;
    this.lastBehaviorCheck = -2; // Timer pour la détection de comportement (force détection immédiate)

    // Curseur artificiel
    this.cursorMode = 'auto'; // 'auto' ou 'manual'
    this.artificialCursor = new ArtificialCursor(window.innerWidth, window.innerHeight);

    console.log('🤖 Population initialisée - Mode curseur:', this.cursorMode);

    // Initialiser la première génération
    this.initializePopulation();
  }

  /**
   * Crée la population initiale avec des cerveaux aléatoires
   */
  initializePopulation() {
    this.boids = [];

    for (let i = 0; i < this.size; i++) {
      const x = Math.random() * window.innerWidth;
      const y = Math.random() * window.innerHeight;
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
  update(manualCursor, screenWidth, screenHeight, deltaTime) {
    if (!this.isEvolving) return;

    // Déterminer quel curseur utiliser
    let cursor;
    if (this.cursorMode === 'auto') {
      cursor = this.artificialCursor.update(this.boids, deltaTime);
    } else {
      cursor = manualCursor;
    }

    // Sauvegarder curseur pour détection de comportement
    this.lastCursor = cursor;

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

    // Détecter comportement toutes les 1 seconde
    if (this.generationTimer - this.lastBehaviorCheck >= 1.0 && cursor) {
      console.log('🔍 DÉTECTION COMPORTEMENT:', {
        timer: this.generationTimer.toFixed(2),
        lastCheck: this.lastBehaviorCheck.toFixed(2),
        cursorPos: { x: cursor.x?.toFixed(0) || cursor.x, y: cursor.y?.toFixed(0) || cursor.y }
      });

      this.currentBehavior = detectBehavior(this.boids, cursor);

      console.log('✅ Comportement détecté:', this.currentBehavior);
      this.lastBehaviorCheck = this.generationTimer;
    }

    // Si génération terminée → évolution
    if (this.generationTimer >= this.generationDuration) {
      this.nextGeneration();
    }
  }

  /**
   * Passe à la génération suivante
   */
  nextGeneration() {
    console.log('🧬 === GÉNÉRATION', this.generation, 'TERMINÉE ===');

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
    this.lastBehaviorCheck = 0; // Reset du timer de détection

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
    this.lastBehaviorCheck = 0;
    this.fitnessHistory = [];
    this.stats = { avg: 0, best: 0, worst: 0, median: 0 };
    this.currentBehavior = '🧬 Initialisation';

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

  /**
   * Sauvegarde le meilleur boid dans LocalStorage
   */
  async saveChampion() {
    if (this.boids.length === 0) return false;

    // Trier pour trouver le meilleur
    const sorted = [...this.boids].sort((a, b) => b.fitness - a.fitness);
    const champion = sorted[0];

    const success = await saveBrain(champion.brain, `champion-gen${this.generation}`);
    if (success) {
      console.log(`💾 Champion sauvegardé (Génération ${this.generation})`);
    }
    return success;
  }

  /**
   * Télécharge le meilleur boid en fichier
   */
  async downloadChampion() {
    if (this.boids.length === 0) return false;

    const sorted = [...this.boids].sort((a, b) => b.fitness - a.fitness);
    const champion = sorted[0];

    const success = await downloadBrain(champion.brain, `champion-gen${this.generation}`);
    if (success) {
      console.log(`📥 Champion téléchargé (Génération ${this.generation})`);
    }
    return success;
  }

  /**
   * Charge un champion et remplace toute la population avec des clones mutés
   */
  async loadChampion(name = 'champion-gen1') {
    const brain = await loadBrain(name);
    if (!brain) return false;

    // Disposer anciens boids
    this.boids.forEach(b => b.dispose());

    // Créer nouvelle population à partir du champion
    this.boids = [];
    for (let i = 0; i < this.size; i++) {
      const x = Math.random() * window.innerWidth;
      const y = Math.random() * window.innerHeight;
      const boid = new NeuralBoid(x, y, brain);
      this.boids.push(boid);
    }

    console.log(`📂 Champion chargé: ${name}`);
    return true;
  }

  /**
   * Bascule entre curseur auto et manuel
   */
  setCursorMode(mode) {
    this.cursorMode = mode; // 'auto' ou 'manual'
    console.log('🎯 === MODE CURSEUR CHANGÉ:', mode, '===');
  }

  /**
   * Change le comportement du curseur IA
   */
  setAICursorBehavior(behavior) {
    this.artificialCursor.setMode(behavior);
    console.log('🤖 === COMPORTEMENT IA CHANGÉ:', behavior, '===');
  }

  /**
   * Récupère la position actuelle du curseur (pour affichage)
   */
  getCursorPosition() {
    if (this.cursorMode === 'auto') {
      return this.artificialCursor.position;
    }
    return null; // En mode manuel, pas besoin d'afficher
  }
}
