// Shorter button text where space is tight; the full phrase is still what gets sent and read aloud.
const SHORT = { "I can't find the train": "Can't find it", "I can't find the bus": "Can't find it", "I missed my stop": "Missed my stop" };

export default function QuickReplies({ choices, onPick, disabled, compact = false }) {
  if (!choices?.length) return null;
  return (
    <div className="replies" role="group" aria-label="Quick answers">
      {choices.map((c) => (
        <button key={c} type="button" className="reply" onClick={() => onPick(c)} disabled={disabled} aria-label={c}>
          {compact ? SHORT[c] || c : c}
        </button>
      ))}
    </div>
  );
}
