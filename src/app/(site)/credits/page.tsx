import type { Metadata } from "next";
import Link from "next/link";
import { hero, photos, showcase, videos } from "@/content/media";

export const metadata: Metadata = {
  title: "Photo & video credits",
  description: "Where the stock photos and videos on this site come from.",
  robots: { index: false },
};

/** Pexels doesn't require credit, but we give it. Our own job photos (the gallery) need none. */
export default function CreditsPage() {
  const items = [
    { what: "Home page video", credit: hero.credit, url: hero.creditUrl },
    { what: "“Watch a job” video", credit: showcase.credit, url: showcase.creditUrl },
    ...Object.values(videos).map((v) => ({ what: "Background video", credit: v.credit, url: v.creditUrl })),
    ...photos.map((p) => ({ what: p.title, credit: p.credit, url: p.creditUrl })),
  ];
  const unique = items.filter((x, i) => items.findIndex((y) => y.url === x.url && y.what === x.what) === i);
  return (
    <section className="section">
      <div className="wrap grid max-w-[72ch] gap-6">
        <p className="label">Credits</p>
        <h1>Photo &amp; video credits</h1>
        <p>
          The photos in our <Link href="/gallery">gallery</Link> and under “Recent work” are our own jobs. Some other photos and videos on
          this site are free stock from <a href="https://www.pexels.com">Pexels</a>, used under the{" "}
          <a href="https://www.pexels.com/license/">Pexels License</a> (free for commercial use). We thank the people who made them:
        </p>
        <ul className="grid list-disc gap-1.5 pl-5 text-[0.95rem]">
          {unique.map((x) => (
            <li key={x.what + x.url}>
              {x.what}: <a href={x.url}>{x.credit === "Pexels" ? "Pexels" : `${x.credit} on Pexels`}</a>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
