"use client";

import { useCallback, useEffect, useId, useRef, useState } from "react";
import { usePathname } from "next/navigation";
import { site } from "@/content/site";
import { API_URL, WS_URL } from "@/lib/api";
import { ElbowMark } from "../Icons";
import { useSocket } from "./useSocket";

type Msg = { id: number; sender: "visitor" | "admin"; body: string; created_at: string };
type Session = { id: string; token: string; name: string };

const STORE = "northline-chat";
const starters = ["Leak or burst pipe", "Blocked drain", "Boiler or heating", "Price for a job"];

const readSession = (): Session | null => {
  try {
    return JSON.parse(localStorage.getItem(STORE) ?? "null");
  } catch {
    return null;
  }
};
const writeSession = (s: Session | null) => {
  try {
    if (s) localStorage.setItem(STORE, JSON.stringify(s));
    else localStorage.removeItem(STORE);
  } catch {
    /* private mode: chat still works for this page view */
  }
};
const time = (iso: string) => new Date(iso).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });

/** Floating "Message us" button and live chat panel. Talks to the Django backend over a WebSocket. */
export function ChatWidget() {
  const [open, setOpen] = useState(false);
  const [session, setSession] = useState<Session | null>(null);
  const [messages, setMessages] = useState<Msg[]>([]);
  const [online, setOnline] = useState<boolean | null>(null);
  const [status, setStatus] = useState<"open" | "closed">("open");
  const [unread, setUnread] = useState(0);
  const [adminTyping, setAdminTyping] = useState(false);
  const [draft, setDraft] = useState("");
  const [error, setError] = useState("");
  const [starting, setStarting] = useState(false);
  const panelRef = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const listRef = useRef<HTMLDivElement>(null);
  const typingTimer = useRef<ReturnType<typeof setTimeout>>(undefined);
  const lastTypingSent = useRef(0);
  const openRef = useRef(open);
  const titleId = useId();
  const pathname = usePathname();

  useEffect(() => {
    openRef.current = open;
  }, [open]);

  // Restore an earlier conversation, or just ask whether anyone is online.
  useEffect(() => {
    const s = readSession();
    const ctrl = new AbortController();
    if (s) {
      fetch(`${API_URL}/api/chat/${s.id}/messages/?token=${encodeURIComponent(s.token)}`, { signal: ctrl.signal })
        .then((r) => (r.ok ? r.json() : Promise.reject(r.status)))
        .then((d) => {
          setSession(s);
          setMessages(d.messages);
          setOnline(d.online);
          setStatus(d.status);
        })
        .catch((e) => {
          if (e === 404) writeSession(null);
        });
    } else {
      fetch(`${API_URL}/api/chat/presence/`, { signal: ctrl.signal })
        .then((r) => r.json())
        .then((d) => setOnline(d.online))
        .catch(() => setOnline(null));
    }
    return () => ctrl.abort();
  }, []);

  const resync = useCallback(() => {
    if (!session) return;
    fetch(`${API_URL}/api/chat/${session.id}/messages/?token=${encodeURIComponent(session.token)}`)
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => d && (setMessages(d.messages), setStatus(d.status)))
      .catch(() => {});
  }, [session]);

  const { state: sockState, send } = useSocket(
    session ? `${WS_URL}/ws/chat/${session.id}/?token=${encodeURIComponent(session.token)}` : null,
    {
      onOpen: resync,
      onAuthFail: () => {
        writeSession(null);
        setSession(null);
        setMessages([]);
      },
      onMessage: (d) => {
        if (d.type === "hello") {
          setOnline(Boolean(d.online));
          setStatus(d.status === "closed" ? "closed" : "open");
        } else if (d.type === "presence") setOnline(Boolean(d.online));
        else if (d.type === "status") setStatus(d.status === "closed" ? "closed" : "open");
        else if (d.type === "typing" && d.who === "admin") {
          setAdminTyping(true);
          clearTimeout(typingTimer.current);
          typingTimer.current = setTimeout(() => setAdminTyping(false), 3500);
        } else if (d.type === "message") {
          const m = d.message as Msg;
          setMessages((list) => (list.some((x) => x.id === m.id) ? list : [...list, m]));
          if (m.sender === "admin") {
            setAdminTyping(false);
            setStatus("open");
            if (openRef.current && document.visibilityState === "visible") send({ type: "read" }, false);
            else setUnread((n) => n + 1);
          }
        }
      },
    },
  );

  // Keep the newest message in view.
  useEffect(() => {
    const el = listRef.current;
    if (el) el.scrollTo({ top: el.scrollHeight, behavior: "smooth" });
  }, [messages.length, adminTyping, open]);

  const openPanel = () => {
    setOpen(true);
    setUnread(0);
    if (session) send({ type: "read" }, false);
    requestAnimationFrame(() => panelRef.current?.querySelector<HTMLElement>("textarea, input")?.focus());
  };
  const closePanel = () => {
    setOpen(false);
    buttonRef.current?.focus();
  };

  async function start(form: FormData) {
    const name = String(form.get("name") ?? "").trim();
    const message = String(form.get("message") ?? "").trim();
    if (name.length < 2) return setError("Add your name so we know who we're talking to.");
    if (!message) return setError("Write a short message first.");
    setError("");
    setStarting(true);
    try {
      const r = await fetch(`${API_URL}/api/chat/start/`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name,
          message,
          contact: String(form.get("contact") ?? "").trim(),
          page: pathname,
          website: String(form.get("website") ?? ""),
        }),
      });
      if (r.status === 429) throw new Error("rate");
      if (!r.ok) throw new Error("bad");
      const d = await r.json();
      const s = { id: d.id, token: d.token, name };
      writeSession(s);
      setSession(s);
      setMessages(d.messages);
      setOnline(d.online);
      setStatus("open");
      requestAnimationFrame(() => panelRef.current?.querySelector<HTMLElement>("textarea")?.focus());
    } catch (e) {
      setError(
        (e as Error).message === "rate"
          ? `You've started a few chats already. Please call us on ${site.phone}.`
          : `Chat isn't available right now. Please call us on ${site.phone}.`,
      );
    } finally {
      setStarting(false);
    }
  }

  const sendDraft = () => {
    const body = draft.trim();
    if (!body || !session) return;
    send({ type: "message", body });
    setDraft("");
  };

  const onDraftChange = (v: string) => {
    setDraft(v);
    const now = Date.now();
    if (session && now - lastTypingSent.current > 2000) {
      lastTypingSent.current = now;
      send({ type: "typing" }, false);
    }
  };

  const newChat = () => {
    writeSession(null);
    setSession(null);
    setMessages([]);
    setStatus("open");
  };

  const statusLine =
    online === null
      ? "We reply as soon as we can"
      : online
        ? "Online now · usually replies in minutes"
        : "Away · leave a message, we'll get back to you";

  return (
    <>
      <button
        ref={buttonRef}
        type="button"
        onClick={() => (open ? closePanel() : openPanel())}
        aria-expanded={open}
        aria-controls="chat-panel"
        aria-label={open ? "Close chat" : unread ? `Message us, ${unread} new ${unread === 1 ? "reply" : "replies"}` : "Message us"}
        className="chat-fab fixed right-4 z-50 inline-flex h-14 cursor-pointer items-center gap-2.5 rounded-full bg-brand pl-4 pr-4 font-semibold text-white shadow-lift
          transition-[transform,background-color] duration-200 ease-out-soft hover:bg-brand-light active:scale-[.97] md:right-6 md:pr-5"
      >
        <span className="relative">
          {open ? (
            <svg viewBox="0 0 24 24" className="size-6" fill="none" stroke="currentColor" strokeWidth="2.2" aria-hidden="true">
              <path d="M6 6l12 12M18 6 6 18" strokeLinecap="round" />
            </svg>
          ) : (
            <svg viewBox="0 0 24 24" className="size-6" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
              <path d="M4 5.5A2.5 2.5 0 0 1 6.5 3h11A2.5 2.5 0 0 1 20 5.5v8a2.5 2.5 0 0 1-2.5 2.5H10l-4.2 3.6a.5.5 0 0 1-.8-.4V16a2.5 2.5 0 0 1-1-2Z" strokeLinejoin="round" />
              <path d="M8.5 9.5h7M8.5 12.5h4" strokeLinecap="round" />
            </svg>
          )}
          {!open && online && <span className="absolute -right-1 -top-1 size-3 rounded-full border-2 border-brand bg-ok" aria-hidden="true" />}
        </span>
        <span className="hidden md:inline">{open ? "Close" : "Message us"}</span>
        {unread > 0 && !open && (
          <span className="absolute -left-1.5 -top-1.5 grid min-w-6 place-items-center rounded-full bg-ink px-1.5 text-[0.8125rem] leading-6 text-white" aria-hidden="true">
            {unread}
          </span>
        )}
      </button>

      <div
        id="chat-panel"
        ref={panelRef}
        role="dialog"
        aria-labelledby={titleId}
        hidden={!open}
        onKeyDown={(e) => e.key === "Escape" && closePanel()}
        className="chat-panel fixed inset-0 z-[60] flex flex-col overflow-hidden bg-bg md:inset-auto md:bottom-24 md:right-6 md:h-[min(620px,calc(100svh-140px))] md:w-[392px] md:rounded-md md:rounded-tl-[40px] md:shadow-lift md:ring-1 md:ring-line"
      >
        <header className="on-dark grain flex items-center gap-3 bg-ink px-5 pb-4 pt-[max(16px,env(safe-area-inset-top))] text-on-dark md:pt-5 md:pl-7">
          <ElbowMark className="size-10 shrink-0" />
          <div className="min-w-0 flex-1">
            <h2 id={titleId} className="font-display text-[1.0625rem] font-bold leading-tight text-on-dark [font-stretch:110%]">
              {site.name}
            </h2>
            <p className="flex items-center gap-1.5 text-[0.8125rem] text-on-dark-muted">
              <span className={`size-2 rounded-full ${online ? "bg-ok" : "bg-on-dark-muted/60"}`} aria-hidden="true" />
              {statusLine}
            </p>
          </div>
          <button
            type="button"
            onClick={closePanel}
            aria-label="Close chat"
            className="grid size-11 cursor-pointer place-items-center rounded-full text-on-dark hover:bg-on-dark/10"
          >
            <svg viewBox="0 0 24 24" className="size-5" fill="none" stroke="currentColor" strokeWidth="2.2" aria-hidden="true">
              <path d="M6 6l12 12M18 6 6 18" strokeLinecap="round" />
            </svg>
          </button>
        </header>

        {session && sockState === "closed" && (
          <p className="bg-[#fff4d6] px-5 py-2 text-[0.8125rem] font-medium text-[#6b4e00]" role="status">
            Reconnecting… messages will send when you&apos;re back online.
          </p>
        )}

        <div ref={listRef} className="flex-1 overflow-y-auto px-4 py-5" role="log" aria-live="polite" aria-label="Messages">
          <Bubble from="admin">
            Hi, tell us what&apos;s going on and we&apos;ll reply right here. If water is leaking, turn it off at the stopcock first.
          </Bubble>
          {messages.map((m, i) => (
            <Bubble key={m.id} from={m.sender} at={m.created_at} grouped={messages[i - 1]?.sender === m.sender}>
              {m.body}
            </Bubble>
          ))}
          {adminTyping && (
            <div className="mb-2 flex w-fit items-center gap-1 rounded-[18px] rounded-bl-[6px] border border-line bg-surface px-4 py-3" aria-label="Typing">
              <span className="typing-dot" />
              <span className="typing-dot [animation-delay:150ms]" />
              <span className="typing-dot [animation-delay:300ms]" />
            </div>
          )}
          {status === "closed" && session && (
            <div className="mt-4 grid justify-items-center gap-2 text-center text-[0.875rem] text-muted">
              <p>This chat has been closed.</p>
              <button type="button" onClick={newChat} className="cursor-pointer font-semibold text-water underline underline-offset-4">
                Start a new chat
              </button>
            </div>
          )}
        </div>

        {session ? (
          <form
            className="flex items-end gap-2 border-t border-line bg-surface p-3 pb-[max(12px,env(safe-area-inset-bottom))]"
            onSubmit={(e) => {
              e.preventDefault();
              sendDraft();
            }}
          >
            <label htmlFor="chat-draft" className="sr-only">
              Your message
            </label>
            <textarea
              id="chat-draft"
              rows={1}
              value={draft}
              maxLength={2000}
              onChange={(e) => onDraftChange(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault();
                  sendDraft();
                }
              }}
              placeholder={status === "closed" ? "Write to reopen the chat…" : "Write a message…"}
              className="max-h-32 min-h-12 flex-1 resize-none rounded-[22px] border-[1.5px] border-line bg-bg px-4 py-3 text-[1rem] leading-snug [field-sizing:content] focus:border-brand focus:outline-none"
            />
            <button
              type="submit"
              disabled={!draft.trim()}
              aria-label="Send message"
              className="grid size-12 shrink-0 cursor-pointer place-items-center rounded-full bg-brand text-white transition-transform duration-150 ease-out-soft hover:bg-brand-light active:scale-[.94] disabled:cursor-default disabled:opacity-40"
            >
              <svg viewBox="0 0 24 24" className="size-5" fill="currentColor" aria-hidden="true">
                <path d="M3.4 20.4 21 12 3.4 3.6 3.4 10l12.6 2-12.6 2Z" />
              </svg>
            </button>
          </form>
        ) : (
          <form
            className="grid gap-3 border-t border-line bg-surface p-4 pb-[max(16px,env(safe-area-inset-bottom))]"
            onSubmit={(e) => {
              e.preventDefault();
              start(new FormData(e.currentTarget));
            }}
          >
            <div className="flex flex-wrap gap-1.5" role="group" aria-label="Common questions">
              {starters.map((s) => (
                <button
                  key={s}
                  type="button"
                  onClick={(e) => {
                    const ta = e.currentTarget.form?.elements.namedItem("message") as HTMLTextAreaElement | null;
                    if (ta) {
                      ta.value = `${s}: `;
                      ta.focus();
                    }
                  }}
                  className="cursor-pointer rounded-full border-[1.5px] border-line px-3 py-1.5 text-[0.8125rem] font-semibold text-ink hover:border-brand hover:text-brand"
                >
                  {s}
                </button>
              ))}
            </div>
            <div className="grid grid-cols-2 gap-2">
              <label className="grid gap-1 text-[0.8125rem] font-semibold">
                Name
                <input name="name" autoComplete="name" required className="chat-input" />
              </label>
              <label className="grid gap-1 text-[0.8125rem] font-semibold">
                <span>
                  Phone or email <span className="font-normal text-muted">(optional)</span>
                </span>
                <input name="contact" autoComplete="tel" className="chat-input" />
              </label>
            </div>
            <div aria-hidden="true" className="absolute -left-[9999px] size-px overflow-hidden">
              <input name="website" tabIndex={-1} autoComplete="off" />
            </div>
            <label className="grid gap-1 text-[0.8125rem] font-semibold">
              Message
              <textarea name="message" rows={2} required maxLength={2000} className="chat-input resize-none [field-sizing:content] max-h-32" />
            </label>
            {error && (
              <p role="alert" className="text-[0.875rem] font-medium text-[#8c1d18]">
                {error}
              </p>
            )}
            <button type="submit" className="btn min-h-12 w-full" disabled={starting}>
              {starting ? "Starting…" : "Start chat"}
            </button>
          </form>
        )}
      </div>
    </>
  );
}

function Bubble({
  from,
  at,
  grouped,
  children,
}: {
  from: "visitor" | "admin";
  at?: string;
  grouped?: boolean;
  children: React.ReactNode;
}) {
  const mine = from === "visitor";
  return (
    <div className={`chat-bubble flex flex-col ${mine ? "items-end" : "items-start"} ${grouped ? "mt-1" : "mt-3"}`}>
      <p
        className={`m-0 max-w-[85%] whitespace-pre-wrap break-words px-4 py-2.5 text-[0.9375rem] leading-snug ${
          mine
            ? "rounded-[18px] rounded-br-[6px] bg-brand text-white"
            : "rounded-[18px] rounded-bl-[6px] border border-line bg-surface text-ink"
        }`}
      >
        <span className="sr-only">{mine ? "You: " : `${site.name}: `}</span>
        {children}
      </p>
      {at && <time className="mt-1 px-1 text-[0.75rem] text-muted">{time(at)}</time>}
    </div>
  );
}
