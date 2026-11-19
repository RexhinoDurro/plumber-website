"use client";

import { api } from "./client";

const b64ToBytes = (b64: string) => {
  const pad = "=".repeat((4 - (b64.length % 4)) % 4);
  const raw = atob((b64 + pad).replace(/-/g, "+").replace(/_/g, "/"));
  return Uint8Array.from(raw, (c) => c.charCodeAt(0));
};

export const pushSupported = () =>
  typeof window !== "undefined" && "serviceWorker" in navigator && "PushManager" in window && "Notification" in window;

/** iPhones only allow push once the dashboard is added to the Home Screen. */
export const needsInstallForPush = () =>
  typeof navigator !== "undefined" &&
  /iPhone|iPad/.test(navigator.userAgent) &&
  !window.matchMedia("(display-mode: standalone)").matches;

export async function registerWorker() {
  if (!("serviceWorker" in navigator)) return null;
  return navigator.serviceWorker.register("/admin-sw.js", { scope: "/admin" });
}

export async function currentSubscription() {
  if (!pushSupported()) return null;
  const reg = await navigator.serviceWorker.getRegistration("/admin");
  return reg ? reg.pushManager.getSubscription() : null;
}

/** Ask permission, subscribe this device and tell the backend. Returns an error message or null. */
export async function enablePush(): Promise<string | null> {
  if (!pushSupported()) return "This browser can't receive push notifications.";
  if (needsInstallForPush()) return "On iPhone, first tap Share → Add to Home Screen, then open the dashboard from there.";
  const perm = await Notification.requestPermission();
  if (perm !== "granted") return "Notifications are blocked. Allow them for this site in your browser settings.";
  const reg = (await registerWorker())!;
  await navigator.serviceWorker.ready;
  const { key } = await api<{ key: string }>("/api/admin/push/key/");
  const sub = await reg.pushManager.subscribe({ userVisibleOnly: true, applicationServerKey: b64ToBytes(key) });
  await api("/api/admin/push/subscribe/", { method: "POST", body: JSON.stringify({ subscription: sub.toJSON() }) });
  return null;
}

export async function disablePush() {
  const sub = await currentSubscription();
  if (!sub) return;
  await api("/api/admin/push/subscribe/", { method: "DELETE", body: JSON.stringify({ subscription: sub.toJSON() }) }).catch(() => {});
  await sub.unsubscribe();
}
