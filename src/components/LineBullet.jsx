// Metro's round line bullet for trains; a squared route plate for buses.
export default function LineBullet({ line, kind = "rail", size = "md" }) {
  if (kind === "bus") {
    return <span className={`plate plate--${size}`}>{line.code}</span>;
  }
  const dark = ["YL", "SV"].includes(line.code); // yellow and silver need dark text
  return (
    <span className={`bullet bullet--${size}`} style={{ background: line.color, color: dark ? "#2B211B" : "#fff" }} aria-label={line.name}>
      {line.code}
    </span>
  );
}
