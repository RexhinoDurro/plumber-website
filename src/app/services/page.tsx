import type { Metadata } from "next";
import { services } from "@/content/services";
import { site } from "@/content/site";
import { Photo } from "@/components/Photo";
import { PageHead } from "@/components/PageHead";
import { CtaBand } from "@/components/CtaBand";
import { VideoBand } from "@/components/VideoBand";
import { videos } from "@/content/media";

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
            <div className={`grid gap-5 ${i % 2 ? "md:order-2" : ""}`}>
              <h2 id={`${s.slug}-title`} className="text-[clamp(1.9rem,2.4vw+1rem,3rem)]">{s.title}</h2>
              <p className="lede">{s.body}</p>
              <ul className="brand-list">
                {s.jobs.map((j) => (
                  <li key={j}>{j}</li>
                ))}
              </ul>
            </div>
            <Photo id={s.photo} elbow={i % 2 ? "tl" : "tr"} className="aspect-[5/4]" />
          </section>
        ))}
      </div>
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
