import { ArrowUp, ArrowUpLeft, ArrowUpRight, CornerUpLeft, CornerUpRight, DoorOpen, RotateCw, Undo2 } from "lucide-react";

const TURN = {
  TURN_LEFT: CornerUpLeft, TURN_SHARP_LEFT: CornerUpLeft, TURN_SLIGHT_LEFT: ArrowUpLeft, FORK_LEFT: ArrowUpLeft, RAMP_LEFT: ArrowUpLeft,
  TURN_RIGHT: CornerUpRight, TURN_SHARP_RIGHT: CornerUpRight, TURN_SLIGHT_RIGHT: ArrowUpRight, FORK_RIGHT: ArrowUpRight, RAMP_RIGHT: ArrowUpRight,
  UTURN_LEFT: Undo2, UTURN_RIGHT: Undo2, ROUNDABOUT_LEFT: RotateCw, ROUNDABOUT_RIGHT: RotateCw,
};
const iconFor = (t) => TURN[t.maneuver] || (/enter|station|exit/i.test(t.text) ? DoorOpen : ArrowUp);

// Turn-by-turn walking, with an arrow for each turn. Shown open: riders asked for more detail, not less.
export default function TurnList({ turns }) {
  if (!turns?.length) return null;
  return (
    <section className="turns" aria-label="Walking directions">
      <h3 className="guide__title">Walking directions</h3>
      <ol>
        {turns.map((t, i) => {
          const Icon = iconFor(t);
          return (
            <li key={i} className="turn">
              <span className="turn__arrow"><Icon size={24} strokeWidth={2.4} aria-hidden="true" /></span>
              <span className="turn__text">{t.text}</span>
              {t.distance && <span className="turn__dist">{t.distance}</span>}
            </li>
          );
        })}
      </ol>
    </section>
  );
}
