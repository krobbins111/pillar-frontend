import { api } from "../../api";
import { usePoll } from "../../hooks/usePoll";
import LineBullet from "../LineBullet";
import { PidsBoard, PidsLegend } from "../led/Led";

// The platform board, filtered to trains that actually stop at your station, plus a plain warning
// about the ones going the other way.
export default function DirectionBoard({ step }) {
  const { data } = usePoll(
    () => api.arrivals({ station: step.board_code, to: step.alight_code, line: step.line.code }),
    20000,
    [step.board_code, step.alight_code],
    Boolean(step.board_code),
  );
  const head = (
    <p className="board-head">
      <LineBullet line={step.line} size="sm" />
      <span>{step.line.name} trains to <b>{step.alight}</b></span>
    </p>
  );
  if (!data) return <div className="pids-wrap">{head}<PidsBoard rows={[]} empty="CHECKING..." /></div>;
  const onLine = (data.trains || []).filter((t) => t.line === step.line.code);
  const good = onLine.filter((t) => t.serves !== false).slice(0, 3);
  const wrong = [...new Set(onLine.filter((t) => t.heading === "wrong_way").map((t) => t.destination))];
  const short = [...new Set(onLine.filter((t) => t.heading === "ends_before").map((t) => t.destination))];
  const ok = [...new Set(good.map((t) => t.destination))];
  const rows = good.map((t) => ({ line: t.line, cars: t.cars, dest: t.destination_short || t.destination, min: t.minutes }));
  return (
    <div className="pids-wrap" role="status" aria-live="polite">
      {head}
      <PidsBoard rows={rows} empty="NO TRAINS YET" label={`${step.line.name} trains to ${step.alight}`} />
      <PidsLegend rows={rows} />
      {ok.length > 1 && <p className="pids__note">Any of these work: {ok.join(" or ")}.</p>}
      {wrong.length > 0 && <p className="pids__note pids__note--wrong">Trains to {wrong.join(" or ")} go the other way. Don't get on those.</p>}
      {short.length > 0 && <p className="pids__note pids__note--wrong">Trains to {short.join(" or ")} end before {step.alight}. Wait for the next one.</p>}
    </div>
  );
}
