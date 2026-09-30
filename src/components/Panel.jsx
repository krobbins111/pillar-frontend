import { CircleCheck, House, MessageCircleQuestion, Phone, Volume2, X } from "lucide-react";
import { greeting } from "../lib/format";
import { useNow } from "../hooks/useNow";
import Composer from "./Composer";
import HomeBoard from "./HomeBoard";
import PlacePicker from "./PlacePicker";
import QuickReplies from "./QuickReplies";
import SavedPlaces from "./SavedPlaces";
import StepCard, { guideFor, stepText } from "./StepCard";
import StatusStrip from "./StatusStrip";
import Thread from "./Thread";
import UpcomingReminders from "./UpcomingReminders";

// Everything that isn't the map or the nav bar. The phone sheet and the tablet side panel both render this.
// Where the rider starts and when they leave live in the nav bar; "Change" there opens the start picker here.
export default function Panel({ session, profile, origin, setOrigin, neighborhoods, stations, speech, assistant, reminders,
  onOpenReminder, mode, changingStart, setChangingStart }) {
  const now = useNow(10000);
  const places = profile?.places || [];
  const helper = profile?.helper;
  const pickerData = { places, stations, neighborhoods };

  if (session.asking === "where") {
    return (
      <PlacePicker
        title="Where are you now?"
        hint="Pick the station or neighborhood you're in, and I'll plan the way from there."
        helper={helper}
        {...pickerData}
        onPick={(p) => session.replanFrom(p)}
        onClose={() => session.setAsking(null)}
      />
    );
  }
  if (changingStart) {
    return (
      <PlacePicker
        title="Where are you starting from?"
        {...pickerData}
        onPick={(p) => { setOrigin(p); setChangingStart(false); }}
        onClose={() => setChangingStart(false)}
      />
    );
  }

  if (session.active) {
    const step = session.active.steps[session.index];
    const text = stepText(step, session.phase, session.boardedAt, now);
    const guide = guideFor(step, session.phase);
    const readAloud = [text.title, text.detail, ...(guide.items || []).map((g) => g.text)].join(". ");
    return (
      <div className="panel panel--ride">
        <StepCard trip={session.active} index={session.index} phase={session.phase} boardedAt={session.boardedAt} now={now} />
        <div className="tools">
          <button type="button" className="btn btn--quiet" onClick={() => speech.speak(readAloud)}>
            <Volume2 size={20} aria-hidden="true" /> Read aloud
          </button>
          {assistant && (
            <button type="button" className="btn btn--quiet" onClick={() => session.send("Can you explain this step in more detail?")} disabled={session.busy}>
              <MessageCircleQuestion size={20} aria-hidden="true" /> Explain more
            </button>
          )}
          {helper?.phone && (
            <a className="btn btn--quiet" href={`tel:${helper.phone}`}><Phone size={20} aria-hidden="true" /> Call {helper.name}</a>
          )}
          <button type="button" className="btn btn--quiet" onClick={session.endTrip}>
            <X size={20} aria-hidden="true" /> End trip
          </button>
        </div>
        {/* Only what was said during this trip; the planning chat stays behind. */}
        <section className="ride-chat" aria-label="Questions about this trip">
          <p className="ride-chat__title">Questions about this step?</p>
          <Thread messages={session.messages.slice(session.rideFrom).filter((m) => !m.trips)} busy={session.busy} limit={4} />
          <Composer onSend={session.send} speech={speech} busy={session.busy} placeholder="Ask about this step" inline />
        </section>
        <div className="ride-actions">
          <QuickReplies choices={session.replies} onPick={session.pick} disabled={session.busy} compact />
        </div>
      </div>
    );
  }

  const fresh = session.messages.length === 0;
  const arrival = fresh ? session.arrival : null;
  return (
    <div className="panel">
      {fresh && (
        <div className="welcome">
          <p className="welcome__hello">{greeting()}{profile?.rider_name ? `, ${profile.rider_name}` : ""}.</p>
          {arrival && <ArrivalCard arrival={arrival} canGoHome={Boolean(session.home)} onHome={session.goHome} busy={session.busy} />}
          <h1 className="welcome__title">{arrival && !arrival.home ? "Where to next?" : "Where to?"}</h1>
          <SavedPlaces places={places.filter((p) => p.name !== origin?.name && !(arrival && !arrival.home && p.name === session.home?.name))}
            onPick={session.planTo} />
          <UpcomingReminders list={reminders?.list} onOpen={onOpenReminder} onCancel={reminders?.cancel} />
          <StatusStrip origin={origin} />
        </div>
      )}
      <Thread
        messages={session.messages}
        busy={session.busy}
        previewId={session.previewId}
        onSelect={session.setPreviewId}
        onStart={session.start}
        origin={origin}
        reminders={reminders}

        onElevators={session.chooseElevators}
      />
      <QuickReplies choices={session.replies} onPick={session.pick} disabled={session.busy} />
      <Composer onSend={session.send} speech={speech} busy={session.busy} />
      {fresh && <HomeBoard origin={origin} station={origin?.name === "Home" ? profile?.home_station : null} mode={mode} />}
    </div>
  );
}

// After arriving somewhere: the outing's half done. One big button plans the way back (the same way first).
function ArrivalCard({ arrival, canGoHome, onHome, busy }) {
  if (arrival.home) {
    return (
      <section className="arrived" aria-live="polite">
        <p className="arrived__head"><CircleCheck size={26} aria-hidden="true" /> You made it home. Nice work.</p>
      </section>
    );
  }
  return (
    <section className="arrived" aria-live="polite">
      <p className="arrived__head"><CircleCheck size={26} aria-hidden="true" /> You made it to {arrival.to}. Nice work.</p>
      <p className="arrived__body">Let me know when you need to route home.</p>
      {canGoHome && (
        <button type="button" className="btn btn--primary btn--block" onClick={onHome} disabled={busy}>
          <House size={22} aria-hidden="true" /> Take me home
        </button>
      )}
      {canGoHome && arrival.lines?.length > 0 && <p className="arrived__note">I'll show the way you came first, if it's still running.</p>}
    </section>
  );
}
