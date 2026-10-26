import { createContext, useContext } from "react";

const labels = {
  metric: { volume: "mL", weight: "kg", length: "cm", temp: "°C" },
  imperial: { volume: "oz", weight: "lb", length: "in", temp: "°F" },
};

const ML_PER_FLUID_OUNCE = 29.5735295625;

export const UnitContext = createContext("metric");

export function useUnits() {
  const system = useContext(UnitContext);
  return labels[system] || labels.metric;
}

export function ouncesToMilliliters(value) {
  return Math.round(Number(value) * ML_PER_FLUID_OUNCE * 1000) / 1000;
}

export function millilitersToOunces(value) {
  return Math.round((Number(value) / ML_PER_FLUID_OUNCE) * 100) / 100;
}
