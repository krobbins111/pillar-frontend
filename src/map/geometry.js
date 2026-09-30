// Small path helpers for gliding vehicles along their line. Paths are [[lat, lng], ...].
// Distances use a flat projection, which is plenty accurate at city scale.

const K = 111320; // meters per degree of latitude
const xy = ([lat, lng], cos) => [lng * K * cos, lat * K];

export function meters(a, b) {
  const cos = Math.cos((a[0] * Math.PI) / 180);
  const p = xy(a, cos), q = xy(b, cos);
  return Math.hypot(p[0] - q[0], p[1] - q[1]);
}

export function pathLength(pts) {
  let d = 0;
  for (let i = 1; i < pts.length; i++) d += meters(pts[i - 1], pts[i]);
  return d;
}

// Closest point on the path: segment index, fraction along it, the point, and how far away it is.
export function snap(path, p) {
  if (!path || path.length < 2) return null;
  const cos = Math.cos((p[0] * Math.PI) / 180);
  const P = xy(p, cos);
  let best = null;
  for (let i = 0; i < path.length - 1; i++) {
    const A = xy(path[i], cos), B = xy(path[i + 1], cos);
    const dx = B[0] - A[0], dy = B[1] - A[1];
    const len2 = dx * dx + dy * dy || 1;
    const t = Math.max(0, Math.min(1, ((P[0] - A[0]) * dx + (P[1] - A[1]) * dy) / len2));
    const X = [A[0] + t * dx, A[1] + t * dy];
    const d = Math.hypot(P[0] - X[0], P[1] - X[1]);
    if (!best || d < best.d) {
      best = { i, t, d, point: [path[i][0] + t * (path[i + 1][0] - path[i][0]), path[i][1] + t * (path[i + 1][1] - path[i][1])] };
    }
  }
  return best;
}

// The stretch of `path` between the points closest to a and b, in travel order (a -> b).
export function between(path, a, b, maxSnap = 220) {
  const sa = snap(path, a), sb = snap(path, b);
  if (!sa || !sb || sa.d > maxSnap || sb.d > maxSnap) return null;
  const forward = sa.i < sb.i || (sa.i === sb.i && sa.t <= sb.t);
  const out = [sa.point];
  if (forward) for (let i = sa.i + 1; i <= sb.i; i++) out.push(path[i]);
  else for (let i = sa.i; i > sb.i; i--) out.push(path[i]);
  out.push(sb.point);
  return out;
}

export function along(pts, f) {
  if (pts.length === 1 || f <= 0) return pts[0];
  const total = pathLength(pts);
  let target = f * total;
  for (let i = 1; i < pts.length; i++) {
    const d = meters(pts[i - 1], pts[i]);
    if (target <= d && d > 0) {
      const t = target / d;
      return [pts[i - 1][0] + t * (pts[i][0] - pts[i - 1][0]), pts[i - 1][1] + t * (pts[i][1] - pts[i - 1][1])];
    }
    target -= d;
  }
  return pts[pts.length - 1];
}
