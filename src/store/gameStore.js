import { create } from 'zustand';
import { LEVELS } from '../config/levels';

export const useGameStore = create((set, get) => ({
  // Game state
  currentLevel: 0,
  isPlaying: false,
  isPaused: false,

  // Particles state
  particles: [],
  particleCount: LEVELS[0].particleCount.start,

  // Hand tracking state
  handPosition: { x: 0, y: 0, z: 0 },
  handOpen: false,
  handDetected: false,

  // Progress tracking
  progress: 0,
  trustLevel: 0,
  syncCounter: 0,
  clusterSize: 0,

  // Victory condition
  victoryProgress: 0,
  levelCompleted: false,

  // Actions
  setHandPosition: (position) => set({ handPosition: position }),

  setHandOpen: (isOpen) => set({ handOpen: isOpen }),

  setHandDetected: (detected) => set({ handDetected: detected }),

  updateParticles: (particles) => set({ particles }),

  incrementProgress: (amount) => set((state) => ({
    progress: Math.min(100, state.progress + amount)
  })),

  updateTrustLevel: (delta) => set((state) => ({
    trustLevel: Math.max(0, Math.min(100, state.trustLevel + delta))
  })),

  incrementSyncCounter: () => set((state) => ({
    syncCounter: state.syncCounter + 1
  })),

  updateClusterSize: (size) => set({ clusterSize: size }),

  updateVictoryProgress: (delta) => {
    const state = get();
    const newProgress = Math.max(0, Math.min(100, state.victoryProgress + delta));

    set({ victoryProgress: newProgress });

    if (newProgress >= 100 && !state.levelCompleted) {
      set({ levelCompleted: true });
      setTimeout(() => {
        get().nextLevel();
      }, 2000);
    }
  },

  nextLevel: () => {
    const state = get();
    const nextLevelIndex = state.currentLevel + 1;

    if (nextLevelIndex < LEVELS.length) {
      set({
        currentLevel: nextLevelIndex,
        progress: 0,
        trustLevel: 0,
        syncCounter: 0,
        clusterSize: 0,
        victoryProgress: 0,
        levelCompleted: false,
        particleCount: LEVELS[nextLevelIndex].particleCount.start
      });
    }
  },

  resetLevel: () => {
    const state = get();
    const currentLevelData = LEVELS[state.currentLevel];

    set({
      progress: 0,
      trustLevel: 0,
      syncCounter: 0,
      clusterSize: 0,
      victoryProgress: 0,
      levelCompleted: false,
      particleCount: currentLevelData.particleCount.start,
      particles: []
    });
  },

  startGame: () => set({ isPlaying: true, isPaused: false }),

  pauseGame: () => set({ isPaused: true }),

  resumeGame: () => set({ isPaused: false }),

  resetGame: () => set({
    currentLevel: 0,
    isPlaying: false,
    isPaused: false,
    particles: [],
    particleCount: LEVELS[0].particleCount.start,
    progress: 0,
    trustLevel: 0,
    syncCounter: 0,
    clusterSize: 0,
    victoryProgress: 0,
    levelCompleted: false
  }),

  // Getters
  getCurrentLevelData: () => LEVELS[get().currentLevel],

  getParticlesByProximity: (position, radius) => {
    return get().particles.filter(p => {
      const dx = p.position.x - position.x;
      const dy = p.position.y - position.y;
      const dz = p.position.z - position.z;
      return Math.sqrt(dx * dx + dy * dy + dz * dz) < radius;
    });
  }
}));
