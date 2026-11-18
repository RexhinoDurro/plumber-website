"use client";

import { cloneElement, useActionState } from "react";
import { sendQuoteRequest, type QuoteState } from "@/app/(site)/contact/actions";
import { site } from "@/content/site";

const initial: QuoteState = { ok: false, errors: {} };

export function QuoteForm() {
  const [state, action, pending] = useActionState(sendQuoteRequest, initial);
  const v = state.values ?? {};

  if (state.ok) {
    return (
      <div className="grid gap-3 rounded-sm border-l-4 border-water bg-[#e3f0ec] p-6" role="status">
        <h2 className="text-3xl">Thanks, we&apos;ve got it.</h2>
        <p>
          We&apos;ll call you back with a fixed price, usually the same working day. If water is coming through right now,
          don&apos;t wait: call <a href={site.phoneHref} className="font-semibold">{site.phone}</a>.
        </p>
      </div>
    );
  }

  return (
    <form action={action} noValidate className="relative grid gap-6 rounded-md bg-surface p-[clamp(24px,4vw,48px)] shadow-hair">
      <div>
        <h2 className="text-[clamp(1.75rem,2vw+1rem,2.5rem)]">Get a fixed-price quote</h2>
        <p className="mt-2 text-muted">Takes about a minute. We reply by phone, usually the same working day.</p>
      </div>

      {/* Spam trap: hidden from people, bots fill it in. */}
      <div aria-hidden="true" className="absolute -left-[9999px] size-px overflow-hidden">
        <label htmlFor="website">Leave this empty</label>
        <input id="website" name="website" tabIndex={-1} autoComplete="off" />
      </div>

      <div className="grid gap-6 sm:grid-cols-2">
        <Field id="name" label="Your name" error={state.errors.name}>
          <input id="name" name="name" autoComplete="name" required defaultValue={v.name} />
        </Field>
        <Field id="phone" label="Phone" error={state.errors.phone}>
          <input id="phone" name="phone" type="tel" autoComplete="tel" required defaultValue={v.phone} />
        </Field>
        <Field id="email" label="Email" hint="Optional">
          <input id="email" name="email" type="email" autoComplete="email" defaultValue={v.email} />
        </Field>
        <Field id="postcode" label="Postcode or area" hint="So we know how far we're travelling">
          <input id="postcode" name="postcode" autoComplete="postal-code" defaultValue={v.postcode} />
        </Field>
      </div>

      <Field id="job" label="What kind of job?">
        <select id="job" name="job" defaultValue={v.job ?? "Not sure"}>
          {["Leak or emergency", "Blocked drain", "Bathroom", "Kitchen", "Heating or boiler", "New pipework", "Not sure"].map((o) => (
            <option key={o}>{o}</option>
          ))}
        </select>
      </Field>

      <Field id="message" label="What's happening?" hint="Where it is, what you see, and when it started" error={state.errors.message}>
        <textarea id="message" name="message" required defaultValue={v.message} />
      </Field>

      <label className="flex items-start gap-3 text-base">
        <input type="checkbox" name="urgent" className="mt-0.5 size-[22px] accent-water" defaultChecked={v.urgent === "yes"} />
        <span>
          It&apos;s urgent: water is leaking now. <span className="text-muted">(For a real emergency, calling is faster.)</span>
        </span>
      </label>

      {state.formError && (
        <p role="alert" className="rounded-sm border-[1.5px] border-[#b3261e]/40 bg-[#fdecea] px-4 py-3 text-[0.95rem] font-medium text-[#8c1d18]">
          {state.formError}
        </p>
        )}
      <div className="flex flex-wrap items-center gap-4">
        <button type="submit" className="btn" disabled={pending}>
          {pending ? "Sending…" : "Send my request"}
        </button>
        <p className="text-sm text-muted">We only use your details to reply to this request.</p>
      </div>
    </form>
  );
}

function Field({
  id,
  label,
  hint,
  error,
  children,
}: {
  id: string;
  label: string;
  hint?: string;
  error?: string;
  children: React.ReactElement<Record<string, unknown>>;
}) {
  const describedBy = [hint && `${id}-hint`, error && `${id}-error`].filter(Boolean).join(" ") || undefined;
  const child = cloneElement(children, { "aria-invalid": error ? true : undefined, "aria-describedby": describedBy });
  return (
    <div className="field">
      <label htmlFor={id}>{label}</label>
      {hint && (
        <span id={`${id}-hint`} className="-mt-1 text-sm text-muted">
          {hint}
        </span>
      )}
      {child}
      {error && (
        <span id={`${id}-error`} className="text-[0.9rem] font-medium text-[#b3261e]">
          {error}
        </span>
      )}
    </div>
  );
}
