'use client'

import Image from 'next/image'
import { motion, useReducedMotion, useScroll, useSpring } from 'motion/react'
import { useRef, type ReactNode } from 'react'

export type ProcessTimelineStep = {
  title: string
  body?: string | null
  /** Optional per-step photo (already resolved to a URL by the server). */
  image?: { url: string; alt: string } | null
  /** data-eb-edit value when the title is CMS-sourced. */
  titleEdit?: string
  /** data-eb-edit value when the body is CMS-sourced. */
  bodyEdit?: string
}

type ProcessTimelineProps = {
  steps: ProcessTimelineStep[]
  className?: string
}

/**
 * The scroll-driven 5-step process timeline (What We Do — signature moment #2).
 *
 * A vertical spine runs down the timeline; the green progress line draws in
 * with scroll (useScroll → scaleY). Each step rises in with a numbered
 * angled-block marker echoing the logo's modular blocks, photo alternating
 * sides on desktop. Under prefers-reduced-motion everything renders as a
 * static list with the spine fully drawn.
 */
export function ProcessTimeline({ steps, className = '' }: ProcessTimelineProps) {
  const ref = useRef<HTMLDivElement>(null)
  const reduceMotion = useReducedMotion()

  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ['start 0.75', 'end 0.55'],
  })
  const progress = useSpring(scrollYProgress, { stiffness: 140, damping: 28, mass: 0.6 })

  if (steps.length === 0) return null

  return (
    <div ref={ref} className={['relative', className].join(' ')}>
      {/* Spine track */}
      <div
        aria-hidden="true"
        className="absolute top-2 bottom-10 left-5 w-0.5 -translate-x-1/2 bg-ink-200 md:left-1/2"
      />
      {/* Progress line — draws with scroll */}
      {reduceMotion ? (
        <div
          aria-hidden="true"
          className="absolute top-2 bottom-10 left-5 w-0.5 -translate-x-1/2 bg-brand-500 md:left-1/2"
        />
      ) : (
        <motion.div
          aria-hidden="true"
          style={{ scaleY: progress }}
          className="absolute top-2 bottom-10 left-5 w-0.5 origin-top -translate-x-1/2 bg-brand-500 md:left-1/2"
        />
      )}

      <ol className="space-y-16 md:space-y-24">
        {steps.map((step, i) => {
          const flip = i % 2 === 1

          const marker = (
            <MotionMaybe
              reduce={reduceMotion ?? false}
              className="absolute top-0 left-5 z-10 -translate-x-1/2 md:static md:translate-x-0 md:justify-self-center"
            >
              <span className="grid h-10 w-10 -skew-x-[18deg] place-items-center bg-brand-500 shadow-md shadow-brand-500/30 sm:h-12 sm:w-12">
                <span className="skew-x-[18deg] font-display text-lg font-bold text-white sm:text-xl">
                  {i + 1}
                </span>
              </span>
            </MotionMaybe>
          )

          const text = (
            <MotionMaybe
              reduce={reduceMotion ?? false}
              delay={0.08}
              className={flip ? 'md:text-left' : 'md:text-right'}
            >
              <p
                className={[
                  'mb-2 flex items-center gap-2.5 font-display text-xs font-semibold tracking-[0.2em] text-brand-600 uppercase',
                  flip ? '' : 'md:justify-end',
                ].join(' ')}
              >
                <span className="eb-block-accent h-2.5 w-4" aria-hidden="true" />
                Step {i + 1} of {steps.length}
              </p>
              <h3 className="text-2xl font-semibold text-ink-900 sm:text-3xl">
                {step.titleEdit ? <span data-eb-edit={step.titleEdit}>{step.title}</span> : step.title}
              </h3>
              {step.body ? (
                <p className="mt-3 leading-relaxed text-ink-500">
                  {step.bodyEdit ? <span data-eb-edit={step.bodyEdit}>{step.body}</span> : step.body}
                </p>
              ) : null}
            </MotionMaybe>
          )

          const photo = step.image ? (
            <MotionMaybe reduce={reduceMotion ?? false} delay={0.16}>
              <div className="relative aspect-[4/3] overflow-hidden rounded-lg shadow-lg shadow-ink-900/10">
                <Image
                  src={step.image.url}
                  alt={step.image.alt}
                  fill
                  sizes="(min-width: 768px) 40vw, 90vw"
                  className="object-cover"
                />
              </div>
            </MotionMaybe>
          ) : null

          return (
            <li
              key={step.title + i}
              className="relative grid gap-6 pl-14 md:grid-cols-[1fr_5.5rem_1fr] md:items-center md:gap-y-0 md:pl-0"
            >
              {/* Desktop: text and photo swap sides each step; marker sits on the centre spine. */}
              <div className={flip ? 'md:order-3' : 'md:order-1'}>{text}</div>
              <div className="md:order-2">{marker}</div>
              <div className={flip ? 'md:order-1' : 'md:order-3'}>{photo}</div>
            </li>
          )
        })}
      </ol>
    </div>
  )
}

/** whileInView fade+rise wrapper that degrades to a plain div under reduced motion. */
function MotionMaybe({
  children,
  reduce,
  delay = 0,
  className = '',
}: {
  children: ReactNode
  reduce: boolean
  delay?: number
  className?: string
}) {
  if (reduce) {
    return <div className={className}>{children}</div>
  }
  return (
    <motion.div
      className={className}
      initial={{ opacity: 0, y: 28 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: '0px 0px -12% 0px' }}
      transition={{ duration: 0.7, delay, ease: [0.16, 1, 0.3, 1] }}
    >
      {children}
    </motion.div>
  )
}

export default ProcessTimeline
