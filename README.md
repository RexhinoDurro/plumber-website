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
- **Chat (works like WhatsApp):** visitors press "Message us" and just type: no form. Messages, photos, "typing…", ✓ sent / ✓✓ delivered / blue ✓✓ read, and "online" / "last seen today at 07:12" on both sides. Phone numbers or emails typed in the chat are saved as the customer's contact automatically; staff can add the name. Both sides type freely on the keyboard (Enter sends on a computer; on a phone Enter adds a line and you tap Send). Saved replies open with the ⚡ button or by typing "/" and land in the box so you can edit them first. "Add to leads" keeps the transcript. Chats survive page reloads and reconnect on their own.
- **Nobody left hanging:** after a visitor's first message the chat asks (inside the chat, never as a form) where to reply if they close the page: WhatsApp, text or email. Replies they haven't seen are sent there after 90 seconds with a link that reopens the chat. If nobody answers within 60 seconds, an automatic holding reply goes out (it doesn't count towards your reply-time stats).
- **Phone alerts:** the dashboard installs as an app (Add to Home Screen) and sends push notifications for new chats and requests, even when it's closed. Turn on "Push alerts" in the sidebar (or at the bottom of the page on a phone).
- **Leads:** every quote request arrives instantly (sound, toast, tab count, optional desktop alert). Stages New → Contacted → Quoted → Booked / Lost, waiting timers, notes, search. Search and stage counts run on the server, so they cover every lead, not just the newest 500.
- **Paid customers:** everyone who paid you, with phone, email, address, the service, amount, method (card, Zelle, check, cash, bank transfer) and invoice number. Record a payment from a lead's panel (contact details fill in, the lead moves to Booked) or on its own for walk-ins. Totals this month vs last, paid per month, by service, search, filters, paging, CSV export for your accountant.
- **Gallery:** drag-and-drop photo/video upload with progress. A description is required (for Google and screen readers). Publish/hide, pick home-page photos, and drag to reorder. Changes show on `/gallery` straight away.
- **Overview insights:** plain-language tips next to the chart (after-hours requests, busiest times, chat reply speed against a 1-minute goal, requests waiting over a day) and a "when requests come in" grid by day and hour.
- **Review requests:** when a lead is Booked, its panel offers a ready-to-edit Google review request: send it in the chat, or open WhatsApp, Messages or email with it filled in.
- **For New York:** ZIP code / neighborhood → borough checker, "Text us" everywhere, gas-leak safety advice (911 / Con Edison / National Grid), no-heat and leak-from-upstairs help, a page for building managers with a COI request form, Local Law 152 gas inspections, license lookup link, US time and money formats, no hero video on data-saver or slow connections, and an accessibility statement (WCAG 2.2 AA; NY is where most website accessibility lawsuits are filed).
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
| Backend | `DATABASE_URL` | **Production: a Postgres database** (e.g. Railway Postgres). Real customers, payments and chats live here; without it the backend uses a local SQLite file |
| Backend | `DB_CONN_MAX_AGE` (0) | Keep DB connections open between requests. Leave at 0 under daphne unless you use a pooler |
| Backend | `CURRENCY` (USD) | Currency for the Paid customers page |
| Backend | `PUBLIC_POST_RATE` (20/hour) | Spam limit: form posts and chat starts per visitor |
| Backend | `REDIS_URL` | Needed in production for live chat across processes (in-memory is for local use) |
| Backend | `INTERNAL_API_KEY` | Shared secret with the website |
| Backend | `SITE_URL`, `BUSINESS_NAME`, `BUSINESS_PHONE` | Used in automatic replies and the "continue the chat" link |
| Backend | `AUTO_REPLY_SECONDS` (60), `OFFLINE_NOTIFY_SECONDS` (90) | Timings; `0` turns each off |
| Backend | `EMAIL_BACKEND`, `EMAIL_HOST`, `EMAIL_HOST_USER`, `EMAIL_HOST_PASSWORD`, `DEFAULT_FROM_EMAIL` | Emailing replies to visitors (prints to the console until set) |
| Backend | `TWILIO_ACCOUNT_SID`, `TWILIO_AUTH_TOKEN`, `TWILIO_SMS_FROM`, `TWILIO_WHATSAPP_FROM` | Optional: automatic texts / WhatsApp. Without them, use the Text and WhatsApp buttons in the inbox |
| Backend | `VAPID_PUBLIC_KEY`, `VAPID_PRIVATE_KEY`, `VAPID_SUBJECT` | Push alert keys; generated into `backend/.vapid.json` if not set. Set them in production so devices stay subscribed across deploys |

See `.env.example` and `backend/.env.example`.

### Tests

```bash
cd backend && python -m pytest          # API + WebSocket chat tests (add DATABASE_URL=postgres://… to run them on Postgres)
python e2e/flow.py                       # browser test of chat + dashboard, on a database seeded with --demo
python e2e/real_data.py                  # browser test on an EMPTY database: every form + chat -> dashboard,
                                         #   record / search / filter / edit / export / delete payments
python manage.py shell < ../e2e/reset_e2e.py   # (in backend/) removes the "E2E …" records so it can run again
KEEP=1 python manage.py shell < ../e2e/volume.py && python e2e/volume_ui.py   # 20,000 leads + 15,000 payments
python e2e/axe_scan.py                   # WCAG 2.2 AA scan (axe-core) of the main pages and the dashboard
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

Every form on the site goes to the backend: the contact form, the quick quote on each service page, and the certificate of insurance (COI) request on `/buildings`. All three are in `src/app/(site)/contact/actions.ts`, and each request appears in the dashboard under Leads, where they appear in the dashboard under Leads. Gallery photos and reviews are managed from the dashboard; `media.ts` and `testimonials` in `site.ts` are only the fallback when the backend can't be reached.

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
