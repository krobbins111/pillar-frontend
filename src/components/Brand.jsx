import { PillarIcon } from "./icons/Transit";

// The app's name in the nav bar: the station pillar and "Pillar".
export default function Brand() {
  return <p className="nav__brand"><PillarIcon size={22} /><span>Pillar</span></p>;
}
