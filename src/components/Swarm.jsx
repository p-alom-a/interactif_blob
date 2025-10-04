import { useRef, useMemo, useEffect } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { useGameStore } from '../store/gameStore';

class Particle {
  constructor(x, y, z, size) {
    this.position = new THREE.Vector3(x, y, z);
    this.velocity = new THREE.Vector3(
      (Math.random() - 0.5) * 2,
      (Math.random() - 0.5) * 2,
      (Math.random() - 0.5) * 2
    );
    this.acceleration = new THREE.Vector3();
    this.size = size;
    this.maxSpeed = 0.5;
    this.maxForce = 0.05;
  }

  applyForce(force) {
    this.acceleration.add(force);
  }

  update() {
    this.velocity.add(this.acceleration);
    this.velocity.clampLength(0, this.maxSpeed);
    this.position.add(this.velocity);
    this.acceleration.multiplyScalar(0);
  }

  seek(target, multiplier = 1) {
    const desired = new THREE.Vector3().subVectors(target, this.position);
    desired.normalize();
    desired.multiplyScalar(this.maxSpeed * multiplier);

    const steer = new THREE.Vector3().subVectors(desired, this.velocity);
    steer.clampLength(0, this.maxForce);
    return steer;
  }

  flee(target, multiplier = 1) {
    const desired = new THREE.Vector3().subVectors(this.position, target);
    desired.normalize();
    desired.multiplyScalar(this.maxSpeed * multiplier);

    const steer = new THREE.Vector3().subVectors(desired, this.velocity);
    steer.clampLength(0, this.maxForce);
    return steer;
  }
}

export default function Swarm() {
  const meshRef = useRef();
  const particlesRef = useRef([]);
  const colorRef = useRef();

  const {
    getCurrentLevelData,
    handPosition,
    handOpen,
    handDetected,
    particleCount,
    updateParticles
  } = useGameStore();

  const levelData = getCurrentLevelData();

  // Initialize particles
  useEffect(() => {
    particlesRef.current = [];
    for (let i = 0; i < particleCount; i++) {
      const x = (Math.random() - 0.5) * 20;
      const y = (Math.random() - 0.5) * 20;
      const z = (Math.random() - 0.5) * 10;
      const size = THREE.MathUtils.lerp(
        levelData.sizeRange[0],
        levelData.sizeRange[1],
        Math.random()
      );
      particlesRef.current.push(new Particle(x, y, z, size));
    }
  }, [particleCount, levelData]);

  // Create instanced mesh
  const { geometry, material, count } = useMemo(() => {
    const geo = new THREE.SphereGeometry(1, 16, 16);
    const mat = new THREE.MeshStandardMaterial({
      color: levelData.colors.particle,
      emissive: levelData.colors.particle,
      emissiveIntensity: 0.5,
      transparent: true,
      opacity: 0.8
    });

    return {
      geometry: geo,
      material: mat,
      count: particleCount
    };
  }, [particleCount, levelData.colors.particle]);

  // Boids algorithm
  const applyBoids = (particle, particles) => {
    const { separation, alignment, cohesion } = levelData.boids;
    const perceptionRadius = levelData.perceptionRadius;

    let separationForce = new THREE.Vector3();
    let alignmentForce = new THREE.Vector3();
    let cohesionForce = new THREE.Vector3();
    let total = 0;

    particles.forEach(other => {
      const distance = particle.position.distanceTo(other.position);

      if (other !== particle && distance < perceptionRadius) {
        // Separation
        const diff = new THREE.Vector3().subVectors(particle.position, other.position);
        diff.divideScalar(distance || 1);
        separationForce.add(diff);

        // Alignment
        alignmentForce.add(other.velocity);

        // Cohesion
        cohesionForce.add(other.position);

        total++;
      }
    });

    if (total > 0) {
      // Separation
      separationForce.divideScalar(total);
      separationForce.normalize();
      separationForce.multiplyScalar(particle.maxSpeed);
      separationForce.sub(particle.velocity);
      separationForce.clampLength(0, particle.maxForce);
      separationForce.multiplyScalar(separation);

      // Alignment
      alignmentForce.divideScalar(total);
      alignmentForce.normalize();
      alignmentForce.multiplyScalar(particle.maxSpeed);
      alignmentForce.sub(particle.velocity);
      alignmentForce.clampLength(0, particle.maxForce);
      alignmentForce.multiplyScalar(alignment);

      // Cohesion
      cohesionForce.divideScalar(total);
      const cohesionSeek = particle.seek(cohesionForce);
      cohesionSeek.multiplyScalar(cohesion);

      particle.applyForce(separationForce);
      particle.applyForce(alignmentForce);
      particle.applyForce(cohesionSeek);
    }
  };

  // Hand interaction
  const applyHandEffect = (particle) => {
    if (!handDetected) return;

    const handPos = new THREE.Vector3(handPosition.x, handPosition.y, handPosition.z);
    const distance = particle.position.distanceTo(handPos);
    const effectRadius = 15;

    if (distance < effectRadius) {
      const { open, closed } = levelData.handEffect;
      const effect = handOpen ? open : closed;

      let force;
      switch (effect) {
        case 'attract_weak':
          force = particle.seek(handPos, 0.3);
          break;
        case 'attract_medium':
          force = particle.seek(handPos, 0.6);
          break;
        case 'attract_strong':
          force = particle.seek(handPos, 1.0);
          break;
        case 'repel_strong':
          force = particle.flee(handPos, 1.5);
          break;
        default:
          force = new THREE.Vector3();
      }

      particle.applyForce(force);
    }
  };

  // Update loop
  useFrame(() => {
    if (!meshRef.current || particlesRef.current.length === 0) return;

    const tempMatrix = new THREE.Matrix4();
    const tempColor = new THREE.Color();

    particlesRef.current.forEach((particle, i) => {
      // Apply boids
      applyBoids(particle, particlesRef.current);

      // Apply hand interaction
      applyHandEffect(particle);

      // Update particle
      particle.update();

      // Boundaries (wrap around)
      if (Math.abs(particle.position.x) > 25) particle.position.x *= -1;
      if (Math.abs(particle.position.y) > 20) particle.position.y *= -1;
      if (Math.abs(particle.position.z) > 15) particle.position.z *= -1;

      // Update instance matrix
      tempMatrix.setPosition(particle.position);
      tempMatrix.scale(new THREE.Vector3(particle.size, particle.size, particle.size));
      meshRef.current.setMatrixAt(i, tempMatrix);

      // Update color based on distance to hand (optional visual feedback)
      if (handDetected) {
        const handPos = new THREE.Vector3(handPosition.x, handPosition.y, handPosition.z);
        const distance = particle.position.distanceTo(handPos);
        const proximity = Math.max(0, 1 - distance / 15);
        tempColor.setHex(0x4a90e2).lerp(new THREE.Color(0xff6b6b), proximity);
        meshRef.current.setColorAt(i, tempColor);
      }
    });

    meshRef.current.instanceMatrix.needsUpdate = true;
    if (meshRef.current.instanceColor) {
      meshRef.current.instanceColor.needsUpdate = true;
    }

    updateParticles(particlesRef.current);
  });

  return (
    <instancedMesh
      ref={meshRef}
      args={[geometry, material, count]}
      frustumCulled={false}
    >
      <sphereGeometry args={[1, 16, 16]} />
      <meshStandardMaterial
        color={levelData.colors.particle}
        emissive={levelData.colors.particle}
        emissiveIntensity={0.5}
        transparent
        opacity={0.8}
      />
    </instancedMesh>
  );
}
