"use server";

export type QuoteState = {
  ok: boolean;
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

  // TODO: deliver the request: e.g. send an email with Resend/Postmark, or post to your CRM.
  // Until then requests are only logged on the server.
  console.log("[quote-request]", values);

  return { ok: true, errors: {} };
}

export type QuickState = { ok: boolean; errors: Partial<Record<"name" | "phone", string>>; values?: Record<string, string> };

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
  // TODO: deliver the request (email/CRM). Logged on the server for now.
  console.log("[quick-quote]", values);
  return { ok: true, errors: {} };
}
