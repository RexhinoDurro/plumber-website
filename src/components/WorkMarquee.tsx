import Image from "next/image";
import Link from "next/link";
import { photos } from "@/content/media";

/** A slow, endless strip of job photos. Pauses on hover/focus; scrollable and static with reduced motion. */
export function WorkMarquee() {
  const items = photos.slice(0, 10);
  return (
    <section className="overflow-hidden bg-surface py-16" aria-labelledby="marquee-title">
      <div className="wrap mb-8 flex flex-wrap items-end justify-between gap-4">
        <h2 id="marquee-title" className="text-[clamp(1.75rem,2vw+1rem,2.5rem)]">A few of this month&apos;s jobs</h2>
        <Link href="/gallery" className="font-semibold text-water">See every job</Link>
      </div>
      <div className="marquee">
        <ul className="marquee-track flex w-max gap-4">
          {[...items, ...items].map((p, i) => (
            <li key={`${p.id}-${i}`} aria-hidden={i >= items.length ? true : undefined} className="w-[260px] shrink-0 md:w-[320px]">
              <div className="relative aspect-[4/3] overflow-hidden rounded-md bg-photo">
                <Image src={p.src} alt={i >= items.length ? "" : p.alt} fill sizes="320px" className="object-cover" />
              </div>
              <p className="mt-2 text-[0.95rem] font-semibold">
                {p.title} <span className="font-normal text-muted">· {p.category}</span>
              </p>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
