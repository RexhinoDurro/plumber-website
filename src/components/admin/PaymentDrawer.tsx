"use client";

import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { api, errorText, METHODS, money, type Lead, type Payment } from "./client";
import { useAdmin } from "./AdminShell";
import { DemoTag } from "./ui";

const SERVICES = [
  "Leak or burst pipe", "Blocked drain", "Boiler or heating", "Water heater", "Gas or Local Law 152", "Bathroom", "Kitchen",
  "Pipework", "Toilet or faucet", "Inspection", "Other",
];

const today = () => {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
};

type Draft = Omit<Payment, "id" | "method_label" | "demo" | "created_at">;

/** Record a new payment, or view / edit / delete one. Prefilled from the lead when there is one. */
export function PaymentDrawer({
  payment,
  lead,
  services = [],
  onClose,
  onSaved,
  onDeleted,
}: {
  payment?: Payment | null;
  lead?: Lead | null;
  services?: string[];
  onClose: () => void;
  onSaved: (p: Payment) => void;
  onDeleted?: (id: number) => void;
}) {
  const { toast } = useAdmin();
  const [d, setD] = useState<Draft>(() =>
    payment
      ? { ...payment }
      : {
          lead: lead?.id ?? null,
          customer_name: lead?.name ?? "",
          phone: lead?.phone ?? "",
          email: lead?.email ?? "",
          address: lead?.postcode ?? "",
          service: lead?.job && lead.job !== "Not sure" ? lead.job : "",
          description: lead?.message.slice(0, 300) ?? "",
          amount: "",
          method: "card",
          paid_at: today(),
          invoice_number: "",
          notes: "",
        },
  );
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [busy, setBusy] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const first = useRef<HTMLInputElement>(null);

  useEffect(() => {
    (payment ? ref.current : (lead ? document.getElementById("pay-amount") : first.current))?.focus();
  }, [payment, lead]);

  const set = <K extends keyof Draft>(k: K, v: Draft[K]) => {
    setD((x) => ({ ...x, [k]: v }));
    if (errors[k as string]) setErrors((e) => ({ ...e, [k]: "" }));
  };

  const save = async (e: React.FormEvent) => {
    e.preventDefault();
    const err: Record<string, string> = {};
    if (d.customer_name.trim().length < 2) err.customer_name = "Add the customer's name.";
    if (!d.service.trim()) err.service = "Pick or type the service.";
    if (!(Number(d.amount) > 0)) err.amount = "Add the amount paid.";
    if (!d.phone.trim() && !d.email.trim() && !d.lead) err.phone = "Add a phone number or email.";
    setErrors(err);
    if (Object.values(err).some(Boolean)) return;
    setBusy(true);
    try {
      const body = JSON.stringify({ ...d, amount: Number(d.amount).toFixed(2) });
      const saved = payment
        ? await api<Payment>(`/api/admin/payments/${payment.id}/`, { method: "PATCH", body })
        : await api<Payment>("/api/admin/payments/", { method: "POST", body });
      toast({ title: payment ? "Payment updated" : `Payment recorded: ${money(saved.amount, "USD", true)}`, body: saved.customer_name, tone: "ok" });
      onSaved(saved);
    } catch (e) {
      toast({ title: "Couldn't save", body: errorText(e), tone: "error" });
    } finally {
      setBusy(false);
    }
  };

  const remove = async () => {
    if (!payment) return;
    try {
      await api(`/api/admin/payments/${payment.id}/`, { method: "DELETE" });
      toast({ title: "Payment deleted", tone: "ok" });
      onDeleted?.(payment.id);
    } catch (e) {
      toast({ title: "Couldn't delete", body: errorText(e), tone: "error" });
    }
  };

  const allServices = [...new Set([...SERVICES, ...services])];
  const field = (k: keyof Draft, label: string, props: React.InputHTMLAttributes<HTMLInputElement> = {}, inputRef?: React.Ref<HTMLInputElement>) => (
    <label className="grid gap-1.5">
      <span className="text-[0.8125rem] font-semibold">
        {label}
        {props.required === false && <span className="font-normal text-muted"> (optional)</span>}
      </span>
      <input
        ref={inputRef}
        id={`pay-${k}`}
        value={String(d[k] ?? "")}
        onChange={(e) => set(k, e.target.value as never)}
        aria-invalid={errors[k] ? true : undefined}
        aria-describedby={errors[k] ? `pay-${k}-err` : undefined}
        className="admin-input"
        {...props}
        required={undefined}
      />
      {errors[k] && (
        <span id={`pay-${k}-err`} className="text-[0.8125rem] font-medium text-danger">
          {errors[k]}
        </span>
      )}
    </label>
  );

  return createPortal(
    <>
      <div className="fixed inset-0 z-[55] bg-ink/30" onClick={onClose} aria-hidden="true" />
      <div
        ref={ref}
        tabIndex={-1}
        role="dialog"
        aria-label={payment ? `Payment from ${payment.customer_name}` : "Record a payment"}
        onKeyDown={(e) => {
          if (e.key === "Escape") {
            e.stopPropagation();
            onClose();
          }
        }}
        className="drawer fixed inset-y-0 right-0 z-[60] flex w-[min(480px,100vw)] flex-col bg-surface shadow-lift outline-none"
      >
        <header className="flex items-start gap-3 border-b border-line p-6">
          <div className="min-w-0 flex-1">
            <p className="text-[0.8125rem] text-muted">{payment ? `Recorded ${new Date(payment.created_at).toLocaleDateString()}` : lead ? `From ${lead.source_label.toLowerCase()} request` : "New payment"}</p>
            <h2 className="mt-1 flex flex-wrap items-center gap-2 font-display text-2xl font-bold [font-stretch:110%]">
              {payment ? payment.customer_name : "Record a payment"} {payment?.demo && <DemoTag />}
            </h2>
          </div>
          <button type="button" onClick={onClose} className="grid size-10 cursor-pointer place-items-center rounded-full hover:bg-bg" aria-label="Close">
            ✕
          </button>
        </header>

        <form id="pay-form" onSubmit={save} noValidate className="grid flex-1 content-start gap-4 overflow-y-auto p-6">
          <div className="grid grid-cols-[minmax(0,1fr)_minmax(0,1fr)] gap-3">
            {field("amount", "Amount paid ($)", { type: "number", inputMode: "decimal", min: "0", step: "0.01", placeholder: "0.00" })}
            {field("paid_at", "Date paid", { type: "date" })}
          </div>
          <label className="grid gap-1.5">
            <span className="text-[0.8125rem] font-semibold">Service</span>
            <input
              id="pay-service"
              list="pay-services"
              value={d.service}
              onChange={(e) => set("service", e.target.value)}
              aria-invalid={errors.service ? true : undefined}
              aria-describedby={errors.service ? "pay-service-err" : undefined}
              placeholder="Pick or type"
              className="admin-input"
            />
            <datalist id="pay-services">
              {allServices.map((s) => (
                <option key={s} value={s} />
              ))}
            </datalist>
            {errors.service && (
              <span id="pay-service-err" className="text-[0.8125rem] font-medium text-danger">
                {errors.service}
              </span>
            )}
          </label>
          <fieldset className="grid gap-1.5">
            <legend className="mb-1.5 text-[0.8125rem] font-semibold">Paid by</legend>
            <div className="flex flex-wrap gap-1.5">
              {METHODS.map((m) => (
                <label key={m.key} className="cursor-pointer">
                  <input type="radio" name="method" value={m.key} checked={d.method === m.key} onChange={() => set("method", m.key)} className="peer sr-only" />
                  <span className="chip min-h-10 border border-line bg-surface px-3 text-[0.875rem] text-ink peer-checked:border-ink peer-checked:bg-ink peer-checked:text-white peer-focus-visible:ring-[3px] peer-focus-visible:ring-water/30">
                    {m.label}
                  </span>
                </label>
              ))}
            </div>
          </fieldset>
          <hr className="border-line" />
          {field("customer_name", "Customer name", { autoComplete: "off" }, first)}
          <div className="grid grid-cols-[minmax(0,1fr)] gap-3 sm:grid-cols-2">
            {field("phone", "Phone", { type: "tel", inputMode: "tel" })}
            {field("email", "Email", { type: "email", inputMode: "email", required: false })}
          </div>
          {field("address", "Address or ZIP code", { required: false })}
          {field("description", "What was done", { required: false, placeholder: "e.g. Replaced 40-gal water heater" })}
          {field("invoice_number", "Invoice #", { required: false })}
          <label className="grid gap-1.5">
            <span className="text-[0.8125rem] font-semibold">
              Notes <span className="font-normal text-muted">(optional)</span>
            </span>
            <textarea value={d.notes} onChange={(e) => set("notes", e.target.value)} rows={3} className="admin-input resize-y" />
          </label>
        </form>

        <footer className="flex items-center justify-between gap-3 border-t border-line p-4">
          {payment && onDeleted ? (
            confirmDelete ? (
              <span className="flex items-center gap-2 text-[0.875rem]">
                Delete?
                <button type="button" className="btn min-h-10 bg-danger px-3 text-[0.875rem] hover:bg-danger" onClick={remove}>
                  Delete
                </button>
                <button type="button" className="btn btn-secondary min-h-10 px-3 text-[0.875rem]" onClick={() => setConfirmDelete(false)}>
                  Keep
                </button>
              </span>
            ) : (
              <button type="button" className="cursor-pointer text-[0.875rem] text-muted underline underline-offset-4 hover:text-danger" onClick={() => setConfirmDelete(true)}>
                Delete payment
              </button>
            )
          ) : (
            <span />
          )}
          {!confirmDelete && (
            <button type="submit" form="pay-form" className="btn min-h-11 px-5 text-[0.9375rem]" disabled={busy}>
              {busy ? "Saving…" : payment ? "Save changes" : "Record payment"}
            </button>
          )}
        </footer>
      </div>
    </>,
    document.body,
  );
}
