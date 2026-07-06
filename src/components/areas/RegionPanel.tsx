import Link from 'next/link'

import { AreaCard } from '@/components/areas/AreaCard'
import { Reveal } from '@/components/ui/Reveal'

export type RegionTown = {
  id: number | string
  slug: string
  name: string
  hook?: string | null
}

type RegionPanelProps = {
  /** Panel title, e.g. "The North West". */
  title: string
  /** One-line supporting copy under the title. */
  blurb: string
  /** Link to the regional hub page, e.g. /areas/north-west. */
  hubHref: string
  hubLabel: string
  towns: RegionTown[]
}

/**
 * One region of the Areas hub: heading + hub link + a grid of tappable town
 * cards. Every name shown here is a real link — no dead region text.
 */
export function RegionPanel({ title, blurb, hubHref, hubLabel, towns }: RegionPanelProps) {
  return (
    <div className="rounded-xl bg-ink-50 p-6 sm:p-8">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div className="max-w-md">
          <h3 className="flex items-center gap-2.5 font-display text-2xl font-semibold text-ink-900">
            <span className="eb-block-accent h-3 w-5" aria-hidden="true" />
            {title}
          </h3>
          <p className="mt-2 text-sm leading-relaxed text-ink-500">{blurb}</p>
        </div>
        <Link
          href={hubHref}
          className="group inline-flex items-center gap-2 font-display text-sm font-semibold tracking-wide text-brand-700 transition-colors hover:text-brand-600"
        >
          {hubLabel}
          <span aria-hidden="true" className="transition-transform duration-200 group-hover:translate-x-0.5">
            →
          </span>
        </Link>
      </div>

      <ul className="mt-6 grid gap-4 sm:grid-cols-2" role="list">
        {towns.map((town, i) => (
          <li key={town.slug}>
            <Reveal delay={Math.min(i, 6) * 0.06} className="h-full">
              <AreaCard
                href={`/areas/${town.slug}`}
                name={town.name}
                hook={town.hook}
                hookEditPath={`areas:${town.id}:seo.metaDescription`}
              />
            </Reveal>
          </li>
        ))}
      </ul>
    </div>
  )
}

export default RegionPanel
