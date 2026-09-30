import { CircleCheck, TriangleAlert } from "lucide-react";
import { api } from "../api";
import { usePoll } from "../hooks/usePoll";
import { lineFor } from "../lib/lines";
import LineBullet from "./LineBullet";

// "Right now" on the welcome screen: Metro problems on the lines near the starting place, and the weather there.
export default function StatusStrip({ origin }) {
  const has = origin?.lat != null;
  const { data } = usePoll(() => api.status({ lat: origin?.lat, lng: origin?.lng }), 120000,
    [origin?.lat, origin?.lng], has);
  if (!data) return null;
  const incidents = data.rail_incidents || [];
  const checked = Array.isArray(data.rail_incidents); // null: Metro's alerts couldn't be checked, so claim nothing
  const notes = data.weather_notes || [];
  return (
    <section className="status" aria-label="Right now">
      <p className="status__head">
        <span>Right now{data.station ? ` near ${data.station}` : ""}</span>
        {data.weather?.text && <b>{data.weather.text}</b>}
      </p>
      {checked && incidents.length === 0 && (
        <p className="status__ok"><CircleCheck size={18} aria-hidden="true" /> Metro trains are running normally.</p>
      )}
      {incidents.slice(0, 3).map((i, k) => (
        <p key={k} className="status__item">
          <span className="status__lines">{i.lines.map((c) => <LineBullet key={c} line={lineFor(c)} size="sm" />)}</span>
          <span>{i.text}</span>
        </p>
      ))}
      {notes.slice(0, 1).map((n, k) => (
        <p key={k} className="status__item status__item--weather"><TriangleAlert size={18} aria-hidden="true" /> <span>{n.text}</span></p>
      ))}
    </section>
  );
}
