import Link from "next/link";
import { site } from "@/content/site";
import { services } from "@/content/services";
import { Logo } from "./Logo";

export function Footer() {
  return (
    <footer className="on-dark grain bg-ink text-on-dark-muted text-[0.975rem]">
      <div className="wrap grid grid-cols-2 gap-8 pb-12 pt-24 md:grid-cols-[1.4fr_repeat(3,1fr)]">
        <div className="col-span-2 md:col-span-1 grid gap-4 content-start">
          <Link href="/" aria-label={`${site.name}, home`} className="-ml-1 justify-self-start">
            <Logo className="h-auto w-[180px]" />
          </Link>
          <p className="max-w-[34ch]">{site.promise}</p>
          <a href={site.phoneHref} className="tap justify-self-start font-display text-2xl font-extrabold text-sky no-underline hover:underline [font-stretch:125%]">
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
              <span className="text-on-dark">{h.days}</span> · <span className="whitespace-nowrap">{h.time}</span>
            </li>
          ))}
        </FooterCol>
      </div>
      <div className="wrap flex flex-wrap justify-between gap-3 border-t border-on-dark/12 py-6 pr-[84px] text-sm md:pr-[clamp(20px,4vw,40px)]">
        <p>© {site.name} · {site.licence} · {site.insurance}</p>
        <p>Gallery photos are our own jobs</p>
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
