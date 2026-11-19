# Plumber website

A Next.js 16 + Tailwind CSS v4 site for a local plumbing and heating business. Pages: Home, Services (plus one page per service at `/services/[slug]`), Emergency, Our work (gallery), About, Contact, and a designed 404.

## Run it

Two parts: the website (Next.js, this folder) and the backend (Django, `backend/`) that powers live chat, quote requests, the gallery uploads, reviews and the dashboard at **`/admin`**.

```bash
# 1. Backend (http://localhost:8000)
cd backend
pip install -r requirements.txt
python manage.py migrate
ADMIN_USERNAME=admin ADMIN_PASSWORD='choose-a-strong-one' python manage.py seed_demo   # gallery + quick replies + your login
python manage.py seed_demo --demo     # optional: sample leads/chats/reviews to try the dashboard
daphne -b 127.0.0.1 -p 8000 config.asgi:application

# 2. Website (http://localhost:3000, dashboard at /admin)
npm install
npm run dev
```

The website still works if the backend is down: the gallery and reviews fall back to the built-in content, and the forms ask people to call.

### Demo data

`seed_demo --demo` adds sample leads, chats and reviews marked **Demo** everywhere in the dashboard. They never reach the website (demo reviews can't be published). Remove them with the **Remove demo data** button on the overview, or `python manage.py clear_demo`.

### Dashboard features

- **Overview:** who is still waiting for a reply and for how long (the number that wins jobs), requests, bookings and average first-reply time against last week, requests per day, the pipeline and live activity.
- **Chat (works like WhatsApp):** visitors press "Message us" and just type: no form. Messages, photos, "typing…", ✓ sent / ✓✓ delivered / blue ✓✓ read, and "online" / "last seen today at 07:12" on both sides. Phone numbers or emails typed in the chat are saved as the customer's contact automatically; staff can add the name. Saved quick replies send in one tap, and "Add to leads" keeps the transcript. Chats survive page reloads and reconnect on their own.
- **Leads:** every quote request arrives instantly (sound, toast, tab count, optional desktop alert). Stages New → Contacted → Quoted → Booked / Lost, waiting timers, notes, search.
- **Gallery:** drag-and-drop photo/video upload with progress. A description is required (for Google and screen readers). Publish/hide, pick home-page photos, and drag to reorder. Changes show on `/gallery` straight away.
- **Reviews:** add real reviews; publishing needs the customer's consent. The 3 newest replace the home-page placeholders.

### Environment variables

| Where | Variable | Purpose |
|---|---|---|
| Website | `NEXT_PUBLIC_API_URL` | Backend URL, e.g. `https://api.yourdomain.com` (default `http://localhost:8000`) |
| Website | `INTERNAL_API_KEY` | Same value as the backend's; lets the backend rate-limit form posts per visitor |
| Website | `NEXT_PUBLIC_SITE_URL` | The public site URL (SEO) |
| Backend | `DJANGO_SECRET_KEY`, `DJANGO_DEBUG=0`, `DJANGO_ALLOWED_HOSTS` | Required in production |
| Backend | `CORS_ALLOWED_ORIGINS` | The website's origin(s), comma-separated. WebSockets accept the same origins |
| Backend | `PUBLIC_API_URL` | The backend's own public URL (used in media links) |
| Backend | `REDIS_URL` | Needed in production for live chat across processes (in-memory is for local use) |
| Backend | `INTERNAL_API_KEY` | Shared secret with the website |

See `.env.example` and `backend/.env.example`.

### Tests

```bash
cd backend && python -m pytest          # API + WebSocket chat tests
python e2e/flow.py                       # full browser test; both servers must be running
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

The quote forms (`src/app/(site)/contact/actions.ts`) send requests to the backend, where they appear in the dashboard under Leads. Gallery photos and reviews are managed from the dashboard; `media.ts` and `testimonials` in `site.ts` are only the fallback when the backend can't be reached.

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
