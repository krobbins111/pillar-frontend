import { useState } from "react";
import {
  BellRing, CircleCheck, Cloud, CloudLightning, CloudRain, CloudSun, Snowflake, Sun, TriangleAlert,
} from "lucide-react";
import { clock, leaveText, minutesUntil } from "../lib/format";
import { useNow } from "../hooks/useNow";
import StepStrip from "./StepStrip";

function WeatherIcon({ w }) {
  const t = (w.text || "").toLowerCase();
  const Icon = /thunder|storm/.test(t) ? CloudLightning : /snow|sleet|ice/.test(t) ? Snowflake
    : /rain|shower|drizzle/.test(t) || w.rain >= 50 ? CloudRain : /partly|mostly sunny/.test(t) ? CloudSun
      : /cloud|overcast|fog/.test(t) ? Cloud : Sun;
  return <Icon size={18} aria-hidden="true" />;
}

export default function TripCard({ trip, selected, onSelect, onStart, plan, origin, reminders, stepFree, onElevators, busy }) {
  const now = useNow(20000);
  const s = trip.summary;
  const transfers = s.transfers === 0 ? "No transfers" : `${s.transfers} transfer${s.transfers > 1 ? "s" : ""}`;
  const hasRail = trip.steps.some((st) => st.kind === "rail");
  // Live service problems first, then weather worth knowing before you go (rain, heat, alerts).
  const notes = trip.steps.flatMap((st) => st.watch_out || []);
  const alerts = [...notes.filter((n) => n.kind === "incident"), ...notes.filter((n) => n.kind === "weather").slice(0, 1)];
  const later = minutesUntil(s.leave_at, now) > 20;
  // Elevator status is live, so it's only worth showing for trips that leave soon and use a station.
  const showElevators = s.elevators_checked && hasRail && minutesUntil(s.leave_at, now) <= 90;
  const canRemind = reminders?.available && minutesUntil(s.leave_at, now) > 2;
  const [reminder, setReminder] = useState(null);
  const [problem, setProblem] = useState("");
  const already = reminder || reminders?.has(trip);

  const remind = async (e) => {
    e.stopPropagation();
    setProblem("");
    try {
      setReminder(await reminders.remind({ trip, plan, origin }));
    } catch (err) {
      setProblem(err.message);
    }
  };

  return (
    <article
      className={`trip ${selected ? "trip--selected" : ""}`}
      onClick={() => onSelect(trip.id)}
      aria-current={selected ? "true" : undefined}
    >
      <header className="trip__head">
        <span className="trip__label">{trip.label}</span>
        {showElevators && (
          s.elevator_issue
            ? <span className="trip__elevator trip__elevator--issue"><TriangleAlert size={16} aria-hidden="true" /> Elevator out</span>
            : <span className="trip__elevator"><CircleCheck size={16} aria-hidden="true" /> Elevators working</span>
        )}
      </header>
      <div className="trip__time">
        <span className="trip__leave">{leaveText(s, now)}</span>
        <span className="trip__arrive">Arrive {clock(s.arrive_at)}</span>
      </div>
      <StepStrip steps={trip.steps} />
      <p className="trip__facts">
        {transfers}, {s.walk_min} min walking
        {s.weather?.text && <span className="trip__weather"><WeatherIcon w={s.weather} /> {s.weather.text}</span>}
      </p>
      {alerts.slice(0, 2).map((n, i) => (
        <p key={i} className={`trip__alert trip__alert--${n.tone}`}>{n.kind === "weather" && n.tone !== "caution" ? <CloudRain size={18} aria-hidden="true" /> : <TriangleAlert size={18} aria-hidden="true" />} <span>{n.text}</span></p>
      ))}

      {selected && hasRail && onElevators && (
        <div className="trip__inside" onClick={(e) => e.stopPropagation()}>
          <span>In the stations, use</span>
          <div className="seg seg--small" role="radiogroup" aria-label="Inside stations">
            {[[false, "Escalators"], [true, "Elevators only"]].map(([on, label]) => (
              <button key={label} type="button" role="radio" aria-checked={stepFree === on} disabled={busy}
                className={`seg__btn ${stepFree === on ? "is-on" : ""}`} onClick={() => stepFree !== on && onElevators(on)}>
                {label}
              </button>
            ))}
          </div>
        </div>
      )}

      {selected && (
        <div className="trip__actions">
          {canRemind && (already ? (
            <p className="trip__reminded"><BellRing size={20} aria-hidden="true" /> I'll remind you at {clock(new Date(Date.parse((reminder || s).leave_at) - 600000))} and again when it's time to go.</p>
          ) : (
            <button type="button" className={`btn btn--block ${later ? "btn--primary" : "btn--quiet"}`} onClick={remind}>
              <BellRing size={20} aria-hidden="true" /> Remind me when to leave
            </button>
          ))}
          {problem && <p className="trip__problem" role="alert">{problem}</p>}
          <button type="button" className={`btn btn--block ${later && canRemind ? "btn--quiet" : "btn--primary"}`}
            onClick={(e) => { e.stopPropagation(); onStart(trip); }}>
            {later ? "Start trip now" : "Start trip"}
          </button>
        </div>
      )}
    </article>
  );
}
