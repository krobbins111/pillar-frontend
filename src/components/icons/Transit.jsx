// Small line icons in the same weight as the rest of the app's icons (24px grid, 2px stroke, currentColor),
// drawn after DC's own vehicles and station hardware.
const base = { viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: 2, strokeLinecap: "round", strokeLinejoin: "round" };
const Svg = ({ size = 24, className, children, label }) => (
  <svg {...base} width={size} height={size} className={className} aria-hidden={label ? undefined : "true"} role={label ? "img" : undefined} aria-label={label}>
    {children}
  </svg>
);

// Front of a classic Metro railcar: sign box, wide windshield, the stripe, two headlights.
export const TrainIcon = (p) => (
  <Svg {...p}>
    <path d="M5 19V8a5 5 0 0 1 5-5h4a5 5 0 0 1 5 5v11" />
    <rect x="8.5" y="5.2" width="7" height="2" rx=".6" fill="currentColor" stroke="none" />
    <path d="M5 12.5h14" />
    <path d="M5 15.5h14" strokeWidth="1.4" />
    <circle cx="8.3" cy="17.6" r=".9" fill="currentColor" stroke="none" />
    <circle cx="15.7" cy="17.6" r=".9" fill="currentColor" stroke="none" />
    <path d="M4 19h16M7.5 19l-2 3M16.5 19l2 3" />
  </Svg>
);

// Front of a Metrobus: head sign, big windshield, mirrors, bumper.
export const BusIcon = (p) => (
  <Svg {...p}>
    <path d="M5.5 19V6a3 3 0 0 1 3-3h7a3 3 0 0 1 3 3v13" />
    <rect x="8" y="4.8" width="8" height="1.9" rx=".6" fill="currentColor" stroke="none" />
    <path d="M5.5 13h13" />
    <path d="M3 7.5v3.5h2.5M21 7.5v3.5h-2.5" strokeWidth="1.6" />
    <circle cx="8.5" cy="16" r=".9" fill="currentColor" stroke="none" />
    <circle cx="15.5" cy="16" r=".9" fill="currentColor" stroke="none" />
    <path d="M4.5 19h15M7.5 19v2M16.5 19v2" />
  </Svg>
);

// The station pillar.
export const PillarIcon = (p) => (
  <Svg {...p}>
    <rect x="8.5" y="2" width="7" height="19" rx="1" />
    <path d="M8.5 8h7" />
    <path d="M10.5 5.5l1.5-1.2 1.5 1.2" strokeWidth="1.6" />
    <path d="M8.5 11h7M8.5 13.5h7" strokeWidth="1.4" />
    <path d="M6.5 22h11" />
  </Svg>
);

export const EscalatorIcon = (p) => (
  <Svg {...p}>
    <path d="M2 20h5.5L17 8h5" />
    <path d="M2 15.5h3.5L15 3.5h4.5" strokeWidth="1.6" />
    <path d="M9.5 17.3v-2.2M12 14.2V12M14.4 11.1V8.9" strokeWidth="1.4" />
  </Svg>
);

export const StairsIcon = (p) => (
  <Svg {...p}>
    <path d="M3 20h4.5v-4.5H12V11h4.5V6.5H21" />
    <path d="M3 20h18" strokeWidth="1.4" />
  </Svg>
);

export const ElevatorIcon = (p) => (
  <Svg {...p}>
    <rect x="3.5" y="2.5" width="17" height="19" rx="2" />
    <path d="M9 9.5l3-3 3 3M9 14.5l3 3 3-3" />
  </Svg>
);

export const FareGateIcon = (p) => (
  <Svg {...p}>
    <path d="M4 21V9a2 2 0 0 1 2-2h2v14M20 21V9a2 2 0 0 0-2-2h-2v14" />
    <path d="M8 13h3M16 13h-3" />
    <circle cx="6" cy="4" r="1.3" fill="currentColor" stroke="none" />
  </Svg>
);
