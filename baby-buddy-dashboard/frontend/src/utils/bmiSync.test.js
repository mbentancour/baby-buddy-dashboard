import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { api } from "../api";
import { syncBmiForDate } from "./bmiSync";

beforeEach(() => {
  vi.spyOn(api, "createBmi").mockResolvedValue({ id: 1 });
  vi.spyOn(api, "updateBmi").mockResolvedValue({ id: 1 });
});

afterEach(() => {
  vi.restoreAllMocks();
});

describe("syncBmiForDate", () => {
  it("creates a new BMI entry when none exists yet for the date", async () => {
    await syncBmiForDate({
      childId: 1,
      date: "2026-07-23",
      weightValue: 5.2,
      heightValue: 60,
      bmis: [],
      unitSystem: "metric",
    });
    expect(api.createBmi).toHaveBeenCalledWith({ child: 1, date: "2026-07-23", bmi: 14.4 });
    expect(api.updateBmi).not.toHaveBeenCalled();
  });

  it("updates the existing same-date BMI entry instead of creating a duplicate", async () => {
    const bmis = [{ id: 42, date: "2026-07-23", bmi: 13.0 }];
    await syncBmiForDate({
      childId: 1,
      date: "2026-07-23",
      weightValue: 5.2,
      heightValue: 60,
      bmis,
      unitSystem: "metric",
    });
    expect(api.updateBmi).toHaveBeenCalledWith(42, { bmi: 14.4 });
    expect(api.createBmi).not.toHaveBeenCalled();
  });

  it("does nothing when the recalculated value already matches the existing entry", async () => {
    const bmis = [{ id: 42, date: "2026-07-23", bmi: 14.4 }];
    await syncBmiForDate({
      childId: 1,
      date: "2026-07-23",
      weightValue: 5.2,
      heightValue: 60,
      bmis,
      unitSystem: "metric",
    });
    expect(api.updateBmi).not.toHaveBeenCalled();
    expect(api.createBmi).not.toHaveBeenCalled();
  });

  it("does nothing when weight or height is missing/invalid", async () => {
    await syncBmiForDate({
      childId: 1,
      date: "2026-07-23",
      weightValue: null,
      heightValue: 60,
      bmis: [],
      unitSystem: "metric",
    });
    expect(api.createBmi).not.toHaveBeenCalled();
    expect(api.updateBmi).not.toHaveBeenCalled();
  });

  it("only matches a BMI entry on the exact same date", async () => {
    const bmis = [{ id: 42, date: "2026-07-22", bmi: 99 }];
    await syncBmiForDate({
      childId: 1,
      date: "2026-07-23",
      weightValue: 5.2,
      heightValue: 60,
      bmis,
      unitSystem: "metric",
    });
    expect(api.createBmi).toHaveBeenCalledWith({ child: 1, date: "2026-07-23", bmi: 14.4 });
    expect(api.updateBmi).not.toHaveBeenCalled();
  });
});
