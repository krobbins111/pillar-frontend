import { CircleCheck, MapPin, TriangleAlert } from "lucide-react";
import { api } from "../api";
import ArrivalBoard from "../components/ArrivalBoard";
import { usePoll } from "../hooks/usePoll";
import { useNow } from "../hooks/useNow";

// The always-on counter screen (a Pi in kiosk mode, or an old tablet): home station's platform board.
export default function CounterLayout({ profile }) {
  const station = profile?.home_station;
  const now = useNow(15000);
  const { data, error } = usePoll(() => api.arrivals({ station }), 20000, [station], Boolean(station));
  const time = new Date(now).toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit", timeZone: "America/New_York" });
  const day = new Date(now).toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric", timeZone: "America/New_York" });

  return (
    <div className="counter">
      <header className="counter__head">
        <div>
          <h1>{data?.station?.name || "Your station"}</h1>
          <p className="counter__date">{day}</p>
        </div>
        <p className="counter__clock">{time}</p>
      </header>
      {error && <p className="counter__error">{error.message}</p>}
      {!station && <p className="counter__error">Set home_station in profile.json to show your station.</p>}
      <ArrivalBoard trains={data?.trains} />
      <footer className="counter__foot">
        {data && (data.outages?.length ? (
          <span className="counter__status counter__status--issue">
            <TriangleAlert size={24} aria-hidden="true" /> Elevator out: {data.outages[0].where}
          </span>
        ) : (
          <span className="counter__status"><CircleCheck size={24} aria-hidden="true" /> Elevators working</span>
        ))}
        <a className="counter__plan" href="/?view=companion"><MapPin size={24} aria-hidden="true" /> Plan a trip</a>
      </footer>
    </div>
  );
}
