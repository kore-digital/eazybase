import Link from 'next/link'

type AreaCardProps = {
  href: string
  name: string
  /** One-line hook under the town name (usually the area's meta description). */
  hook?: string | null
  /** data-eb-edit path for the hook text, e.g. "areas:3:seo.metaDescription". */
  hookEditPath?: string
}

/**
 * Generous tappable town card for the Areas hub — whole card is the link.
 */
export function AreaCard({ href, name, hook, hookEditPath }: AreaCardProps) {
  return (
    <Link
      href={href}
      className="group flex h-full flex-col rounded-lg border border-ink-100 bg-white p-6 transition-all duration-200 hover:-translate-y-0.5 hover:border-brand-300 hover:shadow-lg hover:shadow-ink-900/5 motion-reduce:hover:translate-y-0"
    >
      <span className="flex items-center justify-between gap-3">
        <span className="font-display text-lg font-semibold text-ink-900 transition-colors group-hover:text-brand-700">
          {name}
        </span>
        <span
          aria-hidden="true"
          className="inline-flex h-8 w-8 shrink-0 -skew-x-[12deg] items-center justify-center bg-ink-50 text-ink-400 transition-all duration-200 group-hover:bg-brand-500 group-hover:text-white"
        >
          <svg viewBox="0 0 16 16" className="h-4 w-4 skew-x-[12deg]" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M3 8h10M9 4l4 4-4 4" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </span>
      </span>
      {hook ? (
        <span
          className="mt-2 line-clamp-2 text-sm leading-relaxed text-ink-500"
          {...(hookEditPath ? { 'data-eb-edit': hookEditPath } : {})}
        >
          {hook}
        </span>
      ) : null}
    </Link>
  )
}

export default AreaCard
