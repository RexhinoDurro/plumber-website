/* Dashboard service worker: shows push notifications for new chats and quote requests,
   even when the dashboard isn't open, and opens the right page when tapped. */

self.addEventListener("install", () => self.skipWaiting());
self.addEventListener("activate", (e) => e.waitUntil(self.clients.claim()));

self.addEventListener("push", (event) => {
  let data = {};
  try {
    data = event.data ? event.data.json() : {};
  } catch {
    data = { title: "New activity", body: event.data ? event.data.text() : "" };
  }
  event.waitUntil(
    (async () => {
      // Don't buzz the phone if the dashboard is already open and in view: it shows its own alert.
      const windows = await self.clients.matchAll({ type: "window", includeUncontrolled: true });
      if (windows.some((w) => w.visibilityState === "visible" && w.url.includes("/admin"))) return;
      await self.registration.showNotification(data.title || "New activity", {
        body: data.body || "",
        tag: data.tag || data.url || "dashboard",
        renotify: true,
        icon: "/admin-icon-192.png",
        badge: "/admin-icon-192.png",
        data: { url: data.url || "/admin" },
      });
    })(),
  );
});

self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  const url = new URL(event.notification.data?.url || "/admin", self.location.origin).href;
  event.waitUntil(
    (async () => {
      const windows = await self.clients.matchAll({ type: "window", includeUncontrolled: true });
      for (const w of windows) {
        if (w.url.includes("/admin") && "focus" in w) {
          await w.navigate(url).catch(() => {});
          return w.focus();
        }
      }
      return self.clients.openWindow(url);
    })(),
  );
});
