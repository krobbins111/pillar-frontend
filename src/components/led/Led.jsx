import { arrivalText, isArriving } from "../../lib/format";

// Metro's LED signs, drawn with the Doto dot-matrix font: the platform board (PIDS), the small sign that
// floats over the map, and the head sign on the front of a bus. Screen readers get plain words.

const minLabel = (m) => (m === "ARR" || m === "BRD" ? m : m === "" || m == null ? "--" : String(m));

// rows: [{ line, cars, dest, min }]
export function PidsBoard({ rows, big = false, empty = "NO TRAINS", label = "Next trains" }) {
  return (
    <div className={`pids-board ${big ? "pids-board--big" : ""}`} role="table" aria-label={label}>
      <div className="pids-board__row pids-board__row--head led led--red" role="row" aria-hidden="true">
        <span>LN</span><span>CAR</span><span>DEST</span><span className="pids-board__min">MIN</span>
      </div>
      {rows.length === 0 && <div className="pids-board__row led" role="row"><span className="pids-board__empty">{empty}</span></div>}
      {rows.map((r, i) => (
        <div key={i} role="row" aria-label={`${r.line} line to ${r.dest}, ${arrivalText(r.min)}${r.cars ? `, ${r.cars} cars` : ""}`}
          className={`pids-board__row led ${isArriving(r.min) ? "is-arriving" : ""}`}>
          <span aria-hidden="true">{r.line}</span>
          <span aria-hidden="true" className={String(r.cars) === "8" ? "led--green" : ""}>{r.cars && r.cars !== "-" ? r.cars : "-"}</span>
          <span aria-hidden="true" className="pids-board__dest">{r.dest}</span>
          <span aria-hidden="true" className="pids-board__min">{minLabel(r.min)}</span>
        </div>
      ))}
    </div>
  );
}

// A bus stop's next-bus sign, in the same dot-matrix look as the head sign: route, where it's going, minutes.
// rows: [{ route, dest, min, full }] (full: the whole destination, for screen readers)
export function BusBoard({ rows, empty = "NO BUSES", label = "Next buses" }) {
  const busMin = (m) => (Number(m) === 0 ? "DUE" : minLabel(m));
  return (
    <div className="pids-board pids-board--bus" role="table" aria-label={label}>
      <div className="pids-board__row pids-board__row--head led led--bus-dim" role="row" aria-hidden="true">
        <span>RT</span><span>TO</span><span className="pids-board__min">MIN</span>
      </div>
      {rows.length === 0 && <div className="pids-board__row led led--bus" role="row"><span className="pids-board__empty">{empty}</span></div>}
      {rows.map((r, i) => (
        <div key={i} role="row" aria-label={`${r.route} bus, ${r.full || r.dest}, ${arrivalText(r.min)}`}
          className={`pids-board__row led led--bus ${isArriving(r.min) ? "is-arriving" : ""}`}>
          <span aria-hidden="true">{r.route}</span>
          <span aria-hidden="true" className="pids-board__dest">{r.dest}</span>
          <span aria-hidden="true" className="pids-board__min">{busMin(r.min)}</span>
        </div>
      ))}
    </div>
  );
}

// The front of a bus: route on the left, destination on the right, minutes under it.
export function BusHeadSign({ code, dest, min }) {
  return (
    <div className="bus-sign" role="status" aria-label={`${code} bus to ${dest}${min != null ? `, ${arrivalText(min)}` : ""}`}>
      <span className="led led--bus bus-sign__code" aria-hidden="true">{code}</span>
      <span className="led led--bus bus-sign__dest" aria-hidden="true">{dest}</span>
      {min != null && <span className="led bus-sign__min" aria-hidden="true">{arrivalText(min).toLowerCase()}</span>}
    </div>
  );
}

// "ARR" and "BRD" are what the real signs say; say it in words too.
export function PidsLegend({ rows }) {
  const has = (m) => rows.some((r) => r.min === m);
  if (!has("ARR") && !has("BRD")) return null;
  return (
    <p className="pids-legend">
      {has("ARR") && <><b>ARR</b> means the train is pulling in. </>}
      {has("BRD") && <><b>BRD</b> means it's boarding now. </>}
    </p>
  );
}
