import { useState, useEffect, useRef, useCallback } from "react";
import { api } from "../api";

export function useTimers(serverTimers, childId) {
  const [activeTimer, setActiveTimer] = useState(null);
  const [elapsed, setElapsed] = useState(0);
  const tickRef = useRef(null);

  // Sync with server timers on data load
  useEffect(() => {
    if (serverTimers?.length > 0) {
      const running = serverTimers[0];
      setActiveTimer({
        id: running.id,
        name: running.name || "timer",
        start: new Date(running.start),
      });
    } else {
      setActiveTimer(null);
    }
  }, [serverTimers]);

  // Tick elapsed time based on server start time
  useEffect(() => {
    if (!activeTimer) {
      setElapsed(0);
      clearInterval(tickRef.current);
      return;
    }
    const tick = () => {
      setElapsed(Math.floor((Date.now() - activeTimer.start.getTime()) / 1000));
    };
    tick();
    tickRef.current = setInterval(tick, 1000);
    return () => clearInterval(tickRef.current);
  }, [activeTimer]);

  const startTimer = useCallback(
    async (name) => {
      if (!childId) return;
      const res = await api.createTimer({ child: childId, name });
      setActiveTimer({
        id: res.id,
        name: res.name || name,
        start: new Date(res.start),
      });
    },
    [childId]
  );

  const stopTimer = useCallback(async () => {
    if (!activeTimer) return null;
    const timer = { ...activeTimer };
    // Don't delete — Baby Buddy auto-deletes timers when used in a creation call.
    // If the user cancels the form, the timer stays and reappears on next sync.
    setActiveTimer(null);
    return timer;
  }, [activeTimer]);

  return { activeTimer, elapsed, startTimer, stopTimer };
}
