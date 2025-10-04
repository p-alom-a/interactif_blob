export const LEVELS = [
  {
    id: 1,
    name: "Naissance",
    particleCount: { start: 20, end: 80 },
    sizeRange: [0.3, 0.6],
    goal: "80% des particules < 100px de la main pendant 5 sec",
    boids: {
      separation: 0.8,
      alignment: 0.1,
      cohesion: 0.2
    },
    handEffect: {
      open: "attract_weak",
      closed: "repel_strong"
    },
    colors: {
      particle: "#4a90e2",
      halo: "#ff6b6b"
    },
    speed: 0.5,
    perceptionRadius: 50
  },
  {
    id: 2,
    name: "Maturité",
    particleCount: { start: 80, end: 150 },
    sizeRange: [0.4, 0.8],
    goal: "3 danses synchronisées réussies",
    boids: {
      separation: 0.5,
      alignment: 0.6,
      cohesion: 0.4
    },
    handEffect: {
      open: "attract_medium",
      closed: "attract_weak"
    },
    colors: {
      particle: "#6bb6ff",
      halo: "#4ecdc4"
    },
    speed: 0.7,
    perceptionRadius: 75
  },
  {
    id: 3,
    name: "Symbiose",
    particleCount: { start: 150, end: 300 },
    sizeRange: [0.5, 1.0],
    goal: "Créer un super-cluster de 100+ particules",
    boids: {
      separation: 0.3,
      alignment: 0.7,
      cohesion: 0.8
    },
    handEffect: {
      open: "attract_strong",
      closed: "divide"
    },
    colors: {
      particle: "#95e1d3",
      halo: "#f38181"
    },
    speed: 0.9,
    perceptionRadius: 100
  },
  {
    id: 4,
    name: "Transcendance",
    particleCount: { start: 300, end: 500 },
    sizeRange: [0.6, 1.2],
    goal: "L'organisme devient autonome",
    boids: {
      separation: 0.2,
      alignment: 0.9,
      cohesion: 0.9
    },
    handEffect: {
      open: "guide",
      closed: "release"
    },
    colors: {
      particle: "#ffd93d",
      halo: "#6bcf7f"
    },
    speed: 1.2,
    perceptionRadius: 150
  }
];

export const GAME_CONFIG = {
  maxParticles: 500,
  canvasWidth: window.innerWidth,
  canvasHeight: window.innerHeight,
  targetFPS: 60,
  handSmoothingFactor: 0.15,
  handOpenThreshold: 0.15,
  victoryDuration: 5000, // ms
  transitionDuration: 2000 // ms
};
