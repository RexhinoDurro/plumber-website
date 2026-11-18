import type { Metadata } from "next";
import { site } from "@/content/site";
import { PageHead } from "@/components/PageHead";
import { QuoteForm } from "@/components/QuoteForm";
import { PhoneIcon } from "@/components/Icons";
import { Photo } from "@/components/Photo";

export const metadata: Metadata = {
  title: "Contact & quotes",
  description: `Call ${site.name} or request a fixed-price quote for plumbing and heating work in ${site.city}.`,
};

export default function ContactPage() {
  return (
    <>
      <PageHead
        image="kitchen-sink-leak"
        label="Contact"
        title="Tell us what's wrong. We'll tell you what it costs."
        lede="Leaking now? Call, it's quicker. For everything else, the form below gets you a fixed price."
      />
      <div className="wrap grid items-start gap-12 pb-32 pt-16 lg:grid-cols-[1.15fr_0.85fr] lg:gap-16">
        <QuoteForm />
        <aside className="grid gap-10" aria-label="Contact details">
          <div className="on-dark grid gap-3 rounded-md rounded-tr-elbow bg-ink p-8 text-on-dark">
            <p className="label">Emergency or quick question</p>
            <a
              href={site.phoneHref}
              className="whitespace-nowrap font-display text-[clamp(1.5rem,1.6vw+1rem,2.2rem)] font-extrabold leading-none text-sky no-underline hover:underline [font-stretch:112%]"
            >
              {site.phone}
            </a>
            <p className="text-on-dark-muted">We answer and give you a real arrival time.</p>
            <a href={site.phoneHref} className="btn mt-2 justify-self-start">
              <PhoneIcon /> Call now
            </a>
          </div>

          <div className="grid gap-3 border-t-4 border-brand pt-4">
            <h2 className="text-2xl">Opening hours</h2>
            <dl className="grid grid-cols-[auto_1fr] gap-x-6 gap-y-2">
              {site.hours.map((h) => (
                <div key={h.days} className="contents">
                  <dt className="text-muted">{h.days}</dt>
                  <dd className="m-0 font-semibold">{h.time}</dd>
                </div>
              ))}
            </dl>
          </div>

          <div className="grid gap-3 border-t-4 border-brand pt-4">
            <h2 className="text-2xl">Other ways to reach us</h2>
            <p>
              Email: <a href={`mailto:${site.email}`} className="font-semibold text-water">{site.email}</a>
            </p>
            <p className="text-muted">{site.address}</p>
          </div>

          <Photo id="brass-shower" elbow="br" className="aspect-[16/10]" sizes="(max-width: 1024px) 100vw, 35vw" />

          <div className="grid gap-3 border-t-4 border-brand pt-4">
            <h2 className="text-2xl">Areas we cover</h2>
            <ul className="flex flex-wrap gap-2">
              {site.areas.map((a) => (
                <li key={a} className="rounded-full border-[1.5px] border-line bg-surface px-4 py-2 text-[0.95rem] font-medium">
                  {a}
                </li>
              ))}
            </ul>
          </div>
        </aside>
      </div>
    </>
  );
}
