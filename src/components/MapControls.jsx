import { Layers, LocateFixed } from "lucide-react";
import { BusIcon, TrainIcon } from "./icons/Transit";

// Right-side map buttons (text size is in the nav bar). Trains / Buses fade the other mode so the one you care about stands out;
// tap the lit one again to show both.
export default function MapControls({ explore, onExplore, onRecenter, hasTrip, mode, onMode }) {
  const toggle = (m) => onMode(mode === m ? "all" : m);
  return (
    <div className="controls">
      {hasTrip && (
        <button type="button" className={`control ${explore ? "is-on" : ""}`} onClick={onExplore} aria-pressed={explore}>
          <Layers size={20} aria-hidden="true" /><span>{explore ? "All lines" : "My trip"}</span>
        </button>
      )}
      <div className="modes" role="group" aria-label="Show on map">
        <button type="button" className={`control mode mode--rail ${mode === "rail" ? "is-on" : ""}`} onClick={() => toggle("rail")} aria-pressed={mode === "rail"}>
          <TrainIcon size={26} /><span>Trains</span>
        </button>
        <button type="button" className={`control mode mode--bus ${mode === "bus" ? "is-on" : ""}`} onClick={() => toggle("bus")} aria-pressed={mode === "bus"}>
          <BusIcon size={26} /><span>Buses</span>
        </button>
      </div>
      <button type="button" className="control control--icon" onClick={onRecenter} aria-label={hasTrip ? "Show my trip" : "Show my starting place"}>
        <LocateFixed size={22} />
      </button>
    </div>
  );
}
