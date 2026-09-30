// Side-view vehicles for the map, in DC's liveries. They face right (east); MovingMarker flips them when heading west.
//   Train: brushed steel, the brown window band of the classic railcars, and a stripe in the line's color.
//   Bus:   steel, Metrobus blue skirt with a red stripe.

export function TrainSide({ color = "#BF0D3E", title }) {
  return (
    <svg className="vehicle-art vehicle-art--train" viewBox="0 0 64 22" width="58" height="20" role="img" aria-label={title}>
      <title>{title}</title>
      <defs>
        <linearGradient id="ts-steel" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#F4F5F7" /><stop offset=".6" stopColor="#D0D5DA" /><stop offset="1" stopColor="#AEB5BC" />
        </linearGradient>
      </defs>
      {/* body with a sloped nose on the right */}
      <path d="M3 4.5h50c3.2 0 5.4 1.4 6.8 3.6l2.2 4v4.4c0 1.4-1.1 2.5-2.5 2.5H3.5A2.5 2.5 0 0 1 1 16.5V7a2.5 2.5 0 0 1 2-2.5z"
        fill="url(#ts-steel)" stroke="#5E6670" strokeWidth="1" />
      {/* brown window band */}
      <path d="M1.3 6.3h51.2c2.3 0 3.9.9 5 2.5l1.9 3.3H1.3z" fill="#3A2C26" />
      {/* line-color stripe */}
      <path d="M1.2 13.2h60.6v2.6H1.2z" fill={color} />
      {/* bronze-tinted windows */}
      <g fill="#2A211C">
        <rect x="4.5" y="7.4" width="7.5" height="3.6" rx=".8" />
        <rect x="18.5" y="7.4" width="8.5" height="3.6" rx=".8" />
        <rect x="33.5" y="7.4" width="8.5" height="3.6" rx=".8" />
        <path d="M50 7.4h4.4c1.3 0 2.3.6 2.9 1.6l1.1 2H50z" />
      </g>
      {/* doors */}
      <g fill="#B9C0C7" stroke="#8E969E" strokeWidth=".4">
        <rect x="13.4" y="6.6" width="4" height="12" rx=".6" />
        <rect x="28.4" y="6.6" width="4" height="12" rx=".6" />
        <rect x="43.4" y="6.6" width="4" height="12" rx=".6" />
      </g>
      <circle cx="60.3" cy="16.9" r="1" fill="#FFE8A3" />
      {/* bogies */}
      <g fill="#3A3F46"><circle cx="9" cy="20" r="1.8" /><circle cx="14" cy="20" r="1.8" /><circle cx="46" cy="20" r="1.8" /><circle cx="51" cy="20" r="1.8" /></g>
    </svg>
  );
}

export function BusSide({ title }) {
  return (
    <svg className="vehicle-art vehicle-art--bus" viewBox="0 0 52 26" width="46" height="23" role="img" aria-label={title}>
      <title>{title}</title>
      <defs>
        <linearGradient id="bs-steel" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#FAFBFC" /><stop offset="1" stopColor="#D5DADF" />
        </linearGradient>
      </defs>
      <path d="M3.5 3h40c2.6 0 4.4 1.3 5.3 3.6l1.7 6.6V19a2 2 0 0 1-2 2H3.5A2.5 2.5 0 0 1 1 18.5v-13A2.5 2.5 0 0 1 3.5 3z"
        fill="url(#bs-steel)" stroke="#5E6670" strokeWidth="1" />
      {/* Metrobus blue skirt with a red stripe that sweeps up toward the front */}
      <path d="M1.2 15.8C16 15.4 34 14.2 50.4 12.2v6.8c0 1.1-.9 2-2 2H3.5a2.3 2.3 0 0 1-2.3-2.3z" fill="#27459A" />
      <path d="M1.2 14.4C16 14 34 12.8 50 10.8l.3 1.4C34 14.2 16 15.4 1.2 15.8z" fill="#C9281E" />
      <g fill="#1F2A36">
        <rect x="4" y="5.6" width="8" height="5.4" rx="1" />
        <rect x="14" y="5.6" width="8" height="5.4" rx="1" />
        <rect x="24" y="5.6" width="8" height="5.2" rx="1" />
        <path d="M42 5.6h1.8c1.3 0 2.3.7 2.8 1.9l1.2 3.4H42z" />
      </g>
      <rect x="34" y="5.6" width="6" height="12" rx="1" fill="#B7BEC6" />
      <circle cx="49.2" cy="18.6" r=".9" fill="#FFE8A3" />
      <g fill="#2E3238"><circle cx="11" cy="21.5" r="3" /><circle cx="40" cy="21.5" r="3" /></g>
      <g fill="#9AA1A9"><circle cx="11" cy="21.5" r="1.1" /><circle cx="40" cy="21.5" r="1.1" /></g>
    </svg>
  );
}
