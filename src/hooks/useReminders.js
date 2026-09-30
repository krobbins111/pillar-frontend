import { useCallback, useEffect, useState } from "react";
import { api } from "../api";
import { PUSH_HELP, usePush } from "./usePush";

// "Remind me when to leave": the server re-checks the trip 30 minutes ahead, then sends
// "Leave in 10 minutes" and "Time to leave" to this phone.
export function useReminders(pushKey) {
  const push = usePush(pushKey);
  const [list, setList] = useState([]);

  const refresh = useCallback(async () => {
    if (!push.endpoint) return;
    try { setList((await api.reminders(push.endpoint)).reminders || []); } catch { /* keep what we had */ }
  }, [push.endpoint]);
  useEffect(() => {
    refresh();
    // Sent reminders drop off the list; check again when the app comes back to the front.
    const again = () => { if (document.visibilityState === "visible") refresh(); };
    document.addEventListener("visibilitychange", again);
    return () => document.removeEventListener("visibilitychange", again);
  }, [refresh]);

  const remind = useCallback(async ({ trip, plan, origin }) => {
    if (push.blocker) throw new Error(PUSH_HELP[push.blocker] || "Reminders aren't available yet.");
    const subscription = await push.subscribe();
    const res = await api.remind({
      subscription,
      trip,
      origin: origin ? { name: origin.name, lat: origin.lat, lng: origin.lng } : null,
      destination: plan?.destination || trip.summary.destination,
      arrive_by: plan?.when?.arrive_by || null,
      depart_at: plan?.when?.depart_at || null,
      step_free: Boolean(plan?.step_free),
    });
    setList((l) => [...l.filter((r) => r.id !== res.reminder.id), res.reminder].sort((a, b) => a.leave_at.localeCompare(b.leave_at)));
    return res.reminder;
  }, [push]);

  const cancel = useCallback(async (id) => {
    setList((l) => l.filter((r) => r.id !== id));
    try { await api.cancelReminder(id, push.endpoint); } catch { refresh(); }
  }, [push.endpoint, refresh]);

  const has = useCallback((trip) => list.some((r) => r.leave_at === trip.summary.leave_at
    && r.destination === trip.summary.destination), [list]);

  const upcoming = list.filter((r) => Date.parse(r.leave_at) > Date.now() - 10 * 60000);
  return { available: push.blocker !== "off", blocker: push.blocker, list: upcoming, remind, cancel, has, refresh };
}
