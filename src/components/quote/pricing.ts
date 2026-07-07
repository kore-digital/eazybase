/**
 * Instant-quote estimator model — the single source of truth for the
 * indicative pricing shown on /instant-quote.
 *
 * ┌────────────────────────────────────────────────────────────────────┐
 * │ PLACEHOLDER RATES — TUNE HERE.                                     │
 * │ The £/m² spec rates and the type multipliers below are indicative  │
 * │ placeholders for launch. EazyBase should adjust them to reflect    │
 * │ real factory costings. Everything on the estimator recalculates    │
 * │ from this file — no other file contains pricing numbers.           │
 * └────────────────────────────────────────────────────────────────────┘
 *
 * The number shown to visitors is ALWAYS a range labelled "indicative,
 * subject to survey" — never present it as a formal quote.
 */

export type SpecKey = 'essential' | 'premium' | 'signature'
export type ExtensionTypeKey =
  | 'kitchen'
  | 'dining-room'
  | 'home-office'
  | 'playroom'
  | 'garden-room'
  | 'other'

export type SpecLevel = {
  key: SpecKey
  label: string
  /** Indicative base rate in £ per m² — placeholder, tune above. */
  ratePerSqm: number
  blurb: string
  inclusions: string[]
}

export type ExtensionType = {
  key: ExtensionTypeKey
  label: string
  /**
   * Cost multiplier vs a standard room. Kitchens carry plumbing, gas and
   * appliance first-fix; garden rooms are simpler standalone structures.
   * Placeholder values — tune alongside the spec rates.
   */
  multiplier: number
  blurb: string
}

export const SPEC_LEVELS: SpecLevel[] = [
  {
    key: 'essential',
    label: 'Essential',
    ratePerSqm: 1400, // ← indicative placeholder rate
    blurb: 'Everything you need, built to the same factory standard.',
    inclusions: [
      'Fully insulated modular structure',
      'uPVC double-glazed windows & door',
      'Plastered walls, ready to decorate',
      'Electric sockets & LED downlights',
      'Building control sign-off',
    ],
  },
  {
    key: 'premium',
    label: 'Premium',
    ratePerSqm: 1750, // ← indicative placeholder rate
    blurb: 'Our most popular level — upgraded glazing, finishes and light.',
    inclusions: [
      'Everything in Essential',
      'Aluminium bi-fold or French doors',
      'Roof light for natural daylight',
      '1× complimentary flat sky pod (1m × 1m) included',
      'Choice of external finishes',
    ],
  },
  {
    key: 'signature',
    label: 'Signature',
    ratePerSqm: 2100, // ← indicative placeholder rate
    blurb: 'The full statement build — top-spec glazing, roof lantern, detail everywhere.',
    inclusions: [
      'Everything in Premium',
      'Roof lantern & feature glazing',
      '1× complimentary flat sky pod (1m × 1m) included',
      'Smart lighting & extra circuits',
      'Premium cladding or render options',
    ],
  },
]

export const EXTENSION_TYPES: ExtensionType[] = [
  {
    key: 'kitchen',
    label: 'Kitchen',
    multiplier: 1.15, // plumbing, gas & appliance first-fix
    blurb: 'The most popular EazyBase build',
  },
  {
    key: 'dining-room',
    label: 'Dining Room',
    multiplier: 1.0,
    blurb: 'A brand-new space to gather in',
  },
  {
    key: 'home-office',
    label: 'Home Office',
    multiplier: 1.05, // extra data/electrical circuits
    blurb: 'Work from home, properly',
  },
  {
    key: 'playroom',
    label: 'Playroom',
    multiplier: 0.95,
    blurb: 'Keep the noise and mess contained',
  },
  {
    key: 'garden-room',
    label: 'Garden Room',
    multiplier: 0.9, // standalone, simpler tie-in
    blurb: 'A standalone retreat in the garden',
  },
  {
    key: 'other',
    label: 'Something Else',
    multiplier: 1.0,
    blurb: 'Bedroom, gym, annexe — you name it',
  },
]

/**
 * Property type / "house style" — captured for the team (access & complexity).
 * Does NOT change the headline range; stored on the lead for context.
 */
export const PROPERTY_TYPES = [
  { key: 'detached', label: 'Detached' },
  { key: 'semi', label: 'Semi-detached' },
  { key: 'terraced', label: 'Terraced' },
  { key: 'bungalow', label: 'Bungalow' },
  { key: 'flat', label: 'Flat / Other' },
] as const
export type PropertyTypeKey = (typeof PROPERTY_TYPES)[number]['key']

/**
 * Size bands for the Assistant (chat) flow — each maps to a representative m²
 * used to compute the indicative range. The wizard keeps its precise sliders.
 */
export const SIZE_BANDS = [
  { key: 'compact', label: 'Compact (up to 15m²)', areaM2: 12 },
  { key: 'medium', label: 'Medium (15–30m²)', areaM2: 22 },
  { key: 'large', label: 'Large (30m²+)', areaM2: 36 },
  { key: 'unsure', label: 'Not sure yet', areaM2: 22 },
] as const
export type SizeBandKey = (typeof SIZE_BANDS)[number]['key']

/** Rough timeline — routing signal for the team, not a price input. */
export const TIMELINES = [
  { key: 'asap', label: 'As soon as possible' },
  { key: '1-3m', label: '1–3 months' },
  { key: '3-6m', label: '3–6 months' },
  { key: 'exploring', label: 'Just exploring' },
] as const
export type TimelineKey = (typeof TIMELINES)[number]['key']

/** Look up a size band by key (defensive for server use). */
export function getSizeBand(key: string | null | undefined) {
  return SIZE_BANDS.find((b) => b.key === key)
}

/** Slider bounds for the size step (metres). */
export const SIZE_BOUNDS = {
  min: 2,
  max: 8,
  step: 0.5,
  defaultWidth: 4,
  defaultDepth: 3,
} as const

/**
 * Spread applied around the midpoint estimate to produce the low–high band.
 * Wide enough to be honest about survey variables (ground works, access,
 * services), tight enough to be useful.
 */
export const RANGE_SPREAD = { low: 0.92, high: 1.12 } as const

/** Round to a friendly £250 so the range never looks spuriously precise. */
const roundTo = (value: number, nearest = 250) => Math.round(value / nearest) * nearest

export type EstimateRange = {
  areaSqm: number
  low: number
  high: number
}

export function getSpec(key: string | null | undefined): SpecLevel | undefined {
  return SPEC_LEVELS.find((s) => s.key === key)
}

export function getExtensionType(key: string | null | undefined): ExtensionType | undefined {
  return EXTENSION_TYPES.find((t) => t.key === key)
}

/** Clamp a metre dimension into the slider bounds (defensive for server use). */
export function clampMetres(value: number): number {
  if (!Number.isFinite(value)) return SIZE_BOUNDS.min
  const stepped = Math.round(value / SIZE_BOUNDS.step) * SIZE_BOUNDS.step
  return Math.min(SIZE_BOUNDS.max, Math.max(SIZE_BOUNDS.min, stepped))
}

/**
 * The whole model: area × spec rate × type multiplier, spread into a band.
 * Used identically on the client (live preview) and the server (persisted
 * with the lead) so the stored figures always match what the visitor saw.
 */
export function estimateRange(
  typeKey: ExtensionTypeKey | string,
  specKey: SpecKey | string,
  widthM: number,
  depthM: number,
): EstimateRange {
  const spec = getSpec(specKey) ?? SPEC_LEVELS[0]
  const type = getExtensionType(typeKey) ?? EXTENSION_TYPES[EXTENSION_TYPES.length - 1]
  const width = clampMetres(widthM)
  const depth = clampMetres(depthM)
  const areaSqm = Math.round(width * depth * 10) / 10
  const midpoint = areaSqm * spec.ratePerSqm * type.multiplier
  return {
    areaSqm,
    low: roundTo(midpoint * RANGE_SPREAD.low),
    high: roundTo(midpoint * RANGE_SPREAD.high),
  }
}

/**
 * Area-based variant of the same model for the Assistant flow: the size band's
 * representative m² is the chargeable area, then area × spec rate × type
 * multiplier, spread into the same low–high band. Identical maths to
 * {@link estimateRange}, just fed a band area instead of width × depth — so a
 * chat lead and a wizard lead of the same size produce the same figures.
 */
export function estimateRangeFromArea(
  typeKey: ExtensionTypeKey | string,
  specKey: SpecKey | string,
  areaM2: number,
): { low: number; high: number } {
  const spec = getSpec(specKey) ?? SPEC_LEVELS[0]
  const type = getExtensionType(typeKey) ?? EXTENSION_TYPES[EXTENSION_TYPES.length - 1]
  const area = Number.isFinite(areaM2) && areaM2 > 0 ? areaM2 : SIZE_BANDS[1].areaM2
  const midpoint = area * spec.ratePerSqm * type.multiplier
  return {
    low: roundTo(midpoint * RANGE_SPREAD.low),
    high: roundTo(midpoint * RANGE_SPREAD.high),
  }
}
