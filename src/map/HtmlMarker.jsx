import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { useMap } from "@vis.gl/react-google-maps";

// Any React content, pinned to a lat/lng. Works without a Map ID, so the custom map style applies.
// When the position changes (a bus moved), it glides instead of jumping.
export default function HtmlMarker({ position, children, zIndex = 1, className = "" }) {
  const map = useMap();
  const [el] = useState(() => document.createElement("div"));
  const overlay = useRef(null);

  useEffect(() => {
    if (!map || !window.google) return undefined;
    class Overlay extends window.google.maps.OverlayView {
      onAdd() { this.getPanes().overlayMouseTarget.appendChild(el); }
      draw() {
        const point = this.getProjection()?.fromLatLngToDivPixel(new window.google.maps.LatLng(this.pos.lat, this.pos.lng));
        if (point) el.style.transform = `translate(${point.x}px, ${point.y}px) translate(-50%, -50%)`;
      }
      onRemove() { el.remove(); }
    }
    const o = new Overlay();
    o.pos = position;
    o.setMap(map);
    overlay.current = o;
    return () => o.setMap(null);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [map, el]);

  useEffect(() => {
    const o = overlay.current;
    if (!o) return undefined;
    const moved = o.pos.lat !== position.lat || o.pos.lng !== position.lng;
    o.pos = position;
    if (!moved) return undefined;
    el.style.transition = "transform 1.4s linear";
    o.draw();
    const t = setTimeout(() => { el.style.transition = ""; }, 1500);
    return () => clearTimeout(t);
  }, [position.lat, position.lng, el]); // eslint-disable-line react-hooks/exhaustive-deps

  el.className = `html-marker ${className}`;
  el.style.zIndex = String(zIndex);
  el.style.position = "absolute";
  return createPortal(children, el);
}
