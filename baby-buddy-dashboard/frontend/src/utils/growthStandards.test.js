import { describe, it, expect } from "vitest";
import { ageInWeeks, hasWhoStandard, buildWhoBandSeries, toAgeWeekSeries } from "./growthStandards";

describe("ageInWeeks", () => {
  it("returns 0 for a measurement on the birth date", () => {
    expect(ageInWeeks("2026-01-01", "2026-01-01")).toBeCloseTo(0, 5);
  });

  it("returns fractional weeks for a date one week later", () => {
    expect(ageInWeeks("2026-01-01", "2026-01-08")).toBeCloseTo(1, 5);
  });

  it("returns ~52 weeks for a date one year later", () => {
    expect(ageInWeeks("2025-01-01", "2026-01-01")).toBeCloseTo(52.14, 1);
  });
});

describe("hasWhoStandard", () => {
  it("is true for a known metric/sex combination", () => {
    expect(hasWhoStandard("weight", "male")).toBe(true);
    expect(hasWhoStandard("height", "female")).toBe(true);
    expect(hasWhoStandard("headCircumference", "male")).toBe(true);
    expect(hasWhoStandard("bmi", "female")).toBe(true);
  });

  it("is false when sex is unset or unrecognized", () => {
    expect(hasWhoStandard("weight", "")).toBe(false);
    expect(hasWhoStandard("weight", undefined)).toBe(false);
    expect(hasWhoStandard("weight", "unknown")).toBe(false);
  });

  it("is false for a metric with no WHO standard", () => {
    expect(hasWhoStandard("shoeSize", "male")).toBe(false);
  });
});

describe("buildWhoBandSeries", () => {
  it("returns rows only up to a small buffer past the requested max week", () => {
    const rows = buildWhoBandSeries("weight", "male", 10);
    expect(rows.length).toBeGreaterThan(0);
    expect(rows[rows.length - 1].week).toBeLessThanOrEqual(14);
    expect(rows.every((r) => r.week <= 14)).toBe(true);
  });

  it("computes [low, high] range arrays consistent with the raw percentiles", () => {
    // Recharts range-Area pattern: a 2-element array renders the band directly between
    // those two values, unlike stacked Areas (which always anchor at 0 regardless of
    // the Y-axis domain - confirmed while building this feature, see git history).
    const rows = buildWhoBandSeries("weight", "female", 5);
    const week0 = rows.find((r) => r.week === 0);
    expect(week0.outerRange).toEqual([week0.p3, week0.p97]);
    expect(week0.innerRange).toEqual([week0.p15, week0.p85]);
  });

  it("returns an empty array when there is no standard for the given sex", () => {
    expect(buildWhoBandSeries("weight", "", 10)).toEqual([]);
  });

  it("matches the known WHO median birth weight for boys (~3.3-3.4kg)", () => {
    const rows = buildWhoBandSeries("weight", "male", 0);
    const week0 = rows.find((r) => r.week === 0);
    expect(week0.p50).toBeGreaterThan(3.2);
    expect(week0.p50).toBeLessThan(3.5);
  });
});

describe("toAgeWeekSeries", () => {
  const birthDate = "2026-01-01";

  it("converts calendar-date entries into age-in-weeks points, sorted ascending", () => {
    const entries = [
      { date: "2026-01-15", weight: 3.6 },
      { date: "2026-01-01", weight: 3.3 },
      { date: "2026-01-08", weight: 3.45 },
    ];
    const series = toAgeWeekSeries(entries, "weight", birthDate);
    expect(series.map((p) => p.value)).toEqual([3.3, 3.45, 3.6]);
    expect(series[0].week).toBeCloseTo(0, 5);
    expect(series[1].week).toBeCloseTo(1, 5);
    expect(series[2].week).toBeCloseTo(2, 5);
  });

  it("drops entries dated before the birth date", () => {
    const entries = [{ date: "2025-12-25", weight: 3.0 }];
    expect(toAgeWeekSeries(entries, "weight", birthDate)).toEqual([]);
  });

  it("keeps a reference to the original entry for edit actions", () => {
    const entry = { date: "2026-01-01", weight: 3.3, id: 42 };
    const [point] = toAgeWeekSeries([entry], "weight", birthDate);
    expect(point.entry).toBe(entry);
  });
});
