// Where you are on the train, estimated from when you boarded.
// Time-based on purpose: GPS doesn't work in Metro tunnels.
export function stopsRemaining(step, boardedAt, now) {
  const n = Math.max(1, step.stops);
  if (!boardedAt) return n;
  const fraction = Math.min(1, (now - boardedAt) / 1000 / Math.max(60, step.seconds));
  return Math.max(1, n - Math.floor(fraction * n));
}

export default function StopProgress({ step, boardedAt, now }) {
  const n = Math.max(1, step.stops);
  const passed = n - stopsRemaining(step, boardedAt, now);
  const dots = Array.from({ length: n + 1 }, (_, i) => i);
  return (
    <div className="progress" style={{ "--line": step.line.color }} aria-label={`${n - passed} stops to go`}>
      <div className="progress__track">
        {dots.map((i) => (
          <span
            key={i}
            className={`progress__dot ${i <= passed ? "progress__dot--passed" : ""} ${i === n ? "progress__dot--yours" : ""}`}
          />
        ))}
      </div>
      <div className="progress__ends">
        <span>{step.board}</span>
        <span className="progress__yours">{step.alight}</span>
      </div>
    </div>
  );
}
