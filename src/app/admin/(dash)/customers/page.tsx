"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useAdmin } from "@/components/admin/AdminShell";
import {
  DemoBanner,
  DemoTag,
  EmptyState,
  PageTitle,
  Panel,
} from "@/components/admin/ui";
import {
  api,
  download,
  errorText,
  METHODS,
  money,
  type Payment,
  type PaymentPage,
  type PaymentSummary,
} from "@/components/admin/client";
import { PaymentDrawer } from "@/components/admin/PaymentDrawer";

const PAGE = 100;

function monthLabel(ym: string, long = false) {
  const [y, m] = ym.split("-").map(Number);
  return new Date(y, m - 1, 1).toLocaleDateString(
    "en-US",
    long ? { month: "long", year: "numeric" } : { month: "short" },
  );
}

function dateLabel(iso: string) {
  const [y, m, d] = iso.split("-").map(Number);
  return new Date(y, m - 1, d).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

export default function CustomersPage() {
  const { toast } = useAdmin();
  const [summary, setSummary] = useState<PaymentSummary | null>(null);
  const [page, setPage] = useState<PaymentPage | null>(null);
  const [loadingMore, setLoadingMore] = useState(false);
  const [q, setQ] = useState("");
  const [query, setQuery] = useState("");
  const [service, setService] = useState("");
  const [month, setMonth] = useState("");
  const [method, setMethod] = useState("");
  const [open, setOpen] = useState<Payment | "new" | null>(null);
  const reqId = useRef(0);

  useEffect(() => {
    const t = setTimeout(() => setQuery(q.trim()), 250);
    return () => clearTimeout(t);
  }, [q]);

  const params = useMemo(() => {
    const p = new URLSearchParams();
    if (query) p.set("q", query);
    if (service) p.set("service", service);
    if (month) p.set("month", month);
    if (method) p.set("method", method);
    return p;
  }, [query, service, month, method]);

  const loadSummary = useCallback(() => {
    api<PaymentSummary>("/api/admin/payments/summary/")
      .then(setSummary)
      .catch(() => {});
  }, []);

  const load = useCallback(() => {
    const id = ++reqId.current;
    const p = new URLSearchParams(params);
    p.set("limit", String(PAGE));
    api<PaymentPage>(`/api/admin/payments/?${p}`)
      .then((r) => id === reqId.current && setPage(r))
      .catch((e) => {
        if (id !== reqId.current) return;
        setPage(
          (x) => x ?? { count: 0, total: "0", results: [], next_offset: null },
        );
        toast({
          title: "Couldn't load payments",
          body: errorText(e),
          tone: "error",
        });
      });
  }, [params, toast]);

  useEffect(() => {
    loadSummary();
  }, [loadSummary]);
  useEffect(() => {
    load();
  }, [load]);

  const more = async () => {
    if (!page?.next_offset) return;
    setLoadingMore(true);
    const p = new URLSearchParams(params);
    p.set("limit", String(PAGE));
    p.set("offset", String(page.next_offset));
    try {
      const r = await api<PaymentPage>(`/api/admin/payments/?${p}`);
      setPage((x) => (x ? { ...r, results: [...x.results, ...r.results] } : r));
    } catch (e) {
      toast({ title: "Couldn't load more", body: errorText(e), tone: "error" });
    } finally {
      setLoadingMore(false);
    }
  };

  const refresh = () => {
    load();
    loadSummary();
  };

  const filtered = Boolean(query || service || month || method);
  const cur = summary?.currency ?? "USD";
  const exportCsv = () =>
    download(
      `/api/admin/payments/export/?${params}`,
      `payments${month ? `-${month}` : ""}.csv`,
    ).catch((e) =>
      toast({ title: "Export failed", body: errorText(e), tone: "error" }),
    );

  return (
    <div className="grid grid-cols-[minmax(0,1fr)] gap-6">
      <PageTitle
        title="Paid customers"
        sub="Everyone who has paid you: who they are, how to reach them, what they paid for."
      >
        <button
          type="button"
          className="btn btn-secondary min-h-11 px-4 text-[0.9375rem]"
          onClick={exportCsv}
          disabled={!page?.count}
        >
          Export CSV
        </button>
        <button
          type="button"
          className="btn min-h-11 px-4 text-[0.9375rem]"
          onClick={() => setOpen("new")}
        >
          Record payment
        </button>
      </PageTitle>

      {summary && summary.demo_payments > 0 && (
        <DemoBanner count={summary.demo_payments} onCleared={refresh} />
      )}

      <section
        aria-label="Totals"
        className="grid grid-cols-2 gap-3 sm:gap-4 xl:grid-cols-4"
      >
        <Kpi
          label="Paid this month"
          value={summary ? money(summary.this_month.total, cur) : null}
        >
          {summary && (
            <Compare
              now={Number(summary.this_month.total)}
              prev={Number(summary.last_month.total)}
              fmt={(v) => money(v, cur)}
            />
          )}
        </Kpi>
        <Kpi
          label="Payments this month"
          value={summary ? String(summary.this_month.count) : null}
        >
          {summary && (
            <Compare
              now={summary.this_month.count}
              prev={summary.last_month.count}
              fmt={String}
            />
          )}
        </Kpi>
        <Kpi
          label="Average job this month"
          value={
            summary
              ? summary.this_month.count
                ? money(summary.this_month.average, cur)
                : "–"
              : null
          }
        >
          {summary && (
            <p className="text-[0.8125rem] text-muted">
              last month{" "}
              {summary.last_month.count
                ? money(summary.last_month.average, cur)
                : "–"}
            </p>
          )}
        </Kpi>
        <Kpi
          label="Customers, all time"
          value={summary ? String(summary.customers) : null}
        >
          {summary && (
            <p className="text-[0.8125rem] text-muted">
              {money(summary.all_time.total, cur)} from {summary.all_time.count}{" "}
              payments
            </p>
          )}
        </Kpi>
      </section>

      {summary && summary.all_time.count > 0 && (
        <div className="grid grid-cols-[minmax(0,1fr)] gap-4 xl:grid-cols-[minmax(0,1.6fr)_minmax(0,1fr)]">
          <Panel
            title="Paid per month"
            sub="Last 12 months. Click a month to see its payments."
          >
            <MonthBars
              months={summary.months}
              currency={cur}
              selected={month}
              onSelect={(m) => setMonth((x) => (x === m ? "" : m))}
            />
          </Panel>
          <Panel title="By service" sub="Last 12 months">
            <ServiceBars
              rows={summary.by_service}
              currency={cur}
              selected={service}
              onSelect={(s) => setService((x) => (x === s ? "" : s))}
            />
          </Panel>
        </div>
      )}

      <div className="flex flex-wrap items-end gap-3">
        <label className="relative grow sm:grow-0">
          <span className="sr-only">Search customers</span>
          <input
            type="search"
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Name, phone, email, invoice…"
            className="admin-input w-full pl-9 sm:w-[280px]"
          />
          <svg
            viewBox="0 0 24 24"
            className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            aria-hidden="true"
          >
            <circle cx="11" cy="11" r="7" />
            <path d="m20 20-3.5-3.5" strokeLinecap="round" />
          </svg>
        </label>
        <Select
          label="Service"
          value={service}
          onChange={setService}
          options={(summary?.services ?? []).map((s) => [s, s])}
          all="All services"
        />
        <Select
          label="Month"
          value={month}
          onChange={setMonth}
          options={[...(summary?.months ?? [])]
            .reverse()
            .map((m) => [m.month, monthLabel(m.month, true)])}
          all="Any month"
        />
        <Select
          label="Paid by"
          value={method}
          onChange={setMethod}
          options={METHODS.map((m) => [m.key, m.label])}
          all="Any method"
        />
        {filtered && (
          <button
            type="button"
            className="min-h-11 cursor-pointer px-2 font-semibold text-water underline underline-offset-4"
            onClick={() => (
              setQ(""),
              setService(""),
              setMonth(""),
              setMethod("")
            )}
          >
            Clear filters
          </button>
        )}
        <p className="ml-auto text-[0.9375rem] text-muted" aria-live="polite">
          {page && (
            <>
              <b className="text-ink tabular-nums">{page.count}</b>{" "}
              {page.count === 1 ? "payment" : "payments"} ·{" "}
              <b className="text-ink tabular-nums">
                {money(page.total, cur, true)}
              </b>
            </>
          )}
        </p>
      </div>

      {page && page.count === 0 && !filtered ? (
        <EmptyState
          title="No payments yet"
          text="When a job is paid, record it here or from the lead's page. You'll see every customer with their phone, email and what they paid for."
        >
          <button
            type="button"
            className="btn mt-2"
            onClick={() => setOpen("new")}
          >
            Record the first payment
          </button>
        </EmptyState>
      ) : (
        <div className="admin-card overflow-hidden">
          <ul
            className="divide-y divide-line md:hidden"
            aria-label="Payments, newest first"
          >
            {page === null &&
              Array.from({ length: 4 }, (_, i) => (
                <li key={i} className="h-20 animate-pulse bg-bg/60" />
              ))}
            {page?.results.map((p) => (
              <li key={p.id} className="grid gap-1 p-4">
                <div className="flex items-start justify-between gap-3">
                  <button
                    type="button"
                    className="min-w-0 cursor-pointer text-left"
                    onClick={() => setOpen(p)}
                  >
                    <span className="flex flex-wrap items-center gap-2 font-semibold">
                      {p.customer_name} {p.demo && <DemoTag />}
                    </span>
                    <span className="block truncate text-[0.875rem] text-muted">
                      {p.service}
                    </span>
                  </button>
                  <span className="shrink-0 text-right">
                    <b className="block tabular-nums">
                      {money(p.amount, cur, true)}
                    </b>
                    <span className="block text-[0.8125rem] text-muted">
                      {dateLabel(p.paid_at)} · {p.method_label}
                    </span>
                  </span>
                </div>
                <div className="flex flex-wrap gap-x-4 gap-y-1 text-[0.875rem]">
                  {p.phone && (
                    <a
                      href={`tel:${p.phone.replace(/[^\d+]/g, "")}`}
                      className="py-1 tabular-nums text-water"
                    >
                      Call {p.phone}
                    </a>
                  )}
                  {p.email && (
                    <a
                      href={`mailto:${p.email}`}
                      className="block max-w-full truncate py-1 text-water"
                    >
                      {p.email}
                    </a>
                  )}
                </div>
              </li>
            ))}
            {page && page.count === 0 && filtered && (
              <li className="px-5 py-10 text-center text-muted">
                No payments match these filters.
              </li>
            )}
          </ul>
          <div className="hidden overflow-x-auto md:block">
            <table className="w-full min-w-[820px] border-collapse text-left text-[0.9375rem]">
              <caption className="sr-only">Payments, newest first</caption>
              <thead>
                <tr className="border-b border-line text-[0.75rem] uppercase tracking-wide text-muted">
                  <th scope="col" className="px-5 py-3 font-semibold">
                    Customer
                  </th>
                  <th scope="col" className="px-3 py-3 font-semibold">
                    Contact
                  </th>
                  <th scope="col" className="px-3 py-3 font-semibold">
                    Service
                  </th>
                  <th scope="col" className="px-3 py-3 font-semibold">
                    Paid
                  </th>
                  <th
                    scope="col"
                    className="px-5 py-3 text-right font-semibold"
                  >
                    Amount
                  </th>
                </tr>
              </thead>
              <tbody>
                {page === null &&
                  Array.from({ length: 6 }, (_, i) => (
                    <tr key={i} className="border-b border-line">
                      <td colSpan={5} className="px-5 py-4">
                        <span className="block h-4 w-2/3 animate-pulse rounded bg-bg" />
                      </td>
                    </tr>
                  ))}
                {page?.results.map((p) => {
                  return (
                    <tr
                      key={p.id}
                      className="border-b border-line last:border-0 hover:bg-bg/70"
                    >
                      <td className="px-5 py-3">
                        <button
                          type="button"
                          className="cursor-pointer text-left"
                          onClick={() => setOpen(p)}
                        >
                          <span className="flex items-center gap-2 font-semibold underline-offset-4 hover:underline">
                            {p.customer_name} {p.demo && <DemoTag />}
                          </span>
                          <span className="block text-[0.8125rem] text-muted">
                            {p.address ||
                              (p.invoice_number
                                ? `Invoice ${p.invoice_number}`
                                : "")}
                          </span>
                        </button>
                      </td>
                      <td className="px-3 py-3">
                        {p.phone && (
                          <a
                            href={`tel:${p.phone.replace(/[^\d+]/g, "")}`}
                            className="block py-1 tabular-nums text-ink"
                          >
                            {p.phone}
                          </a>
                        )}
                        {p.email && (
                          <a
                            href={`mailto:${p.email}`}
                            className="block max-w-[220px] truncate py-1 text-[0.875rem] text-water"
                          >
                            {p.email}
                          </a>
                        )}
                        {!p.phone && !p.email && (
                          <span className="text-muted">–</span>
                        )}
                      </td>
                      <td className="max-w-[240px] px-3 py-3">
                        <span className="block truncate">{p.service}</span>
                        {p.description && (
                          <span className="block truncate text-[0.8125rem] text-muted">
                            {p.description}
                          </span>
                        )}
                      </td>
                      <td className="px-3 py-3 whitespace-nowrap">
                        <span className="block tabular-nums">
                          {dateLabel(p.paid_at)}
                        </span>
                        <span className="block text-[0.8125rem] text-muted">
                          {p.method_label}
                        </span>
                      </td>
                      <td className="px-5 py-3 text-right font-semibold tabular-nums">
                        {money(p.amount, cur, true)}
                      </td>
                    </tr>
                  );
                })}
                {page && page.count === 0 && filtered && (
                  <tr>
                    <td
                      colSpan={5}
                      className="px-5 py-12 text-center text-muted"
                    >
                      No payments match these filters.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
          {page?.next_offset != null && (
            <div className="border-t border-line p-4 text-center">
              <button
                type="button"
                className="btn btn-secondary min-h-11 px-5 text-[0.9375rem]"
                onClick={more}
                disabled={loadingMore}
              >
                {loadingMore
                  ? "Loading…"
                  : `Show more (${page.count - page.results.length} left)`}
              </button>
            </div>
          )}
        </div>
      )}

      {open && (
        <PaymentDrawer
          key={open === "new" ? "new" : open.id}
          payment={open === "new" ? null : open}
          services={summary?.services}
          onClose={() => setOpen(null)}
          onSaved={() => (setOpen(null), refresh())}
          onDeleted={() => (setOpen(null), refresh())}
        />
      )}
    </div>
  );
}

function Kpi({
  label,
  value,
  children,
}: {
  label: string;
  value: string | null;
  children?: React.ReactNode;
}) {
  return (
    <div className="admin-card grid min-w-0 content-start gap-1 p-4 sm:p-5">
      <p className="text-[0.8125rem] font-semibold text-muted sm:text-[0.875rem]">
        {label}
      </p>
      {value === null ? (
        <span className="my-1 block h-8 w-24 animate-pulse rounded bg-bg" />
      ) : (
        <p className="truncate font-display text-[1.5rem] font-bold leading-tight tabular-nums [font-stretch:110%] sm:text-[2rem]">
          {value}
        </p>
      )}
      {children}
    </div>
  );
}

function Compare({
  now,
  prev,
  fmt,
}: {
  now: number;
  prev: number;
  fmt: (v: number) => string;
}) {
  if (!prev)
    return <p className="text-[0.8125rem] text-muted">nothing last month</p>;
  const diff = now - prev;
  const pct = Math.round((Math.abs(diff) / prev) * 100);
  return (
    <p
      className={`text-[0.8125rem] font-semibold ${diff === 0 ? "text-muted" : diff > 0 ? "text-ok" : "text-muted"}`}
    >
      <span aria-hidden="true">{diff === 0 ? "→" : diff > 0 ? "↑" : "↓"} </span>
      {diff === 0
        ? "same as last month"
        : `${pct}% ${diff > 0 ? "more" : "less"} than last month (${fmt(prev)})`}
    </p>
  );
}

function Select({
  label,
  value,
  onChange,
  options,
  all,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  options: [string, string][];
  all: string;
}) {
  return (
    <label className="grid gap-1">
      <span className="text-[0.75rem] font-semibold uppercase tracking-wide text-muted">
        {label}
      </span>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="admin-input min-w-[150px] cursor-pointer"
      >
        <option value="">{all}</option>
        {options.map(([v, l]) => (
          <option key={v} value={v}>
            {l}
          </option>
        ))}
      </select>
    </label>
  );
}

/** One series, so no legend: the panel title names it. Hover/focus shows the exact amount; the table is for screen readers. */
function MonthBars({
  months,
  currency,
  selected,
  onSelect,
}: {
  months: PaymentSummary["months"];
  currency: string;
  selected: string;
  onSelect: (m: string) => void;
}) {
  const max = Math.max(1, ...months.map((m) => Number(m.total)));
  const [hover, setHover] = useState<string | null>(null);
  const shown = hover ?? selected ?? "";
  const active = months.find((m) => m.month === shown);
  return (
    <div>
      <p className="mb-3 h-6 text-[0.9375rem] tabular-nums" aria-hidden="true">
        {active ? (
          <>
            <b>{money(active.total, currency)}</b>{" "}
            <span className="text-muted">
              in {monthLabel(active.month, true)}
            </span>
          </>
        ) : (
          <span className="text-muted">Tap or hover a bar for the exact amount</span>
        )}
      </p>
      <div
        className="flex h-44 items-end gap-[2px] border-b border-line"
        role="group"
        aria-label="Paid per month"
      >
        {months.map((m) => {
          const v = Number(m.total);
          const on = selected === m.month;
          return (
            <button
              key={m.month}
              type="button"
              aria-pressed={on}
              aria-label={`${monthLabel(m.month, true)}: ${money(v, currency)}`}
              onClick={() => onSelect(m.month)}
              onMouseEnter={() => setHover(m.month)}
              onMouseLeave={() => setHover(null)}
              onFocus={() => setHover(m.month)}
              onBlur={() => setHover(null)}
              className="no-tap group flex h-full flex-1 cursor-pointer items-end justify-center rounded-t-sm px-[3px] hover:bg-bg/80 focus-visible:outline-2 focus-visible:outline-water"
            >
              <span
                className={`block w-full max-w-9 rounded-t-[4px] transition-colors ${on ? "bg-ink" : selected ? "bg-brand/35" : "bg-brand"} group-hover:bg-ink`}
                style={{ height: `${Math.max(v ? 2 : 0, (v / max) * 100)}%` }}
              />
            </button>
          );
        })}
      </div>
      <div
        className="mt-2 flex gap-[2px] text-center text-[0.75rem] text-muted"
        aria-hidden="true"
      >
        {months.map((m, i) => (
          <span key={m.month} className="flex-1">
            {i % 2 === (months.length - 1) % 2 ? monthLabel(m.month) : ""}
          </span>
        ))}
      </div>
      <div className="sr-only">
        <table>
          <caption>Paid per month</caption>
          <tbody>
            {months.map((m) => (
              <tr key={m.month}>
                <th scope="row">{monthLabel(m.month, true)}</th>
                <td>{money(m.total, currency)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function ServiceBars({
  rows,
  currency,
  selected,
  onSelect,
}: {
  rows: PaymentSummary["by_service"];
  currency: string;
  selected: string;
  onSelect: (s: string) => void;
}) {
  if (!rows.length)
    return <p className="text-muted">No payments in the last 12 months.</p>;
  const max = Math.max(...rows.map((r) => Number(r.total)));
  return (
    <ul className="grid gap-3">
      {rows.slice(0, 8).map((r) => (
        <li key={r.service}>
          <button
            type="button"
            aria-pressed={selected === r.service}
            onClick={() => onSelect(r.service)}
            className="grid w-full cursor-pointer gap-1 rounded-sm text-left focus-visible:outline-2 focus-visible:outline-water"
          >
            <span className="flex justify-between gap-3 text-[0.9375rem]">
              <span
                className={`truncate ${selected === r.service ? "font-semibold" : ""}`}
              >
                {r.service}
              </span>
              <span className="shrink-0 tabular-nums">
                <b>{money(r.total, currency)}</b>{" "}
                <span className="text-[0.8125rem] text-muted">· {r.count}</span>
              </span>
            </span>
            <span className="block h-2 rounded-full bg-bg">
              <span
                className={`block h-full rounded-full ${selected && selected !== r.service ? "bg-brand/35" : "bg-brand"}`}
                style={{ width: `${(Number(r.total) / max) * 100}%` }}
              />
            </span>
          </button>
        </li>
      ))}
    </ul>
  );
}
