# EazyBase — Design & Build Brief

Rebuild of eazybase.co.uk (WordPress/WPBakery → Next.js 15 + Payload CMS 3).
Prefab modular home-extension company. Factory-built in Blackburn, installed
across the North West and London. Customers are homeowners spending £20–60k.

## Brand (extracted from live site — stay faithful)

- **Green (primary / CTA):** `#96c11f` — the logo lime. Hover: darken ~8% (`#86ad1c`).
- **Charcoal (ink):** `#333333` body, `#2b2b2b` / `#2e3233` for dark panels & footer.
- **Logo greys:** "Eazy" is dark grey (~`#58595b`), mark is green + grey.
- **White** dominant. Warm light grey (`#f6f7f4`, slight green cast) for alternating sections.
- Red `#B71C1C` on the old site is the WhatsApp plugin default — NOT brand. Do not carry over.
- **Fonts:** Montserrat (headings, 300/400 on old site — use 500/600/700 for the rebuild's
  confident headline voice) + Open Sans (body). Keep both via `next/font`.
- **Logo motif:** the mark is a house formed from angled modular blocks that read as a
  tick/checkmark. Echo this: 45°-angled parallelogram accents in icons, section dividers,
  list bullets, and the loader. The "block" is the atomic visual unit of the whole identity.

## Tone

Premium, modern, confidence-building. Polished and warm — not childish, not corporate-flat.
Personality via motion + photography, not loud colour. Green is an accent and CTA colour,
never a flood. Dark charcoal sections give the premium register.

## Photography

~116 real project photos (iPhone). Treat carefully:
- Fix EXIF rotation on import (sharp auto-rotate).
- Crop tight; prefer finished-exterior and interior shots above the fold.
- Consistent treatment: slight contrast lift; charcoal gradient scrims under text.
- Before/after pairs exist in the gallery sets (Set1/Set2, EZB_ prefixed).

## Motion (Motion library + code-driven Lottie-style sequences)

One signature moment, restraint everywhere else:

1. **Hero (signature, home only):** modular blocks assemble into a finished extension —
   code-driven SVG/Motion sequence (isometric blocks slide/drop into place, then facade
   details fade in). Runs once on load, subtle idle loop after. Respect
   `prefers-reduced-motion` (render final frame statically).
2. **Process timeline (What We Do + home excerpt):** scroll-driven 5-step
   Concept → Design → Build → Interior → Completion; progress line draws as you scroll,
   step cards rise in.
3. **Counters:** "4 weeks factory build", "under 1 week on-site install", "10-year guarantee"
   style stats animate on first view.
4. **Gallery:** before/after slider with clip-path reveal; grid images scale-in on view.
5. **Micro:** quote CTAs get magnetic hover + block-accent sweep; nav underline slides;
   parallax only on full-bleed section-break images (gentle, ≤10%).

Never repeat the hero assembly animation elsewhere — other pages get a static hero with
a simple fade/rise.

## Conversion path (all four, always reachable)

- **Get A Quote** — full form (name, email, phone, postcode, extension type, size, timing, message).
- **Instant Quote** — quick estimator (type + size + spec → indicative range), leads to full form.
- **Call 0330 229 0775** — click-to-call in header + sticky bar.
- **WhatsApp** — wa.me/447845655113 floating button (brand-styled, not plugin red).
- **Sticky mobile CTA bar:** Call / WhatsApp / Get Quote — always visible on mobile.

## Trust signals

- Northern Enterprise Awards — "Best Nationwide Modular Home Construction Company 2023"
  near the fold on home (badge + line), repeated in footer.
- Real photo count ("500+ installs" only if the copy audit supports a number — otherwise
  years trading), guarantee, "factory-built in Blackburn".

## Sitemap (301-preserving)

| Old URL | New route |
|---|---|
| / | / |
| /about-us/ | /about-us |
| /what-we-do/ | /what-we-do |
| /faq/ | /faq |
| /gallery/ | /gallery |
| /social/ | /social |
| /get-a-quote/ | /get-a-quote |
| /instant-quote/ | /instant-quote |
| /areas/ | /areas |
| /north-west-modular-home-extensions/ | /areas/north-west (301) — plus keep old slug live |
| /london-modular-home-extensions/ | /areas/london (301) |
| /{town}-modular-home-extensions/ ×15 | /areas/{town} (301) |
| — (new) | /areas/blackburn — NEW page (currently nav points at homepage) |

Old slugs 301 via next.config redirects. Towns: blackpool, chester, edgware, enfield,
harrow, hayes, liverpool, manchester, preston, richmond, twickenham, warrington, watford,
wembley + hubs north-west, london + NEW blackburn. (Enfield exists on the live site even
though the brief omitted it — keep it.)

Every area page: unique intro copy (local housing stock, planning context, landmarks),
unique meta title/description, LocalBusiness/Service JSON-LD, localized FAQ block,
gallery strip, full CTA stack.

## Content fixes

- The use-case section titled "Dining Rooms" twice (kitchens section mislabelled) — fix to
  Kids Playrooms / Home Office / Dining Rooms / Kitchens.
- Tighten all copy; keep meaning, drop WPBakery filler.

## CMS (Payload 3, embedded)

Collections: Pages (flexible blocks), Areas, FAQs, Testimonials, GalleryItems (before/after
pairs supported), Awards, Media, Users, QuoteRequests (form submissions stored + emailed).
Globals: SiteSettings (phone, WhatsApp, socials, award line), Navigation.

**Roles:** `admin` (everything incl. pages, structure, users) and `editor` (content-only:
edit existing docs, upload media; no create/delete pages, no users, no globals structure).

**In-page visual editor:** when a logged-in admin/editor visits the live site with
`?edit=1` (or via an "Edit this page" button in the admin bar), text nodes rendered from
CMS fields become click-to-edit (contentEditable overlay), saving back through Payload's
REST API field-by-field. Implemented with a data-attribute convention:
`data-eb-edit="collection:id:fieldPath"`.

## Stack

Next.js 15 App Router (from Payload 3.85.2 blank template, Next 16.2.6/React 19), TypeScript,
Tailwind CSS v4, Motion (`motion` package), SQLite via `@payloadcms/db-sqlite`
(→ Turso in prod), Vercel deploy target, `sharp` image pipeline.
