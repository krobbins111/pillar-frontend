import { Check, Footprints } from "lucide-react";
import LineBullet from "../LineBullet";

// The whole trip in one row, with the step you're on lit up.
export default function JourneyStrip({ steps, index }) {
  return (
    <ol className="journey" aria-label="Your trip">
      {steps.map((s, i) => {
        const state = i < index ? "done" : i === index ? "now" : "later";
        return (
          <li key={i} className={`journey__item journey__item--${state}`} aria-current={state === "now" ? "step" : undefined}>
            {state === "done" ? <Check size={16} strokeWidth={3} aria-hidden="true" />
              : s.kind === "walk" ? <Footprints size={17} aria-hidden="true" />
                : <LineBullet line={s.line} kind={s.kind} size="sm" />}
            <span>{s.kind === "walk" ? `${s.minutes} min` : `${s.stops} stop${s.stops === 1 ? "" : "s"}`}</span>
          </li>
        );
      })}
    </ol>
  );
}
