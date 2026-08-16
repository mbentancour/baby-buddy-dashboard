import { translate as t, getLocale } from "../locales";

// A <input type="datetime-local"> value ("2026-07-23T07:22") has no timezone info. Sending
// it to the Baby Buddy API as-is (just appending ":00") is naive-string, timezone-blind -
// Baby Buddy's Django backend parses it according to ITS OWN configured TIME_ZONE setting,
// not the browser's. If that differs from the device's local zone (e.g. server on UTC,
// household on UTC+2), the same wall-clock time is silently misinterpreted as a couple
// hours off - which surfaced as real "Date/time can not be in the future" API rejections
// and bogus overlap conflicts. new Date(value) correctly parses a timezone-less
// date-time string as LOCAL time (per the ECMAScript Date Time String spec), so
// .toISOString() from there gives an unambiguous absolute UTC instant that Baby Buddy
// interprets identically regardless of its own configured timezone.
export function toApiDatetime(localDatetimeValue) {
  return new Date(localDatetimeValue).toISOString();
}

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
    return t("time.ageDays", { days: Math.max(0, Math.floor((now - birth) / 86400000)) });
  if (months < 12)
    return t("time.ageMonthsDays", { months, days: adjustedDays });
  const years = Math.floor(months / 12);
  const remainingMonths = months % 12;
  if (remainingMonths === 0)
    return t("time.ageYears", { years });
  return t("time.ageYearsMonths", { years, months: remainingMonths });
}

export function formatElapsed(seconds) {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m.toString().padStart(2, "0")}:${s.toString().padStart(2, "0")}`;
}

export function timeAgo(dateStr) {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return t("time.justNow");
  if (mins < 60) return t("time.minutesAgo", { m: mins });
  const hours = Math.floor(mins / 60);
  const remainingMins = mins % 60;
  if (hours < 24) return t("time.hoursAgo", { h: hours, m: remainingMins ? ` ${remainingMins}m` : "" });
  const days = Math.floor(hours / 24);
  const remainingHours = hours % 24;
  return t("time.daysAgo", { d: days, h: remainingHours ? ` ${remainingHours}h` : "" });
}

export function formatTime(dateStr) {
  return new Date(dateStr).toLocaleTimeString(getLocale(), {
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

const FEEDING_METHOD_KEYS = {
  bottle: "feedingForm.methods.bottle",
  "left breast": "feedingForm.methods.leftBreast",
  "right breast": "feedingForm.methods.rightBreast",
  "both breasts": "feedingForm.methods.bothBreasts",
  "parent fed": "feedingForm.methods.parentFed",
  "self fed": "feedingForm.methods.selfFed",
};

const FEEDING_TYPE_KEYS = {
  "breast milk": "feedingForm.types.breastMilk",
  formula: "feedingForm.types.formula",
  "fortified breast milk": "feedingForm.types.fortifiedBreastMilk",
  "solid food": "feedingForm.types.solidFood",
};

function translateFeedingMethodOrType(value) {
  if (!value) return "";
  const key = FEEDING_METHOD_KEYS[value] || FEEDING_TYPE_KEYS[value];
  return key ? t(key) : value;
}

// Bottle-fed amounts are already shown in mL, which is the more meaningful number there;
// breastfeeding has no defined amount, so its session length is shown instead.
const BREAST_FEEDING_METHODS = new Set(["left breast", "right breast", "both breasts"]);

function feedingDurationMs(f) {
  if (!f.start || !f.end || !BREAST_FEEDING_METHODS.has(f.method)) return null;
  const ms = new Date(f.end).getTime() - new Date(f.start).getTime();
  return ms > 0 ? ms : null;
}

export function toFeedingTimeline(feedings, volumeUnit = "mL") {
  // feedings is ordered most-recent-first. The newest entry shows time since now;
  // every other entry shows the gap to the next (more recent) feeding instead, since
  // that spacing between feeds is more useful than a second "time ago" from now.
  return feedings.map((f, i, arr) => {
    const thisTime = new Date(f.end || f.start).getTime();
    const detail =
      i === 0
        ? timeAgo(f.end || f.start)
        : t("time.gap", { elapsed: formatElapsedHM(new Date(arr[i - 1].end || arr[i - 1].start).getTime() - thisTime) });
    const durationMs = feedingDurationMs(f);
    const label = `${f.amount ? f.amount + " " + volumeUnit : ""} ${translateFeedingMethodOrType(f.method || f.type)}`.trim() || t("action.feeding");
    return {
      time: formatTime(f.end || f.start),
      label: durationMs ? `${label} · ${formatElapsedHM(durationMs)}` : label,
      detail,
      amount: f.amount || 0,
      type: f.type,
      method: f.method,
      entry: f,
    };
  });
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
    end: s.end ? formatTime(s.end) : t("time.ongoing"),
    duration: parseDuration(s.duration),
    nap: s.nap,
    entry: s,
  }));
}

export function toNoteTimeline(notes) {
  return notes.map((n) => ({
    time: formatTime(n.time),
    text: n.note,
    ago: timeAgo(n.time),
    entry: n,
  }));
}

const DOSAGE_UNIT_KEYS = {
  mg: "medicationForm.dosageUnits.mg",
  ml: "medicationForm.dosageUnits.ml",
  tablets: "medicationForm.dosageUnits.tablets",
  drops: "medicationForm.dosageUnits.drops",
};

export function translateDosageUnit(value) {
  if (!value) return "";
  const key = DOSAGE_UNIT_KEYS[value];
  return key ? t(key) : value;
}

export function toMedicationTimeline(medications) {
  return medications.map((m) => ({
    time: formatTime(m.time),
    label: m.name,
    detail: `${m.dosage ? `${m.dosage}${m.dosage_unit ? " " + translateDosageUnit(m.dosage_unit) : ""} · ` : ""}${timeAgo(m.time)}`,
    entry: m,
  }));
}

export function parseDurationHours(value) {
  if (!value) return null;
  const parts = String(value).trim().split(" ");
  const days = parts.length > 1 ? parseFloat(parts[0]) || 0 : 0;
  const hms = (parts.length > 1 ? parts[1] : parts[0]).split(":").map(Number);
  const hours = days * 24 + (hms[0] || 0) + (hms[1] || 0) / 60 + (hms[2] || 0) / 3600;
  return hours || null;
}

export function formatDurationString(totalHours) {
  const totalMinutes = Math.max(0, Math.round(totalHours * 60));
  const h = Math.floor(totalMinutes / 60);
  const m = totalMinutes % 60;
  const pad = (n) => String(n).padStart(2, "0");
  return `${pad(h)}:${pad(m)}:00`;
}

export function formatElapsedHM(ms) {
  const totalMinutes = Math.max(0, Math.round(ms / 60000));
  const h = Math.floor(totalMinutes / 60);
  const m = totalMinutes % 60;
  if (h === 0) return `${m}m`;
  return m ? `${h}h ${m}m` : `${h}h`;
}

export function formatDueLabel(dueAt) {
  const now = new Date();
  if (now.getTime() > dueAt.getTime()) {
    return t("notes.dueOverdueBy", { elapsed: formatElapsedHM(now.getTime() - dueAt.getTime()) });
  }
  const startOfDay = (d) => new Date(d.getFullYear(), d.getMonth(), d.getDate());
  const dayDiff = Math.round((startOfDay(dueAt) - startOfDay(now)) / 86400000);
  const time = dueAt.toLocaleTimeString(getLocale(), { hour: "2-digit", minute: "2-digit" });
  if (dayDiff === 0) return t("notes.dueNextToday", { time });
  if (dayDiff === 1) return t("notes.dueNextTomorrow", { time });
  return t("notes.dueNextOn", { date: dueAt.toLocaleDateString(getLocale(), { month: "short", day: "numeric" }), time });
}

// Defensive cap on how many individual missed-dose rows a single medication can render -
// without it, a recurring medication nobody has logged in weeks would produce one row per
// elapsed interval. The current (not-yet-elapsed) slot's due date is always computed from
// the true elapsed count regardless of this cap, so it's never wrong - only how many of the
// oldest missed rows get individually listed is capped.
const MAX_MISSED_DOSE_SLOTS = 10;

export function getMedicationStatus(medications) {
  const latestByName = {};
  medications.forEach((m) => {
    if (!m.next_dose_interval) return;
    const existing = latestByName[m.name];
    if (!existing || new Date(m.time) > new Date(existing.time)) {
      latestByName[m.name] = m;
    }
  });

  const now = Date.now();
  const statuses = [];
  Object.values(latestByName).forEach((m) => {
    const hours = parseDurationHours(m.next_dose_interval);
    const intervalMs = hours * 3600000;
    if (!(intervalMs > 0)) return;
    const lastTime = new Date(m.time).getTime();

    // Every fully-elapsed interval since the last logged dose that hasn't been acted on is
    // a missed dose - its own overdue row, distinct from the still-open "current" one (which
    // stays upcoming/green until it too elapses and rolls into the next render's backlog).
    const elapsedSlots = Math.max(Math.floor((now - lastTime) / intervalMs), 0);
    const missedToShow = Math.min(elapsedSlots, MAX_MISSED_DOSE_SLOTS);
    const firstMissedSlot = elapsedSlots - missedToShow + 1;
    for (let slot = firstMissedSlot; slot <= elapsedSlots; slot++) {
      const dueAt = new Date(lastTime + slot * intervalMs);
      statuses.push({ name: m.name, dueAt, overdue: now > dueAt.getTime(), current: false, slotIndex: slot, entry: m });
    }

    const currentSlot = elapsedSlots + 1;
    const dueAt = new Date(lastTime + currentSlot * intervalMs);
    statuses.push({ name: m.name, dueAt, overdue: now > dueAt.getTime(), current: true, slotIndex: currentSlot, entry: m });
  });
  return statuses;
}

export function toGrowthSeries(entries, valueKey) {
  return entries
    .slice()
    .sort((a, b) => new Date(a.date) - new Date(b.date))
    .map((e) => ({
      timestamp: new Date(e.date).getTime(),
      date: new Date(e.date).toLocaleDateString(getLocale(), {
        month: "short",
        day: "numeric",
      }),
      [valueKey]: parseFloat(e[valueKey]),
      entry: e,
    }));
}

export function formatGrowthTick(timestamp) {
  return new Date(timestamp).toLocaleDateString(getLocale(), {
    month: "short",
    day: "numeric",
  });
}

function getLast7Days() {
  const dayNames = t("time.dayNames");
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
  const counts = {};
  days.forEach((d) => {
    sums[d.dateStr] = 0;
    counts[d.dateStr] = 0;
  });
  entries.forEach((e) => {
    const key = entryDateStr(e[dateKey] || e.time || e.date);
    if (key in sums) {
      sums[key] += parseFloat(e[valueKey] || 0);
      counts[key] += 1;
    }
  });
  return days.map((d) => ({
    day: d.label,
    amount: Math.round(sums[d.dateStr]),
    count: counts[d.dateStr],
  }));
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
    const month = d.toLocaleDateString(getLocale(), { month: "short", day: "numeric" });
    result.push({
      label: month,
      dateStr: `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`,
    });
  }
  return result;
}

export function averageFeedingGapMs(feedings) {
  if (!feedings || feedings.length < 2) return null;
  const times = feedings
    .map((f) => new Date(f.end || f.start).getTime())
    .sort((a, b) => a - b);
  let totalGap = 0;
  for (let i = 1; i < times.length; i++) totalGap += times[i] - times[i - 1];
  return totalGap / (times.length - 1);
}

export function averageBreastFeedingDurationMs(feedings) {
  const durations = (feedings || []).map(feedingDurationMs).filter((ms) => ms != null);
  if (!durations.length) return null;
  return durations.reduce((sum, ms) => sum + ms, 0) / durations.length;
}

const LB_TO_KG = 0.45359237;
const IN_TO_CM = 2.54;

// Baby Buddy imposes no unit at all on its weight/height/BMI fields - they're plain
// unlabeled numbers, whatever the household happens to type in. Our own `unit_system`
// add-on option is the only signal we have for what unit those raw numbers are actually
// in, so it's what this conversion trusts (metric: already kg/cm; imperial: lb/in).
export function calculateBmi(weightValue, heightValue, unitSystem) {
  if (!weightValue || !heightValue || heightValue <= 0) return null;
  const weightKg = unitSystem === "imperial" ? weightValue * LB_TO_KG : weightValue;
  const heightCm = unitSystem === "imperial" ? heightValue * IN_TO_CM : heightValue;
  const heightM = heightCm / 100;
  return Math.round((weightKg / (heightM * heightM)) * 10) / 10;
}

export function dailyFeedingTotals(entries, numDays = 30) {
  const days = getLastNDays(numDays);
  const sums = {};
  const counts = {};
  days.forEach((d) => {
    sums[d.dateStr] = 0;
    counts[d.dateStr] = 0;
  });
  entries.forEach((e) => {
    const key = entryDateStr(e.start || e.time || e.date);
    if (key in sums) {
      sums[key] += parseFloat(e.amount || 0);
      counts[key] += 1;
    }
  });
  const result = days.map((d) => ({
    date: d.label,
    amount: Math.round(sums[d.dateStr]),
    count: counts[d.dateStr],
  }));
  const firstNonZero = result.findIndex((d) => d.amount > 0 || d.count > 0);
  return firstNonZero > 0 ? result.slice(firstNonZero) : result;
}

export function getEntriesForDay(entries, dayLabel, dateKey = "start") {
  const days = getLast7Days();
  const targetDay = days.find((d) => d.label === dayLabel);
  if (!targetDay) return [];

  return entries.filter((e) => {
    const key = entryDateStr(e[dateKey] || e.time || e.date);
    return key === targetDay.dateStr;
  });
}

export function getEntriesForDate(entries, dateLabel, dateKey = "start") {
  const targetDate = dateLabel; // Already in format like "Jan 15"
  return entries.filter((e) => {
    const entryDate = new Date(e[dateKey] || e.time || e.date);
    const formattedDate = entryDate.toLocaleDateString(getLocale(), {
      month: "short",
      day: "numeric",
    });
    return formattedDate === targetDate;
  });
}

export function buildDailyReport(feedings, changes, sleepEntries, numDays = 7, tummyTimes = []) {
  const days = getLastNDays(numDays);
  const rows = {};
  days.forEach((d) => {
    rows[d.dateStr] = {
      date: d.label,
      amount: 0,
      feedCount: 0,
      wet: 0,
      solid: 0,
      both: 0,
      diaperTotal: 0,
      sleepHours: 0,
      tummyMinutes: 0,
    };
  });
  feedings.forEach((f) => {
    const key = entryDateStr(f.start || f.time);
    if (key in rows) {
      rows[key].amount += parseFloat(f.amount || 0);
      rows[key].feedCount += 1;
    }
  });
  changes.forEach((c) => {
    const key = entryDateStr(c.time);
    if (key in rows) {
      if (c.wet && c.solid) rows[key].both += 1;
      else if (c.solid) rows[key].solid += 1;
      else if (c.wet) rows[key].wet += 1;
      rows[key].diaperTotal += 1;
    }
  });
  sleepEntries.forEach((s) => {
    const key = entryDateStr(s.start);
    if (key in rows) rows[key].sleepHours += parseDuration(s.duration);
  });
  tummyTimes.forEach((tt) => {
    const key = entryDateStr(tt.start);
    if (key in rows) rows[key].tummyMinutes += parseDuration(tt.duration) * 60;
  });
  return days.map((d) => ({
    ...rows[d.dateStr],
    amount: Math.round(rows[d.dateStr].amount),
    sleepHours: Math.round(rows[d.dateStr].sleepHours * 10) / 10,
    tummyMinutes: Math.round(rows[d.dateStr].tummyMinutes),
  }));
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

export function dailyDiaperTotals(changes, numDays = 30) {
  const days = getLastNDays(numDays);
  const counts = {};
  days.forEach((d) => (counts[d.dateStr] = 0));
  changes.forEach((c) => {
    const key = entryDateStr(c.time);
    if (key in counts) counts[key] += 1;
  });
  const result = days.map((d) => ({ date: d.label, count: counts[d.dateStr] }));
  const firstNonZero = result.findIndex((d) => d.count > 0);
  return firstNonZero > 0 ? result.slice(firstNonZero) : result;
}

export function buildDailyMeasurementsReport(weights, heights, headCircumferences, bmis, numDays = 30) {
  const days = getLastNDays(numDays);
  const rows = {};
  days.forEach((d) => {
    rows[d.dateStr] = { date: d.label, weight: null, height: null, headCircumference: null, bmi: null };
  });
  weights.forEach((w) => {
    const key = entryDateStr(w.date);
    if (key in rows) rows[key].weight = w.weight;
  });
  heights.forEach((h) => {
    const key = entryDateStr(h.date);
    if (key in rows) rows[key].height = h.height;
  });
  headCircumferences.forEach((c) => {
    const key = entryDateStr(c.date);
    if (key in rows) rows[key].headCircumference = c.head_circumference;
  });
  bmis.forEach((b) => {
    const key = entryDateStr(b.date);
    if (key in rows) rows[key].bmi = b.bmi;
  });
  return days.map((d) => rows[d.dateStr]);
}
