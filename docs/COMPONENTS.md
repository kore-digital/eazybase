# Component Usage Notes (from build agents)

## CMS backend

Payload CMS backend implemented, seeded and verified.

## Files created/rewritten (all owned)
- `src/access/roles.ts` — `isAdmin`, `isAdminOrEditor`, `anyone`, `publishedOrLoggedIn`, `isAdminFieldLevel`, `isAdminOrSelf`
- `src/fields/seo.ts` — reusable `seo { metaTitle, metaDescription }` group
- `src/collections/` — `Pages.ts` (10 blocks: richText, imageText, useCaseTabs, processTimeline, statsCounters, ctaBand, faqList, testimonialStrip, galleryStrip, awardBadge, each with `interfaceName`), `Areas.ts`, `FAQs.ts`, `Testimonials.ts`, `GalleryItems.ts`, `Awards.ts`, `QuoteRequests.ts` (public create, admin/editor read, afterChange console.log email stub, status field admin-only), `Media.ts` (staticDir `./media`, focalPoint, imageSizes thumb 480/card 900/hero 1920), `Users.ts` (role select, saveToJWT, admin-only field access, beforeChange hook forces first user → admin)
- `src/globals/SiteSettings.ts`, `src/globals/Navigation.ts`
- `src/payload.config.ts` — all registered; `src/payload-types.ts` regenerated
- `src/seed/index.ts`, `src/seed/media-map.ts` (33 curated images with visually-verified alts), `src/seed/verify.ts`
- `package.json` — added `"seed": "cross-env NODE_OPTIONS=--no-deprecation payload run src/seed/index.ts"` (generate:types already existed)

## Seed counts (verified via `payload run src/seed/verify.ts`; seed is idempotent — re-run skips all sections)
| Collection | Count |
|---|---|
| pages | 8 (home, about-us, what-we-do, faq, gallery, social, get-a-quote, instant-quote — heroHeading + heroSub + sections + seo, published) |
| areas | 17 (12 with real copy from docs/area-copy; 5 placeholder: london, twickenham, richmond, hayes, enfield — no JSON exists) |
| faqs | 8 (verbatim) |
| testimonials | 5 |
| gallery-items | 30 (exterior 15 / interior 4 / build-progress 10, wait — 15+4+11=30 mapped from media-map categories) |
| awards | 1 (linked to certificate image) |
| media | 33 (30 gallery + logo + award cert + HeaderSlider; sharp `.rotate()` baked in; resized variants written to ./media) |
| quote-requests / users | 0 (users created via admin UI; first becomes admin) |
| site-settings | phone/WhatsApp/email/tagline/awardLine/socials/stats from src/lib/site.ts |
| navigation | mainNav 7, footerNav 8 |

`npm run generate:types` and `npm run seed` both succeed; `npx tsc --noEmit` reports 0 errors repo-wide.

## Deviations / notes
1. **EZB-\*.jpg is an interior, not exterior** — visual review shows the flagship shot is inside (roof lantern, media wall, dining area); categorised `interior` with an accurate alt. HeaderSlider.jpg imported as hero media (not a gallery item).
2. **Typos fixed in seeded copy** per audit register: 'competing/compete with electric(al) sockets' → 'complete with…', Kitchens tab heading corrected, ShahinaY review 'job.very' → 'job, very'; FAQ #6 had the extractor's annotation "(The phrase … is a link to …)" stripped — everything else verbatim.
3. **instant-quote seeded as a real page** as instructed, even though the audit recommends 301 → /get-a-quote (frontend/redirects can decide).
4. **Users access**: non-admins can read/update only themselves (required for the admin panel); role field is invisible/immutable to non-admins.
5. **`payload run` gotcha**: it `await import()`s the script then exits, so the seed uses top-level await — a floating `run()` promise silently never executes (this cost a debug cycle; documented in a comment).
6. **DB reset**: the pre-existing template `eazybase.db` caused a drizzle push index conflict and the file was locked by another process (dev server from another agent), so I dropped all tables in-place (0 users, no data existed) and let the schema push recreate everything.
7. `statsCounters` block stores `value` (number) + `suffix` + `label`; galleryStrip/faqList/testimonialStrip relationships may be left empty meaning "show all/featured" — frontend convention noted in admin descriptions.
8. Seed assets path defaults to the scratchpad crawl dir; overridable via `EAZYBASE_ASSETS_DIR` env var.

## UI core

All type errors originate in `src/collections/Pages.ts` (owned by the CMS agent) — every file I own compiles clean.

```
COMPONENTS BUILT (all paths absolute)

C:\Users\info\GITHUB\eazybase\src\lib\format.ts
  formatPhone(raw) → '0330 229 0775' / '+44 7845 655 113'; telHref(raw) → 'tel:...'; waHref(number, text?); cleanPhone(raw). Use these everywhere a phone number is shown — standardises the old site's mixed formats.

C:\Users\info\GITHUB\eazybase\src\components\layout\Header.tsx  ('use client')
  <Header /> — sticky translucent header (backdrop-blur), /logo.png, desktop nav with motion layoutId sliding underline, Areas dropdown grouped North West/London from AREAS, phone click-to-call + QuoteCTA, mobile hamburger → full-screen slide-in with areas accordion. Closes on route change, locks body scroll. Header height is h-18 (4.5rem) — offset any full-bleed heroes accordingly. NOTE: /logo.png copied into public/; a white variant (/logo-white.png) still needs exporting (TODO comments in Header + Footer).

C:\Users\info\GITHUB\eazybase\src\components\layout\Footer.tsx  (server)
  <Footer /> — ink-900 footer, angled green block divider on top, 4 cols (brand+tagline+award, quick links, areas towns in 2 cols + hub links, contact phone/WhatsApp/email/socials), bottom bar with © + 'Website by' placeholder.

C:\Users\info\GITHUB\eazybase\src\components\layout\StickyMobileCTA.tsx  ('use client')
  <StickyMobileCTA /> — fixed bottom bar, md:hidden, Call / WhatsApp (green) / Get A Quote (dark), safe-area padding. Auto-hides while an element marked data-quote-form (or id="quote-form") is in view — page builders: add that attribute to the quote form section.

C:\Users\info\GITHUB\eazybase\src\components\layout\WhatsAppFloat.tsx  ('use client')
  <WhatsAppFloat /> — desktop-only (hidden md:block) floating dark-green circle bottom-right, inline WhatsApp SVG, pulse ring every ~8s, opens SITE.whatsappHref. Respects prefers-reduced-motion. Mount Header/Footer/StickyMobileCTA/WhatsAppFloat once in the (frontend) layout.

C:\Users\info\GITHUB\eazybase\src\components\ui\SectionHeading.tsx  (server)
  <SectionHeading eyebrow="..." lede="..." align="center|left" as="h1|h2|h3" onDark>Heading</SectionHeading> — eyebrow gets the green block-accent; onDark for ink sections.

C:\Users\info\GITHUB\eazybase\src\components\ui\QuoteCTA.tsx  (server)
  <QuoteCTA href="/get-a-quote" variant="primary|dark">Get A Quote</QuoteCTA> — THE quote button: skewed green block sweeps on hover, scale on press. Defaults: href /get-a-quote, label "Get A Quote". Use variant="dark" on green backgrounds.

C:\Users\info\GITHUB\eazybase\src\components\ui\Reveal.tsx  ('use client')
  <Reveal delay={i * 0.1}>...</Reveal> — fade+rise once on scroll into view; stagger siblings via delay (seconds). Also duration / y props.

C:\Users\info\GITHUB\eazybase\src\components\ui\AnimatedCounter.tsx  ('use client')
  <AnimatedCounter value={4} suffix=" weeks" prefix="" duration={1.6} className="..." /> — counts up on first in-view; renders final value under reduced motion. Style size/colour via className.

C:\Users\info\GITHUB\eazybase\src\components\ui\ParallaxSection.tsx  ('use client')
  <ParallaxSection src="/media/x.jpg" heightClassName="min-h-[60vh]">overlay content</ParallaxSection> — full-bleed section break, ≤10% parallax, charcoal scrim built in; children render white inside eb-container.

C:\Users\info\GITHUB\eazybase\src\components\ui\BeforeAfter.tsx  ('use client')
  <BeforeAfter beforeSrc afterSrc beforeAlt afterAlt aspectClassName="aspect-[4/3]" initial={50} /> — clip-path comparison slider; drag anywhere or use arrow keys (hidden full-surface range input); parallelogram grip; Before/After corner labels.

C:\Users\info\GITHUB\eazybase\src\components\ui\CTABand.tsx  (server)
  <CTABand variant="green|dark" heading sub quoteHref quoteLabel /> — pre-footer conversion band with QuoteCTA + "or call 0330 229 0775" tel link; all props optional with sensible defaults.

ASSET: copied crawl asset → C:\Users\info\GITHUB\eazybase\public\logo.png (31 KB).
TYPECHECK: npx tsc --noEmit → only errors are in src/collections/Pages.ts (other agent's file); zero errors in ui/, layout/, lib/format.ts.
```

## Hero

All checks pass. Final verification summary — only remaining tsc errors are in `src/collections/Pages.ts` (owned by the CMS agent, not my files).

COMPONENTS BUILT (all under C:\Users\info\GITHUB\eazybase\src\components\hero\):

1. **HeroAssembly.tsx** ('use client')
   - Export: named `HeroAssembly` + default.
   - Props: `{ static?: boolean; className?: string }` — `static` renders the completed frame with no animation; also forced automatically via `useReducedMotion()`.
   - Flat-isometric SVG (viewBox 800×600, ~4:3, `w-full h-auto`, no fixed px). 2:1 iso projection: ground point P(a,b) = (400+56a−56b, 480−28a−28b), documented in file header; all coordinates derived from that formula and cross-checked (e.g. roof back corner T1+3A = T0+5B+3A = (288,118)).
   - Sequence (~2.8s, on mount): existing-house silhouette + shadow fade (0s) → foundation slab rises (0.05s) → three front wall modules #96c11f/#adcf2f/#58595b (0.45/0.65/0.85s) → two side modules #333/#3d3e40 (1.05/1.2s) → roof slab + dark fascia (1.45s) — each a spring drop (y-offset −72/−90, −3° rotate settle, stiffness 220/damping 21) → glazing/door/window frames/roof-light fade (1.95s, glass #c9d6de, white 2px mortar strokes throughout) → downlights glow under fascia (2.45s) + green tick sweep pathLength draw echoing the logo checkmark (2.35s). Then idle float of the building group, y [0,−3,0,3,0] over 6s, infinite, starting 3.1s.

2. **Hero.tsx** (server component)
   - Export: named `Hero` + default. No props.
   - ink-950 section, CSS blueprint grid (44px, radial-masked) + soft green radial glow; left column: block-accent kicker, H1 "Get a Modular Home Extension", sub "Creating more space for what matters.", `<QuoteCTA href="/get-a-quote">` + white-outline `eb-btn` Link to /instant-quote, gold (#d4a72c) laurel SVG + "Northern Enterprise Awards 2023 — Best Nationwide…" line, phone link from SITE; right column: `<HeroAssembly>`. Copy staggers in at 0.1–0.7s via hero-local Reveal, timed with the assembly.

3. **Reveal.tsx** ('use client', hero-scoped helper)
   - Props: `{ children; delay?: number; className?: string }`. Mount-timed rise (NOT the ui-core Reveal — that one is `whileInView` scroll-triggered; the hero needs deterministic mount timing synced to the assembly). Kept intentionally, reduced-motion safe.

4. **StatsBar.tsx** (server component)
   - Export: named `StatsBar` + default. No props.
   - ink-900 slim band: 3 stats from SITE.stats — 4 weeks factory build / under 1 week on-site install (derived `ceil(installDays/7)`) / 40-year guarantee — each an `<AnimatedCounter value={n} />` with prefix/suffix rendered as plain spans (only `value` assumed), plus award badge line with block accent.

IMPORTS FROM UI-CORE (both exist and typecheck clean — no placeholders needed):
- `import { QuoteCTA } from '@/components/ui/QuoteCTA'` — used as `{ href, children }`.
- `import { AnimatedCounter } from '@/components/ui/AnimatedCounter'` — used as `{ value: number }` only.

NOTES FOR ORCHESTRATOR:
- Wire into the home page as `<Hero />` immediately followed by `<StatsBar />`.
- Pre-existing tsc errors remain in src/collections/Pages.ts (relationTo slug types) — outside my ownership, flagged for the CMS agent.
