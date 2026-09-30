import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { api } from "../api";
import { plain } from "../components/RichText";
import { whenFromPlan, whenParams } from "../lib/format";

// Each transit step has two phases: waiting for the vehicle, then riding it.
// The rider moves the trip forward by tapping. Nothing here uses GPS.
const riding = (step, phase) => step.kind !== "walk" && phase === "ride";

export function replyOptions(trip, index, phase) {
  if (!trip) return [];
  const step = trip.steps[index];
  const next = trip.steps[index + 1];
  const vehicle = step.kind === "rail" ? "train" : "bus";
  if (step.kind === "walk") {
    if (!next) return ["I'm here", "I'm lost"];
    return [next.kind === "rail" ? "I'm at the station" : "I'm at the stop", "I'm lost"];
  }
  if (!riding(step, phase)) return [`I'm on the ${vehicle}`, `I can't find the ${vehicle}`];
  return [`I'm off the ${vehicle}`, "I missed my stop"];
}

const ADVANCE = new Set(["I'm at the station", "I'm at the stop", "I'm off the train", "I'm off the bus"]);
const BOARD = new Set(["I'm on the train", "I'm on the bus"]);

// Said by the app itself, so help works even without the AI assistant.
const LOST_HELP = "It's okay. Stay where you are. If you're inside a station, the station manager in the booth by the "
  + "fare gates can help. You can also call for help with the button below. Or tell me where you are: pick a station "
  + "or neighborhood below, and I'll find the way from there.";
const FIND_HELP = {
  rail: (s) => `Look up for signs with the ${s.line.name} color and the word ${s.headsign}. If you're not sure, ask the `
    + "station manager in the booth by the fare gates. The board on this screen shows which trains go to your stop.",
  bus: (s) => `Check the sign on the bus stop pole for ${s.line.code}. Buses can run a few minutes late. `
    + "The sign on this screen shows when the next one is coming.",
};

function lastPoint(trip) {
  const last = trip.steps[trip.steps.length - 1];
  const at = last.end_at || last.alight_at;
  return at?.lat != null ? at : null;
}

// A trip in progress survives a reload (a locked phone, a refreshed tab), so the rider lands back on the step they
// were on. The chat does not: a reload is a fresh start. So does the last arrival, so "Take me home" can offer the
// same way back hours later.
const TRIP_KEY = "pillar-trip";
const ARRIVAL_KEY = "pillar-arrival";
const load = (key, maxHours) => {
  try {
    const saved = JSON.parse(localStorage.getItem(key));
    return saved && Date.now() - saved.at < maxHours * 3600000 ? saved : null;
  } catch { return null; }
};
const store = (key, value) => {
  try {
    if (value) localStorage.setItem(key, JSON.stringify({ ...value, at: value.at || Date.now() }));
    else localStorage.removeItem(key);
  } catch { /* private mode */ }
};
const lineCodes = (trip) => trip.summary.lines.map((l) => l.code);

export function useTripSession({ origin, setOrigin, speak, assistant, home }) {
  const resumed = useRef(load(TRIP_KEY, 6)).current;
  const [messages, setMessages] = useState([]);
  const [choices, setChoices] = useState([]);
  const [busy, setBusy] = useState(false);
  const [previewId, setPreviewId] = useState(null);
  const [active, setActive] = useState(resumed?.trip || null);
  const [index, setIndex] = useState(resumed?.index || 0);
  const [phase, setPhase] = useState(resumed?.phase || "wait");
  const [boardedAt, setBoardedAt] = useState(resumed?.boardedAt || null);
  const [rideFrom, setRideFrom] = useState(0);           // the ride screen shows only what was said during the trip
  const [arrival, setArrivalState] = useState(() => load(ARRIVAL_KEY, 12)); // {to, from, lines, home}: "You made it"
  const startedFrom = useRef(resumed?.from || null);
  const [asking, setAsking] = useState(null); // "where": show the "Where are you now?" picker
  const [when, setWhenState] = useState({ mode: "now" }); // leave now, leave at a time, or arrive by a time
  const [stepFree, setStepFree] = useState(false);        // elevators instead of escalators (default: escalators)
  const latestTrips = useRef([]);
  const lastPlan = useRef(null);                          // what the trips on screen were planned for

  const setArrival = useCallback((a) => { setArrivalState(a); store(ARRIVAL_KEY, a && !a.home ? a : null); }, []);
  useEffect(() => {
    store(TRIP_KEY, active ? { trip: active, index, phase, boardedAt, from: startedFrom.current } : null);
  }, [active, index, phase, boardedAt]);
  // An arrival only means something while the rider is still starting from there.
  useEffect(() => {
    if (arrival && origin?.name && origin.name !== arrival.to) setArrival(null);
  }, [origin, arrival, setArrival]);

  const say = useCallback((content, extra = {}) => {
    setMessages((m) => [...m, { role: "assistant", content, ...extra }]);
  }, []);

  const showTrips = useCallback((trips) => {
    if (!trips?.length) return;
    latestTrips.current = trips;
    setPreviewId(trips[0].id);
  }, []);

  // A picked time that has passed means "now" again.
  useEffect(() => {
    if (when.mode === "now") return undefined;
    const ms = Math.min(Date.parse(when.at) + 60000 - Date.now(), 2 ** 31 - 1);
    const timer = setTimeout(() => setWhenState({ mode: "now" }), Math.max(0, ms));
    return () => clearTimeout(timer);
  }, [when]);

  const context = useCallback(() => ({
    origin: origin ? { name: origin.name, lat: origin.lat, lng: origin.lng } : null,
    now: new Date().toISOString(),
    when: active ? {} : whenParams(when),
    step_free: stepFree,
    came_by: arrival && !active && !arrival.home ? { from: arrival.from, to: arrival.to, lines: arrival.lines } : null,
    trip: active ? {
      step_number: index + 1,
      of: active.steps.length,
      phase,
      step: stripGeometry(active.steps[index]),
      destination: active.summary.destination,
    } : null,
  }), [origin, active, index, phase, when, stepFree, arrival]);

  // picked: the rider tapped one of the assistant's options (so it acts on it instead of asking again).
  const send = useCallback(async (text, { picked = false } = {}) => {
    const clean = text.trim();
    if (!clean) return;
    const history = [...messages, { role: "user", content: clean }];
    setMessages(history);
    setChoices([]);
    setBusy(true);
    try {
      const res = await api.chat(history.map(({ role, content }) => ({ role, content })), { ...context(), picked });
      const plan = res.plan ? { ...res.plan, origin: res.plan.origin || origin } : null;
      if (plan && res.trips?.length) {
        lastPlan.current = plan;
        // The assistant may have read a time ("be there by 2") or "elevators only" from what was said: show it.
        if (!active) setWhenState(whenFromPlan(plan.when));
        setStepFree(Boolean(plan.step_free));
      }
      setMessages((m) => [...m, { role: "assistant", content: res.reply, trips: res.trips, plan }]);
      showTrips(res.trips);
      setChoices(res.choices || []);
      if (active) speak(plain(res.reply));
    } catch (e) {
      setMessages((m) => [...m, { role: "assistant", content: e.message, error: true }]);
    } finally {
      setBusy(false);
    }
  }, [messages, context, active, speak, showTrips, origin]);

  // Plan the trips on screen again with a different time or with elevators only, replacing them in place.
  const replan = useCallback(async (changes) => {
    const plan = lastPlan.current;
    if (!plan || active) return;
    const nextWhen = changes.when ?? whenFromPlan(plan.when); // what these trips were planned for
    const nextStepFree = changes.stepFree ?? Boolean(plan.step_free);
    const from = plan.origin || origin;
    setBusy(true);
    try {
      const res = await api.trips({
        destination: plan.destination, origin: from?.name, lat: from?.lat, lng: from?.lng,
        ...whenParams(nextWhen), step_free: nextStepFree, modes: plan.modes || undefined,
      });
      const fresh = { destination: res.destination, when: res.when || {}, step_free: res.step_free, origin: res.origin || from,
        modes: res.modes };
      lastPlan.current = fresh;
      setMessages((m) => {
        const i = m.map((x) => Boolean(x.trips?.length)).lastIndexOf(true);
        return i < 0 ? m : m.map((x, j) => (j === i ? { ...x, trips: res.trips, plan: fresh } : x));
      });
      showTrips(res.trips);
    } catch (e) {
      say(e.message, { error: true });
    } finally {
      setBusy(false);
    }
  }, [active, origin, showTrips, say]);

  const setWhen = useCallback((next) => {
    setWhenState(next);
    if (lastPlan.current && !active) replan({ when: next });
  }, [active, replan]);

  const chooseElevators = useCallback((on) => {
    setStepFree(on);
    replan({ stepFree: on });
  }, [replan]);

  // A "time to leave" notification was tapped: show that trip, ready to start.
  const openReminder = useCallback(async (id, endpoint) => {
    try {
      const { trip, plan } = await api.reminderTrip(id, endpoint);
      if (plan) {
        lastPlan.current = plan;
        setStepFree(Boolean(plan.step_free));
      }
      say(`Time to leave for ${trip.summary.destination}. Here's your trip.`, { trips: [trip], plan });
      showTrips([trip]);
    } catch (e) {
      say(e.message, { error: true });
    }
  }, [say, showTrips]);

  const start = useCallback((trip) => {
    startedFrom.current = lastPlan.current?.origin?.name || origin?.name || null;
    setActive(trip);
    setIndex(0);
    setPhase("wait");
    setBoardedAt(null);
    setPreviewId(null);
    setChoices([]);
    setAsking(null);
    setArrival(null);
    setRideFrom(messages.length);
    speak(`${trip.steps[0].title}. ${trip.steps[0].detail}`);
  }, [speak, origin, messages.length, setArrival]);

  // Back to the first screen: no chat, no trip cards, leaving now. Used when a trip ends, when the rider gets
  // somewhere, and (by not saving the chat) on every reload.
  const reset = useCallback(() => {
    setMessages([]);
    setChoices([]);
    setPreviewId(null);
    setActive(null);
    setIndex(0);
    setPhase("wait");
    setBoardedAt(null);
    setAsking(null);
    setWhenState({ mode: "now" });
    setStepFree(false);
    setRideFrom(0);
    latestTrips.current = [];
    lastPlan.current = null;
  }, []);

  // The rider got there. Where they end up is where the next trip starts, and the first screen says so, with a
  // "Take me home" that offers the same way back. Getting home ends the outing: a clean first screen.
  const finish = useCallback(() => {
    if (!active) return;
    const at = lastPoint(active);
    const dest = active.summary.destination;
    const near = (a, b) => a?.lat != null && b?.lat != null && Math.abs(a.lat - b.lat) < 0.0015 && Math.abs(a.lng - b.lng) < 0.0015;
    const isHome = Boolean(home) && (dest === home.name || near(at, home));
    reset();
    if (isHome) {
      setOrigin({ name: home.name, lat: home.lat, lng: home.lng, kind: "saved", icon: home.icon });
      setArrival({ to: home.name, home: true });
      speak("You made it home. Nice work.");
      return;
    }
    setOrigin({ name: dest, lat: at?.lat, lng: at?.lng, kind: "place" });
    setArrival({ to: dest, from: startedFrom.current, lines: lineCodes(active) });
    speak(`You made it to ${dest}. Nice work. Let me know when you need to route home.`);
  }, [active, home, reset, setOrigin, setArrival, speak]);

  // "End trip": stop here and go back to the first screen.
  const endTrip = useCallback(() => {
    reset();
    speak("Trip ended.");
  }, [reset, speak]);

  const advance = useCallback(() => {
    if (!active) return;
    const next = index + 1;
    if (next >= active.steps.length) { finish(); return; }
    setIndex(next);
    setPhase("wait");
    const step = active.steps[next];
    speak(`${step.title}. ${step.detail}`);
  }, [active, index, finish, speak]);

  // Plan again from a place the rider names (never from GPS), keeping the same destination.
  const replanFrom = useCallback(async (place, lead) => {
    const destination = active?.summary.destination || latestTrips.current[0]?.summary.destination;
    if (!destination) return;
    setAsking(null);
    setBusy(true);
    try {
      const res = await api.trips({ origin: place.name, lat: place.lat, lng: place.lng, destination, step_free: stepFree });
      lastPlan.current = { destination: res.destination, when: {}, step_free: res.step_free, origin: place };
      setWhenState({ mode: "now" }); // re-planning mid-trip is always for right now
      setOrigin(place);
      setActive(null);
      setIndex(0);
      say(lead || `Here's how to get to ${destination} from ${place.name}.`, { trips: res.trips, plan: lastPlan.current });
      showTrips(res.trips);
      speak(lead || `Here's how to get to ${destination} from ${place.name}.`);
    } catch (e) {
      say(e.message, { error: true });
    } finally {
      setBusy(false);
    }
  }, [active, setOrigin, say, showTrips, speak, stepFree]);

  const missedStop = useCallback(async () => {
    const step = active.steps[index];
    if (step.kind === "rail" && step.board_code && step.alight_code) {
      try {
        const { station } = await api.missedStop({ line: step.line.code, board: step.board_code, alight: step.alight_code });
        const place = { name: `${station.name} station`, lat: station.lat, lng: station.lng, kind: "station" };
        return replanFrom(place, `No problem, this happens to everyone. Get off at the next stop, ${station.name}. `
          + `Stay inside the station. Here's the way to ${active.summary.destination} from there.`);
      } catch { /* fall through to asking */ }
    }
    say(`No problem. Get off at the next stop. Then pick where you are below, and I'll find the way from there.`);
    setAsking("where");
    return undefined;
  }, [active, index, replanFrom, say]);

  const pick = useCallback((choice) => {
    if (ADVANCE.has(choice)) return advance();
    if (choice === "I'm here") return finish();
    if (BOARD.has(choice)) {
      setPhase("ride");
      setBoardedAt(Date.now());
      const step = active.steps[index];
      return speak(`Good. Ride ${step.stops} stops and get off at ${step.alight}.`);
    }
    if (choice === "I missed my stop") return missedStop();
    if (choice === "I'm lost") {
      say(LOST_HELP);
      speak(LOST_HELP);
      setAsking("where");
      return undefined;
    }
    if (choice === "I can't find the train" || choice === "I can't find the bus") {
      const step = active?.steps[index];
      if (assistant) return send(choice);
      if (step) say(FIND_HELP[step.kind === "rail" ? "rail" : "bus"](step));
      return undefined;
    }
    return send(choice, { picked: true });
  }, [advance, finish, send, active, index, speak, missedStop, say, assistant]);

  // A saved place goes straight to the trip planner: faster, and it doesn't need the assistant (or its cost).
  const planTo = useCallback(async (place, { cameBy } = {}) => {
    const request = place.name === home?.name ? "Take me home" : `Take me to ${place.name}`;
    setMessages((m) => [...m, { role: "user", content: request }]);
    setChoices([]);
    setBusy(true);
    try {
      const res = await api.trips({
        destination: place.name, origin: origin?.name, lat: origin?.lat, lng: origin?.lng, ...whenParams(when), step_free: stepFree,
        came_by: cameBy?.length ? cameBy : undefined,
      });
      const plan = { destination: res.destination, when: res.when || {}, step_free: res.step_free, origin: res.origin || origin,
        modes: res.modes };
      lastPlan.current = plan;
      const lead = place.name === home?.name ? "Here's the way home." : `Here's how to get to ${res.destination}.`;
      setMessages((m) => [...m, { role: "assistant", content: lead, trips: res.trips, plan }]);
      showTrips(res.trips);
    } catch (e) {
      say(e.message, { error: true });
    } finally {
      setBusy(false);
    }
  }, [origin, when, stepFree, showTrips, say, home]);

  // The "Take me home" button after arriving somewhere: the same way back first, when Google still offers it.
  const goHome = useCallback(() => {
    if (!home) return undefined;
    return planTo(home, { cameBy: arrival && !arrival.home ? arrival.lines : null });
  }, [home, arrival, planTo]);

  const preview = useMemo(
    () => latestTrips.current.find((t) => t.id === previewId) || null,
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [previewId, messages],
  );

  return {
    messages, choices, busy, send, pick, planTo,
    previewId, setPreviewId, preview,
    active, index, phase, boardedAt, start, finish, advance, endTrip, reset, rideFrom,
    arrival, goHome, home,
    asking, setAsking, replanFrom,
    when, setWhen, stepFree, chooseElevators, openReminder,
    shownTrip: active || preview,
    replies: active ? [...replyOptions(active, index, phase), ...choices] : choices,
  };
}

function stripGeometry(step) {
  const { path, turns, board_at, alight_at, start_at, end_at, ...rest } = step;
  return rest;
}
