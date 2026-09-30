import { useEffect, useMemo, useRef, useState } from "react";
import { Phone } from "lucide-react";

// Choosing a place instead of using GPS: "I'm starting from Home", "I'm at Farragut North", "I'm in Georgetown".
export default function PlacePicker({ title, hint, places = [], stations = [], neighborhoods = [], helper, onPick, onClose }) {
  const [q, setQ] = useState("");
  const top = useRef(null);
  useEffect(() => { top.current?.scrollIntoView({ block: "start" }); }, []);
  const low = q.trim().toLowerCase();
  const match = (name) => !low || name.toLowerCase().includes(low);

  const groups = useMemo(() => {
    const out = [];
    const saved = places.filter((p) => match(p.name)).map((p) => ({ name: p.name, lat: p.lat, lng: p.lng, kind: "saved" }));
    if (saved.length) out.push(["Your places", saved]);
    const seen = new Set();
    const metro = stations
      .filter((s) => !seen.has(s.name) && seen.add(s.name) && match(s.name))
      .sort((a, b) => a.name.localeCompare(b.name))
      .map((s) => ({ name: `${s.name} station`, label: s.name, lat: s.lat, lng: s.lng, kind: "station" }));
    if (metro.length) out.push(["Metro stations", metro]);
    const areas = neighborhoods.filter((n) => match(n.name)).reduce((acc, n) => ({ ...acc, [n.area]: [...(acc[n.area] || []), n] }), {});
    Object.entries(areas).forEach(([area, items]) => out.push([area, items.map((n) => ({ name: n.name, lat: n.lat, lng: n.lng, kind: "neighborhood" }))]));
    return out;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [low, places, stations, neighborhoods]);

  return (
    <section className="picker" aria-label={title} ref={top}>
      <div className="picker__head">
        <h2>{title}</h2>
        {onClose && <button type="button" className="btn btn--quiet" onClick={onClose}>Close</button>}
      </div>
      {hint && <p className="picker__hint">{hint}</p>}
      {helper?.phone && (
        <a className="btn btn--quiet picker__call" href={`tel:${helper.phone}`}><Phone size={20} aria-hidden="true" /> Call {helper.name}</a>
      )}
      <input className="picker__search" value={q} onChange={(e) => setQ(e.target.value)} placeholder="Type a station or neighborhood" aria-label="Search places" />
      {groups.map(([group, items]) => (
        <div key={group} className="picker__group">
          <h3>{group}</h3>
          <div className="picker__items">
            {items.map((p) => (
              <button key={p.name} type="button" className="reply" onClick={() => onPick(p)}>{p.label || p.name}</button>
            ))}
          </div>
        </div>
      ))}
    </section>
  );
}
