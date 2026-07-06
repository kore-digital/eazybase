'use client'

/**
 * StatementIntro — the Build Story's title card: a slim (≤40vh on common
 * laptop viewports — type and padding are vh-capped) white band with two
 * lines of oversized display text, each word rising in once on scroll into
 * view (Reveal-style), plus one supporting line.
 *
 * The animated word spans are aria-hidden (their inline-block spacing would
 * concatenate into "MORESPACE." for screen readers); the h2 carries the full
 * accessible name via aria-label instead.
 */

import { motion } from 'motion/react'

import { useReducedMotionSafe } from '@/components/ui/useReducedMotionSafe'

const LINES: string[][] = [
  ['MORE', 'SPACE.'],
  ['LESS', 'BUILDING', 'SITE.'],
]

const STATEMENT = 'More space. Less building site.'

export function StatementIntro() {
  // Hydration-safe: false during SSR and the first client render, so the
  // server markup (the animated variant, words at their initial offset)
  // always matches; the static variant swaps in post-mount.
  const reducedMotion = useReducedMotionSafe()
  let word = 0

  return (
    <section className="bg-white" aria-label={STATEMENT}>
      <div className="eb-container py-12 md:py-14">
        {/* whileInView lives on the (unclipped) h2 and reaches the words via
            variants — a word span at y:110% inside overflow-hidden is fully
            clipped, so IntersectionObserver would never fire on it directly. */}
        <motion.h2
          aria-label={STATEMENT}
          className="font-display text-[clamp(2.5rem,min(7.5vw,9vh),5.5rem)] leading-[0.98] font-extrabold tracking-tight text-ink-950 uppercase"
          initial={reducedMotion ? undefined : 'hidden'}
          whileInView={reducedMotion ? undefined : 'visible'}
          viewport={{ once: true, margin: '0px 0px -15% 0px' }}
        >
          <span aria-hidden="true">
            {LINES.map((line, li) => (
              <span key={li} className="block">
                {line.map((text) => {
                  const delay = word++ * 0.09
                  return (
                    <span key={text} className="mr-[0.22em] inline-block overflow-hidden pb-[0.06em] align-bottom last:mr-0">
                      {reducedMotion ? (
                        <span className="inline-block">{text}</span>
                      ) : (
                        <motion.span
                          className="inline-block"
                          variants={{
                            hidden: { y: '110%' },
                            visible: {
                              y: '0%',
                              transition: { duration: 0.7, delay, ease: [0.16, 1, 0.3, 1] },
                            },
                          }}
                        >
                          {text}
                        </motion.span>
                      )}
                    </span>
                  )
                })}
              </span>
            ))}
          </span>
        </motion.h2>

        <p className="mt-5 flex max-w-2xl items-start gap-3 text-lg text-ink-500">
          <span className="eb-block-accent mt-2 shrink-0" aria-hidden="true" />
          Factory-built off site, installed at your home in days — scroll through the build,
          phase by phase.
        </p>
      </div>
    </section>
  )
}

export default StatementIntro
