"use client";

import { useActionState } from "react";
import { sendCoiRequest, type CoiState } from "@/app/(site)/contact/actions";

const initial: CoiState = { ok: false, errors: {} };

/** Building managers / supers ask for our certificate of insurance. Goes to the dashboard as a lead. */
export function CoiForm() {
  const [state, action, pending] = useActionState(sendCoiRequest, initial);
  const v = state.values ?? {};

  if (state.ok) {
    return (
      <div role="status" className="grid gap-2 rounded-md rounded-tr-elbow bg-surface p-7 text-ink shadow-lift">
        <p className="font-display text-2xl font-bold [font-stretch:110%]">Request received.</p>
        <p className="text-muted">We&apos;ll email the certificate of insurance, usually the same business day. Need it sooner? Call us.</p>
      </div>
    );
  }

  const field = (id: keyof typeof v, label: string, props: React.InputHTMLAttributes<HTMLInputElement> = {}) => {
    const err = (state.errors as Record<string, string | undefined>)[id];
    return (
      <div className="field">
        <label htmlFor={`coi-${id}`}>
          {label}
          {props.required === false && <span className="font-normal text-muted"> (optional)</span>}
        </label>
        <input
          id={`coi-${id}`}
          name={id}
          defaultValue={v[id] ?? ""}
          aria-invalid={err ? true : undefined}
          aria-describedby={err ? `coi-${id}-err` : undefined}
          {...props}
          required={props.required !== false}
        />
        {err && (
          <p id={`coi-${id}-err`} className="text-[0.875rem] font-medium text-danger">
            {err}
          </p>
        )}
      </div>
    );
  };

  return (
    <form action={action} noValidate className="relative grid gap-4 rounded-md rounded-tr-elbow bg-surface p-6 text-ink shadow-lift md:p-8" aria-labelledby="coi-title">
      <div>
        <h2 id="coi-title" className="font-display text-2xl font-bold [font-stretch:110%]">
          Request our COI
        </h2>
        <p className="text-[0.9375rem] text-muted">Certificate of insurance for your building, usually the same day.</p>
      </div>
      <div aria-hidden="true" className="absolute -left-[9999px] size-px overflow-hidden">
        <input name="website" tabIndex={-1} autoComplete="off" />
      </div>
      {field("name", "Your name", { autoComplete: "name" })}
      {field("email", "Send it to (email)", { type: "email", autoComplete: "email", inputMode: "email" })}
      {field("building", "Building address", { autoComplete: "street-address", placeholder: "e.g. 245 E 63rd St, New York, NY 10065" })}
      <div className="grid gap-4 sm:grid-cols-2">
        {field("unit", "Apartment / unit", { required: false })}
        {field("date", "Planned work date", { type: "date", required: false })}
      </div>
      {field("company", "Management company", { required: false, autoComplete: "organization" })}
      {field("holders", "Additional insured / certificate holders", { required: false, placeholder: "Building owner, managing agent, board…" })}
      {field("phone", "Phone", { type: "tel", autoComplete: "tel", inputMode: "tel", required: false })}
      {state.formError && (
        <p role="alert" className="rounded-sm border-[1.5px] border-danger/40 bg-[#fdecea] px-4 py-3 text-[0.95rem] font-medium text-[#8c1d18]">
          {state.formError}
        </p>
      )}
      <button type="submit" className="btn w-full" disabled={pending}>
        {pending ? "Sending…" : "Request the certificate"}
      </button>
    </form>
  );
}
