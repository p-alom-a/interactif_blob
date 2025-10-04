import { Vector2 } from './mathHelpers';

/**
 * Curseur artificiel intelligent avec différents modes de comportement
 */
export class ArtificialCursor {
  constructor(screenWidth, screenHeight) {
    this.position = { x: screenWidth / 2, y: screenHeight / 2 };
    this.screenWidth = screenWidth;
    this.screenHeight = screenHeight;
    this.mode = 'hunter'; // Mode par défaut
    this.angle = 0; // Pour le mode patrol
    this.timer = 0; // Pour le mode random
    this.speed = 3; // Vitesse de base

    console.log('🤖 Curseur IA créé - Mode:', this.mode, 'Position initiale:', this.position);
  }

  /**
   * Change le mode de comportement
   */
  setMode(mode) {
    console.log('🔄 Changement mode curseur IA:', this.mode, '→', mode);
    this.mode = mode;

    // Reset des variables selon le mode
    if (mode === 'patrol') {
      this.angle = 0;
    } else if (mode === 'random') {
      this.timer = 0;
    }
  }

  /**
   * Met à jour la position du curseur
   */
  update(boids, deltaTime) {
    switch (this.mode) {
      case 'hunter':
        return this.updateHunter(boids);
      case 'predator':
        return this.updatePredator(boids);
      case 'patrol':
        return this.updatePatrol(deltaTime);
      case 'random':
        return this.updateRandom(deltaTime);
      default:
        return this.position;
    }
  }

  /**
   * Mode Hunter : Suit le centre du groupe
   */
  updateHunter(boids) {
    if (boids.length === 0) return this.position;

    // Calculer le centre de masse
    const centerX = boids.reduce((sum, b) => sum + b.position.x, 0) / boids.length;
    const centerY = boids.reduce((sum, b) => sum + b.position.y, 0) / boids.length;

    // Log toutes les 3 secondes pour ne pas spammer
    if (Math.floor(Date.now() / 3000) % 10 === 0 && Math.random() < 0.1) {
      console.log('🎯 HUNTER mode - Centre groupe:',
        { x: centerX.toFixed(0), y: centerY.toFixed(0) },
        'Distance:', Vector2.dist(this.position, { x: centerX, y: centerY }).toFixed(0)
      );
    }

    // Se déplacer doucement vers le centre
    const dx = centerX - this.position.x;
    const dy = centerY - this.position.y;
    const dist = Math.sqrt(dx * dx + dy * dy);

    // Ne pas coller au centre, s'arrêter à 80px
    if (dist > 80) {
      const speed = 3;
      this.position.x += (dx / dist) * speed;
      this.position.y += (dy / dist) * speed;
    }

    // Garder dans les limites
    this.clampToScreen();

    return this.position;
  }

  /**
   * Mode Predator : Chasse le boid le plus proche
   */
  updatePredator(boids) {
    if (boids.length === 0) return this.position;

    // Trouver le boid le plus proche
    let closest = null;
    let minDist = Infinity;

    boids.forEach(b => {
      const dist = Vector2.dist(this.position, b.position);
      if (dist < minDist) {
        minDist = dist;
        closest = b;
      }
    });

    if (closest) {
      // Log toutes les 3 secondes
      if (Math.floor(Date.now() / 3000) % 10 === 0 && Math.random() < 0.1) {
        console.log('⚡ PREDATOR mode - Chasse cible à distance:', minDist.toFixed(0));
      }

      // Foncer sur la cible
      const dx = closest.position.x - this.position.x;
      const dy = closest.position.y - this.position.y;
      const dist = Math.sqrt(dx * dx + dy * dy);

      if (dist > 5) {
        const speed = 8; // Vitesse élevée
        this.position.x += (dx / dist) * speed;
        this.position.y += (dy / dist) * speed;
      }
    }

    this.clampToScreen();
    return this.position;
  }

  /**
   * Mode Patrol : Tourne en cercle autour du centre
   */
  updatePatrol(deltaTime) {
    const centerX = this.screenWidth / 2;
    const centerY = this.screenHeight / 2;
    const radius = 300;

    this.angle += 0.015; // Vitesse angulaire

    this.position.x = centerX + Math.cos(this.angle) * radius;
    this.position.y = centerY + Math.sin(this.angle) * radius;

    // Log toutes les 5 secondes
    if (Math.floor(Date.now() / 5000) % 10 === 0 && Math.random() < 0.05) {
      console.log('🔄 PATROL mode - Angle:', (this.angle * 180 / Math.PI).toFixed(0), '°');
    }

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

      console.log('🎲 RANDOM mode - TÉLÉPORTATION !',
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
   * Garde le curseur dans les limites de l'écran
   */
  clampToScreen() {
    this.position.x = Math.max(0, Math.min(this.screenWidth, this.position.x));
    this.position.y = Math.max(0, Math.min(this.screenHeight, this.position.y));
  }
}
