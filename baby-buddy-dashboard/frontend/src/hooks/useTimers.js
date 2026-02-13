import { useState, useEffect, useRef, useCallback } from "react";
import { api } from "../api";

export function useTimers(serverTimers, childId) {
  const [activeTimers, setActiveTimers] = useState([]);
  const [elapsedMap, setElapsedMap] = useState({});
  const tickRef = useRef(null);

  // Sync with server timers on data load
  useEffect(() => {
    if (serverTimers?.length > 0) {
      setActiveTimers(
        serverTimers.map((t) => ({
          id: t.id,
          name: t.name || "timer",
          start: new Date(t.start),
        }))
      );
    } else {
      setActiveTimers([]);
    }
  }, [serverTimers]);

  // Tick elapsed time for all active timers
  useEffect(() => {
    if (activeTimers.length === 0) {
      setElapsedMap({});
      clearInterval(tickRef.current);
      return;
    }
    const tick = () => {
      const now = Date.now();
      const map = {};
      for (const t of activeTimers) {
        map[t.id] = Math.floor((now - t.start.getTime()) / 1000);
      }
      setElapsedMap(map);
    };
    tick();
    tickRef.current = setInterval(tick, 1000);
    return () => clearInterval(tickRef.current);
  }, [activeTimers]);

  const startTimer = useCallback(
    async (name) => {
      if (!childId) return;
      const res = await api.createTimer({ child: childId, name });
      setActiveTimers((prev) => [
        ...prev,
        { id: res.id, name: res.name || name, start: new Date(res.start) },
      ]);
    },
    [childId]
  );

  const stopTimer = useCallback(async (timerId) => {
    const timer = activeTimers.find((t) => t.id === timerId);
    if (!timer) return null;
    setActiveTimers((prev) => prev.filter((t) => t.id !== timerId));
    return { ...timer };
  }, [activeTimers]);

  const discardTimer = useCallback(async (timerId) => {
    const timer = activeTimers.find((t) => t.id === timerId);
    if (!timer) return;
    await api.deleteTimer(timerId);
    setActiveTimers((prev) => prev.filter((t) => t.id !== timerId));
  }, [activeTimers]);

  return { activeTimers, elapsedMap, startTimer, stopTimer, discardTimer };
}
