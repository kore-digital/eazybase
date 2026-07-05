import Link from 'next/link'
import type { ReactNode } from 'react'

type QuoteCTAProps = {
  href?: string
  children?: ReactNode
  /** 'primary' green (default) or 'dark' ink for use on green/light-green bands. */
  variant?: 'primary' | 'dark'
  className?: string
}

/**
 * The signature quote CTA — use this for EVERY "Get A Quote" button.
 * eb-btn-primary plus the brand micro-interaction: a skewed lighter-green
 * block sweeps across on hover (echoing the logo's angled modules), with a
 * slight press-down scale on click.
 */
export function QuoteCTA({
  href = '/get-a-quote',
  children = 'Get A Quote',
  variant = 'primary',
  className = '',
}: QuoteCTAProps) {
  return (
    <Link
      href={href}
      className={[
        variant === 'dark' ? 'eb-btn-dark' : 'eb-btn-primary',
        'group relative overflow-hidden transition-transform duration-150 active:scale-[0.97]',
        className,
      ].join(' ')}
    >
      {/* Sweeping block — skewed like the logo modules */}
      <span
        aria-hidden="true"
        className={[
          'pointer-events-none absolute inset-y-0 -left-full w-full',
          '-skew-x-[18deg]',
          variant === 'dark' ? 'bg-white/10' : 'bg-brand-400/60',
          'transition-transform duration-500 [transition-timing-function:var(--ease-out-expo)]',
          'group-hover:translate-x-[200%]',
          'motion-reduce:transition-none motion-reduce:group-hover:translate-x-0',
        ].join(' ')}
      />
      <span className="relative z-10 inline-flex items-center gap-2">{children}</span>
    </Link>
  )
}

export default QuoteCTA
