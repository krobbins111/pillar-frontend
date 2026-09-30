const TZ = "America/New_York";

export const clock = (iso) =>
  iso ? new Date(iso).toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit", timeZone: TZ }) : "";

export const minutesUntil = (iso, now = Date.now()) => Math.max(0, Math.round((new Date(iso) - now) / 60000));

// "2026-09-27" for a moment, in DC time: used to tell today from tomorrow.
const dayKey = (d) => new Date(d).toLocaleDateString("en-CA", { timeZone: TZ });

export function dayWord(iso, now = Date.now()) {
  const key = dayKey(iso);
  if (key === dayKey(now)) return "Today";
  if (key === dayKey(now + 86400000)) return "Tomorrow";
  return new Date(iso).toLocaleDateString("en-US", { weekday: "long", month: "short", day: "numeric", timeZone: TZ });
}

export function leaveText(summary, now) {
  const m = minutesUntil(summary.leave_at, now);
  if (m <= 0) return "Leave now";
  if (m <= 60) return `Leave in ${m} min`;
  const day = dayWord(summary.leave_at, now);
  const at = `eave at ${clock(summary.leave_at)}`;
  return day === "Today" ? `L${at}` : `${day}, l${at}`;
}

// The rider's "when" choice for the nav bar's sentence ("...and want to [leave at] [2:30 PM]"): the verb and the time,
// each a word the rider can tap.
export function whenWords(when, now = Date.now()) {
  if (!when || when.mode === "now" || isStale(when, now)) return { verb: "leave", time: "now" };
  const day = dayWord(when.at, now);
  return {
    verb: when.mode === "arrive" ? "arrive by" : "leave at",
    time: day === "Today" ? clock(when.at) : `${day === "Tomorrow" ? "tomorrow" : day} at ${clock(when.at)}`,
  };
}

// A picked time that has already passed means "now".
export const isStale = (when, now = Date.now()) => Boolean(when && when.mode !== "now" && Date.parse(when.at) < now - 60000);

// What the server wants: {arrive_by} or {depart_at} as ISO times, or nothing for "now".
export function whenParams(when) {
  if (!when || when.mode === "now" || isStale(when)) return {};
  return when.mode === "arrive" ? { arrive_by: when.at } : { depart_at: when.at };
}

// The reverse: what a plan from the server was for, as the picker's state.
export function whenFromPlan(w) {
  if (w?.arrive_by) return { mode: "arrive", at: w.arrive_by };
  if (w?.depart_at) return { mode: "depart", at: w.depart_at };
  return { mode: "now" };
}

// WMATA reports minutes as a number, or "ARR" (arriving) and "BRD" (boarding).
export function arrivalText(min) {
  if (min === "ARR") return "Arriving";
  if (min === "BRD") return "Boarding";
  const n = Number(min);
  return Number.isFinite(n) ? `${n} min` : String(min);
}
export const isArriving = (min) => min === "ARR" || min === "BRD" || Number(min) <= 1;

export function greeting(date = new Date()) {
  const h = Number(date.toLocaleString("en-US", { hour: "numeric", hour12: false, timeZone: TZ }));
  return h < 12 ? "Good morning" : h < 17 ? "Good afternoon" : "Good evening";
}

export function metersBetween(a, b) {
  const r = 6371000, rad = Math.PI / 180;
  const dLat = (b.lat - a.lat) * rad, dLng = (b.lng - a.lng) * rad;
  const h = Math.sin(dLat / 2) ** 2 + Math.cos(a.lat * rad) * Math.cos(b.lat * rad) * Math.sin(dLng / 2) ** 2;
  return 2 * r * Math.asin(Math.sqrt(h));
}

// A wall-clock date and time in DC ("2026-09-28", "14:00") as an ISO instant, whatever the phone's time zone.
export function dcTime(date, time) {
  const [y, mo, d] = date.split("-").map(Number);
  const [h, mi] = time.split(":").map(Number);
  const wanted = Date.UTC(y, mo - 1, d, h, mi);
  const fmt = new Intl.DateTimeFormat("en-US", {
    timeZone: TZ, hourCycle: "h23", year: "numeric", month: "2-digit", day: "2-digit", hour: "2-digit", minute: "2-digit",
  });
  let guess = wanted;
  for (let i = 0; i < 2; i++) {
    const p = Object.fromEntries(fmt.formatToParts(new Date(guess)).map((x) => [x.type, Number(x.value)]));
    guess += wanted - Date.UTC(p.year, p.month - 1, p.day, p.hour, p.minute);
  }
  return new Date(guess).toISOString();
}

// The reverse: an instant as DC {date, time} strings for the pickers.
export function dcParts(iso) {
  const t = new Date(iso);
  return {
    date: dayKey(t),
    time: t.toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit", hour12: false, timeZone: TZ }),
  };
}
