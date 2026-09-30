// Who's signed in on this browser. Signing in once is enough: the token is kept until the phrase changes on the server
// (or someone visits /?signout). Things remembered for one person (where they're starting, a trip in progress, the
// last arrival) are cleared when a different person signs in.
const TOKEN = "pillar-token";
const USER = "pillar-user";
const PERSONAL = ["start-from", "pillar-trip", "pillar-arrival"];

const get = (k) => { try { return localStorage.getItem(k); } catch { return null; } };
const put = (k, v) => { try { if (v == null) localStorage.removeItem(k); else localStorage.setItem(k, v); } catch { /* private mode */ } };

export const token = () => get(TOKEN);

export function user() {
  try { return JSON.parse(get(USER)); } catch { return null; }
}

export function signIn({ token: t, user: u }) {
  if (user()?.username !== u.username) PERSONAL.forEach((k) => put(k, null));
  put(TOKEN, t);
  put(USER, JSON.stringify(u));
}

export function signOut() {
  put(TOKEN, null);
  window.dispatchEvent(new Event("pillar-signout"));
}
