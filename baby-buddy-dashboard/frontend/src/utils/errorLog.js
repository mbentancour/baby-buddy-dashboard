const STORAGE_KEY = "bbd_error_log";
const MAX_ENTRIES = 50;

function load() {
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY) || "[]");
  } catch {
    return [];
  }
}

let cache = load();
const listeners = new Set();

function persist() {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(cache));
  } catch {
    // storage unavailable/full - log still works in-memory for this session
  }
  listeners.forEach((l) => l());
}

export function logError(action, message) {
  cache = [
    { time: new Date().toISOString(), action, message: message || "Unknown error" },
    ...cache,
  ].slice(0, MAX_ENTRIES);
  persist();
}

export function clearErrorLog() {
  cache = [];
  persist();
}

export function subscribeErrorLog(cb) {
  listeners.add(cb);
  return () => listeners.delete(cb);
}

export function getErrorLog() {
  return cache;
}
