import type { Metadata } from "next";
import Link from "next/link";
import { site } from "@/content/site";
import { services } from "@/content/services";
import { PageHead } from "@/components/PageHead";
import { AreaChecker } from "@/components/AreaChecker";
import { MapEmbed } from "@/components/MapEmbed";
import { EmergencyCta } from "@/components/EmergencyCta";
import { PhoneIcon } from "@/components/Icons";

export const metadata: Metadata = {
  title: "Areas we cover",
  description: `Plumbing and heating across ${site.city} and nearby: ${site.areas.join(", ")}. Emergency call-outs 24/7.`,
};

export default function AreasPage() {
  return (
    <>
      <PageHead
        image="apartment-fix"
        label="Areas we cover"
        title={`Plumbers across ${site.city} and nearby.`}
        lede={`Check your area below. For emergencies we're usually with you within ${site.emergencyArrival}, and we'll give you an honest arrival time on the phone.`}
      />

      <section className="section" aria-labelledby="map-title">
        <div className="wrap grid gap-12 lg:grid-cols-[0.9fr_1.1fr] lg:gap-16">
          <div className="grid content-start gap-6">
            <h2 id="map-title" className="text-[clamp(1.75rem,2vw+1rem,2.5rem)]">Where we work</h2>
            <ul className="grid gap-2 sm:grid-cols-2">
              {site.areas.map((a) => (
                <li key={a} className="flex items-center gap-3 rounded-sm border-[1.5px] border-line bg-surface px-4 py-3 font-medium">
                  <svg viewBox="0 0 24 24" className="size-5 shrink-0 text-brand" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
                    <path d="M12 21s-6.5-5.6-6.5-11a6.5 6.5 0 0 1 13 0c0 5.4-6.5 11-6.5 11Z" strokeLinejoin="round" />
                    <circle cx="12" cy="10" r="2.3" />
                  </svg>
                  {a}
                </li>
              ))}
            </ul>
            <AreaChecker />
            <p className="placeholder-note max-w-[60ch]">
              Placeholder areas: list the real towns and districts you cover in <code>src/content/site.ts</code>. When you have
              photos and jobs from a town, it can get its own page.
            </p>
          </div>
          <MapEmbed className="min-h-[360px] lg:min-h-[520px]" />
        </div>
      </section>

      <section className="section bg-surface pt-16" aria-labelledby="area-services-title">
        <div className="wrap grid gap-8">
          <h2 id="area-services-title" className="text-[clamp(1.75rem,2vw+1rem,2.5rem)]">What we do in every area</h2>
          <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {services.map((s) => (
              <li key={s.slug}>
                <Link href={`/services/${s.slug}`} className="lift grid gap-1 rounded-md border-[1.5px] border-line p-5 text-ink no-underline hover:border-brand">
                  <b className="font-display text-lg [font-stretch:110%]">{s.title}</b>
                  <span className="text-[0.95rem] text-muted">{s.short}</span>
                </Link>
              </li>
            ))}
          </ul>
          <div className="flex flex-wrap gap-3">
            <a href={site.phoneHref} className="btn">
              <PhoneIcon /> Call {site.phone}
            </a>
            <Link href="/contact" className="btn btn-secondary">
              Get a fixed price
            </Link>
          </div>
        </div>
      </section>
      <EmergencyCta />
    </>
  );
}
