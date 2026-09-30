import { useEffect, useRef } from "react";
import RichText from "./RichText";
import TripCard from "./TripCard";

export default function Thread({ messages, busy, previewId, onSelect, onStart, limit, origin, reminders, onElevators }) {
  const shown = limit ? messages.slice(-limit) : messages;
  const latest = useRef(null);
  // Bring each new answer into view, so a new plan never lands out of sight below an old one. During a trip (limit),
  // just far enough to read it, keeping the step in view where possible.
  useEffect(() => {
    if (messages.length && messages[messages.length - 1].role === "assistant") {
      latest.current?.scrollIntoView({ block: limit ? "nearest" : "start", behavior: "smooth" });
    }
  }, [messages.length, limit]); // eslint-disable-line react-hooks/exhaustive-deps
  return (
    <div className="thread" aria-live="polite">
      {shown.map((m, i) =>
        m.role === "user" ? (
          <p key={i} className="bubble">{m.content}</p>
        ) : (
          <div key={i} ref={i === shown.length - 1 ? latest : null} className={`answer ${m.error ? "answer--error" : ""}`}>
            <RichText text={m.content} />
            {m.trips?.map((t) => (
              <TripCard key={t.id} trip={t} selected={t.id === previewId} onSelect={onSelect} onStart={onStart}
                plan={m.plan} origin={m.plan?.origin || origin} reminders={reminders} stepFree={Boolean(m.plan?.step_free)}
                onElevators={onElevators} busy={busy} />
            ))}
          </div>
        ),
      )}
      {busy && <p className="answer answer--thinking">Checking the trains and buses…</p>}
    </div>
  );
}
