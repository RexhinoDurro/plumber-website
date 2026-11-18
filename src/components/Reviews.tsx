import { site } from "@/content/site";
import { getReviews } from "@/lib/content";

/** Customer reviews published from the dashboard (with consent). Placeholders until there are real ones. */
export async function Reviews() {
  const items = await getReviews();
  return (
    <section className="section pt-0" aria-labelledby="reviews-title">
      <div className="wrap">
        <div className="rv mb-12 grid gap-4">
          <p className="label">What customers say</p>
          <h2 id="reviews-title" className="max-w-[16ch]">Ask our neighbours.</h2>
          {items.some((t) => t.placeholder) && (
            <p className="placeholder-note max-w-[60ch]">
              Placeholder reviews: replace them with real customer reviews in <code>src/content/site.ts</code>. Never publish
              invented ones.
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
