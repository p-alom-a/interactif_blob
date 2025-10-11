import { NeuralBoid } from './NeuralBoid';
import { calculateFitness, calculatePopulationStats } from './FitnessEvaluator';
import { evolvePopulation } from './GeneticAlgorithm';
import { saveBrain, loadBrain, downloadBrain, loadFromFiles, cloneBrain } from '../ml/BrainModel';
import { detectBehavior } from './BehaviorAnalyzer';

const GENERATION_DURATION = 60; // Augmenté de 30s → 60s (RAPPORT.md)
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

    // VERSION REYNOLDS PURE : Pas de prédateur, curseur ignoré
    this.cursorMode = 'none'; // Désactivé pour apprentissage pur des règles de Reynolds
    this.predator = null;

    console.log('🧬 Population initialisée - Mode: Reynolds pur (sans prédateur)');

    // Initialiser la première génération
    this.initializePopulation();
  }

  /**
   * Crée la population initiale avec des cerveaux aléatoires
   */
  initializePopulation(screenWidth, screenHeight) {
    this.boids = [];

    // Utiliser les dimensions du canvas passées en paramètre (ou fallback)
    const width = screenWidth || window.innerWidth;
    const height = screenHeight || window.innerHeight;

    for (let i = 0; i < this.size; i++) {
      const x = Math.random() * width;
      const y = Math.random() * height;
      const boid = new NeuralBoid(x, y);
      this.boids.push(boid);
    }

    console.log(`🧬 Génération ${this.generation} : ${this.boids.length} boids créés (${width}x${height})`);
  }

  /**
   * Met à jour la population (à chaque frame)
   * - Calcule les décisions des boids via leurs NN
   * - Accumule la fitness
   * - Gère le timer de génération
   */
  update(manualCursor, screenWidth, screenHeight, deltaTime) {
    if (!this.isEvolving) return;

    // Mettre à jour chaque boid (optimisé avec cache voisins)
    this.boids.forEach(boid => {
      // 1. Trouver voisins UNE SEULE FOIS (cache pour perceive + fitness)
      const neighbors = boid.findNearestNeighbors(this.boids, 5);

      // 2. Percevoir l'environnement avec voisins pré-calculés
      const inputs = boid.perceive(this.boids, screenWidth, screenHeight, neighbors);

      // 3. Penser (décision du NN)
      const decision = boid.think(inputs);

      // 4. Agir
      boid.applyForce(decision);

      // 5. Mettre à jour physique
      boid.update(screenWidth, screenHeight);

      // 6. Accumuler fitness avec mêmes voisins
      const frameFitness = calculateFitness(boid, neighbors, screenWidth, screenHeight);
      boid.fitness += frameFitness;
    });

    // Incrémenter timer de génération
    this.generationTimer += deltaTime;

    // Détecter comportement toutes les 1 seconde
    if (this.generationTimer - this.lastBehaviorCheck >= 1.0) {
      this.currentBehavior = detectBehavior(this.boids, null); // null = pas de curseur
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
   * Télécharge le meilleur boid en fichier avec métadonnées
   */
  async downloadChampion() {
    if (this.boids.length === 0) return false;

    const sorted = [...this.boids].sort((a, b) => b.fitness - a.fitness);
    const champion = sorted[0];

    // Passer le numéro de génération pour sauvegarde dans metadata
    const success = await downloadBrain(
      champion.brain,
      `champion-gen${this.generation}`,
      this.generation // NOUVEAU : inclure génération
    );
    if (success) {
      console.log(`📥 Champion téléchargé (Génération ${this.generation}) + metadata.json`);
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
    // IMPORTANT: Cloner le cerveau pour chaque boid pour éviter partage de référence
    this.boids = [];
    for (let i = 0; i < this.size; i++) {
      const x = Math.random() * window.innerWidth;
      const y = Math.random() * window.innerHeight;
      // Premier boid utilise le cerveau original, les autres des clones
      const boidBrain = i === 0 ? brain : cloneBrain(brain);
      const boid = new NeuralBoid(x, y, boidBrain);
      this.boids.push(boid);
    }

    console.log(`📂 Champion chargé: ${name}`);
    return true;
  }

  /**
   * Charge un champion depuis des fichiers uploadés (.json + .bin + optionnel metadata)
   */
  async loadChampionFromFiles(jsonFile, binFile, metadataFile = null) {
    const result = await loadFromFiles(jsonFile, binFile, metadataFile);
    if (!result) return false;

    const { model: brain, generation: savedGeneration } = result;

    // Disposer anciens boids
    this.boids.forEach(b => b.dispose());

    // Créer nouvelle population à partir du champion uploadé
    // IMPORTANT: Cloner le cerveau pour chaque boid pour éviter partage de référence
    this.boids = [];
    for (let i = 0; i < this.size; i++) {
      const x = Math.random() * window.innerWidth;
      const y = Math.random() * window.innerHeight;
      // Premier boid utilise le cerveau original, les autres des clones
      const boidBrain = i === 0 ? brain : cloneBrain(brain);
      const boid = new NeuralBoid(x, y, boidBrain);
      this.boids.push(boid);
    }

    // RESTAURER LA GÉNÉRATION depuis metadata ou filename
    this.generation = savedGeneration;
    this.generationTimer = 0;
    this.lastBehaviorCheck = 0;
    this.fitnessHistory = [];
    this.stats = { avg: 0, best: 0, worst: 0, median: 0 };
    this.currentBehavior = `Champion Gen ${savedGeneration} chargé`;

    console.log(`📁 Champion chargé depuis fichiers: ${jsonFile.name} (Génération ${savedGeneration})`);
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
   * Change le comportement du prédateur
   */
  setPredatorBehavior(behavior) {
    if (this.predator) {
      this.predator.setMode(behavior);
      console.log('🦁 === COMPORTEMENT PRÉDATEUR CHANGÉ:', behavior, '===');
    }
  }

  /**
   * Récupère la position actuelle du prédateur (pour affichage)
   */
  getPredatorPosition() {
    if (this.cursorMode === 'auto' && this.predator) {
      return this.predator.position;
    }
    return null; // En mode manuel ou sans prédateur
  }
}
