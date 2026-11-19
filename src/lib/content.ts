import { cacheLife } from "next/cache";
import { work as fallbackPhotos, type Photo } from "@/content/media";

// Our seeded job photos keep their best crop when served from the backend (e.g. ".../kitchen-high-rise_ab12.jpg").
const focusFor = (src: string) => fallbackPhotos.find((w) => src.split("/").pop()?.startsWith(w.id))?.focus;
import { testimonials, site, type Testimonial } from "@/content/site";
import { API_URL, type ApiMedia, type ApiReview } from "./api";

/** The website keeps working if the backend is down: it falls back to the built-in content. */
async function get<T>(path: string): Promise<T | null> {
  try {
    const r = await fetch(`${API_URL}${path}`, { signal: AbortSignal.timeout(3000), cache: "no-store" });
    if (!r.ok) return null;
    return (await r.json()) as T;
  } catch {
    return null;
  }
}

const toPhoto = (m: ApiMedia): Photo => ({
  id: String(m.id),
  src: m.src,
  alt: m.alt,
  category: m.category,
  title: m.title,
  credit: m.credit,
  creditUrl: m.creditUrl,
  video: m.video ?? undefined,
  focus: focusFor(m.src),
});

// Old databases may still hold the stock (Pexels) placeholders that used to seed the gallery. The gallery is
// for our own jobs only, so those never show, even before `migrate` has removed them.
const isStock = (m: ApiMedia) => /pexels\.com/.test(`${m.src} ${m.video ?? ""} ${m.creditUrl ?? ""}`);

/** Gallery page: always fresh, so a new upload shows up straight away. */
export async function getGallery(): Promise<{ photos: Photo[]; live: boolean }> {
  const data = (await get<ApiMedia[]>("/api/gallery/"))?.filter((m) => !isStock(m));
  return data?.length ? { photos: data.map(toPhoto), live: true } : { photos: fallbackPhotos, live: false };
}

/** Home page "Recent work": cached for a minute. */
export async function getFeatured(): Promise<Photo[] | null> {
  "use cache";
  cacheLife({ stale: 30, revalidate: 60, expire: 3600 });
  const data = (await get<ApiMedia[]>("/api/gallery/?featured=1"))?.filter((m) => !isStock(m));
  return data && data.length ? data.map(toPhoto) : null;
}

/** Published, consented reviews from the dashboard; placeholders until there are some. */
export async function getReviews(): Promise<Testimonial[]> {
  "use cache";
  cacheLife({ stale: 60, revalidate: 300, expire: 86400 });
  const data = await get<ApiReview[]>("/api/reviews/");
  if (!data || !data.length) return testimonials;
  return data.slice(0, 3).map((r) => ({
    quote: r.quote,
    name: r.name,
    place: r.place,
    job: r.job,
    source: r.source,
    sourceUrl: r.source_url || site.reviewsUrl,
    placeholder: false,
  }));
}
