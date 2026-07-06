'use server'

import { getPayloadClient } from '@/lib/data'
import { estimateRange, getExtensionType, getSpec } from '@/components/quote/pricing'

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
// UK numbers: 0xxxxxxxxxx (10–11 digits) or +44 followed by 9–10 digits.
const UK_PHONE_RE = /^(?:\+44\d{9,10}|0\d{9,10})$/
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
  const type = str(formData, 'formType') === 'instant' ? 'instant' : 'full'

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

  const phoneDigits = values.phone.replace(/[\s().-]/g, '')
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
    widthM?: number
    depthM?: number
    spec?: string
    estimateLow?: number
    estimateHigh?: number
  } = {}

  if (type === 'instant') {
    const typeKey = str(formData, 'estimatorType', 40)
    const specKey = str(formData, 'estimatorSpec', 40)
    const widthM = Number(str(formData, 'estimatorWidthM', 10))
    const depthM = Number(str(formData, 'estimatorDepthM', 10))
    const extType = getExtensionType(typeKey)
    const spec = getSpec(specKey)
    if (extType && spec && Number.isFinite(widthM) && Number.isFinite(depthM)) {
      // Recompute server-side from the raw inputs — never trust client £ figures.
      const range = estimateRange(extType.key, spec.key, widthM, depthM)
      estimator = {
        extensionType: extType.label,
        widthM,
        depthM,
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
