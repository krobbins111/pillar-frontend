import { useEffect, useRef } from "react";
import { Info, MapPin, TriangleAlert } from "lucide-react";
import ArrivalSign from "./ArrivalSign";
import StopProgress, { stopsRemaining } from "./StopProgress";
import DirectionBoard from "./steps/DirectionBoard";
import GuideList from "./steps/GuideList";
import JourneyStrip from "./steps/JourneyStrip";
import LineDiagram from "./steps/LineDiagram";
import { BusFront, BusStopSign, MetroPylon, TrainFront } from "./steps/StepArt";
import TurnList from "./steps/TurnList";

// What the rider sees for the step they're on: the whole trip at a glance, one big instruction,
// a picture of exactly what to look for, then detailed numbered steps.
export function stepText(step, phase, boardedAt, now) {
  const riding = step.kind !== "walk" && phase === "ride";
  const vehicle = step.kind === "rail" ? "train" : "bus";
  if (step.kind === "walk") return { label: "Walking", title: step.title, detail: step.detail };
  if (!riding) {
    return { label: step.kind === "rail" ? "At the station" : "At the bus stop", title: step.title, detail: `Ride ${step.stops} stop${step.stops === 1 ? "" : "s"} to ${step.alight}.` };
  }
  const left = stopsRemaining(step, boardedAt, now);
  return {
    label: `On the ${vehicle}`,
    title: left <= 1 ? `Get off at the next stop: ${step.alight}` : `Stay on for ${left} more stops`,
    detail: `Your stop is ${step.alight}.`,
  };
}

export function guideFor(step, phase) {
  if (step.kind === "walk") return { title: "Look for", items: step.guide?.walk };
  return phase === "ride"
    ? { title: step.kind === "rail" ? "On the train" : "On the bus", items: step.guide?.ride }
    : { title: "What to do", items: step.guide?.wait };
}

export default function StepCard({ trip, index, phase, boardedAt, now }) {
  const step = trip.steps[index];
  const next = trip.steps[index + 1];
  const riding = step.kind !== "walk" && phase === "ride";
  const text = stepText(step, phase, boardedAt, now);
  const guide = guideFor(step, phase);
  const top = useRef(null);
  // Every new step (or boarding) starts at the top of the sheet, with the big instruction in view.
  useEffect(() => { top.current?.scrollIntoView({ block: "start" }); }, [index, phase]);

  return (
    <section className="step" aria-live="polite" ref={top}>
      <JourneyStrip steps={trip.steps} index={index} />
      <p className="step__count">Step {index + 1} of {trip.steps.length} · {text.label}</p>
      <h2 className="step__title">{text.title}</h2>
      <p className="step__detail">{text.detail}</p>

      <div className="hero">
        {step.kind === "walk" && <WalkHero step={step} next={next} destination={trip.summary.destination} />}
        {step.kind === "rail" && !riding && (
          <>
            <figure className="hero__art">
              <TrainFront color={step.line.color} lineName={step.line.name.replace(/ Line$/, "")} headsign={step.headsign} />
              <figcaption>Get on a train that says <b>{step.headsign}</b></figcaption>
            </figure>
            <DirectionBoard step={step} />
          </>
        )}
        {step.kind === "bus" && !riding && (
          <>
            <figure className="hero__art">
              <BusFront code={step.line.code} headsign={step.headsign} />
              <figcaption>Look for <b>{step.line.code}</b> on the sign above the windshield</figcaption>
            </figure>
            <ArrivalSign stopId={step.board_stop_id} busRoute={step.line.code} headsign={step.headsign} variant="head" />
          </>
        )}
        {riding && (step.stop_list?.length || step.kind === "rail"
          ? <LineDiagram step={step} boardedAt={boardedAt} now={now} riding />
          : <StopProgress step={step} boardedAt={boardedAt} now={now} />)}
      </div>

      <GuideList title={guide.title} items={guide.items} />
      {step.kind === "walk" && <TurnList turns={step.turn_list} />}

      {step.watch_out?.length > 0 && (
        <ul className="notes">
          {step.watch_out.map((n, i) => (
            <li key={i} className={`note note--${n.tone}`}>
              {n.tone === "caution" ? <TriangleAlert size={20} aria-hidden="true" /> : <Info size={20} aria-hidden="true" />}
              <span>{n.text}</span>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}

function WalkHero({ step, next, destination }) {
  if (next?.kind === "rail") {
    return (
      <figure className="hero__art hero__art--row">
        <MetroPylon colors={[next.line.color]} />
        <figcaption>
          <b>Look for this pillar</b>
          <span className="hero__sub">It marks the entrance to {next.board} station.</span>
        </figcaption>
      </figure>
    );
  }
  if (next?.kind === "bus") {
    return (
      <figure className="hero__art hero__art--row">
        <BusStopSign codes={[next.line.code]} />
        <figcaption><b>Your stop:</b> {next.board}<span className="hero__sub">The sign lists {next.line.code}.</span></figcaption>
      </figure>
    );
  }
  return (
    <figure className="hero__art hero__art--row hero__art--dest">
      <span className="hero__pin"><MapPin size={40} aria-hidden="true" /></span>
      <figcaption><b>{destination}</b><span className="hero__sub">{step.detail}</span></figcaption>
    </figure>
  );
}
