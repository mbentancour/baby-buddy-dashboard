import { WHO_GROWTH_DATA } from "../data/whoGrowthStandards";

const MS_PER_WEEK = 7 * 86400000;

export function ageInWeeks(birthDate, dateStr) {
  const birth = new Date(birthDate);
  const at = new Date(dateStr);
  return (at.getTime() - birth.getTime()) / MS_PER_WEEK;
}

export function hasWhoStandard(metric, sex) {
  return !!(sex && WHO_GROWTH_DATA[metric]?.[sex]);
}

/**
 * WHO band rows keyed by integer week, for chart underlay. Includes a few
 * weeks past the child's current age as a small lead-in buffer.
 */
export function buildWhoBandSeries(metric, sex, maxWeek) {
  const rows = WHO_GROWTH_DATA[metric]?.[sex];
  if (!rows) return [];
  const cutoff = Math.min(rows.length - 1, Math.ceil(maxWeek) + 4);
  return rows.slice(0, cutoff + 1).map(([week, p3, p15, p50, p85, p97]) => ({
    week,
    p3,
    p15,
    p50,
    p85,
    p97,
    // Recharts range-Area pattern: a 2-element [low, high] array renders the band
    // directly between those two values, unlike stacked Areas which always anchor at 0.
    outerRange: [p3, p97],
    innerRange: [p15, p85],
  }));
}

/** Child's own measurements re-plotted on an age-in-weeks x-axis instead of calendar date. */
export function toAgeWeekSeries(entries, valueKey, birthDate) {
  return entries
    .map((e) => ({
      week: ageInWeeks(birthDate, e.date),
      value: parseFloat(e[valueKey]),
      entry: e,
    }))
    .filter((d) => Number.isFinite(d.week) && d.week >= 0)
    .sort((a, b) => a.week - b.week);
}
