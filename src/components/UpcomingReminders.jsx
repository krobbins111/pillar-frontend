import { BellRing, X } from "lucide-react";
import { clock, dayWord } from "../lib/format";

// Trips the rider asked to be reminded about. Tapping one opens it; X cancels the reminder.
export default function UpcomingReminders({ list, onOpen, onCancel }) {
  if (!list?.length) return null;
  return (
    <section className="upcoming" aria-label="Upcoming trips">
      <h2 className="upcoming__title">Upcoming trips</h2>
      <ul>
        {list.map((r) => (
          <li key={r.id} className="upcoming__item">
            <button type="button" className="upcoming__open" onClick={() => onOpen(r.id)}>
              <BellRing size={20} aria-hidden="true" />
              <span>
                <b>{r.destination}</b>
                <small>{dayWord(r.leave_at)}, leave at {clock(r.leave_at)}{r.arrive_by ? ` · arrive by ${clock(r.arrive_by)}` : ""}</small>
              </span>
            </button>
            <button type="button" className="upcoming__cancel" onClick={() => onCancel(r.id)} aria-label={`Cancel the reminder for ${r.destination}`}>
              <X size={20} />
            </button>
          </li>
        ))}
      </ul>
    </section>
  );
}
