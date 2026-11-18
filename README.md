# Plumber website

A Next.js 16 + Tailwind CSS v4 site for a local plumbing and heating business. Pages: Home, Services, Our work (gallery), About and Contact.

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
| `site.ts` | Business name, phone, email, address, hours, areas, licence, insurance, founding year. Reviews (`testimonials`): **add real reviews only**. FAQ answers marked TODO. |
| `services.ts` | Services, descriptions and included jobs. Add your heating certifications. |
| `media.ts` | Photos and videos. They are free Pexels placeholders; swap in photos of your own jobs (put them in `/public` and use `/your-photo.jpg` paths). |

Search the code for `TODO` and `[` to find every placeholder.

The quote form (`src/app/contact/actions.ts`) validates input but only logs requests on the server. Connect an email service (Resend, Postmark) or your CRM where the TODO says so.

## Design

See **`DESIGN.md`** for the design system: colors and their roles, type, spacing, the "pipe-elbow" photo corner and the blue pipe line. Tokens live in the `@theme` block in `src/app/globals.css`, so use the Tailwind classes (`bg-ink`, `text-brand`, `rounded-tr-elbow`…) rather than raw values.

- Fonts are self-hosted (`@fontsource-variable/archivo`, `@fontsource-variable/public-sans`).
- Motion: the hero and two background bands use slow muted video loops; the "How a job works" pipe line draws on scroll (CSS scroll-driven animation). All of it turns off with `prefers-reduced-motion`.
- Accessibility: skip link, visible focus rings, a keyboard-operable gallery lightbox (arrows / Esc), labelled form fields with inline errors, and text contrast of at least 4.5:1.

## Credits

Photos and videos from [Pexels](https://www.pexels.com/license/); individual credits are on `/gallery#credits`.
