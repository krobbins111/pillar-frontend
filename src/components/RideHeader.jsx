import { Footprints } from "lucide-react";
import LineBullet from "./LineBullet";

// The station pylon: in the look's color with its stripe, one line bullet, what you're doing right now.
export default function RideHeader({ trip, index }) {
  const step = trip.steps[index];
  const walking = step.kind === "walk";
  return (
    <header className="pylon">
      {walking ? (
        <span className="pylon__walk"><Footprints size={22} aria-hidden="true" /></span>
      ) : (
        <LineBullet line={step.line} kind={step.kind} size="lg" />
      )}
      <div className="pylon__text">
        <strong>{walking ? step.title : `${step.kind === "rail" ? step.line.name : `${step.line.code} bus`} toward ${step.headsign}`}</strong>
        <span>{walking ? step.detail : `Get off at ${step.alight}`}</span>
      </div>
    </header>
  );
}
