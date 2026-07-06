'use client'

import { motion, useReducedMotion } from 'motion/react'

import { useSiteContact } from '@/components/layout/SiteContactProvider'
import { formatPhone } from '@/lib/format'

/**
 * Warm confirmation panel shown after a successful quote submission
 * (both the full form and the instant-quote lead capture).
 * Motion tick draws itself in; reduced-motion users see it complete.
 */
export function SuccessPanel({ heading = 'Thank you — we’ve got your details' }: { heading?: string }) {
  const reducedMotion = useReducedMotion()
  const { phone, phoneHref, whatsappHref } = useSiteContact()

  return (
    <div
      role="status"
      className="rounded-xl border border-brand-200 bg-brand-50 p-8 text-center sm:p-10"
    >
      <svg
        viewBox="0 0 64 64"
        className="mx-auto h-16 w-16"
        aria-hidden="true"
        fill="none"
      >
        <motion.circle
          cx="32"
          cy="32"
          r="28"
          stroke="var(--color-brand-500)"
          strokeWidth="3.5"
          strokeLinecap="round"
          initial={reducedMotion ? false : { pathLength: 0 }}
          animate={{ pathLength: 1 }}
          transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
        />
        <motion.path
          d="M20 33.5 28.5 42 45 24"
          stroke="var(--color-brand-600)"
          strokeWidth="4.5"
          strokeLinecap="round"
          strokeLinejoin="round"
          initial={reducedMotion ? false : { pathLength: 0 }}
          animate={{ pathLength: 1 }}
          transition={{ duration: 0.45, delay: reducedMotion ? 0 : 0.45, ease: [0.16, 1, 0.3, 1] }}
        />
      </svg>

      <h2 className="mt-5 text-2xl font-semibold text-ink-900">{heading}</h2>
      <p className="mx-auto mt-3 max-w-md text-ink-600">
        One of our team will be in touch within <strong className="text-ink-800">1 working day</strong> to
        talk through your project and arrange your free survey.
      </p>

      <p className="mt-6 text-sm text-ink-500">Can’t wait? We’re happy to talk now.</p>
      <div className="mt-3 flex flex-col items-center justify-center gap-3 sm:flex-row">
        <a href={phoneHref} className="eb-btn-dark">
          Call {formatPhone(phone)}
        </a>
        <a
          href={whatsappHref}
          target="_blank"
          rel="noopener noreferrer"
          className="eb-btn-outline"
        >
          Message us on WhatsApp
        </a>
      </div>
    </div>
  )
}

export default SuccessPanel
