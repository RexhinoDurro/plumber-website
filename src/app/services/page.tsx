import type { Metadata } from "next";
import { services, priceFactors } from "@/content/services";
import { site } from "@/content/site";
import { Photo } from "@/components/Photo";
import { PageHead } from "@/components/PageHead";
import { CtaBand } from "@/components/CtaBand";
import { VideoBand } from "@/components/VideoBand";
import { videos, byId } from "@/content/media";
import { LoopVideo } from "@/components/LoopVideo";

export const metadata: Metadata = {
  title: "Services",
  description: `Emergency leaks, blocked drains, bathrooms, kitchens, heating and new pipework in ${site.city}.`,
};

export default function ServicesPage() {
  return (
    <>
      <PageHead
        image="steel-pipes"
        label="Services"
        title="Everything water and heating in your home."
        lede="Every job starts the same way: we find the cause, explain it, and give you one fixed price before any work begins."
      />
      <div className="wrap grid gap-24 pb-32 pt-24">
        {services.map((s, i) => (
          <section
            key={s.slug}
            id={s.slug}
            aria-labelledby={`${s.slug}-title`}
            className="grid scroll-mt-28 items-center gap-6 md:grid-cols-2 md:gap-16"
          >
            <div className={`rv grid gap-5 ${i % 2 ? "md:order-2" : ""}`}>
              <h2 id={`${s.slug}-title`} className="text-[clamp(1.9rem,2.4vw+1rem,3rem)]">{s.title}</h2>
              <p className="lede">{s.body}</p>
              <ul className="brand-list">
                {s.jobs.map((j) => (
                  <li key={j}>{j}</li>
                ))}
              </ul>
              <p className="mt-2 flex flex-wrap items-baseline gap-x-3 gap-y-1 border-t border-line pt-4">
                <span className="font-display text-xl font-extrabold [font-stretch:112%]">{s.price}</span>
                <span className="text-[0.95rem] text-muted">{s.priceNote}</span>
              </p>
            </div>
            {s.video ? (
              <div className={`rv-img photo aspect-[5/4] ${i % 2 ? "rounded-tl-elbow" : "rounded-tr-elbow"}`}>
                <LoopVideo src={byId(s.video).video!} poster={byId(s.video).src} />
              </div>
            ) : (
              <Photo id={s.photo} elbow={i % 2 ? "tl" : "tr"} className="rv-img aspect-[5/4]" />
            )}
          </section>
        ))}
      </div>
      <section className="section bg-surface" aria-labelledby="prices-title">
        <div className="wrap grid gap-12 lg:grid-cols-[0.9fr_1.1fr] lg:gap-16">
          <div className="grid content-start gap-5">
            <p className="label">Price guide</p>
            <h2 id="prices-title" className="max-w-[14ch]">Typical prices, before you call.</h2>
            <p className="lede">
              Every job gets a fixed price once we&apos;ve seen it. These ranges tell you what to expect so there are no
              surprises.
            </p>
            <p className="placeholder-note">Placeholder ranges: fill in your real prices in <code>src/content/services.ts</code>.</p>
            <div>
              <h3 className="mb-3 text-lg">What changes the price</h3>
              <ul className="brand-list text-muted">
                {priceFactors.map((f) => (
                  <li key={f}>{f}</li>
                ))}
              </ul>
            </div>
          </div>
          <table className="w-full border-collapse self-start text-left">
            <caption className="sr-only">Typical price ranges by service</caption>
            <thead>
              <tr className="border-b-2 border-ink text-sm uppercase tracking-[0.06em] text-muted">
                <th scope="col" className="py-3 pr-4 font-semibold">Service</th>
                <th scope="col" className="py-3 text-right font-semibold">Typical price</th>
              </tr>
            </thead>
            <tbody>
              {services.map((s) => (
                <tr key={s.slug} className="border-b border-line align-top">
                  <th scope="row" className="py-4 pr-4 font-normal">
                    <a href={`#${s.slug}`} className="font-semibold text-ink no-underline hover:underline">{s.title}</a>
                    <span className="mt-1 block text-[0.95rem] text-muted">{s.priceNote}</span>
                  </th>
                  <td className="py-4 text-right font-display text-lg sm:whitespace-nowrap font-extrabold [font-stretch:112%]">{s.price}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
      <VideoBand video={videos.gloves} labelledBy="van-title">
        <div className="wrap grid gap-6 py-28 md:py-36">
          <p className="label">On every job</p>
          <h2 id="van-title" className="max-w-[16ch]">The right parts on the van, so most jobs are done in one visit.</h2>
          <p className="lede !text-on-dark-muted">
            Tell us what you see when you call, or send a photo, and we bring the parts it&apos;s likely to need.
          </p>
        </div>
      </VideoBand>
      <CtaBand title="Not sure which service you need?" text="Describe the problem or send a photo. We'll tell you what it is and what it will cost." />
    </>
  );
}
