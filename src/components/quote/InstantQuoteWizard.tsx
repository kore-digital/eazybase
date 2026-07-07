'use client'

import { AnimatePresence, motion, useReducedMotion } from 'motion/react'
import { useActionState, useEffect, useRef, useState } from 'react'

import { submitQuoteRequest, type QuoteActionState } from '@/app/(frontend)/actions/quote'
import { AnimatedCounter } from '@/components/ui/AnimatedCounter'
import {
  EXTENSION_TYPES,
  PROPERTY_TYPES,
  clampMetres,
  estimateRange,
  type ExtensionTypeKey,
  type PropertyTypeKey,
  type QuotePricing,
} from '@/components/quote/pricing'
import { SuccessPanel } from '@/components/quote/SuccessPanel'
import { TypeIcon } from '@/components/quote/TypeIcon'
import { useSiteContact } from '@/components/layout/SiteContactProvider'
import { distanceMilesBetween } from '@/lib/geo'
import { formatPhone } from '@/lib/format'

/**
 * The instant-quote estimator. Pricing is SIZE-ONLY (see pricing.ts):
 *   1. extension type  →  2. size (width × depth sliders, capped)
 *   →  3. property type  →  4. location (postcode → survey fee)  →  5. result
 * then an animated indicative £range + inline lead capture that persists the
 * estimator payload through the shared quote server action (type 'instant').
 * Sizes beyond the caps route to a bespoke enquiry (WhatsApp + contact form).
 * The figure is ALWAYS presented as indicative, never as a formal quote.
 */

type Step = 1 | 2 | 3 | 4 | 5

const STEP_LABELS = ['Type', 'Size', 'Property', 'Location'] as const

const inputClass =
  'w-full rounded-lg border border-ink-200 bg-white px-4 py-3 text-ink-800 placeholder:text-ink-300 transition-[box-shadow,border-color] duration-200 outline-none hover:border-ink-300 focus:border-brand-500 focus:ring-4 focus:ring-brand-500/25'

const labelClass = 'mb-1.5 block font-display text-sm font-semibold text-ink-800'

const formatGBP = (n: number) => `£${n.toLocaleString('en-GB')}`

const UK_POSTCODE_RE = /^[A-Za-z]{1,2}\d[A-Za-z\d]?\s?\d[A-Za-z]{2}$/

const initialQuoteState: QuoteActionState = { status: 'idle' }

/**
 * Small house glyphs for the property-type cards, drawn in the same angled
 * block language as TypeIcon (a green skewed plinth + a simple ink roofline).
 * Decorative — the cards carry their own text labels.
 */
function PropertyIcon({ type, className }: { type: PropertyTypeKey; className?: string }) {
  const GREEN = 'var(--color-brand-500)'
  const INK = 'var(--color-ink-700)'
  const roof: Record<PropertyTypeKey, React.ReactNode> = {
    detached: <path d="M14 20 24 12 34 20 34 30 14 30 Z" />,
    semi: <path d="M8 20 18 13 28 20 28 30 8 30 Z M28 22 34 17 40 22 40 30 28 30 Z" />,
    terraced: <path d="M6 21 13 16 20 21 20 30 6 30 Z M20 21 27 16 34 21 34 30 20 30 Z M34 21 41 16 44 18 44 30 34 30 Z" />,
    bungalow: <path d="M8 24 24 15 40 24 40 30 8 30 Z" />,
    // 'flat' key, "Out house" label — a small pitched outbuilding with a door.
    flat: <path d="M16 21 24 14 32 21 32 30 16 30 Z M22 24 26 24 26 30 22 30 Z" />,
  }
  return (
    <svg viewBox="0 0 48 40" className={className} fill="none" aria-hidden="true">
      <path d="M8 36 12 30 40 30 36 36 Z" fill={GREEN} />
      <g fill="none" stroke={INK} strokeWidth={2.2} strokeLinejoin="round" strokeLinecap="round">
        {roof[type]}
      </g>
    </svg>
  )
}

/** Inline field error, announced to screen readers and referenced by the input. */
function FieldError({ id, message }: { id: string; message?: string }) {
  if (!message) return null
  return (
    <p id={id} role="alert" className="mt-1.5 text-sm text-red-600">
      {message}
    </p>
  )
}

/* ------------------------------------------------------------ progress dots */

function ProgressDots({
  step,
  maxStep,
  onJump,
}: {
  step: Step
  maxStep: Step
  onJump: (s: Step) => void
}) {
  return (
    <ol className="flex items-center justify-center gap-0" aria-label="Estimator progress">
      {STEP_LABELS.map((label, i) => {
        const number = (i + 1) as Step
        const done = step > number
        const current = step === number
        // Any step already reached can be jumped to (back or forward).
        const reachable = number <= maxStep && !current
        return (
          <li key={label} className="flex items-center">
            {i > 0 ? (
              <span
                aria-hidden="true"
                className={[
                  'mx-2 h-0.5 w-8 rounded-full transition-colors duration-300 sm:w-14',
                  done || current ? 'bg-brand-500' : 'bg-ink-200',
                ].join(' ')}
              />
            ) : null}
            <button
              type="button"
              onClick={() => reachable && onJump(number)}
              disabled={!reachable}
              aria-current={current ? 'step' : undefined}
              aria-label={reachable ? `Go to step ${number}: ${label}` : `Step ${number}: ${label}`}
              className={['group flex items-center', reachable ? 'cursor-pointer' : 'cursor-default'].join(' ')}
            >
              <span
                className={[
                  'flex h-8 w-8 items-center justify-center rounded-full font-display text-xs font-bold transition-colors duration-300',
                  done
                    ? 'bg-brand-500 text-ink-950 group-hover:bg-brand-600'
                    : current
                      ? 'border-2 border-brand-500 bg-white text-brand-800'
                      : 'border-2 border-ink-200 bg-white text-ink-500',
                ].join(' ')}
              >
                {done ? '✓' : number}
              </span>
              <span
                className={[
                  'ml-2 hidden font-display text-xs font-semibold tracking-wide uppercase transition-colors sm:inline',
                  current ? 'text-ink-800' : 'text-ink-500',
                  reachable ? 'group-hover:text-ink-800' : '',
                ].join(' ')}
              >
                {label}
              </span>
            </button>
          </li>
        )
      })}
    </ol>
  )
}

/* ------------------------------------------------------------------ wizard */

export function InstantQuoteWizard({ pricing }: { pricing: QuotePricing }) {
  const reducedMotion = useReducedMotion()
  const { phone, phoneHref, whatsappHref } = useSiteContact()

  const [step, setStep] = useState<Step>(1)
  const [maxStep, setMaxStep] = useState<Step>(1)
  const [direction, setDirection] = useState<1 | -1>(1)
  const [typeKey, setTypeKey] = useState<ExtensionTypeKey | null>(null)
  const [widthM, setWidthM] = useState<number>(() =>
    clampMetres(4, pricing.minWidthM, pricing.maxWidthM, pricing.stepM),
  )
  const [depthM, setDepthM] = useState<number>(() =>
    clampMetres(3, pricing.minDepthM, pricing.maxDepthM, pricing.stepM),
  )
  const [propertyKey, setPropertyKey] = useState<PropertyTypeKey | null>(null)
  const [bespokeOpen, setBespokeOpen] = useState(false)

  // Location step: postcode → survey fee (recomputed authoritatively on submit).
  const [postcode, setPostcode] = useState('')
  const [postcodeError, setPostcodeError] = useState<string | null>(null)
  const [checkingPostcode, setCheckingPostcode] = useState(false)
  const [surveyFee, setSurveyFee] = useState(0)
  const [distanceMiles, setDistanceMiles] = useState<number | null>(null)

  const [state, formAction, isPending] = useActionState<QuoteActionState, FormData>(
    submitQuoteRequest,
    initialQuoteState,
  )

  // Min-time-to-submit spam check: elapsed time measured on the client clock
  // (submit − mount) and stamped into the hidden field at submit — immune to
  // server/client clock skew (see server action).
  const mountedAt = useRef(0)
  const elapsedRef = useRef<HTMLInputElement>(null)
  useEffect(() => {
    mountedAt.current = Date.now()
  }, [])
  const stampElapsed = () => {
    if (elapsedRef.current && mountedAt.current > 0) {
      elapsedRef.current.value = String(Date.now() - mountedAt.current)
    }
  }

  // On step change, move keyboard focus to the incoming step's heading —
  // AnimatePresence unmounts the button that had focus, which would otherwise
  // drop focus to <body>. The ref callback fires when the new heading mounts
  // (after the exit animation in mode="wait").
  const pendingHeadingFocus = useRef(false)
  const focusStepHeading = (el: HTMLHeadingElement | null) => {
    if (el && pendingHeadingFocus.current) {
      pendingHeadingFocus.current = false
      el.focus()
    }
  }

  const go = (next: Step) => {
    setDirection(next > step ? 1 : -1)
    setStep(next)
    setMaxStep((m) => (next > m ? next : m))
    pendingHeadingFocus.current = true
  }

  // Location step submit — geocode the postcode, work out the survey fee, then
  // advance. A geocode failure just proceeds with no fee (the server, which is
  // authoritative, will reach the same conclusion from the same postcode).
  const checkPostcode = async () => {
    const pc = postcode.trim()
    if (!UK_POSTCODE_RE.test(pc)) {
      setPostcodeError('Please enter a valid UK postcode.')
      return
    }
    setPostcodeError(null)
    setCheckingPostcode(true)
    try {
      const miles = await distanceMilesBetween(pc, pricing.basePostcode)
      if (miles != null) {
        setDistanceMiles(Math.round(miles * 10) / 10)
        setSurveyFee(miles >= pricing.surveyDistanceMiles ? pricing.surveyFee : 0)
      } else {
        setDistanceMiles(null)
        setSurveyFee(0)
      }
    } catch {
      setDistanceMiles(null)
      setSurveyFee(0)
    } finally {
      setCheckingPostcode(false)
    }
    setPostcode(pc.toUpperCase())
    go(5)
  }

  const chosenType = EXTENSION_TYPES.find((t) => t.key === typeKey)
  /** Readable noun for sentences — "Something Else" would read oddly. */
  const typeNoun = chosenType && chosenType.key !== 'other' ? chosenType.label.toLowerCase() : 'extension'
  const range = estimateRange(widthM, depthM, pricing)

  const slide = reducedMotion
    ? {}
    : {
        initial: { opacity: 0, x: 48 * direction },
        animate: { opacity: 1, x: 0 },
        exit: { opacity: 0, x: -48 * direction },
        transition: { duration: 0.35, ease: [0.16, 1, 0.3, 1] as const },
      }

  if (state.status === 'success') {
    return <SuccessPanel heading="Thank you — your estimate is on its way to our team" />
  }

  return (
    // data-quote-form: tells StickyMobileCTA to hide while the estimator is
    // in view, so the fixed bar never overlays the active quote flow.
    <div className="mx-auto max-w-3xl" data-quote-form>
      <ProgressDots step={step} maxStep={maxStep} onJump={go} />

      <div className="relative mt-8 overflow-hidden" aria-live="polite">
        <AnimatePresence mode="wait" initial={false}>
          {/* ---------------------------------------------- step 1: type */}
          {step === 1 ? (
            <motion.div key="step-1" {...slide}>
              <h2
                ref={focusStepHeading}
                tabIndex={-1}
                className="text-center font-display text-xl font-semibold text-ink-900 outline-none"
              >
                What would you like to build?
              </h2>
              <div className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-3 sm:gap-4">
                {EXTENSION_TYPES.map((t) => {
                  const selected = typeKey === t.key
                  return (
                    <button
                      key={t.key}
                      type="button"
                      aria-pressed={selected}
                      onClick={() => {
                        setTypeKey(t.key)
                        go(2)
                      }}
                      className={[
                        'group rounded-xl border-2 bg-white p-4 text-center transition-all duration-200',
                        'hover:-translate-y-0.5 hover:border-brand-400 hover:shadow-md',
                        'focus-visible:ring-4 focus-visible:ring-brand-500/30 focus-visible:outline-none',
                        selected ? 'border-brand-500 shadow-md' : 'border-ink-100',
                      ].join(' ')}
                    >
                      <TypeIcon type={t.key} className="mx-auto h-14 w-16" />
                      <span className="mt-2 block font-display text-sm font-semibold text-ink-900">
                        {t.label}
                      </span>
                      <span className="mt-0.5 block text-xs leading-snug text-ink-500">
                        {t.blurb}
                      </span>
                    </button>
                  )
                })}
              </div>
            </motion.div>
          ) : null}

          {/* ---------------------------------------------- step 2: size */}
          {step === 2 ? (
            <motion.div key="step-2" {...slide}>
              <h2
                ref={focusStepHeading}
                tabIndex={-1}
                className="text-center font-display text-xl font-semibold text-ink-900 outline-none"
              >
                Roughly how big{chosenType ? ` will your ${typeNoun} be` : ''}?
              </h2>
              <p className="mt-2 text-center text-sm text-ink-500">
                Slide to your nearest guess — the survey pins down exact sizes later.
              </p>

              <div className="mx-auto mt-8 max-w-xl space-y-8">
                {(
                  [
                    {
                      name: 'Width',
                      value: widthM,
                      set: setWidthM,
                      id: 'iq-width',
                      min: pricing.minWidthM,
                      max: pricing.maxWidthM,
                    },
                    {
                      name: 'Depth',
                      value: depthM,
                      set: setDepthM,
                      id: 'iq-depth',
                      min: pricing.minDepthM,
                      max: pricing.maxDepthM,
                    },
                  ] as const
                ).map((dim) => (
                  <div key={dim.id}>
                    <div className="flex items-baseline justify-between">
                      <label htmlFor={dim.id} className="font-display text-sm font-semibold text-ink-800">
                        {dim.name}
                      </label>
                      <span className="font-display text-lg font-bold text-brand-800">
                        {dim.value.toFixed(1).replace(/\.0$/, '')} m
                      </span>
                    </div>
                    <input
                      id={dim.id}
                      type="range"
                      min={dim.min}
                      max={dim.max}
                      step={pricing.stepM}
                      value={dim.value}
                      onChange={(e) => dim.set(Number(e.target.value))}
                      className="eb-range mt-2"
                      aria-valuetext={`${dim.value} metres`}
                    />
                    <div className="mt-1 flex justify-between text-xs text-ink-500">
                      <span>{dim.min} m</span>
                      <span>{dim.max} m</span>
                    </div>
                  </div>
                ))}

                {/* live area readout */}
                <p
                  className="rounded-lg bg-ink-50 px-5 py-4 text-center font-display text-ink-800"
                  aria-live="polite"
                >
                  <span className="text-sm text-ink-500">Floor area: </span>
                  <strong className="text-lg font-bold text-ink-900">{range.areaSqm} m²</strong>
                </p>

                {/* Bespoke escape hatch — anything beyond the sliders' caps */}
                <div className="rounded-lg border border-dashed border-ink-200 px-5 py-4 text-center">
                  <button
                    type="button"
                    onClick={() => setBespokeOpen((o) => !o)}
                    aria-expanded={bespokeOpen}
                    className="font-display text-sm font-semibold text-brand-800 underline-offset-4 hover:underline"
                  >
                    Bigger than {pricing.maxWidthM}m × {pricing.maxDepthM}m, or a different shape?
                  </button>
                  {bespokeOpen ? (
                    <div className="mt-3">
                      <p className="text-sm text-ink-600">
                        No problem — we build bespoke too. Send us the details and we’ll price it up
                        directly.
                      </p>
                      <div className="mt-4 flex flex-wrap items-center justify-center gap-3">
                        <a
                          href={whatsappHref}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="eb-btn bg-[#25D366] px-5 py-2.5 text-xs text-ink-950 hover:brightness-95"
                        >
                          WhatsApp us
                        </a>
                        <a href="/get-a-quote" className="eb-btn-dark px-5 py-2.5 text-xs">
                          Send a bespoke enquiry
                        </a>
                      </div>
                    </div>
                  ) : null}
                </div>
              </div>

              <div className="mt-8 flex items-center justify-between">
                <button type="button" onClick={() => go(1)} className="text-sm font-semibold text-ink-500 underline-offset-4 hover:text-ink-800 hover:underline">
                  ← Back
                </button>
                <button type="button" onClick={() => go(3)} className="eb-btn-primary">
                  Continue
                </button>
              </div>
            </motion.div>
          ) : null}

          {/* -------------------------------------- step 3: property type */}
          {step === 3 ? (
            <motion.div key="step-property" {...slide}>
              <h2
                ref={focusStepHeading}
                tabIndex={-1}
                className="text-center font-display text-xl font-semibold text-ink-900 outline-none"
              >
                What type of property is it?
              </h2>
              <p className="mt-2 text-center text-sm text-ink-500">
                It helps us plan access and groundwork. It won’t change your estimate.
              </p>
              <div className="mx-auto mt-6 grid max-w-lg grid-cols-2 gap-3 sm:grid-cols-3 sm:gap-4">
                {PROPERTY_TYPES.map((p) => {
                  const selected = propertyKey === p.key
                  return (
                    <button
                      key={p.key}
                      type="button"
                      aria-pressed={selected}
                      onClick={() => {
                        setPropertyKey(p.key)
                        go(4)
                      }}
                      className={[
                        'group rounded-xl border-2 bg-white p-4 text-center transition-all duration-200',
                        'hover:-translate-y-0.5 hover:border-brand-400 hover:shadow-md',
                        'focus-visible:ring-4 focus-visible:ring-brand-500/30 focus-visible:outline-none',
                        selected ? 'border-brand-500 shadow-md' : 'border-ink-100',
                      ].join(' ')}
                    >
                      <PropertyIcon type={p.key} className="mx-auto h-10 w-12" />
                      <span className="mt-2 block font-display text-sm font-semibold text-ink-900">
                        {p.label}
                      </span>
                    </button>
                  )
                })}
              </div>
              <div className="mt-8 text-center">
                <button
                  type="button"
                  onClick={() => go(2)}
                  className="text-sm font-semibold text-ink-500 underline-offset-4 hover:text-ink-800 hover:underline"
                >
                  ← Back
                </button>
              </div>
            </motion.div>
          ) : null}

          {/* -------------------------------------- step 4: location/postcode */}
          {step === 4 ? (
            <motion.div key="step-location" {...slide}>
              <h2
                ref={focusStepHeading}
                tabIndex={-1}
                className="text-center font-display text-xl font-semibold text-ink-900 outline-none"
              >
                Last one — what’s your postcode?
              </h2>
              <p className="mt-2 text-center text-sm text-ink-500">
                We build from Blackburn. Any job {pricing.surveyDistanceMiles} miles or more away
                has a £{pricing.surveyFee} survey fee — and if you decide to go ahead, that fee is
                deducted from your final price.
              </p>

              <div className="mx-auto mt-8 max-w-sm">
                <label htmlFor="iq-loc-postcode" className={labelClass}>
                  Postcode
                </label>
                <input
                  id="iq-loc-postcode"
                  type="text"
                  autoComplete="postal-code"
                  inputMode="text"
                  value={postcode}
                  onChange={(e) => {
                    setPostcode(e.target.value)
                    if (postcodeError) setPostcodeError(null)
                  }}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault()
                      void checkPostcode()
                    }
                  }}
                  placeholder="e.g. BB1 2AB"
                  aria-invalid={postcodeError ? true : undefined}
                  aria-describedby={postcodeError ? 'iq-loc-postcode-error' : undefined}
                  className={inputClass}
                />
                <FieldError id="iq-loc-postcode-error" message={postcodeError ?? undefined} />
              </div>

              <div className="mt-8 flex items-center justify-between">
                <button
                  type="button"
                  onClick={() => go(3)}
                  className="text-sm font-semibold text-ink-500 underline-offset-4 hover:text-ink-800 hover:underline"
                >
                  ← Back
                </button>
                <button
                  type="button"
                  onClick={() => void checkPostcode()}
                  disabled={checkingPostcode}
                  className="eb-btn-primary disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {checkingPostcode ? 'Checking…' : 'See my estimate'}
                </button>
              </div>
            </motion.div>
          ) : null}

          {/* --------------------------------------- step 5: result + lead */}
          {step === 5 && chosenType ? (
            <motion.div key="step-result" {...slide}>
              {/* Indicative range */}
              <div className="rounded-xl bg-ink-900 px-6 py-10 text-center text-white">
                <h2
                  ref={focusStepHeading}
                  tabIndex={-1}
                  className="font-display text-xs font-semibold tracking-[0.2em] text-brand-400 uppercase outline-none"
                >
                  Your indicative range
                </h2>
                <p className="mt-4 font-display text-4xl font-bold sm:text-5xl">
                  <AnimatedCounter value={range.low} prefix="£" duration={1.2} />
                  <span className="mx-2 text-ink-400">–</span>
                  <AnimatedCounter value={range.high} prefix="£" duration={1.6} />
                </p>
                <p className="mt-3 text-sm text-ink-300">
                  indicative, subject to survey — for a {typeNoun} of about {range.areaSqm} m²
                </p>

                {surveyFee > 0 ? (
                  <div className="mx-auto mt-5 max-w-md rounded-lg border border-brand-400/30 bg-brand-500/10 px-4 py-3 text-sm text-brand-200">
                    <span className="font-semibold text-white">+ {formatGBP(surveyFee)} survey fee</span>
                    {distanceMiles ? (
                      <span className="text-ink-300"> (you’re ~{Math.round(distanceMiles)} miles from us)</span>
                    ) : null}
                    <span className="mt-1 block text-xs text-ink-300">
                      If you go ahead with the job, the survey fee is deducted from your final cost.
                    </span>
                  </div>
                ) : null}

                <p className="mx-auto mt-4 max-w-md text-xs leading-relaxed text-ink-400">
                  This is a guide range, not a formal quote. Every EazyBase project is priced
                  properly after a survey — ground works, access and your exact design all
                  shape the final figure.
                </p>
                <button
                  type="button"
                  onClick={() => go(1)}
                  className="mt-5 text-xs font-semibold text-brand-400 underline-offset-4 hover:underline"
                >
                  Change my choices
                </button>
              </div>

              {/* Lead capture */}
              <div className="mt-8 rounded-xl border border-ink-100 bg-white p-6 sm:p-8">
                <h2 className="font-display text-xl font-semibold text-ink-900">
                  Get your accurate quote
                </h2>
                <p className="mt-1.5 text-sm text-ink-500">
                  Send us your estimate and we’ll come back within 1 working day with a proper,
                  no-obligation quotation.
                </p>

                {state.status === 'error' && state.message ? (
                  <div
                    role="alert"
                    className="mt-4 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700"
                  >
                    {state.message}
                  </div>
                ) : null}

                <form action={formAction} onSubmit={stampElapsed} className="mt-5 space-y-4">
                  <input type="hidden" name="formType" value="instant" />
                  <input ref={elapsedRef} type="hidden" name="_eb_elapsed" defaultValue="" />
                  {/* Estimator payload — the server recomputes the £range and survey
                      fee from these raw inputs (size-only; type is captured, not priced). */}
                  <input type="hidden" name="estimatorType" value={chosenType.key} />
                  <input type="hidden" name="estimatorWidthM" value={widthM} />
                  <input type="hidden" name="estimatorDepthM" value={depthM} />
                  {propertyKey ? (
                    <input type="hidden" name="propertyType" value={propertyKey} />
                  ) : null}

                  {/* Honeypot */}
                  <div aria-hidden="true" className="absolute -left-[9999px] h-px w-px overflow-hidden">
                    <label htmlFor="iq-companyWebsite">Leave this field empty</label>
                    <input type="text" id="iq-companyWebsite" name="companyWebsite" tabIndex={-1} autoComplete="off" />
                  </div>

                  <div className="grid gap-4 sm:grid-cols-2">
                    <div>
                      <label htmlFor="iq-first-name" className={labelClass}>
                        First name <span className="text-brand-800">*</span>
                      </label>
                      <input
                        id="iq-first-name"
                        name="firstName"
                        type="text"
                        required
                        autoComplete="given-name"
                        defaultValue={state.values?.firstName}
                        aria-invalid={state.fieldErrors?.firstName ? true : undefined}
                        aria-describedby={state.fieldErrors?.firstName ? 'iq-first-name-error' : undefined}
                        className={inputClass}
                      />
                      <FieldError id="iq-first-name-error" message={state.fieldErrors?.firstName} />
                    </div>
                    <div>
                      <label htmlFor="iq-last-name" className={labelClass}>
                        Last name <span className="text-brand-800">*</span>
                      </label>
                      <input
                        id="iq-last-name"
                        name="lastName"
                        type="text"
                        required
                        autoComplete="family-name"
                        defaultValue={state.values?.lastName}
                        aria-invalid={state.fieldErrors?.lastName ? true : undefined}
                        aria-describedby={state.fieldErrors?.lastName ? 'iq-last-name-error' : undefined}
                        className={inputClass}
                      />
                      <FieldError id="iq-last-name-error" message={state.fieldErrors?.lastName} />
                    </div>
                    <div>
                      <label htmlFor="iq-email" className={labelClass}>
                        Email <span className="text-brand-800">*</span>
                      </label>
                      <input
                        id="iq-email"
                        name="email"
                        type="email"
                        required
                        autoComplete="email"
                        defaultValue={state.values?.email}
                        aria-invalid={state.fieldErrors?.email ? true : undefined}
                        aria-describedby={state.fieldErrors?.email ? 'iq-email-error' : undefined}
                        className={inputClass}
                      />
                      <FieldError id="iq-email-error" message={state.fieldErrors?.email} />
                    </div>
                    <div>
                      <label htmlFor="iq-phone" className={labelClass}>
                        Phone <span className="text-brand-800">*</span>
                      </label>
                      <input
                        id="iq-phone"
                        name="phone"
                        type="tel"
                        required
                        autoComplete="tel"
                        inputMode="tel"
                        pattern="^(\+44|0)[\d\s\(\).-]{9,14}$"
                        title="A UK phone number, starting 0 or +44"
                        defaultValue={state.values?.phone}
                        aria-invalid={state.fieldErrors?.phone ? true : undefined}
                        aria-describedby={state.fieldErrors?.phone ? 'iq-phone-error' : undefined}
                        className={inputClass}
                      />
                      <FieldError id="iq-phone-error" message={state.fieldErrors?.phone} />
                    </div>
                    <div className="sm:col-span-2">
                      <label htmlFor="iq-postcode" className={labelClass}>
                        Postcode <span className="text-brand-800">*</span>
                      </label>
                      <input
                        id="iq-postcode"
                        name="postcode"
                        type="text"
                        required
                        autoComplete="postal-code"
                        pattern="^[A-Za-z]{1,2}\d[A-Za-z\d]?\s?\d[A-Za-z]{2}$"
                        title="A UK postcode, e.g. BB1 2AB"
                        defaultValue={state.values?.postcode ?? postcode}
                        aria-invalid={state.fieldErrors?.postcode ? true : undefined}
                        aria-describedby={state.fieldErrors?.postcode ? 'iq-postcode-error' : undefined}
                        className={`${inputClass} sm:max-w-xs`}
                      />
                      <FieldError id="iq-postcode-error" message={state.fieldErrors?.postcode} />
                    </div>
                  </div>

                  <button
                    type="submit"
                    disabled={isPending}
                    className="eb-btn-primary w-full disabled:cursor-not-allowed disabled:opacity-60 sm:w-auto"
                  >
                    {isPending ? 'Sending…' : 'Send me my accurate quote'}
                  </button>
                  <p className="text-xs text-ink-500">
                    Your estimate details come through with your enquiry, so we can pick up exactly
                    where you left off.
                  </p>
                </form>
              </div>

              {/* Prefer to talk */}
              <div className="mt-6 flex flex-col items-center justify-center gap-3 rounded-xl bg-ink-50 px-6 py-5 text-center sm:flex-row sm:gap-6">
                <p className="font-display text-sm font-semibold text-ink-800">
                  Prefer to talk it through?
                </p>
                <div className="flex flex-wrap items-center justify-center gap-3">
                  <a href={phoneHref} className="eb-btn-dark px-5 py-2.5 text-xs">
                    Call {formatPhone(phone)}
                  </a>
                  <a
                    href={whatsappHref}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="eb-btn-outline px-5 py-2.5 text-xs"
                  >
                    WhatsApp us
                  </a>
                </div>
              </div>
            </motion.div>
          ) : null}
        </AnimatePresence>
      </div>
    </div>
  )
}

export default InstantQuoteWizard
