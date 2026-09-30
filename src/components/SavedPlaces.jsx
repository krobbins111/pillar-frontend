import { Home, MapPin, ShoppingBag, Stethoscope, User, Trees, Utensils, Church } from "lucide-react";

const ICONS = { home: Home, "shopping-bag": ShoppingBag, stethoscope: Stethoscope, user: User, park: Trees, food: Utensils, church: Church };

export default function SavedPlaces({ places, onPick }) {
  if (!places?.length) return null;
  return (
    <div className="places">
      {places.map((p) => {
        const Icon = ICONS[p.icon] || MapPin;
        return (
          <button key={p.name} type="button" className="place" onClick={() => onPick(p)}>
            <Icon size={22} aria-hidden="true" />
            <span>{p.name}</span>
          </button>
        );
      })}
    </div>
  );
}
