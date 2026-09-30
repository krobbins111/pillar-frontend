import { useCallback, useEffect, useState } from "react";

// Phone notifications for "time to leave" reminders (Web Push).
// iPhone/iPad: only works for the app added to the Home Screen (iOS 16.4+), and only over HTTPS.
const isIOS = () => /iPad|iPhone|iPod/.test(navigator.userAgent) || (navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1);
const isStandalone = () => window.navigator.standalone === true || window.matchMedia?.("(display-mode: standalone)").matches;

function keyBytes(base64) {
  const pad = "=".repeat((4 - (base64.length % 4)) % 4);
  const raw = atob((base64 + pad).replace(/-/g, "+").replace(/_/g, "/"));
  return Uint8Array.from(raw, (c) => c.charCodeAt(0));
}

export function usePush(pushKey) {
  const available = typeof window !== "undefined" && window.isSecureContext && "serviceWorker" in navigator;
  const [registration, setRegistration] = useState(null);
  const [endpoint, setEndpoint] = useState(null);

  useEffect(() => {
    if (!available) return;
    navigator.serviceWorker.register("/sw.js").then(async (reg) => {
      setRegistration(reg);
      const sub = await reg.pushManager?.getSubscription();
      if (sub) setEndpoint(sub.endpoint);
    }).catch(() => {});
  }, [available]);

  // Why reminders can't be offered right now, in words the rider can act on (or null when they can).
  let blocker = null;
  if (!pushKey) blocker = "off";                                   // server has no VAPID keys yet: hide the button
  else if (isIOS() && !isStandalone()) blocker = "homescreen";
  else if (!available || !("PushManager" in window) || !("Notification" in window)) blocker = "unsupported";
  else if (Notification.permission === "denied") blocker = "denied";

  const subscribe = useCallback(async () => {
    const reg = registration || (await navigator.serviceWorker.ready);
    const permission = await Notification.requestPermission();
    if (permission !== "granted") throw new Error("Notifications are turned off for this app. Turn them on in your phone's Settings to get reminders.");
    const sub = (await reg.pushManager.getSubscription())
      || (await reg.pushManager.subscribe({ userVisibleOnly: true, applicationServerKey: keyBytes(pushKey) }));
    setEndpoint(sub.endpoint);
    return sub.toJSON();
  }, [registration, pushKey]);

  return { blocker, endpoint, subscribe };
}

// This phone's push address right now (null if it never subscribed). Used to prove a reminder is ours.
export async function currentEndpoint() {
  try {
    const reg = await navigator.serviceWorker?.getRegistration?.();
    const sub = await (reg || (await navigator.serviceWorker.ready)).pushManager?.getSubscription();
    return sub?.endpoint || null;
  } catch {
    return null;
  }
}

export const PUSH_HELP = {
  homescreen: "To get reminders on iPhone, add this app to your Home Screen first: tap the Share button, then “Add to Home Screen.” Then open it from there.",
  unsupported: "This browser can't show reminders. Try Chrome or Safari, or add the app to your Home Screen.",
  denied: "Notifications are turned off for this app. Turn them on in your phone's Settings to get reminders.",
};

// Tapping a notification opens "/?reminder=<id>" (or messages an open window with that URL).
export function useReminderLinks(onOpen) {
  useEffect(() => {
    const read = (href) => new URL(href, window.location.origin).searchParams.get("reminder");
    const first = read(window.location.href);
    if (first) {
      onOpen(first);
      window.history.replaceState(null, "", window.location.pathname);
    }
    if (!("serviceWorker" in navigator)) return undefined;
    const listen = (e) => { if (e.data?.type === "open") { const id = read(e.data.url); if (id) onOpen(id); } };
    navigator.serviceWorker.addEventListener("message", listen);
    return () => navigator.serviceWorker.removeEventListener("message", listen);
  }, [onOpen]);
}
