import { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import { NeuralBoid } from '../evolution/NeuralBoid';
import { Vector2, rgbToHex, interpolateColor } from '../utils/mathHelpers';

const POPULATION_SIZE = 100;
const PARTICLE_SIZE = 8;

function Scene3D() {
  const mountRef = useRef(null);
  const sceneRef = useRef(null);
  const rendererRef = useRef(null);
  const cameraRef = useRef(null);
  const boidsRef = useRef([]);
  const cursorRef = useRef(new Vector2(0, 0));
  const animationIdRef = useRef(null);

  useEffect(() => {
    if (!mountRef.current) return;

    const width = window.innerWidth;
    const height = window.innerHeight;

    // Créer la scène Three.js
    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x0a0a0a);
    sceneRef.current = scene;

    // Créer la caméra orthographique pour une vue 2D
    const camera = new THREE.OrthographicCamera(
      -width / 2, width / 2, height / 2, -height / 2, 0.1, 1000
    );
    camera.position.z = 10;
    cameraRef.current = camera;

    // Créer le renderer
    const renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setSize(width, height);
    renderer.setPixelRatio(window.devicePixelRatio);
    mountRef.current.appendChild(renderer.domElement);
    rendererRef.current = renderer;

    // Initialiser la population de boids
    const boids = [];
    for (let i = 0; i < POPULATION_SIZE; i++) {
      const x = (Math.random() - 0.5) * width;
      const y = (Math.random() - 0.5) * height;
      const boid = new NeuralBoid(x, y);

      // Créer le mesh pour ce boid
      const geometry = new THREE.CircleGeometry(PARTICLE_SIZE, 16);
      const material = new THREE.MeshBasicMaterial({
        color: 0x00ff88,
        transparent: true,
        opacity: 0.8
      });
      const mesh = new THREE.Mesh(geometry, material);
      mesh.position.set(x, y, 0);
      scene.add(mesh);

      boid.mesh = mesh;
      boids.push(boid);
    }
    boidsRef.current = boids;

    // Position initiale du curseur au centre
    cursorRef.current = new Vector2(0, 0);

    // Gestion du mouvement de la souris
    const handleMouseMove = (event) => {
      // Convertir les coordonnées de la souris pour correspondre au système Three.js centré
      const width = window.innerWidth;
      const height = window.innerHeight;
      cursorRef.current.x = event.clientX - width / 2;
      cursorRef.current.y = height / 2 - event.clientY; // Inverser Y et centrer
    };
    window.addEventListener('mousemove', handleMouseMove);

    // Gestion du redimensionnement
    const handleResize = () => {
      const newWidth = window.innerWidth;
      const newHeight = window.innerHeight;

      camera.left = -newWidth / 2;
      camera.right = newWidth / 2;
      camera.top = newHeight / 2;
      camera.bottom = -newHeight / 2;
      camera.updateProjectionMatrix();

      renderer.setSize(newWidth, newHeight);
    };
    window.addEventListener('resize', handleResize);

    // Boucle d'animation
    const animate = () => {
      animationIdRef.current = requestAnimationFrame(animate);

      const width = window.innerWidth;
      const height = window.innerHeight;
      const cursor = cursorRef.current;

      // Mettre à jour chaque boid
      boids.forEach((boid) => {
        // 1. Percevoir
        const inputs = boid.perceive(cursor, boids, width, height);

        // 2. Penser
        const decision = boid.think(inputs);

        // 3. Agir
        boid.applyForce(decision);

        // 4. Mettre à jour
        boid.update(width, height);

        // 5. Mettre à jour la couleur selon la distance au curseur
        const distToCursor = Vector2.dist(boid.position, cursor);
        const normalizedDist = Math.min(distToCursor / 300, 1);
        const color = interpolateColor(
          [255, 100, 100], // Rouge (proche)
          [100, 255, 150], // Vert (loin)
          normalizedDist
        );
        boid.mesh.material.color.setStyle(rgbToHex(...color));
      });

      renderer.render(scene, camera);
    };

    animate();

    // Nettoyage
    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('resize', handleResize);

      if (animationIdRef.current) {
        cancelAnimationFrame(animationIdRef.current);
      }

      boids.forEach(boid => boid.dispose());

      if (mountRef.current && renderer.domElement) {
        mountRef.current.removeChild(renderer.domElement);
      }
      renderer.dispose();
    };
  }, []);

  return (
    <div
      ref={mountRef}
      style={{
        width: '100vw',
        height: '100vh',
        overflow: 'hidden',
        position: 'fixed',
        top: 0,
        left: 0
      }}
    />
  );
}

export default Scene3D;
