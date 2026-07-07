/**
 * Instant-quote estimator model — the single source of truth for the
 * indicative pricing shown on /instant-quote.
 *
 * PRICING IS SIZE-ONLY. The indicative range is derived from the floor area
 * (width × depth) alone via two straight-line formulas (see estimateRange).
 * Extension TYPE and finish/SPEC are still captured on the lead for context
 * but do NOT change the price. The numbers live in {@link DEFAULT_QUOTE_PRICING}
 * and are overridable per-site via the editable "Quote pricing" global — the
 * defaults here are the fallback used when the CMS is empty or unreachable.
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
  // key stays 'flat' (the stored DB enum value) — only the label changed to
  // "Out house" so no property-type enum migration is needed.
  { key: 'flat', label: 'Out house' },
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

/**
 * Editable pricing parameters — the size-only model plus the survey-fee and
 * size-cap settings. Mirrored by the "Quote pricing" Payload global so the
 * client can tune every number in the admin; these are the fallback defaults.
 */
export type QuotePricing = {
  /** Base price (£) that always applies — covers up to `floorAreaM2`. */
  priceFloor: number
  /** Floor area (m²) included in `priceFloor` before the per-m² rate kicks in. */
  floorAreaM2: number
  /** £/m² added to the LOW (start) price for each m² above the floor area. */
  startRatePerM2: number
  /** £/m² flat rate that sets the HIGH (upper) price. */
  flatRatePerM2: number
  /** Survey call-out fee (£) added when a postcode is beyond the radius. */
  surveyFee: number
  /** Straight-line distance (miles) from `basePostcode` that triggers the fee. */
  surveyDistanceMiles: number
  /** Base/HQ postcode the survey distance is measured from. */
  basePostcode: string
  minWidthM: number
  maxWidthM: number
  minDepthM: number
  maxDepthM: number
  /** Slider granularity (m). */
  stepM: number
}

export const DEFAULT_QUOTE_PRICING: QuotePricing = {
  priceFloor: 22000,
  floorAreaM2: 9,
  startRatePerM2: 1000,
  flatRatePerM2: 2321.43,
  surveyFee: 300,
  surveyDistanceMiles: 40,
  basePostcode: 'BB2 7AN', // 495 Preston New Road, Blackburn
  minWidthM: 3,
  maxWidthM: 14,
  minDepthM: 3,
  maxDepthM: 4,
  stepM: 0.5,
}

/**
 * Merge the (nullable) values from the Quote pricing global with the defaults,
 * so a missing/empty field never produces NaN pricing. Safe on client + server.
 */
export function resolveQuotePricing(
  // Accepts the raw Quote-pricing global (fields are number | null | undefined),
  // so keys are read as `unknown` and coerced with defaults.
  raw?: { [K in keyof QuotePricing]?: unknown } | null,
): QuotePricing {
  const D = DEFAULT_QUOTE_PRICING
  if (!raw) return D
  const num = (v: unknown, d: number) => (typeof v === 'number' && Number.isFinite(v) ? v : d)
  return {
    priceFloor: num(raw.priceFloor, D.priceFloor),
    floorAreaM2: num(raw.floorAreaM2, D.floorAreaM2),
    startRatePerM2: num(raw.startRatePerM2, D.startRatePerM2),
    flatRatePerM2: num(raw.flatRatePerM2, D.flatRatePerM2),
    surveyFee: num(raw.surveyFee, D.surveyFee),
    surveyDistanceMiles: num(raw.surveyDistanceMiles, D.surveyDistanceMiles),
    basePostcode:
      typeof raw.basePostcode === 'string' && raw.basePostcode.trim()
        ? raw.basePostcode.trim()
        : D.basePostcode,
    minWidthM: num(raw.minWidthM, D.minWidthM),
    maxWidthM: num(raw.maxWidthM, D.maxWidthM),
    minDepthM: num(raw.minDepthM, D.minDepthM),
    maxDepthM: num(raw.maxDepthM, D.maxDepthM),
    stepM: num(raw.stepM, D.stepM),
  }
}

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

/** Clamp a metre dimension onto the [min, max] step grid (defensive, server-safe). */
export function clampMetres(value: number, min: number, max: number, step = 0.5): number {
  if (!Number.isFinite(value)) return min
  const stepped = Math.round(value / step) * step
  return Math.min(max, Math.max(min, Math.round(stepped * 100) / 100))
}

/** Low/high band from a floor area (m²) — the shared size-only formula. */
function bandFromArea(areaSqm: number, pricing: QuotePricing): { low: number; high: number } {
  const low = Math.max(
    pricing.priceFloor,
    pricing.priceFloor + pricing.startRatePerM2 * (areaSqm - pricing.floorAreaM2),
  )
  const high = Math.max(pricing.priceFloor, pricing.flatRatePerM2 * areaSqm)
  return { low: roundTo(low), high: roundTo(high) }
}

/**
 * The whole model — size only. Area (width × depth) drives a low (start) and a
 * high (flat-rate) figure. Used identically on the client (live preview) and
 * the server (persisted with the lead) so the stored figures always match what
 * the visitor saw. Dimensions are clamped to the configured caps.
 */
export function estimateRange(
  widthM: number,
  depthM: number,
  pricing: QuotePricing = DEFAULT_QUOTE_PRICING,
): EstimateRange {
  const width = clampMetres(widthM, pricing.minWidthM, pricing.maxWidthM, pricing.stepM)
  const depth = clampMetres(depthM, pricing.minDepthM, pricing.maxDepthM, pricing.stepM)
  const areaSqm = Math.round(width * depth * 10) / 10
  const { low, high } = bandFromArea(areaSqm, pricing)
  return { areaSqm, low, high }
}

/**
 * Area-based variant for the Assistant flow: the size band's representative m²
 * is the chargeable area, fed through the same size-only formula as
 * {@link estimateRange} — so a chat lead and a wizard lead of the same size
 * produce the same figures.
 */
export function estimateRangeFromArea(
  areaM2: number,
  pricing: QuotePricing = DEFAULT_QUOTE_PRICING,
): { low: number; high: number } {
  const area = Number.isFinite(areaM2) && areaM2 > 0 ? areaM2 : SIZE_BANDS[1].areaM2
  return bandFromArea(area, pricing)
}
