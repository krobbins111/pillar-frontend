import { useCallback, useMemo, useState } from "react";

const KEY = "start-from";
const FRESH_FOR = 12 * 60 * 60 * 1000; // a picked or arrived-at place is remembered for 12 hours, then it's Home again
const read = () => {
  try {
    const saved = JSON.parse(localStorage.getItem(KEY));
    return saved && Date.now() - (saved.at || 0) < FRESH_FOR ? saved.place : null;
  } catch { return null; }
};

// The app never uses GPS. Every trip starts from a place the rider picked:
// a saved place, a Metro station, or a neighborhood. It defaults to profile.json's start_from (Home).
export function useOrigin(profile) {
  const [picked, setPicked] = useState(read);
  const fallback = useMemo(() => {
    const places = profile?.places || [];
    const p = places.find((x) => x.name === (profile?.start_from || "Home")) || places[0];
    return p ? { name: p.name, lat: p.lat, lng: p.lng, kind: "saved", icon: p.icon } : null;
  }, [profile]);

  const setOrigin = useCallback((o) => {
    setPicked(o);
    try {
      if (o) localStorage.setItem(KEY, JSON.stringify({ place: o, at: Date.now() }));
      else localStorage.removeItem(KEY);
    } catch { /* private mode */ }
  }, []);

  return { origin: picked || fallback, setOrigin, isDefault: !picked };
}
