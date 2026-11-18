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
};

const fmtMin = (m: number | null) =>
  m === null
    ? "–"
    : m < 60
      ? `${Math.round(m)} min`
      : `${(m / 60).toFixed(1)} h`;

export default function Overview() {
  const { user } = useAdmin();
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
            value={s ? fmtMin(s.response_week) : undefined}
            prev={s?.response_prev ?? undefined}
            current={s?.response_week ?? undefined}
            lowerIsBetter
            prevLabel={s ? `${fmtMin(s.response_prev)} last week` : undefined}
          />
          <Kpi
            label="Open chats"
            value={s?.open_chats}
            href="/admin/inbox"
            note="in the inbox"
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
}: {
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
        <p className="text-[0.8125rem] font-semibold text-muted">{label}</p>
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
