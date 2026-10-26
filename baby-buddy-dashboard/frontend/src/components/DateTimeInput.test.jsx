import { describe, expect, it } from "vitest";
import { formatTimeDigits, isValidTime } from "./DateTimeInput";

describe("DateTimeInput time entry", () => {
  it("formats four keyboard digits as HH:MM", () => {
    expect(formatTimeDigits("1530")).toBe("15:30");
    expect(formatTimeDigits("09:45")).toBe("09:45");
  });

  it("accepts valid 24-hour times and rejects incomplete or invalid values", () => {
    expect(isValidTime("00:00")).toBe(true);
    expect(isValidTime("23:59")).toBe(true);
    expect(isValidTime("24:00")).toBe(false);
    expect(isValidTime("9:30")).toBe(false);
  });
});
