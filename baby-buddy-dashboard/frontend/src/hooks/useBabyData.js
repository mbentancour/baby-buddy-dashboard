import { useState, useEffect, useCallback, useRef } from "react";
import { api } from "../api";
import { getMockData } from "../utils/mockData";

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
  const [monthlyFeedings, setMonthlyFeedings] = useState([]);
  const [monthlySleep, setMonthlySleep] = useState([]);
  const [timers, setTimers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [lastSync, setLastSync] = useState(null);
  const [unitSystem, setUnitSystem] = useState("metric");
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

      // Last 30 days for growth trends
      const monthAgo = new Date(now);
      monthAgo.setDate(monthAgo.getDate() - 29);
      const monthMin = `${toLocalISODate(monthAgo)}T00:00:00`;

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
        monthlyFeedingsRes,
        monthlySleepRes,
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
        api.getFeedings({ start_min: monthMin, limit: 500, ordering: "-start" }),
        api.getSleep({ start_min: monthMin, limit: 500, ordering: "-start" }),
      ]);

      const firstChild = childrenRes.results?.[0] || null;
      if (firstChild?.picture) {
        try {
          const url = new URL(firstChild.picture);
          firstChild.picture = `./api/media${url.pathname}`;
        } catch {
          // leave as-is if not a valid URL
        }
      }
      setChild(firstChild);
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
      setMonthlyFeedings(monthlyFeedingsRes.results || []);
      setMonthlySleep(monthlySleepRes.results || []);
      setLastSync(new Date());
      setError(null);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  const loadMock = useCallback(() => {
    const mock = getMockData();
    setChild(mock.child);
    setFeedings(mock.feedings);
    setWeeklyFeedings(mock.weeklyFeedings);
    setSleepEntries(mock.sleepEntries);
    setWeeklySleep(mock.weeklySleep);
    setChanges(mock.changes);
    setTummyTimes(mock.tummyTimes);
    setWeeklyTummyTimes(mock.weeklyTummyTimes);
    setTemperatures(mock.temperatures);
    setWeights(mock.weights);
    setHeights(mock.heights);
    setTimers(mock.timers);
    setMonthlyFeedings(mock.monthlyFeedings);
    setMonthlySleep(mock.monthlySleep);
    setLastSync(new Date());
    setLoading(false);
  }, []);

  useEffect(() => {
    api
      .getConfig()
      .then((cfg) => {
        if (cfg.unit_system) setUnitSystem(cfg.unit_system);
        if (cfg.demo_mode) {
          loadMock();
        } else {
          fetchAll();
          const ms = (cfg.refresh_interval || 30) * 1000;
          intervalRef.current = setInterval(fetchAll, ms);
        }
      })
      .catch(() => {
        fetchAll();
        intervalRef.current = setInterval(fetchAll, 30000);
      });

    return () => clearInterval(intervalRef.current);
  }, [fetchAll, loadMock]);

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
    monthlyFeedings,
    monthlySleep,
    timers,
    loading,
    error,
    lastSync,
    unitSystem,
    refetch: fetchAll,
  };
}
