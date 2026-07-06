# Quote Experience — merge spec (Assistant + Wizard)

Combines the reference site's conversational quote bot with our instant-quote's
pricing/materials strengths. Two entry styles, ONE shared question set + one
lead pipeline.

- `/get-a-quote` → **Quote Assistant** (chat, "Eazy"), the primary conversion path.
- `/instant-quote` → the existing 3-step visual wizard, PLUS a house-style step.

Both persist to the `quote-requests` collection and both use `pricing.ts` for
the indicative range.

## Unified question set (order)

1. **Build type** — what are you building? (our EXTENSION_TYPES: Kitchen, Dining
   Room, Home Office, Playroom, Garden Room, Something else) — drives the price
   multiplier.
2. **Property type / "house style"** — Detached · Semi-detached · Terraced ·
   Bungalow · Flat / Other. Captured for the team (access/complexity); does NOT
   change the headline range.
3. **Size** — Assistant: bands (Compact ≤15m² · Medium 15–30m² · Large 30m²+ ·
   Not sure). Wizard: precise width×depth sliders (unchanged). Bands map to a
   representative m² for the estimate.
4. **Finish tier** — Essential · Premium · Signature (our SPEC_LEVELS).
5. **Material preferences (optional, skippable)** — free-text / chips: "brick,
   render, bi-folds, lantern roof…". Assistant only (wizard already conveys
   finish via tier; keep it "perfect" — just add the house-style step there).
6. **Timeline** — As soon as possible · 1–3 months · 3–6 months · Just exploring.
7. **Postcode** — coverage/groundwork check.
8. **Contact** — name, email, phone.
9. **Result** — Assistant shows an indicative £X–£Y (from build type × finish
   tier × representative area) with the line: "Our team will confirm your exact
   fixed price shortly." Then skip-the-wait: WhatsApp + Call. Wizard already
   shows its live range; it just also stores the new house-style field.

No budget-band question (the computed range replaces it).

## Inline FAQ (Assistant only)

Persistent quick chips the user can tap any time without losing progress — the
bot answers inline, then re-offers the current step:
- "How long does it take?" → factory build in ~4 weeks, on-site install under a week.
- "Do I need planning permission?" → many single-storey rear extensions fall under
  permitted development; we guide you either way. (No council-specific claims.)
- "Is it a fixed price?" → yes, your written quote is a fixed price after survey.
- "What guarantee?" → structural guarantee; up to 40-year roofing guarantee.
- "Do you offer finance?" → yes, finance options available — ask the team.
Keep answers short, warm, UK English, no invented numbers beyond SITE.stats.

## Shared contract (`src/components/quote/pricing.ts`)

Add (backend agent owns this file):
```
export const PROPERTY_TYPES = [
  { key: 'detached', label: 'Detached' },
  { key: 'semi', label: 'Semi-detached' },
  { key: 'terraced', label: 'Terraced' },
  { key: 'bungalow', label: 'Bungalow' },
  { key: 'flat', label: 'Flat / Other' },
] as const
export type PropertyTypeKey = (typeof PROPERTY_TYPES)[number]['key']

export const SIZE_BANDS = [
  { key: 'compact', label: 'Compact (up to 15m²)', areaM2: 12 },
  { key: 'medium',  label: 'Medium (15–30m²)',     areaM2: 22 },
  { key: 'large',   label: 'Large (30m²+)',         areaM2: 36 },
  { key: 'unsure',  label: 'Not sure yet',          areaM2: 22 },
] as const
export type SizeBandKey = (typeof SIZE_BANDS)[number]['key']

export const TIMELINES = [
  { key: 'asap',      label: 'As soon as possible' },
  { key: '1-3m',      label: '1–3 months' },
  { key: '3-6m',      label: '3–6 months' },
  { key: 'exploring', label: 'Just exploring' },
] as const
export type TimelineKey = (typeof TIMELINES)[number]['key']

// area-based estimate reusing the existing £/sqm + type-multiplier model
export function estimateRangeFromArea(type: ExtensionTypeKey, spec: SpecKey, areaM2: number): { low: number; high: number }
```
Keep existing EXTENSION_TYPES, SPEC_LEVELS, SIZE_BOUNDS, estimateRange, clampMetres.

## Data (`src/collections/QuoteRequests.ts`)

Extend `type` enum to include `'assistant'`. Add optional fields:
`propertyType` (select, PROPERTY_TYPES), `timeline` (select, TIMELINES),
`materialPreferences` (text). Keep the `estimator` group; assistant stores
`{ extensionType, sizeBand, areaM2, spec, estimateLow, estimateHigh }` into it
(add sizeBand + areaM2 to the group). Regenerate payload-types.

## Server action (`src/app/(frontend)/actions/quote.ts`)

Accept the new fields; for `type: 'assistant'` recompute the range server-side
via estimateRangeFromArea (never trust client £). Persist propertyType, timeline,
materialPreferences. Keep the honeypot + client-clock elapsed spam check
(`_eb_elapsed`). Email hook unchanged.

## Brand / UI (ours, NOT a clone of the reference)

Chat card: `bg-white` body on a rounded panel with `border-ink-100 shadow-xl`;
**ink-950 header** "EazyBase Quote Assistant · Typically replies in minutes" with
the block-mark logo; a thin **brand-500 progress bar** under the header; subtle
dot-grid chat background. Bot bubbles = `bg-ink-50 text-ink-800`; user bubbles =
`bg-brand-500 text-ink-950` (AA — never white on lime). Quick-reply chips =
rounded, `border-ink-200 hover:border-brand-500 hover:bg-brand-50`, selected =
`bg-brand-500 text-ink-950`. Typing indicator = three pulsing dots. Respect
`prefers-reduced-motion` via `useReducedMotionSafe`. Left column keeps the
benefits/trust list (No obligation · Fixed-price after survey · Response within
hours · Finance available · Award badge). Sticky-mobile-CTA hides over the
assistant (mark the wrapper `data-quote-form`).
