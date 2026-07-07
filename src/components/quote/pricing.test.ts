import { describe, expect, it } from 'vitest'

import {
  DEFAULT_QUOTE_PRICING,
  estimateRange,
  estimateRangeFromArea,
  resolveQuotePricing,
} from './pricing'

/**
 * Size-only pricing (from kitchen_size_grid.xlsx):
 *   low  = max(floor, floor + startRate × (area − floorArea))
 *   high = max(floor, flatRate × area)
 * both rounded to the nearest £250.
 */
describe('estimateRange (size-only)', () => {
  it('floors at the base price for the smallest size (3×3 = 9m²)', () => {
    const r = estimateRange(3, 3)
    expect(r.areaSqm).toBe(9)
    expect(r.low).toBe(22000)
    expect(r.high).toBe(22000)
  })

  it('prices a 4×4 (16m²) extension', () => {
    const r = estimateRange(4, 4)
    expect(r.areaSqm).toBe(16)
    // low = 22000 + 1000×(16−9) = 29000
    expect(r.low).toBe(29000)
    // high = 2321.43×16 = 37142.88 → 37250 (nearest £250)
    expect(r.high).toBe(37250)
  })

  it('prices the max size (14×4 = 56m²)', () => {
    const r = estimateRange(14, 4)
    expect(r.areaSqm).toBe(56)
    expect(r.low).toBe(69000) // 22000 + 1000×47
    expect(r.high).toBe(130000) // 2321.43×56 = 130000.08 → 130000
  })

  it('clamps dimensions beyond the configured caps', () => {
    // 20×10 clamps to 14×4 = 56m²
    expect(estimateRange(20, 10).areaSqm).toBe(56)
  })

  it('never drops below the price floor', () => {
    const r = estimateRange(3, 3)
    expect(r.low).toBeGreaterThanOrEqual(DEFAULT_QUOTE_PRICING.priceFloor)
    expect(r.high).toBeGreaterThanOrEqual(DEFAULT_QUOTE_PRICING.priceFloor)
  })

  it('honours overridden pricing params', () => {
    const pricing = resolveQuotePricing({ priceFloor: 30000, flatRatePerM2: 3000 })
    const r = estimateRange(4, 4, pricing)
    // low floored at 30000 (30000 + 1000×7 = 37000 wins) → 37000
    expect(r.low).toBe(37000)
    // high = 3000×16 = 48000
    expect(r.high).toBe(48000)
  })
})

describe('estimateRangeFromArea (assistant)', () => {
  it('matches estimateRange for the same area', () => {
    const fromArea = estimateRangeFromArea(16)
    const fromDims = estimateRange(4, 4)
    expect(fromArea.low).toBe(fromDims.low)
    expect(fromArea.high).toBe(fromDims.high)
  })
})

describe('resolveQuotePricing', () => {
  it('falls back to defaults for null/empty input', () => {
    expect(resolveQuotePricing(null)).toEqual(DEFAULT_QUOTE_PRICING)
    expect(resolveQuotePricing({})).toEqual(DEFAULT_QUOTE_PRICING)
  })
  it('ignores null fields and keeps valid overrides', () => {
    const r = resolveQuotePricing({ priceFloor: null, surveyFee: 500 })
    expect(r.priceFloor).toBe(DEFAULT_QUOTE_PRICING.priceFloor)
    expect(r.surveyFee).toBe(500)
  })
})
