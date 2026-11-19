"use client";

import { useState } from "react";
import { api } from "./client";
import { useAdmin } from "./AdminShell";

export function PageTitle({ title, sub, children }: { title: string; sub?: string; children?: React.ReactNode }) {
  return (
    <header className="flex flex-wrap items-end justify-between gap-4">
      <div>
        <h1 className="text-[clamp(1.75rem,2vw+1rem,2.4rem)]">{title}</h1>
        {sub && <p className="mt-1 text-muted">{sub}</p>}
      </div>
      {children && <div className="flex flex-wrap gap-2">{children}</div>}
    </header>
  );
}

export function Panel({ title, sub, action, children, className = "" }: { title: string; sub?: string; action?: React.ReactNode; children: React.ReactNode; className?: string }) {
  return (
    <section className={`admin-card p-6 ${className}`}>
      <div className="mb-5 flex items-start justify-between gap-3">
        <div>
          <h2 className="font-display text-[1.125rem] font-bold [font-stretch:110%]">{title}</h2>
          {sub && <p className="text-[0.875rem] text-muted">{sub}</p>}
        </div>
        {action}
      </div>
      {children}
    </section>
  );
}

/** Change against last period, with an arrow and words (never color alone). */
export function Delta({ now, prev, lowerIsBetter, label }: { now: number; prev: number; lowerIsBetter?: boolean; label?: string }) {
  if (!prev && !now) return <p className="text-[0.8125rem] text-muted">{label ?? "no data last week"}</p>;
  const diff = now - prev;
  const good = lowerIsBetter ? diff < 0 : diff > 0;
  const flat = diff === 0;
  const pct = prev ? Math.round((Math.abs(diff) / prev) * 100) : null;
  return (
    <p className={`text-[0.8125rem] font-semibold ${flat ? "text-muted" : good ? "text-ok" : "text-warn"}`}>
      <span aria-hidden="true">{flat ? "→" : diff > 0 ? "↑" : "↓"} </span>
      {flat ? "same as last week" : label ? `${pct !== null ? `${pct}% ${diff > 0 ? "slower" : "faster"}` : ""} · ${label}` : `${pct !== null ? `${pct}%` : Math.abs(diff)} ${diff > 0 ? "more" : "fewer"} than last week (${prev})`}
    </p>
  );
}

export function EmptyState({ title, text, children }: { title: string; text: string; children?: React.ReactNode }) {
  return (
    <div className="admin-card grid justify-items-center gap-3 px-6 py-16 text-center">
      <svg viewBox="0 0 48 48" className="size-12 text-line" fill="none" stroke="currentColor" strokeWidth="3" aria-hidden="true">
        <path d="M8 40V26a14 14 0 0 1 14-14h18" strokeLinecap="round" />
      </svg>
      <h2 className="font-display text-xl font-bold [font-stretch:110%]">{title}</h2>
      <p className="max-w-[46ch] text-muted">{text}</p>
      {children}
    </div>
  );
}

/** Shown while sample records exist, so they're never mistaken for real customers. */
export function DemoBanner({ count, onCleared }: { count: number; onCleared?: () => void }) {
  const { toast, refreshCounts } = useAdmin();
  const [busy, setBusy] = useState(false);
  const [confirm, setConfirm] = useState(false);
  const clear = async () => {
    setBusy(true);
    try {
      const r = await api<{ deleted: number }>("/api/admin/demo/clear/", { method: "POST" });
      toast({ title: "Demo data removed", body: `${r.deleted} sample records deleted. Everything you see now is real.`, tone: "ok" });
      refreshCounts();
      onCleared?.();
    } finally {
      setBusy(false);
      setConfirm(false);
    }
  };
  return (
    <div role="note" className="flex flex-wrap items-center gap-3 rounded-md border-[1.5px] border-dashed border-warn/50 bg-[#fff7ea] px-5 py-3 text-[0.9375rem]">
      <span className="chip bg-warn text-white">Demo</span>
      <p className="flex-1 text-[#5c3a00]">
        {count} sample leads, chats, payments and reviews are mixed in so you can try things out. They never appear on the website.
      </p>
      {confirm ? (
        <span className="flex items-center gap-2">
          <span className="text-[0.875rem] font-semibold">Delete all sample records?</span>
          <button type="button" className="btn min-h-10 px-4 text-[0.875rem]" onClick={clear} disabled={busy}>
            {busy ? "Removing…" : "Yes, remove"}
          </button>
          <button type="button" className="btn btn-secondary min-h-10 px-4 text-[0.875rem]" onClick={() => setConfirm(false)}>
            Cancel
          </button>
        </span>
      ) : (
        <button type="button" className="btn btn-secondary min-h-10 px-4 text-[0.875rem]" onClick={() => setConfirm(true)}>
          Remove demo data
        </button>
      )}
    </div>
  );
}

export function DemoTag() {
  return <span className="chip border border-dashed border-warn/60 text-warn">Demo</span>;
}
