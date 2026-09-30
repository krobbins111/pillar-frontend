import { Check } from "lucide-react";
import { stopsRemaining } from "../StopProgress";

// Your ride as a strip map: where you got on, each stop you'll pass, and your stop.
// Progress is estimated from the time since "I'm on the train" (GPS doesn't work in tunnels, and we don't use it anyway).
export default function LineDiagram({ step, boardedAt, now, riding }) {
  const stops = step.stop_list?.length ? step.stop_list : null;
  const n = stops ? stops.length : Math.max(1, step.stops);
  const passed = riding ? n - stopsRemaining({ ...step, stops: n }, boardedAt, now) : 0;
  const rows = [{ name: step.board, state: "board" }];
  (stops || Array.from({ length: n }, (_, i) => (i === n - 1 ? step.alight : null))).forEach((name, i) => {
    rows.push({ name, state: i < passed ? "passed" : i === n - 1 ? "yours" : i === passed ? "next" : "ahead", i });
  });
  const shown = compact(rows, passed);
  return (
    <ol className="diagram" style={{ "--line": step.line.color }} aria-label={`${n - passed} stops to go`}>
      {shown.map((r, k) => r.gap ? (
        <li key={`gap-${k}`} className="diagram__row diagram__row--gap"><span className="diagram__dot" /><span>{r.gap}</span></li>
      ) : (
        <li key={k} className={`diagram__row diagram__row--${r.state}`}>
          <span className="diagram__dot">{(r.state === "passed" || r.state === "board") && <Check size={12} strokeWidth={3.5} aria-hidden="true" />}</span>
          <span className="diagram__name">{r.name || "Stop"}</span>
          {r.state === "board" && <span className="diagram__tag diagram__tag--muted">Got on here</span>}
          {r.state === "next" && riding && <span className="diagram__tag">Next stop</span>}
          {r.state === "yours" && <span className="diagram__tag diagram__tag--yours">{riding && passed === n - 1 ? "Get off next" : "Get off here"}</span>}
        </li>
      ))}
    </ol>
  );
}

// Long bus rides: keep where you are, the next few stops, and your stop; fold the rest.
function compact(rows, passed) {
  if (rows.length <= 8) return rows;
  const at = passed + 1;
  const keep = new Set([0, rows.length - 2, rows.length - 1, at - 1, at, at + 1, at + 2].filter((i) => i >= 0 && i < rows.length));
  const out = [];
  let skipped = 0;
  rows.forEach((r, i) => {
    if (keep.has(i)) {
      if (skipped) out.push({ gap: `${skipped} more stop${skipped === 1 ? "" : "s"}` });
      skipped = 0;
      out.push(r);
    } else skipped += 1;
  });
  return out;
}
