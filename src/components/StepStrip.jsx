import { Footprints } from "lucide-react";
import LineBullet from "./LineBullet";

// The whole trip at a glance: walk 5, Red Line 2 stops, walk 4.
export default function StepStrip({ steps }) {
  return (
    <ol className="strip" aria-label="Trip overview">
      {steps.map((s, i) => (
        <li key={i} className="strip__item">
          {s.kind === "walk" ? (
            <><Footprints size={18} aria-hidden="true" /><span>{s.minutes} min</span></>
          ) : (
            <><LineBullet line={s.line} kind={s.kind} size="sm" /><span>{s.stops} stop{s.stops === 1 ? "" : "s"}</span></>
          )}
        </li>
      ))}
    </ol>
  );
}
