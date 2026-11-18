"use server";

import { headers } from "next/headers";
import { API_URL } from "@/lib/api";

type LeadPayload = {
  name: string;
  phone: string;
  email?: string;
  postcode?: string;
  job?: string;
  message?: string;
  urgent?: boolean;
  source: "hero" | "contact";
  website?: string;
};

const FAIL = "We couldn't send that just now. Please call us instead, or try again in a minute.";

/** Send the request to the dashboard (Django). Returns an error message, or null when it was saved. */
async function deliver(lead: LeadPayload): Promise<string | null> {
  const h = await headers();
  const ip = (h.get("x-forwarded-for") ?? "").split(",")[0].trim();
  try {
    const r = await fetch(`${API_URL}/api/leads/`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        // Lets the backend rate-limit per visitor rather than per web server.
        ...(process.env.INTERNAL_API_KEY ? { "X-Internal-Key": process.env.INTERNAL_API_KEY, "X-Client-IP": ip } : {}),
      },
      body: JSON.stringify(lead),
      signal: AbortSignal.timeout(8000),
      cache: "no-store",
    });
    if (r.status === 429) return "You've sent a few requests already. Please call us and we'll sort it out.";
    if (!r.ok) {
      console.error("[lead] backend refused", r.status, await r.text());
      return FAIL;
    }
    return null;
  } catch (e) {
    console.error("[lead] backend unreachable", e);
    return FAIL;
  }
}

export type QuoteState = {
  ok: boolean;
  formError?: string;
  errors: Partial<Record<"name" | "phone" | "message", string>>;
  values?: Record<string, string>;
};

export async function sendQuoteRequest(_prev: QuoteState, form: FormData): Promise<QuoteState> {
  const values = {
    name: String(form.get("name") ?? "").trim(),
    phone: String(form.get("phone") ?? "").trim(),
    email: String(form.get("email") ?? "").trim(),
    postcode: String(form.get("postcode") ?? "").trim(),
    job: String(form.get("job") ?? ""),
    message: String(form.get("message") ?? "").trim(),
    urgent: form.get("urgent") ? "yes" : "no",
  };

  const errors: QuoteState["errors"] = {};
  if (values.name.length < 2) errors.name = "Please tell us your name.";
  if (values.phone.replace(/\D/g, "").length < 7) errors.phone = "Please add a phone number we can call you back on.";
  if (values.message.length < 10) errors.message = "A sentence or two about the problem helps us bring the right parts.";

  if (Object.keys(errors).length) return { ok: false, errors, values };

  const formError = await deliver({
    ...values,
    urgent: values.urgent === "yes",
    source: "contact",
    website: String(form.get("website") ?? ""),
  });
  if (formError) return { ok: false, errors: {}, values, formError };
  return { ok: true, errors: {} };
}

export type QuickState = { ok: boolean; formError?: string; errors: Partial<Record<"name" | "phone", string>>; values?: Record<string, string> };

/** Short hero form: name + phone + job type. */
export async function sendQuickQuote(_prev: QuickState, form: FormData): Promise<QuickState> {
  const values = {
    name: String(form.get("name") ?? "").trim(),
    phone: String(form.get("phone") ?? "").trim(),
    job: String(form.get("job") ?? ""),
  };
  const errors: QuickState["errors"] = {};
  if (values.name.length < 2) errors.name = "Add your name.";
  if (values.phone.replace(/\D/g, "").length < 7) errors.phone = "Add a phone number.";
  if (Object.keys(errors).length) return { ok: false, errors, values };
  const formError = await deliver({ ...values, source: "hero", urgent: /leak|burst|emergency/i.test(values.job) });
  if (formError) return { ok: false, errors: {}, values, formError };
  return { ok: true, errors: {} };
}
