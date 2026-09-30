import {
  Armchair, ArrowLeftRight, BellRing, Compass, CreditCard, DoorOpen, Footprints, ListOrdered, LogOut, MapPin, Signpost, TrainTrack,
  TriangleAlert,
} from "lucide-react";
import { BusIcon, ElevatorIcon, EscalatorIcon, PillarIcon, StairsIcon, TrainIcon } from "../icons/Transit";

const ICONS = {
  card: CreditCard, signs: Signpost, sign: Signpost, platform: TrainTrack, train: TrainIcon, bus: BusIcon, door: DoorOpen,
  stops: ListOrdered, bell: BellRing, exit: LogOut, transfer: ArrowLeftRight, pin: MapPin, pillar: PillarIcon, seat: Armchair,
  walk: Footprints, escalator: EscalatorIcon, stairs: StairsIcon, elevator: ElevatorIcon, compass: Compass, caution: TriangleAlert,
};

// Numbered "do this" list. Every line comes from the trip data (see backend trips._guides).
export default function GuideList({ title, items }) {
  if (!items?.length) return null;
  return (
    <section className="guide" aria-label={title}>
      <h3 className="guide__title">{title}</h3>
      <ol className="guide__list">
        {items.map((item, i) => {
          const Icon = ICONS[item.icon] || MapPin;
          return (
            <li key={i} className="guide__item">
              <span className="guide__num" aria-hidden="true">{i + 1}</span>
              <Icon className="guide__icon" size={22} aria-hidden="true" />
              <span className="guide__text">{item.text}</span>
            </li>
          );
        })}
      </ol>
    </section>
  );
}
