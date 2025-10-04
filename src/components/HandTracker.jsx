import { useHandTracking } from '../hooks/useHandTracking';
import { useGameStore } from '../store/gameStore';

export default function HandTracker() {
  const { videoRef, isReady, error } = useHandTracking();
  const { handDetected, handOpen } = useGameStore();

  return (
    <>
      {/* Hidden video element for MediaPipe */}
      <video
        ref={videoRef}
        autoPlay
        playsInline
        muted
        style={{
          position: 'fixed',
          top: 0,
          left: 0,
          width: '1px',
          height: '1px',
          opacity: 0,
          pointerEvents: 'none'
        }}
      />

      {/* UI Feedback */}
      <div
        style={{
          position: 'fixed',
          bottom: '20px',
          left: '20px',
          color: 'white',
          fontFamily: 'monospace',
          fontSize: '14px',
          backgroundColor: 'rgba(0, 0, 0, 0.5)',
          padding: '10px',
          borderRadius: '5px',
          zIndex: 1000
        }}
      >
        {error && <div style={{ color: 'red' }}>Error: {error}</div>}
        {!isReady && !error && <div>Loading hand tracking...</div>}
        {isReady && (
          <>
            <div>Hand: {handDetected ? '✓' : '✗'}</div>
            <div>State: {handOpen ? 'Open' : 'Closed'}</div>
          </>
        )}
      </div>
    </>
  );
}
