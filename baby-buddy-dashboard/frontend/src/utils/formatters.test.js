import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import {
  getAge,
  formatElapsed,
  timeAgo,
  parseDuration,
  formatDuration,
  parseDurationHours,
  formatDurationString,
  formatElapsedHM,
  formatDueLabel,
  getMedicationStatus,
  dailyDiaperTotals,
  buildDailyMeasurementsReport,
  toFeedingTimeline,
  averageFeedingGapMs,
  averageBreastFeedingDurationMs,
  translateDosageUnit,
  toApiDatetime,
  calculateBmi,
} from "./formatters";
import { setLanguage } from "../locales";

const NOW = new Date("2026-07-20T12:00:00.000Z");

beforeEach(() => {
  vi.useFakeTimers();
  vi.setSystemTime(NOW);
});

afterEach(() => {
  vi.useRealTimers();
});

describe("toApiDatetime", () => {
  // Regression coverage for a real production bug: forms used to send a naive
  // datetime-local string (e.g. "2026-07-23T07:22:00", no timezone info) straight to the
  // Baby Buddy API. Baby Buddy's Django backend parses a timezone-less string according to
  // ITS OWN configured TIME_ZONE, not the browser's - when they differ, a submission of
  // "now" can appear to be hours in the future (or bogusly overlap an existing entry),
  // exactly what a live user hit ("Date/time can not be in the future" on a feeding logged
  // at 7:22am local time). toApiDatetime must produce an absolute, unambiguous instant.
  it("round-trips a datetime-local value back to the exact same local wall-clock time", () => {
    const local = "2026-07-23T07:22";
    const iso = toApiDatetime(local);
    expect(iso).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/);
    const roundTripped = new Date(iso);
    expect(roundTripped.getFullYear()).toBe(2026);
    expect(roundTripped.getMonth()).toBe(6); // July (0-indexed)
    expect(roundTripped.getDate()).toBe(23);
    expect(roundTripped.getHours()).toBe(7);
    expect(roundTripped.getMinutes()).toBe(22);
  });

  it("round-trips correctly across a local midnight boundary", () => {
    const local = "2026-01-01T00:15";
    const roundTripped = new Date(toApiDatetime(local));
    expect(roundTripped.getFullYear()).toBe(2026);
    expect(roundTripped.getMonth()).toBe(0);
    expect(roundTripped.getDate()).toBe(1);
    expect(roundTripped.getHours()).toBe(0);
    expect(roundTripped.getMinutes()).toBe(15);
  });
});

describe("calculateBmi", () => {
  it("computes standard BMI (kg/m^2) for metric values", () => {
    expect(calculateBmi(5.2, 60, "metric")).toBe(14.4);
  });

  it("converts imperial values (lb/in) to metric before computing BMI", () => {
    // Same real-world measurements as the metric case above (5.2kg ~ 11.5lb,
    // 60cm ~ 23.6in) - should land on essentially the same BMI.
    expect(calculateBmi(11.5, 23.6, "imperial")).toBe(14.5);
  });

  it("returns null for missing or non-positive inputs, never dividing by zero", () => {
    expect(calculateBmi(0, 60, "metric")).toBeNull();
    expect(calculateBmi(5.2, 0, "metric")).toBeNull();
    expect(calculateBmi(null, 60, "metric")).toBeNull();
    expect(calculateBmi(5.2, -10, "metric")).toBeNull();
  });
});

describe("getAge", () => {
  it("returns days for a baby under a month old", () => {
    expect(getAge(new Date("2026-07-10T12:00:00.000Z").toISOString())).toBe("10 days");
  });

  it("returns months and days for a baby under a year old", () => {
    expect(getAge(new Date("2026-03-05T12:00:00.000Z").toISOString())).toBe("4mo 15d");
  });

  it("returns whole years with no remainder", () => {
    expect(getAge(new Date("2024-07-20T12:00:00.000Z").toISOString())).toBe("2y");
  });

  it("returns years and months when there is a remainder", () => {
    expect(getAge(new Date("2024-01-20T12:00:00.000Z").toISOString())).toBe("2y 6mo");
  });
});

describe("formatElapsed", () => {
  it("pads minutes and seconds", () => {
    expect(formatElapsed(65)).toBe("01:05");
    expect(formatElapsed(5)).toBe("00:05");
    expect(formatElapsed(3600)).toBe("60:00");
  });
});

describe("timeAgo", () => {
  it("returns 'just now' under a minute", () => {
    expect(timeAgo(new Date(NOW.getTime() - 30_000).toISOString())).toBe("just now");
  });

  it("returns minutes under an hour", () => {
    expect(timeAgo(new Date(NOW.getTime() - 5 * 60_000).toISOString())).toBe("5m ago");
  });

  it("returns hours and minutes under a day", () => {
    expect(timeAgo(new Date(NOW.getTime() - (2 * 3600_000 + 15 * 60_000)).toISOString())).toBe("2h 15m ago");
  });

  it("omits minutes when exactly on the hour", () => {
    expect(timeAgo(new Date(NOW.getTime() - 3 * 3600_000).toISOString())).toBe("3h ago");
  });

  it("returns days and hours beyond a day", () => {
    expect(timeAgo(new Date(NOW.getTime() - (2 * 86400_000 + 5 * 3600_000)).toISOString())).toBe("2d 5h ago");
  });
});

describe("parseDuration / formatDuration", () => {
  it("parses HH:MM:SS", () => {
    expect(parseDuration("01:30:00")).toBeCloseTo(1.5);
  });

  it("parses MM:SS", () => {
    expect(parseDuration("30:00")).toBe(30);
  });

  it("returns 0 for falsy input", () => {
    expect(parseDuration(null)).toBe(0);
    expect(parseDuration("")).toBe(0);
  });

  it("formats sub-hour durations as minutes", () => {
    expect(formatDuration("00:20:00")).toBe("20m");
  });

  it("formats hour-plus durations with one decimal", () => {
    expect(formatDuration("01:30:00")).toBe("1.5h");
  });

  it("formats missing duration as an em dash", () => {
    expect(formatDuration(null)).toBe("—");
  });
});

describe("parseDurationHours (Baby Buddy DurationField format)", () => {
  it("parses plain HH:MM:SS", () => {
    expect(parseDurationHours("06:00:00")).toBe(6);
  });

  it("parses a days-prefixed duration for intervals >= 24h", () => {
    expect(parseDurationHours("1 00:00:00")).toBe(24);
  });

  it("returns null for empty/zero input", () => {
    expect(parseDurationHours(null)).toBeNull();
    expect(parseDurationHours("")).toBeNull();
    expect(parseDurationHours("00:00:00")).toBeNull();
  });
});

describe("formatDurationString", () => {
  it("round-trips whole and fractional hours into HH:MM:00", () => {
    expect(formatDurationString(6)).toBe("06:00:00");
    expect(formatDurationString(1.5)).toBe("01:30:00");
    expect(formatDurationString(24)).toBe("24:00:00");
  });
});

describe("formatElapsedHM", () => {
  it("shows only minutes under an hour", () => {
    expect(formatElapsedHM(45 * 60_000)).toBe("45m");
  });

  it("shows hours and minutes, omitting minutes when exact", () => {
    expect(formatElapsedHM(90 * 60_000)).toBe("1h 30m");
    expect(formatElapsedHM(120 * 60_000)).toBe("2h");
  });
});

describe("formatDueLabel", () => {
  it("reports overdue doses with elapsed time", () => {
    const dueAt = new Date(NOW.getTime() - 90 * 60_000);
    expect(formatDueLabel(dueAt)).toBe("Overdue by 1h 30m");
  });

  it("labels a dose due later today", () => {
    const dueAt = new Date(NOW.getTime() + 2 * 3600_000);
    expect(formatDueLabel(dueAt)).toMatch(/^Next: Today at/);
  });

  it("labels a dose due tomorrow", () => {
    const dueAt = new Date(NOW);
    dueAt.setDate(dueAt.getDate() + 1);
    expect(formatDueLabel(dueAt)).toMatch(/^Next: Tomorrow at/);
  });
});

describe("getMedicationStatus", () => {
  it("only considers doses with a next_dose_interval set", () => {
    const meds = [{ name: "Vitamin D", time: NOW.toISOString(), next_dose_interval: null }];
    expect(getMedicationStatus(meds)).toEqual([]);
  });

  it("returns a single upcoming row when the dose isn't due yet", () => {
    const meds = [
      { name: "Tylenol", time: new Date(NOW.getTime() - 1 * 3600_000).toISOString(), next_dose_interval: "06:00:00" },
    ];
    const statuses = getMedicationStatus(meds);
    expect(statuses).toHaveLength(1);
    expect(statuses[0].overdue).toBe(false);
    expect(statuses[0].current).toBe(true);
  });

  it("adds one missed row per fully-elapsed interval, plus the still-open current row", () => {
    // Last dose 8h ago, 6h interval -> one interval (slot 1) has fully elapsed and was
    // never acted on (missed, overdue), slot 2 hasn't arrived yet (current, upcoming).
    const meds = [
      { name: "Tylenol", time: new Date(NOW.getTime() - 8 * 3600_000).toISOString(), next_dose_interval: "06:00:00" },
    ];
    const statuses = getMedicationStatus(meds);
    expect(statuses).toHaveLength(2);
    expect(statuses[0]).toMatchObject({ name: "Tylenol", overdue: true, current: false, slotIndex: 1 });
    expect(statuses[1]).toMatchObject({ name: "Tylenol", overdue: false, current: true, slotIndex: 2 });
  });

  it("caps the number of individual missed rows without corrupting the current slot's due date", () => {
    // 30 days neglected, 1-day interval -> 30 missed slots would be excessive; capped at 10,
    // but the current (31st) slot's due date must still reflect the true elapsed count.
    const meds = [
      { name: "Daily Vit", time: new Date(NOW.getTime() - 30 * 24 * 3600_000).toISOString(), next_dose_interval: "1 00:00:00" },
    ];
    const statuses = getMedicationStatus(meds);
    const missed = statuses.filter((s) => !s.current);
    const current = statuses.find((s) => s.current);
    expect(missed).toHaveLength(10);
    expect(current.slotIndex).toBe(31);
    expect(current.overdue).toBe(false);
  });

  it("uses only the most recent dose per medication name", () => {
    const meds = [
      { name: "Tylenol", time: new Date(NOW.getTime() - 8 * 3600_000).toISOString(), next_dose_interval: "06:00:00" },
      { name: "Tylenol", time: new Date(NOW.getTime() - 1 * 3600_000).toISOString(), next_dose_interval: "06:00:00" },
    ];
    const statuses = getMedicationStatus(meds);
    expect(statuses).toHaveLength(1);
    expect(statuses[0].overdue).toBe(false);
  });
});

describe("dailyDiaperTotals", () => {
  it("counts changes on their calendar day and trims leading empty days", () => {
    const changes = [{ time: NOW.toISOString() }, { time: NOW.toISOString() }];
    const result = dailyDiaperTotals(changes, 5);
    expect(result[result.length - 1].count).toBe(2);
    expect(result[0].count).toBeGreaterThan(0);
  });

  it("returns all-zero days untouched when there are no entries", () => {
    const result = dailyDiaperTotals([], 3);
    expect(result).toHaveLength(3);
    expect(result.every((d) => d.count === 0)).toBe(true);
  });
});

describe("buildDailyMeasurementsReport", () => {
  it("places each metric on its own date row and leaves gaps null", () => {
    const dateStr = NOW.toISOString().slice(0, 10);
    const report = buildDailyMeasurementsReport(
      [{ date: dateStr, weight: 4.2 }],
      [],
      [{ date: dateStr, head_circumference: 38 }],
      [],
      3
    );
    const today = report[report.length - 1];
    expect(today.weight).toBe(4.2);
    expect(today.headCircumference).toBe(38);
    expect(today.height).toBeNull();
    expect(today.bmi).toBeNull();
  });
});

describe("toFeedingTimeline", () => {
  // Most-recent-first, matching the "-start" ordering the API/mock data always use.
  const feedings = [
    { start: new Date(NOW.getTime() - 30 * 60_000).toISOString(), amount: 120 },
    { start: new Date(NOW.getTime() - 73 * 60_000).toISOString(), amount: 150 },
    { start: new Date(NOW.getTime() - 130 * 60_000).toISOString(), amount: 130 },
  ];

  it("shows time-since-now only for the most recent feeding", () => {
    const [latest] = toFeedingTimeline(feedings);
    expect(latest.detail).toBe("30m ago");
  });

  it("shows the gap to the next (more recent) feeding for every other entry", () => {
    const timeline = toFeedingTimeline(feedings);
    // 73m ago -> 30m ago is a 43 minute gap
    expect(timeline[1].detail).toBe("43m gap");
    // 130m ago -> 73m ago is a 57 minute gap
    expect(timeline[2].detail).toBe("57m gap");
  });

  it("translates the feeding method/type shown in the label, not just the raw API value", () => {
    const [entry] = toFeedingTimeline([{ start: NOW.toISOString(), amount: 120, method: "bottle" }]);
    expect(entry.label).toBe("120 mL Bottle");

    setLanguage("it");
    const [itEntry] = toFeedingTimeline([{ start: NOW.toISOString(), amount: 120, method: "bottle" }]);
    expect(itEntry.label).toBe("120 mL Biberon");
    setLanguage("en");
  });

  it("appends session duration for breastfeeding methods only", () => {
    const start = new Date(NOW.getTime() - 20 * 60_000).toISOString();
    const [breastEntry] = toFeedingTimeline([{ start, end: NOW.toISOString(), method: "left breast" }]);
    expect(breastEntry.label).toBe("Left Breast · 20m");

    const [bottleEntry] = toFeedingTimeline([{ start, end: NOW.toISOString(), amount: 120, method: "bottle" }]);
    expect(bottleEntry.label).toBe("120 mL Bottle");
  });

  it("omits duration when start/end are missing or non-positive", () => {
    const [noEnd] = toFeedingTimeline([{ start: NOW.toISOString(), method: "left breast" }]);
    expect(noEnd.label).toBe("Left Breast");

    const [zeroLength] = toFeedingTimeline([{ start: NOW.toISOString(), end: NOW.toISOString(), method: "right breast" }]);
    expect(zeroLength.label).toBe("Right Breast");
  });
});

describe("averageBreastFeedingDurationMs", () => {
  it("returns null when there are no breastfeeding entries", () => {
    expect(averageBreastFeedingDurationMs([])).toBeNull();
    expect(averageBreastFeedingDurationMs([{ start: NOW.toISOString(), end: NOW.toISOString(), method: "bottle", amount: 120 }])).toBeNull();
  });

  it("averages only the breastfeeding sessions, ignoring bottle feeds", () => {
    const mk = (mins, method) => ({
      start: NOW.toISOString(),
      end: new Date(NOW.getTime() + mins * 60_000).toISOString(),
      method,
    });
    const feedings = [
      mk(10, "left breast"),
      mk(20, "right breast"),
      mk(999, "bottle"), // should be ignored entirely
    ];
    // (10 + 20) / 2 = 15 minutes
    expect(averageBreastFeedingDurationMs(feedings)).toBe(15 * 60_000);
  });
});

describe("translateDosageUnit", () => {
  afterEach(() => setLanguage("en"));

  it("translates a known Baby Buddy dosage unit", () => {
    expect(translateDosageUnit("drops")).toBe("Drops");
    setLanguage("it");
    expect(translateDosageUnit("drops")).toBe("Gocce");
  });

  it("passes through an unrecognized or empty value unchanged", () => {
    expect(translateDosageUnit("")).toBe("");
    expect(translateDosageUnit("teaspoons")).toBe("teaspoons");
  });
});

describe("averageFeedingGapMs", () => {
  it("returns null with fewer than 2 feedings", () => {
    expect(averageFeedingGapMs([])).toBeNull();
    expect(averageFeedingGapMs([{ start: NOW.toISOString() }])).toBeNull();
  });

  it("averages the gaps between consecutive feedings regardless of input order", () => {
    // 3 feedings 1h apart each -> two 60-minute gaps, unsorted input on purpose
    const feedings = [
      { start: new Date(NOW.getTime() - 2 * 3600_000).toISOString() },
      { start: NOW.toISOString() },
      { start: new Date(NOW.getTime() - 3600_000).toISOString() },
    ];
    expect(averageFeedingGapMs(feedings)).toBe(3600_000);
  });

  it("weights uneven gaps by their actual duration", () => {
    // gaps of 30m and 90m -> average 60m
    const feedings = [
      { start: new Date(NOW.getTime() - 120 * 60_000).toISOString() },
      { start: new Date(NOW.getTime() - 90 * 60_000).toISOString() },
      { start: NOW.toISOString() },
    ];
    expect(averageFeedingGapMs(feedings)).toBe(60 * 60_000);
  });
});
