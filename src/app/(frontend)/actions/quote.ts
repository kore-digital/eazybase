'use server'

import { getPayloadClient } from '@/lib/data'
import {
  clampMetres,
  estimateRange,
  estimateRangeFromArea,
  getExtensionType,
  getSizeBand,
  getSpec,
  PROPERTY_TYPES,
  TIMELINES,
} from '@/components/quote/pricing'

/**
 * Shared server action for both conversion forms:
 *  - /get-a-quote  → type 'full'   (consolidated long form)
 *  - /instant-quote → type 'instant' (estimator lead capture + payload)
 *
 * Validation is deliberately dependency-free (no zod) — plain checks that
 * mirror the client-side constraints, so the client attributes are UX and
 * this is the real gate.
 *
 * NOTE: 'use server' files may only export async functions — the initial
 * state constant lives in the client components instead.
 */

export type QuoteActionState = {
  status: 'idle' | 'success' | 'error'
  /** Top-level error message (shown in a role="alert" banner). */
  message?: string
  /** Per-field errors keyed by input name. */
  fieldErrors?: Record<string, string>
  /** Raw submitted values — echoed back so an error never loses input. */
  values?: Record<string, string>
}

/* ------------------------------------------------------------- validators */

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/
// UK numbers, after normalisation: 0xxxxxxxxxx (10–11 digits) or +44 followed by 9–10 digits.
const UK_PHONE_RE = /^(\+44|0)\d{9,10}$/
/**
 * Normalise a phone number the same way the tel inputs accept it
 * (pattern ^(\+44|0)[\d\s().-]{9,14}$): strip spaces/dots/dashes, drop a
 * parenthesised trunk zero after +44 ('+44(0)7845 655113' → '+447845655113'),
 * then strip any remaining parentheses.
 */
const normalisePhone = (raw: string): string =>
  raw
    .replace(/[\s.-]/g, '')
    .replace(/^\+44\(0\)/, '+44')
    .replace(/[()]/g, '')
// UK postcode, outward + inward, case-insensitive, optional space.
const UK_POSTCODE_RE = /^[A-Za-z]{1,2}\d[A-Za-z\d]?\s?\d[A-Za-z]{2}$/

const str = (formData: FormData, name: string, max = 200): string => {
  const raw = formData.get(name)
  return typeof raw === 'string' ? raw.trim().slice(0, max) : ''
}

/** Minimum ms a human plausibly needs between page load and submit. */
const MIN_SUBMIT_MS = 3000

export async function submitQuoteRequest(
  _prev: QuoteActionState,
  formData: FormData,
): Promise<QuoteActionState> {
  const formType = str(formData, 'formType')
  const type: 'full' | 'instant' | 'assistant' =
    formType === 'instant' ? 'instant' : formType === 'assistant' ? 'assistant' : 'full'

  const values: Record<string, string> = {
    firstName: str(formData, 'firstName', 80),
    lastName: str(formData, 'lastName', 80),
    email: str(formData, 'email', 160),
    phone: str(formData, 'phone', 24),
    postcode: str(formData, 'postcode', 12),
    addressLine1: str(formData, 'addressLine1', 160),
    town: str(formData, 'town', 80),
    message: str(formData, 'message', 4000),
    extensionType: str(formData, 'extensionType', 40),
  }

  // New optional shared fields (assistant supplies these; ignored elsewhere).
  // Validated against the known key sets so a tampered POST can't store junk.
  const propertyTypeRaw = str(formData, 'propertyType', 40)
  const propertyType = PROPERTY_TYPES.find((p) => p.key === propertyTypeRaw)?.key
  const timelineRaw = str(formData, 'timeline', 40)
  const timeline = TIMELINES.find((t) => t.key === timelineRaw)?.key
  const materialPreferences = str(formData, 'materialPreferences', 500)

  /* --------------------------------------------------------- spam checks */
  // Honeypot: a visually-hidden field humans never fill. Bots that fill it
  // (or JS-driven bots that submit faster than MIN_SUBMIT_MS) get a quiet
  // "success" — no error to learn from, nothing stored.
  // _eb_elapsed is measured entirely on the client's clock (submit − mount),
  // so server/client clock skew can never flag a real visitor. When it's
  // absent (no-JS, pre-hydration submit) we allow the request — the honeypot
  // remains the hard gate.
  const honeypot = str(formData, 'companyWebsite', 200)
  const elapsedRaw = str(formData, '_eb_elapsed', 20)
  const elapsed = Number(elapsedRaw)
  const tooFast = elapsedRaw !== '' && Number.isFinite(elapsed) && elapsed >= 0 && elapsed < MIN_SUBMIT_MS
  if (honeypot !== '' || tooFast) {
    return { status: 'success' }
  }

  /* ---------------------------------------------------------- validation */
  const fieldErrors: Record<string, string> = {}

  if (!values.firstName) fieldErrors.firstName = 'Please tell us your first name.'
  if (!values.lastName) fieldErrors.lastName = 'Please tell us your last name.'

  if (!values.email) {
    fieldErrors.email = 'Please enter your email address.'
  } else if (!EMAIL_RE.test(values.email)) {
    fieldErrors.email = 'That email address doesn’t look quite right.'
  }

  const phoneDigits = normalisePhone(values.phone)
  if (!values.phone) {
    fieldErrors.phone = 'Please enter a phone number.'
  } else if (!UK_PHONE_RE.test(phoneDigits)) {
    fieldErrors.phone = 'Please enter a valid UK phone number.'
  }

  if (!values.postcode) {
    fieldErrors.postcode = 'Please enter your postcode.'
  } else if (!UK_POSTCODE_RE.test(values.postcode)) {
    fieldErrors.postcode = 'Please enter a valid UK postcode.'
  }

  if (type === 'full' && !values.message) {
    fieldErrors.message = 'A few brief details help us quote accurately.'
  }

  /* --------------------------------------------- estimator payload (instant) */
  let estimator: {
    extensionType?: string
    sizeBand?: string
    areaM2?: number
    widthM?: number
    depthM?: number
    spec?: string
    estimateLow?: number
    estimateHigh?: number
  } = {}

  if (type === 'assistant') {
    // Assistant flow: size arrives as a band → representative m². Recompute the
    // range server-side from the band area — never trust any client £ figure.
    const typeKey = str(formData, 'estimatorType', 40)
    const specKey = str(formData, 'estimatorSpec', 40)
    const sizeBandKey = str(formData, 'estimatorSizeBand', 40)
    const extType = getExtensionType(typeKey)
    const spec = getSpec(specKey)
    const band = getSizeBand(sizeBandKey)
    if (extType && spec && band) {
      const range = estimateRangeFromArea(extType.key, spec.key, band.areaM2)
      estimator = {
        extensionType: extType.label,
        sizeBand: band.label,
        areaM2: band.areaM2,
        spec: spec.label,
        estimateLow: range.low,
        estimateHigh: range.high,
      }
    }
  } else if (type === 'instant') {
    const typeKey = str(formData, 'estimatorType', 40)
    const specKey = str(formData, 'estimatorSpec', 40)
    const widthM = Number(str(formData, 'estimatorWidthM', 10))
    const depthM = Number(str(formData, 'estimatorDepthM', 10))
    const extType = getExtensionType(typeKey)
    const spec = getSpec(specKey)
    if (extType && spec && Number.isFinite(widthM) && Number.isFinite(depthM)) {
      // Recompute server-side — never trust client £ figures. Store the SAME
      // clamped dimensions the estimate is computed from, so a tampered POST
      // can't persist dimensions that contradict the stored range.
      const width = clampMetres(widthM)
      const depth = clampMetres(depthM)
      const range = estimateRange(extType.key, spec.key, width, depth)
      estimator = {
        extensionType: extType.label,
        widthM: width,
        depthM: depth,
        spec: spec.label,
        estimateLow: range.low,
        estimateHigh: range.high,
      }
    }
  } else if (values.extensionType) {
    // Full form: the extension-type select is stored on the same group.
    estimator = { extensionType: values.extensionType }
  }

  if (Object.keys(fieldErrors).length > 0) {
    return {
      status: 'error',
      message: 'Please check the highlighted fields and try again.',
      fieldErrors,
      values,
    }
  }

  /* --------------------------------------------------------------- create */
  try {
    const payload = await getPayloadClient()
    await payload.create({
      collection: 'quote-requests',
      data: {
        type,
        firstName: values.firstName,
        lastName: values.lastName,
        email: values.email,
        phone: values.phone,
        postcode: values.postcode.toUpperCase(),
        addressLine1: values.addressLine1 || undefined,
        town: values.town || undefined,
        message: values.message || undefined,
        propertyType,
        timeline,
        materialPreferences: materialPreferences || undefined,
        estimator,
        status: 'new',
      },
    })
  } catch (error) {
    console.error('[quote action] failed to create quote request:', error)
    return {
      status: 'error',
      message:
        'Sorry — something went wrong sending your details. Please try again, or call us and we’ll take them over the phone.',
      values,
    }
  }

  return { status: 'success' }
}
