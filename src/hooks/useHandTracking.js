import { useEffect, useRef, useState } from 'react';
import { FilesetResolver, HandLandmarker } from '@mediapipe/tasks-vision';
import { useGameStore } from '../store/gameStore';
import { GAME_CONFIG } from '../config/levels';

export function useHandTracking() {
  const videoRef = useRef(null);
  const handLandmarkerRef = useRef(null);
  const animationRef = useRef(null);
  const [isReady, setIsReady] = useState(false);
  const [error, setError] = useState(null);

  const { setHandPosition, setHandOpen, setHandDetected } = useGameStore();

  // Smoothed position
  const smoothedPosition = useRef({ x: 0, y: 0, z: 0 });

  useEffect(() => {
    let stream = null;

    const initializeHandTracking = async () => {
      try {
        // Initialize MediaPipe
        const vision = await FilesetResolver.forVisionTasks(
          'https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@latest/wasm'
        );

        const handLandmarker = await HandLandmarker.createFromOptions(vision, {
          baseOptions: {
            modelAssetPath: 'https://storage.googleapis.com/mediapipe-models/hand_landmarker/hand_landmarker/float16/latest/hand_landmarker.task',
            delegate: 'GPU'
          },
          runningMode: 'VIDEO',
          numHands: 1,
          minHandDetectionConfidence: 0.5,
          minHandPresenceConfidence: 0.5,
          minTrackingConfidence: 0.5
        });

        handLandmarkerRef.current = handLandmarker;

        // Setup webcam
        stream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: 'user' }
        });

        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          videoRef.current.addEventListener('loadeddata', () => {
            setIsReady(true);
            detectHands();
          });
        }
      } catch (err) {
        console.error('Error initializing hand tracking:', err);
        setError(err.message);
      }
    };

    const detectHands = async () => {
      if (!videoRef.current || !handLandmarkerRef.current) return;

      const video = videoRef.current;
      const handLandmarker = handLandmarkerRef.current;

      const detect = async () => {
        if (video.readyState === video.HAVE_ENOUGH_DATA) {
          const results = await handLandmarker.detectForVideo(video, Date.now());

          if (results.landmarks && results.landmarks.length > 0) {
            const landmarks = results.landmarks[0];

            // Get palm position (landmark 0 = wrist, 9 = middle finger base)
            const wrist = landmarks[0];
            const middleFinger = landmarks[9];

            // Normalize coordinates to Three.js space (-1 to 1, then scale)
            const x = (wrist.x - 0.5) * 40; // Scale to fit scene
            const y = -(wrist.y - 0.5) * 30;
            const z = -wrist.z * 20;

            // Smooth position
            smoothedPosition.current.x +=
              (x - smoothedPosition.current.x) * GAME_CONFIG.handSmoothingFactor;
            smoothedPosition.current.y +=
              (y - smoothedPosition.current.y) * GAME_CONFIG.handSmoothingFactor;
            smoothedPosition.current.z +=
              (z - smoothedPosition.current.z) * GAME_CONFIG.handSmoothingFactor;

            setHandPosition(smoothedPosition.current);

            // Detect open/closed hand (distance between thumb tip and index finger tip)
            const thumbTip = landmarks[4];
            const indexTip = landmarks[8];
            const distance = Math.sqrt(
              Math.pow(thumbTip.x - indexTip.x, 2) +
              Math.pow(thumbTip.y - indexTip.y, 2) +
              Math.pow(thumbTip.z - indexTip.z, 2)
            );

            setHandOpen(distance > GAME_CONFIG.handOpenThreshold);
            setHandDetected(true);
          } else {
            setHandDetected(false);
          }
        }

        animationRef.current = requestAnimationFrame(detect);
      };

      detect();
    };

    initializeHandTracking();

    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
      if (stream) {
        stream.getTracks().forEach(track => track.stop());
      }
    };
  }, [setHandPosition, setHandOpen, setHandDetected]);

  return { videoRef, isReady, error };
}
