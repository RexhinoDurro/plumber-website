import Link from "next/link";
import { site } from "@/content/site";
import { services } from "@/content/services";

export function Footer() {
  return (
    <footer className="on-dark grain bg-ink text-on-dark-muted text-[0.975rem]">
      <div className="wrap grid grid-cols-2 gap-8 pb-12 pt-24 md:grid-cols-[1.4fr_repeat(3,1fr)]">
        <div className="col-span-2 md:col-span-1 grid gap-4 content-start">
          <p className="font-display text-2xl font-extrabold text-on-dark [font-stretch:125%]">{site.name}</p>
          <p className="max-w-[34ch]">{site.promise}</p>
          <a href={site.phoneHref} className="font-display text-2xl font-extrabold text-sky no-underline hover:underline [font-stretch:125%]">
            {site.phone}
          </a>
        </div>
        <FooterCol title="Services">
          {services.map((s) => (
            <li key={s.slug}>
              <Link href={`/services/${s.slug}`}>{s.title}</Link>
            </li>
          ))}
        </FooterCol>
        <FooterCol title="Company">
          <li><Link href="/emergency">Emergency help</Link></li>
          <li><Link href="/gallery">Our work</Link></li>
          <li><Link href="/areas">Areas we cover</Link></li>
          <li><Link href="/buildings">For building managers</Link></li>
          <li><Link href="/accessibility">Accessibility</Link></li>
          <li><Link href="/about">About</Link></li>
          <li><Link href="/contact">Get a quote</Link></li>
        </FooterCol>
        <FooterCol title="Hours">
          {site.hours.map((h) => (
            <li key={h.days}>
              <span className="text-on-dark">{h.days}</span> · {h.time}
            </li>
          ))}
        </FooterCol>
      </div>
      <div className="wrap overflow-hidden" aria-hidden="true">
        <p className="select-none whitespace-nowrap pb-4 font-display text-[clamp(3rem,12vw,10.5rem)] font-extrabold leading-[0.85] tracking-[-0.04em] text-on-dark opacity-[0.08] [font-stretch:125%]">
          {site.shortName}
        </p>
      </div>
      <div className="wrap flex flex-wrap justify-between gap-3 border-t border-on-dark/12 py-6 text-sm">
        <p>© {site.name} · {site.licence} · {site.insurance}</p>
        <p>
          Gallery photos are our own jobs · <Link href="/credits">Stock photo credits</Link>
        </p>
      </div>
    </footer>
  );
}

function FooterCol({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div>
      <h2 className="mb-4 font-body text-[0.8125rem] font-semibold uppercase tracking-[0.06em] text-sky [font-stretch:100%]">
        {title}
      </h2>
      <ul className="grid gap-2 [&_a]:text-on-dark [&_a]:no-underline [&_a:hover]:underline">{children}</ul>
    </div>
  );
}
