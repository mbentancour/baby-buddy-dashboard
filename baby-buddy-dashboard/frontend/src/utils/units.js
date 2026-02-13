import { createContext, useContext } from "react";

const labels = {
  metric: { volume: "mL", weight: "kg", length: "cm", temp: "°C" },
  imperial: { volume: "oz", weight: "lb", length: "in", temp: "°F" },
};

export const UnitContext = createContext("metric");

export function useUnits() {
  const system = useContext(UnitContext);
  return labels[system] || labels.metric;
}
