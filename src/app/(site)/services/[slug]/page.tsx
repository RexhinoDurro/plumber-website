import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { services, serviceBySlug } from "@/content/services";
import { site } from "@/content/site";
import { byId } from "@/content/media";
import { PageHead } from "@/components/PageHead";
import { Photo } from "@/components/Photo";
import { LoopVideo } from "@/components/LoopVideo";
import { CtaBand } from "@/components/CtaBand";
import { PhoneIcon } from "@/components/Icons";
import { FaqJsonLd, ServiceJsonLd } from "@/components/JsonLd";

export function generateStaticParams() {
  return services.map((s) => ({ slug: s.slug }));
}

export async function generateMetadata({ params }: PageProps<"/services/[slug]">): Promise<Metadata> {
  const { slug } = await params;
  const s = serviceBySlug(slug);
  if (!s) return {};
  return { title: `${s.title} in ${site.city}`, description: s.short };
}

const process = [
  ["Call or send photos", "Tell us what's happening; urgent jobs get an honest arrival time."],
  ["Fixed price, agreed first", "We find the cause and agree one price before any work."],
  ["Done tidily, tested", "Dust sheets down, every joint tested in front of you."],
];

export default async function ServicePage({ params }: PageProps<"/services/[slug]">) {
  const { slug } = await params;
  const s = serviceBySlug(slug);
  if (!s) notFound();
  const related = services.filter((x) => x.slug !== s.slug).slice(0, 3);
  const media = s.video ? byId(s.video) : null;

  return (
    <>
      <ServiceJsonLd name={s.title} description={s.short} slug={s.slug} />
      <FaqJsonLd items={s.faqs} />
      <nav aria-label="Breadcrumb" className="wrap pt-6 text-sm text-muted">
        <ol className="flex flex-wrap gap-2">
          <li><Link href="/" className="text-muted">Home</Link> /</li>
          <li><Link href="/services" className="text-muted">Services</Link> /</li>
          <li aria-current="page" className="font-semibold text-ink">{s.title}</li>
        </ol>
      </nav>
      <PageHead image={s.photo} label={`${s.title} · ${site.city}`} title={s.short} lede={s.body} />

      <div className="wrap grid gap-12 py-20 lg:grid-cols-[1.2fr_0.8fr] lg:gap-16">
        <div className="grid content-start gap-12">
          <section aria-labelledby="included-title" className="rv grid gap-5">
            <h2 id="included-title" className="text-[clamp(1.75rem,2vw+1rem,2.5rem)]">What we handle</h2>
            <ul className="grid gap-3 sm:grid-cols-2">
              {s.jobs.map((j) => (
                <li key={j} className="rounded-sm border-l-4 border-brand bg-surface px-5 py-4 font-semibold shadow-hair">{j}</li>
              ))}
            </ul>
          </section>

          <div className="rv-img aspect-[16/9] overflow-hidden rounded-md rounded-tl-elbow bg-photo">
            {media?.video ? <LoopVideo src={media.video} poster={media.src} /> : <Photo id={s.photo} className="h-full" />}
          </div>

          <section aria-labelledby="process-title" className="grid gap-5">
            <h2 id="process-title" className="rv text-[clamp(1.75rem,2vw+1rem,2.5rem)]">How the job goes</h2>
            <ol className="rv-stagger grid gap-4 md:grid-cols-3">
              {process.map(([t, d], i) => (
                <li key={t} className="grid content-start gap-2 border-t-4 border-brand pt-4">
                  <span className="font-display text-sm font-extrabold text-brand-deep [font-stretch:125%]">Step {i + 1}</span>
                  <h3 className="text-lg">{t}</h3>
                  <p className="text-[0.975rem] text-muted">{d}</p>
                </li>
              ))}
            </ol>
          </section>

          <section aria-labelledby="sfaq-title" className="grid gap-4">
            <h2 id="sfaq-title" className="text-[clamp(1.75rem,2vw+1rem,2.5rem)]">Common questions</h2>
            <div className="faq">
              {s.faqs.map((f) => (
                <details key={f.q}>
                  <summary>{f.q}</summary>
                  <p className="max-w-[62ch] pb-6 text-muted">{f.a}</p>
                </details>
              ))}
            </div>
          </section>
        </div>

        <aside className="grid content-start gap-6 lg:sticky lg:top-28" aria-label="Price and contact">
          <div className="on-dark grid gap-4 rounded-md rounded-tr-elbow bg-ink p-8 text-on-dark">
            <p className="label">Typical price</p>
            <p className="font-display text-3xl font-extrabold [font-stretch:112%]">{s.price}</p>
            <p className="text-on-dark-muted">{s.priceNote}</p>
            <p className="text-sm text-on-dark-muted">The exact price is agreed before we start.</p>
            <a href={site.phoneHref} className="btn mt-2"><PhoneIcon /> Call {site.phone}</a>
            <Link href="/contact" className="btn btn-secondary">Get a fixed-price quote</Link>
          </div>
          <div className="grid gap-2 rounded-md bg-surface p-6 shadow-hair">
            <p className="font-semibold">{site.licence}</p>
            <p className="text-[0.95rem] text-muted">{site.insurance}</p>
          </div>
        </aside>
      </div>

      <section className="section bg-surface pt-16" aria-labelledby="related-title">
        <div className="wrap">
          <h2 id="related-title" className="rv mb-8 text-[clamp(1.75rem,2vw+1rem,2.5rem)]">Related services</h2>
          <div className="rv-stagger grid gap-6 md:grid-cols-3">
            {related.map((r) => (
              <Link key={r.slug} href={`/services/${r.slug}`} className="lift group grid overflow-hidden rounded-md bg-bg text-ink no-underline shadow-hair">
                <Photo id={r.photo} className="aspect-[16/9] rounded-none" sizes="(max-width: 768px) 100vw, 33vw" />
                <div className="grid gap-1 p-6">
                  <h3 className="group-hover:text-water">{r.title}</h3>
                  <p className="text-[0.975rem] text-muted">{r.short}</p>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>
      <CtaBand />
    </>
  );
}
