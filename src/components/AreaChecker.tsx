"use client";

import { useState } from "react";
import { site } from "@/content/site";

const norm = (s: string) => s.toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "").trim();

/** Type your area → instant yes / probably / ask-us answer. */
export function AreaChecker() {
  const [q, setQ] = useState("");
  const [result, setResult] = useState<null | { ok: boolean; text: string }>(null);

  const check = (e: React.FormEvent) => {
    e.preventDefault();
    const v = norm(q);
    if (!v) return;
    const hit = site.areas.find((a) => norm(a).includes(v) || v.includes(norm(a)));
    setResult(
      hit
        ? { ok: true, text: `Yes, we cover ${hit}. Call or send a request and we'll give you an arrival time.` }
        : { ok: false, text: `${q} isn't on our usual list, but we often travel further. Call us and we'll tell you straight away.` },
    );
  };

  return (
    <form onSubmit={check} className="grid gap-3" noValidate>
      <label htmlFor="area" className="font-semibold">Check your area</label>
      <div className="flex gap-2">
        <input
          id="area"
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Town, district or postcode"
          autoComplete="address-level2"
          className="min-h-[52px] min-w-0 flex-1 rounded-sm border-[1.5px] border-[#9aa6a2] bg-surface px-4 text-[1.0625rem] focus:border-2 focus:border-water focus:outline-none focus:ring-[3px] focus:ring-water/20"
        />
        <button type="submit" className="btn shrink-0">Check</button>
      </div>
      <p aria-live="polite" className={`min-h-6 text-[0.95rem] ${result ? (result.ok ? "font-medium text-water" : "text-muted") : ""}`}>
        {result?.text}
      </p>
    </form>
  );
}
