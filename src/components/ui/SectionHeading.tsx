import type { ReactNode } from 'react'

type SectionHeadingProps = {
  /** Small-caps green kicker above the heading, e.g. "What We Do". */
  eyebrow?: string
  /** The heading itself. */
  children: ReactNode
  /** Optional supporting paragraph under the heading. */
  lede?: ReactNode
  /** Layout variant. Defaults to centred. */
  align?: 'center' | 'left'
  /** Heading level (defaults to h2). */
  as?: 'h1' | 'h2' | 'h3'
  /** Use light text — for dark (ink) section backgrounds. */
  onDark?: boolean
  className?: string
}

/**
 * Standard section heading: eyebrow (small caps, green, with the angled
 * block-accent from the logo), heading, optional lede.
 */
export function SectionHeading({
  eyebrow,
  children,
  lede,
  align = 'center',
  as: Tag = 'h2',
  onDark = false,
  className = '',
}: SectionHeadingProps) {
  const centred = align === 'center'

  return (
    <div
      className={[
        'max-w-2xl',
        centred ? 'mx-auto text-center' : 'text-left',
        className,
      ].join(' ')}
    >
      {eyebrow ? (
        <p
          className={[
            'mb-3 flex items-center gap-2.5 font-display text-xs font-semibold tracking-[0.2em] uppercase',
            centred ? 'justify-center' : '',
            onDark ? 'text-brand-400' : 'text-brand-600',
          ].join(' ')}
        >
          <span className="eb-block-accent h-2.5 w-4" aria-hidden="true" />
          {eyebrow}
        </p>
      ) : null}

      <Tag
        className={[
          'text-3xl font-semibold sm:text-4xl',
          onDark ? 'text-white' : 'text-ink-900',
        ].join(' ')}
      >
        {children}
      </Tag>

      {lede ? (
        <p
          className={[
            'mt-4 text-base leading-relaxed sm:text-lg',
            onDark ? 'text-ink-200' : 'text-ink-500',
          ].join(' ')}
        >
          {lede}
        </p>
      ) : null}
    </div>
  )
}

export default SectionHeading
