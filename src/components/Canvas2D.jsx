import { useEffect, useRef } from 'react';
import { NeuralBoid } from '../evolution/NeuralBoid';
import { Vector2, interpolateColor } from '../utils/mathHelpers';

const POPULATION_SIZE = 100;
const PARTICLE_BASE_SIZE = 8;
const LINK_DISTANCE = 60;

function Canvas2D() {
  const canvasRef = useRef(null);
  const boidsRef = useRef([]);
  const cursorRef = useRef(new Vector2(window.innerWidth / 2, window.innerHeight / 2));
  const animationIdRef = useRef(null);

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

    // Initialisation des boids
    const boids = [];
    for (let i = 0; i < POPULATION_SIZE; i++) {
      const x = Math.random() * canvas.width;
      const y = Math.random() * canvas.height;
      const boid = new NeuralBoid(x, y);
      boids.push(boid);
    }
    boidsRef.current = boids;

    // Gestion du curseur
    const handleMouseMove = (event) => {
      cursorRef.current.x = event.clientX;
      cursorRef.current.y = event.clientY;
    };
    canvas.addEventListener('mousemove', handleMouseMove);

    // Boucle d'animation
    const animate = () => {
      animationIdRef.current = requestAnimationFrame(animate);

      const width = canvas.width;
      const height = canvas.height;
      const cursor = cursorRef.current;

      // Background avec fade pour effet de trail
      ctx.fillStyle = 'rgba(10, 10, 20, 0.25)';
      ctx.fillRect(0, 0, width, height);

      // Dessiner les liens entre particules proches
      drawLinks(ctx, boids);

      // Mettre à jour et dessiner chaque boid
      boids.forEach((boid) => {
        // 1. Percevoir
        const inputs = boid.perceive(cursor, boids, width, height);

        // 2. Penser
        const decision = boid.think(inputs);

        // 3. Agir
        boid.applyForce(decision);

        // 4. Mettre à jour position
        boid.update(width, height);

        // 5. Dessiner
        drawBoid(ctx, boid, cursor);
      });
    };

    animate();

    // Cleanup
    return () => {
      window.removeEventListener('resize', resizeCanvas);
      canvas.removeEventListener('mousemove', handleMouseMove);
      if (animationIdRef.current) {
        cancelAnimationFrame(animationIdRef.current);
      }
      boids.forEach(boid => boid.dispose());
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      style={{
        display: 'block',
        width: '100vw',
        height: '100vh',
        background: 'rgb(10, 10, 20)',
      }}
    />
  );
}

function drawLinks(ctx, boids) {
  ctx.strokeStyle = 'rgba(100, 200, 255, 0.1)';
  ctx.lineWidth = 0.5;

  for (let i = 0; i < boids.length; i++) {
    for (let j = i + 1; j < boids.length; j++) {
      const dist = Vector2.dist(boids[i].position, boids[j].position);
      if (dist < LINK_DISTANCE) {
        ctx.beginPath();
        ctx.moveTo(boids[i].position.x, boids[i].position.y);
        ctx.lineTo(boids[j].position.x, boids[j].position.y);
        ctx.stroke();
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
  const stretchFactor = 1 + (speed / 10); // Plus rapide = plus étiré
  const angle = Math.atan2(velocity.y, velocity.x);

  ctx.save();
  ctx.translate(position.x, position.y);
  ctx.rotate(angle);

  // Dessiner une forme blobby organique (ellipse étirée)
  ctx.beginPath();

  // Créer un blob avec plusieurs points ondulants
  const numPoints = 8;
  const baseRadius = PARTICLE_BASE_SIZE;

  for (let i = 0; i <= numPoints; i++) {
    const theta = (i / numPoints) * Math.PI * 2;

    // Rayon avec variation sinusoïdale pour effet organique
    const noise = Math.sin(theta * 3 + Date.now() * 0.001) * 0.3;
    const radiusX = baseRadius * stretchFactor * (1 + noise);
    const radiusY = baseRadius * (1 + noise);

    const x = Math.cos(theta) * radiusX;
    const y = Math.sin(theta) * radiusY;

    if (i === 0) {
      ctx.moveTo(x, y);
    } else {
      ctx.lineTo(x, y);
    }
  }

  ctx.closePath();

  // Dégradé radial pour effet de volume
  const gradient = ctx.createRadialGradient(0, 0, 0, 0, 0, baseRadius * 2);
  gradient.addColorStop(0, `rgba(${color[0]}, ${color[1]}, ${color[2]}, 0.8)`);
  gradient.addColorStop(0.7, `rgba(${color[0]}, ${color[1]}, ${color[2]}, 0.4)`);
  gradient.addColorStop(1, `rgba(${color[0]}, ${color[1]}, ${color[2]}, 0)`);

  ctx.fillStyle = gradient;
  ctx.fill();

  // Contour subtil
  ctx.strokeStyle = `rgba(${color[0] + 50}, ${color[1] + 50}, ${color[2] + 50}, 0.6)`;
  ctx.lineWidth = 1;
  ctx.stroke();

  ctx.restore();
}

export default Canvas2D;
