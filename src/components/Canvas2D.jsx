import { useEffect, useRef, useState } from 'react';
import { Population } from '../evolution/Population';
import { Vector2, interpolateColor } from '../utils/mathHelpers';
import EvolutionUI from './EvolutionUI';

const PARTICLE_BASE_SIZE = 8;
const LINK_DISTANCE = 60;

function Canvas2D() {
  const canvasRef = useRef(null);
  const populationRef = useRef(null);
  const cursorRef = useRef(new Vector2(window.innerWidth / 2, window.innerHeight / 2));
  const animationIdRef = useRef(null);
  const lastTimeRef = useRef(performance.now());
  const [, forceUpdate] = useState(0);
  const [cursorMode, setCursorMode] = useState('auto');
  const [aiCursorBehavior, setAiCursorBehavior] = useState('hunter');

  useEffect(() => {
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');

    // Dimensionner le canvas
    const resizeCanvas = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };
    resizeCanvas();
    window.addEventListener('resize', resizeCanvas);

    // Configuration du contexte pour un rendu lisse
    ctx.imageSmoothingEnabled = true;
    ctx.imageSmoothingQuality = 'high';

    // Initialisation de la population évolutionnaire
    const population = new Population();
    populationRef.current = population;

    // Gestion du curseur
    const handleMouseMove = (event) => {
      cursorRef.current.x = event.clientX;
      cursorRef.current.y = event.clientY;
    };
    canvas.addEventListener('mousemove', handleMouseMove);

    // Boucle d'animation
    const animate = (currentTime) => {
      animationIdRef.current = requestAnimationFrame(animate);

      const width = canvas.width;
      const height = canvas.height;
      const cursor = cursorRef.current;

      // Calculer delta time
      let deltaTime = (currentTime - lastTimeRef.current) / 1000; // en secondes
      lastTimeRef.current = currentTime;

      // Limiter deltaTime pour éviter les sauts (ex: changement d'onglet)
      deltaTime = Math.min(deltaTime, 0.1); // Max 100ms par frame

      // Mettre à jour la population (gère évolution automatiquement)
      population.update(cursor, width, height, deltaTime);

      // Background avec fade pour effet de trail
      ctx.fillStyle = 'rgba(10, 10, 20, 0.25)';
      ctx.fillRect(0, 0, width, height);

      // Dessiner les liens entre particules proches
      drawLinks(ctx, population.boids);

      // Dessiner chaque boid
      population.boids.forEach((boid) => {
        drawBoid(ctx, boid, cursor);
      });

      // Dessiner le curseur artificiel si mode auto
      if (cursorMode === 'auto' && populationRef.current) {
        const aiPos = populationRef.current.getCursorPosition();
        if (aiPos) {
          drawAICursor(ctx, aiPos.x, aiPos.y, aiCursorBehavior);
        }
      }
    };

    animate(performance.now());

    // Cleanup
    return () => {
      window.removeEventListener('resize', resizeCanvas);
      canvas.removeEventListener('mousemove', handleMouseMove);
      if (animationIdRef.current) {
        cancelAnimationFrame(animationIdRef.current);
      }
      if (population) {
        population.dispose();
      }
    };
  }, []);

  // Handlers pour l'UI
  const handleReset = () => {
    if (populationRef.current) {
      populationRef.current.reset();
      forceUpdate(n => n + 1);
    }
  };

  const handleTogglePause = () => {
    if (populationRef.current) {
      populationRef.current.toggleEvolution();
      forceUpdate(n => n + 1);
    }
  };

  const handleSpeedUp = () => {
    if (populationRef.current) {
      const currentDuration = populationRef.current.generationDuration;
      const newDuration = currentDuration === 20 ? 10 : 20;
      populationRef.current.setGenerationDuration(newDuration);
      forceUpdate(n => n + 1);
    }
  };

  const handleSave = async () => {
    if (populationRef.current) {
      await populationRef.current.saveChampion();
      alert('Champion sauvegardé dans le navigateur !');
    }
  };

  const handleDownload = async () => {
    if (populationRef.current) {
      await populationRef.current.downloadChampion();
    }
  };

  const handleCursorModeToggle = () => {
    const newMode = cursorMode === 'auto' ? 'manual' : 'auto';
    console.log('🔄 Toggle curseur:', cursorMode, '→', newMode);
    setCursorMode(newMode);
    if (populationRef.current) {
      populationRef.current.setCursorMode(newMode);
    }
  };

  const handleAICursorBehaviorChange = (behavior) => {
    console.log('🔄 Changement comportement IA:', aiCursorBehavior, '→', behavior);
    setAiCursorBehavior(behavior);
    if (populationRef.current) {
      populationRef.current.setAICursorBehavior(behavior);
    }
  };

  function drawAICursor(ctx, x, y, mode) {
    ctx.save();

    // Couleur selon le mode
    const colors = {
      hunter: [255, 100, 100],   // Rouge
      predator: [255, 50, 255],  // Magenta
      patrol: [100, 200, 255],   // Bleu
      random: [255, 255, 100]    // Jaune
    };
    const color = colors[mode] || [255, 100, 100];

    // Cercle pulsant
    const time = Date.now() * 0.005;
    const pulseRadius = 25 + Math.sin(time) * 8;

    ctx.strokeStyle = `rgba(${color[0]}, ${color[1]}, ${color[2]}, 0.8)`;
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.arc(x, y, pulseRadius, 0, Math.PI * 2);
    ctx.stroke();

    // Cercle intérieur
    ctx.strokeStyle = `rgba(${color[0]}, ${color[1]}, ${color[2]}, 1)`;
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(x, y, 12, 0, Math.PI * 2);
    ctx.stroke();

    // Croix centrale
    ctx.beginPath();
    ctx.moveTo(x - 8, y);
    ctx.lineTo(x + 8, y);
    ctx.moveTo(x, y - 8);
    ctx.lineTo(x, y + 8);
    ctx.stroke();

    // Label "IA"
    ctx.fillStyle = `rgba(${color[0]}, ${color[1]}, ${color[2]}, 1)`;
    ctx.font = 'bold 14px monospace';
    ctx.fillText('IA', x + 30, y + 5);

    ctx.restore();
  }

  return (
    <>
      <canvas
        ref={canvasRef}
        style={{
          display: 'block',
          width: '100vw',
          height: '100vh',
          background: 'rgb(10, 10, 20)',
        }}
      />
      <EvolutionUI
        population={populationRef.current}
        onReset={handleReset}
        onTogglePause={handleTogglePause}
        onSpeedUp={handleSpeedUp}
        onSave={handleSave}
        onDownload={handleDownload}
        cursorMode={cursorMode}
        onCursorModeToggle={handleCursorModeToggle}
        aiCursorBehavior={aiCursorBehavior}
        onAICursorBehaviorChange={handleAICursorBehaviorChange}
      />
    </>
  );
}

function drawLinks(ctx, boids) {
  for (let i = 0; i < boids.length; i++) {
    for (let j = i + 1; j < boids.length; j++) {
      const dist = Vector2.dist(boids[i].position, boids[j].position);
      if (dist < LINK_DISTANCE) {
        // Opacité basée sur la distance (plus proche = plus visible)
        const opacity = (1 - dist / LINK_DISTANCE) * 0.15;

        // Calculer couleur moyenne
        const avgSpeed = (boids[i].velocity.mag() + boids[j].velocity.mag()) / 2;
        const colorIntensity = Math.min(100 + avgSpeed * 10, 200);

        ctx.strokeStyle = `rgba(${colorIntensity}, ${colorIntensity + 50}, 255, ${opacity})`;
        ctx.lineWidth = 0.8;

        // Effet de glow subtil
        ctx.shadowBlur = 3;
        ctx.shadowColor = `rgba(100, 200, 255, ${opacity * 0.5})`;

        ctx.beginPath();
        ctx.moveTo(boids[i].position.x, boids[i].position.y);
        ctx.lineTo(boids[j].position.x, boids[j].position.y);
        ctx.stroke();

        // Reset shadow
        ctx.shadowBlur = 0;
      }
    }
  }
}

function drawBoid(ctx, boid, cursor) {
  const { position, velocity } = boid;

  // Calculer la couleur selon distance au curseur
  const distToCursor = Vector2.dist(position, cursor);
  const normalizedDist = Math.min(distToCursor / 300, 1);
  const color = interpolateColor(
    [255, 100, 100], // Rouge (proche du curseur)
    [100, 255, 150], // Vert (loin du curseur)
    normalizedDist
  );

  // Calculer la déformation selon la vitesse
  const speed = velocity.mag();
  const stretchFactor = 1 + (speed / 8); // Plus rapide = plus étiré
  const angle = Math.atan2(velocity.y, velocity.x);

  ctx.save();
  ctx.translate(position.x, position.y);
  ctx.rotate(angle);

  // Effet de glow externe
  ctx.shadowBlur = 15 + speed * 2;
  ctx.shadowColor = `rgba(${color[0]}, ${color[1]}, ${color[2]}, 0.6)`;

  // Dessiner une forme blobby organique (ellipse étirée)
  ctx.beginPath();

  // Créer un blob avec plusieurs points ondulants
  const numPoints = 10;
  const baseRadius = PARTICLE_BASE_SIZE;
  const time = Date.now() * 0.002;

  for (let i = 0; i <= numPoints; i++) {
    const theta = (i / numPoints) * Math.PI * 2;

    // Rayon avec variation sinusoïdale pour effet organique
    const noise1 = Math.sin(theta * 3 + time + boid.fitness * 0.01) * 0.25;
    const noise2 = Math.cos(theta * 2 - time * 0.8) * 0.15;
    const totalNoise = noise1 + noise2;

    const radiusX = baseRadius * stretchFactor * (1 + totalNoise);
    const radiusY = baseRadius * (1 + totalNoise * 0.5);

    const x = Math.cos(theta) * radiusX;
    const y = Math.sin(theta) * radiusY;

    if (i === 0) {
      ctx.moveTo(x, y);
    } else {
      // Utiliser quadraticCurveTo pour des courbes plus douces
      const prevTheta = ((i - 1) / numPoints) * Math.PI * 2;
      const cpX = Math.cos(prevTheta + Math.PI / numPoints) * radiusX * 0.95;
      const cpY = Math.sin(prevTheta + Math.PI / numPoints) * radiusY * 0.95;
      ctx.quadraticCurveTo(cpX, cpY, x, y);
    }
  }

  ctx.closePath();

  // Dégradé radial pour effet de volume
  const gradient = ctx.createRadialGradient(0, 0, 0, 0, 0, baseRadius * 2.5);
  gradient.addColorStop(0, `rgba(${color[0]}, ${color[1]}, ${color[2]}, 0.9)`);
  gradient.addColorStop(0.5, `rgba(${color[0]}, ${color[1]}, ${color[2]}, 0.6)`);
  gradient.addColorStop(0.8, `rgba(${color[0]}, ${color[1]}, ${color[2]}, 0.3)`);
  gradient.addColorStop(1, `rgba(${color[0]}, ${color[1]}, ${color[2]}, 0)`);

  ctx.fillStyle = gradient;
  ctx.fill();

  // Contour lumineux
  ctx.shadowBlur = 8;
  ctx.strokeStyle = `rgba(${Math.min(color[0] + 80, 255)}, ${Math.min(color[1] + 80, 255)}, ${Math.min(color[2] + 80, 255)}, 0.8)`;
  ctx.lineWidth = 1.5;
  ctx.stroke();

  // Ajouter un petit point central brillant si vitesse élevée
  if (speed > 4) {
    ctx.shadowBlur = 10;
    ctx.fillStyle = `rgba(255, 255, 255, ${speed / 10})`;
    ctx.beginPath();
    ctx.arc(0, 0, 2, 0, Math.PI * 2);
    ctx.fill();
  }

  ctx.restore();
}

export default Canvas2D;
