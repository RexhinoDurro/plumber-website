"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useAdmin, useAdminEvents } from "@/components/admin/AdminShell";
import { DemoTag, EmptyState, PageTitle } from "@/components/admin/ui";
import { ago, api, contactLinks, errorText, money, STATUSES, type Lead, type LeadStatus } from "@/components/admin/client";
import { PaymentDrawer } from "@/components/admin/PaymentDrawer";
import { site } from "@/content/site";

const LIMIT = 500;

const statusStyle: Record<LeadStatus, string> = {
  new: "bg-brand/10 text-brand",
  contacted: "bg-sky/25 text-water",
  quoted: "bg-warn/12 text-warn",
  booked: "bg-ok/12 text-ok",
  lost: "bg-line/60 text-muted",
};

export default function LeadsPage() {
  const { toast, refreshCounts } = useAdmin();
  const [leads, setLeads] = useState<Lead[] | null>(null);
  const [tab, setTab] = useState<LeadStatus | "all">("all");
  const [q, setQ] = useState("");
  const [open, setOpen] = useState<number | null>(null);
  const [fresh, setFresh] = useState<Set<number>>(new Set());
  const [now, setNow] = useState(() => Date.now());

  const [query, setQuery] = useState("");
  const [serverCounts, setServerCounts] = useState<Record<string, number> | null>(null);
  const reqId = useRef(0);

  useEffect(() => {
    const t = setTimeout(() => setQuery(q.trim()), 250);
    return () => clearTimeout(t);
  }, [q]);

  // The server does the searching and stage filtering, so it works with any number of leads.
  const load = useCallback(() => {
    const id = ++reqId.current;
    const p = new URLSearchParams({ limit: String(LIMIT) });
    if (tab !== "all") p.set("status", tab);
    if (query) p.set("q", query);
    api<Lead[]>(`/api/admin/leads/?${p}`)
      .then((l) => id === reqId.current && setLeads(l))
      .catch(() => setLeads((l) => l ?? []));
    api<Record<string, number>>(`/api/admin/leads/counts/${query ? `?q=${encodeURIComponent(query)}` : ""}`)
      .then((c) => id === reqId.current && setServerCounts(c))
      .catch(() => {});
  }, [tab, query]);

  useEffect(() => {
    load();
  }, [load]);

  useEffect(() => {
    const pick = () => {
      const id = Number(location.hash.slice(1));
      setOpen(Number.isFinite(id) && id > 0 ? id : null);
    };
    pick();
    window.addEventListener("hashchange", pick);
    const t = setInterval(() => setNow(Date.now()), 20_000);
    return () => {
      window.removeEventListener("hashchange", pick);
      clearInterval(t);
    };
  }, []);

  useAdminEvents((e) => {
    if (e.type === "lead_new") {
      const l = e.lead as Lead;
      setLeads((list) => (list ? [l, ...list.filter((x) => x.id !== l.id)] : list));
      setFresh((f) => new Set(f).add(l.id));
      setServerCounts((c) => c && { ...c, all: c.all + 1, [l.status]: (c[l.status] ?? 0) + 1 });
    }
    if (e.type === "lead_updated") {
      const l = e.lead as Lead;
      setLeads((list) => list?.map((x) => (x.id === l.id ? l : x)) ?? list);
    }
  });

  const counts = serverCounts ?? {};

  const visible = (leads ?? []).filter((l) => {
    if (tab !== "all" && l.status !== tab) return false;
    if (!q) return true;
    const hay = `${l.name} ${l.phone} ${l.email} ${l.postcode} ${l.job} ${l.message}`.toLowerCase();
    return hay.includes(q.toLowerCase());
  });

  // A link to an older lead (#id) that isn't in the newest page: fetch it on its own.
  const [single, setSingle] = useState<Lead | null>(null);
  const inList = leads?.some((l) => l.id === open) ?? false;
  useEffect(() => {
    if (open && leads && !inList)
      api<Lead>(`/api/admin/leads/${open}/`)
        .then(setSingle)
        .catch(() => setSingle(null));
  }, [open, leads, inList]);
  const current = leads?.find((l) => l.id === open) ?? (single?.id === open ? single : null);

  const update = async (id: number, patch: Partial<Lead>, msg?: string) => {
    const before = leads;
    setLeads((list) => list?.map((x) => (x.id === id ? { ...x, ...patch } : x)) ?? list);
    try {
      const l = await api<Lead>(`/api/admin/leads/${id}/`, { method: "PATCH", body: JSON.stringify(patch) });
      setLeads((list) => list?.map((x) => (x.id === id ? l : x)) ?? list);
      setSingle((x) => (x?.id === id ? l : x));
      if (msg) toast({ title: msg, tone: "ok" });
      refreshCounts();
      if (patch.status) api<Record<string, number>>(`/api/admin/leads/counts/${query ? `?q=${encodeURIComponent(query)}` : ""}`).then(setServerCounts).catch(() => {});
    } catch (e) {
      setLeads(before);
      toast({ title: "Couldn't save", body: errorText(e), tone: "error" });
    }
  };

  const remove = async (id: number) => {
    try {
      await api(`/api/admin/leads/${id}/`, { method: "DELETE" });
      setLeads((list) => list?.filter((x) => x.id !== id) ?? list);
      load();
      choose(null);
      toast({ title: "Lead deleted", tone: "ok" });
      refreshCounts();
    } catch (e) {
      toast({ title: "Couldn't delete", body: errorText(e), tone: "error" });
    }
  };

  const choose = (id: number | null) => {
    history.replaceState(null, "", id ? `#${id}` : location.pathname);
    setOpen(id);
    if (id) setFresh((f) => (f.has(id) ? new Set([...f].filter((x) => x !== id)) : f));
  };

  return (
    <div className="grid grid-cols-[minmax(0,1fr)] gap-6">
      <PageTitle title="Leads" sub="Every quote request, callback and chat you've added. Move each one along as you go.">
        <label className="relative">
          <span className="sr-only">Search leads</span>
          <input
            type="search"
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Search name, phone, area…"
            className="admin-input w-[min(280px,80vw)] pl-9"
          />
          <svg viewBox="0 0 24 24" className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
            <circle cx="11" cy="11" r="7" />
            <path d="m20 20-3.5-3.5" strokeLinecap="round" />
          </svg>
        </label>
      </PageTitle>

      <div className="flex gap-1 overflow-x-auto border-b border-line" role="tablist" aria-label="Filter by stage">
        {[{ key: "all" as const, label: "All" }, ...STATUSES].map((s) => (
          <button
            key={s.key}
            type="button"
            role="tab"
            aria-selected={tab === s.key}
            onClick={() => setTab(s.key)}
            className="-mb-px min-h-11 cursor-pointer whitespace-nowrap border-b-2 border-transparent px-4 text-[0.9375rem] font-semibold text-muted aria-selected:border-brand aria-selected:text-ink"
          >
            {s.label} <span className="ml-1 rounded-full bg-bg px-2 py-0.5 text-[0.75rem] tabular-nums">{counts[s.key] ?? 0}</span>
          </button>
        ))}
      </div>

      {leads !== null && serverCounts?.all === 0 && !query ? (
        <EmptyState title="No leads yet" text="Quote requests from the website arrive here instantly, with a sound and a desktop alert if you turn them on." />
      ) : (
        <div className="admin-card overflow-x-auto">
          <table className="w-full min-w-[760px] border-collapse text-left text-[0.9375rem]">
            <thead>
              <tr className="border-b border-line text-[0.75rem] uppercase tracking-wide text-muted">
                <th scope="col" className="px-5 py-3 font-semibold">Customer</th>
                <th scope="col" className="px-3 py-3 font-semibold">Job</th>
                <th scope="col" className="px-3 py-3 font-semibold">From</th>
                <th scope="col" className="px-3 py-3 text-right font-semibold">Received</th>
                <th scope="col" className="px-5 py-3 font-semibold">Stage</th>
              </tr>
            </thead>
            <tbody>
              {leads === null &&
                Array.from({ length: 6 }, (_, i) => (
                  <tr key={i} className="border-b border-line">
                    <td colSpan={5} className="px-5 py-4">
                      <span className="block h-4 w-2/3 animate-pulse rounded bg-bg" />
                    </td>
                  </tr>
                ))}
              {visible.map((l) => {
                const waitMin = (now - new Date(l.created_at).getTime()) / 60000;
                return (
                  <tr
                    key={l.id}
                    onClick={() => choose(l.id)}
                    className={`cursor-pointer border-b border-line last:border-0 hover:bg-bg/70 ${open === l.id ? "bg-bg" : ""} ${fresh.has(l.id) ? "flash" : ""}`}
                  >
                    <td className="px-5 py-3">
                      <button type="button" className="cursor-pointer text-left" onClick={(e) => (e.stopPropagation(), choose(l.id))}>
                        <span className="flex items-center gap-2 font-semibold">
                          {l.name} {l.urgent && <span className="chip bg-danger/10 text-danger">Urgent</span>} {l.demo && <DemoTag />}
                        </span>
                        <span className="block text-[0.8125rem] text-muted tabular-nums">{l.phone || l.email}</span>
                      </button>
                    </td>
                    <td className="max-w-[260px] px-3 py-3">
                      <span className="block truncate">{l.job || "–"}</span>
                      <span className="block truncate text-[0.8125rem] text-muted">{l.postcode}</span>
                    </td>
                    <td className="px-3 py-3 text-muted">{l.source_label}</td>
                    <td className="px-3 py-3 text-right tabular-nums">
                      {l.status === "new" ? (
                        <span className={`font-semibold ${waitMin > 5 ? "text-warn" : "text-ink"}`}>waiting {ago(l.created_at, now)}</span>
                      ) : (
                        <span className="text-muted">{ago(l.created_at, now)} ago</span>
                      )}
                    </td>
                    <td className="px-5 py-3">
                      <span className="flex flex-wrap items-center gap-1.5">
                        <span className={`chip ${statusStyle[l.status]}`}>{STATUSES.find((s) => s.key === l.status)?.label}</span>
                        {l.paid_total && <span className="chip border border-ok/40 text-ok">Paid {money(l.paid_total)}</span>}
                      </span>
                    </td>
                  </tr>
                );
              })}
              {leads !== null && visible.length === 0 && (
                <tr>
                  <td colSpan={5} className="px-5 py-12 text-center text-muted">
                    No leads match{q ? ` “${q}”` : ""} in {tab === "all" ? "any stage" : STATUSES.find((s) => s.key === tab)?.label}.{" "}
                    <button type="button" className="cursor-pointer font-semibold text-water underline" onClick={() => (setQ(""), setTab("all"))}>
                      Clear filters
                    </button>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}

      {leads !== null && (counts[tab] ?? 0) > leads.length && (
        <p className="text-center text-[0.9375rem] text-muted">
          Showing the newest {leads.length} of {counts[tab]}. Search by name, phone, email or ZIP code to find older ones.
        </p>
      )}

      {current && <LeadDrawer key={current.id} lead={current} now={now} onClose={() => choose(null)} onUpdate={update} onDelete={remove} onPaid={load} />}
    </div>
  );
}

function LeadDrawer({
  lead,
  now,
  onClose,
  onUpdate,
  onDelete,
  onPaid,
}: {
  lead: Lead;
  now: number;
  onClose: () => void;
  onUpdate: (id: number, patch: Partial<Lead>, msg?: string) => void;
  onDelete: (id: number) => void;
  onPaid: () => void;
}) {
  const [notes, setNotes] = useState(lead.notes);
  const [paying, setPaying] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const stage = STATUSES.findIndex((s) => s.key === lead.status);

  useEffect(() => {
    ref.current?.focus();
  }, []);

  const respMin = lead.first_contacted_at ? Math.round((new Date(lead.first_contacted_at).getTime() - new Date(lead.created_at).getTime()) / 60000) : null;

  return (
    <>
      <div className="fixed inset-0 z-40 bg-ink/30" onClick={onClose} aria-hidden="true" />
      <div
        ref={ref}
        tabIndex={-1}
        role="dialog"
        aria-label={`Lead: ${lead.name}`}
        onKeyDown={(e) => e.key === "Escape" && !paying && onClose()}
        className="drawer fixed inset-y-0 right-0 z-50 flex w-[min(460px,100vw)] flex-col bg-surface shadow-lift outline-none"
      >
        <header className="flex items-start gap-3 border-b border-line p-6">
          <div className="min-w-0 flex-1">
            <p className="text-[0.8125rem] text-muted">
              {lead.source_label} · {new Date(lead.created_at).toLocaleString([], { dateStyle: "medium", timeStyle: "short" })}
            </p>
            <h2 className="mt-1 flex flex-wrap items-center gap-2 font-display text-2xl font-bold [font-stretch:110%]">
              {lead.name} {lead.urgent && <span className="chip bg-danger/10 text-danger">Urgent</span>} {lead.demo && <DemoTag />}
            </h2>
          </div>
          <button type="button" onClick={onClose} className="grid size-10 cursor-pointer place-items-center rounded-full hover:bg-bg" aria-label="Close">
            ✕
          </button>
        </header>

        <div className="flex-1 overflow-y-auto p-6">
          <div className="grid grid-cols-2 gap-2">
            {lead.phone && (
              <a href={`tel:${lead.phone.replace(/\s/g, "")}`} className="btn min-h-11 text-[0.9375rem]" onClick={() => lead.status === "new" && onUpdate(lead.id, { status: "contacted" })}>
                Call {lead.phone}
              </a>
            )}
            {lead.email && (
              <a href={`mailto:${lead.email}`} className="btn btn-secondary min-h-11 text-[0.9375rem]">
                Email
              </a>
            )}
          </div>

          <h3 className="mb-3 mt-7 text-[0.75rem] font-semibold uppercase tracking-wide text-muted">Stage</h3>
          <ol className="grid grid-cols-5 gap-1" aria-label="Move to stage">
            {STATUSES.map((s, i) => (
              <li key={s.key}>
                <button
                  type="button"
                  aria-pressed={lead.status === s.key}
                  onClick={() => onUpdate(lead.id, { status: s.key }, `Moved to ${s.label}`)}
                  className={`grid min-h-11 w-full cursor-pointer place-items-center rounded-sm text-[0.8125rem] font-semibold transition-colors ${
                    lead.status === s.key ? "bg-ink text-white" : i < stage && lead.status !== "lost" ? "bg-brand/12 text-brand" : "bg-bg text-muted hover:text-ink"
                  }`}
                >
                  {s.label}
                </button>
              </li>
            ))}
          </ol>
          <p className="mt-2 text-[0.8125rem] text-muted">
            {lead.status === "new" ? `Waiting ${ago(lead.created_at, now)} for a first answer.` : respMin !== null ? `First answered ${respMin < 1 ? "in under a minute" : `after ${respMin} min`}.` : ""}
          </p>

          <dl className="mt-7 grid gap-4 text-[0.9375rem]">
            <Row label="Job" value={lead.job || "Not said"} />
            <Row label="Area / ZIP code" value={lead.postcode || "Not given"} />
            <Row label="Message" value={lead.message || "No message"} />
          </dl>

          <section className="mt-7 flex flex-wrap items-center justify-between gap-3 rounded-md border border-line p-4" aria-label="Payment">
            <div>
              <h3 className="text-[0.75rem] font-semibold uppercase tracking-wide text-muted">Payment</h3>
              <p className="mt-1 text-[0.9375rem]">
                {lead.paid_total ? (
                  <>
                    Paid <b>{money(lead.paid_total, "USD", true)}</b> ·{" "}
                    <a href={`/admin/customers`} className="text-water">
                      see in Paid customers
                    </a>
                  </>
                ) : (
                  <span className="text-muted">Not paid yet</span>
                )}
              </p>
            </div>
            <button type="button" className={`btn ${lead.paid_total ? "btn-secondary" : ""} min-h-11 px-4 text-[0.9375rem]`} onClick={() => setPaying(true)}>
              {lead.paid_total ? "Add payment" : "Record payment"}
            </button>
          </section>
          {paying && <PaymentDrawer lead={lead} onClose={() => setPaying(false)} onSaved={() => (setPaying(false), onPaid())} />}

          {lead.status === "booked" && <ReviewRequest lead={lead} onSent={() => onUpdate(lead.id, { review_requested_at: new Date().toISOString() }, "Marked as asked for a review")} />}

          <label className="mt-7 grid gap-2">
            <span className="text-[0.75rem] font-semibold uppercase tracking-wide text-muted">Notes</span>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              onBlur={() => notes !== lead.notes && onUpdate(lead.id, { notes }, "Notes saved")}
              rows={6}
              placeholder="Price quoted, visit date, parts needed… Saves when you click away."
              className="admin-input resize-y"
            />
          </label>
        </div>

        <footer className="flex items-center justify-between border-t border-line p-4">
          {confirmDelete ? (
            <span className="flex items-center gap-2 text-[0.875rem]">
              Delete for good?
              <button type="button" className="btn min-h-10 bg-danger px-4 text-[0.875rem] hover:bg-danger" onClick={() => onDelete(lead.id)}>
                Delete
              </button>
              <button type="button" className="btn btn-secondary min-h-10 px-4 text-[0.875rem]" onClick={() => setConfirmDelete(false)}>
                Keep
              </button>
            </span>
          ) : (
            <button type="button" className="cursor-pointer text-[0.875rem] text-muted underline underline-offset-4 hover:text-danger" onClick={() => setConfirmDelete(true)}>
              Delete lead
            </button>
          )}
        </footer>
      </div>
    </>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <dt className="text-[0.75rem] font-semibold uppercase tracking-wide text-muted">{label}</dt>
      <dd className="mt-1 whitespace-pre-wrap">{value}</dd>
    </div>
  );
}

/**
 * After a booked job: ask for a Google review. Sends through the chat when there is one,
 * otherwise opens the phone's own SMS / WhatsApp / email app with the message ready.
 */
function ReviewRequest({ lead, onSent }: { lead: Lead; onSent: () => void }) {
  const { send, toast } = useAdmin();
  const first = lead.name.split(" ")[0];
  const [text, setText] = useState(
    `Hi ${first}, thanks for choosing ${site.name}. If you were happy with the job, a quick Google review would really help us: ${site.reviewsUrl}`,
  );
  const contact = lead.phone || lead.email;
  const links = contact ? contactLinks(contact, text) : null;
  const done = Boolean(lead.review_requested_at);

  const viaChat = () => {
    if (!lead.conversation) return;
    send({ type: "message", conversation: lead.conversation, body: text });
    toast({ title: "Review request sent in the chat", tone: "ok" });
    onSent();
  };

  return (
    <section className="mt-7 grid gap-3 rounded-md border-[1.5px] border-ok/40 bg-ok/5 p-4" aria-labelledby="review-req">
      <div className="flex items-center justify-between gap-3">
        <h3 id="review-req" className="font-semibold">Ask for a Google review</h3>
        {done && <span className="chip bg-ok/15 text-ok">Asked {ago(lead.review_requested_at!)} ago</span>}
      </div>
      <p className="text-[0.875rem] text-muted">Customers are most likely to leave one within a day of the job. Edit the message if you like.</p>
      <label className="sr-only" htmlFor="review-text">
        Message
      </label>
      <textarea id="review-text" rows={4} value={text} onChange={(e) => setText(e.target.value)} className="admin-input resize-y text-[0.875rem]" />
      <div className="flex flex-wrap gap-2">
        {lead.conversation && (
          <button type="button" className="btn min-h-10 px-4 text-[0.875rem]" onClick={viaChat}>
            Send in the chat
          </button>
        )}
        {links?.isPhone && (
          <>
            <a href={contactLinks(lead.phone, text).whatsapp} target="_blank" rel="noopener" onClick={onSent} className="btn btn-secondary min-h-10 px-4 text-[0.875rem]">
              WhatsApp
            </a>
            <a href={contactLinks(lead.phone, text).sms} onClick={onSent} className="btn btn-secondary min-h-10 px-4 text-[0.875rem]">
              Text
            </a>
          </>
        )}
        {lead.email && (
          <a href={`mailto:${lead.email}?subject=${encodeURIComponent(`Thank you from ${site.name}`)}&body=${encodeURIComponent(text)}`} onClick={onSent} className="btn btn-secondary min-h-10 px-4 text-[0.875rem]">
            Email
          </a>
        )}
        {!contact && !lead.conversation && <span className="text-[0.875rem] text-muted">Add a phone or email to send it.</span>}
      </div>
    </section>
  );
}
