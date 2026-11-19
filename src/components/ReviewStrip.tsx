import { site } from "@/content/site";
import { getReviews } from "@/lib/content";
import { Rating } from "./Rating";

/** One short review and the Google rating, right under a page header where the doubt starts. */
export async function ReviewStrip() {
  const [first] = await getReviews();
  if (!first) return null;
  return (
    <section aria-label="What customers say" className="wrap">
      <figure className="m-0 grid gap-3 border-b border-line py-7 md:grid-cols-[1fr_auto] md:items-center md:gap-10">
        <blockquote className="max-w-[70ch] text-[1.0625rem]">
          <span className="font-display text-2xl leading-none text-brand" aria-hidden="true">“</span>
          {first.quote}
        </blockquote>
        <figcaption className="grid gap-1 text-[0.9375rem] text-muted md:justify-items-end">
          <Rating />
          <span>
            <b className="text-ink">{first.name}</b> · {first.job} ·{" "}
            <a href={first.sourceUrl ?? site.reviewsUrl} className="text-water underline underline-offset-4">
              {first.source} review
            </a>
          </span>
        </figcaption>
      </figure>
    </section>
  );
}
