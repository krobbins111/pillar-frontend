import ArrivalSign from "../components/ArrivalSign";
import RideHeader from "../components/RideHeader";

// Tablet and laptop: the nav bar across the top, conversation on the left, map on the right.
export default function SplitLayout({ renderMap, panel, controls, session, origin, mode, nav }) {
  const firstRide = session.shownTrip?.steps.find((s) => s.kind !== "walk");
  return (
    <div className="split">
      {nav}
      <aside className="split__panel">
        {session.active && <RideHeader trip={session.active} index={session.index} phase={session.phase} />}
        {panel}
      </aside>
      <main className="split__map">
        {renderMap({ top: 88, bottom: 48, left: 64, right: 150 })}
        <div className="split__overlay">
          {!session.active && (firstRide?.kind === "rail" && firstRide.board_code
            ? <ArrivalSign station={firstRide.board_code} line={firstRide.line.code} to={firstRide.alight_code} />
            : firstRide?.kind === "bus" && firstRide.board_stop_id
              ? <ArrivalSign stopId={firstRide.board_stop_id} busRoute={firstRide.line.code} />
              : !firstRide && origin?.lat != null ? <ArrivalSign near={origin} mode={mode} /> : <span />)}
          {session.active && <span />}
          {controls}
        </div>
      </main>
    </div>
  );
}
