import { api } from "../api";
import { usePoll } from "../hooks/usePoll";
import { lineFor } from "../lib/lines";
import LineBullet from "./LineBullet";
import { BusBoard, PidsBoard, PidsLegend } from "./led/Led";

// Bus signs abbreviate so the destination fits: "Mt Vernon Square" -> "Mt Vernon Sq".
const SHORT = [[/\bSquare\b/gi, "Sq"], [/\bHeights\b/gi, "Hts"], [/\bStation\b/gi, "Sta"], [/\bAvenue\b/gi, "Ave"],
  [/\bStreet\b/gi, "St"], [/\bCenter\b/gi, "Ctr"], [/\bRoad\b/gi, "Rd"], [/\bCircle\b/gi, "Cir"], [/\bHospital\b/gi, "Hosp"]];
const shorten = (text) => SHORT.reduce((t, [re, abbr]) => t.replace(re, abbr), text);

// A quick look before planning anything, on the first screen only: the platform board at the rider's station, like
// the one on the wall there. Starting from Home, that's the home station in profile.json; from anywhere else, the
// station nearest to it. In the bus look, the next buses at the stop nearest the starting point.
export default function HomeBoard({ origin, station, mode }) {
  const bus = mode === "bus";
  const near = origin?.lat != null ? { lat: origin.lat, lng: origin.lng } : null;
  const key = bus
    ? (near ? `bus:${near.lat.toFixed(4)},${near.lng.toFixed(4)}` : "")
    : station || (near ? `rail:${near.lat.toFixed(4)},${near.lng.toFixed(4)}` : "");
  const { data, error } = usePoll(
    () => api.arrivals(bus ? { ...near, mode: "bus" } : station ? { station } : near),
    20000,
    [key],
    Boolean(key),
  );
  if (!key || data?.error || (error && !data)) return null; // nowhere to look, or no station close by

  if (bus) {
    const rows = (data?.buses || []).slice(0, 5).map((b) => {
      const to = String(b.direction || "").replace(/^(north|south|east|west|clockwise|counterclockwise|loop)\s+to\s+/i, "");
      return { route: b.route, dest: shorten(to), full: b.direction, min: b.minutes };
    });
    const stop = data?.stop || "The nearest bus stop";
    return (
      <section className="homeboard" aria-label={`Next buses at ${stop}`}>
        <p className="homeboard__title">
          <LineBullet kind="bus" line={{ code: "BUS" }} size="sm" />
          <span>{stop}</span>
        </p>
        <BusBoard rows={rows} empty={data ? "NO BUSES LISTED" : "CHECKING..."} label={`Next buses at ${stop}`} />
      </section>
    );
  }

  const name = data?.station?.name || "Your station";
  const rows = (data?.trains || []).slice(0, 6).map((t) => ({
    line: t.line, cars: t.cars, dest: t.destination_short || t.destination, min: t.minutes,
  }));
  return (
    <section className="homeboard" aria-label={`Next trains at ${name}`}>
      <p className="homeboard__title">
        {(data?.station?.lines || []).map((code) => <LineBullet key={code} line={lineFor(code)} size="sm" />)}
        <span>{name}</span>
      </p>
      <PidsBoard rows={rows} empty={data ? "NO TRAINS LISTED" : "CHECKING..."} label={`Next trains at ${name}`} />
      <PidsLegend rows={rows} />
    </section>
  );
}
