const API_BASE = "./api/baby-buddy";
const CONFIG_PATH = "./api/config";
const REQUEST_TIMEOUT_MS = 15000;

// Plain fetch() never settles on its own if the connection just stalls (flaky wifi, a
// backgrounded mobile tab, an ingress proxy that drops the response) - without an explicit
// deadline, a hung request here means the caller's promise chain never resolves, which for
// the very first config fetch means the app's loading spinner never clears.
async function fetchWithTimeout(url, options = {}, timeoutMs = REQUEST_TIMEOUT_MS) {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeoutMs);
  try {
    return await fetch(url, { ...options, signal: controller.signal });
  } catch (err) {
    if (err.name === "AbortError") {
      throw new Error(`Request timed out after ${timeoutMs / 1000}s: ${url}`);
    }
    throw err;
  } finally {
    clearTimeout(timeoutId);
  }
}

// Diagnostic aid for "Date/time can not be in the future"-style rejections: the backend
// forwards Baby Buddy's own `Date` response header under X-Baby-Buddy-Date (not as `Date` -
// uvicorn always emits its own `Date` regardless, so reusing that name would produce two
// headers merged into one unparseable value). Comparing it against the device's own clock
// at the same instant surfaces a genuine clock skew (device or Baby Buddy's server) directly
// in the error log, instead of having to guess whether a "future" rejection on an
// already-correct timestamp is a code bug or an environment problem.
function clockSkewSuffix(response) {
  const serverDateHeader = response.headers.get("X-Baby-Buddy-Date");
  if (!serverDateHeader) return "";
  const serverMs = Date.parse(serverDateHeader);
  if (Number.isNaN(serverMs)) return "";
  const clientMs = Date.now();
  const skewMs = clientMs - serverMs;
  return ` [clockCheck: device=${new Date(clientMs).toISOString()} server=${new Date(serverMs).toISOString()} deviceAheadByMs=${skewMs}]`;
}

async function request(endpoint, options = {}) {
  const url = `${API_BASE}/${endpoint}`;
  const config = {
    headers: { "Content-Type": "application/json" },
    ...options,
  };

  const response = await fetchWithTimeout(url, config);

  if (!response.ok) {
    const text = await response.text().catch(() => "");
    throw new Error(`API error ${response.status}: ${text}${clockSkewSuffix(response)}`);
  }

  if (response.status === 204) return null;
  return response.json();
}

function qs(params) {
  if (!params) return "";
  const filtered = Object.fromEntries(
    Object.entries(params).filter(([, v]) => v != null && v !== "")
  );
  const s = new URLSearchParams(filtered).toString();
  return s ? `?${s}` : "";
}

export const api = {
  // Children
  getChildren: () => request("children/"),

  // Feedings
  getFeedings: (params) => request(`feedings/${qs(params)}`),
  createFeeding: (data) =>
    request("feedings/", { method: "POST", body: JSON.stringify(data) }),
  updateFeeding: (id, data) =>
    request(`feedings/${id}/`, { method: "PATCH", body: JSON.stringify(data) }),
  deleteFeeding: (id) => request(`feedings/${id}/`, { method: "DELETE" }),

  // Sleep
  getSleep: (params) => request(`sleep/${qs(params)}`),
  createSleep: (data) =>
    request("sleep/", { method: "POST", body: JSON.stringify(data) }),
  updateSleep: (id, data) =>
    request(`sleep/${id}/`, { method: "PATCH", body: JSON.stringify(data) }),
  deleteSleep: (id) => request(`sleep/${id}/`, { method: "DELETE" }),

  // Diapers (changes)
  getChanges: (params) => request(`changes/${qs(params)}`),
  createChange: (data) =>
    request("changes/", { method: "POST", body: JSON.stringify(data) }),
  updateChange: (id, data) =>
    request(`changes/${id}/`, { method: "PATCH", body: JSON.stringify(data) }),
  deleteChange: (id) => request(`changes/${id}/`, { method: "DELETE" }),

  // Tummy time
  getTummyTimes: (params) => request(`tummy-times/${qs(params)}`),
  createTummyTime: (data) =>
    request("tummy-times/", { method: "POST", body: JSON.stringify(data) }),
  updateTummyTime: (id, data) =>
    request(`tummy-times/${id}/`, { method: "PATCH", body: JSON.stringify(data) }),
  deleteTummyTime: (id) => request(`tummy-times/${id}/`, { method: "DELETE" }),

  // Temperature
  getTemperature: (params) => request(`temperature/${qs(params)}`),
  createTemperature: (data) =>
    request("temperature/", { method: "POST", body: JSON.stringify(data) }),
  updateTemperature: (id, data) =>
    request(`temperature/${id}/`, { method: "PATCH", body: JSON.stringify(data) }),
  deleteTemperature: (id) => request(`temperature/${id}/`, { method: "DELETE" }),

  // Medication
  getMedication: (params) => request(`medication/${qs(params)}`),
  createMedication: (data) =>
    request("medication/", { method: "POST", body: JSON.stringify(data) }),
  updateMedication: (id, data) =>
    request(`medication/${id}/`, { method: "PATCH", body: JSON.stringify(data) }),
  deleteMedication: (id) => request(`medication/${id}/`, { method: "DELETE" }),

  // Weight
  getWeight: (params) => request(`weight/${qs(params)}`),
  createWeight: (data) =>
    request("weight/", { method: "POST", body: JSON.stringify(data) }),
  updateWeight: (id, data) =>
    request(`weight/${id}/`, { method: "PATCH", body: JSON.stringify(data) }),
  deleteWeight: (id) => request(`weight/${id}/`, { method: "DELETE" }),

  // Height
  getHeight: (params) => request(`height/${qs(params)}`),
  createHeight: (data) =>
    request("height/", { method: "POST", body: JSON.stringify(data) }),
  updateHeight: (id, data) =>
    request(`height/${id}/`, { method: "PATCH", body: JSON.stringify(data) }),
  deleteHeight: (id) => request(`height/${id}/`, { method: "DELETE" }),

  // Head circumference
  getHeadCircumference: (params) => request(`head-circumference/${qs(params)}`),
  createHeadCircumference: (data) =>
    request("head-circumference/", { method: "POST", body: JSON.stringify(data) }),
  updateHeadCircumference: (id, data) =>
    request(`head-circumference/${id}/`, { method: "PATCH", body: JSON.stringify(data) }),
  deleteHeadCircumference: (id) => request(`head-circumference/${id}/`, { method: "DELETE" }),

  // BMI
  getBmi: (params) => request(`bmi/${qs(params)}`),
  createBmi: (data) =>
    request("bmi/", { method: "POST", body: JSON.stringify(data) }),
  updateBmi: (id, data) =>
    request(`bmi/${id}/`, { method: "PATCH", body: JSON.stringify(data) }),
  deleteBmi: (id) => request(`bmi/${id}/`, { method: "DELETE" }),

  // Pumping
  getPumping: (params) => request(`pumping/${qs(params)}`),
  createPumping: (data) =>
    request("pumping/", { method: "POST", body: JSON.stringify(data) }),

  // Notes
  getNotes: (params) => request(`notes/${qs(params)}`),
  createNote: (data) =>
    request("notes/", { method: "POST", body: JSON.stringify(data) }),
  updateNote: (id, data) =>
    request(`notes/${id}/`, { method: "PATCH", body: JSON.stringify(data) }),
  deleteNote: (id) => request(`notes/${id}/`, { method: "DELETE" }),

  // Timers
  getTimers: () => request("timers/"),
  createTimer: (data) =>
    request("timers/", { method: "POST", body: JSON.stringify(data) }),
  updateTimer: (id, data) =>
    request(`timers/${id}/`, { method: "PATCH", body: JSON.stringify(data) }),
  deleteTimer: (id) => request(`timers/${id}/`, { method: "DELETE" }),

  // Config (our backend, not Baby Buddy)
  getConfig: () => fetchWithTimeout(CONFIG_PATH).then((r) => r.json()),
};
