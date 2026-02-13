export function getAge(birthDate) {
  const birth = new Date(birthDate);
  const now = new Date();
  let months =
    (now.getFullYear() - birth.getFullYear()) * 12 +
    (now.getMonth() - birth.getMonth());
  const days = now.getDate() - birth.getDate();
  if (days < 0) months--;
  const adjustedDays = days < 0 ? 30 + days : days;
  if (months < 1)
    return `${Math.max(0, Math.floor((now - birth) / 86400000))} days`;
  if (months < 12)
    return `${months}mo ${adjustedDays}d`;
  const years = Math.floor(months / 12);
  const remainingMonths = months % 12;
  if (remainingMonths === 0)
    return `${years}y`;
  return `${years}y ${remainingMonths}mo`;
}

export function formatElapsed(seconds) {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m.toString().padStart(2, "0")}:${s.toString().padStart(2, "0")}`;
}

export function timeAgo(dateStr) {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  return `${days}d ago`;
}

export function formatTime(dateStr) {
  return new Date(dateStr).toLocaleTimeString([], {
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function parseDuration(durationStr) {
  if (!durationStr) return 0;
  const parts = durationStr.split(":").map(Number);
  if (parts.length === 3) return parts[0] + parts[1] / 60 + parts[2] / 3600;
  if (parts.length === 2) return parts[0] + parts[1] / 60;
  return parts[0];
}

export function formatDuration(durationStr) {
  if (!durationStr) return "—";
  const hours = parseDuration(durationStr);
  if (hours < 1) return `${Math.round(hours * 60)}m`;
  return `${hours.toFixed(1)}h`;
}

export function toFeedingTimeline(feedings, volumeUnit = "mL") {
  return feedings.map((f) => ({
    time: formatTime(f.end || f.start),
    label: `${f.amount ? f.amount + " " + volumeUnit : ""} ${f.method || f.type || ""}`.trim() || "Feeding",
    detail: timeAgo(f.end || f.start),
    amount: f.amount || 0,
    type: f.type,
    method: f.method,
    entry: f,
  }));
}

export function toDiaperTimeline(changes) {
  return changes.map((c) => ({
    time: formatTime(c.time),
    type: c.solid && c.wet ? "both" : c.solid ? "solid" : "wet",
    ago: timeAgo(c.time),
    color: c.color,
    entry: c,
  }));
}

export function toSleepBlocks(sleepEntries) {
  return sleepEntries.map((s) => ({
    start: formatTime(s.start),
    end: s.end ? formatTime(s.end) : "ongoing",
    duration: parseDuration(s.duration),
    nap: s.nap,
    entry: s,
  }));
}

export function toGrowthSeries(entries, valueKey) {
  return entries
    .slice()
    .sort((a, b) => new Date(a.date) - new Date(b.date))
    .map((e) => ({
      date: new Date(e.date).toLocaleDateString([], {
        month: "short",
        day: "numeric",
      }),
      [valueKey]: parseFloat(e[valueKey]),
    }));
}

function getLast7Days() {
  const dayNames = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
  const result = [];
  const now = new Date();
  for (let i = 6; i >= 0; i--) {
    const d = new Date(now);
    d.setDate(d.getDate() - i);
    result.push({
      label: dayNames[d.getDay()],
      dateStr: `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`,
    });
  }
  return result;
}

function entryDateStr(dateVal) {
  const d = new Date(dateVal);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

export function aggregateByDayOfWeek(entries, valueKey, dateKey = "start") {
  const days = getLast7Days();
  const sums = {};
  days.forEach((d) => (sums[d.dateStr] = 0));
  entries.forEach((e) => {
    const key = entryDateStr(e[dateKey] || e.time || e.date);
    if (key in sums) sums[key] += parseFloat(e[valueKey] || 0);
  });
  return days.map((d) => ({ day: d.label, amount: Math.round(sums[d.dateStr]) }));
}

export function aggregateSleepByDay(entries) {
  const days = getLast7Days();
  const sums = {};
  days.forEach((d) => (sums[d.dateStr] = 0));
  entries.forEach((e) => {
    const key = entryDateStr(e.start);
    if (key in sums) sums[key] += parseDuration(e.duration);
  });
  return days.map((d) => ({ day: d.label, hours: Math.round(sums[d.dateStr] * 10) / 10 }));
}

export function aggregateTummyByDay(entries) {
  const days = getLast7Days();
  const sums = {};
  days.forEach((d) => (sums[d.dateStr] = 0));
  entries.forEach((e) => {
    const key = entryDateStr(e.start);
    if (key in sums) sums[key] += parseDuration(e.duration) * 60;
  });
  return days.map((d) => ({ day: d.label, minutes: Math.round(sums[d.dateStr]) }));
}

function getLastNDays(n) {
  const result = [];
  const now = new Date();
  for (let i = n - 1; i >= 0; i--) {
    const d = new Date(now);
    d.setDate(d.getDate() - i);
    const month = d.toLocaleDateString([], { month: "short", day: "numeric" });
    result.push({
      label: month,
      dateStr: `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`,
    });
  }
  return result;
}

export function dailyFeedingTotals(entries, numDays = 30) {
  const days = getLastNDays(numDays);
  const sums = {};
  days.forEach((d) => (sums[d.dateStr] = 0));
  entries.forEach((e) => {
    const key = entryDateStr(e.start || e.time || e.date);
    if (key in sums) sums[key] += parseFloat(e.amount || 0);
  });
  const result = days.map((d) => ({ date: d.label, amount: Math.round(sums[d.dateStr]) }));
  const firstNonZero = result.findIndex((d) => d.amount > 0);
  return firstNonZero > 0 ? result.slice(firstNonZero) : result;
}

export function dailySleepTotals(entries, numDays = 30) {
  const days = getLastNDays(numDays);
  const sums = {};
  days.forEach((d) => (sums[d.dateStr] = 0));
  entries.forEach((e) => {
    const key = entryDateStr(e.start);
    if (key in sums) sums[key] += parseDuration(e.duration);
  });
  const result = days.map((d) => ({ date: d.label, hours: Math.round(sums[d.dateStr] * 10) / 10 }));
  const firstNonZero = result.findIndex((d) => d.hours > 0);
  return firstNonZero > 0 ? result.slice(firstNonZero) : result;
}
