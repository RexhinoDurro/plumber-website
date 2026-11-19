"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { site } from "@/content/site";
import { API_URL } from "@/lib/api";
import { Logo } from "@/components/Logo";
import { auth } from "@/components/admin/client";

export default function LoginPage() {
  const router = useRouter();
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  async function submit(form: FormData) {
    setBusy(true);
    setError("");
    try {
      const r = await fetch(`${API_URL}/api/auth/login/`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username: form.get("username"), password: form.get("password") }),
      });
      const d = await r.json().catch(() => ({}));
      if (r.status === 429) throw new Error("Too many attempts. Wait a minute and try again.");
      if (!r.ok) throw new Error(d.detail ?? "Couldn't sign in.");
      auth.set({ token: d.token, user: d.user });
      router.replace("/admin");
    } catch (e) {
      setError(e instanceof TypeError ? "Can't reach the server. Is the backend running?" : (e as Error).message);
      setBusy(false);
    }
  }

  return (
    <main id="main" data-admin className="grid min-h-svh md:grid-cols-[1fr_1.1fr]">
      <section className="on-dark grain blueprint hidden flex-col justify-between bg-ink p-12 text-on-dark md:flex">
        <div className="flex items-center gap-3">
          <Logo className="h-auto w-[220px]" alt={site.name} priority />
        </div>
        <div className="grid max-w-md gap-4">
          <h1 className="text-[clamp(2.2rem,3vw+1rem,3.4rem)] text-on-dark">Every request, answered fast.</h1>
          <p className="text-on-dark-muted">
            Live chats, quote requests, your gallery and reviews, in one place. Leave this open and visitors see you&apos;re online.
          </p>
        </div>
        <p className="text-sm text-on-dark-muted">Staff only.</p>
      </section>
      <section className="grid place-items-center px-6 py-16">
        <form
          className="grid w-full max-w-sm gap-5"
          onSubmit={(e) => {
            e.preventDefault();
            submit(new FormData(e.currentTarget));
          }}
        >
          <div className="mb-2 flex justify-center rounded-md bg-ink p-4 md:hidden">
            <Logo className="h-auto w-[200px]" alt={site.name} priority />
          </div>
          <div>
            <h2 className="text-[2rem]">Sign in</h2>
            <p className="mt-1 text-muted">to the dashboard</p>
          </div>
          <label className="grid gap-1.5 font-semibold">
            Username
            <input name="username" autoComplete="username" required className="admin-input" />
          </label>
          <label className="grid gap-1.5 font-semibold">
            Password
            <input name="password" type="password" autoComplete="current-password" required className="admin-input" />
          </label>
          {error && (
            <p role="alert" className="rounded-sm bg-[#fdecea] px-4 py-3 text-[0.9375rem] font-medium text-[#8c1d18]">
              {error}
            </p>
          )}
          <button type="submit" className="btn w-full" disabled={busy}>
            {busy ? "Signing in…" : "Sign in"}
          </button>
        </form>
      </section>
    </main>
  );
}
