import { Canvas } from '@react-three/fiber';
import { OrbitControls, PerspectiveCamera } from '@react-three/drei';
import { EffectComposer, Bloom } from '@react-three/postprocessing';

export default function Scene({ children }) {
  return (
    <Canvas
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        width: '100vw',
        height: '100vh',
        background: 'linear-gradient(135deg, #0f0c29, #302b63, #24243e)'
      }}
      dpr={[1, 2]}
    >
      {/* Camera */}
      <PerspectiveCamera
        makeDefault
        position={[0, 0, 30]}
        fov={75}
      />

      {/* Lights */}
      <ambientLight intensity={0.5} />
      <pointLight position={[10, 10, 10]} intensity={1} />
      <pointLight position={[-10, -10, -10]} intensity={0.5} color="#4a90e2" />

      {/* Children (Swarm, etc.) */}
      {children}

      {/* Post-processing */}
      <EffectComposer>
        <Bloom
          intensity={0.8}
          luminanceThreshold={0.2}
          luminanceSmoothing={0.9}
        />
      </EffectComposer>

      {/* Controls (optional, for debugging) */}
      {/* <OrbitControls /> */}
    </Canvas>
  );
}
