'use client'

import { AnimatePresence, motion } from 'motion/react'
import { useCallback, useEffect, useRef, useState } from 'react'

import { submitQuoteRequest, type QuoteActionState } from '@/app/(frontend)/actions/quote'
import {
  DEFAULT_QUOTE_PRICING,
  EXTENSION_TYPES,
  PROPERTY_TYPES,
  SIZE_BANDS,
  SPEC_LEVELS,
  TIMELINES,
  estimateRangeFromArea,
  getSizeBand,
  type QuotePricing,
} from '@/components/quote/pricing'
import { FAQ_CHIPS, GREETING } from '@/components/quote/assistant/script'
import { useReducedMotionSafe } from '@/components/ui/useReducedMotionSafe'
import { useSiteContact } from '@/components/layout/SiteContactProvider'
import { formatPhone } from '@/lib/format'

/**
 * Conversational quote capture ("Eazy"). A friendly chat that walks through
 * build type → property type → size → finish → material prefs → timeline →
 * postcode → contact, then shows an indicative range (recomputed server-side
 * on submit) and hands the lead to the team. Same pricing model and lead
 * pipeline as the /instant-quote wizard — just a different way in.
 */

type Role = 'bot' | 'user'
type Message = { id: number; role: Role; text: string }

/** The answerable steps, in order. 'result' is the computed range + submit. */
const STEP_ORDER = [
  'build',
  'property',
  'size',
  'spec',
  'materials',
  'timeline',
  'postcode',
  'contact',
] as const
type Step = (typeof STEP_ORDER)[number] | 'result'

type Answers = {
  build?: string // EXTENSION_TYPES key
  property?: string // PROPERTY_TYPES key
  size?: string // SIZE_BANDS key
  spec?: string // SPEC_LEVELS key
  materials?: string
  timeline?: string // TIMELINES key
  postcode?: string
  name?: string
  email?: string
  phone?: string
}

const PROMPTS: Record<(typeof STEP_ORDER)[number], string> = {
  build: GREETING,
  property: 'Nice one. And what type of property is it?',
  size: 'Roughly how much space do you have in mind?',
  spec: 'Lovely. What finish are you after?',
  materials:
    'Any material preferences? Think brick, render, bi-fold doors, a roof lantern… (optional — skip if you’re not sure yet).',
  timeline: 'When are you hoping to get started?',
  postcode: 'Almost there! What’s your postcode? This lets us check coverage and groundwork access.',
  contact: 'Perfect. Where shall we send your personalised quote?',
}

const labelFor = {
  build: (k?: string) => EXTENSION_TYPES.find((t) => t.key === k)?.label ?? '',
  property: (k?: string) => PROPERTY_TYPES.find((p) => p.key === k)?.label ?? '',
  size: (k?: string) => SIZE_BANDS.find((b) => b.key === k)?.label ?? '',
  spec: (k?: string) => SPEC_LEVELS.find((s) => s.key === k)?.label ?? '',
  timeline: (k?: string) => TIMELINES.find((t) => t.key === k)?.label ?? '',
}

const UK_POSTCODE_RE = /^[A-Za-z]{1,2}\d[A-Za-z\d]?\s?\d[A-Za-z]{2}$/
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/

const inputClass =
  'w-full rounded-lg border border-ink-200 bg-white px-4 py-2.5 text-ink-800 placeholder:text-ink-400 outline-none transition-[box-shadow,border-color] focus:border-brand-500 focus:ring-4 focus:ring-brand-500/25'

const formatGBP = (n: number) => `£${n.toLocaleString('en-GB')}`

export function QuoteAssistant({
  pricing = DEFAULT_QUOTE_PRICING,
}: {
  pricing?: QuotePricing
}) {
  const reducedMotion = useReducedMotionSafe()

  const [messages, setMessages] = useState<Message[]>([])
  const [step, setStep] = useState<Step>('build')
  const [typing, setTyping] = useState(true)
  const [answers, setAnswers] = useState<Answers>({})
  const [submitState, setSubmitState] = useState<'idle' | 'sending' | 'done' | 'error'>('idle')

  const msgId = useRef(0)
  const mountedAt = useRef(0)
  const scrollRef = useRef<HTMLDivElement>(null)
  const liveRef = useRef<HTMLDivElement>(null)
  const started = useRef(false)

  const nextId = () => (msgId.current += 1)

  const pushUser = useCallback((text: string) => {
    setMessages((m) => [...m, { id: nextId(), role: 'user', text }])
  }, [])

  // Push a bot message after a short "typing" beat (instant under reduced motion).
  const pushBot = useCallback(
    (text: string, after = 550) => {
      setTyping(true)
      const delay = reducedMotion ? 0 : after
      window.setTimeout(() => {
        setMessages((m) => [...m, { id: nextId(), role: 'bot', text }])
        if (liveRef.current) liveRef.current.textContent = text
        setTyping(false)
      }, delay)
    },
    [reducedMotion],
  )

  // Awaitable variant — lets the closing sequence stay strictly ordered even
  // when the network submit resolves faster than the message delays.
  const sayBot = useCallback(
    (text: string, after = 550) =>
      new Promise<void>((resolve) => {
        setTyping(true)
        const delay = reducedMotion ? 0 : after
        window.setTimeout(() => {
          setMessages((m) => [...m, { id: nextId(), role: 'bot', text }])
          if (liveRef.current) liveRef.current.textContent = text
          setTyping(false)
          resolve()
        }, delay)
      }),
    [reducedMotion],
  )

  // Greeting on mount (guarded against React 18/19 double-invoke in dev).
  useEffect(() => {
    mountedAt.current = Date.now()
    if (started.current) return
    started.current = true
    pushBot(PROMPTS.build, 350)
  }, [pushBot])

  // Keep the latest message in view.
  useEffect(() => {
    const el = scrollRef.current
    if (el) el.scrollTo({ top: el.scrollHeight, behavior: reducedMotion ? 'auto' : 'smooth' })
  }, [messages, typing, step, reducedMotion])

  const currentIndex = STEP_ORDER.indexOf(step as (typeof STEP_ORDER)[number])
  const progress =
    step === 'result' ? 1 : Math.max(0, currentIndex) / STEP_ORDER.length

  // Advance to the next step, asking its prompt.
  const goTo = useCallback(
    (next: Step) => {
      setStep(next)
      if (next !== 'result') pushBot(PROMPTS[next])
    },
    [pushBot],
  )

  const answerChip = (
    key: (typeof STEP_ORDER)[number],
    value: string,
    label: string,
    next: Step,
  ) => {
    pushUser(label)
    setAnswers((a) => ({ ...a, [key]: value }))
    goTo(next)
  }

  // Tapping an FAQ chip: drop the Q + A into the thread, keep the current step.
  const askFaq = (q: string, a: string) => {
    pushUser(q)
    pushBot(a, 500)
  }

  // ---- Result: compute range, then submit the lead ----
  const finish = useCallback(
    async (contact: { name: string; email: string; phone: string }) => {
      pushUser(contact.name)
      const merged: Answers = { ...answers, ...contact }
      setAnswers(merged)
      setStep('result')

      setSubmitState('sending')

      const band = getSizeBand(merged.size)
      // Pricing is size-only — finish is captured for the team, not priced.
      const range = band ? estimateRangeFromArea(band.areaM2, pricing) : null

      const parts = contact.name.trim().split(/\s+/)
      const firstName = parts[0] || 'There'
      const lastName = parts.slice(1).join(' ') || parts[0] || '—'

      const summary = [
        `Quote Assistant lead.`,
        `Build: ${labelFor.build(merged.build) || '—'}`,
        `Property: ${labelFor.property(merged.property) || '—'}`,
        `Size: ${labelFor.size(merged.size) || '—'}`,
        `Finish: ${labelFor.spec(merged.spec) || '—'}`,
        merged.materials ? `Materials: ${merged.materials}` : '',
        `Timeline: ${labelFor.timeline(merged.timeline) || '—'}`,
        range ? `Indicative: ${formatGBP(range.low)}–${formatGBP(range.high)}` : '',
      ]
        .filter(Boolean)
        .join('\n')

      const fd = new FormData()
      fd.set('formType', 'assistant')
      fd.set('firstName', firstName)
      fd.set('lastName', lastName)
      fd.set('email', contact.email)
      fd.set('phone', contact.phone)
      fd.set('postcode', merged.postcode ?? '')
      fd.set('message', summary)
      fd.set('propertyType', merged.property ?? '')
      fd.set('timeline', merged.timeline ?? '')
      fd.set('materialPreferences', merged.materials ?? '')
      fd.set('estimatorType', merged.build ?? '')
      fd.set('estimatorSpec', merged.spec ?? '')
      fd.set('estimatorSizeBand', merged.size ?? '')
      fd.set('_eb_elapsed', String(Math.max(0, Date.now() - mountedAt.current)))

      // Fire the submit immediately, but keep the visible messages strictly
      // ordered (range → "sending…" → result) regardless of how fast it lands.
      const initial: QuoteActionState = { status: 'idle' }
      const submitPromise = submitQuoteRequest(initial, fd).catch(
        (): QuoteActionState => ({ status: 'error' }),
      )

      if (range) {
        await sayBot(
          `Based on that, a ${labelFor.spec(merged.spec).toLowerCase()}-finish ${labelFor
            .build(merged.build)
            .toLowerCase()} of this size is typically around ${formatGBP(range.low)}–${formatGBP(
            range.high,
          )}.`,
          700,
        )
        await sayBot(
          'That’s indicative — our team will confirm your exact fixed price after a quick survey. Sending your details now…',
          1100,
        )
      } else {
        await sayBot('Great — sending your details to the team now…', 700)
      }

      const res = await submitPromise
      if (res.status === 'error') {
        setSubmitState('error')
        await sayBot(
          res.message ??
            'Something went wrong sending your details — please try again, or WhatsApp us and we’ll pick it up.',
          500,
        )
      } else {
        setSubmitState('done')
        await sayBot(
          `Thanks ${firstName} — that’s everything! Our team will review it and be in touch with your fixed-price quote shortly. Want to skip the wait?`,
          600,
        )
      }
    },
    [answers, pushUser, sayBot, pricing],
  )

  return (
    <div
      data-quote-form
      className="mx-auto flex h-[38rem] max-h-[80vh] w-full max-w-xl flex-col overflow-hidden rounded-2xl border border-ink-100 bg-white shadow-2xl shadow-ink-950/10"
    >
      {/* Header */}
      <div className="relative bg-ink-950 px-5 py-4">
        <div className="flex items-center gap-3">
          <span
            aria-hidden="true"
            className="grid h-9 w-9 shrink-0 place-items-center rounded-lg bg-brand-500"
          >
            <span className="block h-3.5 w-5 -skew-x-[18deg] rounded-[2px] bg-ink-950" />
          </span>
          <div>
            <p className="font-display text-sm font-bold text-white">EazyBase Quote Assistant</p>
            <p className="flex items-center gap-1.5 text-xs text-ink-300">
              <span className="relative flex h-2 w-2">
                {!reducedMotion ? (
                  <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-brand-400 opacity-75" />
                ) : null}
                <span className="relative inline-flex h-2 w-2 rounded-full bg-brand-500" />
              </span>
              Typically replies in minutes
            </p>
          </div>
        </div>
        {/* Progress bar */}
        <div className="absolute inset-x-0 bottom-0 h-1 bg-ink-800">
          <motion.div
            className="h-full bg-brand-500"
            initial={false}
            animate={{ width: `${Math.round(progress * 100)}%` }}
            transition={{ duration: reducedMotion ? 0 : 0.4, ease: 'easeOut' }}
          />
        </div>
      </div>

      {/* Messages */}
      <div
        ref={scrollRef}
        className="flex-1 space-y-3 overflow-y-auto px-4 py-5"
        style={{
          backgroundImage: 'radial-gradient(circle, rgb(232 234 228) 1px, transparent 1px)',
          backgroundSize: '16px 16px',
        }}
      >
        <div ref={liveRef} className="sr-only" aria-live="polite" />
        {messages.map((m) => (
          <Bubble key={m.id} role={m.role} reducedMotion={reducedMotion}>
            {m.text}
          </Bubble>
        ))}
        {typing ? <TypingDots reducedMotion={reducedMotion} /> : null}
      </div>

      {/* Input dock */}
      <div className="border-t border-ink-100 bg-white px-4 py-3">
        {/* FAQ chips (available any time except after completion) */}
        {step !== 'result' ? (
          <div className="mb-2.5 flex flex-wrap gap-1.5">
            {FAQ_CHIPS.map((f) => (
              <button
                key={f.q}
                type="button"
                onClick={() => askFaq(f.q, f.a)}
                disabled={typing}
                className="rounded-full border border-ink-200 px-2.5 py-1 text-xs font-medium text-ink-500 transition-colors hover:border-brand-400 hover:bg-brand-50 hover:text-ink-800 disabled:opacity-40"
              >
                {f.q}
              </button>
            ))}
          </div>
        ) : null}

        <StepInput
          step={step}
          typing={typing}
          submitState={submitState}
          onChip={answerChip}
          onMaterials={(text, next) => {
            if (text.trim()) pushUser(text.trim())
            else pushUser('No preference for now')
            setAnswers((a) => ({ ...a, materials: text.trim() }))
            goTo(next)
          }}
          onPostcode={(pc, next) => {
            pushUser(pc)
            setAnswers((a) => ({ ...a, postcode: pc }))
            goTo(next)
          }}
          onContact={finish}
        />
      </div>
    </div>
  )
}

/* ------------------------------------------------------------------ bubbles */

function Bubble({
  role,
  reducedMotion,
  children,
}: {
  role: Role
  reducedMotion: boolean
  children: React.ReactNode
}) {
  const isUser = role === 'user'
  return (
    <motion.div
      initial={reducedMotion ? false : { opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: reducedMotion ? 0 : 0.25, ease: 'easeOut' }}
      className={isUser ? 'flex justify-end' : 'flex justify-start'}
    >
      <p
        className={[
          'max-w-[85%] rounded-2xl px-4 py-2.5 text-sm leading-relaxed whitespace-pre-line',
          isUser
            ? 'rounded-br-sm bg-brand-500 font-medium text-ink-950'
            : 'rounded-bl-sm bg-ink-50 text-ink-800',
        ].join(' ')}
      >
        {children}
      </p>
    </motion.div>
  )
}

function TypingDots({ reducedMotion }: { reducedMotion: boolean }) {
  return (
    <div className="flex justify-start" aria-hidden="true">
      <div className="flex items-center gap-1 rounded-2xl rounded-bl-sm bg-ink-50 px-4 py-3">
        {[0, 1, 2].map((i) => (
          <motion.span
            key={i}
            className="h-1.5 w-1.5 rounded-full bg-ink-400"
            animate={reducedMotion ? undefined : { opacity: [0.3, 1, 0.3] }}
            transition={{ duration: 1, repeat: Infinity, delay: i * 0.15 }}
          />
        ))}
      </div>
    </div>
  )
}

/* -------------------------------------------------------------- step inputs */

function Chips({
  options,
  disabled,
  onPick,
}: {
  options: { key: string; label: string; sub?: string }[]
  disabled: boolean
  onPick: (key: string, label: string) => void
}) {
  return (
    <div className="flex flex-wrap gap-2">
      {options.map((o) => (
        <button
          key={o.key}
          type="button"
          disabled={disabled}
          onClick={() => onPick(o.key, o.label)}
          className="rounded-full border border-ink-200 bg-white px-3.5 py-2 text-sm font-semibold text-ink-800 transition-colors hover:border-brand-500 hover:bg-brand-50 focus-visible:ring-4 focus-visible:ring-brand-500/30 focus-visible:outline-none disabled:opacity-40"
        >
          {o.label}
        </button>
      ))}
    </div>
  )
}

function StepInput({
  step,
  typing,
  submitState,
  onChip,
  onMaterials,
  onPostcode,
  onContact,
}: {
  step: Step
  typing: boolean
  submitState: 'idle' | 'sending' | 'done' | 'error'
  onChip: (key: (typeof STEP_ORDER)[number], value: string, label: string, next: Step) => void
  onMaterials: (text: string, next: Step) => void
  onPostcode: (pc: string, next: Step) => void
  onContact: (c: { name: string; email: string; phone: string }) => void
}) {
  if (typing && step !== 'result') return <InputSkeleton />

  switch (step) {
    case 'build':
      return (
        <Chips
          options={EXTENSION_TYPES.map((t) => ({ key: t.key, label: t.label }))}
          disabled={typing}
          onPick={(k, l) => onChip('build', k, l, 'property')}
        />
      )
    case 'property':
      return (
        <Chips
          options={PROPERTY_TYPES.map((p) => ({ key: p.key, label: p.label }))}
          disabled={typing}
          onPick={(k, l) => onChip('property', k, l, 'size')}
        />
      )
    case 'size':
      return (
        <Chips
          options={SIZE_BANDS.map((b) => ({ key: b.key, label: b.label }))}
          disabled={typing}
          onPick={(k, l) => onChip('size', k, l, 'spec')}
        />
      )
    case 'spec':
      return (
        <Chips
          options={SPEC_LEVELS.map((s) => ({ key: s.key, label: s.label }))}
          disabled={typing}
          onPick={(k, l) => onChip('spec', k, l, 'materials')}
        />
      )
    case 'materials':
      return <MaterialsInput onSubmit={(t) => onMaterials(t, 'timeline')} />
    case 'timeline':
      return (
        <Chips
          options={TIMELINES.map((t) => ({ key: t.key, label: t.label }))}
          disabled={typing}
          onPick={(k, l) => onChip('timeline', k, l, 'postcode')}
        />
      )
    case 'postcode':
      return <PostcodeInput onSubmit={(pc) => onPostcode(pc, 'contact')} />
    case 'contact':
      return <ContactInput onSubmit={onContact} />
    case 'result':
      return <ResultDock submitState={submitState} />
    default:
      return null
  }
}

function InputSkeleton() {
  return (
    <div className="flex gap-2">
      <span className="h-9 w-28 animate-pulse rounded-full bg-ink-100" />
      <span className="h-9 w-24 animate-pulse rounded-full bg-ink-100" />
    </div>
  )
}

function MaterialsInput({ onSubmit }: { onSubmit: (text: string) => void }) {
  const [value, setValue] = useState('')
  return (
    <form
      className="flex gap-2"
      onSubmit={(e) => {
        e.preventDefault()
        onSubmit(value)
      }}
    >
      <input
        autoFocus
        aria-label="Material preferences (optional)"
        value={value}
        onChange={(e) => setValue(e.target.value)}
        placeholder="e.g. brick, bi-fold doors, lantern roof"
        className={inputClass}
      />
      <button type="submit" className="eb-btn-primary shrink-0 !px-4 !py-2.5">
        {value.trim() ? 'Send' : 'Skip'}
      </button>
    </form>
  )
}

function PostcodeInput({ onSubmit }: { onSubmit: (pc: string) => void }) {
  const [value, setValue] = useState('')
  const [err, setErr] = useState<string | null>(null)
  return (
    <form
      className="flex gap-2"
      onSubmit={(e) => {
        e.preventDefault()
        if (!UK_POSTCODE_RE.test(value.trim())) {
          setErr('Please enter a valid UK postcode.')
          return
        }
        onSubmit(value.trim().toUpperCase())
      }}
    >
      <div className="flex-1">
        <input
          autoFocus
          aria-label="Postcode"
          aria-invalid={Boolean(err)}
          value={value}
          onChange={(e) => {
            setValue(e.target.value)
            if (err) setErr(null)
          }}
          placeholder="e.g. BB1 1AA"
          className={inputClass}
        />
        {err ? (
          <p role="alert" className="mt-1 text-xs text-red-600">
            {err}
          </p>
        ) : null}
      </div>
      <button type="submit" className="eb-btn-primary h-[42px] shrink-0 !px-4 !py-0">
        Continue
      </button>
    </form>
  )
}

function ContactInput({
  onSubmit,
}: {
  onSubmit: (c: { name: string; email: string; phone: string }) => void
}) {
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [phone, setPhone] = useState('')
  const [errs, setErrs] = useState<{ name?: string; email?: string; phone?: string }>({})

  return (
    <form
      className="space-y-2.5"
      onSubmit={(e) => {
        e.preventDefault()
        const next: typeof errs = {}
        if (!name.trim()) next.name = 'Please tell us your name.'
        if (!EMAIL_RE.test(email.trim())) next.email = 'Enter a valid email.'
        if (phone.replace(/[^\d+]/g, '').length < 10) next.phone = 'Enter a valid phone number.'
        setErrs(next)
        if (Object.keys(next).length) return
        onSubmit({ name: name.trim(), email: email.trim(), phone: phone.trim() })
      }}
    >
      <div>
        <input
          autoFocus
          aria-label="Your name"
          aria-invalid={Boolean(errs.name)}
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Your name"
          className={inputClass}
        />
        {errs.name ? <p role="alert" className="mt-1 text-xs text-red-600">{errs.name}</p> : null}
      </div>
      <div>
        <input
          type="email"
          aria-label="Email address"
          aria-invalid={Boolean(errs.email)}
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="Email address"
          className={inputClass}
        />
        {errs.email ? <p role="alert" className="mt-1 text-xs text-red-600">{errs.email}</p> : null}
      </div>
      <div>
        <input
          type="tel"
          aria-label="Phone number"
          aria-invalid={Boolean(errs.phone)}
          value={phone}
          onChange={(e) => setPhone(e.target.value)}
          placeholder="Phone number"
          className={inputClass}
        />
        {errs.phone ? <p role="alert" className="mt-1 text-xs text-red-600">{errs.phone}</p> : null}
      </div>
      <button type="submit" className="eb-btn-primary w-full">
        Get my quote
      </button>
      <p className="text-center text-[11px] text-ink-400">
        We only use your details to prepare your quote. No spam, ever.
      </p>
    </form>
  )
}

function ResultDock({ submitState }: { submitState: 'idle' | 'sending' | 'done' | 'error' }) {
  const { phone, phoneHref, whatsappHref } = useSiteContact()
  if (submitState === 'sending' || submitState === 'idle') {
    return (
      <p className="py-1 text-center text-sm text-ink-500">Sending your details…</p>
    )
  }
  // done or error → offer the fast lanes
  return (
    <div className="flex flex-col gap-2 sm:flex-row">
      <a
        href={whatsappHref}
        target="_blank"
        rel="noopener noreferrer"
        className="eb-btn flex-1 bg-[#25D366] text-ink-950 hover:brightness-95"
      >
        Chat on WhatsApp
      </a>
      <a href={phoneHref} className="eb-btn-dark flex-1">
        Call {formatPhone(phone)}
      </a>
    </div>
  )
}

export default QuoteAssistant
