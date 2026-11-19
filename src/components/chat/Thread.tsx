"use client";

/** One chat message as both the website and the dashboard see it. */
export type ChatMsg = {
  id: number | string;
  sender: "visitor" | "admin";
  body: string;
  image: string | null;
  client_id?: string;
  delivered_at: string | null;
  read_at: string | null;
  created_at: string;
  /** Local only: shown before the server has it. */
  pending?: boolean;
  failed?: boolean;
};

export const newClientId = () => `c${Date.now().toString(36)}${Math.random().toString(36).slice(2, 8)}`;

const clock = (iso: string) => new Date(iso).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });

export function dayLabel(iso: string) {
  const d = new Date(iso);
  const today = new Date();
  const y = new Date();
  y.setDate(today.getDate() - 1);
  if (d.toDateString() === today.toDateString()) return "Today";
  if (d.toDateString() === y.toDateString()) return "Yesterday";
  return d.toLocaleDateString([], { weekday: "long", day: "numeric", month: "long" });
}

/** "online", "last seen today at 07:12", "last seen yesterday at 22:40". */
export function lastSeen(iso: string | null | undefined) {
  if (!iso) return null;
  const label = dayLabel(iso);
  return `last seen ${label === "Today" ? "today" : label === "Yesterday" ? "yesterday" : label} at ${clock(iso)}`;
}

/** Merge a server message into the list: replaces the matching "sending…" copy, ignores duplicates. */
export function upsert(list: ChatMsg[], m: ChatMsg): ChatMsg[] {
  if (list.some((x) => x.id === m.id)) return list.map((x) => (x.id === m.id ? { ...x, ...m } : x));
  const i = m.client_id ? list.findIndex((x) => x.pending && x.client_id === m.client_id) : -1;
  if (i >= 0) {
    const next = [...list];
    next[i] = m;
    return next;
  }
  return [...list, m];
}

/** Apply a delivered/read receipt to every message from `sender`. */
export function applyReceipt(list: ChatMsg[], sender: string, status: "delivered" | "read", at: string): ChatMsg[] {
  return list.map((m) =>
    m.sender !== sender || m.pending
      ? m
      : status === "read"
        ? { ...m, read_at: m.read_at ?? at, delivered_at: m.delivered_at ?? at }
        : { ...m, delivered_at: m.delivered_at ?? at },
  );
}

/** ✓ sent · ✓✓ delivered · blue ✓✓ read · clock while sending. */
export function Ticks({ m, decorative }: { m: ChatMsg; decorative?: boolean }) {
  if (decorative) return <span className="inline-block w-[18px]" />;
  if (m.failed) return <span className="text-danger" title="Not sent">!</span>;
  if (m.pending)
    return (
      <svg viewBox="0 0 16 16" className="size-3.5" fill="none" stroke="currentColor" strokeWidth="1.6" aria-label="Sending">
        <circle cx="8" cy="8" r="6" />
        <path d="M8 4.5V8l2.2 1.4" strokeLinecap="round" />
      </svg>
    );
  const read = Boolean(m.read_at);
  const two = read || Boolean(m.delivered_at);
  return (
    <svg
      viewBox="0 0 18 12"
      className={`h-3 w-[18px] ${read ? "text-brand" : "text-muted"}`}
      fill="none"
      stroke="currentColor"
      strokeWidth="1.7"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-label={read ? "Read" : two ? "Delivered" : "Sent"}
    >
      <path d={two ? "M1 6.5 4.2 9.7 10.5 2.5" : "M3 6.5 6.2 9.7 12.5 2.5"} />
      {two && <path d="M7.5 9.2 8 9.7 14.5 2.5" />}
    </svg>
  );
}

/**
 * The message list: day separators, grouped bubbles with a tail on the first of each group,
 * time + ticks tucked inside the bubble. `me` is whose messages sit on the right.
 */
export function Thread({
  messages,
  me,
  theirName,
  onImage,
}: {
  messages: ChatMsg[];
  me: "visitor" | "admin";
  theirName: string;
  onImage?: (src: string) => void;
}) {
  return (
    <>
      {messages.map((m, i) => {
        const prev = messages[i - 1];
        const newDay = !prev || new Date(prev.created_at).toDateString() !== new Date(m.created_at).toDateString();
        const first = newDay || prev.sender !== m.sender;
        const mine = m.sender === me;
        return (
          <div key={m.client_id && m.pending ? m.client_id : m.id}>
            {newDay && (
              <p className="my-3 flex justify-center">
                <span className="rounded-md bg-surface/90 px-3 py-1 text-[0.75rem] font-semibold text-muted shadow-hair">{dayLabel(m.created_at)}</span>
              </p>
            )}
            <div className={`chat-bubble flex ${mine ? "justify-end" : "justify-start"} ${first ? "mt-2.5" : "mt-0.5"}`}>
              <div
                className={`relative max-w-[82%] text-[0.9375rem] leading-snug text-ink shadow-[0_1px_0.5px_rgb(10_26_51/0.13)] ${
                  mine ? "bg-[#d9e7fd]" : "bg-surface"
                } ${m.image ? "p-1" : "px-2.5 pb-1.5 pt-1.5"} rounded-[10px] ${first ? (mine ? "rounded-tr-[2px] bubble-tail-out" : "rounded-tl-[2px] bubble-tail-in") : ""}`}
              >
                <span className="sr-only">{mine ? "You" : theirName}: </span>
                {m.image && (
                  <button type="button" onClick={() => onImage?.(m.image!)} className="block cursor-zoom-in overflow-hidden rounded-[8px]" aria-label="Open photo">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={m.image} alt="Photo sent in the chat" className={`block max-h-72 w-full max-w-[260px] object-cover ${m.pending ? "opacity-60" : ""}`} />
                  </button>
                )}
                {m.body && (
                  <p className={`m-0 whitespace-pre-wrap break-words ${m.image ? "px-1.5 pt-1" : ""}`}>
                    {m.body}
                    {/* an invisible copy of the time keeps room for it, so it never overlaps the last line */}
                    <span className="invisible ml-2.5 inline-flex items-center gap-1 align-baseline text-[0.6875rem]" aria-hidden="true">
                      {clock(m.created_at)}
                      {mine && <Ticks m={m} decorative />}
                    </span>
                  </p>
                )}
                <span
                  className={`flex items-center gap-1 text-[0.6875rem] tabular-nums ${
                    m.image && !m.body
                      ? "absolute bottom-2 right-2.5 rounded-full bg-ink/45 px-1.5 py-0.5 text-white [&_svg]:text-white"
                      : "absolute bottom-1 right-2 text-muted"
                  }`}
                >
                  {clock(m.created_at)}
                  {mine && <Ticks m={m} />}
                </span>
              </div>
            </div>
          </div>
        );
      })}
    </>
  );
}

export function TypingBubble({ label }: { label: string }) {
  return (
    <div className="chat-bubble mt-2.5 flex">
      <div className="bubble-tail-in flex items-center gap-1 rounded-[10px] rounded-tl-[2px] bg-surface px-3.5 py-3 shadow-[0_1px_0.5px_rgb(10_26_51/0.13)]" aria-label={label}>
        <span className="typing-dot" />
        <span className="typing-dot [animation-delay:150ms]" />
        <span className="typing-dot [animation-delay:300ms]" />
      </div>
    </div>
  );
}

/** Full-screen photo viewer. */
export function PhotoViewer({ src, onClose }: { src: string | null; onClose: () => void }) {
  if (!src) return null;
  return (
    <div
      role="dialog"
      aria-label="Photo"
      className="fixed inset-0 z-[90] grid place-items-center bg-ink/92 p-4"
      onClick={onClose}
      onKeyDown={(e) => e.key === "Escape" && onClose()}
    >
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src={src} alt="Photo sent in the chat" className="max-h-[88svh] max-w-full rounded-sm object-contain" />
      <button
        type="button"
        autoFocus
        onClick={onClose}
        className="absolute right-4 top-4 grid size-11 cursor-pointer place-items-center rounded-full bg-white/10 text-xl text-white hover:bg-white/20"
        aria-label="Close photo"
      >
        ✕
      </button>
    </div>
  );
}

/** Composer: grows with the text, Enter sends (Shift+Enter for a new line), camera button for photos. */
export function Composer({
  value,
  onChange,
  onSend,
  onPhoto,
  placeholder,
  id,
  autoFocus,
  before,
  onKeyDown,
}: {
  value: string;
  onChange: (v: string) => void;
  onSend: () => void;
  onPhoto?: (f: File) => void;
  placeholder: string;
  id: string;
  autoFocus?: boolean;
  /** Extra button(s) inside the box, left of the text (e.g. saved replies). */
  before?: React.ReactNode;
  /** Runs first; return true to stop the default (used by the "/" saved-reply menu). */
  onKeyDown?: (e: React.KeyboardEvent<HTMLTextAreaElement>) => boolean;
}) {
  return (
    <form
      className="flex items-end gap-2"
      onSubmit={(e) => {
        e.preventDefault();
        onSend();
      }}
    >
      <div className="flex min-h-12 flex-1 items-end rounded-[24px] bg-surface shadow-[0_1px_0.5px_rgb(10_26_51/0.13)] ring-1 ring-line focus-within:ring-2 focus-within:ring-brand">
        {before}
        <label htmlFor={id} className="sr-only">
          Message
        </label>
        <textarea
          id={id}
          rows={1}
          value={value}
          maxLength={2000}
          autoFocus={autoFocus}
          onChange={(e) => onChange(e.target.value)}
          enterKeyHint="send"
          autoComplete="off"
          autoCapitalize="sentences"
          spellCheck
          onKeyDown={(e) => {
            if (onKeyDown?.(e)) return;
            // Like WhatsApp: Enter sends on a computer; on a phone keyboard Enter makes a new line and you tap Send.
            const touch = typeof window !== "undefined" && window.matchMedia("(pointer: coarse)").matches;
            if (e.key === "Enter" && !e.shiftKey && !touch && !e.nativeEvent.isComposing) {
              e.preventDefault();
              onSend();
            }
          }}
          placeholder={placeholder}
          className={`max-h-32 min-h-12 flex-1 resize-none bg-transparent py-3 ${before ? "pl-1" : "pl-4"} text-[1rem] leading-snug [field-sizing:content] placeholder:text-muted focus:outline-none`}
        />
        {onPhoto && (
          <label className="grid size-12 shrink-0 cursor-pointer place-items-center rounded-full text-muted hover:text-brand" title="Send a photo">
            <span className="sr-only">Send a photo</span>
            <svg viewBox="0 0 24 24" className="size-[22px]" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden="true">
              <path d="M4 8.5A2.5 2.5 0 0 1 6.5 6h1.6l1.3-2h5.2l1.3 2h1.6A2.5 2.5 0 0 1 20 8.5v8a2.5 2.5 0 0 1-2.5 2.5h-11A2.5 2.5 0 0 1 4 16.5Z" strokeLinejoin="round" />
              <circle cx="12" cy="12.5" r="3.5" />
            </svg>
            <input
              type="file"
              accept="image/*"
              className="sr-only"
              onChange={(e) => {
                const f = e.target.files?.[0];
                if (f) onPhoto(f);
                e.target.value = "";
              }}
            />
          </label>
        )}
      </div>
      <button
        type="submit"
        disabled={!value.trim()}
        aria-label="Send"
        className="grid size-12 shrink-0 cursor-pointer place-items-center rounded-full bg-brand text-white shadow-[0_1px_2px_rgb(10_26_51/0.2)] transition-transform duration-150 ease-out-soft hover:bg-brand-light active:scale-[.94] disabled:cursor-default disabled:bg-muted/50"
      >
        <svg viewBox="0 0 24 24" className="ml-0.5 size-5" fill="currentColor" aria-hidden="true">
          <path d="M3.4 20.4 21 12 3.4 3.6 3.4 10l12.6 2-12.6 2Z" />
        </svg>
      </button>
    </form>
  );
}
