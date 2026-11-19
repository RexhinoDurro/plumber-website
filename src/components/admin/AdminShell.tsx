"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { createContext, useCallback, useContext, useEffect, useRef, useState } from "react";
import { site } from "@/content/site";
import { WS_URL } from "@/lib/api";
import { useSocket, type SocketState } from "../chat/useSocket";
import { ElbowMark } from "../Icons";
import { api, auth, type AdminUser, type Conversation, type Lead, type Message } from "./client";
import { currentSubscription, disablePush, enablePush, pushSupported, registerWorker } from "./push";

type Event = Record<string, unknown> & { type: string };
type Toast = { id: number; title: string; body?: string; href?: string; tone?: "info" | "ok" | "error" };

type Ctx = {
  user: AdminUser;
  live: SocketState;
  send: (d: Record<string, unknown>) => void;
  subscribe: (fn: (e: Event) => void) => () => void;
  toast: (t: Omit<Toast, "id">) => void;
  unreadChats: number;
  newLeads: number;
  refreshCounts: () => void;
  push: boolean | null;
  togglePush: (v: boolean) => Promise<void>;
};

const AdminCtx = createContext<Ctx | null>(null);
export const useAdmin = () => {
  const c = useContext(AdminCtx);
  if (!c) throw new Error("useAdmin outside AdminShell");
  return c;
};

/** Live updates for one page: runs `fn` for every dashboard event. */
export function useAdminEvents(fn: (e: Event) => void) {
  const { subscribe } = useAdmin();
  const ref = useRef(fn);
  useEffect(() => {
    ref.current = fn;
  });
  useEffect(() => subscribe((e) => ref.current(e)), [subscribe]);
}

const nav = [
  { href: "/admin", label: "Overview", icon: "M4 13h6V4H4v9Zm0 7h6v-5H4v5Zm10 0h6v-9h-6v9Zm0-16v5h6V4h-6Z" },
  { href: "/admin/inbox", label: "Inbox", icon: "M4 5.5A2.5 2.5 0 0 1 6.5 3h11A2.5 2.5 0 0 1 20 5.5v8a2.5 2.5 0 0 1-2.5 2.5H10l-4.2 3.6a.5.5 0 0 1-.8-.4V16a2.5 2.5 0 0 1-1-2Z" },
  { href: "/admin/leads", label: "Leads", icon: "M4 6h16M4 12h10M4 18h6" },
  { href: "/admin/gallery", label: "Gallery", icon: "M4 6.5A2.5 2.5 0 0 1 6.5 4h11A2.5 2.5 0 0 1 20 6.5v11a2.5 2.5 0 0 1-2.5 2.5h-11A2.5 2.5 0 0 1 4 17.5Zm0 9 4.5-4.5 4 4 2.5-2.5 5 5M15 9.5h.01" },
  { href: "/admin/reviews", label: "Reviews", icon: "M12 4l2.4 4.9 5.4.8-3.9 3.8.9 5.4L12 16.4 7.2 18.9l.9-5.4-3.9-3.8 5.4-.8Z" },
];

/** A short two-note chime made with WebAudio, so no sound file is needed. */
function chime() {
  try {
    const ctx = new AudioContext();
    [660, 880].forEach((f, i) => {
      const o = ctx.createOscillator();
      const g = ctx.createGain();
      o.frequency.value = f;
      o.type = "sine";
      g.gain.setValueAtTime(0.0001, ctx.currentTime + i * 0.12);
      g.gain.exponentialRampToValueAtTime(0.12, ctx.currentTime + i * 0.12 + 0.02);
      g.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + i * 0.12 + 0.25);
      o.connect(g).connect(ctx.destination);
      o.start(ctx.currentTime + i * 0.12);
      o.stop(ctx.currentTime + i * 0.12 + 0.3);
    });
    setTimeout(() => ctx.close(), 800);
  } catch {
    /* audio blocked until the user interacts with the page */
  }
}

export function AdminShell({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const [session, setSession] = useState<{ token: string; user: AdminUser } | null>(null);
  const [toasts, setToasts] = useState<Toast[]>([]);
  const [unreadMap, setUnreadMap] = useState<Record<string, number>>({});
  const [newLeads, setNewLeads] = useState(0);
  const [alerts, setAlerts] = useState({ sound: true });
  const [push, setPush] = useState<boolean | null>(null); // null = unknown / not supported
  const listeners = useRef(new Set<(e: Event) => void>());
  const pathRef = useRef(pathname);

  useEffect(() => {
    pathRef.current = pathname;
  }, [pathname]);

  useEffect(() => {
    const a = auth.get();
    if (!a) {
      router.replace("/admin/login");
      return;
    }
    // Restoring the login from storage has to happen after mount (no localStorage on the server).
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setSession(a);
    try {
      const saved = JSON.parse(localStorage.getItem("northline-alerts") ?? "null");
      if (saved) setAlerts(saved);
    } catch {}
  }, [router]);

  const toast = useCallback((t: Omit<Toast, "id">) => {
    const id = Date.now() + Math.random();
    setToasts((l) => [...l.slice(-3), { ...t, id }]);
    setTimeout(() => setToasts((l) => l.filter((x) => x.id !== id)), 6000);
  }, []);

  const refreshCounts = useCallback(() => {
    api<Conversation[]>("/api/admin/conversations/")
      .then((list) => setUnreadMap(Object.fromEntries(list.map((c) => [c.id, c.unread_for_admin]))))
      .catch(() => {});
    api<Lead[]>("/api/admin/leads/?status=new")
      .then((l) => setNewLeads(l.length))
      .catch(() => {});
  }, []);

  useEffect(() => {
    if (session) refreshCounts();
  }, [session, refreshCounts]);

  const alertsRef = useRef(alerts);
  useEffect(() => {
    alertsRef.current = alerts;
  }, [alerts]);

  // Push notifications (service worker) cover the phone and closed tabs; in the open dashboard we chime.
  const ping = useCallback(() => {
    if (alertsRef.current.sound) chime();
  }, []);

  // Register the dashboard's service worker and find out whether this device already gets push alerts.
  useEffect(() => {
    if (!session || !pushSupported()) return;
    registerWorker()
      .then(() => currentSubscription())
      .then((sub) => setPush(Boolean(sub)))
      .catch(() => setPush(false));
  }, [session]);

  const { state: live, send } = useSocket(session ? `${WS_URL}/ws/admin/?token=${encodeURIComponent(session.token)}` : null, {
    onOpen: refreshCounts,
    onAuthFail: () => {
      auth.clear();
      router.replace("/admin/login");
    },
    onMessage: (raw) => {
      const e = raw as Event;
      if (e.type === "conversation" || e.type === "conversation_new") {
        const c = e.conversation as Conversation;
        setUnreadMap((m) => ({ ...m, [c.id]: c.unread_for_admin }));
      }
      if (e.type === "message") {
        const m = e.message as Message;
        if (m.sender === "visitor") {
          const href = `/admin/inbox#${e.conversation}`;
          const inInbox = pathRef.current === "/admin/inbox" && document.visibilityState === "visible";
          const text = m.body ? m.body.slice(0, 120) : "📷 Photo";
          if (!inInbox) toast({ title: "New chat message", body: text, href });
          ping();
        }
      }
      if (e.type === "lead_new") {
        const l = e.lead as Lead;
        setNewLeads((n) => n + 1);
        toast({ title: `New ${l.urgent ? "urgent " : ""}request from ${l.name}`, body: l.job || l.message.slice(0, 100), href: "/admin/leads" });
        ping();
      }
      if (e.type === "lead_updated") refreshCounts();
      listeners.current.forEach((fn) => fn(e));
    },
  });

  const sendFree = useCallback((d: Record<string, unknown>) => send(d, d.type === "message"), [send]);
  const unreadChats = Object.values(unreadMap).filter((n) => n > 0).length;

  // Unread count in the browser tab title.
  useEffect(() => {
    const base = document.title.replace(/^\(\d+\)\s*/, "");
    const n = unreadChats + newLeads;
    document.title = n ? `(${n}) ${base}` : base;
  }, [unreadChats, newLeads, pathname]);

  const subscribe = useCallback((fn: (e: Event) => void) => {
    listeners.current.add(fn);
    return () => {
      listeners.current.delete(fn);
    };
  }, []);

  const setSound = (v: boolean) => {
    const next = { ...alerts, sound: v };
    setAlerts(next);
    localStorage.setItem("northline-alerts", JSON.stringify(next));
  };

  const togglePush = useCallback(
    async (v: boolean) => {
      if (!v) {
        await disablePush();
        setPush(false);
        toast({ title: "Push alerts turned off on this device", tone: "ok" });
        return;
      }
      const err = await enablePush().catch((e: Error) => e.message || "Couldn't turn on push alerts.");
      if (err) {
        toast({ title: "Push alerts aren't on", body: err, tone: "error" });
        setPush(false);
      } else {
        setPush(true);
        toast({ title: "Push alerts are on", body: "New chats and requests will reach this device, even when the dashboard is closed.", tone: "ok" });
      }
    },
    [toast],
  );

  const logout = async () => {
    await api("/api/auth/logout/", { method: "POST" }).catch(() => {});
    auth.clear();
    router.replace("/admin/login");
  };

  if (!session) {
    return <div className="grid min-h-svh place-items-center text-muted">Loading…</div>;
  }

  const ctx: Ctx = { user: session.user, live, send: sendFree, subscribe, toast, unreadChats, newLeads, refreshCounts, push, togglePush };

  const badge = (href: string) => (href === "/admin/inbox" ? unreadChats : href === "/admin/leads" ? newLeads : 0);

  return (
    <AdminCtx.Provider value={ctx}>
      <div className="min-h-svh bg-bg md:grid md:grid-cols-[240px_minmax(0,1fr)]">
        <aside className="on-dark sticky top-0 z-30 flex flex-col bg-ink text-on-dark md:h-svh">
          <div className="flex items-center gap-3 px-5 py-4 md:py-6">
            <ElbowMark className="size-9 shrink-0" />
            <div className="min-w-0">
              <p className="truncate font-display text-[0.95rem] font-bold leading-tight [font-stretch:110%]">{site.name}</p>
              <p className="text-[0.75rem] text-on-dark-muted">Dashboard</p>
            </div>
            <span
              className="ml-auto flex items-center gap-1.5 text-[0.75rem] text-on-dark-muted md:hidden"
              title={live === "open" ? "Live" : "Reconnecting"}
            >
              <span className={`size-2 rounded-full ${live === "open" ? "bg-ok" : "bg-warn"}`} />
              {live === "open" ? "Live" : "…"}
            </span>
          </div>
          <nav aria-label="Dashboard" className="relative overflow-x-auto px-3 pb-3 md:flex-1 md:pb-0">
            <ul className="flex gap-1 md:grid">
              {nav.map((n) => {
                const active = n.href === "/admin" ? pathname === "/admin" : pathname.startsWith(n.href);
                const b = badge(n.href);
                return (
                  <li key={n.href}>
                    <Link
                      href={n.href}
                      aria-current={active ? "page" : undefined}
                      className={`flex min-h-11 items-center gap-3 whitespace-nowrap rounded-sm px-3 text-[0.9375rem] font-medium no-underline transition-colors duration-150 ${
                        active ? "bg-on-dark/12 text-white" : "text-on-dark-muted hover:bg-on-dark/6 hover:text-white"
                      }`}
                    >
                      <svg viewBox="0 0 24 24" className="size-5 shrink-0" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinejoin="round" strokeLinecap="round" aria-hidden="true">
                        <path d={n.icon} />
                      </svg>
                      {n.label}
                      {b > 0 && (
                        <span className="relative ml-auto grid min-w-6 place-items-center rounded-full bg-brand px-1.5 text-[0.75rem] font-bold leading-6 text-white">
                          {b}
                          <span className="sr-only"> new</span>
                        </span>
                      )}
                    </Link>
                  </li>
                );
              })}
            </ul>
          </nav>
          <div className="hidden gap-3 border-t border-on-dark/12 p-5 text-[0.8125rem] md:grid">
            <p className="flex items-center gap-2 text-on-dark-muted">
              <span className={`size-2 rounded-full ${live === "open" ? "bg-ok" : "bg-warn"}`} />
              {live === "open" ? "Live: visitors see you online" : "Reconnecting…"}
            </p>
            <Toggle label="Sound alerts" checked={alerts.sound} onChange={setSound} />
            {push !== null && <Toggle label="Push alerts on this device" checked={push} onChange={togglePush} />}
            <div className="flex items-center justify-between border-t border-on-dark/12 pt-3">
              <span className="truncate text-on-dark">{session.user.name}</span>
              <button type="button" onClick={logout} className="cursor-pointer text-on-dark-muted underline underline-offset-4 hover:text-white">
                Log out
              </button>
            </div>
          </div>
        </aside>

        <main id="main" className="min-w-0 px-4 py-6 md:px-10 md:py-10">
          {children}
          <div className="admin-card mt-12 grid gap-3 p-5 text-[0.9375rem] md:hidden">
            <ToggleLight label="Sound alerts" checked={alerts.sound} onChange={setSound} />
            {push !== null && <ToggleLight label="Push alerts on this phone" checked={push} onChange={togglePush} />}
            <div className="flex items-center justify-between border-t border-line pt-3">
              <span className="truncate">{session.user.name}</span>
              <button type="button" onClick={logout} className="btn btn-secondary min-h-10 px-4 text-[0.875rem]">
                Log out
              </button>
            </div>
          </div>
        </main>
      </div>

      <ol className="pointer-events-none fixed bottom-4 right-4 z-[80] grid w-[min(360px,calc(100vw-32px))] gap-2" aria-live="polite">
        {toasts.map((t) => (
          <li
            key={t.id}
            className={`toast pointer-events-auto rounded-md border-l-4 bg-surface p-4 shadow-lift ${
              t.tone === "error" ? "border-danger" : t.tone === "ok" ? "border-ok" : "border-brand"
            }`}
          >
            <p className="font-semibold">{t.title}</p>
            {t.body && <p className="mt-0.5 line-clamp-2 text-[0.875rem] text-muted">{t.body}</p>}
            {t.href && (
              <Link
                href={t.href}
                onClick={() => setToasts((l) => l.filter((x) => x.id !== t.id))}
                className="mt-2 inline-block text-[0.875rem] font-semibold text-water"
              >
                Open
              </Link>
            )}
          </li>
        ))}
      </ol>
    </AdminCtx.Provider>
  );
}

function ToggleLight({ label, checked, onChange }: { label: string; checked: boolean; onChange: (v: boolean) => void }) {
  return (
    <label className="flex cursor-pointer items-center justify-between">
      {label}
      <input type="checkbox" role="switch" checked={checked} onChange={(e) => onChange(e.target.checked)} className="switch switch-light" />
    </label>
  );
}

function Toggle({ label, checked, onChange }: { label: string; checked: boolean; onChange: (v: boolean) => void }) {
  return (
    <label className="flex cursor-pointer items-center justify-between text-on-dark-muted">
      {label}
      <input type="checkbox" role="switch" checked={checked} onChange={(e) => onChange(e.target.checked)} className="switch" />
    </label>
  );
}
