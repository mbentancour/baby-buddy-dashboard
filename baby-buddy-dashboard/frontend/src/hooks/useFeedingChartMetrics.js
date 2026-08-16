import { useState } from "react";

const STORAGE_KEY = "bbd_feeding_chart_metrics";
const DEFAULT_METRICS = { amount: true, count: true };

export function useFeedingChartMetrics() {
  const [metrics, setMetrics] = useState(() => {
    try {
      const saved = JSON.parse(localStorage.getItem(STORAGE_KEY));
      if (saved && typeof saved === "object") return { ...DEFAULT_METRICS, ...saved };
    } catch {
      // ignore invalid stored value
    }
    return DEFAULT_METRICS;
  });

  const updateMetrics = (next) => {
    setMetrics(next);
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
    } catch {
      // storage unavailable - preference just won't persist
    }
  };

  return [metrics, updateMetrics];
}
