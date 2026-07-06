/**
 * ProcessStrip — static horizontal excerpt of the 5-step process
 * (Concept → Design → Build → Interior → Completion). The full scroll-driven
 * timeline lives on /what-we-do; this strip just links to it.
 */

import Link from 'next/link'

import { Reveal } from '@/components/ui/Reveal'
import { SectionHeading } from '@/components/ui/SectionHeading'
import type { ProcessTimelineBlock } from '@/payload-types'

type ProcessStripProps = {
  block: ProcessTimelineBlock
  /** e.g. "pages:1:sections.3" */
  editBase: string
}

export function ProcessStrip({ block, editBase }: ProcessStripProps) {
  const steps = block.steps ?? []
  if (steps.length === 0) return null

  return (
    <section className="bg-white">
      <div className="eb-container py-16 md:py-24">
        <Reveal>
          <SectionHeading
            eyebrow="How it works"
            lede="One company from first sketch to final snag — here is the journey in five steps."
          >
            <span data-eb-edit={`${editBase}.heading`}>{block.heading ?? 'Our 5-step process'}</span>
          </SectionHeading>
        </Reveal>

        <ol className="relative mt-12 grid gap-10 sm:grid-cols-2 lg:grid-cols-5 lg:gap-6">
          {/* Connecting line, desktop only */}
          <div
            aria-hidden="true"
            className="absolute top-5 right-[10%] left-[10%] hidden h-px bg-ink-200 lg:block"
          />
          {steps.map((step, i) => (
            <li key={step.id ?? step.title} className="relative">
              <Reveal delay={i * 0.08}>
                <span
                  aria-hidden="true"
                  className="relative z-10 inline-flex h-10 w-12 -skew-x-[18deg] items-center justify-center bg-brand-500 font-display text-base font-bold text-ink-950 shadow-sm"
                >
                  <span className="skew-x-[18deg]">{i + 1}</span>
                </span>
                <h3 className="mt-4 font-display text-base font-semibold text-ink-900">
                  <span data-eb-edit={`${editBase}.steps.${i}.title`}>{step.title}</span>
                </h3>
                {step.body ? (
                  <p
                    className="mt-2 text-sm leading-relaxed text-ink-500"
                    data-eb-edit={`${editBase}.steps.${i}.body`}
                  >
                    {step.body}
                  </p>
                ) : null}
              </Reveal>
            </li>
          ))}
        </ol>

        <div className="mt-12 text-center">
          <Link
            href="/what-we-do#process"
            className="inline-flex items-center gap-2 font-display text-sm font-semibold tracking-wide text-brand-700 uppercase underline-offset-4 hover:underline"
          >
            Explore the full process
            <span aria-hidden="true">→</span>
          </Link>
        </div>
      </div>
    </section>
  )
}

export default ProcessStrip
