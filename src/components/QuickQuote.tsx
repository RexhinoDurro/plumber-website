"use client";

import { useActionState } from "react";
import { sendQuickQuote, type QuickState } from "@/app/(site)/contact/actions";
import { site } from "@/content/site";

const initial: QuickState = { ok: false, errors: {} };

/** Hero quote card: three fields, the conversion step above the fold. */
export function QuickQuote({ defaultJob = "Leak or emergency" }: { defaultJob?: string }) {
  const [state, action, pending] = useActionState(sendQuickQuote, initial);
  const v = state.values ?? {};

  return (
    <div className="rounded-md rounded-tr-elbow bg-surface p-6 text-ink shadow-lift md:p-8">
      {state.ok ? (
        <div role="status" className="grid gap-3">
          <p className="font-display text-2xl font-extrabold [font-stretch:112%]">Got it. We&apos;ll call you back.</p>
          <p className="text-muted">
            Usually the same working day. Leaking right now? Call{" "}
            <a href={site.phoneHref} className="font-semibold text-water">{site.phone}</a>.
          </p>
        </div>
      ) : (
        <form action={action} noValidate className="grid gap-4">
          <div>
            <p className="font-display text-2xl font-extrabold leading-tight [font-stretch:112%]">Get a fixed price</p>
            <p className="mt-1 text-[0.95rem] text-muted">We call you back. No obligation.</p>
          </div>
          <div className="field">
            <label htmlFor="qq-name">Name</label>
            <input
              id="qq-name"
              name="name"
              autoComplete="name"
              defaultValue={v.name}
              aria-invalid={state.errors.name ? true : undefined}
              aria-describedby={state.errors.name ? "qq-name-error" : undefined}
            />
            {state.errors.name && <span id="qq-name-error" className="text-sm font-medium text-[#b3261e]">{state.errors.name}</span>}
          </div>
          <div className="field">
            <label htmlFor="qq-phone">Phone</label>
            <input
              id="qq-phone"
              name="phone"
              type="tel"
              autoComplete="tel"
              defaultValue={v.phone}
              aria-invalid={state.errors.phone ? true : undefined}
              aria-describedby={state.errors.phone ? "qq-phone-error" : undefined}
            />
            {state.errors.phone && <span id="qq-phone-error" className="text-sm font-medium text-[#b3261e]">{state.errors.phone}</span>}
          </div>
          <div className="field">
            <label htmlFor="qq-job">What do you need?</label>
            <select id="qq-job" name="job" defaultValue={v.job ?? defaultJob}>
              {["Leak or emergency", "Blocked drain", "Bathroom", "Kitchen", "Heating or boiler", "Something else"].map((o) => (
                <option key={o}>{o}</option>
              ))}
            </select>
          </div>
          {state.formError && (
            <p role="alert" className="rounded-sm border-[1.5px] border-[#b3261e]/40 bg-[#fdecea] px-4 py-3 text-[0.95rem] font-medium text-[#8c1d18]">
              {state.formError}
            </p>
          )}
          <button type="submit" className="btn w-full" disabled={pending}>
            {pending ? "Sending…" : "Request my callback"}
          </button>
        </form>
      )}
    </div>
  );
}
