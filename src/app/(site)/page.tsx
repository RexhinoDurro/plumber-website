import Link from "next/link";
import { site, faqs, audiences, guarantees, accreditations, comparison } from "@/content/site";
import { services } from "@/content/services";
import { hero } from "@/content/media";
import { Photo } from "@/components/Photo";
import { PhoneIcon } from "@/components/Icons";
import { Rating } from "@/components/Rating";
import { MapEmbed } from "@/components/MapEmbed";
import { EmergencyCta } from "@/components/EmergencyCta";
import { QuickQuote } from "@/components/QuickQuote";
import { VideoShowcase } from "@/components/VideoShowcase";
import { ProblemFinder } from "@/components/ProblemFinder";
import { AreaChecker } from "@/components/AreaChecker";
import { FaqJsonLd } from "@/components/JsonLd";
import { Reviews } from "@/components/Reviews";
import { RecentWork } from "@/components/RecentWork";

// Exactly three labelled steps: what they do, what we handle, what they get.
const steps = [
  {
    title: "Call, or message us with a photo",
    text: "Tell us what's happening. For anything urgent you get an honest arrival time on the phone, not a vague window.",
    photo: "gloves-tools",
  },
  {
    title: "You get a fixed price before we start",
    text: "We find the cause, explain it in plain words and give you one price. If something unexpected turns up, we stop and ask first.",
    photo: "pressure-gauge",
  },
  {
    title: "Fixed, tested in front of you, cleaned up",
    text: "Dust sheets down, old parts taken away, every joint checked under pressure while you watch. Then you pay, not before.",
    photo: "shower-flow",
  },
];

export default function Home() {
  const [big, ...rest] = services;
  const mids = [services[2], services[4]]; // bathrooms, heating
  const smalls = rest.filter((s) => !mids.includes(s));

  return (
    <>
      {/* ===== 1. Hero: what, where, why trust, how to call, all in the first screen ===== */}
      <section
        className="on-dark relative isolate grid min-h-[min(88svh,820px)] items-end overflow-hidden bg-ink bg-cover bg-center text-on-dark"
        style={{ backgroundImage: `url(${hero.poster})` }}
        aria-labelledby="hero-title"
      >
        <video
          className="hero-media hero-settle absolute inset-0 -z-20 size-full object-cover opacity-45"
          autoPlay
          muted
          loop
          playsInline
          preload="metadata"
          poster={hero.poster}
          aria-hidden="true"
        >
          <source src={hero.video} type="video/mp4" />
        </video>
        <div
          className="absolute inset-0 -z-10"
          style={{
            background:
              "linear-gradient(to top, rgb(10 26 51 / .96) 0%, rgb(10 26 51 / .6) 45%, rgb(10 26 51 / .4) 100%), linear-gradient(to right, rgb(10 26 51 / .75), transparent 70%)",
          }}
        />
        <div className="wrap grid items-end gap-12 pb-14 pt-24 md:pb-16 lg:grid-cols-[1.25fr_0.75fr] lg:gap-16">
          <div className="grid gap-8">
            <p className="label">Plumber &amp; heating engineer · {site.city} · 24/7 emergencies</p>
            <h1 id="hero-title" className="max-w-[15ch] text-[clamp(2.6rem,4.4vw+0.6rem,5rem)]">
              <span className="line-mask hero-line"><span>Plumbing fixed properly.</span></span>
              <span className="line-mask hero-line"><span className="text-sky">Priced before we start.</span></span>
            </h1>
            <p className="lede hero-fade d1 !text-on-dark-muted">
              Leaks, blocked drains, boilers, bathrooms and kitchens across {site.city}. An honest arrival time and one fixed
              price before any work begins.
            </p>
            <div className="hero-fade d2 grid gap-4">
              <div className="flex flex-wrap items-center gap-3">
                <a href={site.phoneHref} className="btn">
                  <PhoneIcon /> Call {site.phone}
                </a>
                <Link href="/contact" className="btn btn-secondary !border-on-dark/60 !text-on-dark hover:!bg-on-dark/10">
                  Get a fixed price
                </Link>
              </div>
              <p className="flex flex-wrap items-center gap-x-4 gap-y-1 text-[0.9375rem] text-on-dark-muted">
                <Rating tone="dark" />
                <span className="inline-flex items-center gap-1.5">
                  <svg viewBox="0 0 24 24" className="size-4 text-sky" fill="none" stroke="currentColor" strokeWidth="2.2" aria-hidden="true">
                    <path d="m5 12.5 4.5 4.5L19 7.5" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                  Licensed &amp; insured
                </span>
                <span className="inline-flex items-center gap-1.5">
                  <svg viewBox="0 0 24 24" className="size-4 text-sky" fill="none" stroke="currentColor" strokeWidth="2.2" aria-hidden="true">
                    <path d="m5 12.5 4.5 4.5L19 7.5" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                  Written guarantee
                </span>
              </p>
            </div>
          </div>
          <div className="hero-fade d3">
            <QuickQuote />
          </div>
        </div>
      </section>


      {/* ===== 2. Trust bar: the doubts people have before calling a stranger ===== */}
      <section aria-label="Why people trust us" className="border-b border-line bg-surface">
        <ul className="wrap grid grid-cols-2 gap-x-6 gap-y-5 py-7 lg:grid-cols-4">
          {[
            [site.rating ? `${site.rating.value.toFixed(1)} on Google` : "Google reviews", site.rating ? `from ${site.rating.count} reviews` : "[Add your rating in site.ts]"],
            ["24/7 emergencies", `Usually there within ${site.emergencyArrival}`],
            ["Licensed & insured", site.licence],
            ["Fixed price", "Agreed before any work starts"],
          ].map(([big, small]) => (
            <li key={big} className="grid gap-0.5 border-l-4 border-brand pl-4">
              <span className="font-display text-xl font-extrabold text-ink [font-stretch:112%]">{big}</span>
              <span className="text-[0.95rem] text-muted">{small}</span>
            </li>
          ))}
        </ul>
      </section>


      {/* ===== 3. Services: in the first two screens ===== */}
      <section className="section" aria-labelledby="services-title">
        <div className="wrap">
          <div className="rv mb-12 grid items-end gap-4 md:grid-cols-[1fr_auto]">
            <div className="grid gap-4">
              <p className="label">What&apos;s the problem?</p>
              <h2 id="services-title" className="max-w-[16ch]">From a dripping tap to a new bathroom.</h2>
            </div>
            <Link href="/services" className="font-semibold text-water">
              All services and what&apos;s included
            </Link>
          </div>

          <div className="rv-stagger grid grid-cols-12 gap-6">
            <ServiceCard service={big} size="big" />
            {mids.map((s) => (
              <ServiceCard key={s.slug} service={s} size="mid" />
            ))}
            {smalls.map((s) => (
              <ServiceCard key={s.slug} service={s} size="small" />
            ))}
          </div>

          <ul className="mt-6 grid gap-4 md:grid-cols-2" aria-label="Who we work for">
            {audiences.map((a) => (
              <li key={a.id}>
                <Link
                  href="/contact"
                  className="lift group flex items-center gap-5 rounded-md border-[1.5px] border-line bg-surface p-5 text-ink no-underline hover:border-brand"
                >
                  <Photo id={a.photo} className="size-20 shrink-0 rounded-sm" sizes="80px" />
                  <span className="grid gap-1">
                    <b className="font-display text-lg font-bold [font-stretch:110%] group-hover:text-water">{a.title}</b>
                    <span className="text-[0.95rem] text-muted">{a.points[0]}</span>
                  </span>
                  <span className="ml-auto text-xl text-brand transition-transform duration-200 group-hover:translate-x-1" aria-hidden="true">
                    →
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        </div>
      </section>


      {/* ===== 4. "What's happening?" finder: the problem section ===== */}
      <ProblemFinder />


      {/* ===== 5. Why us: an honest comparison + the guarantee ===== */}
      <section className="section on-dark grain bg-ink text-on-dark" aria-labelledby="why-title">
        <div className="wrap grid gap-14">
          <div className="rv grid gap-4 md:grid-cols-[1fr_1fr] md:items-end md:gap-16">
            <div className="grid gap-4">
              <p className="label">Why people choose us</p>
              <h2 id="why-title" className="max-w-[14ch]">What to expect when we come round.</h2>
            </div>
            <p className="lede !text-on-dark-muted">
              Most bad experiences with tradespeople come down to the same few things. Here&apos;s how we handle each one.
            </p>
          </div>

          <div className="rv overflow-hidden rounded-md ring-1 ring-on-dark/15">
            <table className="w-full border-collapse text-left">
              <caption className="sr-only">How we work compared with what too often happens</caption>
              <thead>
                <tr className="text-[0.8125rem] uppercase tracking-[0.06em] text-on-dark-muted">
                  <th scope="col" className="hidden w-[18%] px-6 py-4 font-semibold md:table-cell"><span className="sr-only">Topic</span></th>
                  <th scope="col" className="bg-brand/25 px-5 py-4 font-semibold text-white md:px-6">With {site.shortName}</th>
                  <th scope="col" className="px-5 py-4 font-semibold md:px-6">Too often elsewhere</th>
                </tr>
              </thead>
              <tbody>
                {comparison.map((c) => (
                  <tr key={c.topic} className="border-t border-on-dark/12 align-top">
                    <th scope="row" className="hidden px-6 py-4 font-display font-bold text-white [font-stretch:110%] md:table-cell">{c.topic}</th>
                    <td className="bg-brand/15 px-5 py-4 md:px-6">
                      <span className="flex gap-2.5">
                        <svg viewBox="0 0 24 24" className="mt-0.5 size-5 shrink-0 text-[#6fd39b]" fill="none" stroke="currentColor" strokeWidth="2.4" aria-hidden="true">
                          <path d="m5 12.5 4.5 4.5L19 7.5" strokeLinecap="round" strokeLinejoin="round" />
                        </svg>
                        <span><span className="block text-[0.75rem] font-semibold uppercase tracking-[0.06em] text-sky md:hidden">{c.topic}</span>{c.us}</span>
                      </span>
                    </td>
                    <td className="px-5 py-4 text-on-dark-muted md:px-6">
                      <span className="flex gap-2.5">
                        <svg viewBox="0 0 24 24" className="mt-0.5 size-5 shrink-0 opacity-60" fill="none" stroke="currentColor" strokeWidth="2.2" aria-hidden="true">
                          <path d="M7 7l10 10M17 7 7 17" strokeLinecap="round" />
                        </svg>
                        <span>{c.them}</span>
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <ul className="rv-stagger grid gap-8 md:grid-cols-3">
            {guarantees.map((g) => (
              <li key={g.title} className="grid content-start gap-3 border-t-2 border-sky/60 pt-5">
                <svg viewBox="0 0 24 24" className="size-7 text-sky" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                  <path d="M12 3 4.5 6v5.5c0 4.6 3.2 8.4 7.5 9.5 4.3-1.1 7.5-4.9 7.5-9.5V6L12 3Z" />
                  <path d="m8.8 12.2 2.2 2.2 4.4-4.6" />
                </svg>
                <h3 className="text-xl">{g.title}</h3>
                <p className="text-on-dark-muted">{g.text}</p>
              </li>
            ))}
          </ul>
          <div className="grid gap-4 border-t border-on-dark/15 pt-8">
            <p className="text-sm font-semibold uppercase tracking-[0.06em] text-on-dark-muted">Members and registrations</p>
            <ul className="flex flex-wrap gap-3">
              {accreditations.map((a) => (
                <li key={a} className="rounded-sm border border-dashed border-on-dark/30 px-5 py-3 text-[0.95rem] text-on-dark-muted">
                  {a}
                </li>
              ))}
            </ul>
            <p className="text-sm text-on-dark-muted">
              Placeholders: add your real memberships and the guarantee length in <code>src/content/site.ts</code>.
            </p>
          </div>
        </div>
      </section>

      {/* ===== 6. Recent work + one "watch a job" video ===== */}
      <section className="section bg-surface" aria-labelledby="work-title">
        <div className="wrap">
          <div className="rv mb-12 grid items-end gap-4 md:grid-cols-[1fr_auto]">
            <div className="grid gap-4">
              <p className="label">Recent work</p>
              <h2 id="work-title" className="max-w-[14ch]">Jobs we&apos;re proud of.</h2>
            </div>
            <Link href="/gallery" className="btn btn-secondary">
              See the full gallery
            </Link>
          </div>
          <RecentWork />
          <div className="mt-20 border-t border-line pt-16">
            <VideoShowcase bare />
          </div>
        </div>
      </section>

      {/* ===== 7. Reviews: rating summary, one big quote, short snippets ===== */}
      <Reviews />

      {/* ===== 8. How it works: exactly three labelled steps ===== */}
      <section className="section blueprint" aria-labelledby="how-title">
        <div className="wrap">
          <div className="rv mb-16 grid gap-4">
            <p className="label">What happens when you get in touch</p>
            <h2 id="how-title" className="max-w-[18ch]">Three steps. No surprises on the bill.</h2>
          </div>
          <ol className="pipe-steps relative grid gap-16 pl-12 md:gap-24 md:pl-[72px]">
            <svg
              className="absolute left-0 top-0 h-full w-12 overflow-visible"
              viewBox="0 0 48 1000"
              preserveAspectRatio="none"
              aria-hidden="true"
            >
              <path d="M24 0 V1000" stroke="var(--color-line)" strokeWidth="4" vectorEffect="non-scaling-stroke" fill="none" />
              <path
                className="pipe-flow"
                d="M24 0 V1000"
                pathLength={1}
                stroke="var(--color-brand)"
                strokeWidth="4"
                strokeLinecap="round"
                vectorEffect="non-scaling-stroke"
                fill="none"
              />
            </svg>
            {steps.map((s, i) => (
              <li
                key={s.title}
                className="pipe-node relative grid items-center gap-6 md:grid-cols-2 md:gap-12
                  before:absolute before:-left-9 before:top-1 before:size-6 before:rounded-full before:border-4 before:border-brand before:bg-bg before:content-['']
                  md:before:-left-[60px]"
              >
                <div className={i % 2 ? "md:order-2" : ""}>
                  <p className="font-display text-base font-extrabold tracking-[0.02em] text-brand-deep [font-stretch:125%]">
                    Step {i + 1}
                  </p>
                  <h3 className="mb-3 mt-2 text-[clamp(1.5rem,1.4vw+1rem,2.125rem)]">{s.title}</h3>
                  <p className="max-w-[46ch] text-muted">{s.text}</p>
                </div>
                <Photo id={s.photo} elbow={i % 2 ? "tl" : "tr"} className="rv-img aspect-[16/10]" />
              </li>
            ))}
          </ol>
        </div>
      </section>

      {/* ===== 9. Where we work (map) + FAQ ===== */}
      <section className="section" aria-labelledby="faq-title">
        <div className="wrap grid gap-12 md:grid-cols-[0.8fr_1.2fr] md:gap-16">
          <div className="grid content-start gap-5">
            <p className="label">Where we work</p>
            <h2 className="text-[clamp(1.75rem,2vw+1rem,2.5rem)]">Across {site.city} and nearby.</h2>
            <ul className="flex flex-wrap gap-2">
              {site.areas.map((a) => (
                <li key={a} className="rounded-full border-[1.5px] border-line bg-surface px-4 py-2 text-[0.95rem] font-medium">
                  {a}
                </li>
              ))}
            </ul>
            <AreaChecker />
            <MapEmbed className="mt-2 aspect-[4/3]" />
            <Link href="/areas" className="font-semibold text-water">
              All the areas we cover
            </Link>
          </div>
          <div>
            <h2 id="faq-title" className="mb-6 text-[clamp(1.75rem,2vw+1rem,2.5rem)]">Questions people ask first</h2>
            <div className="faq">
              {faqs.map((f) => (
                <details key={f.q}>
                  <summary>{f.q}</summary>
                  <p className="max-w-[62ch] pb-6 text-muted">{f.a}</p>
                </details>
              ))}
            </div>
          </div>
        </div>
      </section>

      <FaqJsonLd />
      {/* ===== 10. Final call band with the emergency steps ===== */}
      <EmergencyCta />
    </>
  );
}

function ServiceCard({
  service,
  size,
}: {
  service: (typeof services)[number];
  size: "big" | "mid" | "small";
}) {
  const layout = {
    big: "col-span-12 lg:col-span-7 lg:row-span-2 grid-rows-[1fr_auto]",
    mid: "col-span-12 lg:col-span-5 grid-rows-[auto_1fr]",
    small: "col-span-12 sm:col-span-6 lg:col-span-4 grid-rows-[auto_1fr]",
  }[size];
  return (
    <Link
      href={`/services/${service.slug}`}
      className={`lift group grid overflow-hidden rounded-md bg-surface text-ink no-underline shadow-hair transition-transform duration-200 ease-out-soft hover:-translate-y-0.5 ${layout}`}
    >
      <Photo
        id={service.photo}
        className={`rounded-none ${size === "big" ? "min-h-[280px] lg:min-h-[400px]" : size === "mid" ? "aspect-[16/8]" : "aspect-[16/9]"}`}
        sizes="(max-width: 1024px) 100vw, 55vw"
      />
      <div className="grid content-start gap-2 p-6">
        <h3 className={`group-hover:text-water ${size === "big" ? "text-3xl" : ""}`}>{service.title}</h3>
        <p className="text-base text-muted">{service.short}</p>
      </div>
    </Link>
  );
}
