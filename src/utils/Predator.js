import { Vector2 } from './mathHelpers';

/**
 * Prédateur intelligent avec différentes stratégies de chasse
 * Basé sur les recherches en simulations boids prédateur-proie
 */
export class Predator {
  constructor(screenWidth, screenHeight) {
    this.position = { x: screenWidth / 2, y: screenHeight / 2 };
    this.screenWidth = screenWidth;
    this.screenHeight = screenHeight;

    // Mode de chasse par défaut
    this.mode = 'center_attack';

    // Paramètres configurables
    this.aggressiveness = 1.0;  // Multiplicateur de vitesse (0.5 = lent, 2.0 = rapide)
    this.visionRange = 500;     // Distance de détection des proies
    this.retreatDistance = 80;  // Distance minimale avant de s'arrêter

    // Variables d'état pour différents modes
    this.angle = 0;           // Pour patrol
    this.timer = 0;           // Pour random et phases
    this.state = 'approach';  // Pour disruptor et ambush
    this.currentStrategy = 0; // Pour adaptive
    this.targetBoid = null;   // Pour tracking

    console.log('🦁 Prédateur créé - Mode:', this.mode, 'Position initiale:', this.position);
  }

  /**
   * Change le mode de comportement
   */
  setMode(mode) {
    console.log('🔄 Changement mode prédateur:', this.mode, '→', mode);
    this.mode = mode;

    // Reset des variables selon le mode
    this.timer = 0;
    this.state = 'approach';
    this.targetBoid = null;

    if (mode === 'patrol') {
      this.angle = 0;
    } else if (mode === 'adaptive') {
      this.currentStrategy = 0;
      this.timer = 0;
    }
  }

  /**
   * Ajuste l'agressivité du prédateur
   */
  setAggressiveness(value) {
    this.aggressiveness = Math.max(0.1, Math.min(3.0, value));
    console.log('⚡ Agressivité ajustée:', this.aggressiveness);
  }

  /**
   * Met à jour la position du prédateur
   */
  update(boids, deltaTime) {
    switch (this.mode) {
      case 'center_attack':
        return this.updateCenterAttack(boids);
      case 'nearest_attack':
        return this.updateNearestAttack(boids);
      case 'isolator':
        return this.updateIsolator(boids);
      case 'disruptor':
        return this.updateDisruptor(boids, deltaTime);
      case 'adaptive':
        return this.updateAdaptive(boids, deltaTime);
      case 'patrol':
        return this.updatePatrol(deltaTime);
      case 'random':
        return this.updateRandom(deltaTime);
      default:
        return this.position;
    }
  }

  /**
   * Mode Center Attack : Suit le centre de masse du groupe
   * (ancien mode "hunter")
   */
  updateCenterAttack(boids) {
    if (boids.length === 0) return this.position;

    // Calculer le centre de masse
    const centerX = boids.reduce((sum, b) => sum + b.position.x, 0) / boids.length;
    const centerY = boids.reduce((sum, b) => sum + b.position.y, 0) / boids.length;

    // Se déplacer vers le centre
    const dx = centerX - this.position.x;
    const dy = centerY - this.position.y;
    const dist = Math.sqrt(dx * dx + dy * dy);

    // Ne pas coller au centre
    if (dist > this.retreatDistance) {
      const speed = 3 * this.aggressiveness;
      this.position.x += (dx / dist) * speed;
      this.position.y += (dy / dist) * speed;
    }

    this.clampToScreen();
    return this.position;
  }

  /**
   * Mode Nearest Attack : Chasse la proie la plus proche
   * (ancien mode "predator")
   */
  updateNearestAttack(boids) {
    if (boids.length === 0) return this.position;

    // Trouver le boid le plus proche
    let closest = null;
    let minDist = Infinity;

    boids.forEach(b => {
      const dist = Vector2.dist(this.position, b.position);
      if (dist < minDist && dist < this.visionRange) {
        minDist = dist;
        closest = b;
      }
    });

    if (closest) {
      // Foncer sur la cible
      const dx = closest.position.x - this.position.x;
      const dy = closest.position.y - this.position.y;
      const dist = Math.sqrt(dx * dx + dy * dy);

      if (dist > 5) {
        const speed = 8 * this.aggressiveness;
        this.position.x += (dx / dist) * speed;
        this.position.y += (dy / dist) * speed;
      }
    }

    this.clampToScreen();
    return this.position;
  }

  /**
   * Mode Isolator : Cible la proie la plus isolée (moins de voisins)
   * Stratégie réaliste documentée dans la recherche
   */
  updateIsolator(boids) {
    if (boids.length === 0) return this.position;

    // Pour chaque boid, compter ses voisins dans un rayon de 100px
    let mostIsolated = null;
    let minNeighbors = Infinity;

    boids.forEach(boid => {
      // Compter les voisins
      const neighborCount = boids.filter(other => {
        if (other === boid) return false;
        const dist = Vector2.dist(boid.position, other.position);
        return dist < 100;
      }).length;

      // Vérifier si dans range de vision du prédateur
      const distToPredator = Vector2.dist(this.position, boid.position);

      if (neighborCount < minNeighbors && distToPredator < this.visionRange) {
        minNeighbors = neighborCount;
        mostIsolated = boid;
      }
    });

    if (mostIsolated) {
      // Chasser la proie isolée
      const dx = mostIsolated.position.x - this.position.x;
      const dy = mostIsolated.position.y - this.position.y;
      const dist = Math.sqrt(dx * dx + dy * dy);

      if (dist > 5) {
        const speed = 6 * this.aggressiveness;
        this.position.x += (dx / dist) * speed;
        this.position.y += (dy / dist) * speed;
      }
    } else {
      // Fallback : se rapprocher du groupe
      return this.updateCenterAttack(boids);
    }

    this.clampToScreen();
    return this.position;
  }

  /**
   * Mode Disruptor : Charge le centre puis se retire (disperse le groupe)
   */
  updateDisruptor(boids, deltaTime) {
    if (boids.length === 0) return this.position;

    this.timer += deltaTime;

    // Calculer le centre du groupe
    const centerX = boids.reduce((sum, b) => sum + b.position.x, 0) / boids.length;
    const centerY = boids.reduce((sum, b) => sum + b.position.y, 0) / boids.length;
    const distToCenter = Math.sqrt(
      (centerX - this.position.x) ** 2 +
      (centerY - this.position.y) ** 2
    );

    // Phase 1 : Charge (4 secondes)
    if (this.timer < 4) {
      this.state = 'charging';

      if (distToCenter > 30) {
        const dx = centerX - this.position.x;
        const dy = centerY - this.position.y;
        const dist = Math.sqrt(dx * dx + dy * dy);

        const speed = 10 * this.aggressiveness; // Très rapide
        this.position.x += (dx / dist) * speed;
        this.position.y += (dy / dist) * speed;
      }
    }
    // Phase 2 : Retraite (2 secondes)
    else if (this.timer < 6) {
      this.state = 'retreating';

      // S'éloigner du centre
      const dx = this.position.x - centerX;
      const dy = this.position.y - centerY;
      const dist = Math.sqrt(dx * dx + dy * dy);

      if (dist > 0 && dist < 200) {
        const speed = 5 * this.aggressiveness;
        this.position.x += (dx / dist) * speed;
        this.position.y += (dy / dist) * speed;
      }
    }
    // Reset
    else {
      this.timer = 0;
    }

    this.clampToScreen();
    return this.position;
  }

  /**
   * Mode Adaptive : Change de stratégie toutes les 8 secondes
   * Challenge maximal pour l'apprentissage
   */
  updateAdaptive(boids, deltaTime) {
    this.timer += deltaTime;

    // Rotation des stratégies toutes les 8 secondes
    const strategies = [
      'center_attack',
      'nearest_attack',
      'isolator',
      'disruptor'
    ];

    if (this.timer >= 8) {
      this.currentStrategy = (this.currentStrategy + 1) % strategies.length;
      this.timer = 0;

      console.log('🧠 ADAPTIVE - Nouvelle stratégie:', strategies[this.currentStrategy]);
    }

    // Exécuter la stratégie actuelle
    const currentMode = this.mode;
    this.mode = strategies[this.currentStrategy];
    const result = this.update(boids, deltaTime);
    this.mode = currentMode; // Restaurer le mode adaptive

    return result;
  }

  /**
   * Mode Patrol : Tourne en cercle autour du centre
   */
  updatePatrol(deltaTime) {
    const centerX = this.screenWidth / 2;
    const centerY = this.screenHeight / 2;
    const radius = 300;

    this.angle += 0.015 * this.aggressiveness;

    this.position.x = centerX + Math.cos(this.angle) * radius;
    this.position.y = centerY + Math.sin(this.angle) * radius;

    return this.position;
  }

  /**
   * Mode Random : Téléportation aléatoire
   */
  updateRandom(deltaTime) {
    this.timer += deltaTime;

    // Téléportation toutes les 3 secondes
    if (this.timer >= 3) {
      const newX = Math.random() * this.screenWidth;
      const newY = Math.random() * this.screenHeight;

      console.log('🎲 RANDOM - TÉLÉPORTATION !',
        { x: this.position.x.toFixed(0), y: this.position.y.toFixed(0) },
        '→',
        { x: newX.toFixed(0), y: newY.toFixed(0) }
      );

      this.position.x = newX;
      this.position.y = newY;
      this.timer = 0;
    }

    return this.position;
  }

  /**
   * Garde le prédateur dans les limites de l'écran
   */
  clampToScreen() {
    this.position.x = Math.max(0, Math.min(this.screenWidth, this.position.x));
    this.position.y = Math.max(0, Math.min(this.screenHeight, this.position.y));
  }

  /**
   * Récupère le mode actuel (pour affichage UI)
   */
  getMode() {
    return this.mode;
  }

  /**
   * Récupère l'état actuel (pour modes avec phases)
   */
  getState() {
    return this.state;
  }
}
