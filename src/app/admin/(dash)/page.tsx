"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { useAdmin, useAdminEvents } from "@/components/admin/AdminShell";
import {
  DemoBanner,
  PageTitle,
  Panel,
  Delta,
  EmptyState,
} from "@/components/admin/ui";
import { RequestsChart } from "@/components/admin/RequestsChart";
import { ago, api, STATUSES } from "@/components/admin/client";

type Stats = {
  waiting: {
    type: "lead" | "chat";
    id: string | number;
    name: string;
    detail: string;
    since: string;
    urgent: boolean;
  }[];
  waiting_count: number;
  oldest_waiting_since: string | null;
  requests_week: number;
  requests_prev: number;
  booked_week: number;
  booked_prev: number;
  response_week: number | null;
  response_prev: number | null;
  open_chats: number;
  gallery_items: number;
  reviews_published: number;
  pipeline: Record<string, number>;
  days: { date: string; leads: number; chats: number }[];
  activity: {
    type: string;
    id: string | number;
    title: string;
    detail: string;
    at: string;
  }[];
  demo_records: number;
  chat_reply_seconds: number | null;
  chat_reply_seconds_prev: number | null;
  heatmap: number[][];
  insights: { tone: "ok" | "warn" | "info"; text: string }[];
};

const fmtSecs = (v: number | null) => (v === null ? "–" : v < 90 ? `${v} s` : `${Math.round(v / 60)} min`);
const fmtMin = (m: number | null) =>
  m === null
    ? "–"
    : m < 60
      ? `${Math.round(m)} min`
      : `${(m / 60).toFixed(1)} h`;

export default function Overview() {
  const { user, push, togglePush } = useAdmin();
  const [s, setS] = useState<Stats | null>(null);
  const [error, setError] = useState(false);
  const [now, setNow] = useState(() => Date.now());

  const load = useCallback(() => {
    api<Stats>("/api/admin/stats/")
      .then((d) => {
        setS(d);
        setError(false);
      })
      .catch(() => setError(true));
  }, []);

  useEffect(() => {
    load();
    const t = setInterval(() => setNow(Date.now()), 30_000);
    return () => clearInterval(t);
  }, [load]);

  // Any lead or chat event changes these numbers: refetch (debounced by the event burst).
  useAdminEvents((e) => {
    if (
      ["lead_new", "lead_updated", "conversation_new", "message"].includes(
        e.type,
      )
    )
      load();
  });

  const hour = new Date(now).getHours();
  const greeting =
    hour < 12 ? "Good morning" : hour < 18 ? "Good afternoon" : "Good evening";

  if (error && !s) {
    return (
      <EmptyState
        title="Can't load the numbers"
        text="The backend isn't answering. Check it's running, then try again."
      >
        <button type="button" className="btn" onClick={load}>
          Try again
        </button>
      </EmptyState>
    );
  }

  const waitingMin = s?.oldest_waiting_since
    ? (now - new Date(s.oldest_waiting_since).getTime()) / 60000
    : 0;
  const overdue = waitingMin > 5;
  const totalLeads = s
    ? Object.values(s.pipeline).reduce((a, b) => a + b, 0)
    : 0;

  return (
    <div className="grid grid-cols-[minmax(0,1fr)] gap-6">
      <PageTitle
        title={`${greeting}, ${user.name.split(" ")[0]}.`}
        sub={new Date(now).toLocaleDateString([], {
          weekday: "long",
          day: "numeric",
          month: "long",
        })}
      />
      {s && s.demo_records > 0 && (
        <DemoBanner count={s.demo_records} onCleared={load} />
      )}
      {push === false && <PushPrompt onEnable={() => togglePush(true)} />}

      {/* The one number that matters first: who is still waiting for an answer. */}
      <section
        className="grid grid-cols-[minmax(0,1fr)] gap-6 lg:grid-cols-[1.25fr_1fr]"
        aria-label="Waiting for a reply"
      >
        <div
          className={`admin-card grid grid-cols-[minmax(0,1fr)] content-between gap-6 p-6 md:p-8 ${overdue ? "ring-2 ring-warn/50" : ""}`}
        >
          <div>
            <p className="text-[0.875rem] font-semibold text-muted">
              Waiting for a reply
            </p>
            {s ? (
              <p className="mt-2 flex items-baseline gap-4">
                <span className="font-display text-[clamp(3.5rem,6vw,5rem)] font-bold leading-none tabular-nums [font-stretch:110%]">
                  {s.waiting_count}
                </span>
                <span
                  className={`text-[0.9375rem] font-semibold ${s.waiting_count === 0 ? "text-ok" : overdue ? "text-warn" : "text-muted"}`}
                >
                  {s.waiting_count === 0
                    ? "✓ Everyone has an answer"
                    : `${overdue ? "⚠ " : ""}oldest has waited ${ago(s.oldest_waiting_since!, now)}`}
                </span>
              </p>
            ) : (
              <span className="mt-3 block h-16 w-24 animate-pulse rounded-sm bg-photo" />
            )}
            <p className="mt-3 max-w-[52ch] text-[0.9375rem] text-muted">
              Most customers book whoever answers first. Aim to reply to every
              new request within 5 minutes.
            </p>
          </div>
          {s && s.waiting.length > 0 && (
            <ul className="grid grid-cols-[minmax(0,1fr)] divide-y divide-line border-t border-line">
              {s.waiting.map((w) => {
                const mins = (now - new Date(w.since).getTime()) / 60000;
                return (
                  <li key={`${w.type}-${w.id}`}>
                    <Link
                      href={
                        w.type === "chat"
                          ? `/admin/inbox#${w.id}`
                          : `/admin/leads#${w.id}`
                      }
                      className="flex items-center gap-3 py-3 text-ink no-underline hover:bg-bg"
                    >
                      <span className="chip bg-bg text-muted">
                        {w.type === "chat" ? "Chat" : "Form"}
                      </span>
                      <span className="min-w-0 flex-1 truncate">
                        <b className="font-semibold">{w.name}</b>
                        <span className="text-muted"> · {w.detail}</span>
                      </span>
                      {w.urgent && (
                        <span className="chip bg-danger/10 text-danger">
                          Urgent
                        </span>
                      )}
                      <span
                        className={`w-16 text-right text-[0.875rem] font-semibold tabular-nums ${mins > 5 ? "text-warn" : "text-muted"}`}
                      >
                        {ago(w.since, now)}
                      </span>
                    </Link>
                  </li>
                );
              })}
            </ul>
          )}
        </div>

        <div className="grid grid-cols-2 gap-4">
          <Kpi
            label="New requests, 7 days"
            value={s?.requests_week}
            prev={s?.requests_prev}
          />
          <Kpi
            label="Jobs booked, 7 days"
            value={s?.booked_week}
            prev={s?.booked_prev}
          />
          <Kpi
            label="Average first reply"
            tip="Time from a new request or chat to your first answer (or moving the lead out of New). Automatic replies don't count."
            value={s ? fmtMin(s.response_week) : undefined}
            prev={s?.response_prev ?? undefined}
            current={s?.response_week ?? undefined}
            lowerIsBetter
            prevLabel={s ? `${fmtMin(s.response_prev)} last week` : undefined}
          />
          <Kpi
            label="Chat reply speed"
            tip="Median time from a visitor's first chat message to your first real reply, this week. People expect under a minute."
            value={s ? fmtSecs(s.chat_reply_seconds) : undefined}
            prev={s?.chat_reply_seconds_prev ?? undefined}
            current={s?.chat_reply_seconds ?? undefined}
            lowerIsBetter
            prevLabel={s ? (s.chat_reply_seconds !== null && s.chat_reply_seconds <= 60 ? "inside the 1-minute goal" : "goal: under 1 min") : undefined}
            href="/admin/inbox"
          />
        </div>
      </section>

      <section className="grid grid-cols-[minmax(0,1fr)] gap-6 lg:grid-cols-[1.6fr_1fr]">
        <Panel title="Requests per day" sub="Forms and chats, last 14 days">
          {s ? (
            <RequestsChart days={s.days} />
          ) : (
            <div className="h-56 animate-pulse rounded-sm bg-bg" />
          )}
          {s && s.insights.length > 0 && <Insights items={s.insights} />}
        </Panel>

        <Panel
          title="Pipeline"
          sub={`${totalLeads} leads in total`}
          action={
            <Link
              href="/admin/leads"
              className="text-[0.875rem] font-semibold text-water"
            >
              Open leads
            </Link>
          }
        >
          <ul className="grid gap-3">
            {STATUSES.map((st) => {
              const n = s?.pipeline[st.key] ?? 0;
              const pct = totalLeads ? (n / totalLeads) * 100 : 0;
              return (
                <li
                  key={st.key}
                  className="grid grid-cols-[88px_1fr_36px] items-center gap-3 text-[0.9375rem]"
                >
                  <span className="text-muted">{st.label}</span>
                  <span className="h-2.5 overflow-hidden rounded-full bg-bg">
                    <span
                      className="block h-full rounded-full bg-brand transition-[width] duration-500 ease-out-soft"
                      style={{ width: `${pct}%` }}
                    />
                  </span>
                  <b className="text-right font-semibold tabular-nums">{n}</b>
                </li>
              );
            })}
          </ul>
          {s && totalLeads > 0 && (
            <p className="mt-5 border-t border-line pt-4 text-[0.875rem] text-muted">
              <b className="text-ink">
                {Math.round(((s.pipeline.booked ?? 0) / totalLeads) * 100)}%
              </b>{" "}
              of all leads became booked jobs.
            </p>
          )}
        </Panel>
      </section>

      <Panel title="When requests come in" sub="Last 90 days, by day and hour. Darker means busier: be reachable then.">
        {s ? <Heatmap grid={s.heatmap} /> : <div className="h-48 animate-pulse rounded-sm bg-bg" />}
      </Panel>

      <section className="grid grid-cols-[minmax(0,1fr)] gap-6 lg:grid-cols-[1.6fr_1fr]">
        <Panel title="Latest activity">
          {s && s.activity.length === 0 ? (
            <p className="text-muted">
              Nothing yet. New requests and chats appear here the moment they
              arrive.
            </p>
          ) : (
            <ol className="grid grid-cols-[minmax(0,1fr)]">
              {(s?.activity ?? []).map((a) => (
                <li
                  key={`${a.type}-${a.id}-${a.at}`}
                  className="grid grid-cols-[12px_1fr_auto] gap-3 border-b border-line py-3 last:border-0"
                >
                  <span
                    className={`mt-2 size-2 rounded-full ${a.type === "booked" ? "bg-ok" : a.type === "chat" ? "bg-sky" : "bg-brand"}`}
                    aria-hidden="true"
                  />
                  <span className="min-w-0">
                    <span className="block font-medium">{a.title}</span>
                    {a.detail && (
                      <span className="block truncate text-[0.875rem] text-muted">
                        {a.detail}
                      </span>
                    )}
                  </span>
                  <time className="text-[0.8125rem] text-muted tabular-nums">
                    {ago(a.at, now)}
                  </time>
                </li>
              ))}
            </ol>
          )}
        </Panel>
        <Panel title="Website content">
          <dl className="grid gap-4">
            <ContentRow
              label="Photos and videos live"
              value={s?.gallery_items}
              href="/admin/gallery"
              cta="Upload"
            />
            <ContentRow
              label="Reviews on the website"
              value={s?.reviews_published}
              href="/admin/reviews"
              cta="Add"
            />
          </dl>
          {s && s.reviews_published === 0 && (
            <p className="mt-4 rounded-sm bg-bg p-3 text-[0.875rem] text-muted">
              The website still shows placeholder reviews. Add real ones (with
              the customer&apos;s OK) to replace them.
            </p>
          )}
        </Panel>
      </section>
    </div>
  );
}

function Kpi({
  label,
  value,
  prev,
  current,
  lowerIsBetter,
  prevLabel,
  href,
  note,
  tip,
}: {
  tip?: string;
  label: string;
  value?: number | string;
  prev?: number;
  current?: number;
  lowerIsBetter?: boolean;
  prevLabel?: string;
  href?: string;
  note?: string;
}) {
  const body = (
    <div className="grid h-full content-between gap-3">
      <div>
        <p className="flex items-center gap-1.5 text-[0.8125rem] font-semibold text-muted">
          {label}
          {tip && (
            <span className="tip grid size-5 cursor-help place-items-center rounded-full border border-muted/60 text-[0.75rem] font-bold" data-tip={tip} tabIndex={0} aria-label={tip}>
              i
            </span>
          )}
        </p>
        {value === undefined ? (
          <span className="mt-2 block h-9 w-14 animate-pulse rounded-sm bg-photo" />
        ) : (
          <p className="mt-1 font-display text-[2.1rem] font-bold leading-tight tabular-nums [font-stretch:110%]">
            {value}
          </p>
        )}
      </div>
      {prev !== undefined && (
        <Delta
          now={current ?? (typeof value === "number" ? value : 0)}
          prev={prev}
          lowerIsBetter={lowerIsBetter}
          label={prevLabel}
        />
      )}
      {note && <p className="text-[0.8125rem] text-muted">{note}</p>}
    </div>
  );
  return href ? (
    <Link
      href={href}
      className="admin-card lift block p-5 text-ink no-underline"
    >
      {body}
    </Link>
  ) : (
    <div className="admin-card p-5">{body}</div>
  );
}

function ContentRow({
  label,
  value,
  href,
  cta,
}: {
  label: string;
  value?: number;
  href: string;
  cta: string;
}) {
  return (
    <div className="flex items-center justify-between gap-3">
      <dt className="text-muted">{label}</dt>
      <dd className="flex items-center gap-4">
        <b className="font-display text-xl tabular-nums">{value ?? "–"}</b>
        <Link href={href} className="text-[0.875rem] font-semibold text-water">
          {cta}
        </Link>
      </dd>
    </div>
  );
}

function Insights({ items }: { items: { tone: "ok" | "warn" | "info"; text: string }[] }) {
  const icon = { ok: "✓", warn: "!", info: "→" };
  const color = { ok: "bg-ok/12 text-ok", warn: "bg-warn/12 text-warn", info: "bg-brand/10 text-brand" };
  return (
    <div className="mt-6 border-t border-line pt-5">
      <h3 className="mb-3 text-[0.8125rem] font-semibold uppercase tracking-[0.05em] text-muted">What the numbers say</h3>
      <ul className="grid gap-2.5">
        {items.map((i) => (
          <li key={i.text} className="flex gap-3 text-[0.9375rem]">
            <span className={`grid size-6 shrink-0 place-items-center rounded-full text-[0.8125rem] font-bold ${color[i.tone]}`} aria-hidden="true">
              {icon[i.tone]}
            </span>
            <span>{i.text}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}

const DAY_LABELS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

/** 7 × 24 grid of requests by weekday and hour; one blue scale, labelled, with a table for screen readers. */
function Heatmap({ grid }: { grid: number[][] }) {
  const max = Math.max(1, ...grid.flat());
  const total = grid.flat().reduce((a, b) => a + b, 0);
  if (!total) return <p className="text-muted">Not enough requests yet. This fills in as chats and quote requests arrive.</p>;
  const shade = (n: number) => (n === 0 ? "var(--color-bg)" : `color-mix(in oklch, var(--color-brand) ${Math.round(18 + (n / max) * 82)}%, white)`);
  return (
    <div className="-mt-8 overflow-x-auto pt-8">
      <div className="grid min-w-[560px] grid-cols-[40px_repeat(24,minmax(0,1fr))] gap-[3px] text-[0.75rem] text-muted" role="img" aria-label={`Requests by day and hour over 90 days, ${total} in total`}>
        <span />
        {Array.from({ length: 24 }, (_, h) => (
          <span key={h} className="text-center tabular-nums">
            {h % 3 === 0 ? String(h).padStart(2, "0") : ""}
          </span>
        ))}
        {grid.map((row, d) => (
          <div key={d} className="contents">
            <span className="self-center font-semibold">{DAY_LABELS[d]}</span>
            {row.map((n, h) => (
              <span
                key={h}
                className="tip aspect-square min-h-4 rounded-[3px]"
                style={{ background: shade(n) }}
                data-tip={`${DAY_LABELS[d]} ${String(h).padStart(2, "0")}:00–${String(h + 1).padStart(2, "0")}:00 · ${n} ${n === 1 ? "request" : "requests"}`}
                tabIndex={n ? 0 : -1}
              />
            ))}
          </div>
        ))}
      </div>
      <div className="mt-3 flex items-center gap-2 text-[0.75rem] text-muted">
        Fewer
        {[0.25, 0.5, 0.75, 1].map((f) => (
          <span key={f} className="size-3 rounded-[2px]" style={{ background: shade(Math.ceil(f * max)) }} />
        ))}
        More
      </div>
      <div className="sr-only">
        <table>
        <caption>Requests by weekday and hour, last 90 days</caption>
        <tbody>
          {grid.map((row, d) => (
            <tr key={d}>
              <th scope="row">{DAY_LABELS[d]}</th>
              <td>{row.map((n, h) => (n ? `${h}:00 ${n}` : null)).filter(Boolean).join(", ") || "none"}</td>
            </tr>
          ))}
        </tbody>
      </table>
      </div>
    </div>
  );
}

function PushPrompt({ onEnable }: { onEnable: () => void }) {
  return (
    <div className="admin-card flex flex-wrap items-center gap-4 border-l-4 border-brand p-5">
      <span className="grid size-10 place-items-center rounded-full bg-brand/10 text-brand" aria-hidden="true">
        <svg viewBox="0 0 24 24" className="size-5" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M6 16V11a6 6 0 1 1 12 0v5l1.5 2h-15Z" strokeLinejoin="round" />
          <path d="M10 20a2 2 0 0 0 4 0" />
        </svg>
      </span>
      <p className="min-w-[min(100%,240px)] flex-1">
        <b className="block">Get new chats and requests on this device</b>
        <span className="text-[0.9375rem] text-muted">Push alerts arrive even when the dashboard is closed. On iPhone, add it to your Home Screen first.</span>
      </p>
      <button type="button" className="btn w-full sm:w-auto" onClick={onEnable}>
        Turn on alerts
      </button>
    </div>
  );
}
