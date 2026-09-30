import { useEffect, useRef } from "react";
import { useMap } from "@vis.gl/react-google-maps";

// A chevron pointing forward along the line (Google aligns a symbol's "up" with the line's direction).
const CHEVRON = "M -2.4,1.6 0,-0.9 2.4,1.6";
// Each "packet" is four chevrons that fade in toward the front, so the line reads as a moving gradient.
const PACKET = [0.2, 0.45, 0.72, 1];

function chevronIcons(base, { color, spacing, gap, size, weight }) {
  return PACKET.map((alpha, k) => ({
    icon: { path: CHEVRON, strokeColor: color, strokeOpacity: alpha, strokeWeight: weight, scale: size },
    offset: `${(base + k * gap) % spacing}px`,
    repeat: `${spacing}px`,
  }));
}

export default function Polyline({ path, color, weight = 6, opacity = 1, dotted = false, zIndex = 1, chevrons = null }) {
  const map = useMap();
  const line = useRef(null);

  useEffect(() => {
    if (!map) return undefined;
    line.current = new window.google.maps.Polyline({ map, clickable: false });
    return () => line.current?.setMap(null);
  }, [map]);

  const dots = dotted
    ? [{
        icon: { path: window.google?.maps.SymbolPath.CIRCLE ?? 0, scale: weight / 2, fillColor: color, fillOpacity: opacity, strokeOpacity: 0 },
        offset: "0",
        repeat: `${weight * 2.8}px`,
      }]
    : [];

  useEffect(() => {
    if (!line.current || !path?.length) return;
    line.current.setOptions({
      path: path.map(([lat, lng]) => ({ lat, lng })),
      strokeColor: color,
      strokeWeight: dotted ? 0 : weight,
      strokeOpacity: dotted ? 0 : opacity,
      icons: dots.length ? dots : null,
      zIndex,
    });
  }, [map, path, color, weight, opacity, dotted, zIndex]); // eslint-disable-line react-hooks/exhaustive-deps

  // Animated chevrons: the offset creeps forward, so they run in the direction of travel.
  const chevronKey = chevrons ? JSON.stringify(chevrons) : "";
  useEffect(() => {
    if (!line.current || !chevrons || !path?.length) return undefined;
    const opts = { spacing: 72, gap: 9, size: 2.2, weight: 2.6, speed: 1.2, ...chevrons };
    const still = window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;
    let base = 0;
    const paint = () => line.current?.set("icons", [...dots, ...chevronIcons(base, opts)]);
    paint();
    if (still) return () => line.current?.set("icons", dots.length ? dots : null);
    const id = setInterval(() => { base = (base + opts.speed) % opts.spacing; paint(); }, 40);
    return () => { clearInterval(id); line.current?.set("icons", dots.length ? dots : null); };
  }, [map, path, chevronKey, dotted, weight, color]); // eslint-disable-line react-hooks/exhaustive-deps

  return null;
}
