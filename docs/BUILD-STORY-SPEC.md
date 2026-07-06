# Build Story — pinned scroll-scrubbed 5-phase section (home page)

Inspired by business.nrg.com/campaigns/build-your-data-center: full-viewport
chaptered scroll narrative. Adapted for a lead-gen site: NO entry gate, NO
scroll-jacking — native scroll with `position: sticky` + a tall scroll track,
so a11y, SEO, deep links and the sticky CTA bar all keep working.

## Placement

Home page, replacing the current static ProcessStrip section (the strip moves
to /what-we-do only if needed there — What We Do keeps its existing vertical
timeline; the two must stay visually distinct: timeline = editorial/detailed,
build story = cinematic/immersive).

## Anatomy

`<BuildStory>` (client component, `src/components/home/build-story/`):

- Outer track: `height: 500vh` (100vh per phase). Inner stage: `position:
  sticky; top: 0; height: 100vh (100dvh)`, full-bleed, `bg-ink-950`.
- `useScroll({ target: track })` → `scrollYProgress` 0→1 split into 5 phase
  windows with crossfade margins (e.g. phase i owns [i/5, (i+1)/5], text
  fades in the first 15% and out the last 15% of its window).
- **Scene (right ~55% desktop / background mobile):** ONE continuous SVG
  illustration of the extension build that advances with scroll — the same
  flat-isometric language, palette and stroke system as HeroAssembly.tsx
  (read it first; reuse its shapes where possible so the site reads as one
  hand). Scene states per phase, driven by useTransform of scrollYProgress:
  1. **Concept** — blueprint mode: ink-950 field, faint grid, house outline
     draws itself (pathLength 0→1), dimension lines + a tape-measure arc,
     survey pins drop.
  2. **Design** — outline gains flat fills at low opacity, doors/windows
     slide along the wall to suggest options, a colour-swatch chip row cycles,
     roof profile morphs between two options before settling.
  3. **Build** — the HeroAssembly move: modular wall/roof segments slide in
     from off-canvas and settle (staggered, spring-like via scroll mapping),
     factory gantry hint above, mortar lines snap on.
  4. **Interior** — camera "steps inside": exterior fades to a cutaway;
     downlights glow on one by one, plaster wash sweeps walls, flooring
     planks lay left→right, sockets/switch details pop.
  5. **Completion** — cutaway closes, full facade with glass reflections,
     the brand tick sweeps (logo checkmark echo), soft green glow, tiny
     confetti of angled blocks (very restrained, ≤12 particles).
- **Copy (left ~45% desktop / lower third mobile):** per phase — angled
  PHASE N chip (brand-500 parallelogram), huge Montserrat title
  (SITE→"CONCEPT" etc., ~clamp(2.5rem,7vw,5rem), white), one short paragraph
  (ink-200, from the CMS processTimeline block copy — same data-eb-edit paths
  as the old ProcessStrip so the visual editor still binds), phase counter
  "01 / 05".
- **Progress rail (right edge desktop / top mobile):** 5 nodes joined by a
  line that fills with scrollYProgress; nodes are skewed blocks that tick ✓
  when passed. Clicking a node scrolls the window to that phase's track
  offset (native scrollTo, smooth).
- **Scroll hint:** bottom-left "Scroll to build" with a mouse glyph, fades
  out after phase 1 begins.
- **Entry/exit:** stage fades/scales in from the preceding section (opacity
  + 0.98→1 scale over the first 5% of track) and releases cleanly into the
  testimonials section — no hard jump.

## Motion / feel

- Lenis smooth scrolling site-wide (`lenis` package, already-decided
  exception to no-new-deps — it is ~4kb): initialise in a `SmoothScroll`
  client component mounted in the frontend layout; **disable entirely** when
  `prefers-reduced-motion`, on touch devices keep native (Lenis
  `syncTouch: false`, default).
- All scene motion is scroll-scrubbed (useTransform), NOT time-based — the
  user owns the animation. Springs only via `useSpring` smoothing of
  scrollYProgress (stiffness ~100, damping ~30) so scrubbing feels weighted.
- Reduced motion: the track collapses to `height: auto`; render the 5 phases
  as static stacked full-width panels (final scene frame per phase + copy).
- Mobile (<md): same sticky mechanics (they work on modern mobile), scene
  as dimmed background layer, copy bottom-sheet style; if perf suffers,
  fall back to the stacked panels. Test with Chrome device emulation.

## Statement intro (separate, small)

Directly before BuildStory: a short editorial band echoing NRG's "DATA
DRIVES OUR WORLD." — full-width oversized display text on white:
"MORE SPACE. LESS BUILDING SITE." (two lines), each word rising in with a
slight stagger on scroll into view (Reveal-style, once). One supporting line
below. This replaces nothing — new slim section between AwardStrip and
HomeIntro? NO — place it immediately before BuildStory so it acts as the
chapter's title card. Keep ≤40vh tall.

## Guardrails

- The home HERO keeps its time-based assembly animation (it plays before any
  scroll); BuildStory is the scroll signature. They share visual language but
  must not feel repetitive — hero = quick assembly overview (2.8s), build
  story = slow richly-detailed retelling. If they clash, simplify the hero's
  idle state (static after assembly) — do not remove it.
- StickyMobileCTA, WhatsAppFloat, Header stay above the stage (z-index) and
  fully functional throughout.
- No entry gates, no scroll hijack, no autoplay video, no new heavy deps
  (Lenis only). Lighthouse: the SVG scenes are DOM/SVG, not canvas — keep
  node count per scene < ~400.
- SEO: all 5 phase copy blocks render in the initial HTML (they're always in
  the DOM, just opacity-managed).
