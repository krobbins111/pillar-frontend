import { Fragment, useEffect, useMemo, useRef, useState } from "react";
import { Map as GoogleMap, useMap } from "@vis.gl/react-google-maps";
import { House, MapPin } from "lucide-react";
import { api } from "../api";
import HtmlMarker from "./HtmlMarker";
import MovingMarker from "./MovingMarker";
import Polyline from "./Polyline";
import { laneLayout, linesAt } from "./lanes";
import { BusSide, TrainSide } from "./vehicleArt";
import { DC_DEFAULT, MAP_STYLE } from "./mapStyle";

const DONE = "#B9B2A9";
const BUS = "#5B6770";
// How visible the other mode stays when the rider picks Trains or Buses (0.2 = faded by 80%).
export const DIM = 0.2;

// Which mode the map should show for a trip, so the route is never the faded one.
export function modeForTrip(trip) {
  if (!trip) return null;
  const kinds = new Set(trip.steps.filter((s) => s.kind !== "walk").map((s) => s.kind));
  if (kinds.size === 1) return kinds.has("rail") ? "rail" : "bus";
  return "all";
}

export default function TransitMap({ trip, stepIndex = 0, riding, origin, vehicles, network, mode = "all", explore, padding, recenterKey, onView, brand = "#3A2C26" }) {
  const focusRoutes = useMemo(() => new Set((trip?.summary.lines || []).map((l) => String(l.code).toUpperCase())), [trip]);
  const [busRoutes, setBusRoutes] = useState({});
  const showNetwork = !trip || explore;
  const railTracks = useMemo(() => Object.fromEntries((network?.lines || []).map((l) => [l.code, l.path])), [network]);
  // Where the trip gets on and off: the trip labels those stations, so the network doesn't label them again.
  const tripStops = useMemo(() => (trip?.steps || []).filter((s) => s.kind !== "walk")
    .flatMap((s) => [s.board_at, s.alight_at]).filter((p) => p?.lat != null), [trip]);

  return (
    <GoogleMap
      className="map"
      defaultCenter={origin?.lat != null ? origin : DC_DEFAULT}
      defaultZoom={14}
      gestureHandling="greedy"
      disableDefaultUI
      clickableIcons={false}
      keyboardShortcuts={false}
      styles={MAP_STYLE}
    >
      <ViewWatcher onView={onView} />
      <BusRouteLayer show={showNetwork} dim={Boolean(trip)} focus={trip && !explore ? focusRoutes : null}
        faded={mode === "rail"} routes={busRoutes} onRoutes={setBusRoutes} />
      {network && (
        // With a trip on screen, its whole line stays drawn (the trip's stretch is the bold part with chevrons on top);
        // other lines stay faintly in the background.
        <NetworkLayer network={network} dim={Boolean(trip) && explore} focus={trip && !explore ? focusRoutes : null}
          faded={mode === "bus"} quiet={tripStops} />
      )}
      {trip && <RouteLayer trip={trip} stepIndex={riding ? stepIndex : -1} brand={brand} />}
      <VehicleLayer
        vehicles={vehicles}
        focus={trip && !explore ? focusRoutes : null}
        mode={mode}
        railTracks={railTracks}
        busRoutes={busRoutes}
      />
      {origin?.lat != null && !riding && (
        <HtmlMarker position={origin} zIndex={48}>
          <span className="origin-pin" title={`Starting from ${origin.name}`}>
            {origin.name === "Home" || origin.icon === "home"
              ? <House size={16} strokeWidth={2.5} aria-hidden="true" />
              : <MapPin size={16} strokeWidth={2.5} aria-hidden="true" />}
          </span>
        </HtmlMarker>
      )}
      <Camera trip={trip} stepIndex={stepIndex} riding={riding} origin={origin} padding={padding} recenterKey={recenterKey} />
    </GoogleMap>
  );
}

// Tell the app what part of the map is on screen, so live vehicles and bus routes follow the map (not the rider).
function ViewWatcher({ onView }) {
  const map = useMap();
  useEffect(() => {
    if (!map || !onView) return undefined;
    const listener = map.addListener("idle", () => {
      const c = map.getCenter();
      if (c) onView({ lat: c.lat(), lng: c.lng(), zoom: map.getZoom() });
    });
    return () => listener.remove();
  }, [map, onView]);
  return null;
}

function Camera({ trip, stepIndex, riding, origin, padding, recenterKey }) {
  const map = useMap();
  const points = useMemo(() => {
    if (!trip) return null;
    const path = riding ? trip.steps[stepIndex]?.path : trip.steps.flatMap((s) => s.path);
    return path?.length ? path : null;
  }, [trip, stepIndex, riding]);
  const originKey = origin?.lat != null ? `${origin.lat},${origin.lng}` : "";

  useEffect(() => {
    if (!map) return;
    const bounds = new window.google.maps.LatLngBounds();
    if (points) {
      points.forEach(([lat, lng]) => bounds.extend({ lat, lng }));
    } else if (origin?.lat != null) {
      // Frame the starting place inside the part of the map the sheet doesn't cover.
      bounds.extend({ lat: origin.lat + 0.0055, lng: origin.lng + 0.007 });
      bounds.extend({ lat: origin.lat - 0.0055, lng: origin.lng - 0.007 });
    } else {
      return;
    }
    map.fitBounds(bounds, padding);
    // Recenter on trip, step, or starting-place changes, and when the rider taps recenter.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [map, points, originKey, recenterKey]);
  return null;
}

function RouteLayer({ trip, stepIndex, brand }) {
  const previewing = stepIndex < 0;
  // When the trip ends at the station itself, the destination label says it; don't label the stop twice.
  const last = trip.steps[trip.steps.length - 1];
  const end = last.end_at || last.alight_at;
  return (
    <>
      {trip.steps.map((step, i) => {
        const done = !previewing && i < stepIndex;
        const current = previewing || i === stepIndex;
        const moving = previewing || i === stepIndex; // chevrons on the whole preview, or just the step you're on
        if (step.kind === "walk") {
          return (
            <Polyline key={i} path={step.path} color={done ? DONE : brand} weight={current ? 7 : 5} dotted zIndex={20}
              chevrons={moving && !done ? { color: brand, size: 2.3, weight: 2.4, spacing: 46, gap: 7, speed: 0.7 } : null} />
          );
        }
        return (
          <Fragment key={i}>
            <Polyline path={step.path} color={done ? DONE : brand} weight={current ? 15 : 11} zIndex={21} />
            <Polyline path={step.path} color={done ? "#EFECE7" : step.line.color} weight={current ? 10 : 6} zIndex={22}
              chevrons={moving && !done ? { color: step.line.code === "YL" ? "#2B211B" : "#FFFFFF", size: current ? 2.3 : 1.7 } : null} />
            <StopMarker at={step.board_at} name={step.board} />
            <StopMarker at={step.alight_at} name={step.alight} emphasis={i === trip.steps.length - 2 || current}
              label={!(end?.lat != null && step.alight_at?.lat != null && near(end, step.alight_at, 150))} />
          </Fragment>
        );
      })}
      <DestinationMarker trip={trip} />
    </>
  );
}

function StopMarker({ at, name, emphasis, label = true }) {
  if (!at?.lat) return null;
  return (
    <HtmlMarker position={at} zIndex={emphasis ? 31 : 30}>
      <span className={`stop ${emphasis ? "stop--emphasis" : ""}`}>
        {label && <span className="stop__label">{name}</span>}
      </span>
    </HtmlMarker>
  );
}

// Within `m` meters (flat approximation; fine at city scale).
function near(a, b, m) {
  const dy = (a.lat - b.lat) * 111320, dx = (a.lng - b.lng) * 111320 * Math.cos((a.lat * Math.PI) / 180);
  return Math.hypot(dx, dy) < m;
}

function DestinationMarker({ trip }) {
  const last = trip.steps[trip.steps.length - 1];
  const at = last.end_at || last.alight_at;
  if (!at?.lat) return null;
  return (
    <HtmlMarker position={at} zIndex={40}>
      <span className="destination"><span className="stop__label stop__label--dest">{trip.summary.destination}</span></span>
    </HtmlMarker>
  );
}

function NetworkLayer({ network, dim, focus, faded, quiet = [] }) {
  const map = useMap();
  const [zoom, setZoom] = useState(14);
  useEffect(() => {
    if (!map) return undefined;
    setZoom(map.getZoom());
    const listener = map.addListener("zoom_changed", () => setZoom(map.getZoom()));
    return () => listener.remove();
  }, [map]);
  const opacityFor = (code) => {
    if (focus) return focus.has(code) ? 0.75 : 0.16;
    return (dim ? 0.25 : 0.85) * (faded ? DIM : 1);
  };
  const onFocus = (s) => !focus || s.lines?.some((code) => focus.has(code));
  // Lines that share track run side by side (like the Metro map), so Blue isn't hidden under Silver.
  const weight = zoom >= 14 ? 6 : 4;
  const laid = useMemo(() => laneLayout(network.lines, zoom, weight), [network, zoom, weight]);
  const through = useMemo(() => linesAt(network.lines), [network]);
  return (
    <>
      {laid.map((line) => (
        <Polyline key={line.code} path={line.path} color={line.color} weight={weight}
          opacity={opacityFor(line.code)} zIndex={focus?.has(line.code) ? 8 : 6} />
      ))}
      {zoom >= 12 && !dim && network.stations.filter(onFocus).map((s) => {
        const size = Math.max(10, (through.get(s.code) || 1) * weight + 4); // wide enough to span every lane
        return (
          <HtmlMarker key={s.code} position={s} zIndex={7}>
            <span className="station" style={{ width: size, height: size, opacity: faded && !focus ? DIM + 0.1 : 1 }}>
              {zoom >= (focus ? 15 : 14) && !quiet.some((q) => near(q, s, 250)) && <span className="station__label">{s.name}</span>}
            </span>
          </HtmlMarker>
        );
      })}
    </>
  );
}

// Bus routes near whatever part of the map is on screen. Fetched as the map moves, and cached.
function BusRouteLayer({ show, dim, focus, faded, routes, onRoutes }) {
  const map = useMap();
  const fetched = useRef(new Set());
  const [zoom, setZoom] = useState(14);
  useEffect(() => {
    if (!map) return undefined;
    const load = () => {
      const z = map.getZoom();
      setZoom(z);
      const c = map.getCenter();
      if (!c || z < 13) return;
      const key = `${c.lat().toFixed(2)},${c.lng().toFixed(2)}`;
      if (fetched.current.has(key)) return;
      fetched.current.add(key);
      api.busRoutes({ lat: c.lat(), lng: c.lng(), radius: 1500 })
        .then(({ routes: found }) => onRoutes((prev) => {
          const next = { ...prev };
          found.forEach((r) => { next[r.code] = r; });
          return next;
        }))
        .catch(() => fetched.current.delete(key));
    };
    const listener = map.addListener("idle", load);
    return () => listener.remove();
  }, [map, onRoutes]);

  if (focus) {  // a bus trip: its whole route stays drawn under the trip's stretch
    return Object.values(routes).filter((r) => focus.has(String(r.code).toUpperCase())).map((r) => (
      <Polyline key={r.code} path={r.path} color={BUS} weight={5} opacity={0.6} zIndex={8} />
    ));
  }
  if (!show || zoom < 13) return null;
  const opacity = (dim ? 0.2 : 0.55) * (faded ? DIM : 1);
  return Object.values(routes).map((r) => (
    <Polyline key={r.code} path={r.path} color={BUS} weight={zoom >= 15 ? 4 : 3} opacity={opacity} zIndex={4} />
  ));
}

function VehicleLayer({ vehicles, focus, mode, railTracks, busRoutes }) {
  if (!vehicles?.length) return null;
  return vehicles.map((v) => {
    if (focus && !focus.has(String(v.route).toUpperCase())) return null;
    const rail = v.kind === "rail";
    const faded = (mode === "rail" && !rail) || (mode === "bus" && rail);
    const track = rail ? railTracks[v.route] : busRoutes[v.route]?.path;
    return (
      <MovingMarker key={v.id} position={v} track={track} zIndex={rail ? 45 : 44} className={faded ? "is-faded" : ""}>
        {rail ? (
          <span className="vehicle vehicle--rail"><TrainSide color={v.color} title={`${v.route} line train`} /></span>
        ) : (
          <span className="vehicle vehicle--bus">
            <span className="vehicle__tag">{v.route}</span>
            <BusSide title={`${v.route} bus`} />
          </span>
        )}
      </MovingMarker>
    );
  });
}
