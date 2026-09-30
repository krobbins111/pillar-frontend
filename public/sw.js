// Shows "time to leave" notifications sent by the server, and opens the trip when one is tapped.
// Nothing is cached here: the app always loads fresh, so a stale version can never give old directions.
self.addEventListener("install", () => self.skipWaiting());
self.addEventListener("activate", (event) => event.waitUntil(self.clients.claim()));

self.addEventListener("push", (event) => {
  let data = {};
  try { data = event.data ? event.data.json() : {}; } catch { data = { body: event.data?.text() }; }
  event.waitUntil(self.registration.showNotification(data.title || "Pillar", {
    body: data.body || "",
    tag: data.tag,
    renotify: true,
    requireInteraction: true,
    icon: "/icon-192.png",
    badge: "/icon-192.png",
    data: { url: data.url || "/" },
  }));
});

self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  const url = new URL(event.notification.data?.url || "/", self.location.origin).href;
  event.waitUntil((async () => {
    const open = await self.clients.matchAll({ type: "window", includeUncontrolled: true });
    const app = open.find((c) => new URL(c.url).origin === self.location.origin);
    if (app) {
      await app.focus();
      app.postMessage({ type: "open", url });
      return;
    }
    await self.clients.openWindow(url);
  })());
});
