"use client";

import Link from "next/link";
import { useState } from "react";
import { problems, type Urgency } from "@/content/problems";
import { serviceBySlug } from "@/content/services";
import { site } from "@/content/site";
import { PhoneIcon } from "./Icons";

const urgencyStyle: Record<Urgency, string> = {
  Emergency: "bg-[#b3261e] text-white",
  "Book soon": "bg-brand text-white",
  "Plan ahead": "bg-ink/8 text-ink",
};

/** Symptom-first triage: pick what you see, get urgency, a safe first step and the right next action. */
export function ProblemFinder() {
  const [id, setId] = useState(problems[0].id);
  const p = problems.find((x) => x.id === id)!;
  const svc = serviceBySlug(p.service);

  return (
    <section className="section" aria-labelledby="finder-title">
      <div className="wrap">
        <div className="rv mb-10 grid gap-4">
          <p className="label">What&apos;s happening?</p>
          <h2 id="finder-title" className="max-w-[18ch]">Tell us what you see. We&apos;ll tell you what to do first.</h2>
        </div>

        <div className="grid gap-6 lg:grid-cols-[0.9fr_1.1fr] lg:gap-10">
          <div role="radiogroup" aria-label="Choose what's happening" className="grid content-start gap-2 sm:grid-cols-2 lg:grid-cols-1">
            {problems.map((x) => {
              const on = x.id === id;
              return (
                <button
                  key={x.id}
                  type="button"
                  role="radio"
                  aria-checked={on}
                  onClick={() => setId(x.id)}
                  className={`flex min-h-12 cursor-pointer items-center justify-between gap-3 rounded-sm border-[1.5px] px-4 py-3 text-left text-base font-semibold transition-[background-color,border-color,transform] duration-200 ease-out-soft active:scale-[.99] ${
                    on ? "border-ink bg-ink text-on-dark" : "border-line bg-surface text-ink hover:border-ink/40"
                  }`}
                >
                  {x.label}
                  <span aria-hidden="true" className={`text-lg transition-transform duration-200 ${on ? "translate-x-0.5" : "opacity-40"}`}>
                    →
                  </span>
                </button>
              );
            })}
          </div>

          <div key={p.id} className="finder-panel grid content-start gap-6 rounded-md rounded-tr-elbow bg-surface p-7 shadow-lift md:p-10" aria-live="polite">
            <div className="flex flex-wrap items-center gap-3">
              <span className={`rounded-full px-3 py-1 text-sm font-semibold ${urgencyStyle[p.urgency]}`}>{p.urgency}</span>
              <span className="text-sm text-muted">{p.label}</span>
            </div>
            <div className="grid gap-2">
              <h3 className="text-2xl">Do this first</h3>
              <p className="text-lg">{p.firstStep}</p>
            </div>
            <div className="grid gap-2">
              <h3 className="text-lg">Likely causes</h3>
              <ul className="brand-list text-muted">
                {p.causes.map((c) => (
                  <li key={c}>{c}</li>
                ))}
              </ul>
            </div>
            <div className="flex flex-wrap gap-3 border-t border-line pt-6">
              {p.urgency === "Emergency" ? (
                <a href={site.phoneHref} className="btn">
                  <PhoneIcon /> Call {site.phone} now
                </a>
              ) : (
                <Link href="/contact" className="btn">
                  Get a fixed price
                </Link>
              )}
              {svc && (
                <Link href={`/services/${svc.slug}`} className="btn btn-secondary">
                  About {svc.title.toLowerCase()}
                </Link>
              )}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
