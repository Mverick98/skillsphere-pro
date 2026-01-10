import { useEffect, useRef, useCallback, useState } from 'react';
import { api } from '@/services/api';

interface RecorderOptions {
  assessmentId: string;
  enabled: boolean;
  externalStream?: MediaStream | null; // Use existing stream instead of creating new one
  onPermissionDenied?: () => void;
  onError?: (error: string) => void;
}

interface RecorderState {
  isRecording: boolean;
  hasPermission: boolean | null;
  chunkIndex: number;
  error: string | null;
  stream: MediaStream | null;
}

const CHUNK_INTERVAL_MS = 10000; // 10 second chunks
const UPLOAD_BATCH_SIZE = 3; // Upload every 3 chunks (30 seconds)
const MAX_PENDING_CHUNKS = 10; // Memory cap - max chunks before forced upload

export const useProctoringRecorder = ({
  assessmentId,
  enabled,
  externalStream,
  onPermissionDenied,
  onError,
}: RecorderOptions) => {
  const [state, setState] = useState<RecorderState>({
    isRecording: false,
    hasPermission: null,
    chunkIndex: 0,
    error: null,
    stream: null,
  });

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const chunkIndexRef = useRef(0);
  const streamRef = useRef<MediaStream | null>(null);
  const externalStreamRef = useRef<MediaStream | null>(null); // Track external stream for cleanup
  const isUploadingRef = useRef(false); // Prevent concurrent uploads (F7)
  const pendingFinalUploadRef = useRef<Promise<void> | null>(null); // Track final upload (F6)

  // Use external stream if provided (F4: single source of truth)
  useEffect(() => {
    if (externalStream) {
      streamRef.current = externalStream;
      externalStreamRef.current = externalStream;
      setState(prev => ({ ...prev, hasPermission: true, stream: externalStream }));
    }
  }, [externalStream]);

  // Request camera/microphone permissions (only if no external stream)
  const requestPermission = useCallback(async (): Promise<boolean> => {
    // F4: Only check ref, don't duplicate state updates - let useEffect handle external stream
    if (streamRef.current?.active) {
      return true;
    }

    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: 'user',
          width: { ideal: 640 },
          height: { ideal: 480 },
          frameRate: { ideal: 15 },
        },
        audio: true,
      });

      streamRef.current = stream;
      setState(prev => ({ ...prev, hasPermission: true, stream }));
      return true;
    } catch (error) {
      console.error('Failed to get media permissions:', error);
      setState(prev => ({ ...prev, hasPermission: false, error: 'Camera permission denied' }));
      onPermissionDenied?.();
      return false;
    }
  }, [onPermissionDenied]);

  // Upload accumulated chunks (F3: with error handling, F7: with lock)
  const uploadChunks = useCallback(async (): Promise<boolean> => {
    if (chunksRef.current.length === 0 || !assessmentId) return true;

    // F7: Prevent concurrent uploads
    if (isUploadingRef.current) {
      console.log('[Proctoring] Upload already in progress, skipping');
      return true;
    }

    isUploadingRef.current = true;

    // BUGFIX: Save chunks reference BEFORE clearing, so we can restore on failure
    const chunksToUpload = [...chunksRef.current];
    const blob = new Blob(chunksToUpload, { type: 'video/webm' });
    const index = chunkIndexRef.current;

    // Clear chunks after creating blob (optimistic)
    chunksRef.current = [];
    chunkIndexRef.current += 1;

    try {
      const result = await api.proctoring.uploadVideoChunk(assessmentId, blob, index);
      // BUGFIX: Check result.success since API catches errors and returns { success: false }
      if (!result.success) {
        throw new Error('Upload returned unsuccessful');
      }
      console.log(`[Proctoring] Uploaded chunk ${index}`);
      setState(prev => ({ ...prev, chunkIndex: index + 1 }));
      isUploadingRef.current = false;
      return true;
    } catch (error) {
      console.error(`[Proctoring] Failed to upload chunk ${index}:`, error);
      // BUGFIX: Re-add chunks back for retry - prepend to preserve order
      chunksRef.current = [...chunksToUpload, ...chunksRef.current];
      chunkIndexRef.current = index; // Reset index since upload failed
      isUploadingRef.current = false;
      return false;
    }
  }, [assessmentId]);

  // Start recording (F1: with stream.active check)
  const startRecording = useCallback(async () => {
    // F1: Check if stream exists AND is active
    if (!enabled) {
      onError?.('Recording not enabled');
      return;
    }

    if (!streamRef.current?.active) {
      const hasPermission = await requestPermission();
      if (!hasPermission) return;
    }

    const stream = streamRef.current;

    // F1: Double-check stream is valid and active
    if (!stream || !stream.active) {
      onError?.('No active media stream available');
      return;
    }

    // F1: Verify stream has required tracks
    const videoTracks = stream.getVideoTracks();
    const audioTracks = stream.getAudioTracks();

    if (videoTracks.length === 0 || !videoTracks[0].enabled) {
      onError?.('No active video track available');
      return;
    }

    try {
      // Check for supported mime types
      const mimeType = MediaRecorder.isTypeSupported('video/webm;codecs=vp9,opus')
        ? 'video/webm;codecs=vp9,opus'
        : MediaRecorder.isTypeSupported('video/webm;codecs=vp8,opus')
        ? 'video/webm;codecs=vp8,opus'
        : 'video/webm';

      const mediaRecorder = new MediaRecorder(stream, { mimeType });

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          chunksRef.current.push(event.data);

          // Upload every UPLOAD_BATCH_SIZE chunks, or if hitting memory cap
          if (chunksRef.current.length >= UPLOAD_BATCH_SIZE ||
              chunksRef.current.length >= MAX_PENDING_CHUNKS) {
            uploadChunks();
          }
        }
      };

      mediaRecorder.onerror = (event) => {
        console.error('[Proctoring] MediaRecorder error:', event);
        setState(prev => ({ ...prev, error: 'Recording error', isRecording: false }));
        onError?.('Recording error');
      };

      mediaRecorder.onstop = () => {
        console.log('[Proctoring] Recording stopped');
      };

      // Start recording with chunk interval
      mediaRecorder.start(CHUNK_INTERVAL_MS);
      mediaRecorderRef.current = mediaRecorder;

      setState(prev => ({ ...prev, isRecording: true, error: null }));
      console.log('[Proctoring] Recording started');
    } catch (error) {
      console.error('[Proctoring] Failed to start recording:', error);
      setState(prev => ({ ...prev, error: 'Failed to start recording' }));
      onError?.('Failed to start recording');
    }
  }, [enabled, requestPermission, uploadChunks, onError]);

  // Stop recording (F5: use ref for external stream check, F6: wait for final data)
  const stopRecording = useCallback(async () => {
    console.log('[Proctoring] stopRecording called');
    const mediaRecorder = mediaRecorderRef.current;

    // F6: Create promise to capture final data
    let finalDataPromise: Promise<void> | null = null;

    if (mediaRecorder && mediaRecorder.state !== 'inactive') {
      console.log('[Proctoring] MediaRecorder state:', mediaRecorder.state);
      finalDataPromise = new Promise<void>((resolve) => {
        const originalOnDataAvailable = mediaRecorder.ondataavailable;
        let resolved = false;

        // BUGFIX: Timeout to prevent hanging if ondataavailable never fires
        const timeout = setTimeout(() => {
          if (!resolved) {
            console.warn('[Proctoring] requestData timeout - proceeding without final data');
            mediaRecorder.ondataavailable = originalOnDataAvailable;
            resolved = true;
            resolve();
          }
        }, 2000); // 2 second timeout

        mediaRecorder.ondataavailable = (event) => {
          if (resolved) return;
          clearTimeout(timeout);
          if (event.data.size > 0) {
            chunksRef.current.push(event.data);
          }
          // Restore original handler and resolve
          mediaRecorder.ondataavailable = originalOnDataAvailable;
          resolved = true;
          resolve();
        };

        // Request final data and stop
        try {
          mediaRecorder.requestData();
          mediaRecorder.stop();
        } catch (e) {
          console.warn('[Proctoring] Error during stop:', e);
          clearTimeout(timeout);
          if (!resolved) {
            resolved = true;
            resolve();
          }
        }
      });
    }

    // F6: Wait for final data to be captured
    if (finalDataPromise) {
      await finalDataPromise;
    }

    // Upload any remaining chunks
    if (chunksRef.current.length > 0) {
      console.log(`[Proctoring] Uploading ${chunksRef.current.length} remaining chunks`);
      pendingFinalUploadRef.current = uploadChunks().then(() => {});
      await pendingFinalUploadRef.current;
    } else {
      console.log('[Proctoring] No remaining chunks to upload');
    }

    // Finalize recording on server
    console.log('[Proctoring] Calling finalize API for assessment:', assessmentId);
    if (assessmentId) {
      try {
        const result = await api.proctoring.finalizeRecording(assessmentId);
        // BUGFIX: Check result.success since API catches errors
        if (!result.success) {
          console.error('[Proctoring] Finalize returned unsuccessful:', result);
        } else {
          console.log('[Proctoring] Recording finalized, result:', result);
        }
      } catch (error) {
        console.error('[Proctoring] Failed to finalize recording:', error);
      }
    } else {
      console.warn('[Proctoring] No assessmentId, skipping finalize');
    }

    // F5: Use ref instead of closure for external stream check
    if (streamRef.current && !externalStreamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }

    setState(prev => ({ ...prev, isRecording: false, stream: null }));
    mediaRecorderRef.current = null;
  }, [assessmentId, uploadChunks]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
        mediaRecorderRef.current.stop();
      }
      // Only stop tracks if we created them (not external)
      if (streamRef.current && !externalStreamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop());
      }
    };
  }, []);

  // Get video element ref for preview
  const getVideoPreviewRef = useCallback((videoElement: HTMLVideoElement | null) => {
    if (videoElement && streamRef.current) {
      videoElement.srcObject = streamRef.current;
    }
  }, []);

  return {
    state,
    stream: state.stream,
    isRecording: state.isRecording,
    hasPermission: state.hasPermission,
    chunkIndex: state.chunkIndex,
    error: state.error,
    requestPermission,
    startRecording,
    stopRecording,
    getVideoPreviewRef,
  };
};
