export function getAge(birthDate) {
  const birth = new Date(birthDate);
  const now = new Date();
  const months =
    (now.getFullYear() - birth.getFullYear()) * 12 +
    (now.getMonth() - birth.getMonth());
  const days = now.getDate() - birth.getDate();
  if (months < 1)
    return `${Math.max(0, Math.floor((now - birth) / 86400000))} days`;
  return days < 0
    ? `${months - 1}mo ${30 + days}d`
    : `${months}mo ${days}d`;
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

export function toFeedingTimeline(feedings) {
  return feedings.map((f) => ({
    time: formatTime(f.end || f.start),
    label: `${f.amount ? f.amount + " mL" : ""} ${f.method || f.type || ""}`.trim() || "Feeding",
    detail: timeAgo(f.end || f.start),
    amount: f.amount || 0,
    type: f.type,
    method: f.method,
  }));
}

export function toDiaperTimeline(changes) {
  return changes.map((c) => ({
    time: formatTime(c.time),
    type: c.solid && c.wet ? "both" : c.solid ? "solid" : "wet",
    ago: timeAgo(c.time),
    color: c.color,
  }));
}

export function toSleepBlocks(sleepEntries) {
  return sleepEntries.map((s) => ({
    start: formatTime(s.start),
    end: s.end ? formatTime(s.end) : "ongoing",
    duration: parseDuration(s.duration),
    nap: s.nap,
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

export function aggregateByDayOfWeek(entries, valueKey, dateKey = "start") {
  const days = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
  const sums = Array(7).fill(0);
  entries.forEach((e) => {
    const d = new Date(e[dateKey] || e.time || e.date).getDay();
    sums[d] += parseFloat(e[valueKey] || 0);
  });
  return days.map((day, i) => ({ day, amount: Math.round(sums[i]) }));
}

export function aggregateTummyByDay(entries) {
  const days = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
  const totals = Array(7).fill(0);
  entries.forEach((e) => {
    const d = new Date(e.start).getDay();
    totals[d] += parseDuration(e.duration) * 60;
  });
  return days.map((day, i) => ({ day, minutes: Math.round(totals[i]) }));
}
