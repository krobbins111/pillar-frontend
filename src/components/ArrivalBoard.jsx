import { PidsBoard, PidsLegend } from "./led/Led";

// Full-size platform board for the counter screen.
export default function ArrivalBoard({ trains }) {
  if (!trains) return <PidsBoard rows={[]} big empty="CHECKING..." />;
  if (!trains.length) return <PidsBoard rows={[]} big empty="NO TRAINS LISTED" />;
  const rows = trains.slice(0, 6).map((t) => ({ line: t.line, cars: t.cars, dest: t.destination_short || t.destination, min: t.minutes }));
  return (
    <div className="pids-wrap">
      <PidsBoard rows={rows} big />
      <PidsLegend rows={rows} />
    </div>
  );
}
