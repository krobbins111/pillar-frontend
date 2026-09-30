import { useEffect, useState } from "react";

// Poll while the tab is visible. Pauses in the background to save API calls.
export function usePoll(fn, ms, deps, enabled = true) {
  const [data, setData] = useState(null);
  const [error, setError] = useState(null);
  useEffect(() => {
    if (!enabled) return undefined;
    let alive = true;
    let timer;
    const tick = async () => {
      if (document.visibilityState !== "hidden") {
        try {
          const next = await fn();
          if (alive) { setData(next); setError(null); }
        } catch (e) {
          if (alive) setError(e);
        }
      }
      if (alive) timer = setTimeout(tick, ms);
    };
    tick();
    return () => { alive = false; clearTimeout(timer); };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [...deps, enabled]);
  return { data, error };
}
