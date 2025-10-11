import { useState, useEffect, useRef } from 'react';

function EvolutionUI({ population, onReset, onTogglePause, onDownload, onLoadFiles, cursorMode, onCursorModeToggle, predatorBehavior, onPredatorBehaviorChange }) {
  const fileInputRef = useRef(null);
  const [stats, setStats] = useState({ avg: 0, best: 0, worst: 0, median: 0 });
  const [generation, setGeneration] = useState(1);
  const [progress, setProgress] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const [remainingTime, setRemainingTime] = useState(20);
  const [fitnessHistory, setFitnessHistory] = useState([]);
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
      }
    }, 100);

    return () => clearInterval(interval);
  }, [population]);

  const handlePause = () => {
    setIsPaused(!isPaused);
    if (onTogglePause) onTogglePause();
  };

  const handleFileUpload = (event) => {
    const files = Array.from(event.target.files);
    if (files.length < 2) {
      alert('⚠️ Veuillez sélectionner au moins 2 fichiers : model.json + weights.bin\n(optionnel: metadata.json)');
      return;
    }

    // Identifier les fichiers (2 obligatoires + 1 optionnel)
    const modelJsonFile = files.find(f => f.name.endsWith('.json') && !f.name.includes('metadata'));
    const binFile = files.find(f => f.name.endsWith('.bin'));
    const metadataFile = files.find(f => f.name.includes('metadata') && f.name.endsWith('.json'));

    if (!modelJsonFile || !binFile) {
      alert('⚠️ Fichiers incorrects. Attendus : model.json + weights.bin\n(optionnel: champion-metadata.json)');
      return;
    }

    if (onLoadFiles) {
      onLoadFiles(modelJsonFile, binFile, metadataFile || null);
    }

    // Reset input
    event.target.value = '';
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
      backgroundColor: 'rgba(15, 20, 25, 0.5)',
      padding: '24px',
      borderRadius: '8px',
      color: '#50b496',
      fontFamily: 'monospace',
      fontSize: '14px',
      width: isCollapsed ? '240px' : '340px',
      border: '1px solid rgba(80, 180, 150, 0.4)',
      boxShadow: '0 0 20px rgba(80, 180, 150, 0.15)',
      transition: 'all 0.3s ease-in-out',
      flexShrink: 0,
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
            backgroundColor: '#50b496',
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
            padding: '10px 18px',
            backgroundColor: isPaused ? '#50b496' : 'rgba(80, 180, 150, 0.2)',
            color: isPaused ? '#0a0a0a' : '#50b496',
            border: '1px solid #50b496',
            borderRadius: '6px',
            cursor: 'pointer',
            fontFamily: 'monospace',
            fontSize: '13px',
            fontWeight: 'bold',
            transition: 'all 0.2s'
          }}
        >
          {isPaused ? '▶ Play' : '⏸ Pause'}
        </button>

        <button
          onClick={onReset}
          style={{
            padding: '10px 18px',
            backgroundColor: 'rgba(180, 100, 80, 0.2)',
            color: '#b46450',
            border: '1px solid #b46450',
            borderRadius: '6px',
            cursor: 'pointer',
            fontFamily: 'monospace',
            fontSize: '13px',
            fontWeight: 'bold',
            transition: 'all 0.2s'
          }}
        >
          Reset
        </button>

        <button
          onClick={onDownload}
          style={{
            padding: '10px 18px',
            backgroundColor: 'rgba(80, 180, 150, 0.2)',
            color: '#50b496',
            border: '1px solid #50b496',
            borderRadius: '6px',
            cursor: 'pointer',
            fontFamily: 'monospace',
            fontSize: '13px',
            fontWeight: 'bold',
            transition: 'all 0.2s'
          }}
        >
          Download
        </button>

        <button
          onClick={() => fileInputRef.current?.click()}
          style={{
            padding: '10px 18px',
            backgroundColor: 'rgba(80, 180, 150, 0.2)',
            color: '#50b496',
            border: '1px solid #50b496',
            borderRadius: '6px',
            cursor: 'pointer',
            fontFamily: 'monospace',
            fontSize: '13px',
            fontWeight: 'bold',
            transition: 'all 0.2s'
          }}
        >
          Load
        </button>

        {/* Input file caché */}
        <input
          ref={fileInputRef}
          type="file"
          multiple
          accept=".json,.bin"
          onChange={handleFileUpload}
          style={{ display: 'none' }}
        />
      </div>

      {/* Contrôle du curseur IA (seulement si prédateur existe) */}
      {population?.predator && (
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
      )}

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
        {population?.predator ? (
          <>💡 Les particules <strong>évoluent</strong> pour éviter votre curseur. Observez l'amélioration génération après génération !</>
        ) : (
          <>🦅 Les particules <strong>apprennent</strong> les règles de Reynolds (séparation, cohésion, alignement) par évolution génétique.</>
        )}
      </div>
      </>
      )}
    </div>
  );
}

export default EvolutionUI;
