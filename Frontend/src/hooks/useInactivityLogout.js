import { useEffect, useRef, useState, useCallback } from 'react';

// 5 minutes total: 4:30 idle → warning modal opens, 0:30 countdown → logout.
// Both are enforced server-side too (Session.lastSeenAt + IDLE_MS) so this
// hook is only responsible for the UX side of the timeout.
const IDLE_MS = 5 * 60 * 1000;
const WARN_MS = 30 * 1000;
const ACTIVITY_EVENTS = ['mousemove', 'mousedown', 'keydown', 'scroll', 'touchstart'];

/**
 * Watches window activity; opens a warning modal 30s before the idle limit
 * and logs the user out when it elapses. Any activity while the warning is
 * hidden resets the timer silently — no thrash.
 * Returns `{ warningOpen, secondsLeft, dismissWarning }` for the modal.
 */
export function useInactivityLogout({ enabled, onLogout }) {
  const [warningOpen, setWarningOpen] = useState(false);
  const [secondsLeft, setSecondsLeft] = useState(WARN_MS / 1000);
  const warnTimer = useRef(null);
  const logoutTimer = useRef(null);
  const countdownTimer = useRef(null);

  const clearAll = useCallback(() => {
    clearTimeout(warnTimer.current);
    clearTimeout(logoutTimer.current);
    clearInterval(countdownTimer.current);
  }, []);

  const scheduleWarning = useCallback(() => {
    clearAll();
    warnTimer.current = setTimeout(() => {
      setWarningOpen(true);
      setSecondsLeft(WARN_MS / 1000);
      countdownTimer.current = setInterval(() => {
        setSecondsLeft((s) => (s > 0 ? s - 1 : 0));
      }, 1000);
      logoutTimer.current = setTimeout(() => {
        clearAll();
        setWarningOpen(false);
        onLogout('inactivity');
      }, WARN_MS);
    }, IDLE_MS - WARN_MS);
  }, [clearAll, onLogout]);

  const dismissWarning = useCallback(() => {
    setWarningOpen(false);
    scheduleWarning();
  }, [scheduleWarning]);

  useEffect(() => {
    if (!enabled) {
      clearAll();
      setWarningOpen(false);
      return undefined;
    }

    const onActivity = () => {
      // Real activity while the warning is open is intentional — the user is
      // back. Otherwise a stray mousemove would silently reset the timer
      // WITHOUT dismissing the modal, leaving it stuck on screen.
      if (warningOpen) return;
      scheduleWarning();
    };

    ACTIVITY_EVENTS.forEach((ev) => window.addEventListener(ev, onActivity, { passive: true }));
    scheduleWarning();

    return () => {
      ACTIVITY_EVENTS.forEach((ev) => window.removeEventListener(ev, onActivity));
      clearAll();
    };
  }, [enabled, warningOpen, scheduleWarning, clearAll]);

  return { warningOpen, secondsLeft, dismissWarning };
}
