// Where Metro lines share track (Blue/Orange/Silver downtown, Yellow/Green, Blue/Yellow in Virginia), draw them side by
// side in lanes, like the official map, instead of on top of each other.
//
// Each stretch between two neighboring stations is shared by one or more lines. Lines on a stretch get lanes in a fixed
// order, centered on the track, `spacing` pixels apart. The offset is in screen pixels, so it's recomputed per zoom.

const ORDER = ["RD", "OR", "SV", "BL", "YL", "GR"]; // lane order across a shared stretch
const K = 111320; // meters per degree of latitude

const rank = (code) => (ORDER.indexOf(code) + 1 || ORDER.length + 1);
const pairKey = (a, b) => (a < b ? `${a}|${b}` : `${b}|${a}`);

// meters per screen pixel at a zoom level and latitude (Web Mercator, 256px tiles)
export const metersPerPixel = (zoom, lat) => (156543.03392 * Math.cos((lat * Math.PI) / 180)) / 2 ** zoom;

// Which lines use each stretch, in lane order.
export function sharedStretches(lines) {
  const users = new Map();
  lines.forEach((line) => {
    (line.stations || []).forEach((code, i) => {
      if (i === 0) return;
      const key = pairKey(line.stations[i - 1], code);
      const list = users.get(key) || [];
      if (!list.includes(line.code)) list.push(line.code);
      users.set(key, list);
    });
  });
  users.forEach((list) => list.sort((a, b) => rank(a) - rank(b)));
  return users;
}

// Offset of each stretch of one line, in pixels to the left of its direction of travel.
export function laneOffsets(line, users, spacing) {
  return (line.stations || []).slice(1).map((code, i) => {
    const prev = line.stations[i];
    const list = users.get(pairKey(prev, code)) || [line.code];
    const k = list.length;
    const off = (list.indexOf(line.code) - (k - 1) / 2) * spacing;
    // Lanes are laid out facing from the lower station code to the higher one; flip when this line runs the other way.
    return prev < code ? off : -off;
  });
}

// The line's path moved sideways by its lane offsets (pixels -> meters at this zoom). Mitered at stations where the lane
// stays the same; a short step where a line joins or leaves a shared stretch.
export function offsetPath(path, offsetsPx, mpp) {
  if (!path || path.length < 2) return path;
  const lat0 = path[0][0];
  const cos = Math.cos((lat0 * Math.PI) / 180);
  const P = path.map(([lat, lng]) => [lng * K * cos, lat * K]);
  const back = ([x, y]) => [y / K, x / (K * cos)];
  const normals = P.slice(1).map((q, i) => {
    const dx = q[0] - P[i][0], dy = q[1] - P[i][1];
    const len = Math.hypot(dx, dy) || 1;
    return [-dy / len, dx / len]; // left of travel
  });
  const off = offsetsPx.map((o) => o * mpp);
  const out = [];
  const shift = (p, n, d) => [p[0] + n[0] * d, p[1] + n[1] * d];
  out.push(back(shift(P[0], normals[0], off[0])));
  for (let j = 1; j < P.length - 1; j++) {
    const a = off[j - 1], b = off[j];
    if (Math.abs(a - b) < 1e-9) {
      const n = [normals[j - 1][0] + normals[j][0], normals[j - 1][1] + normals[j][1]];
      const len = Math.hypot(n[0], n[1]);
      if (len < 1e-6) { out.push(back(shift(P[j], normals[j], b))); continue; }
      const unit = [n[0] / len, n[1] / len];
      const cosHalf = unit[0] * normals[j][0] + unit[1] * normals[j][1];
      const miter = b / Math.max(cosHalf, 0.5); // cap sharp corners
      out.push(back(shift(P[j], unit, miter)));
    } else {
      out.push(back(shift(P[j], normals[j - 1], a)));
      out.push(back(shift(P[j], normals[j], b)));
    }
  }
  out.push(back(shift(P[P.length - 1], normals[normals.length - 1], off[off.length - 1])));
  return out;
}

// One offset per path segment. A line that follows its real track has many points between two stations
// (station_index says where each station is); every segment of a stretch gets that stretch's lane.
export function segmentOffsets(line, stretchOffsets) {
  const idx = line.station_index;
  if (!idx) return line.path.length === line.stations.length ? stretchOffsets : null;
  if (idx.length !== line.stations.length || idx[0] !== 0 || idx[idx.length - 1] !== line.path.length - 1) return null;
  const out = [];
  stretchOffsets.forEach((o, s) => { for (let j = idx[s]; j < idx[s + 1]; j++) out.push(o); });
  return out;
}

// All lines laid out in lanes for a zoom level: [{...line, path: offset path}]
export function laneLayout(lines, zoom, spacing) {
  if (!lines?.length) return [];
  const users = sharedStretches(lines);
  return lines.map((line) => {
    if (!line.path?.length || !line.stations?.length) return line;
    const offsets = segmentOffsets(line, laneOffsets(line, users, spacing));
    if (!offsets) return line;
    const mpp = metersPerPixel(zoom, line.path[0][0]);
    return { ...line, path: offsetPath(line.path, offsets, mpp) };
  });
}

// How many lines run through a station (for sizing its marker across the lanes).
export function linesAt(lines) {
  const count = new Map();
  lines.forEach((line) => (line.stations || []).forEach((c) => count.set(c, (count.get(c) || 0) + 1)));
  return count;
}
