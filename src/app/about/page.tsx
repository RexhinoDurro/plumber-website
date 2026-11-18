import type { Metadata } from "next";
import { site } from "@/content/site";
import { Photo } from "@/components/Photo";
import { PageHead } from "@/components/PageHead";
import { CtaBand } from "@/components/CtaBand";
import { WorkMarquee } from "@/components/WorkMarquee";

export const metadata: Metadata = {
  title: "About",
  description: `Who we are and how we work. ${site.promise}`,
};

const values = [
  ["One price, agreed first", "You know the cost before we start. If we find something unexpected, we stop and ask.", "pressure-gauge"],
  ["We answer the phone", "A real person, and an honest arrival time rather than an all-day window.", "gloves-tools"],
  ["Clean as we go", "Dust sheets, shoe covers, old parts taken away. Your home is not a building site.", "bathroom"],
  ["Done once, done right", "We fix the cause, not just the symptom, and test every joint before we leave.", "spanner"],
];

export default function AboutPage() {
  return (
    <>
      <PageHead label="About us" title="A local firm that turns up and owns the job." lede={site.promise} image="apartment-fix" />
      <div className="wrap grid items-start gap-12 pb-24 pt-20 md:grid-cols-[1.1fr_0.9fr] md:gap-16">
        <div className="grid gap-6">
          <p className="placeholder-note">
            Placeholder story: replace these two paragraphs with the real one. Who founded the business, when, and why.
            Specific details (a first van, a first big job) do more than adjectives.
          </p>
          <p className="text-xl leading-relaxed">
            [Founder name] started {site.name} in {site.founded} after [years] years working for other firms, and kept seeing
            the same thing: customers who didn&apos;t know what a job would cost until the invoice arrived.
          </p>
          <p className="text-muted">
            So we work the other way round. We find the cause, explain it, agree a price and only then pick up the tools.
            Today we&apos;re [number] plumbers covering {site.city} and the surrounding areas, and most of our work comes from
            people who&apos;ve used us before.
          </p>
          <ul className="mt-4 grid gap-0">
            {[
              ["Licence", site.licence],
              ["Insurance", site.insurance],
              ["Established", site.founded],
              ["Service area", `${site.city} + ${site.areas.length} nearby areas`],
            ].map(([k, v]) => (
              <li key={k} className="flex justify-between gap-4 border-b border-line py-3">
                <span className="text-muted">{k}</span>
                <span className="text-right font-semibold">{v}</span>
              </li>
            ))}
          </ul>
        </div>
        <div className="grid gap-3">
          <Photo id="wrench-wall" elbow="tr" className="aspect-[4/5]" priority />
          <p className="text-xs text-muted">Placeholder photo. Use a real photo of your team or van here.</p>
        </div>
      </div>

      <section className="section bg-surface" aria-labelledby="values-title">
        <div className="wrap">
          <p className="label">How we work</p>
          <h2 id="values-title" className="mb-12 mt-4 max-w-[16ch]">Four promises we keep on every job.</h2>
          <div className="grid gap-x-12 gap-y-10 md:grid-cols-2">
            {values.map(([t, d, img], i) => (
              <div key={t} className="grid gap-4">
                <Photo id={img} elbow={i % 2 ? "tl" : "tr"} className="aspect-[16/9]" sizes="(max-width: 860px) 100vw, 45vw" />
                <div className="border-t-4 border-brand pt-4">
                  <h3 className="mb-2">{t}</h3>
                  <p className="text-muted">{d}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>
      <WorkMarquee />
      <CtaBand />
    </>
  );
}
