"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useAdmin, useAdminEvents } from "@/components/admin/AdminShell";
import { DemoTag, EmptyState } from "@/components/admin/ui";
import { ago, api, errorText, type Conversation, type Message } from "@/components/admin/client";

type QuickReply = { id: number; label: string; text: string };
type Filter = "waiting" | "open" | "closed" | "all";
type Detail = Conversation & { messages: Message[] };

const waitingSince = (c: Conversation) => (c.status === "open" && c.last_message?.sender === "visitor" ? c.last_message.created_at : null);

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
  const [now, setNow] = useState(() => Date.now());
  const threadRef = useRef<HTMLDivElement>(null);
  const draftRef = useRef<HTMLTextAreaElement>(null);
  const lastTyping = useRef(0);

  const loadList = useCallback(() => {
    api<Conversation[]>("/api/admin/conversations/")
      .then(setList)
      .catch(() => setList((l) => l ?? []));
  }, []);

  useEffect(() => {
    loadList();
    api<QuickReply[]>("/api/admin/quick-replies/").then(setReplies).catch(() => {});
    const pick = () => setSelected(decodeURIComponent(location.hash.slice(1)) || null);
    pick();
    window.addEventListener("hashchange", pick);
    const t = setInterval(() => setNow(Date.now()), 20_000);
    return () => {
      window.removeEventListener("hashchange", pick);
      clearInterval(t);
    };
  }, [loadList]);

  // Open a conversation: load its messages and mark it read.
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

  useAdminEvents((e) => {
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
      if (c.id !== selected) setFresh((f) => new Set(f).add(c.id));
      setDetail((d) => (d && d.id === c.id ? { ...d, ...c, messages: d.messages } : d));
    }
    if (e.type === "message" && e.conversation === selected) {
      const m = e.message as Message;
      setDetail((d) => (d && !d.messages.some((x) => x.id === m.id) ? { ...d, messages: [...d.messages, m] } : d));
      if (m.sender === "visitor") {
        const id = String(e.conversation);
        send({ type: "read", conversation: id });
        setTyping((t) => ({ ...t, [id]: 0 }));
      }
    }
    if (e.type === "typing" && e.who === "visitor") {
      const id = String(e.conversation);
      setTyping((t) => ({ ...t, [id]: Date.now() }));
      setTimeout(() => setTyping((t) => (Date.now() - (t[id] ?? 0) >= 3400 ? { ...t, [id]: 0 } : t)), 3500);
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

  const visible = (list ?? []).filter((c) =>
    filter === "all" ? true : filter === "waiting" ? waitingSince(c) : c.status === filter,
  );

  const choose = (id: string | null) => {
    history.replaceState(null, "", id ? `#${id}` : location.pathname);
    setSelected(id);
    setDraft("");
  };

  const sendReply = (text = draft) => {
    const body = text.trim();
    if (!body || !selected) return;
    send({ type: "message", conversation: selected, body });
    setDraft("");
    draftRef.current?.focus();
  };

  const onDraft = (v: string) => {
    setDraft(v);
    if (selected && Date.now() - lastTyping.current > 2000) {
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

  const isTyping = selected ? (typing[selected] ?? 0) > 0 : false;

  return (
    <div className="-mx-4 -my-6 h-[calc(100svh-120px)] md:-mx-10 md:-my-10 md:h-svh">
      <div className="grid h-full lg:grid-cols-[320px_minmax(0,1fr)] xl:grid-cols-[340px_minmax(0,1fr)_280px]">
        {/* ---- conversation list ---- */}
        <section className={`flex min-h-0 flex-col border-r border-line bg-surface ${selected ? "hidden lg:flex" : "flex"}`} aria-label="Conversations">
          <div className="border-b border-line px-5 pb-3 pt-6">
            <div className="flex items-center justify-between">
              <h1 className="text-[1.6rem]">Inbox</h1>
              <span className="flex items-center gap-1.5 text-[0.8125rem] text-muted">
                <span className={`size-2 rounded-full ${live === "open" ? "bg-ok" : "bg-warn"}`} aria-hidden="true" />
                {live === "open" ? "Live" : "Reconnecting"}
              </span>
            </div>
            <div className="mt-3 flex gap-1 overflow-x-auto" role="tablist" aria-label="Filter conversations">
              {(["waiting", "open", "closed", "all"] as Filter[]).map((f) => (
                <button
                  key={f}
                  type="button"
                  role="tab"
                  aria-selected={filter === f}
                  onClick={() => (filter === f ? loadList() : setFilter(f))}
                  className="min-h-9 cursor-pointer whitespace-nowrap rounded-full px-3 text-[0.8125rem] font-semibold capitalize text-muted aria-selected:bg-ink aria-selected:text-white"
                >
                  {f} <span className="opacity-70 tabular-nums">{counts[f]}</span>
                </button>
              ))}
            </div>
          </div>
          <ul className="min-h-0 flex-1 overflow-y-auto">
            {list === null &&
              Array.from({ length: 6 }, (_, i) => (
                <li key={i} className="border-b border-line px-5 py-4">
                  <span className="block h-4 w-1/2 animate-pulse rounded bg-photo" />
                  <span className="mt-2 block h-3 w-4/5 animate-pulse rounded bg-bg" />
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
              return (
                <li key={c.id}>
                  <button
                    type="button"
                    onClick={() => choose(c.id)}
                    aria-current={active ? "true" : undefined}
                    className={`grid w-full cursor-pointer gap-1 border-b border-l-[3px] border-b-line px-5 py-3.5 text-left transition-colors duration-150 ${
                      active ? "border-l-brand bg-bg" : "border-l-transparent hover:bg-bg/60"
                    } ${fresh.has(c.id) ? "flash" : ""}`}
                  >
                    <span className="flex items-center gap-2">
                      {unread && <span className="size-2 shrink-0 rounded-full bg-brand" aria-label="Unread" />}
                      <span className={`min-w-0 flex-1 truncate ${unread ? "font-bold" : "font-semibold"}`}>{c.visitor_name}</span>
                      {c.demo && <DemoTag />}
                      <time className="text-[0.75rem] text-muted tabular-nums">{ago(c.last_message_at, now)}</time>
                    </span>
                    <span className={`truncate text-[0.875rem] ${unread ? "text-ink" : "text-muted"}`}>
                      {c.last_message?.sender === "admin" && "You: "}
                      {c.last_message?.body ?? "…"}
                    </span>
                    {w && (
                      <span className={`chip w-fit ${now - new Date(w).getTime() > 300_000 ? "bg-warn/12 text-warn" : "bg-bg text-muted"}`}>
                        Waiting {ago(w, now)}
                      </span>
                    )}
                  </button>
                </li>
              );
            })}
          </ul>
        </section>

        {/* ---- thread ---- */}
        <section className={`min-h-0 flex-col bg-bg ${selected ? "flex" : "hidden lg:flex"}`} aria-label="Conversation">
          {!selected || !detail ? (
            <div className="grid flex-1 place-items-center p-8">
              <EmptyState title="Pick a conversation" text="Replies go straight to the visitor's chat window on the website, in real time." />
            </div>
          ) : (
            <>
              <header className="flex items-center gap-3 border-b border-line bg-surface px-5 py-3">
                <button type="button" onClick={() => choose(null)} className="grid size-10 cursor-pointer place-items-center rounded-full hover:bg-bg lg:hidden" aria-label="Back to conversations">
                  ←
                </button>
                <div className="min-w-0 flex-1">
                  <h2 className="truncate font-display text-lg font-bold [font-stretch:110%]">{detail.visitor_name}</h2>
                  <p className="truncate text-[0.8125rem] text-muted">
                    {detail.visitor_contact || "No phone or email given"} · {detail.status === "open" ? "Open" : "Closed"}
                  </p>
                </div>
                <button type="button" className="btn btn-secondary min-h-10 px-4 text-[0.875rem]" onClick={() => action("close", detail.status === "open" ? "Chat closed" : "Chat reopened")}>
                  {detail.status === "open" ? "Close" : "Reopen"}
                </button>
              </header>

              <div ref={threadRef} className="min-h-0 flex-1 overflow-y-auto px-5 py-6" role="log" aria-live="polite">
                <p className="mb-4 text-center text-[0.75rem] text-muted">
                  Started {new Date(detail.created_at).toLocaleString([], { dateStyle: "medium", timeStyle: "short" })}
                  {detail.page_url && ` on ${detail.page_url}`}
                </p>
                {detail.messages.map((m, i) => {
                  const mine = m.sender === "admin";
                  const grouped = detail.messages[i - 1]?.sender === m.sender;
                  return (
                    <div key={m.id} className={`flex flex-col ${mine ? "items-end" : "items-start"} ${grouped ? "mt-1" : "mt-4"}`}>
                      <p className={`m-0 max-w-[70%] whitespace-pre-wrap break-words px-4 py-2.5 text-[0.9375rem] leading-snug ${mine ? "rounded-[18px] rounded-br-[6px] bg-brand text-white" : "rounded-[18px] rounded-bl-[6px] border border-line bg-surface"}`}>
                        {m.body}
                      </p>
                      <time className="mt-1 px-1 text-[0.6875rem] text-muted">{new Date(m.created_at).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}</time>
                    </div>
                  );
                })}
                {isTyping && (
                  <div className="mt-3 flex w-fit items-center gap-1 rounded-[18px] rounded-bl-[6px] border border-line bg-surface px-4 py-3" aria-label={`${detail.visitor_name} is typing`}>
                    <span className="typing-dot" />
                    <span className="typing-dot [animation-delay:150ms]" />
                    <span className="typing-dot [animation-delay:300ms]" />
                  </div>
                )}
              </div>

              <div className="border-t border-line bg-surface p-3">
                {replies.length > 0 && (
                  <div className="mb-2 flex gap-1.5 overflow-x-auto pb-1" aria-label="Quick replies">
                    {replies.map((r) => (
                      <button
                        key={r.id}
                        type="button"
                        title={r.text}
                        onClick={() => {
                          setDraft(r.text);
                          draftRef.current?.focus();
                        }}
                        className="shrink-0 cursor-pointer rounded-full border-[1.5px] border-line px-3 py-1 text-[0.8125rem] font-semibold hover:border-brand hover:text-brand"
                      >
                        {r.label}
                      </button>
                    ))}
                  </div>
                )}
                <form
                  className="flex items-end gap-2"
                  onSubmit={(e) => {
                    e.preventDefault();
                    sendReply();
                  }}
                >
                  <label htmlFor="reply" className="sr-only">
                    Reply to {detail.visitor_name}
                  </label>
                  <textarea
                    id="reply"
                    ref={draftRef}
                    rows={1}
                    value={draft}
                    onChange={(e) => onDraft(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" && !e.shiftKey) {
                        e.preventDefault();
                        sendReply();
                      }
                    }}
                    placeholder={`Reply to ${detail.visitor_name.split(" ")[0]}… (Enter to send)`}
                    className="admin-input max-h-40 resize-none [field-sizing:content]"
                  />
                  <button type="submit" className="btn min-h-11 px-5" disabled={!draft.trim()}>
                    Send
                  </button>
                </form>
              </div>
            </>
          )}
        </section>

        {/* ---- customer details ---- */}
        {detail && selected && (
          <aside className="hidden min-h-0 overflow-y-auto border-l border-line bg-surface p-5 xl:block" aria-label="Customer details">
            <h2 className="font-display text-base font-bold [font-stretch:110%]">Customer</h2>
            <dl className="mt-4 grid gap-3 text-[0.875rem]">
              <Info label="Name" value={detail.visitor_name} />
              <Info label="Phone / email" value={detail.visitor_contact || "Not given yet"} />
              <Info label="Started on" value={detail.page_url || "–"} />
              <Info
                label="First reply"
                value={detail.first_admin_reply_at ? `${Math.max(1, Math.round((new Date(detail.first_admin_reply_at).getTime() - new Date(detail.created_at).getTime()) / 60000))} min after they wrote` : "Not replied yet"}
              />
            </dl>
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
    </div>
  );
}

function Info({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <dt className="text-[0.75rem] font-semibold uppercase tracking-wide text-muted">{label}</dt>
      <dd className="mt-0.5 break-words">{value}</dd>
    </div>
  );
}
