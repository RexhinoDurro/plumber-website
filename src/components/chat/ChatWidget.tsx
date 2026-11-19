"use client";

import { useCallback, useEffect, useId, useRef, useState } from "react";
import { usePathname } from "next/navigation";
import { site } from "@/content/site";
import { API_URL, WS_URL } from "@/lib/api";
import { ElbowMark } from "../Icons";
import { useSocket } from "./useSocket";
import { applyReceipt, Composer, lastSeen, newClientId, PhotoViewer, Thread, TypingBubble, upsert, type ChatMsg } from "./Thread";

type Session = { id: string; token: string };

const STORE = "northline-chat";

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

/** A short soft "pop" for incoming replies, made with WebAudio. */
function pop() {
  try {
    const ctx = new AudioContext();
    const o = ctx.createOscillator();
    const g = ctx.createGain();
    o.frequency.setValueAtTime(880, ctx.currentTime);
    o.frequency.exponentialRampToValueAtTime(520, ctx.currentTime + 0.12);
    g.gain.setValueAtTime(0.0001, ctx.currentTime);
    g.gain.exponentialRampToValueAtTime(0.08, ctx.currentTime + 0.015);
    g.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + 0.18);
    o.connect(g).connect(ctx.destination);
    o.start();
    o.stop(ctx.currentTime + 0.2);
    setTimeout(() => ctx.close(), 400);
  } catch {}
}

/**
 * Floating "Message us" button and a WhatsApp-style chat with the business.
 * No form: the first message opens the conversation. Messages, photos, typing,
 * delivered/read ticks and online/last-seen all travel over one WebSocket.
 */
export function ChatWidget() {
  const [open, setOpen] = useState(false);
  const [session, setSession] = useState<Session | null>(null);
  const [messages, setMessages] = useState<ChatMsg[]>([]);
  const [biz, setBiz] = useState<{ online: boolean; last_seen: string | null } | null>(null);
  const [closed, setClosed] = useState(false);
  const [unread, setUnread] = useState(0);
  const [typing, setTyping] = useState(false);
  const [draft, setDraft] = useState("");
  const [notice, setNotice] = useState("");
  const [viewing, setViewing] = useState<string | null>(null);
  const panelRef = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const listRef = useRef<HTMLDivElement>(null);
  const typingTimer = useRef<ReturnType<typeof setTimeout>>(undefined);
  const lastTypingSent = useRef(0);
  const starting = useRef<Promise<Session | null> | null>(null);
  const openRef = useRef(open);
  const titleId = useId();
  const pathname = usePathname();

  useEffect(() => {
    openRef.current = open;
  }, [open]);

  // Restore an earlier conversation, or just ask whether anyone is in.
  useEffect(() => {
    const s = readSession();
    const ctrl = new AbortController();
    const url = s ? `${API_URL}/api/chat/${s.id}/messages/?token=${encodeURIComponent(s.token)}` : `${API_URL}/api/chat/presence/`;
    fetch(url, { signal: ctrl.signal })
      .then((r) => (r.ok ? r.json() : Promise.reject(r.status)))
      .then((d) => {
        setBiz({ online: d.online, last_seen: d.last_seen });
        if (s) {
          setSession(s);
          setMessages(d.messages);
          setClosed(d.status === "closed");
        }
      })
      .catch((e) => {
        if (e === 404) writeSession(null);
      });
    return () => ctrl.abort();
  }, []);

  const resync = useCallback(() => {
    if (!session) return;
    fetch(`${API_URL}/api/chat/${session.id}/messages/?token=${encodeURIComponent(session.token)}`)
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => {
        if (!d) return;
        const server = d.messages as ChatMsg[];
        // take the server's copy, keep anything still sending
        setMessages((list) => [...server, ...list.filter((m) => m.pending && !server.some((x) => x.client_id === m.client_id))]);
        setClosed(d.status === "closed");
        setBiz({ online: d.online, last_seen: d.last_seen });
      })
      .catch(() => {});
  }, [session]);

  const seen = () => openRef.current && document.visibilityState === "visible";

  const { state: sockState, send } = useSocket(
    session ? `${WS_URL}/ws/chat/${session.id}/?token=${encodeURIComponent(session.token)}` : null,
    {
      onOpen: () => {
        resync();
        if (seen()) send({ type: "read" }, false);
      },
      onAuthFail: () => {
        writeSession(null);
        setSession(null);
        setMessages([]);
      },
      onMessage: (d) => {
        if (d.type === "hello" || d.type === "presence") {
          setBiz({ online: Boolean(d.online), last_seen: (d.last_seen as string) ?? null });
          if (d.type === "hello") setClosed(d.status === "closed");
        } else if (d.type === "status") setClosed(d.status === "closed");
        else if (d.type === "typing" && d.who === "admin") {
          setTyping(true);
          clearTimeout(typingTimer.current);
          typingTimer.current = setTimeout(() => setTyping(false), 3500);
        } else if (d.type === "receipt") {
          setMessages((l) => applyReceipt(l, String(d.sender), d.status as "delivered" | "read", String(d.at)));
        } else if (d.type === "message") {
          const m = d.message as ChatMsg;
          setMessages((list) => upsert(list, m));
          if (m.sender === "admin") {
            setTyping(false);
            setClosed(false);
            if (seen()) send({ type: "read" }, false);
            else {
              setUnread((n) => n + 1);
              pop();
            }
          }
        }
      },
    },
  );

  // Keep the newest message in view.
  useEffect(() => {
    const el = listRef.current;
    if (el) el.scrollTo({ top: el.scrollHeight, behavior: "smooth" });
  }, [messages.length, typing, open]);

  // Coming back to the tab with the chat open counts as reading it.
  useEffect(() => {
    const onVis = () => {
      if (document.visibilityState === "visible" && openRef.current && session) {
        send({ type: "read" }, false);
        setUnread(0);
      }
    };
    document.addEventListener("visibilitychange", onVis);
    return () => document.removeEventListener("visibilitychange", onVis);
  }, [session, send]);

  const openPanel = () => {
    setOpen(true);
    setUnread(0);
    if (session) send({ type: "read" }, false);
    // Focus inside the tap itself: phones only open the keyboard for a focus that happens during the tap.
    const panel = panelRef.current;
    if (panel) {
      panel.hidden = false;
      panel.querySelector<HTMLElement>("textarea")?.focus({ preventScroll: true });
    }
  };
  const closePanel = () => {
    setOpen(false);
    buttonRef.current?.focus();
  };

  /** The first message (or photo) creates the conversation. */
  const ensureSession = (first?: { body: string; client_id: string }) => {
    if (session) return Promise.resolve(session);
    if (starting.current) return starting.current;
    starting.current = fetch(`${API_URL}/api/chat/start/`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ message: first?.body ?? "", client_id: first?.client_id ?? "", page: pathname }),
    })
      .then(async (r) => {
        if (r.status === 429) throw new Error("rate");
        if (!r.ok) throw new Error("bad");
        const d = await r.json();
        const s = { id: d.id, token: d.token };
        writeSession(s);
        setSession(s);
        setBiz({ online: d.online, last_seen: d.last_seen });
        setMessages((list) => (d.messages as ChatMsg[]).reduce(upsert, list));
        return s;
      })
      .catch((e: Error) => {
        setNotice(
          e.message === "rate"
            ? `You've sent a lot of messages. Please call us on ${site.phone}.`
            : `Chat isn't available right now. Please call us on ${site.phone}.`,
        );
        setMessages((list) => list.map((m) => (m.pending ? { ...m, pending: false, failed: true } : m)));
        return null;
      })
      .finally(() => {
        starting.current = null;
      });
    return starting.current;
  };

  const sendText = (text: string) => {
    const body = text.trim();
    if (!body) return;
    const client_id = newClientId();
    const local: ChatMsg = { id: client_id, client_id, sender: "visitor", body, image: null, delivered_at: null, read_at: null, created_at: new Date().toISOString(), pending: true };
    setMessages((l) => [...l, local]);
    setDraft("");
    setNotice("");
    setClosed(false);
    if (session) send({ type: "message", body, client_id });
    else ensureSession({ body, client_id });
  };

  const sendPhoto = async (file: File) => {
    if (!file.type.startsWith("image/")) return setNotice("You can send photos here. For a video, ask us where to send it.");
    if (file.size > 10 * 1024 * 1024) return setNotice("That photo is over 10 MB. Try a smaller one.");
    setNotice("");
    const client_id = newClientId();
    const preview = URL.createObjectURL(file);
    const local: ChatMsg = { id: client_id, client_id, sender: "visitor", body: "", image: preview, delivered_at: null, read_at: null, created_at: new Date().toISOString(), pending: true };
    setMessages((l) => [...l, local]);
    const s = await ensureSession();
    if (!s) return;
    const form = new FormData();
    form.append("photo", file);
    form.append("client_id", client_id);
    try {
      const r = await fetch(`${API_URL}/api/chat/${s.id}/photo/?token=${encodeURIComponent(s.token)}`, { method: "POST", body: form });
      const d = await r.json().catch(() => ({}));
      if (!r.ok) throw new Error(d?.photo?.[0] ?? "Couldn't send that photo. Try again.");
      setMessages((l) => upsert(l, d as ChatMsg));
    } catch (e) {
      setNotice((e as Error).message);
      setMessages((l) => l.map((m) => (m.client_id === client_id && m.pending ? { ...m, pending: false, failed: true } : m)));
    } finally {
      setTimeout(() => URL.revokeObjectURL(preview), 30_000);
    }
  };

  const onDraftChange = (v: string) => {
    setDraft(v);
    const now = Date.now();
    if (session && v && now - lastTypingSent.current > 2000) {
      lastTypingSent.current = now;
      send({ type: "typing" }, false);
    }
  };

  const status = typing ? "typing…" : biz?.online ? "online" : (lastSeen(biz?.last_seen) ?? "usually replies within minutes");
  const hasVisitorMsg = messages.some((m) => m.sender === "visitor");
  const hasReply = messages.some((m) => m.sender === "admin");
  const tel = `tel:${site.phone.replace(/\s/g, "")}`;

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
          {!open && biz?.online && <span className="absolute -right-1 -top-1 size-3 rounded-full border-2 border-brand bg-ok" aria-hidden="true" />}
        </span>
        <span className="hidden md:inline">{open ? "Close" : "Message us"}</span>
        {unread > 0 && !open && (
          <span className="absolute -left-1.5 -top-1.5 grid min-w-6 place-items-center rounded-full bg-ok px-1.5 text-[0.8125rem] font-bold leading-6 text-white" aria-hidden="true">
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
        onKeyDown={(e) => e.key === "Escape" && !viewing && closePanel()}
        className="chat-panel fixed inset-0 z-[60] flex flex-col overflow-hidden bg-[#e9eff6] md:inset-auto md:bottom-24 md:right-6 md:h-[min(640px,calc(100svh-140px))] md:w-[400px] md:rounded-md md:shadow-lift md:ring-1 md:ring-line"
      >
        <header className="on-dark flex items-center gap-2.5 bg-ink px-2 pb-2.5 pt-[max(10px,env(safe-area-inset-top))] text-on-dark md:px-4 md:py-3">
          <button type="button" onClick={closePanel} aria-label="Close chat" className="grid size-10 cursor-pointer place-items-center rounded-full hover:bg-on-dark/10 md:hidden">
            <svg viewBox="0 0 24 24" className="size-6" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
              <path d="M15 5 8 12l7 7" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </button>
          <span className="relative shrink-0">
            <ElbowMark className="size-10" />
            {biz?.online && <span className="absolute -bottom-0.5 -right-0.5 size-3.5 rounded-full border-2 border-ink bg-ok" aria-hidden="true" />}
          </span>
          <div className="min-w-0 flex-1">
            <h2 id={titleId} className="truncate font-display text-[1.0625rem] font-bold leading-tight text-on-dark [font-stretch:110%]">
              {site.name}
            </h2>
            <p className={`truncate text-[0.8125rem] ${typing || biz?.online ? "text-sky" : "text-on-dark-muted"}`}>{status}</p>
          </div>
          <a href={tel} aria-label={`Call ${site.phone}`} className="grid size-10 place-items-center rounded-full text-on-dark hover:bg-on-dark/10">
            <svg viewBox="0 0 24 24" className="size-5" fill="none" stroke="currentColor" strokeWidth="1.9" aria-hidden="true">
              <path d="M5 4h3.5l1.7 4.3-2.2 1.4a11 11 0 0 0 6.3 6.3l1.4-2.2L20 15.5V19a1 1 0 0 1-1 1A16 16 0 0 1 4 5a1 1 0 0 1 1-1Z" strokeLinejoin="round" />
            </svg>
          </a>
          <button type="button" onClick={closePanel} aria-label="Close chat" className="hidden size-10 cursor-pointer place-items-center rounded-full text-on-dark hover:bg-on-dark/10 md:grid">
            <svg viewBox="0 0 24 24" className="size-5" fill="none" stroke="currentColor" strokeWidth="2.2" aria-hidden="true">
              <path d="M6 6l12 12M18 6 6 18" strokeLinecap="round" />
            </svg>
          </button>
        </header>

        {session && sockState === "closed" && (
          <p className="bg-[#fff4d6] px-4 py-1.5 text-center text-[0.8125rem] font-medium text-[#6b4e00]" role="status">
            Connecting… messages will send when you&apos;re back online.
          </p>
        )}

        <div ref={listRef} className="chat-wall flex-1 overflow-y-auto px-3 pb-3 pt-1 md:px-4" role="log" aria-live="polite" aria-label="Messages">
          <p className="mx-auto my-3 max-w-[290px] rounded-md bg-[#fdf6dd] px-3 py-2 text-center text-[0.75rem] leading-snug text-[#5c4a14]">
            Messages go straight to our team. Send a photo of the problem and we can often tell you what it is before we visit.
          </p>
          <div className="chat-bubble mt-2.5 flex">
            <div className="bubble-tail-in max-w-[82%] rounded-[10px] rounded-tl-[2px] bg-surface px-2.5 py-1.5 text-[0.9375rem] leading-snug shadow-[0_1px_0.5px_rgb(10_26_51/0.13)]">
              Hi 👋 How can we help? Type your message below. You can also send a photo.
            </div>
          </div>
          <Thread messages={messages} me="visitor" theirName={site.name} onImage={setViewing} />
          {hasVisitorMsg && !hasReply && biz && !biz.online && (
            <p className="mx-auto my-3 max-w-[300px] rounded-md bg-surface/90 px-3 py-2 text-center text-[0.8125rem] leading-snug text-muted shadow-hair">
              We&apos;re out on a job right now. Leave your number and we&apos;ll call you back. For a leak or burst pipe, call{" "}
              <a href={tel} className="font-semibold text-water">
                {site.phone}
              </a>
              .
            </p>
          )}
          {closed && session && <p className="my-3 text-center text-[0.75rem] text-muted">This chat was closed. Send a message to start again.</p>}
          {typing && <TypingBubble label={`${site.name} is typing`} />}
        </div>

        <div className="bg-[#e9eff6] px-2 pb-[max(8px,env(safe-area-inset-bottom))] pt-1 md:px-3 md:pb-3">
          {notice && (
            <p role="alert" className="mb-2 rounded-sm bg-surface px-3 py-2 text-[0.8125rem] font-medium text-danger">
              {notice}
            </p>
          )}
          <Composer id="chat-draft" value={draft} onChange={onDraftChange} onSend={() => sendText(draft)} onPhoto={sendPhoto} placeholder="Type a message" />
        </div>
      </div>
      <PhotoViewer src={viewing} onClose={() => setViewing(null)} />
    </>
  );
}
