import { useEffect, useRef, useCallback } from 'react';

/**
 * Custom hook to block browser back button navigation during assessments.
 * Uses popstate event listener instead of react-router's useBlocker
 * which has compatibility issues with BrowserRouter.
 *
 * @param shouldBlock - Whether navigation should be blocked
 * @param onBlock - Callback when navigation is blocked (show warning dialog)
 * @returns { unblock } - Function to call before intentional navigation
 */
export const useAssessmentBlocker = (
  shouldBlock: boolean,
  onBlock: () => void
) => {
  const isBlockingRef = useRef(false);
  const onBlockRef = useRef(onBlock);

  // Keep callback ref up to date
  useEffect(() => {
    onBlockRef.current = onBlock;
  }, [onBlock]);

  useEffect(() => {
    if (!shouldBlock) {
      isBlockingRef.current = false;
      return;
    }

    isBlockingRef.current = true;

    // Push a history entry so back button can be intercepted
    window.history.pushState({ assessmentGuard: true }, '');

    const handlePopState = (e: PopStateEvent) => {
      if (!isBlockingRef.current) return;

      // Prevent navigation by pushing state back
      window.history.pushState({ assessmentGuard: true }, '');

      // Notify parent to show warning dialog
      onBlockRef.current();
    };

    window.addEventListener('popstate', handlePopState);

    return () => {
      window.removeEventListener('popstate', handlePopState);
      isBlockingRef.current = false;
    };
  }, [shouldBlock]);

  const unblock = useCallback(() => {
    isBlockingRef.current = false;
  }, []);

  return { unblock };
};
