import { useState } from "react";
import { dcParts, dcTime } from "../lib/format";

const MODES = [
  { id: "now", label: "Leave now" },
  { id: "depart", label: "Leave at" },
  { id: "arrive", label: "Arrive by" },
];

// A starting guess for the time pickers: an hour from now, on the quarter hour.
function suggested(now = Date.now()) {
  const q = 15 * 60000;
  return new Date(Math.ceil((now + 3600000) / q) * q).toISOString();
}

// "When?" Leave now, leave at a time, or arrive by a time. Big native pickers; all times are DC time.
// Opens from the nav bar's sentence; closes on Done or Cancel.
export function WhenSheet({ when, onChange, onClose }) {
  const [mode, setMode] = useState(when.mode);
  const [parts, setParts] = useState(dcParts(when.at || suggested()));
  const [problem, setProblem] = useState("");

  const today = dcParts(new Date().toISOString()).date;
  const tomorrow = dcParts(new Date(Date.now() + 86400000).toISOString()).date;
  const latest = dcParts(new Date(Date.now() + 30 * 86400000).toISOString()).date;

  const done = () => {
    if (mode === "now") {
      onChange({ mode: "now" });
      return;
    }
    const at = dcTime(parts.date, parts.time);
    if (new Date(at) < Date.now() - 60000) {
      setProblem("That time has already passed. Pick a later time.");
      return;
    }
    setProblem("");
    onChange({ mode, at });
  };

  return (
    <div className="when-sheet" role="group" aria-label="When do you want to go?">
      <p className="when-sheet__title">When?</p>
      <div className="seg" role="radiogroup">
        {MODES.map((m) => (
          <button key={m.id} type="button" role="radio" aria-checked={mode === m.id}
            className={`seg__btn ${mode === m.id ? "is-on" : ""}`} onClick={() => setMode(m.id)}>
            {m.label}
          </button>
        ))}
      </div>
      {mode !== "now" && (
        <>
          <div className="seg seg--days" role="radiogroup" aria-label="Day">
            {[[today, "Today"], [tomorrow, "Tomorrow"]].map(([d, label]) => (
              <button key={d} type="button" role="radio" aria-checked={parts.date === d}
                className={`seg__btn ${parts.date === d ? "is-on" : ""}`} onClick={() => setParts((p) => ({ ...p, date: d }))}>
                {label}
              </button>
            ))}
            <label className={`seg__btn seg__date ${parts.date !== today && parts.date !== tomorrow ? "is-on" : ""}`}>
              <span>Other day</span>
              <input type="date" value={parts.date} min={today} max={latest}
                onChange={(e) => e.target.value && setParts((p) => ({ ...p, date: e.target.value }))} />
            </label>
          </div>
          <label className="when-sheet__time">
            <span>{mode === "arrive" ? "Be there by" : "Leave at"}</span>
            <input type="time" step="300" value={parts.time}
              onChange={(e) => e.target.value && setParts((p) => ({ ...p, time: e.target.value }))} />
          </label>
        </>
      )}
      {problem && <p className="when-sheet__problem" role="alert">{problem}</p>}
      <div className="when-sheet__actions">
        <button type="button" className="btn btn--quiet" onClick={() => { setProblem(""); onClose(); }}>Cancel</button>
        <button type="button" className="btn btn--primary" onClick={done}>Done</button>
      </div>
    </div>
  );
}
