import { api } from "../api";
import { usePoll } from "../hooks/usePoll";
import { arrivalText, isArriving } from "../lib/format";
import LineBullet from "./LineBullet";
import { BusHeadSign } from "./led/Led";

// A small Metro platform sign in LED: amber for trains, white-blue for buses. Live.
// Pass a station code (and optionally a line, and `to` = the station you're riding to, so only trains that
// stop there are shown), or a bus stop id, or a place for the station nearest to it.
// variant="head" draws the bus's own head sign instead of the small pill.
export default function ArrivalSign({ station, line, to, stopId, busRoute, near, label, variant = "pill", headsign, mode }) {
  const bus = mode === "bus"; // near a place: the nearest bus stop instead of the nearest station
  const key = station ? `${station}-${to || ""}` : stopId || (near ? `${bus ? "bus" : "rail"}:${near.lat.toFixed(3)},${near.lng.toFixed(3)}` : "");
  const { data } = usePoll(
    () => api.arrivals(stopId ? { stop_id: stopId } : station ? { station, to, line }
      : { lat: near.lat, lng: near.lng, mode: bus ? "bus" : undefined }),
    20000,
    [key],
    Boolean(key),
  );
  if (!data) return variant === "head" && busRoute ? <BusHeadSign code={busRoute} dest={headsign || ""} /> : null;

  if (stopId || bus) {
    const next = (data.buses || []).find((b) => !busRoute || b.route === busRoute);
    if (variant === "head") return <BusHeadSign code={busRoute} dest={headsign || next?.direction || ""} min={next?.minutes} />;
    if (!next) return null;
    return (
      <div className={`sign sign--bus ${isArriving(next.minutes) ? "sign--arriving" : ""}`} role="status"
        aria-label={`${next.route} bus, ${next.direction}, ${arrivalText(next.minutes)}`}>
        <LineBullet kind="bus" line={{ code: next.route }} size="sm" />
        <span className="sign__where led led--bus" aria-hidden="true">{next.direction}</span>
        <span className="sign__min led" aria-hidden="true">{arrivalText(next.minutes)}</span>
      </div>
    );
  }

  const trains = (data.trains || []).filter((t) => (!line || t.line === line) && t.serves !== false);
  const next = trains[0];
  if (!next) return null;
  const where = label || next.destination_short || next.destination;
  return (
    <div className={`sign ${isArriving(next.minutes) ? "sign--arriving" : ""}`} role="status" aria-live="polite"
      aria-label={`${next.line} line to ${next.destination}, ${arrivalText(next.minutes)}`}>
      <LineBullet line={{ code: next.line, color: next.color, name: `${next.line} line` }} size="sm" />
      <span className="sign__where led" aria-hidden="true">{where}</span>
      <span className="sign__min led" aria-hidden="true">{arrivalText(next.minutes)}</span>
    </div>
  );
}
