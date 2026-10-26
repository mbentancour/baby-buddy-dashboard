import { describe, expect, it } from "vitest";
import { aggregateByDayOfWeek } from "./formatters";

function localDateAt(daysAgo, hour) {
  const date = new Date();
  date.setDate(date.getDate() - daysAgo);
  date.setHours(hour, 0, 0, 0);
  return date.toISOString();
}

describe("aggregateByDayOfWeek", () => {
  it("aggregates pumping volume and session count for each day", () => {
    const result = aggregateByDayOfWeek(
      [
        { start: localDateAt(1, 8), amount: 30.5 },
        { start: localDateAt(1, 15), amount: 60 },
        { start: localDateAt(0, 9), amount: 45 },
      ],
      "amount"
    );

    expect(result.at(-2)).toMatchObject({ amount: 91, count: 2 });
    expect(result.at(-1)).toMatchObject({ amount: 45, count: 1 });
  });
});
