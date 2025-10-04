import { useEffect } from 'react';
import Scene from './Scene';
import Swarm from './Swarm';
import HandTracker from './HandTracker';
import { useGameStore } from '../store/gameStore';

export default function Game() {
  const {
    getCurrentLevelData,
    handPosition,
    handDetected,
    particles,
    updateVictoryProgress,
    currentLevel,
    levelCompleted
  } = useGameStore();

  const levelData = getCurrentLevelData();

  // Level 1: Apprivoisement - particules restent proches
  useEffect(() => {
    if (currentLevel !== 0 || !handDetected) return;

    const checkProximity = setInterval(() => {
      const handPos = { x: handPosition.x, y: handPosition.y, z: handPosition.z };
      let closeParticles = 0;

      particles.forEach(particle => {
        const dx = particle.position.x - handPos.x;
        const dy = particle.position.y - handPos.y;
        const dz = particle.position.z - handPos.z;
        const distance = Math.sqrt(dx * dx + dy * dy + dz * dz);

        if (distance < 5) closeParticles++;
      });

      const proximityRatio = closeParticles / particles.length;

      if (proximityRatio > 0.8) {
        updateVictoryProgress(2); // +2% par intervalle
      } else {
        updateVictoryProgress(-1); // -1% si ratio insuffisant
      }
    }, 100);

    return () => clearInterval(checkProximity);
  }, [currentLevel, handDetected, handPosition, particles, updateVictoryProgress]);

  // Level 2: Synchronisation (à implémenter plus tard)
  // Level 3: Construction de clusters (à implémenter plus tard)
  // Level 4: Autonomie (à implémenter plus tard)

  return (
    <div style={{ position: 'relative', width: '100vw', height: '100vh' }}>
      {/* Hand Tracker */}
      <HandTracker />

      {/* Level UI */}
      <div
        style={{
          position: 'fixed',
          top: '20px',
          left: '50%',
          transform: 'translateX(-50%)',
          color: 'white',
          fontFamily: 'Arial, sans-serif',
          fontSize: '24px',
          fontWeight: 'bold',
          textAlign: 'center',
          zIndex: 1000,
          textShadow: '0 2px 10px rgba(0,0,0,0.8)'
        }}
      >
        <div>{levelData.name}</div>
        {levelCompleted && (
          <div style={{ fontSize: '18px', marginTop: '10px', color: '#4ecdc4' }}>
            Level Complete!
          </div>
        )}
      </div>

      {/* Instructions */}
      {!handDetected && (
        <div
          style={{
            position: 'fixed',
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
            color: 'white',
            fontFamily: 'Arial, sans-serif',
            fontSize: '18px',
            textAlign: 'center',
            backgroundColor: 'rgba(0, 0, 0, 0.7)',
            padding: '30px',
            borderRadius: '10px',
            zIndex: 1000
          }}
        >
          <div style={{ fontSize: '24px', marginBottom: '15px' }}>✋</div>
          <div>Show your hand to the camera</div>
          <div style={{ fontSize: '14px', marginTop: '10px', opacity: 0.7 }}>
            Move slowly to gain their trust
          </div>
        </div>
      )}

      {/* 3D Scene */}
      <Scene>
        <Swarm />
      </Scene>
    </div>
  );
}
