import { describe, expect, it } from "vitest";
import { millilitersToOunces, ouncesToMilliliters } from "./units";

describe("volume conversion", () => {
  it("converts fluid ounces to milliliters for API payloads", () => {
    expect(ouncesToMilliliters(1)).toBe(29.574);
    expect(ouncesToMilliliters(2.5)).toBe(73.934);
  });

  it("converts stored milliliters to fluid ounces for editing", () => {
    expect(millilitersToOunces(30)).toBe(1.01);
    expect(millilitersToOunces(120)).toBe(4.06);
  });
});
