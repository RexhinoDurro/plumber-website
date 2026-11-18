# Plumber website

A Next.js 16 + Tailwind CSS v4 site for a local plumbing and heating business. Pages: Home, Services (plus one page per service at `/services/[slug]`), Emergency, Our work (gallery), About, Contact, and a designed 404.

## Run it

```bash
npm install
npm run dev     # http://localhost:3000
npm run build && npm start
```

## Before going live: replace the placeholders

Everything business-specific is in **`src/content/`**:

| File | What to change |
|---|---|
| `site.ts` | Business name, time zone, opening hours (for the live status), guarantees, accreditations, phone, email, address, hours, areas, licence, insurance, founding year. Reviews (`testimonials`): **add real reviews only**. FAQ answers marked TODO. |
| `services.ts` | Services, descriptions, included jobs and **typical price ranges** (placeholders). Add your heating certifications. |
| `problems.ts` | The "What's happening?" finder: symptoms, urgency, safe first step, likely causes, linked service. |
| `media.ts` | Photos, gallery videos and the "Watch a job" clip. They are free Pexels placeholders; swap in photos of your own jobs (put them in `/public` and use `/your-photo.jpg` paths). |

Search the code for `TODO` and `[` to find every placeholder.

The quote form (`src/app/contact/actions.ts`) validates input but only logs requests on the server. Connect an email service (Resend, Postmark) or your CRM where the TODO says so.

## SEO

- Set `NEXT_PUBLIC_SITE_URL` (e.g. `https://yourdomain.com`) in Vercel so the sitemap, robots.txt, canonical URLs and structured data point at the real domain.
- Structured data: `Plumber` (LocalBusiness) on every page, `FAQPage` on Home and service pages, `Service` on each service page. The values come from `site.ts`, so they must match your Google Business Profile exactly.
- Town/area pages are intentionally not generated: thin copies hurt rankings. Write one real page per town you serve when you have local photos and jobs to show.

## Design

See **`DESIGN.md`** for the design system: colors and their roles, type, spacing, the "pipe-elbow" photo corner and the blue pipe line. Tokens live in the `@theme` block in `src/app/globals.css`, so use the Tailwind classes (`bg-ink`, `text-brand`, `rounded-tr-elbow`…) rather than raw values.

- UX: sticky call/quote bar on phones, "Get a quote" in the header, a 3-field quote form in the hero, separate homeowner and landlord paths, a price guide, review source links (set `reviewsUrl` in `site.ts`).
- Video: background loops (hero and bands), clips that play only while visible on the Services page, a click-to-play "Watch a job" player, and video items in the gallery (with a Videos filter).
- Motion: hero line reveal, scroll-driven reveals (headings, photo uncover, staggered cards, filling pipe nodes), page crossfades, a shrinking header and a live "Open now" status from `openingHours` + `timezone` in `site.ts`. All of it respects reduced motion.
- Fonts are self-hosted (`@fontsource-variable/archivo`, `@fontsource-variable/public-sans`).
- Motion: the hero and two background bands use slow muted video loops; the "How a job works" pipe line draws on scroll (CSS scroll-driven animation). All of it turns off with `prefers-reduced-motion`.
- Accessibility: skip link, visible focus rings, a keyboard-operable gallery lightbox (arrows / Esc), labelled form fields with inline errors, and text contrast of at least 4.5:1.

## Credits

Photos and videos from [Pexels](https://www.pexels.com/license/); individual credits are on `/gallery#credits`.
