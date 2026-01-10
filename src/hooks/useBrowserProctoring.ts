import { useEffect, useRef, useCallback, useState } from 'react';
import { api } from '@/services/api';

interface BrowserProctoringOptions {
  assessmentId: string;
  enabled: boolean;
  onFullscreenExit?: () => void;
  onViolation?: (type: string, metadata?: Record<string, unknown>) => void;
}

interface BrowserProctoringState {
  isFullscreen: boolean;
  fullscreenExitCount: number;
  copyAttemptCount: number;
  devtoolsOpenCount: number;
  blockedShortcutCount: number;
  tabSwitchCount: number;
  windowBlurCount: number;
}

export const useBrowserProctoring = ({
  assessmentId,
  enabled,
  onFullscreenExit,
  onViolation,
}: BrowserProctoringOptions) => {
  const [state, setState] = useState<BrowserProctoringState>({
    isFullscreen: false,
    fullscreenExitCount: 0,
    copyAttemptCount: 0,
    devtoolsOpenCount: 0,
    blockedShortcutCount: 0,
    tabSwitchCount: 0,
    windowBlurCount: 0,
  });

  const devtoolsOpenRef = useRef(false);
  const hiddenTimestampRef = useRef<number | null>(null);
  const blurTimestampRef = useRef<number | null>(null);

  // Record event helper
  const recordEvent = useCallback(
    async (eventType: string, metadata?: Record<string, unknown>) => {
      if (!enabled || !assessmentId) return;

      await api.proctoring.recordEvent(assessmentId, eventType, {
        ...metadata,
        timestamp: new Date().toISOString(),
      });

      onViolation?.(eventType, metadata);
    },
    [assessmentId, enabled, onViolation]
  );

  // 1. Fullscreen enforcement
  const requestFullscreen = useCallback(async () => {
    if (!enabled) return;

    try {
      await document.documentElement.requestFullscreen();
      setState(prev => ({ ...prev, isFullscreen: true }));
    } catch (error) {
      console.warn('Failed to enter fullscreen:', error);
    }
  }, [enabled]);

  // Fullscreen change detection
  useEffect(() => {
    if (!enabled) return;

    const handleFullscreenChange = () => {
      const isNowFullscreen = !!document.fullscreenElement;

      if (!isNowFullscreen && state.isFullscreen) {
        // Exited fullscreen
        setState(prev => ({
          ...prev,
          isFullscreen: false,
          fullscreenExitCount: prev.fullscreenExitCount + 1,
        }));

        recordEvent('fullscreen_exit', {
          exit_count: state.fullscreenExitCount + 1,
        });

        onFullscreenExit?.();
      } else if (isNowFullscreen) {
        setState(prev => ({ ...prev, isFullscreen: true }));
      }
    };

    document.addEventListener('fullscreenchange', handleFullscreenChange);
    return () => document.removeEventListener('fullscreenchange', handleFullscreenChange);
  }, [enabled, state.isFullscreen, state.fullscreenExitCount, recordEvent, onFullscreenExit]);

  // 2. Copy/Paste/Cut/Right-click blocking
  useEffect(() => {
    if (!enabled) return;

    const blockEvent = (e: Event) => {
      e.preventDefault();

      setState(prev => ({
        ...prev,
        copyAttemptCount: prev.copyAttemptCount + 1,
      }));

      recordEvent('copy_paste_attempt', {
        event_type: e.type,
        attempt_count: state.copyAttemptCount + 1,
      });
    };

    const events = ['copy', 'paste', 'cut', 'contextmenu'];
    events.forEach(evt => document.addEventListener(evt, blockEvent));

    return () => {
      events.forEach(evt => document.removeEventListener(evt, blockEvent));
    };
  }, [enabled, state.copyAttemptCount, recordEvent]);

  // 3. DevTools detection
  useEffect(() => {
    if (!enabled) return;

    const detectDevTools = () => {
      const threshold = 160;
      const widthDiff = window.outerWidth - window.innerWidth;
      const heightDiff = window.outerHeight - window.innerHeight;
      const isOpen = widthDiff > threshold || heightDiff > threshold;

      if (isOpen && !devtoolsOpenRef.current) {
        // DevTools just opened
        devtoolsOpenRef.current = true;

        setState(prev => ({
          ...prev,
          devtoolsOpenCount: prev.devtoolsOpenCount + 1,
        }));

        recordEvent('devtools_opened', {
          open_count: state.devtoolsOpenCount + 1,
          width_diff: widthDiff,
          height_diff: heightDiff,
        });
      } else if (!isOpen && devtoolsOpenRef.current) {
        // DevTools closed
        devtoolsOpenRef.current = false;
      }
    };

    const interval = setInterval(detectDevTools, 2000);
    return () => clearInterval(interval);
  }, [enabled, state.devtoolsOpenCount, recordEvent]);

  // 4. Keyboard shortcuts blocking
  useEffect(() => {
    if (!enabled) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      const blockedCombos = [
        // Copy/Paste
        e.ctrlKey && e.key === 'c',
        e.ctrlKey && e.key === 'v',
        e.ctrlKey && e.key === 'x',
        e.metaKey && e.key === 'c', // Mac
        e.metaKey && e.key === 'v', // Mac
        e.metaKey && e.key === 'x', // Mac
        // DevTools
        e.key === 'F12',
        e.ctrlKey && e.shiftKey && e.key === 'I',
        e.ctrlKey && e.shiftKey && e.key === 'J',
        e.ctrlKey && e.shiftKey && e.key === 'C',
        e.metaKey && e.altKey && e.key === 'I', // Mac
        // Print
        e.ctrlKey && e.key === 'p',
        e.metaKey && e.key === 'p', // Mac
        // Save
        e.ctrlKey && e.key === 's',
        e.metaKey && e.key === 's', // Mac
        // View source
        e.ctrlKey && e.key === 'u',
        e.metaKey && e.key === 'u', // Mac
      ];

      if (blockedCombos.some(Boolean)) {
        e.preventDefault();

        setState(prev => ({
          ...prev,
          blockedShortcutCount: prev.blockedShortcutCount + 1,
        }));

        recordEvent('blocked_shortcut', {
          key: e.key,
          ctrl: e.ctrlKey,
          shift: e.shiftKey,
          meta: e.metaKey,
          alt: e.altKey,
          attempt_count: state.blockedShortcutCount + 1,
        });
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [enabled, state.blockedShortcutCount, recordEvent]);

  // 5. Prevent text selection (optional - makes copy harder)
  useEffect(() => {
    if (!enabled) return;

    const style = document.createElement('style');
    style.textContent = `
      .assessment-content {
        user-select: none;
        -webkit-user-select: none;
        -moz-user-select: none;
        -ms-user-select: none;
      }
    `;
    document.head.appendChild(style);

    return () => {
      document.head.removeChild(style);
    };
  }, [enabled]);

  // 6. Visibility change detection (tab switch, minimize, Cmd+Tab)
  useEffect(() => {
    if (!enabled) return;

    const handleVisibilityChange = () => {
      if (document.hidden) {
        // Tab/window became hidden
        hiddenTimestampRef.current = Date.now();

        setState(prev => ({
          ...prev,
          tabSwitchCount: prev.tabSwitchCount + 1,
        }));

        recordEvent('tab_switch', {
          reason: 'visibility_hidden',
          switch_count: state.tabSwitchCount + 1,
        });
      } else if (hiddenTimestampRef.current) {
        // Tab/window became visible again
        const awaySeconds = (Date.now() - hiddenTimestampRef.current) / 1000;
        hiddenTimestampRef.current = null;

        recordEvent('tab_return', {
          away_duration_seconds: Math.round(awaySeconds * 10) / 10,
        });
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => document.removeEventListener('visibilitychange', handleVisibilityChange);
  }, [enabled, state.tabSwitchCount, recordEvent]);

  // 7. Window blur/focus detection (catches Cmd+Tab faster)
  useEffect(() => {
    if (!enabled) return;

    const handleBlur = () => {
      blurTimestampRef.current = Date.now();

      setState(prev => ({
        ...prev,
        windowBlurCount: prev.windowBlurCount + 1,
      }));

      recordEvent('window_blur', {
        blur_count: state.windowBlurCount + 1,
      });
    };

    const handleFocus = () => {
      if (blurTimestampRef.current) {
        const awaySeconds = (Date.now() - blurTimestampRef.current) / 1000;
        blurTimestampRef.current = null;

        recordEvent('window_focus', {
          away_duration_seconds: Math.round(awaySeconds * 10) / 10,
        });
      }
    };

    window.addEventListener('blur', handleBlur);
    window.addEventListener('focus', handleFocus);
    return () => {
      window.removeEventListener('blur', handleBlur);
      window.removeEventListener('focus', handleFocus);
    };
  }, [enabled, state.windowBlurCount, recordEvent]);

  return {
    state,
    requestFullscreen,
    isFullscreen: state.isFullscreen,
  };
};
