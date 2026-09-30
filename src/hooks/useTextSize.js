import { useEffect, useState } from "react";

const KEY = "text-size";
const read = () => { try { return localStorage.getItem(KEY); } catch { return null; } };

export function useTextSize(fallback = "large") {
  const [size, setSize] = useState(() => read() || fallback);
  useEffect(() => {
    document.documentElement.dataset.size = size;
    try { localStorage.setItem(KEY, size); } catch { /* private mode */ }
  }, [size]);
  return [size, () => setSize((s) => (s === "large" ? "xlarge" : "large"))];
}
