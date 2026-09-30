import { useCallback, useEffect, useMemo, useState } from "react";
import { APIProvider } from "@vis.gl/react-google-maps";
import { api } from "./api";
import MapControls from "./components/MapControls";
import MapPlaceholder from "./components/MapPlaceholder";
import NavBar from "./components/NavBar";
import Panel from "./components/Panel";
import { useLayout } from "./hooks/useLayout";
import { useOrigin } from "./hooks/useOrigin";
import { currentEndpoint, useReminderLinks } from "./hooks/usePush";
import { useReminders } from "./hooks/useReminders";
import { usePoll } from "./hooks/usePoll";
import { useSpeech } from "./hooks/useSpeech";
import { useTextSize } from "./hooks/useTextSize";
import CompanionLayout from "./layouts/CompanionLayout";
import CounterLayout from "./layouts/CounterLayout";
import SplitLayout from "./layouts/SplitLayout";
import TransitMap, { modeForTrip } from "./map/TransitMap";
import { DC_DEFAULT } from "./map/mapStyle";
import { themeFor, useTheme } from "./lib/theme";
import { useTripSession } from "./state/useTripSession";

export default function App() {
  const layout = useLayout();
  const [config, setConfig] = useState(null);
  const [profile, setProfile] = useState(null);
  const [neighborhoods, setNeighborhoods] = useState([]);
  const [network, setNetwork] = useState(null);

  useEffect(() => {
    api.config().then(setConfig).catch(() => setConfig({ maps_key: "" }));
    api.profile().then(setProfile).catch(() => setProfile({ places: [] }));
    api.neighborhoods().then(setNeighborhoods).catch(() => {});
  }, [layout]);

  // The Metro lines. Right after the server starts, it may not have WMATA's track shapes yet (lines are then drawn
  // straight between stations), so ask again a few times until the lines follow the real track.
  useEffect(() => {
    if (layout === "counter") return undefined;
    let tries = 0, timer;
    const load = () => api.network().then((net) => {
      setNetwork(net);
      if (!net.track_shapes && ++tries < 6) timer = setTimeout(load, 20000);
    }).catch(() => { if (++tries < 6) timer = setTimeout(load, 20000); });
    load();
    return () => clearTimeout(timer);
  }, [layout]);

  const [, toggleTextSize] = useTextSize(profile?.text_size);
  const { origin, setOrigin } = useOrigin(profile);
  const speech = useSpeech();
  const home = useMemo(() => {
    const places = profile?.places || [];
    return places.find((p) => p.name === "Home") || places.find((p) => p.name === profile?.start_from) || null;
  }, [profile]);
  const session = useTripSession({ origin, setOrigin, speak: speech.speak, assistant: Boolean(config?.assistant), home });
  const [changingStart, setChangingStart] = useState(false);
  const reminders = useReminders(config?.push_key);
  const { openReminder } = session;
  const openFromReminder = useCallback(async (id) => openReminder(id, await currentEndpoint()), [openReminder]);
  useReminderLinks(openFromReminder); // tapping a "time to leave" notification opens that trip
  const [explore, setExplore] = useState(false);
  const [recenterKey, setRecenterKey] = useState(0);
  const [view, setView] = useState(null); // what the map is showing; live data follows the map, never the rider

  // Trains / Buses filter. Picking a trip switches it to that trip's mode so the route is never faded.
  const trip = session.shownTrip;
  const [mode, setMode] = useState("all");
  useEffect(() => { if (trip) setMode(modeForTrip(trip)); }, [trip?.id]); // eslint-disable-line react-hooks/exhaustive-deps

  // Train look or bus look, following what the rider is doing.
  const theme = useTheme(themeFor({ active: session.active, index: session.index, trip, mode }));

  // Live vehicles: just the trip's lines when a trip is on screen, everything around the map otherwise.
  const routes = trip && !explore ? trip.summary.lines.map((l) => l.code).join(",") : "";
  const center = view || (origin?.lat != null ? origin : DC_DEFAULT);
  const { data: live } = usePoll(
    () => api.live({ lat: center.lat, lng: center.lng, radius: trip ? 12000 : 4000, routes }),
    15000,
    [routes, Math.round(center.lat * 200), Math.round(center.lng * 200)],
    layout !== "counter",
  );

  const onView = useCallback((v) => setView(v), []);
  const renderMap = useCallback((padding) => (
    config?.maps_key ? (
      <TransitMap
        trip={trip}
        stepIndex={session.index}
        riding={Boolean(session.active)}
        origin={origin}
        vehicles={live?.vehicles}
        network={network}
        mode={mode}
        explore={explore}
        padding={padding}
        recenterKey={recenterKey}
        onView={onView}
        brand={theme.brand}
      />
    ) : <MapPlaceholder />
  ), [config, trip, session.index, session.active, origin, live, network, mode, explore, recenterKey, onView, theme]);

  const controls = (
    <MapControls
      hasTrip={Boolean(trip)}
      explore={explore}
      onExplore={() => setExplore((e) => !e)}
      onRecenter={() => setRecenterKey((k) => k + 1)}
      mode={mode}
      onMode={setMode}
    />
  );

  const panel = (
    <Panel
      session={session}
      profile={profile}
      origin={origin}
      setOrigin={setOrigin}
      neighborhoods={neighborhoods}
      stations={network?.stations || []}
      speech={speech}
      assistant={Boolean(config?.assistant)}
      reminders={reminders}
      onOpenReminder={openFromReminder}
      mode={mode}
      changingStart={changingStart}
      setChangingStart={setChangingStart}
    />
  );
  const nav = (
    <NavBar
      origin={origin}
      when={session.when}
      onWhen={session.setWhen}
      onPickStart={() => setChangingStart(true)}
      onTextSize={toggleTextSize}
      trip={session.active}
    />
  );
  const props = { renderMap, panel, controls, session, origin, mode, nav, picking: changingStart || session.asking === "where" };

  if (layout === "counter") return <CounterLayout profile={profile} />;
  if (!config) return <div className="loading">Getting the map ready…</div>;

  const screen = layout === "split" ? <SplitLayout {...props} /> : <CompanionLayout {...props} />;
  return config.maps_key ? <APIProvider apiKey={config.maps_key}>{screen}</APIProvider> : screen;
}
