/**
 * StatsBar — slim trust band directly under the home hero.
 * Three animated counters from SITE.stats + the award badge line.
 */

import { SITE } from '@/lib/site'
import { AnimatedCounter } from '@/components/ui/AnimatedCounter'

type Stat = {
  /** Rendered before the counter (e.g. "under"). */
  prefix?: string
  value: number
  /** Rendered tight after the counter (e.g. "-year"). */
  suffix?: string
  label: string
}

const STATS: Stat[] = [
  { value: SITE.stats.factoryWeeks, suffix: ' weeks', label: 'factory build' },
  { prefix: 'under ', value: Math.ceil(SITE.stats.installDays / 7), suffix: ' week', label: 'on-site install' },
  { value: SITE.stats.guaranteeYears, suffix: '-year', label: 'guarantee' },
]

export function StatsBar() {
  return (
    <section aria-label="Key facts" className="border-t border-white/10 bg-ink-900 text-white">
      <div className="eb-container flex flex-col items-center gap-6 py-6 lg:flex-row lg:justify-between">
        <dl className="grid w-full grid-cols-1 gap-6 sm:grid-cols-3 sm:gap-10 lg:w-auto">
          {STATS.map((stat) => (
            <div key={stat.label} className="flex items-baseline gap-2.5 justify-self-center sm:justify-self-start">
              <dd className="order-1 font-display text-2xl font-bold text-brand-400 sm:text-3xl">
                {stat.prefix ? <span className="text-lg font-semibold sm:text-xl">{stat.prefix}</span> : null}
                <AnimatedCounter value={stat.value} />
                {stat.suffix ? <span className="text-lg font-semibold sm:text-xl">{stat.suffix}</span> : null}
              </dd>
              <dt className="order-2 text-sm text-ink-300">{stat.label}</dt>
            </div>
          ))}
        </dl>

        <p className="flex items-center gap-2 text-center text-xs text-ink-300 lg:text-right">
          <span className="eb-block-accent !h-2.5 !w-4" aria-hidden="true" />
          <span>
            <span className="font-semibold text-ink-100">{SITE.awardBody}</span> — {SITE.award}
          </span>
        </p>
      </div>
    </section>
  )
}

export default StatsBar
