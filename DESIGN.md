# DESIGN.md — Plumber website

## Brief

- **Who:** homeowners and landlords in the service area with a leak, a blocked drain, a cold radiator, or a bathroom or kitchen to refit.
- **What:** emergency repairs, installations, heating and boiler work, bathroom and kitchen plumbing.
- **Only-us line (confirm with owner):** "A fixed price before we touch a pipe, and we leave the room cleaner than we found it."

Direction: **trade-craft**. It should feel clean, trustworthy and local: a white van with a blue livery, a clean toolbox, not a SaaS template. It was chosen from the brief and the crafted-ui rules. UXKIN was not connected, so it is not based on a comparison with specific real sites.

## Color

Brand: **blue and white**. Navy for text and dark bands, one confident blue for actions, white space everywhere else.

| Token | Value | Role |
|---|---|---|
| `bg` | `#F4F7FB` | Page background (blue-tinted white) |
| `surface` | `#FFFFFF` | Cards, form, white sections |
| `ink` | `#0A1A33` | Text, dark bands, footer (navy) |
| `muted` | `#48586F` | Secondary text (6.7:1 on bg) |
| `line` | `#D3DCE8` | Borders, dividers, unfilled pipe line |
| `brand` | `#1257D6` | Primary buttons (white text, 6.3:1), the pipe line, CTA band, accents |
| `brand-light` | `#2C6BE4` | Button hover |
| `brand-deep` / `water` | `#0C47B3` | Labels, links and accent text on light backgrounds (7.6:1) |
| `sky` | `#8CC0FF` | Accent text on navy: labels, phone numbers, highlights (9.2:1) |
| `on-dark` / `on-dark-muted` | `#F3F7FC` / `#B8C6DA` | Text on navy |

Rules: one bright element per screen (the blue CTA; white button on the blue band). Accent text on dark is always `sky`, never `brand`. No gradients except the legibility overlays on photos and video.

## Typography

- **Display:** Archivo Variable, width 125 (expanded), weight 750–800. It is sign-writing on a van, used for h1–h3 only.
- **Body:** Public Sans Variable, 400/600.
- Scale (fluid): h1 `clamp(2.6rem, 6vw + 0.5rem, 5.75rem)` / 0.98; h2 `clamp(2rem, 3.2vw + 1rem, 3.5rem)` / 1.05; h3 1.375rem / 1.2; body 1.125rem / 1.6; small 0.9375rem; label 0.8125rem, letter-spacing 0.06em.
- Lines max ~65ch. Headline tracking −0.02em.

## Spacing

8 px base: 4, 8, 12, 16, 24, 32, 48, 64, 96, 128. Section padding `clamp(64px, 10vw, 128px)`. Content width 1200 px; text width 65ch. A 12-column grid with a 24 px gap.

## Shape and depth

- Radius: 6 (inputs, small), 14 (cards), pill (buttons), and the **elbow corner**: one 64 px radius on a single corner of feature photos, like a pipe bend. Never round all four corners large.
- Shadows: `--shadow-1` hairline for cards; `--shadow-2` for the sticky header and lightbox. Nothing else.

## Signature moves

1. **Elbow-corner photos:** one big rounded corner, which alternates side by section.
2. **Blue pipe line:** a 4 px blue line with elbow bends connecting the "How it works" steps. It draws on scroll with CSS scroll-driven animation; when reduced motion is set, it is shown complete.

## Motion

Calm and purposeful: motion explains change, confirms an action or guides attention. Nothing bounces, nothing loops fast, and everything is off with `prefers-reduced-motion`.

| Moment | What moves | Timing |
|---|---|---|
| Page load (hero) | Headline lines rise out of a mask, then the intro, buttons and quote card fade up; the background video settles from 1.08 to 1 | 900 ms, expo-out, staggered 110 ms / 300–540 ms |
| Scroll | Section headings rise 28 px; photos uncover from the bottom (clip-path); card groups stagger; pipe-line nodes fill blue as each step arrives; the pipe line draws | CSS scroll-driven (`animation-timeline: view()`), no JavaScript |
| Hover / press | Photos lean in 3.5% inside their frames; nav underline grows from the left; buttons press to 0.97 | 120–600 ms ease-out |
| Header | Shrinks from 76 to 64 px and gains a soft shadow once you scroll | 300 ms |
| Page change | Crossfade between pages (React `<ViewTransition>`) | 240 ms |
| Live status | Top bar shows "Open now · until 18:00" or when the office opens, from `openingHours` in the business's time zone; a soft pulse only while open | updates every minute |

Browsers without scroll-driven animation simply show the finished state.

## Components

- Buttons: **primary** (brand blue, white text), **secondary** (navy outline; white outline on dark), **quiet** (water-colored link with underline offset). All have a visible 3 px water focus ring.
- Header: sticky; wordmark, Services, Gallery, About, Contact, and a phone button. On mobile, the phone is always visible plus a menu.
- Inputs: 52 px tall, visible labels, 6 px radius, 2 px border on focus.
- FAQ: native `<details>`.

## Conversion patterns

- Phones: a sticky bottom bar with **Call now** (primary) and **Get a quote** (secondary) that respects the safe area. Desktop: phone and "Get a quote" in the header.
- Hero: a three-field quote card (name, phone, job type). Proof strip directly under it.
- Price guide: ranges plus "what changes the price"; the exact price comes after a look at the job.

## Imagery

Real work photos and short clips only. Video plays muted, only while visible, and never with reduced motion; the hero, promise and emergency bands use background loops, and the "Watch a job" player is click-to-play with controls. For now these are Pexels placeholders, credited on `/gallery` and in `src/content/media.ts`; replace them with the business's own job photos. No stock smiles, no AI images. Icons: none decorative; the content does the work.
