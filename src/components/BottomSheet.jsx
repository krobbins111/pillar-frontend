import { useRef, useState } from "react";

export const SHEET = { peek: 0.32, half: 0.6, full: 0.95 };
const ORDER = ["peek", "half", "full"];

// Google Maps-style sheet: drag the handle, or tap it to step through sizes.
// Sizes are fractions of the area under the nav bar (the sheet's parent), so the sheet never covers the nav bar.
export default function BottomSheet({ snap, onSnap, children }) {
  const drag = useRef(null);
  const self = useRef(null);
  const [dragHeight, setDragHeight] = useState(null);
  const room = () => self.current?.parentElement?.clientHeight || window.innerHeight;

  const down = (e) => {
    drag.current = { y: e.clientY, h: SHEET[snap] * room() };
    e.currentTarget.setPointerCapture(e.pointerId);
  };
  const move = (e) => {
    if (!drag.current) return;
    const h = drag.current.h + (drag.current.y - e.clientY);
    setDragHeight(Math.max(140, Math.min(room() * 0.96, h)));
  };
  const up = (e) => {
    if (!drag.current) return;
    const moved = Math.abs(drag.current.y - e.clientY);
    const ratio = (dragHeight ?? drag.current.h) / room();
    drag.current = null;
    setDragHeight(null);
    if (moved < 6) return onSnap(ORDER[(ORDER.indexOf(snap) + 1) % ORDER.length]);
    const nearest = ORDER.reduce((a, b) => (Math.abs(SHEET[a] - ratio) < Math.abs(SHEET[b] - ratio) ? a : b));
    return onSnap(nearest);
  };

  return (
    <section
      ref={self}
      className={`sheet ${dragHeight ? "sheet--dragging" : ""}`}
      style={{ height: dragHeight ? `${dragHeight}px` : `${SHEET[snap] * 100}%` }}
    >
      <button
        type="button"
        className="sheet__handle"
        aria-label={snap === "full" ? "Show more map" : "Show more"}
        onPointerDown={down}
        onPointerMove={move}
        onPointerUp={up}
        onPointerCancel={up}
      >
        <span />
      </button>
      <div className="sheet__body">{children}</div>
    </section>
  );
}
