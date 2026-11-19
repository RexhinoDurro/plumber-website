"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useAdmin, useAdminEvents } from "@/components/admin/AdminShell";
import { DemoTag, EmptyState } from "@/components/admin/ui";
import { ago, api, contactLinks, errorText, upload, type Conversation, type Message } from "@/components/admin/client";
import { applyReceipt, Composer, lastSeen, newClientId, PhotoViewer, Thread, Ticks, TypingBubble, upsert } from "@/components/chat/Thread";

type QuickReply = { id: number; label: string; text: string };
type Filter = "waiting" | "open" | "closed" | "all";
type Detail = Conversation & { messages: Message[] };

const waitingSince = (c: Conversation) => (c.status === "open" && c.last_message?.sender === "visitor" ? c.last_message.created_at : null);
const initials = (name: string) =>
  name.startsWith("Visitor ")
    ? "?"
    : name
        .split(/\s+/)
        .slice(0, 2)
        .map((w) => w[0]?.toUpperCase())
        .join("");
const time = (iso: string) => {
  const d = new Date(iso);
  return d.toDateString() === new Date().toDateString()
    ? d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
    : d.toLocaleDateString([], { day: "numeric", month: "short" });
};

function Avatar({ c, size = "size-11" }: { c: Conversation; size?: string }) {
  return (
    <span className="relative shrink-0">
      <span className={`grid ${size} place-items-center rounded-full bg-[#d9e7fd] font-display text-[0.9375rem] font-bold text-water [font-stretch:110%]`} aria-hidden="true">
        {initials(c.display_name)}
      </span>
      {c.visitor_online && <span className="absolute bottom-0 right-0 size-3 rounded-full border-2 border-surface bg-ok" aria-label="Online now" />}
    </span>
  );
}

export default function InboxPage() {
  const { send, toast, live } = useAdmin();
  const [list, setList] = useState<Conversation[] | null>(null);
  const [filter, setFilter] = useState<Filter>("open");
  const [selected, setSelected] = useState<string | null>(null);
  const [detail, setDetail] = useState<Detail | null>(null);
  const [replies, setReplies] = useState<QuickReply[]>([]);
  const [draft, setDraft] = useState("");
  const [typing, setTyping] = useState<Record<string, number>>({});
  const [fresh, setFresh] = useState<Set<string>>(new Set());
  const [viewing, setViewing] = useState<string | null>(null);
  const [pickerOpen, setPickerOpen] = useState(false);
  const [followup, setFollowup] = useState<{ email: boolean; sms: boolean; whatsapp: boolean; auto_reply_seconds: number } | null>(null);
  const [now, setNow] = useState(() => Date.now());
  const threadRef = useRef<HTMLDivElement>(null);
  const lastTyping = useRef(0);

  const loadList = useCallback(() => {
    api<Conversation[]>("/api/admin/conversations/")
      .then(setList)
      .catch(() => setList((l) => l ?? []));
  }, []);

  useEffect(() => {
    loadList();
    api<QuickReply[]>("/api/admin/quick-replies/").then(setReplies).catch(() => {});
    api<typeof followup>("/api/admin/followup/").then(setFollowup).catch(() => {});
    const pick = () => setSelected(decodeURIComponent(location.hash.slice(1)) || null);
    pick();
    window.addEventListener("hashchange", pick);
    const t = setInterval(() => setNow(Date.now()), 20_000);
    return () => {
      window.removeEventListener("hashchange", pick);
      clearInterval(t);
    };
  }, [loadList]);

  // Open a conversation: load its messages and mark them read (the visitor's ticks turn blue).
  useEffect(() => {
    if (!selected) return;
    let stop = false;
    api<Detail>(`/api/admin/conversations/${selected}/`)
      .then((d) => {
        if (stop) return;
        setDetail(d);
        send({ type: "read", conversation: selected });
        setList((l) => l?.map((c) => (c.id === selected ? { ...c, unread_for_admin: 0 } : c)) ?? l);
        setFresh((f) => {
          const n = new Set(f);
          n.delete(selected);
          return n;
        });
      })
      .catch(() => !stop && setDetail(null));
    return () => {
      stop = true;
    };
  }, [selected, send]);

  useEffect(() => {
    const el = threadRef.current;
    if (el) el.scrollTop = el.scrollHeight;
  }, [detail?.messages.length, selected, typing]);

  const patchConv = (id: string, p: Partial<Conversation>) => {
    setList((l) => l?.map((c) => (c.id === id ? { ...c, ...p } : c)) ?? l);
    setDetail((d) => (d && d.id === id ? { ...d, ...p } : d));
  };

  useAdminEvents((e) => {
    const cid = e.conversation ? String(typeof e.conversation === "object" ? (e.conversation as Conversation).id : e.conversation) : "";
    if (e.type === "conversation" || e.type === "conversation_new") {
      const c = e.conversation as Conversation;
      setList((l) => {
        if (!l) return l;
        const i = l.findIndex((x) => x.id === c.id);
        // Update in place so rows don't jump while you're working; new chats go on top.
        if (i === -1) return [c, ...l];
        const next = [...l];
        next[i] = c.id === selected ? { ...c, unread_for_admin: 0 } : c;
        return next;
      });
      if (c.id !== selected && e.type === "conversation" && c.last_message?.sender === "visitor") setFresh((f) => new Set(f).add(c.id));
      setDetail((d) => (d && d.id === c.id ? { ...d, ...c, messages: d.messages } : d));
    }
    if (e.type === "message" && cid === selected) {
      const m = e.message as Message;
      setDetail((d) => (d ? { ...d, messages: upsert(d.messages, m) } : d));
      if (m.sender === "visitor") {
        if (document.visibilityState === "visible") send({ type: "read", conversation: cid });
        setTyping((t) => ({ ...t, [cid]: 0 }));
      }
    }
    if (e.type === "receipt" && cid === selected) {
      setDetail((d) => (d ? { ...d, messages: applyReceipt(d.messages, String(e.sender), e.status as "read" | "delivered", String(e.at)) } : d));
    }
    if (e.type === "visitor_presence") {
      patchConv(cid, { visitor_online: Boolean(e.online), ...(e.last_seen ? { visitor_last_seen: String(e.last_seen) } : {}) });
    }
    if (e.type === "typing" && e.who === "visitor") {
      setTyping((t) => ({ ...t, [cid]: Date.now() }));
      setTimeout(() => setTyping((t) => (Date.now() - (t[cid] ?? 0) >= 3400 ? { ...t, [cid]: 0 } : t)), 3500);
    }
  });

  const counts = useMemo(() => {
    const l = list ?? [];
    return {
      waiting: l.filter((c) => waitingSince(c)).length,
      open: l.filter((c) => c.status === "open").length,
      closed: l.filter((c) => c.status === "closed").length,
      all: l.length,
    };
  }, [list]);

  const visible = (list ?? []).filter((c) => (filter === "all" ? true : filter === "waiting" ? waitingSince(c) : c.status === filter));

  const choose = (id: string | null) => {
    history.replaceState(null, "", id ? `#${id}` : location.pathname);
    setSelected(id);
    setDraft("");
  };

  const sendText = (text = draft) => {
    const body = text.trim();
    if (!body || !selected) return;
    const client_id = newClientId();
    const local: Message = { id: client_id, client_id, sender: "admin", body, image: null, delivered_at: null, read_at: null, created_at: new Date().toISOString(), pending: true };
    setDetail((d) => (d ? { ...d, messages: [...d.messages, local] } : d));
    send({ type: "message", conversation: selected, body, client_id });
    setDraft("");
  };

  const sendPhoto = async (file: File) => {
    if (!selected) return;
    const client_id = newClientId();
    const preview = URL.createObjectURL(file);
    const local: Message = { id: client_id, client_id, sender: "admin", body: "", image: preview, delivered_at: null, read_at: null, created_at: new Date().toISOString(), pending: true };
    setDetail((d) => (d ? { ...d, messages: [...d.messages, local] } : d));
    const form = new FormData();
    form.append("photo", file);
    form.append("client_id", client_id);
    try {
      const m = await upload<Message>(`/api/admin/conversations/${selected}/photo/`, form, () => {});
      setDetail((d) => (d ? { ...d, messages: upsert(d.messages, m) } : d));
    } catch (e) {
      toast({ title: "Photo not sent", body: errorText(e), tone: "error" });
      setDetail((d) => (d ? { ...d, messages: d.messages.map((x) => (x.client_id === client_id ? { ...x, pending: false, failed: true } : x)) } : d));
    }
  };

  const onDraft = (v: string) => {
    setDraft(v);
    if (selected && v && Date.now() - lastTyping.current > 2000) {
      lastTyping.current = Date.now();
      send({ type: "typing", conversation: selected });
    }
  };

  const action = async (path: string, ok: string) => {
    if (!selected) return;
    try {
      const r = await api<{ lead?: number }>(`/api/admin/conversations/${selected}/${path}/`, { method: "POST" });
      toast({ title: ok, tone: "ok", href: r?.lead ? `/admin/leads#${r.lead}` : undefined });
      const d = await api<Detail>(`/api/admin/conversations/${selected}/`);
      setDetail(d);
    } catch (e) {
      toast({ title: "That didn't work", body: errorText(e), tone: "error" });
    }
  };

  const saveInfo = async (patch: { visitor_name?: string; visitor_contact?: string; contact_via?: string }) => {
    if (!selected) return;
    try {
      const c = await api<Conversation>(`/api/admin/conversations/${selected}/info/`, { method: "PATCH", body: JSON.stringify(patch) });
      patchConv(selected, c);
      toast({ title: "Saved", tone: "ok" });
    } catch (e) {
      toast({ title: "Couldn't save", body: errorText(e), tone: "error" });
    }
  };

  const isTyping = selected ? (typing[selected] ?? 0) > 0 : false;
  const headerStatus = detail ? (isTyping ? "typing…" : detail.visitor_online ? "online" : (lastSeen(detail.visitor_last_seen) ?? "offline")) : "";

  return (
    <div className="-mx-4 -my-6 h-[calc(100svh-120px)] md:-mx-10 md:-my-10 md:h-svh">
      <div className="grid h-full grid-cols-[minmax(0,1fr)] lg:grid-cols-[340px_minmax(0,1fr)] xl:grid-cols-[360px_minmax(0,1fr)_290px]">
        {/* ---- chats list ---- */}
        <section className={`flex min-h-0 flex-col border-r border-line bg-surface ${selected ? "hidden lg:flex" : "flex"}`} aria-label="Chats">
          <div className="border-b border-line px-4 pb-3 pt-6">
            <div className="flex items-center justify-between">
              <h1 className="text-[1.6rem]">Chats</h1>
              <span className="flex items-center gap-1.5 text-[0.8125rem] text-muted">
                <span className={`size-2 rounded-full ${live === "open" ? "bg-ok" : "bg-warn"}`} aria-hidden="true" />
                {live === "open" ? "You're online" : "Reconnecting"}
              </span>
            </div>
            <div className="mt-3 flex gap-1 overflow-x-auto" role="tablist" aria-label="Filter chats">
              {(["waiting", "open", "closed", "all"] as Filter[]).map((f) => (
                <button
                  key={f}
                  type="button"
                  role="tab"
                  aria-selected={filter === f}
                  onClick={() => (filter === f ? loadList() : setFilter(f))}
                  className="min-h-9 cursor-pointer whitespace-nowrap rounded-full bg-bg px-3 text-[0.8125rem] font-semibold capitalize text-muted aria-selected:bg-[#d9e7fd] aria-selected:text-water"
                >
                  {f} <span className="tabular-nums opacity-70">{counts[f]}</span>
                </button>
              ))}
            </div>
          </div>
          <ul className="min-h-0 flex-1 overflow-y-auto">
            {list === null &&
              Array.from({ length: 6 }, (_, i) => (
                <li key={i} className="flex gap-3 px-4 py-3">
                  <span className="size-11 animate-pulse rounded-full bg-photo" />
                  <span className="flex-1">
                    <span className="block h-4 w-1/2 animate-pulse rounded bg-photo" />
                    <span className="mt-2 block h-3 w-4/5 animate-pulse rounded bg-bg" />
                  </span>
                </li>
              ))}
            {list && visible.length === 0 && (
              <li className="px-6 py-14 text-center text-[0.9375rem] text-muted">
                {filter === "waiting"
                  ? "Nobody is waiting. Nice work."
                  : filter === "all"
                    ? "No chats yet. When a visitor presses “Message us” on the website, it lands here instantly."
                    : `No ${filter} chats.`}
              </li>
            )}
            {visible.map((c) => {
              const w = waitingSince(c);
              const active = c.id === selected;
              const unread = c.unread_for_admin > 0;
              const lm = c.last_message;
              const typingHere = (typing[c.id] ?? 0) > 0;
              return (
                <li key={c.id}>
                  <button
                    type="button"
                    onClick={() => choose(c.id)}
                    aria-current={active ? "true" : undefined}
                    className={`flex w-full cursor-pointer items-center gap-3 px-4 py-2.5 text-left transition-colors duration-150 ${active ? "bg-[#eef3fb]" : "hover:bg-bg/70"} ${fresh.has(c.id) ? "flash" : ""}`}
                  >
                    <Avatar c={c} />
                    <span className="min-w-0 flex-1 border-b border-line pb-2.5 pt-0.5">
                      <span className="flex items-center gap-2">
                        <span className={`min-w-0 flex-1 truncate ${unread ? "font-bold" : "font-semibold"}`}>{c.display_name}</span>
                        {c.demo && <DemoTag />}
                        <time className={`text-[0.75rem] tabular-nums ${unread ? "font-semibold text-ok" : "text-muted"}`}>{time(c.last_message_at)}</time>
                      </span>
                      <span className="mt-0.5 flex items-center gap-1.5">
                        <span className={`flex min-w-0 flex-1 items-center gap-1 truncate text-[0.875rem] ${typingHere ? "text-ok" : unread ? "text-ink" : "text-muted"}`}>
                          {typingHere ? (
                            "typing…"
                          ) : (
                            <>
                              {lm?.sender === "admin" && <Ticks m={lm} />}
                              <span className="truncate">{lm ? lm.body || "📷 Photo" : "…"}</span>
                            </>
                          )}
                        </span>
                        {w && !unread && now - new Date(w).getTime() > 300_000 && <span className="chip bg-warn/12 text-warn">{ago(w, now)}</span>}
                        {unread && <span className="grid min-w-5 place-items-center rounded-full bg-ok px-1.5 text-[0.75rem] font-bold leading-5 text-white">{c.unread_for_admin}</span>}
                      </span>
                    </span>
                  </button>
                </li>
              );
            })}
          </ul>
        </section>

        {/* ---- conversation ---- */}
        <section className={`min-h-0 flex-col ${selected ? "flex" : "hidden lg:flex"}`} aria-label="Conversation">
          {!selected || !detail ? (
            <div className="chat-wall grid flex-1 place-items-center p-8">
              <EmptyState title="Pick a chat" text="Replies appear in the visitor's chat window on the website instantly, with ticks when they've read them." />
            </div>
          ) : (
            <>
              <header className="flex items-center gap-3 border-b border-line bg-surface px-4 py-2.5">
                <button type="button" onClick={() => choose(null)} className="grid size-10 cursor-pointer place-items-center rounded-full hover:bg-bg lg:hidden" aria-label="Back to chats">
                  <svg viewBox="0 0 24 24" className="size-6" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
                    <path d="M15 5 8 12l7 7" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                </button>
                <Avatar c={detail} size="size-10" />
                <div className="min-w-0 flex-1">
                  <h2 className="truncate font-display text-[1.0625rem] font-bold [font-stretch:110%]">{detail.display_name}</h2>
                  <p className={`truncate text-[0.8125rem] ${isTyping || detail.visitor_online ? "text-ok" : "text-muted"}`}>{headerStatus}</p>
                </div>
                <ContactButtons contact={detail.visitor_contact} />
                <button type="button" className="btn btn-secondary min-h-10 px-4 text-[0.875rem]" onClick={() => action("close", detail.status === "open" ? "Chat closed" : "Chat reopened")}>
                  {detail.status === "open" ? "Close" : "Reopen"}
                </button>
              </header>

              <div ref={threadRef} className="chat-wall min-h-0 flex-1 overflow-y-auto px-4 py-3 md:px-8" role="log" aria-live="polite">
                <p className="mx-auto my-2 w-fit rounded-md bg-[#fdf6dd] px-3 py-1.5 text-center text-[0.75rem] text-[#5c4a14]">
                  Started {new Date(detail.created_at).toLocaleString([], { dateStyle: "medium", timeStyle: "short" })}
                  {detail.page_url && ` on ${detail.page_url}`}
                </p>
                <Thread messages={detail.messages} me="admin" theirName={detail.display_name} onImage={setViewing} />
                {isTyping && <TypingBubble label={`${detail.display_name} is typing`} />}
              </div>

              <div className="bg-[#e9eff6] px-3 pb-3 pt-2">
                <SavedReplies
                  replies={replies}
                  draft={draft}
                  open={pickerOpen}
                  setOpen={setPickerOpen}
                  onPick={(text) => {
                    setDraft(text);
                    setPickerOpen(false);
                    requestAnimationFrame(() => {
                      const el = document.getElementById("reply") as HTMLTextAreaElement | null;
                      el?.focus();
                      el?.setSelectionRange(text.length, text.length);
                    });
                  }}
                >
                  {(keys) => (
                    <Composer
                      id="reply"
                      value={draft}
                      onChange={onDraft}
                      onSend={() => sendText()}
                      onPhoto={sendPhoto}
                      onKeyDown={keys}
                      placeholder={`Message ${detail.display_name.split(" ")[0]} (type / for saved replies)`}
                      before={
                        replies.length > 0 && (
                          <button
                            type="button"
                            onClick={() => setPickerOpen((o) => !o)}
                            aria-expanded={pickerOpen}
                            aria-label="Saved replies"
                            title="Saved replies"
                            className="grid size-12 shrink-0 cursor-pointer place-items-center rounded-full text-muted hover:text-brand"
                          >
                            <svg viewBox="0 0 24 24" className="size-[22px]" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinejoin="round" aria-hidden="true">
                              <path d="M13 3 5 13.5h6L10 21l8-10.5h-6Z" />
                            </svg>
                          </button>
                        )
                      }
                    />
                  )}
                </SavedReplies>
              </div>
            </>
          )}
        </section>

        {/* ---- customer ---- */}
        {detail && selected && (
          <aside className="hidden min-h-0 overflow-y-auto border-l border-line bg-surface p-5 xl:block" aria-label="Customer details">
            <div className="grid justify-items-center gap-2 border-b border-line pb-5 text-center">
              <Avatar c={detail} size="size-20 text-2xl" />
              <p className="font-display text-lg font-bold [font-stretch:110%]">{detail.display_name}</p>
              <p className="text-[0.8125rem] text-muted">{headerStatus}</p>
            </div>
            <div className="mt-5 grid gap-4 text-[0.875rem]">
              <InlineField key={`n-${detail.id}-${detail.visitor_name}`} label="Name" value={detail.visitor_name} placeholder="Ask in the chat, then add it" onSave={(v) => saveInfo({ visitor_name: v })} />
              <InlineField key={`c-${detail.id}-${detail.visitor_contact}`} label="Phone or email" value={detail.visitor_contact} placeholder="Filled in when they type it" onSave={(v) => saveInfo({ visitor_contact: v })} />
              <label className="grid gap-1">
                <span className="text-[0.75rem] font-semibold uppercase tracking-wide text-muted">If they leave, reply by</span>
                <select
                  value={detail.contact_via}
                  onChange={(e) => saveInfo({ contact_via: e.target.value })}
                  className="rounded-sm border border-transparent bg-bg px-2 py-1.5 hover:border-line focus:border-brand focus:outline-none"
                >
                  <option value="">Not chosen yet</option>
                  <option value="whatsapp">WhatsApp</option>
                  <option value="sms">Text message</option>
                  <option value="email">Email</option>
                </select>
                <FollowupNote via={detail.contact_via} contact={detail.visitor_contact} status={followup} notifiedAt={detail.last_notified_at} />
              </label>
              <Info label="Started on" value={detail.page_url || "–"} />
              <Info
                label="First reply"
                value={
                  detail.first_admin_reply_at
                    ? `${Math.max(1, Math.round((new Date(detail.first_admin_reply_at).getTime() - new Date(detail.created_at).getTime()) / 60000))} min after they wrote`
                    : "Not replied yet"
                }
              />
            </div>
            <div className="mt-6 border-t border-line pt-5">
              {detail.lead ? (
                <Link href={`/admin/leads#${detail.lead}`} className="btn btn-secondary w-full">
                  Open lead
                </Link>
              ) : (
                <>
                  <button type="button" className="btn w-full" onClick={() => action("to-lead", "Added to leads")}>
                    Add to leads
                  </button>
                  <p className="mt-2 text-[0.8125rem] text-muted">Puts this customer in your pipeline with the chat saved in the notes.</p>
                </>
              )}
            </div>
          </aside>
        )}
      </div>
      <PhotoViewer src={viewing} onClose={() => setViewing(null)} />
    </div>
  );
}

function Info({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-[0.75rem] font-semibold uppercase tracking-wide text-muted">{label}</p>
      <p className="mt-0.5 break-words">{value}</p>
    </div>
  );
}

function InlineField({ label, value, placeholder, onSave }: { label: string; value: string; placeholder: string; onSave: (v: string) => void }) {
  const [v, setV] = useState(value);
  return (
    <label className="grid gap-1">
      <span className="text-[0.75rem] font-semibold uppercase tracking-wide text-muted">{label}</span>
      <input
        value={v}
        placeholder={placeholder}
        onChange={(e) => setV(e.target.value)}
        onBlur={() => v.trim() !== value && onSave(v.trim())}
        onKeyDown={(e) => e.key === "Enter" && (e.target as HTMLInputElement).blur()}
        className="rounded-sm border border-transparent bg-bg px-2 py-1.5 hover:border-line focus:border-brand focus:bg-surface focus:outline-none"
      />
    </label>
  );
}

/**
 * Saved replies, WhatsApp Business style: open with the ⚡ button or type "/" in the box.
 * Picking one puts the text in the box so you can change it before sending.
 */
function SavedReplies({
  replies,
  draft,
  open,
  setOpen,
  onPick,
  children,
}: {
  replies: QuickReply[];
  draft: string;
  open: boolean;
  setOpen: (v: boolean) => void;
  onPick: (text: string) => void;
  children: (onKeyDown: (e: React.KeyboardEvent<HTMLTextAreaElement>) => boolean) => React.ReactNode;
}) {
  const [active, setActive] = useState(0);
  const slash = draft.startsWith("/") && !draft.includes(" ") ? draft.slice(1).toLowerCase() : null;
  const shown = slash !== null ? replies.filter((r) => `${r.label} ${r.text}`.toLowerCase().includes(slash)) : replies;
  const visible = (open || slash !== null) && shown.length > 0;
  const idx = Math.min(active, shown.length - 1);

  const onKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (!visible) return false;
    if (e.key === "ArrowDown" || e.key === "ArrowUp") {
      e.preventDefault();
      setActive((i) => (i + (e.key === "ArrowDown" ? 1 : -1) + shown.length) % shown.length);
      return true;
    }
    if (e.key === "Enter" || e.key === "Tab") {
      e.preventDefault();
      onPick(shown[idx].text);
      setActive(0);
      return true;
    }
    if (e.key === "Escape") {
      e.preventDefault();
      setOpen(false);
      return true;
    }
    return false;
  };

  return (
    <div className="relative">
      {visible && (
        <ul role="listbox" aria-label="Saved replies" className="absolute inset-x-0 bottom-full z-10 mb-2 max-h-72 overflow-y-auto rounded-md bg-surface p-1.5 shadow-lift ring-1 ring-line">
          {shown.map((r, i) => (
            <li key={r.id} role="option" aria-selected={i === idx}>
              <button
                type="button"
                onMouseEnter={() => setActive(i)}
                onClick={() => onPick(r.text)}
                className={`grid w-full cursor-pointer gap-0.5 rounded-sm px-3 py-2 text-left ${i === idx ? "bg-[#eef3fb]" : ""}`}
              >
                <span className="text-[0.8125rem] font-semibold text-water">/{r.label.toLowerCase().replace(/\s+/g, "-")}</span>
                <span className="line-clamp-2 text-[0.875rem] text-ink">{r.text}</span>
              </button>
            </li>
          ))}
        </ul>
      )}
      {children(onKeyDown)}
    </div>
  );
}

/** Call / WhatsApp / Text / Email buttons that open the device's own apps. */
function ContactButtons({ contact }: { contact: string }) {
  if (!contact) return null;
  const l = contactLinks(contact);
  const cls = "btn btn-secondary min-h-10 px-3 text-[0.8125rem]";
  return (
    <span className="hidden gap-1.5 sm:flex">
      {l.isPhone && (
        <>
          <a href={l.call} className={cls}>
            Call
          </a>
          <a href={l.whatsapp} target="_blank" rel="noopener" className={cls}>
            WhatsApp
          </a>
          <a href={l.sms} className={cls}>
            Text
          </a>
        </>
      )}
      {l.isEmail && (
        <a href={l.email} className={cls}>
          Email
        </a>
      )}
    </span>
  );
}

function FollowupNote({
  via,
  contact,
  status,
  notifiedAt,
}: {
  via: string;
  contact: string;
  status: { email: boolean; sms: boolean; whatsapp: boolean } | null;
  notifiedAt: string | null;
}) {
  if (!via || !contact) {
    return <span className="text-[0.8125rem] text-muted">The chat asks them for a number or email after their first message.</span>;
  }
  const automatic = status ? status[via as "email" | "sms" | "whatsapp"] : false;
  return (
    <span className="text-[0.8125rem] text-muted">
      {automatic
        ? "Replies they haven't seen are sent there automatically after a minute and a half, with a link back to this chat."
        : via === "email"
          ? "Email sending isn't set up yet (see README). Use the Email button for now."
          : `Automatic ${via === "sms" ? "texts" : "WhatsApp messages"} need a Twilio account (see README). Use the ${via === "sms" ? "Text" : "WhatsApp"} button for now.`}
      {notifiedAt && <span className="mt-1 block">Last sent {ago(notifiedAt)} ago.</span>}
    </span>
  );
}
