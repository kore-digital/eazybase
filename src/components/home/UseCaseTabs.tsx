'use client'

/**
 * UseCaseTabs — the four home use-cases (Kids Playrooms / Home Office /
 * Dining Rooms / Kitchens) as an accessible tabbed panel with an animated
 * underline and a motion crossfade. Below `md` it degrades to stacked cards.
 */

import Image from 'next/image'
import { AnimatePresence, motion } from 'motion/react'
import { useId, useState } from 'react'

import { QuoteCTA } from '@/components/ui/QuoteCTA'
import { useReducedMotionSafe } from '@/components/ui/useReducedMotionSafe'

export type UseCaseTab = {
  label: string
  heading: string
  body: string
  image?: { url: string; alt: string } | null
  /** Visual-editor base path, e.g. "pages:1:sections.2.tabs.0". */
  editBase?: string
}

type UseCaseTabsProps = {
  tabs: UseCaseTab[]
}

export function UseCaseTabs({ tabs }: UseCaseTabsProps) {
  const [active, setActive] = useState(0)
  // Hydration-safe: false on SSR + first client render, flips post-mount.
  const reducedMotion = useReducedMotionSafe()
  const baseId = useId()

  if (tabs.length === 0) return null

  const current = tabs[active]

  const onKeyDown = (event: React.KeyboardEvent) => {
    if (event.key !== 'ArrowRight' && event.key !== 'ArrowLeft') return
    event.preventDefault()
    const next =
      event.key === 'ArrowRight'
        ? (active + 1) % tabs.length
        : (active - 1 + tabs.length) % tabs.length
    setActive(next)
    document.getElementById(`${baseId}-tab-${next}`)?.focus()
  }

  return (
    <div>
      {/* ————— Desktop / tablet: tabbed panel ————— */}
      <div className="hidden md:block">
        <div
          role="tablist"
          aria-label="Uses for a modular extension"
          onKeyDown={onKeyDown}
          className="flex justify-center gap-2 border-b border-ink-200"
        >
          {tabs.map((tab, i) => {
            const selected = i === active
            return (
              <button
                key={tab.label}
                type="button"
                role="tab"
                id={`${baseId}-tab-${i}`}
                aria-selected={selected}
                aria-controls={`${baseId}-panel-${i}`}
                tabIndex={selected ? 0 : -1}
                onClick={() => setActive(i)}
                className={[
                  'relative px-5 py-3.5 font-display text-sm font-semibold tracking-wide uppercase transition-colors',
                  selected ? 'text-ink-900' : 'text-ink-400 hover:text-ink-700',
                ].join(' ')}
              >
                <span data-eb-edit={tab.editBase ? `${tab.editBase}.label` : undefined}>
                  {tab.label}
                </span>
                {selected ? (
                  <motion.span
                    layoutId={`${baseId}-underline`}
                    aria-hidden="true"
                    className="absolute inset-x-3 -bottom-px h-[3px] -skew-x-[18deg] bg-brand-500"
                    transition={
                      reducedMotion
                        ? { duration: 0 }
                        : { type: 'spring', stiffness: 400, damping: 32 }
                    }
                  />
                ) : null}
              </button>
            )
          })}
        </div>

        <AnimatePresence mode="wait" initial={false}>
          <motion.div
            key={active}
            role="tabpanel"
            id={`${baseId}-panel-${active}`}
            aria-labelledby={`${baseId}-tab-${active}`}
            initial={reducedMotion ? false : { opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={reducedMotion ? undefined : { opacity: 0, y: -8 }}
            transition={{ duration: 0.28, ease: [0.16, 1, 0.3, 1] }}
            className="grid items-center gap-10 pt-10 lg:grid-cols-2 lg:gap-14"
          >
            <div>
              <h3 className="text-2xl font-semibold text-ink-900">
                <span data-eb-edit={current.editBase ? `${current.editBase}.heading` : undefined}>
                  {current.heading}
                </span>
              </h3>
              <p
                className="mt-4 leading-relaxed text-ink-600"
                data-eb-edit={current.editBase ? `${current.editBase}.body` : undefined}
              >
                {current.body}
              </p>
              <div className="mt-7">
                <QuoteCTA href="/get-a-quote">Get A Quote</QuoteCTA>
              </div>
            </div>

            {current.image ? (
              <div className="relative aspect-[4/3] overflow-hidden rounded-lg shadow-lg">
                <Image
                  src={current.image.url}
                  alt={current.image.alt}
                  fill
                  sizes="(min-width: 1024px) 45vw, 90vw"
                  className="object-cover"
                />
              </div>
            ) : null}
          </motion.div>
        </AnimatePresence>
      </div>

      {/* ————— Mobile: stacked cards ————— */}
      <div className="space-y-6 md:hidden">
        {tabs.map((tab) => (
          <article key={tab.label} className="overflow-hidden rounded-lg bg-white shadow-md ring-1 ring-ink-100">
            {tab.image ? (
              <div className="relative aspect-[16/9]">
                <Image src={tab.image.url} alt={tab.image.alt} fill sizes="100vw" className="object-cover" />
              </div>
            ) : null}
            <div className="p-6">
              <h3 className="text-lg font-semibold text-ink-900">{tab.heading}</h3>
              <p className="mt-3 text-sm leading-relaxed text-ink-600">{tab.body}</p>
            </div>
          </article>
        ))}
      </div>
    </div>
  )
}

export default UseCaseTabs
