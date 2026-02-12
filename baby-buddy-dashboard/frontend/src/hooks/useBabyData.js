import { useState, useEffect, useCallback, useRef } from "react";
import { api } from "../api";

function toLocalISODate(date) {
  const pad = (n) => String(n).padStart(2, "0");
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
}

export function useBabyData() {
  const [child, setChild] = useState(null);
  const [feedings, setFeedings] = useState([]);
  const [weeklyFeedings, setWeeklyFeedings] = useState([]);
  const [sleepEntries, setSleepEntries] = useState([]);
  const [weeklySleep, setWeeklySleep] = useState([]);
  const [changes, setChanges] = useState([]);
  const [tummyTimes, setTummyTimes] = useState([]);
  const [weeklyTummyTimes, setWeeklyTummyTimes] = useState([]);
  const [temperatures, setTemperatures] = useState([]);
  const [weights, setWeights] = useState([]);
  const [heights, setHeights] = useState([]);
  const [timers, setTimers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [lastSync, setLastSync] = useState(null);
  const intervalRef = useRef(null);

  const fetchAll = useCallback(async () => {
    try {
      const now = new Date();

      // Today: midnight to end of day (local time)
      const todayStr = toLocalISODate(now);
      const todayMin = `${todayStr}T00:00:00`;
      const todayMax = `${todayStr}T23:59:59`;

      // Last 24h for sleep
      const twentyFourAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000);
      const sleepMin = `${toLocalISODate(twentyFourAgo)}T${String(twentyFourAgo.getHours()).padStart(2, "0")}:${String(twentyFourAgo.getMinutes()).padStart(2, "0")}:00`;

      // Last 7 days for weekly charts
      const weekAgo = new Date(now);
      weekAgo.setDate(weekAgo.getDate() - 6);
      const weekMin = `${toLocalISODate(weekAgo)}T00:00:00`;

      const [
        childrenRes,
        feedingsRes,
        weeklyFeedingsRes,
        sleepRes,
        weeklySleepRes,
        changesRes,
        tummyRes,
        weeklyTummyRes,
        tempRes,
        weightRes,
        heightRes,
        timersRes,
      ] = await Promise.all([
        api.getChildren(),
        api.getFeedings({ start_min: todayMin, start_max: todayMax, limit: 100, ordering: "-start" }),
        api.getFeedings({ start_min: weekMin, limit: 200, ordering: "-start" }),
        api.getSleep({ start_min: sleepMin, limit: 100, ordering: "-start" }),
        api.getSleep({ start_min: weekMin, limit: 200, ordering: "-start" }),
        api.getChanges({ date_min: todayMin, date_max: todayMax, limit: 100, ordering: "-time" }),
        api.getTummyTimes({ start_min: todayMin, start_max: todayMax, limit: 100, ordering: "-start" }),
        api.getTummyTimes({ start_min: weekMin, limit: 200, ordering: "-start" }),
        api.getTemperature({ limit: 10, ordering: "-time" }),
        api.getWeight({ limit: 20, ordering: "-date" }),
        api.getHeight({ limit: 20, ordering: "-date" }),
        api.getTimers(),
      ]);

      setChild(childrenRes.results?.[0] || null);
      setFeedings(feedingsRes.results || []);
      setWeeklyFeedings(weeklyFeedingsRes.results || []);
      setSleepEntries(sleepRes.results || []);
      setWeeklySleep(weeklySleepRes.results || []);
      setChanges(changesRes.results || []);
      setTummyTimes(tummyRes.results || []);
      setWeeklyTummyTimes(weeklyTummyRes.results || []);
      setTemperatures(tempRes.results || []);
      setWeights(weightRes.results || []);
      setHeights(heightRes.results || []);
      setTimers(timersRes.results || []);
      setLastSync(new Date());
      setError(null);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchAll();

    api
      .getConfig()
      .then((cfg) => {
        const ms = (cfg.refresh_interval || 30) * 1000;
        intervalRef.current = setInterval(fetchAll, ms);
      })
      .catch(() => {
        intervalRef.current = setInterval(fetchAll, 30000);
      });

    return () => clearInterval(intervalRef.current);
  }, [fetchAll]);

  return {
    child,
    feedings,
    weeklyFeedings,
    sleepEntries,
    weeklySleep,
    changes,
    tummyTimes,
    weeklyTummyTimes,
    temperatures,
    weights,
    heights,
    timers,
    loading,
    error,
    lastSync,
    refetch: fetchAll,
  };
}
