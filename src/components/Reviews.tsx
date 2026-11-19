import { site } from "@/content/site";
import { getReviews } from "@/lib/content";
import { Rating } from "./Rating";

/** Customer reviews published from the dashboard (with consent). Placeholders until there are real ones. */
export async function Reviews() {
  const items = await getReviews();
  return (
    <section className="section" aria-labelledby="reviews-title">
      <div className="wrap">
        <div className="rv mb-12 grid items-end gap-4 md:grid-cols-[1fr_auto]">
          <div className="grid gap-4">
            <p className="label">What customers say</p>
            <h2 id="reviews-title" className="max-w-[16ch]">Ask our neighbours.</h2>
          </div>
          <div className="grid justify-items-start gap-1 md:justify-items-end">
            <Rating />
            <a href={site.reviewsUrl} className="text-[0.9375rem] font-semibold text-water">
              Read all our reviews on Google
            </a>
          </div>
          {items.some((t) => t.placeholder) && (
            <p className="placeholder-note max-w-[60ch] md:col-span-2">
              Placeholder reviews: add real ones (with the customer&apos;s OK) in the dashboard under Reviews, and your Google rating
              in <code>src/content/site.ts</code>. Never publish invented ones.
            </p>
          )}
        </div>
        <div className="rv-stagger grid gap-6 md:grid-cols-[1.3fr_1fr_1fr]">
          {items.map((t, i) => (
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
                <a href={t.sourceUrl ?? site.reviewsUrl} className={i === 0 ? "text-on-dark" : "text-water"}>
                  {t.source} review
                </a>
              </figcaption>
            </figure>
          ))}
        </div>
      </div>
    </section>
  );
}
