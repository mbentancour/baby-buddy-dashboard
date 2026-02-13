// Mock data for demo mode — generates realistic Baby Buddy API responses
// using relative dates so charts always look current.

function pad(n) {
  return String(n).padStart(2, "0");
}

function isoLocal(date) {
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}:00`;
}

function isoDate(date) {
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
}

function hoursAgo(h, m = 0) {
  return new Date(Date.now() - h * 3600000 - m * 60000);
}

function daysAgo(d) {
  const date = new Date();
  date.setDate(date.getDate() - d);
  return date;
}

function duration(h, m, s = 0) {
  return `${pad(h)}:${pad(m)}:${pad(s)}`;
}

// --- Child ---
const child = {
  id: 1,
  first_name: "Emma",
  last_name: "Demo",
  birth_date: isoDate(daysAgo(120)),
  picture: null,
};

// --- Today's feedings ---
const feedings = [
  { id: 1, child: 1, start: isoLocal(hoursAgo(1)), end: isoLocal(hoursAgo(0, 45)), type: "breast milk", method: "bottle", amount: 120, duration: duration(0, 15) },
  { id: 2, child: 1, start: isoLocal(hoursAgo(4)), end: isoLocal(hoursAgo(3, 40)), type: "breast milk", method: "bottle", amount: 150, duration: duration(0, 20) },
  { id: 3, child: 1, start: isoLocal(hoursAgo(7, 30)), end: isoLocal(hoursAgo(7, 10)), type: "breast milk", method: "left breast", amount: null, duration: duration(0, 20) },
  { id: 4, child: 1, start: isoLocal(hoursAgo(10)), end: isoLocal(hoursAgo(9, 45)), type: "breast milk", method: "bottle", amount: 130, duration: duration(0, 15) },
];

// --- Weekly feedings (last 7 days) ---
function generateWeeklyFeedings() {
  const entries = [...feedings];
  const amounts = [480, 520, 460, 500, 490, 510, 0]; // last entry = today (already in feedings)
  for (let d = 1; d <= 6; d++) {
    const base = daysAgo(d);
    const dailyAmount = amounts[d] || 500;
    const count = 4 + Math.floor(Math.random() * 2);
    const perFeeding = Math.round(dailyAmount / count);
    for (let f = 0; f < count; f++) {
      const start = new Date(base);
      start.setHours(6 + f * 3, Math.floor(Math.random() * 30));
      const end = new Date(start.getTime() + 15 * 60000);
      entries.push({
        id: 100 + d * 10 + f,
        child: 1,
        start: isoLocal(start),
        end: isoLocal(end),
        type: "breast milk",
        method: f % 2 === 0 ? "bottle" : "left breast",
        amount: f % 2 === 0 ? perFeeding : null,
        duration: duration(0, 15),
      });
    }
  }
  return entries;
}

// --- Today's sleep ---
const sleepEntries = [
  { id: 1, child: 1, start: isoLocal(hoursAgo(3)), end: isoLocal(hoursAgo(2)), duration: duration(1, 0), nap: true },
  { id: 2, child: 1, start: isoLocal(hoursAgo(8)), end: isoLocal(hoursAgo(6, 30)), duration: duration(1, 30), nap: true },
  { id: 3, child: 1, start: isoLocal(hoursAgo(14)), end: isoLocal(hoursAgo(6, 0)), duration: duration(8, 0), nap: false },
];

// --- Weekly sleep ---
function generateWeeklySleep() {
  const entries = [...sleepEntries];
  for (let d = 1; d <= 6; d++) {
    const base = daysAgo(d);
    // Night sleep
    const nightStart = new Date(base);
    nightStart.setHours(20, 0);
    const nightEnd = new Date(base);
    nightEnd.setDate(nightEnd.getDate() + 1);
    nightEnd.setHours(6, 30);
    entries.push({
      id: 200 + d * 10,
      child: 1,
      start: isoLocal(nightStart),
      end: isoLocal(nightEnd),
      duration: duration(10, 30),
      nap: false,
    });
    // Naps
    const napStart = new Date(base);
    napStart.setHours(13, 0);
    entries.push({
      id: 200 + d * 10 + 1,
      child: 1,
      start: isoLocal(napStart),
      end: isoLocal(new Date(napStart.getTime() + 90 * 60000)),
      duration: duration(1, 30),
      nap: true,
    });
  }
  return entries;
}

// --- Today's diaper changes ---
const changes = [
  { id: 1, child: 1, time: isoLocal(hoursAgo(0, 30)), wet: true, solid: false, color: "", amount: null },
  { id: 2, child: 1, time: isoLocal(hoursAgo(2, 15)), wet: true, solid: true, color: "brown", amount: null },
  { id: 3, child: 1, time: isoLocal(hoursAgo(5)), wet: true, solid: false, color: "", amount: null },
  { id: 4, child: 1, time: isoLocal(hoursAgo(8)), wet: false, solid: true, color: "yellow", amount: null },
  { id: 5, child: 1, time: isoLocal(hoursAgo(11)), wet: true, solid: false, color: "", amount: null },
];

// --- Today's tummy times ---
const tummyTimes = [
  { id: 1, child: 1, start: isoLocal(hoursAgo(2)), end: isoLocal(hoursAgo(1, 50)), duration: duration(0, 10) },
  { id: 2, child: 1, start: isoLocal(hoursAgo(6)), end: isoLocal(hoursAgo(5, 45)), duration: duration(0, 15) },
];

// --- Weekly tummy times ---
function generateWeeklyTummy() {
  const entries = [...tummyTimes];
  for (let d = 1; d <= 6; d++) {
    const base = daysAgo(d);
    const sessions = 2 + Math.floor(Math.random() * 2);
    for (let s = 0; s < sessions; s++) {
      const start = new Date(base);
      start.setHours(9 + s * 4, Math.floor(Math.random() * 30));
      const mins = 8 + Math.floor(Math.random() * 10);
      entries.push({
        id: 300 + d * 10 + s,
        child: 1,
        start: isoLocal(start),
        end: isoLocal(new Date(start.getTime() + mins * 60000)),
        duration: duration(0, mins),
      });
    }
  }
  return entries;
}

// --- Temperatures ---
const temperatures = [
  { id: 1, child: 1, time: isoLocal(hoursAgo(2)), temperature: 36.6 },
  { id: 2, child: 1, time: isoLocal(hoursAgo(26)), temperature: 36.8 },
  { id: 3, child: 1, time: isoLocal(hoursAgo(50)), temperature: 36.5 },
  { id: 4, child: 1, time: isoLocal(hoursAgo(74)), temperature: 36.7 },
];

// --- Weights (over last few months) ---
const weights = Array.from({ length: 12 }, (_, i) => ({
  id: i + 1,
  child: 1,
  date: isoDate(daysAgo((11 - i) * 10)),
  weight: (3.2 + i * 0.35).toFixed(2),
}));

// --- Heights (over last few months) ---
const heights = Array.from({ length: 8 }, (_, i) => ({
  id: i + 1,
  child: 1,
  date: isoDate(daysAgo((7 - i) * 15)),
  height: (49 + i * 1.5).toFixed(1),
}));

// --- Monthly feedings (30 days) ---
function generateMonthlyFeedings() {
  const entries = [];
  for (let d = 0; d < 30; d++) {
    const base = daysAgo(d);
    const dailyAmount = 420 + Math.floor(Math.random() * 120);
    const count = 4 + Math.floor(Math.random() * 3);
    const perFeeding = Math.round(dailyAmount / count);
    for (let f = 0; f < count; f++) {
      const start = new Date(base);
      start.setHours(6 + f * 3, Math.floor(Math.random() * 30));
      const end = new Date(start.getTime() + 15 * 60000);
      entries.push({
        id: 500 + d * 10 + f,
        child: 1,
        start: isoLocal(start),
        end: isoLocal(end),
        type: "breast milk",
        method: f % 2 === 0 ? "bottle" : "left breast",
        amount: f % 2 === 0 ? perFeeding : null,
        duration: duration(0, 15),
      });
    }
  }
  return entries;
}

// --- Monthly sleep (30 days) ---
function generateMonthlySleep() {
  const entries = [];
  for (let d = 0; d < 30; d++) {
    const base = daysAgo(d);
    const nightHours = 9 + Math.random() * 2;
    const nightStart = new Date(base);
    nightStart.setHours(20, Math.floor(Math.random() * 30));
    const nightMins = Math.round(nightHours * 60);
    entries.push({
      id: 800 + d * 10,
      child: 1,
      start: isoLocal(nightStart),
      end: isoLocal(new Date(nightStart.getTime() + nightMins * 60000)),
      duration: duration(Math.floor(nightHours), Math.round((nightHours % 1) * 60)),
      nap: false,
    });
    const napMins = 60 + Math.floor(Math.random() * 60);
    const napStart = new Date(base);
    napStart.setHours(13, Math.floor(Math.random() * 30));
    entries.push({
      id: 800 + d * 10 + 1,
      child: 1,
      start: isoLocal(napStart),
      end: isoLocal(new Date(napStart.getTime() + napMins * 60000)),
      duration: duration(Math.floor(napMins / 60), napMins % 60),
      nap: true,
    });
  }
  return entries;
}

export function getMockData() {
  return {
    child,
    feedings,
    weeklyFeedings: generateWeeklyFeedings(),
    sleepEntries,
    weeklySleep: generateWeeklySleep(),
    changes,
    tummyTimes,
    weeklyTummyTimes: generateWeeklyTummy(),
    temperatures,
    weights,
    heights,
    monthlyFeedings: generateMonthlyFeedings(),
    monthlySleep: generateMonthlySleep(),
    timers: [],
  };
}
