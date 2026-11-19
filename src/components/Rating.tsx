import { site } from "@/content/site";

/** Google rating with stars, or nothing at all until the real rating is filled in (never a made-up score). */
export function Rating({ tone = "light", className = "" }: { tone?: "light" | "dark"; className?: string }) {
  const r = site.rating;
  if (!r) return null;
  const full = Math.round(r.value);
  return (
    <a
      href={site.reviewsUrl}
      className={`inline-flex items-center gap-2 no-underline ${tone === "dark" ? "text-on-dark" : "text-ink"} ${className}`}
      aria-label={`Rated ${r.value} out of 5 from ${r.count} Google reviews`}
    >
      <span className="text-[#f5b400] tracking-[0.08em]" aria-hidden="true">
        {"★".repeat(full)}
        <span className="opacity-30">{"★".repeat(5 - full)}</span>
      </span>
      <b className="font-semibold">{r.value.toFixed(1)}</b>
      <span className={tone === "dark" ? "text-on-dark-muted" : "text-muted"}>from {r.count} Google reviews</span>
    </a>
  );
}
