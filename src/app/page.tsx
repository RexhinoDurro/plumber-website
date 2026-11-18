import Link from "next/link";
import { site, testimonials, faqs, audiences, guarantees, accreditations } from "@/content/site";
import { services } from "@/content/services";
import { hero, byId, videos } from "@/content/media";
import { VideoBand } from "@/components/VideoBand";
import { Photo } from "@/components/Photo";
import { CtaBand } from "@/components/CtaBand";
import { PhoneIcon } from "@/components/Icons";
import { QuickQuote } from "@/components/QuickQuote";
import { VideoShowcase } from "@/components/VideoShowcase";

const steps = [
  {
    title: "Call, or send us photos",
    text: "Tell us what's happening. For anything urgent we give you an honest arrival time on the phone, not a vague window.",
    photo: "gloves-tools",
  },
  {
    title: "You get a fixed price",
    text: "We find the cause, explain it in plain words and give you one price. If something unexpected turns up, we stop and ask first.",
    photo: "pressure-gauge",
  },
  {
    title: "We do the job, tidily",
    text: "Dust sheets down, shoes covered, old parts taken away. The room is left as we found it, or cleaner.",
    photo: "spanner",
  },
  {
    title: "We test it in front of you",
    text: "Every joint is checked under pressure before we leave, and you see it working. Then you pay, not before.",
    photo: "shower-flow",
  },
];

export default function Home() {
  const [big, ...rest] = services;
  const mids = [services[2], services[4]]; // bathrooms, heating
  const smalls = rest.filter((s) => !mids.includes(s));

  return (
    <>
      {/* ===== Hero ===== */}
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
            <p className="label">Plumbing &amp; heating · {site.city}</p>
            <h1 id="hero-title" className="max-w-[15ch] text-[clamp(2.6rem,4.4vw+0.6rem,5rem)]">
              <span className="line-mask hero-line"><span>Plumbing fixed properly.</span></span>
              <span className="line-mask hero-line"><span className="text-sky">Priced before we start.</span></span>
            </h1>
            <p className="lede hero-fade d1 !text-on-dark-muted">
              For homeowners and landlords in {site.city}: leaks, blocked drains, bathrooms, kitchens and boilers. One call,
              an honest arrival time, and a fixed price before any work begins.
            </p>
            <div className="hero-fade d2 flex flex-wrap items-center gap-3">
              <a href={site.phoneHref} className="btn">
                <PhoneIcon /> Call {site.phone}
              </a>
              <Link href="/services" className="btn btn-secondary">
                See our services
              </Link>
            </div>
          </div>
          <div className="hero-fade d3">
            <QuickQuote />
          </div>
        </div>
      </section>


      {/* ===== Proof strip ===== */}
      <section aria-label="Why people choose us" className="border-b border-line bg-surface">
        <ul className="wrap grid grid-cols-2 gap-x-6 gap-y-5 py-7 lg:grid-cols-4">
          {[
            ["Google reviews", "[Rating] from [N] reviews (add yours)", ""],
            ["Fixed price", "Agreed before any work starts", ""],
            ["Licensed & insured", site.licence, ""],
            [`Since ${site.founded}`, `Local to ${site.city}`, ""],
          ].map(([big, small]) => (
            <li key={big} className="grid gap-0.5 border-l-4 border-brand pl-4">
              <span className="font-display text-xl font-extrabold text-ink [font-stretch:112%]">{big}</span>
              <span className="text-[0.95rem] text-muted">{small}</span>
            </li>
          ))}
        </ul>
      </section>

      {/* ===== Services bento ===== */}
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
        </div>
      </section>


      {/* ===== Two audiences ===== */}
      <section className="section pt-0" aria-labelledby="who-title">
        <div className="wrap">
          <h2 id="who-title" className="sr-only">Who we work for</h2>
          <div className="rv-stagger grid gap-6 md:grid-cols-2">
            {audiences.map((a, i) => (
              <article key={a.id} className="lift grid overflow-hidden rounded-md bg-surface shadow-hair">
                <Photo id={a.photo} elbow={i ? "tl" : "tr"} className="aspect-[16/8] rounded-none" sizes="(max-width: 860px) 100vw, 50vw" />
                <div className="grid gap-4 p-7 md:p-8">
                  <h3 className="text-[1.75rem]">{a.title}</h3>
                  <p className="text-muted">{a.text}</p>
                  <ul className="brand-list">
                    {a.points.map((pt) => (
                      <li key={pt}>{pt}</li>
                    ))}
                  </ul>
                  <Link href="/contact" className="btn btn-secondary mt-2 justify-self-start">
                    {a.cta}
                  </Link>
                </div>
              </article>
            ))}
          </div>
        </div>
      </section>

      {/* ===== Reviews ===== */}
      <section className="section pt-0" aria-labelledby="reviews-title">
        <div className="wrap">
          <div className="rv mb-12 grid gap-4">
            <p className="label">What customers say</p>
            <h2 id="reviews-title" className="max-w-[16ch]">Ask our neighbours.</h2>
            {testimonials.some((t) => t.placeholder) && (
              <p className="placeholder-note max-w-[60ch]">
                Placeholder reviews: replace them with real customer reviews in <code>src/content/site.ts</code>. Never publish
                invented ones.
              </p>
            )}
          </div>
          <div className="rv-stagger grid gap-6 md:grid-cols-[1.3fr_1fr_1fr]">
            {testimonials.map((t, i) => (
              <figure
                key={i}
                className={`m-0 grid content-between gap-6 rounded-md p-8 shadow-hair ${
                  i === 0 ? "on-dark bg-water text-on-dark" : "bg-surface"
                }`}
              >
                <blockquote
                  className={i === 0 ? "font-display text-2xl font-bold leading-snug [font-stretch:112%]" : "text-[1.0625rem]"}
                >
                  {t.quote}
                </blockquote>
                <figcaption className={`text-[0.9375rem] ${i === 0 ? "text-on-dark" : "text-muted"}`}>
                  <b className={`block ${i === 0 ? "" : "text-ink"}`}>{t.name}</b>
                  {t.job} · {t.place} ·{" "}
                  <a href={site.reviewsUrl} className={i === 0 ? "text-on-dark" : "text-water"}>
                    {t.source} review
                  </a>
                </figcaption>
              </figure>
            ))}
          </div>
        </div>
      </section>

      {/* ===== Promise: full-bleed video band ===== */}
      <VideoBand video={videos.shower} labelledBy="promise-title">
        <div className="wrap grid gap-10 py-28 md:py-36">
          <p className="label">Our promise</p>
          <h2 id="promise-title" className="max-w-[17ch] text-[clamp(2.2rem,4.5vw+0.5rem,4.5rem)]">
            {site.promise}
          </h2>
          <dl className="grid max-w-3xl gap-6 border-t border-on-dark/20 pt-8 sm:grid-cols-3">
            {[
              ["Price", "Agreed before any work"],
              ["Arrival", "An honest time, not a window"],
              ["Finish", "Tested in front of you"],
            ].map(([k, v]) => (
              <div key={k}>
                <dt className="font-display text-2xl font-extrabold text-sky [font-stretch:125%]">{k}</dt>
                <dd className="m-0 mt-1 text-on-dark-muted">{v}</dd>
              </div>
            ))}
          </dl>
        </div>
      </VideoBand>

      {/* ===== How it works: the blue pipe line ===== */}
      <section className="section blueprint" aria-labelledby="how-title">
        <div className="wrap">
          <div className="rv mb-16 grid gap-4">
            <p className="label">How a job works</p>
            <h2 id="how-title" className="max-w-[18ch]">No surprises on the bill, no mess left behind.</h2>
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

      {/* ===== Guarantees + accreditations ===== */}
      <section className="section on-dark grain bg-ink text-on-dark" aria-labelledby="guarantee-title">
        <div className="wrap grid gap-14">
          <div className="rv grid gap-4 md:grid-cols-[1fr_1fr] md:items-end md:gap-16">
            <div className="grid gap-4">
              <p className="label">Our guarantee</p>
              <h2 id="guarantee-title" className="max-w-[13ch]">Guaranteed, in writing.</h2>
            </div>
            <p className="lede !text-on-dark-muted">
              Every job comes with a written guarantee on the invoice. If something we fixed fails, we come back.
            </p>
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

      <VideoShowcase />

      {/* ===== Emergency band ===== */}
      <VideoBand video={videos.drip} align="full" labelledBy="emergency-title" className="section">
        <div className="wrap grid items-center gap-12 md:grid-cols-[1.1fr_0.9fr] md:gap-16">
          <div>
            <p className="label">Leak right now?</p>
            <h2 id="emergency-title" className="mt-4 max-w-[14ch]">Do these four things, then call us.</h2>
            <a
              href={site.phoneHref}
              className="mt-4 mb-6 inline-block font-display text-[clamp(2rem,4vw+0.5rem,3.75rem)] font-extrabold leading-none tracking-[-0.02em] text-sky no-underline decoration-[3px] hover:underline [font-stretch:125%]"
            >
              {site.phone}
            </a>
            <p className="lede !text-on-dark-muted">
              We answer, tell you what to do while we&apos;re on the way, and give you a real arrival time.
            </p>
          </div>
          <ol className="grid gap-0">
            {[
              ["Turn off the water", "Find the stopcock, usually under the kitchen sink, and turn it clockwise."],
              ["Switch off nearby electrics", "If water is near sockets or lights, turn them off at the fuse box."],
              ["Catch and photograph it", "Buckets and towels down. A photo helps us bring the right parts."],
              ["Call us", "Tell us what you see. We'll take it from there."],
            ].map(([b, s], i) => (
              <li key={b} className="grid grid-cols-[40px_1fr] gap-4 border-t border-on-dark/15 py-4">
                <span className="font-display text-2xl font-extrabold leading-none text-sky [font-stretch:125%]">{i + 1}</span>
                <span>
                  <b className="block font-semibold">{b}</b>
                  <span className="text-base text-on-dark-muted">{s}</span>
                </span>
              </li>
            ))}
          </ol>
        </div>
      </VideoBand>

      {/* ===== Recent work ===== */}
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
          <div className="grid auto-rows-[160px] grid-cols-12 gap-4 md:auto-rows-[190px]">
            {[
              ["bathroom", "col-span-12 row-span-2 md:col-span-7", "tl"],
              ["radiator-pipe", "col-span-6 md:col-span-5", "none"],
              ["kitchen-sink-leak", "col-span-6 md:col-span-5", "none"],
              ["steel-pipes", "col-span-12 md:col-span-4", "none"],
              ["brass-shower", "col-span-12 md:col-span-8", "br"],
            ].map(([id, cls, elbow]) => (
              <figure key={id} className={`lift relative m-0 ${cls}`}>
                <Photo
                  id={id}
                  elbow={elbow as "tl" | "br" | "none"}
                  className="rv-img h-full"
                  sizes="(max-width: 760px) 100vw, 60vw"
                />
                <figcaption className="absolute bottom-3 left-3 rounded-full bg-surface px-3 py-1 text-[0.8125rem] font-semibold">
                  {byId(id).title}
                </figcaption>
              </figure>
            ))}
          </div>
        </div>
      </section>

      {/* ===== Areas + FAQ ===== */}
      <section className="section pt-0" aria-labelledby="faq-title">
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
            <p className="text-muted">
              Not sure if we cover you? <Link href="/contact" className="font-semibold text-water">Ask us</Link>.
            </p>
            <Photo id="apartment-fix" elbow="bl" className="rv-img mt-4 aspect-[4/3]" sizes="(max-width: 860px) 100vw, 35vw" />
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

      <CtaBand />
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
      href={`/services#${service.slug}`}
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
