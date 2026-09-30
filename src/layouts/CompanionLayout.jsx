import { useEffect, useRef, useState } from "react";
import ArrivalSign from "../components/ArrivalSign";
import BottomSheet, { SHEET } from "../components/BottomSheet";
import RideHeader from "../components/RideHeader";

// Phone: the nav bar pinned at the top, then the map, with a sheet over it for the conversation and steps.
export default function CompanionLayout({ renderMap, panel, controls, session, origin, mode, nav, picking }) {
  const [snap, setSnap] = useState("half");
  const stage = useRef(null);
  const [stageH, setStageH] = useState(window.innerHeight);
  useEffect(() => {
    if (!stage.current) return undefined;
    const watch = new ResizeObserver(([entry]) => setStageH(entry.contentRect.height));
    watch.observe(stage.current);
    return () => watch.disconnect();
  }, []);
  useEffect(() => { if (session.active) setSnap("half"); }, [session.active, session.index]);
  useEffect(() => { if (picking) setSnap("full"); }, [picking]); // the start picker needs the room
  const sheetPx = Math.round(SHEET[snap] * stageH);
  const firstRide = session.shownTrip?.steps.find((s) => s.kind !== "walk");

  return (
    <div className="companion">
      {nav}
      <div className="companion__stage" ref={stage}>
        <div className="companion__map">
          {renderMap({ top: session.active ? 130 : 96, bottom: sheetPx + 24, left: 40, right: 96 })}
        </div>
        <div className="companion__top">
          {session.active ? (
            <RideHeader trip={session.active} index={session.index} phase={session.phase} />
          ) : firstRide?.kind === "rail" && firstRide.board_code ? (
            <ArrivalSign station={firstRide.board_code} line={firstRide.line.code} to={firstRide.alight_code} />
          ) : firstRide?.kind === "bus" && firstRide.board_stop_id ? (
            <ArrivalSign stopId={firstRide.board_stop_id} busRoute={firstRide.line.code} />
          ) : !firstRide && origin?.lat != null ? (
            <ArrivalSign near={origin} mode={mode} />
          ) : <span />}
          {controls}
        </div>
        <BottomSheet snap={snap} onSnap={setSnap}>{panel}</BottomSheet>
      </div>
    </div>
  );
}
