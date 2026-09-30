import { useEffect, useState } from "react";

const QUERY = "(min-width: 820px)";

// ?view=counter for the always-on screen, ?view=split or ?view=companion to force one.
export function useLayout() {
  const forced = new URLSearchParams(window.location.search).get("view");
  const [wide, setWide] = useState(() => window.matchMedia(QUERY).matches);
  useEffect(() => {
    const m = window.matchMedia(QUERY);
    const onChange = (e) => setWide(e.matches);
    m.addEventListener("change", onChange);
    return () => m.removeEventListener("change", onChange);
  }, []);
  return forced || (wide ? "split" : "companion");
}
