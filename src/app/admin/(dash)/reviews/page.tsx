"use client";

import { useCallback, useEffect, useState } from "react";
import { useAdmin } from "@/components/admin/AdminShell";
import { DemoTag, EmptyState, PageTitle } from "@/components/admin/ui";
import { api, errorText, type Review } from "@/components/admin/client";

const blank = { name: "", place: "", job: "", quote: "", rating: 5, source: "Google", source_url: "", consent: false, published: false };

export default function ReviewsPage() {
  const { toast } = useAdmin();
  const [items, setItems] = useState<Review[] | null>(null);
  const [form, setForm] = useState<typeof blank | null>(null);
  const [error, setError] = useState("");

  const load = useCallback(() => {
    api<Review[]>("/api/admin/reviews/")
      .then(setItems)
      .catch(() => setItems((l) => l ?? []));
  }, []);
  useEffect(load, [load]);

  const create = async () => {
    if (!form) return;
    try {
      const r = await api<Review>("/api/admin/reviews/", { method: "POST", body: JSON.stringify(form) });
      setItems((l) => [r, ...(l ?? [])]);
      setForm(null);
      setError("");
      toast({ title: r.published ? "Review is on the website" : "Review saved (not published)", tone: "ok" });
    } catch (e) {
      setError(errorText(e));
    }
  };

  const save = async (id: number, patch: Partial<Review>) => {
    try {
      const r = await api<Review>(`/api/admin/reviews/${id}/`, { method: "PATCH", body: JSON.stringify(patch) });
      setItems((l) => l?.map((x) => (x.id === id ? r : x)) ?? l);
      if ("published" in patch) toast({ title: r.published ? "Now on the website" : "Removed from the website", tone: "ok" });
    } catch (e) {
      toast({ title: "Couldn't save", body: errorText(e), tone: "error" });
    }
  };

  const remove = async (id: number) => {
    await api(`/api/admin/reviews/${id}/`, { method: "DELETE" }).catch(() => {});
    setItems((l) => l?.filter((x) => x.id !== id) ?? l);
  };

  const live = (items ?? []).filter((r) => r.published && !r.demo).length;

  return (
    <div className="grid grid-cols-[minmax(0,1fr)] gap-6">
      <PageTitle title="Reviews" sub={`${live} of 3 slots on the home page filled with real reviews. Until then the website shows placeholders.`}>
        {!form && (
          <button type="button" className="btn" onClick={() => setForm({ ...blank })}>
            Add a review
          </button>
        )}
      </PageTitle>

      {form && (
        <form
          className="admin-card grid gap-4 p-6 md:grid-cols-2"
          onSubmit={(e) => {
            e.preventDefault();
            create();
          }}
        >
          <h2 className="font-display text-lg font-bold [font-stretch:110%] md:col-span-2">New review</h2>
          <label className="grid gap-1 text-[0.875rem] font-semibold md:col-span-2">
            What the customer said
            <textarea className="admin-input" rows={4} required value={form.quote} onChange={(e) => setForm({ ...form, quote: e.target.value })} placeholder="Paste their words exactly as written" />
          </label>
          <Field label="Customer name" value={form.name} onChange={(v) => setForm({ ...form, name: v })} placeholder="e.g. Anna K." required />
          <Field label="Area" value={form.place} onChange={(v) => setForm({ ...form, place: v })} placeholder="e.g. District XIII" />
          <Field label="Job" value={form.job} onChange={(v) => setForm({ ...form, job: v })} placeholder="e.g. Bathroom refit" />
          <label className="grid gap-1 text-[0.875rem] font-semibold">
            Stars
            <select className="admin-input" value={form.rating} onChange={(e) => setForm({ ...form, rating: Number(e.target.value) })}>
              {[5, 4, 3, 2, 1].map((n) => (
                <option key={n} value={n}>
                  {n} {n === 1 ? "star" : "stars"}
                </option>
              ))}
            </select>
          </label>
          <Field label="Where it was posted" value={form.source} onChange={(v) => setForm({ ...form, source: v })} />
          <Field label="Link to the review" value={form.source_url} onChange={(v) => setForm({ ...form, source_url: v })} placeholder="https://g.page/…" type="url" />
          <label className="flex items-start gap-3 rounded-sm bg-bg p-3 text-[0.9375rem] md:col-span-2">
            <input type="checkbox" className="mt-1 size-4" checked={form.consent} onChange={(e) => setForm({ ...form, consent: e.target.checked, published: e.target.checked && form.published })} />
            <span>
              <b>The customer agreed</b> to have this shown on our website.
            </span>
          </label>
          <label className={`flex items-center gap-3 text-[0.9375rem] md:col-span-2 ${form.consent ? "" : "opacity-50"}`}>
            <input type="checkbox" className="size-4" disabled={!form.consent} checked={form.published} onChange={(e) => setForm({ ...form, published: e.target.checked })} />
            Publish on the website now
          </label>
          {error && (
            <p role="alert" className="text-[0.875rem] font-medium text-danger md:col-span-2">
              {error}
            </p>
          )}
          <div className="flex gap-2 md:col-span-2">
            <button type="submit" className="btn">
              Save review
            </button>
            <button type="button" className="btn btn-secondary" onClick={() => setForm(null)}>
              Cancel
            </button>
          </div>
        </form>
      )}

      {items !== null && items.length === 0 && !form ? (
        <EmptyState title="No reviews yet" text="Copy your best Google reviews here (with the customer's OK). The three newest published ones replace the placeholders on the home page." />
      ) : (
        <ul className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {(items ?? []).map((r) => (
            <li key={r.id} className="admin-card grid content-between gap-4 p-5">
              <div>
                <div className="mb-2 flex items-center gap-2">
                  <span className="text-warn" aria-label={`${r.rating} out of 5 stars`}>
                    {"★".repeat(r.rating)}
                    <span className="text-line">{"★".repeat(5 - r.rating)}</span>
                  </span>
                  {r.demo && <DemoTag />}
                </div>
                <blockquote className="text-[0.9375rem]">“{r.quote}”</blockquote>
                <p className="mt-2 text-[0.8125rem] text-muted">
                  <b className="text-ink">{r.name}</b>
                  {r.job && ` · ${r.job}`}
                  {r.place && ` · ${r.place}`} · {r.source}
                </p>
              </div>
              <div className="grid gap-2 border-t border-line pt-3 text-[0.8125rem]">
                <label className="flex items-center justify-between">
                  Customer agreed
                  <input type="checkbox" role="switch" className="switch switch-light" checked={r.consent} disabled={r.demo} onChange={(e) => save(r.id, { consent: e.target.checked, ...(e.target.checked ? {} : { published: false }) })} />
                </label>
                <label className={`flex items-center justify-between ${r.consent && !r.demo ? "" : "opacity-50"}`}>
                  On website
                  <input type="checkbox" role="switch" className="switch switch-light" checked={r.published} disabled={!r.consent || r.demo} onChange={(e) => save(r.id, { published: e.target.checked })} />
                </label>
                {r.demo && <p className="text-muted">Sample review: can&apos;t be published.</p>}
                <button type="button" className="w-fit cursor-pointer text-muted underline underline-offset-2 hover:text-danger" onClick={() => remove(r.id)}>
                  Delete
                </button>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

function Field({ label, value, onChange, placeholder, required, type = "text" }: { label: string; value: string; onChange: (v: string) => void; placeholder?: string; required?: boolean; type?: string }) {
  return (
    <label className="grid gap-1 text-[0.875rem] font-semibold">
      {label}
      <input className="admin-input" type={type} value={value} required={required} placeholder={placeholder} onChange={(e) => onChange(e.target.value)} />
    </label>
  );
}
