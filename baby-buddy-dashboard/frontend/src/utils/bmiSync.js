import { api } from "../api";
import { calculateBmi } from "./formatters";

/**
 * Call after saving a Weight or Height entry. If a matching entry for the other
 * measurement already exists on the same date, computes BMI and creates or updates the
 * Baby Buddy BMI entry for that date to match - Baby Buddy has no native way to derive BMI
 * from weight+height, and requiring a third manual entry for a value fully determined by
 * two you already logged is redundant. Always keeps the BMI entry in sync with the current
 * weight+height for that date (overwrites a stale or manually-entered value, if any) -
 * best-effort: callers should catch and log, never let this block the save that already
 * succeeded.
 */
export async function syncBmiForDate({ childId, date, weightValue, heightValue, bmis, unitSystem }) {
  const bmi = calculateBmi(weightValue, heightValue, unitSystem);
  if (bmi == null) return;

  const existing = (bmis || []).find((b) => b.date === date);
  if (existing) {
    if (existing.bmi === bmi) return;
    await api.updateBmi(existing.id, { bmi });
  } else {
    await api.createBmi({ child: childId, date, bmi });
  }
}
