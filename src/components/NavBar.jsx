import { useState } from "react";
import { ChevronDown, Type } from "lucide-react";
import { whenWords } from "../lib/format";
import Brand from "./Brand";
import { WhenSheet } from "./WhenPicker";

// Pinned across the top of every screen, so the chat never scrolls it away: the app's name, room for more app-wide
// buttons, and what the planner will use, read as one sentence with the words you can change:
//   "I'm leaving from [Home] and want to [leave] [now]."
// During a trip it says where you're headed instead (the start and time can't change mid-trip).
export default function NavBar({ origin, when, onWhen, onPickStart, onTextSize, trip }) {
  const [open, setOpen] = useState(false);
  const words = whenWords(when);
  const toggle = () => setOpen((o) => !o);
  return (
    <header className="nav">
      <div className="nav__row">
        <Brand />
        <div className="nav__tools">
          <button type="button" className="nav__tool" onClick={onTextSize} aria-label="Change text size">
            <Type size={18} aria-hidden="true" /><span>Text size</span>
          </button>
        </div>
      </div>
      {trip ? (
        <p className="nav__sentence">I'm on my way to <b className="nav__fixed">{trip.summary.destination}</b>.</p>
      ) : (
        <p className="nav__sentence">
          I'm leaving from{" "}
          <Word onClick={() => { setOpen(false); onPickStart(); }} hint="Change where you're starting">{origin?.name || "somewhere"}</Word>
          {" "}and want to{" "}
          <Word onClick={toggle} open={open} hint="Change when">{words.verb}</Word>{" "}
          <Word onClick={toggle} open={open} hint="Change the time">{words.time}</Word>.
        </p>
      )}
      {open && !trip && (
        <div className="nav__drawer">
          <WhenSheet when={when} onChange={(next) => { onWhen(next); setOpen(false); }} onClose={() => setOpen(false)} />
        </div>
      )}
    </header>
  );
}

function Word({ children, onClick, open, hint }) {
  return (
    <button type="button" className={`nav__word ${open ? "is-open" : ""}`} onClick={onClick}
      aria-label={`${children}. ${hint}`} aria-expanded={open === undefined ? undefined : open}>
      <span>{children}</span><ChevronDown size={16} aria-hidden="true" />
    </button>
  );
}
