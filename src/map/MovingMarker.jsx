import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { useMap } from "@vis.gl/react-google-maps";
import { along, between, meters } from "./geometry";

const TOO_FAR = 3000; // a jump this big is a new vehicle or bad data: place it, don't slide it

// A marker for a live train or bus. When a new position arrives, it slides there *along its line*
// over about one refresh interval, so it keeps moving smoothly and is never more than one refresh behind.
// It also turns to face the way it's going (data-heading="w" flips the side-view art).
export default function MovingMarker({ position, track, glideMs = 14000, zIndex = 1, className = "", children }) {
  const map = useMap();
  const [el] = useState(() => document.createElement("div"));
  const overlay = useRef(null);
  const shown = useRef([position.lat, position.lng]);
  const frame = useRef(0);

  useEffect(() => {
    if (!map || !window.google) return undefined;
    class Overlay extends window.google.maps.OverlayView {
      onAdd() { this.getPanes().overlayMouseTarget.appendChild(el); }
      draw() {
        const point = this.getProjection()?.fromLatLngToDivPixel(new window.google.maps.LatLng(this.pos[0], this.pos[1]));
        if (point) el.style.transform = `translate(${point.x}px, ${point.y}px) translate(-50%, -50%)`;
      }
      onRemove() { el.remove(); }
    }
    const o = new Overlay();
    o.pos = shown.current;
    o.setMap(map);
    overlay.current = o;
    return () => { cancelAnimationFrame(frame.current); o.setMap(null); };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [map, el]);

  useEffect(() => {
    const o = overlay.current;
    const to = [position.lat, position.lng];
    const from = shown.current;
    if (from[0] === to[0] && from[1] === to[1]) return undefined;
    cancelAnimationFrame(frame.current);

    if (typeof position.bearing === "number") el.dataset.heading = position.bearing > 180 ? "w" : "e";
    else if (Math.abs(to[1] - from[1]) > 0.00003) el.dataset.heading = to[1] < from[1] ? "w" : "e";

    const route = (track && between(track, from, to)) || [from, to];
    if (!o || meters(from, to) > TOO_FAR) {
      shown.current = to;
      if (o) { o.pos = to; o.draw(); }
      return undefined;
    }
    const start = performance.now();
    const tick = (now) => {
      const f = Math.min(1, (now - start) / glideMs);
      shown.current = along(route, f);
      o.pos = shown.current;
      o.draw();
      if (f < 1) frame.current = requestAnimationFrame(tick);
    };
    frame.current = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame.current);
  }, [position.lat, position.lng, track, glideMs, el]); // eslint-disable-line react-hooks/exhaustive-deps

  el.className = `html-marker ${className}`;
  el.style.zIndex = String(zIndex);
  el.style.position = "absolute";
  return createPortal(children, el);
}
