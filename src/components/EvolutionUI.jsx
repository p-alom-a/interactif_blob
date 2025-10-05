import { useState, useEffect } from 'react';

function EvolutionUI({ population, onReset, onTogglePause, onSpeedUp, onSave, onDownload, cursorMode, onCursorModeToggle, predatorBehavior, onPredatorBehaviorChange }) {
  const [stats, setStats] = useState({ avg: 0, best: 0, worst: 0, median: 0 });
  const [generation, setGeneration] = useState(1);
  const [progress, setProgress] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const [remainingTime, setRemainingTime] = useState(20);
  const [fitnessHistory, setFitnessHistory] = useState([]);
  const [behavior, setBehavior] = useState('🧬 Initialisation');
  const [isCollapsed, setIsCollapsed] = useState(false);

  useEffect(() => {
    // Mettre à jour les stats toutes les 100ms
    const interval = setInterval(() => {
      if (population) {
        setStats(population.stats);
        setGeneration(population.generation);
        setProgress(population.getProgress());
        setRemainingTime(Math.ceil(population.getRemainingTime()));
        setFitnessHistory(population.fitnessHistory);
        setBehavior(population.currentBehavior);
      }
    }, 100);

    return () => clearInterval(interval);
  }, [population]);

  const handlePause = () => {
    setIsPaused(!isPaused);
    if (onTogglePause) onTogglePause();
  };

  // Générer le graphe SVG
  const renderGraph = () => {
    if (fitnessHistory.length < 2) return null;

    const width = 240;
    const height = 80;
    const padding = 10;
    const graphWidth = width - padding * 2;
    const graphHeight = height - padding * 2;

    // Trouver min/max pour normaliser
    const allValues = fitnessHistory.flatMap(h => [h.avg, h.best]);
    const minFitness = Math.min(...allValues);
    const maxFitness = Math.max(...allValues);
    const range = maxFitness - minFitness || 1;

    // Créer les points pour la ligne moyenne
    const avgPoints = fitnessHistory.map((h, i) => {
      const x = padding + (i / (fitnessHistory.length - 1)) * graphWidth;
      const y = padding + graphHeight - ((h.avg - minFitness) / range) * graphHeight;
      return `${x},${y}`;
    }).join(' ');

    // Créer les points pour la ligne meilleure
    const bestPoints = fitnessHistory.map((h, i) => {
      const x = padding + (i / (fitnessHistory.length - 1)) * graphWidth;
      const y = padding + graphHeight - ((h.best - minFitness) / range) * graphHeight;
      return `${x},${y}`;
    }).join(' ');

    return (
      <svg width={width} height={height} style={{ marginTop: '10px' }}>
        <polyline
          points={avgPoints}
          fill="none"
          stroke="#00ff88"
          strokeWidth="2"
          opacity="0.8"
        />
        <polyline
          points={bestPoints}
          fill="none"
          stroke="#ffff00"
          strokeWidth="2"
          opacity="0.8"
        />
      </svg>
    );
  };

  return (
    <div style={{
      position: 'fixed',
      top: 20,
      left: 20,
      backgroundColor: 'rgba(10, 10, 10, 0.85)',
      padding: '20px',
      borderRadius: '12px',
      color: '#00ff88',
      fontFamily: 'monospace',
      fontSize: '14px',
      minWidth: isCollapsed ? '220px' : '280px',
      maxWidth: isCollapsed ? '220px' : '320px',
      border: '1px solid rgba(0, 255, 136, 0.3)',
      backdropFilter: 'blur(10px)',
      zIndex: 1000,
      transition: 'all 0.3s ease-in-out'
    }}>
      {/* Titre */}
      <div style={{
        fontSize: '18px',
        fontWeight: 'bold',
        marginBottom: '15px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: '10px'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <span>🧬</span>
          <span>GÉNÉRATION {generation}</span>
        </div>

        {/* Bouton collapse/expand */}
        <button
          onClick={() => setIsCollapsed(!isCollapsed)}
          style={{
            padding: '6px 10px',
            backgroundColor: 'rgba(255, 255, 255, 0.1)',
            color: '#fff',
            border: '1px solid rgba(255, 255, 255, 0.3)',
            borderRadius: '6px',
            cursor: 'pointer',
            fontSize: '14px',
            fontFamily: 'monospace',
            fontWeight: 'bold',
            transition: 'all 0.2s'
          }}
          title={isCollapsed ? "Agrandir le panneau" : "Réduire le panneau"}
        >
          {isCollapsed ? '▼' : '▲'}
        </button>
      </div>

      {/* Contenu collapsible */}
      {!isCollapsed && (
      <>
      {/* Barre de progression */}
      <div style={{ marginBottom: '15px' }}>
        <div style={{
          width: '100%',
          height: '8px',
          backgroundColor: 'rgba(255, 255, 255, 0.1)',
          borderRadius: '4px',
          overflow: 'hidden'
        }}>
          <div style={{
            width: `${progress * 100}%`,
            height: '100%',
            backgroundColor: '#00ff88',
            transition: 'width 0.1s linear'
          }} />
        </div>
        <div style={{
          marginTop: '5px',
          fontSize: '12px',
          color: 'rgba(255, 255, 255, 0.6)'
        }}>
          Temps restant : {remainingTime}s
        </div>
      </div>

      {/* Stats */}
      <div style={{ marginBottom: '15px' }}>
        <div style={{ marginBottom: '8px' }}>
          📊 Fitness moyenne : <span style={{ color: '#fff' }}>{stats.avg.toFixed(1)}</span>
        </div>
        <div style={{ marginBottom: '8px' }}>
          🏆 Meilleure fitness : <span style={{ color: '#ffff00' }}>{stats.best.toFixed(1)}</span>
        </div>
        <div>
          📉 Pire fitness : <span style={{ color: '#ff6666' }}>{stats.worst.toFixed(1)}</span>
        </div>
      </div>

      {/* Comportement détecté */}
      <div style={{
        marginBottom: '15px',
        padding: '10px',
        backgroundColor: 'rgba(100, 200, 255, 0.15)',
        borderRadius: '8px',
        border: '1px solid rgba(100, 200, 255, 0.3)'
      }}>
        <div style={{ fontSize: '11px', color: 'rgba(255, 255, 255, 0.6)', marginBottom: '5px' }}>
          Comportement observé :
        </div>
        <div style={{ fontSize: '14px', fontWeight: 'bold', color: '#64c8ff' }}>
          {behavior}
        </div>
      </div>

      {/* Graphe d'évolution */}
      {fitnessHistory.length >= 2 && (
        <div style={{ marginBottom: '15px' }}>
          <div style={{ fontSize: '12px', marginBottom: '5px', color: 'rgba(255, 255, 255, 0.6)' }}>
            📈 Évolution
          </div>
          <div style={{
            backgroundColor: 'rgba(0, 0, 0, 0.3)',
            borderRadius: '6px',
            padding: '5px',
            border: '1px solid rgba(255, 255, 255, 0.1)'
          }}>
            {renderGraph()}
          </div>
          <div style={{ fontSize: '10px', marginTop: '3px', color: 'rgba(255, 255, 255, 0.5)' }}>
            <span style={{ color: '#00ff88' }}>━</span> Moyenne
            {' '}
            <span style={{ color: '#ffff00' }}>━</span> Meilleure
          </div>
        </div>
      )}

      {/* Contrôles */}
      <div style={{
        display: 'flex',
        gap: '10px',
        flexWrap: 'wrap'
      }}>
        <button
          onClick={handlePause}
          style={{
            padding: '8px 16px',
            backgroundColor: isPaused ? '#00ff88' : 'rgba(0, 255, 136, 0.2)',
            color: isPaused ? '#0a0a0a' : '#00ff88',
            border: '1px solid #00ff88',
            borderRadius: '6px',
            cursor: 'pointer',
            fontFamily: 'monospace',
            fontSize: '12px',
            fontWeight: 'bold',
            transition: 'all 0.2s'
          }}
        >
          {isPaused ? '▶️ Play' : '⏸️ Pause'}
        </button>

        <button
          onClick={onReset}
          style={{
            padding: '8px 16px',
            backgroundColor: 'rgba(255, 100, 100, 0.2)',
            color: '#ff6666',
            border: '1px solid #ff6666',
            borderRadius: '6px',
            cursor: 'pointer',
            fontFamily: 'monospace',
            fontSize: '12px',
            fontWeight: 'bold',
            transition: 'all 0.2s'
          }}
        >
          🔄 Reset
        </button>

        <button
          onClick={onSpeedUp}
          style={{
            padding: '8px 16px',
            backgroundColor: 'rgba(255, 255, 0, 0.2)',
            color: '#ffff00',
            border: '1px solid #ffff00',
            borderRadius: '6px',
            cursor: 'pointer',
            fontFamily: 'monospace',
            fontSize: '12px',
            fontWeight: 'bold',
            transition: 'all 0.2s'
          }}
        >
          ⚡ x2 Speed
        </button>

        <button
          onClick={onSave}
          style={{
            padding: '8px 16px',
            backgroundColor: 'rgba(0, 255, 136, 0.2)',
            color: '#00ff88',
            border: '1px solid #00ff88',
            borderRadius: '6px',
            cursor: 'pointer',
            fontFamily: 'monospace',
            fontSize: '12px',
            fontWeight: 'bold',
            transition: 'all 0.2s'
          }}
        >
          💾 Save
        </button>

        <button
          onClick={onDownload}
          style={{
            padding: '8px 16px',
            backgroundColor: 'rgba(100, 200, 255, 0.2)',
            color: '#64c8ff',
            border: '1px solid #64c8ff',
            borderRadius: '6px',
            cursor: 'pointer',
            fontFamily: 'monospace',
            fontSize: '12px',
            fontWeight: 'bold',
            transition: 'all 0.2s'
          }}
        >
          📥 Download
        </button>
      </div>

      {/* Contrôle du curseur IA */}
      <div style={{
        marginTop: '15px',
        padding: '12px',
        backgroundColor: cursorMode === 'auto'
          ? 'rgba(255, 100, 100, 0.15)'
          : 'rgba(100, 200, 255, 0.15)',
        borderRadius: '8px',
        border: `1px solid ${cursorMode === 'auto' ? 'rgba(255, 100, 100, 0.3)' : 'rgba(100, 200, 255, 0.3)'}`
      }}>
        <div style={{
          fontSize: '12px',
          marginBottom: '10px',
          color: 'rgba(255, 255, 255, 0.6)'
        }}>
          🎯 Contrôle du curseur
        </div>

        <button
          onClick={onCursorModeToggle}
          style={{
            padding: '10px 16px',
            backgroundColor: cursorMode === 'auto'
              ? 'rgba(255, 100, 100, 0.3)'
              : 'rgba(100, 200, 255, 0.3)',
            color: cursorMode === 'auto' ? '#ff6666' : '#64c8ff',
            border: `2px solid ${cursorMode === 'auto' ? '#ff6666' : '#64c8ff'}`,
            borderRadius: '6px',
            cursor: 'pointer',
            fontFamily: 'monospace',
            fontSize: '13px',
            fontWeight: 'bold',
            width: '100%',
            marginBottom: '10px',
            transition: 'all 0.2s'
          }}
        >
          {cursorMode === 'auto' ? '🤖 IA Activée' : '🖱️ Souris Active'}
        </button>

        {cursorMode === 'auto' && (
          <div>
            <div style={{
              fontSize: '11px',
              color: 'rgba(255, 255, 255, 0.5)',
              marginBottom: '6px'
            }}>
              Stratégie Prédateur:
            </div>
            <select
              value={predatorBehavior}
              onChange={(e) => onPredatorBehaviorChange(e.target.value)}
              style={{
                width: '100%',
                padding: '8px',
                backgroundColor: 'rgba(0, 0, 0, 0.5)',
                color: '#fff',
                border: '1px solid rgba(255, 100, 100, 0.5)',
                borderRadius: '6px',
                fontFamily: 'monospace',
                fontSize: '12px',
                cursor: 'pointer',
                outline: 'none'
              }}
            >
              <option value="center_attack">🎯 Attaque Centre</option>
              <option value="nearest_attack">⚡ Attaque Proche</option>
              <option value="isolator">🔍 Cible Isolé</option>
              <option value="disruptor">💥 Disrupteur</option>
              <option value="adaptive">🧠 Adaptatif</option>
              <option value="border_patrol">🚧 Gardien des Bords</option>
              <option value="patrol">🔄 Patrouille</option>
              <option value="random">🎲 Téléporteur</option>
            </select>
          </div>
        )}
      </div>

      {/* Info */}
      <div style={{
        marginTop: '15px',
        padding: '10px',
        backgroundColor: 'rgba(0, 255, 136, 0.1)',
        borderRadius: '6px',
        fontSize: '11px',
        color: 'rgba(255, 255, 255, 0.7)',
        lineHeight: '1.5'
      }}>
        💡 Les particules <strong>évoluent</strong> pour éviter votre curseur.
        Observez l'amélioration génération après génération !
      </div>
      </>
      )}
    </div>
  );
}

export default EvolutionUI;
