import { SITE } from '@/lib/site'
import { formatPhone, telHref } from '@/lib/format'
import { QuoteCTA } from '@/components/ui/QuoteCTA'
import type { ReactNode } from 'react'

type CTABandProps = {
  heading?: ReactNode
  sub?: ReactNode
  /** 'green' brand band (default) or 'dark' ink band. */
  variant?: 'green' | 'dark'
  quoteHref?: string
  quoteLabel?: string
  className?: string
}

/**
 * Full-width conversion band used before footers: heading + QuoteCTA +
 * click-to-call phone link. Green by default; use variant="dark" after a
 * green-heavy section.
 */
export function CTABand({
  heading = 'Ready to extend your home?',
  sub = `Factory-built in ${SITE.base.split(',')[0]}. Installed on-site in under a week.`,
  variant = 'green',
  quoteHref = '/get-a-quote',
  quoteLabel = 'Get A Quote',
  className = '',
}: CTABandProps) {
  const dark = variant === 'dark'

  return (
    <section className={[dark ? 'bg-ink-900' : 'bg-brand-500', 'relative overflow-hidden', className].join(' ')}>
      {/* Angled block motif, faint, off to one side */}
      <div
        aria-hidden="true"
        className={[
          'absolute -top-8 -right-16 h-64 w-64 -skew-x-[18deg]',
          dark ? 'bg-brand-500/10' : 'bg-white/10',
        ].join(' ')}
      />
      <div className="eb-container flex flex-col items-center gap-6 py-16 text-center md:py-20">
        <h2 className="max-w-2xl text-3xl font-semibold text-white sm:text-4xl">{heading}</h2>
        {sub ? (
          <p className={['max-w-xl text-base sm:text-lg', dark ? 'text-ink-300' : 'text-brand-50'].join(' ')}>
            {sub}
          </p>
        ) : null}
        <div className="mt-2 flex flex-col items-center gap-4 sm:flex-row">
          <QuoteCTA href={quoteHref} variant={dark ? 'primary' : 'dark'}>
            {quoteLabel}
          </QuoteCTA>
          <a
            href={telHref(SITE.phone)}
            className={[
              'font-display text-lg font-semibold tracking-wide text-white transition-colors',
              dark ? 'hover:text-brand-400' : 'hover:text-ink-900',
            ].join(' ')}
          >
            or call {formatPhone(SITE.phone)}
          </a>
        </div>
      </div>
    </section>
  )
}

export default CTABand
