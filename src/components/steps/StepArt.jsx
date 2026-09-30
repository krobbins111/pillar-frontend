// Pictures of the things a rider needs to recognize: the station pillar, the front of the train or bus with its
// LED sign, and the bus stop sign. Drawn in the colors of DC's own fleet: brushed steel, the railcars' brown
// front and red/white/blue stripe, Metrobus blue and red. The words on the signs are what stands out.

const upper = (s) => String(s || "").toUpperCase();
const LED = "Doto, 'Courier New', monospace";
const SANS = "Helvetica, Arial, sans-serif";

// Like a real head sign: one line if it fits, else two lines split near the middle. Returns lines and a font size.
function signLines(text, room, max, height) {
  const width = (t, size) => t.length * size * 0.74;
  if (width(text, max) <= room) return { lines: [text], size: max };
  const words = text.split(" ");
  let best = [text];
  if (words.length > 1) {
    let bestDiff = Infinity;
    for (let i = 1; i < words.length; i++) {
      const a = words.slice(0, i).join(" "), b = words.slice(i).join(" ");
      const diff = Math.abs(a.length - b.length);
      if (diff < bestDiff) { bestDiff = diff; best = [a, b]; }
    }
  }
  const longest = Math.max(...best.map((l) => l.length));
  const size = Math.min(best.length > 1 ? height / 2.3 : max, room / (longest * 0.74));
  return { lines: best, size: Math.max(8, size) };
}

// Amber (train) or white-blue (bus) dots with a soft glow, right-aligned at x, centered on y.
function SignText({ text, x, y, room, max, height, color, glow }) {
  const { lines, size } = signLines(text, room, max, height);
  const gap = size * 1.05;
  const first = y - ((lines.length - 1) * gap) / 2 + size * 0.36;
  return (
    <text x={x} textAnchor="end" fontSize={size} fontWeight="900" fill={color} fontFamily={LED} letterSpacing=".5" filter={`url(#${glow})`}>
      {lines.map((l, i) => <tspan key={i} x={x} y={first + i * gap}>{l}</tspan>)}
    </text>
  );
}

function Glow({ id }) {
  return (
    <filter id={id} x="-10%" y="-40%" width="120%" height="180%">
      <feGaussianBlur stdDeviation="1.1" result="b" />
      <feMerge><feMergeNode in="b" /><feMergeNode in="SourceGraphic" /></feMerge>
    </filter>
  );
}

function Steel({ id }) {
  return (
    <linearGradient id={id} x1="0" y1="0" x2="0" y2="1">
      <stop offset="0" stopColor="#F4F5F7" /><stop offset=".55" stopColor="#D3D8DD" /><stop offset="1" stopColor="#B4BBC2" />
    </linearGradient>
  );
}

export function MetroPylon({ colors = ["#BF0D3E"] }) {
  const bands = colors.slice(0, 4);
  return (
    <svg className="art art--pylon" viewBox="0 0 120 220" role="img" aria-label="Metro entrance: a tall brown pillar with an M at the top">
      <defs>
        <linearGradient id="pylon-face" x1="0" x2="1">
          <stop offset="0" stopColor="#5A463D" /><stop offset=".45" stopColor="#3A2C26" /><stop offset="1" stopColor="#2A201B" />
        </linearGradient>
      </defs>
      <path d="M74 12 86 5v197l-12 6z" fill="#1F1713" />
      <path d="M38 12 50 5h36l-12 7z" fill="#6B584E" />
      <rect x="38" y="12" width="36" height="196" fill="url(#pylon-face)" />
      <text x="56" y="47" textAnchor="middle" fontSize="31" fontWeight="700" fill="#FFFFFF" fontFamily={SANS}>M</text>
      {bands.map((c, i) => <rect key={i} x="42" y={58 + i * 9} width="28" height="6" fill={c} />)}
      <path d="M40 14v192" stroke="#fff" strokeOpacity=".18" strokeWidth="2" />
      <path d="M30 206h62l-4 8H34z" fill="#2A201B" />
    </svg>
  );
}

export function TrainFront({ color = "#BF0D3E", lineName = "Red", headsign = "" }) {
  const dest = upper(headsign);
  return (
    <svg className="art art--train" viewBox="0 0 320 206" role="img" aria-label={`Front of a ${lineName} Line train. Its sign says ${headsign}`}>
      <defs>
        <Steel id="train-steel" />
        <linearGradient id="train-mask" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#4E3D35" /><stop offset="1" stopColor="#2A201B" />
        </linearGradient>
        <linearGradient id="train-glass" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#3B2F28" /><stop offset="1" stopColor="#1B1512" />
        </linearGradient>
        <Glow id="train-glow" />
      </defs>
      <path d="M28 198V66c0-28 20-46 50-46h164c30 0 50 18 50 46v132z" fill="url(#train-steel)" stroke="#7E868E" strokeWidth="2.5" />
      {[25, 28.5].map((y) => <path key={y} d={`M84 ${y}H236`} stroke="#fff" strokeOpacity=".55" />)}
      <rect x="44" y="34" width="232" height="114" rx="16" fill="url(#train-mask)" />
      <rect x="60" y="44" width="200" height="30" rx="4" fill="#0B0908" />
      <circle cx="77" cy="59" r="8.5" fill={color} />
      <text x="91" y="65" fontSize="15" fontWeight="900" fill="#FFB020" fontFamily={LED} letterSpacing=".5" filter="url(#train-glow)">{upper(lineName)}</text>
      <SignText text={dest} x={252} y={59} room={250 - 150} max={19} height={28} color="#FFB020" glow="train-glow" />
      <rect x="60" y="82" width="122" height="56" rx="6" fill="url(#train-glass)" />
      <rect x="190" y="82" width="70" height="56" rx="6" fill="url(#train-glass)" />
      <path d="M70 86h40l-22 48H70z" fill="#fff" opacity=".08" />
      <path d="M196 86h24l-16 48h-8z" fill="#fff" opacity=".07" />
      <rect x="28" y="154" width="264" height="7" fill="#C8102E" />
      <rect x="28" y="161" width="264" height="7" fill="#FFFFFF" />
      <rect x="28" y="168" width="264" height="7" fill="#203F8F" />
      <rect x="54" y="180" width="30" height="10" rx="5" fill="#FFF3CC" stroke="#8A8F95" strokeWidth="1.5" />
      <rect x="236" y="180" width="30" height="10" rx="5" fill="#FFF3CC" stroke="#8A8F95" strokeWidth="1.5" />
      <circle cx="96" cy="185" r="4" fill="#B3261E" /><circle cx="224" cy="185" r="4" fill="#B3261E" />
      <rect x="36" y="196" width="248" height="8" rx="2" fill="#3A3F46" />
      <rect x="148" y="190" width="24" height="12" rx="2" fill="#2A2E33" />
    </svg>
  );
}

export function BusFront({ code = "", headsign = "" }) {
  const dest = upper(headsign);
  return (
    <svg className="art art--bus" viewBox="0 0 320 206" role="img" aria-label={`Front of a bus. Its sign says ${code} ${headsign}`}>
      <defs>
        <Steel id="bus-steel" />
        <linearGradient id="bus-glass" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#2C3A4A" /><stop offset="1" stopColor="#151C24" />
        </linearGradient>
        <Glow id="bus-glow" />
      </defs>
      <path d="M48 50c-14 0-18 8-18 18v22" fill="none" stroke="#2E3338" strokeWidth="4" />
      <path d="M272 50c14 0 18 8 18 18v22" fill="none" stroke="#2E3338" strokeWidth="4" />
      <rect x="21" y="84" width="16" height="34" rx="4" fill="#2E3338" />
      <rect x="283" y="84" width="16" height="34" rx="4" fill="#2E3338" />
      <path d="M48 196V40c0-18 13-30 31-30h162c18 0 31 12 31 30v156z" fill="url(#bus-steel)" stroke="#7E868E" strokeWidth="2.5" />
      <rect x="62" y="20" width="196" height="32" rx="4" fill="#0B0908" />
      <text x="71" y="44" fontSize="22" fontWeight="900" fill="#CFE8FF" fontFamily={LED} letterSpacing=".5" filter="url(#bus-glow)">{code}</text>
      <SignText text={dest} x={250} y={36} room={250 - (80 + code.length * 17)} max={18} height={30} color="#CFE8FF" glow="bus-glow" />
      <path d="M58 62h204v72c0 6-4 10-10 10H68c-6 0-10-4-10-10z" fill="url(#bus-glass)" />
      <path d="M160 62v82" stroke="#0E1318" strokeWidth="3" />
      <path d="M70 66h44l-30 74H70z" fill="#fff" opacity=".07" />
      <path d="M96 140l40-26M184 140l40-26" stroke="#11161B" strokeWidth="2.5" strokeLinecap="round" />
      <path d="M48 156c70-10 150-14 224-20v10c-74 6-154 10-224 20z" fill="#C9281E" />
      <path d="M48 166c70-10 150-14 224-20v50H48z" fill="#27459A" />
      <rect x="62" y="170" width="34" height="13" rx="5" fill="#FFF3CC" stroke="#8A8F95" strokeWidth="1.5" />
      <rect x="224" y="170" width="34" height="13" rx="5" fill="#FFF3CC" stroke="#8A8F95" strokeWidth="1.5" />
      <rect x="54" y="192" width="212" height="10" rx="3" fill="#2E3338" />
    </svg>
  );
}

export function BusStopSign({ codes = [] }) {
  return (
    <svg className="art art--stop" viewBox="0 0 140 206" role="img" aria-label={`Bus stop sign listing ${codes.join(", ")}`}>
      <rect x="66" y="20" width="8" height="184" rx="2" fill="#8A8F95" />
      <rect x="20" y="14" width="100" height="100" rx="6" fill="#FFFFFF" stroke="#27459A" strokeWidth="3" />
      <path d="M20 20a6 6 0 0 1 6-6h88a6 6 0 0 1 6 6v20H20z" fill="#C9281E" />
      <text x="70" y="33" textAnchor="middle" fontSize="13" fontWeight="700" fill="#fff" fontFamily={SANS} letterSpacing="1">BUS STOP</text>
      {codes.slice(0, 3).map((c, i) => (
        <g key={c}>
          <rect x="32" y={48 + i * 20} width="76" height="16" rx="3" fill="#27459A" />
          <text x="70" y={60.5 + i * 20} textAnchor="middle" fontSize="12" fontWeight="700" fill="#fff" fontFamily={SANS}>{c}</text>
        </g>
      ))}
    </svg>
  );
}
