import { signOut, token } from "./lib/session";

// Every call the app makes. The Flask server holds all keys. Nothing here ever sends GPS:
// places are ones the rider picked, and the map center is only used to fetch what's on screen.
// Each call carries the sign-in token; if the server says it's no good, the sign-in page comes back.
async function read(res) {
  const data = await res.json().catch(() => ({}));
  if (res.status === 401 && data.signin) signOut();
  if (!res.ok || data.error) throw new Error(data.error || "Something went wrong. Try again.");
  return data;
}
// Where the API lives. Empty means this same site (local dev, or the Docker image that serves both). When the app is a
// separate static site, set VITE_API_BASE at build time to the API's address, e.g. in frontend/.env.production:
//   VITE_API_BASE=https://pillar-api.<something>.azurecontainerapps.io
const BASE = (import.meta.env.VITE_API_BASE || "").replace(/\/+$/, "");
function fetch(url, opts = {}) {
  const t = token();
  return window.fetch(BASE + url, { ...opts, headers: { ...(opts.headers || {}), ...(t ? { Authorization: `Bearer ${t}` } : {}) } });
}
const qs = (params) =>
  new URLSearchParams(Object.entries(params).filter(([, v]) => v !== null && v !== undefined && v !== "")).toString();
const post = (body) => ({ method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });

export const api = {
  login: (username, phrase) => fetch("/api/login", post({ username, phrase })).then(read),
  config: () => fetch("/api/config").then(read),
  profile: () => fetch("/api/profile").then(read),
  neighborhoods: () => fetch("/api/neighborhoods").then(read),
  network: () => fetch("/api/network").then(read),
  places: (q, loc) => fetch(`/api/places?${qs({ q, lat: loc?.lat, lng: loc?.lng })}`).then(read),
  trips: (body) => fetch("/api/trips", post(body)).then(read),
  live: (params) => fetch(`/api/live?${qs(params)}`).then(read),
  arrivals: (params) => fetch(`/api/arrivals?${qs(params)}`).then(read),
  busRoutes: (params) => fetch(`/api/bus-routes?${qs(params)}`).then(read),
  missedStop: (params) => fetch(`/api/missed-stop?${qs(params)}`).then(read),
  chat: (messages, context) => fetch("/api/chat", post({ messages, context })).then(read),
  status: (params) => fetch(`/api/status?${qs(params)}`).then(read),
  remind: (body) => fetch("/api/reminders", post(body)).then(read),
  reminders: (endpoint) => fetch(`/api/reminders?${qs({ endpoint })}`).then(read),
  cancelReminder: (id, endpoint) => fetch(`/api/reminders/${id}?${qs({ endpoint })}`, { method: "DELETE" }).then(read),
  reminderTrip: (id, endpoint) => fetch(`/api/reminders/${id}/trip?${qs({ endpoint })}`).then(read),
};
