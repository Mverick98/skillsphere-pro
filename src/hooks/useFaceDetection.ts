import { useEffect, useRef, useCallback, useState } from 'react';
import { api } from '@/services/api';

interface FaceDetectionOptions {
  assessmentId: string;
  enabled: boolean;
  videoRef: React.RefObject<HTMLVideoElement>;
  onMultipleFaces?: (count: number) => void;
  onNoFace?: () => void;
  detectionIntervalMs?: number;
}

interface FaceDetectionState {
  isSupported: boolean;
  faceCount: number;
  lastDetectionTime: number;
  multipleFaceEvents: number;
  noFaceEvents: number;
}

// Extend Window interface for FaceDetector API
declare global {
  interface Window {
    FaceDetector?: new (options?: { fastMode?: boolean; maxDetectedFaces?: number }) => {
      detect: (image: ImageBitmapSource) => Promise<Array<{
        boundingBox: DOMRectReadOnly;
        landmarks?: Array<{ type: string; locations: Array<{ x: number; y: number }> }>;
      }>>;
    };
  }
}

export const useFaceDetection = ({
  assessmentId,
  enabled,
  videoRef,
  onMultipleFaces,
  onNoFace,
  detectionIntervalMs = 2000, // Check every 2 seconds
}: FaceDetectionOptions) => {
  const [state, setState] = useState<FaceDetectionState>({
    isSupported: false,
    faceCount: 1,
    lastDetectionTime: 0,
    multipleFaceEvents: 0,
    noFaceEvents: 0,
  });

  const detectorRef = useRef<InstanceType<NonNullable<typeof window.FaceDetector>> | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const intervalRef = useRef<number | null>(null);
  const lastEventTimeRef = useRef<{ multiple: number; noFace: number }>({ multiple: 0, noFace: 0 });

  // Initialize face detector
  useEffect(() => {
    if (!enabled) return;

    // Check if FaceDetector API is available (Chrome/Edge)
    if ('FaceDetector' in window && window.FaceDetector) {
      try {
        detectorRef.current = new window.FaceDetector({
          fastMode: true,
          maxDetectedFaces: 5,
        });
        setState(prev => ({ ...prev, isSupported: true }));
        console.log('[FaceDetection] Browser FaceDetector API available');
      } catch (error) {
        console.warn('[FaceDetection] FaceDetector initialization failed:', error);
        setState(prev => ({ ...prev, isSupported: false }));
      }
    } else {
      console.warn('[FaceDetection] FaceDetector API not available in this browser');
      setState(prev => ({ ...prev, isSupported: false }));
    }

    // Create canvas for frame capture
    canvasRef.current = document.createElement('canvas');

    return () => {
      detectorRef.current = null;
      canvasRef.current = null;
    };
  }, [enabled]);

  // Detect faces in current video frame
  const detectFaces = useCallback(async () => {
    const video = videoRef.current;
    const detector = detectorRef.current;
    const canvas = canvasRef.current;

    if (!video || !detector || !canvas || video.readyState < 2) {
      return;
    }

    try {
      // Capture frame to canvas
      canvas.width = video.videoWidth || 320;
      canvas.height = video.videoHeight || 240;
      const ctx = canvas.getContext('2d');
      if (!ctx) return;

      ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

      // Detect faces
      const faces = await detector.detect(canvas);
      const faceCount = faces.length;
      const now = Date.now();

      setState(prev => ({
        ...prev,
        faceCount,
        lastDetectionTime: now,
      }));

      // Multiple faces detected - throttle to avoid spamming
      if (faceCount > 1) {
        if (now - lastEventTimeRef.current.multiple > 10000) { // 10 second throttle
          lastEventTimeRef.current.multiple = now;

          setState(prev => ({
            ...prev,
            multipleFaceEvents: prev.multipleFaceEvents + 1,
          }));

          // Record event to backend
          await api.proctoring.recordEvent(assessmentId, 'multiple_faces', {
            face_count: faceCount,
            timestamp: new Date().toISOString(),
          });

          onMultipleFaces?.(faceCount);
          console.log(`[FaceDetection] Multiple faces detected: ${faceCount}`);
        }
      }

      // No face detected - throttle similarly
      if (faceCount === 0) {
        if (now - lastEventTimeRef.current.noFace > 10000) { // 10 second throttle
          lastEventTimeRef.current.noFace = now;

          setState(prev => ({
            ...prev,
            noFaceEvents: prev.noFaceEvents + 1,
          }));

          // Record event to backend
          await api.proctoring.recordEvent(assessmentId, 'no_face', {
            timestamp: new Date().toISOString(),
          });

          onNoFace?.();
          console.log('[FaceDetection] No face detected');
        }
      }
    } catch (error) {
      // Silent fail - detection errors shouldn't interrupt assessment
      console.warn('[FaceDetection] Detection error:', error);
    }
  }, [assessmentId, videoRef, onMultipleFaces, onNoFace]);

  // Run detection at interval
  useEffect(() => {
    if (!enabled || !state.isSupported) return;

    // Start detection loop
    intervalRef.current = window.setInterval(detectFaces, detectionIntervalMs);

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    };
  }, [enabled, state.isSupported, detectFaces, detectionIntervalMs]);

  return {
    isSupported: state.isSupported,
    faceCount: state.faceCount,
    multipleFaceEvents: state.multipleFaceEvents,
    noFaceEvents: state.noFaceEvents,
  };
};
