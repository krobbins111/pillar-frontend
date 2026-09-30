import { useEffect } from "react";

// Two looks, taken from the vehicles themselves:
//   rail: brown front, brushed steel and the red/white/blue stripe of the classic Metro railcars, amber LED signs
//   bus:  Metrobus blue with a red accent, steel, and the white-blue LED of the bus head sign
export const THEMES = {
  rail: { brand: "#3A2C26", accent: "#C8102E" },
  bus: { brand: "#27459A", accent: "#C9281E" },
};

// Which look to show: the vehicle you're on (or walking to), else what the map is filtered to,
// else the trip on screen. Mixed or nothing: trains.
export function themeFor({ active, index, trip, mode }) {
  if (active) {
    const rides = active.steps.filter((s) => s.kind !== "walk");
    const step = active.steps[index];
    const current = step.kind !== "walk" ? step : active.steps.slice(index).find((s) => s.kind !== "walk") || rides[rides.length - 1];
    return current?.kind === "bus" ? "bus" : "rail";
  }
  if (mode === "bus" || mode === "rail") return mode;
  const kinds = new Set((trip?.steps || []).filter((s) => s.kind !== "walk").map((s) => s.kind));
  return kinds.size === 1 && kinds.has("bus") ? "bus" : "rail";
}

export function useTheme(name) {
  useEffect(() => {
    document.documentElement.dataset.mode = name;
    document.querySelector('meta[name="theme-color"]')?.setAttribute("content", THEMES[name].brand);
  }, [name]);
  return THEMES[name];
}
