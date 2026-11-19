"use client";

import { useState } from "react";
import { site } from "@/content/site";

const norm = (s: string) => s.toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "").trim();

/** NYC ZIP code → borough (USPS prefixes). */
function boroughForZip(zip: string): string | null {
  const z = Number(zip);
  if (z >= 10001 && z <= 10292) return "Manhattan";
  if (z >= 10301 && z <= 10314) return "Staten Island";
  if (z >= 10451 && z <= 10475) return "The Bronx";
  if (z >= 11201 && z <= 11256) return "Brooklyn";
  if ((z >= 11004 && z <= 11109) || (z >= 11351 && z <= 11697)) return "Queens";
  return null;
}

// Common ways people name places → the borough we list.
const aliases: Record<string, string> = {
  nyc: "", "new york": "", bronx: "The Bronx", "the bronx": "The Bronx", "staten": "Staten Island", si: "Staten Island", bk: "Brooklyn",
  harlem: "Manhattan", "upper west side": "Manhattan", "upper east side": "Manhattan", uws: "Manhattan", ues: "Manhattan", soho: "Manhattan",
  "lower east side": "Manhattan", "washington heights": "Manhattan", "east village": "Manhattan", "west village": "Manhattan", chelsea: "Manhattan",
  williamsburg: "Brooklyn", bushwick: "Brooklyn", "park slope": "Brooklyn", "bed-stuy": "Brooklyn", "bed stuy": "Brooklyn", flatbush: "Brooklyn",
  "bay ridge": "Brooklyn", greenpoint: "Brooklyn", "crown heights": "Brooklyn", astoria: "Queens", flushing: "Queens", "long island city": "Queens",
  lic: "Queens", "jackson heights": "Queens", "forest hills": "Queens", jamaica: "Queens", ridgewood: "Queens", riverdale: "The Bronx",
};

/** Type a ZIP code, neighborhood or borough → instant answer. */
export function AreaChecker() {
  const [q, setQ] = useState("");
  const [result, setResult] = useState<null | { ok: boolean; text: string }>(null);

  const check = (e: React.FormEvent) => {
    e.preventDefault();
    const v = norm(q);
    if (!v) return;
    const zip = v.match(/\b\d{5}\b/)?.[0];
    let borough = zip ? boroughForZip(zip) : null;
    if (!borough) borough = site.areas.find((a) => norm(a).includes(v) || v.includes(norm(a))) ?? null;
    if (!borough && v in aliases) borough = aliases[v] || null;
    if (!borough) borough = Object.entries(aliases).find(([k, b]) => b && v.includes(k))?.[1] ?? null;
    const covered = borough && site.areas.includes(borough);
    setResult(
      covered
        ? { ok: true, text: `Yes, we cover ${borough}${zip ? ` (${zip})` : ""}. Call or text us and we'll give you an arrival time.` }
        : borough
          ? { ok: false, text: `${borough} isn't on our usual list, but call or text us and we'll tell you straight away.` }
          : { ok: false, text: `We couldn't find "${q}". Try your 5-digit ZIP code, or call or text us and we'll tell you straight away.` },
    );
  };

  return (
    <form onSubmit={check} className="grid gap-3" noValidate>
      <label htmlFor="area" className="font-semibold">
        Check your area
      </label>
      <div className="flex gap-2">
        <input
          id="area"
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="ZIP code or neighborhood"
          autoComplete="postal-code"
          inputMode="text"
          className="min-h-[52px] min-w-0 flex-1 rounded-sm border-[1.5px] border-[#9aa6a2] bg-surface px-4 text-[1.0625rem] focus:border-2 focus:border-water focus:outline-none focus:ring-[3px] focus:ring-water/20"
        />
        <button type="submit" className="btn shrink-0">
          Check
        </button>
      </div>
      <p aria-live="polite" className={`min-h-6 text-[0.95rem] ${result ? (result.ok ? "font-medium text-water" : "text-muted") : ""}`}>
        {result?.text}
      </p>
    </form>
  );
}
