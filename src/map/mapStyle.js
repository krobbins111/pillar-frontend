// "Station concrete": a quiet, warm-gray base so only transit lines carry color.
// Google's own transit layer is hidden; we draw WMATA's lines and live vehicles ourselves.
export const MAP_STYLE = [
  { elementType: "geometry", stylers: [{ color: "#E6E4DF" }] },
  { elementType: "labels.text.fill", stylers: [{ color: "#4A3C33" }] },
  { elementType: "labels.text.stroke", stylers: [{ color: "#F4F3F0" }, { weight: 4 }] },
  { featureType: "administrative", elementType: "geometry", stylers: [{ visibility: "off" }] },
  { featureType: "administrative.neighborhood", elementType: "labels.text.fill", stylers: [{ color: "#6B5E54" }] },
  { featureType: "landscape.man_made", elementType: "geometry", stylers: [{ color: "#E1DED8" }] },
  { featureType: "poi", stylers: [{ visibility: "off" }] },
  { featureType: "poi.park", elementType: "geometry", stylers: [{ visibility: "on" }, { color: "#D3DCC7" }] },
  { featureType: "poi.park", elementType: "labels", stylers: [{ visibility: "off" }] },
  { featureType: "road", elementType: "geometry", stylers: [{ color: "#FFFFFF" }] },
  { featureType: "road", elementType: "labels.icon", stylers: [{ visibility: "off" }] },
  { featureType: "road.highway", elementType: "geometry", stylers: [{ color: "#F3EDE3" }] },
  { featureType: "road.highway", elementType: "geometry.stroke", stylers: [{ color: "#DDD5C8" }] },
  { featureType: "road.local", elementType: "labels", stylers: [{ visibility: "simplified" }] },
  { featureType: "transit", stylers: [{ visibility: "off" }] },
  { featureType: "water", elementType: "geometry", stylers: [{ color: "#C9D9DF" }] },
  { featureType: "water", elementType: "labels.text.fill", stylers: [{ color: "#5B7580" }] },
];

export const DC_DEFAULT = { lat: 38.948, lng: -77.0795 }; // Tenleytown
