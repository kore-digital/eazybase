'use client'

import { AnimatePresence, motion, useReducedMotion } from 'motion/react'
import { useActionState, useEffect, useRef, useState } from 'react'

import { submitQuoteRequest, type QuoteActionState } from '@/app/(frontend)/actions/quote'
import { AnimatedCounter } from '@/components/ui/AnimatedCounter'
import {
  EXTENSION_TYPES,
  PROPERTY_TYPES,
  SIZE_BOUNDS,
  SPEC_LEVELS,
  estimateRange,
  type ExtensionTypeKey,
  type PropertyTypeKey,
  type SpecKey,
} from '@/components/quote/pricing'
import { SuccessPanel } from '@/components/quote/SuccessPanel'
import { TypeIcon } from '@/components/quote/TypeIcon'
import { useSiteContact } from '@/components/layout/SiteContactProvider'
import { formatPhone } from '@/lib/format'

/**
 * The 3-step instant-quote estimator (brand-new build — the old
 * /instant-quote URL was a duplicate of the contact form and had no
 * calculator at all):
 *   1. extension type  →  2. size (width × depth sliders)  →  3. spec level
 * then an animated indicative £range + inline lead capture that persists the
 * estimator payload through the shared quote server action (type 'instant').
 * The figure is ALWAYS presented as indicative, never as a formal quote.
 */

type Step = 1 | 2 | 3 | 4 | 5

const STEP_LABELS = ['Type', 'Size', 'Spec', 'Property'] as const

const inputClass =
  'w-full rounded-lg border border-ink-200 bg-white px-4 py-3 text-ink-800 placeholder:text-ink-300 transition-[box-shadow,border-color] duration-200 outline-none hover:border-ink-300 focus:border-brand-500 focus:ring-4 focus:ring-brand-500/25'

const labelClass = 'mb-1.5 block font-display text-sm font-semibold text-ink-800'

const formatGBP = (n: number) => `£${n.toLocaleString('en-GB')}`

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
    flat: <path d="M15 10 33 10 33 30 15 30 Z M19 14 22 14 22 17 19 17 Z M26 14 29 14 29 17 26 17 Z M19 20 22 20 22 23 19 23 Z M26 20 29 20 29 23 26 23 Z" />,
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

export function InstantQuoteWizard() {
  const reducedMotion = useReducedMotion()
  const { phone, phoneHref, whatsappHref } = useSiteContact()

  const [step, setStep] = useState<Step>(1)
  const [maxStep, setMaxStep] = useState<Step>(1)
  const [direction, setDirection] = useState<1 | -1>(1)
  const [typeKey, setTypeKey] = useState<ExtensionTypeKey | null>(null)
  const [widthM, setWidthM] = useState<number>(SIZE_BOUNDS.defaultWidth)
  const [depthM, setDepthM] = useState<number>(SIZE_BOUNDS.defaultDepth)
  const [specKey, setSpecKey] = useState<SpecKey | null>(null)
  const [propertyKey, setPropertyKey] = useState<PropertyTypeKey | null>(null)

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

  const chosenType = EXTENSION_TYPES.find((t) => t.key === typeKey)
  const chosenSpec = SPEC_LEVELS.find((s) => s.key === specKey)
  /** Readable noun for sentences — "Something Else" would read oddly. */
  const typeNoun = chosenType && chosenType.key !== 'other' ? chosenType.label.toLowerCase() : 'extension'
  const area = Math.round(widthM * depthM * 10) / 10
  const range =
    typeKey && specKey ? estimateRange(typeKey, specKey, widthM, depthM) : null

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
                    { name: 'Width', value: widthM, set: setWidthM, id: 'iq-width' },
                    { name: 'Depth', value: depthM, set: setDepthM, id: 'iq-depth' },
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
                      min={SIZE_BOUNDS.min}
                      max={SIZE_BOUNDS.max}
                      step={SIZE_BOUNDS.step}
                      value={dim.value}
                      onChange={(e) => dim.set(Number(e.target.value))}
                      className="eb-range mt-2"
                      aria-valuetext={`${dim.value} metres`}
                    />
                    <div className="mt-1 flex justify-between text-xs text-ink-500">
                      <span>{SIZE_BOUNDS.min} m</span>
                      <span>{SIZE_BOUNDS.max} m</span>
                    </div>
                  </div>
                ))}

                {/* live area readout */}
                <p
                  className="rounded-lg bg-ink-50 px-5 py-4 text-center font-display text-ink-800"
                  aria-live="polite"
                >
                  <span className="text-sm text-ink-500">Floor area: </span>
                  <strong className="text-lg font-bold text-ink-900">{area} m²</strong>
                </p>
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

          {/* ---------------------------------------------- step 3: spec */}
          {step === 3 ? (
            <motion.div key="step-3" {...slide}>
              <h2
                ref={focusStepHeading}
                tabIndex={-1}
                className="text-center font-display text-xl font-semibold text-ink-900 outline-none"
              >
                Which finish level suits you?
              </h2>
              <div className="mt-6 grid gap-4 sm:grid-cols-3">
                {SPEC_LEVELS.map((spec) => {
                  const selected = specKey === spec.key
                  return (
                    <button
                      key={spec.key}
                      type="button"
                      aria-pressed={selected}
                      onClick={() => {
                        setSpecKey(spec.key)
                        go(4)
                      }}
                      className={[
                        'group flex flex-col rounded-xl border-2 bg-white p-5 text-left transition-all duration-200',
                        'hover:-translate-y-0.5 hover:border-brand-400 hover:shadow-md',
                        'focus-visible:ring-4 focus-visible:ring-brand-500/30 focus-visible:outline-none',
                        selected ? 'border-brand-500 shadow-md' : 'border-ink-100',
                      ].join(' ')}
                    >
                      <span className="font-display text-base font-bold text-ink-900">
                        {spec.label}
                        {spec.key === 'premium' ? (
                          <span className="ml-2 rounded-sm bg-brand-500 px-1.5 py-0.5 align-middle font-display text-[10px] font-bold tracking-wide text-ink-950 uppercase">
                            Popular
                          </span>
                        ) : null}
                      </span>
                      <span className="mt-1 text-xs leading-snug text-ink-500">{spec.blurb}</span>
                      <ul className="mt-4 space-y-2">
                        {spec.inclusions.map((item) => (
                          <li key={item} className="flex items-start gap-2 text-xs leading-snug text-ink-600">
                            <span aria-hidden="true" className="eb-block-accent mt-1 h-1.5 w-2.5 shrink-0" />
                            {item}
                          </li>
                        ))}
                      </ul>
                    </button>
                  )
                })}
              </div>
              <div className="mt-8">
                <button type="button" onClick={() => go(2)} className="text-sm font-semibold text-ink-500 underline-offset-4 hover:text-ink-800 hover:underline">
                  ← Back
                </button>
              </div>
            </motion.div>
          ) : null}

          {/* -------------------------------------- step 4: property type */}
          {step === 4 ? (
            <motion.div key="step-property" {...slide}>
              <h2
                ref={focusStepHeading}
                tabIndex={-1}
                className="text-center font-display text-xl font-semibold text-ink-900 outline-none"
              >
                Last one — what type of property is it?
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
                        go(5)
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
                  onClick={() => go(3)}
                  className="text-sm font-semibold text-ink-500 underline-offset-4 hover:text-ink-800 hover:underline"
                >
                  ← Back
                </button>
              </div>
            </motion.div>
          ) : null}

          {/* --------------------------------------- step 5: result + lead */}
          {step === 5 && range && chosenType && chosenSpec ? (
            <motion.div key="step-4" {...slide}>
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
                  indicative, subject to survey — for a {chosenSpec.label.toLowerCase()}-spec{' '}
                  {typeNoun} of about {range.areaSqm} m²
                </p>
                <p className="mx-auto mt-4 max-w-md text-xs leading-relaxed text-ink-400">
                  This is a guide range, not a formal quote. Every EazyBase project is priced
                  properly after a free survey — ground works, access and your exact design all
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
                  {/* Estimator payload — the server recomputes the £range from these raw inputs. */}
                  <input type="hidden" name="estimatorType" value={chosenType.key} />
                  <input type="hidden" name="estimatorSpec" value={chosenSpec.key} />
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
                        defaultValue={state.values?.postcode}
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

      {/* Range summary while mid-wizard, once enough is chosen */}
      {step < 4 && typeKey ? (
        <p className="mt-8 text-center text-xs text-ink-500">
          {formatGBP(SPEC_LEVELS[0].ratePerSqm)}–{formatGBP(SPEC_LEVELS[SPEC_LEVELS.length - 1].ratePerSqm)}{' '}
          per m² depending on specification — indicative guide rates, refined at survey.
        </p>
      ) : null}
    </div>
  )
}

export default InstantQuoteWizard
