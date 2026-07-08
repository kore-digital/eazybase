/**
 * TestimonialStrip — 2–3 featured customer reviews on a dark premium band.
 * Server component; renders nothing when no testimonials exist.
 */

import { Reveal } from '@/components/ui/Reveal'
import { SectionHeading } from '@/components/ui/SectionHeading'
import type { Testimonial } from '@/payload-types'

const PLATFORM_LABEL: Record<Testimonial['platform'], string> = {
  google: 'Google review',
  yell: 'Yell review',
  facebook: 'Facebook review',
}

type TestimonialStripProps = {
  heading?: string | null
  /** e.g. "pages:1:sections.5.heading" */
  headingEdit?: string
  eyebrow?: string | null
  eyebrowEdit?: string
  lede?: string | null
  ledeEdit?: string
  testimonials: Testimonial[]
}

export function TestimonialStrip({
  heading,
  headingEdit,
  eyebrow,
  eyebrowEdit,
  lede,
  ledeEdit,
  testimonials,
}: TestimonialStripProps) {
  if (testimonials.length === 0) return null

  return (
    <section className="bg-ink-900">
      <div className="eb-container py-16 md:py-24">
        <Reveal>
          <SectionHeading
            onDark
            eyebrow={eyebrow || 'Reviews'}
            eyebrowEdit={eyebrowEdit}
            lede={lede || 'Real reviews from homeowners across the North West and London.'}
            ledeEdit={ledeEdit}
          >
            <span data-eb-edit={headingEdit}>{heading ?? 'What our customers say'}</span>
          </SectionHeading>
        </Reveal>

        <ul className="mt-12 grid gap-6 md:grid-cols-3">
          {testimonials.map((t, i) => (
            <li key={t.id} className="h-full">
              <Reveal delay={i * 0.12} className="h-full">
                <figure className="flex h-full flex-col rounded-lg bg-ink-800 p-7 ring-1 ring-white/5">
                  <span aria-hidden="true" className="font-display text-5xl leading-none text-brand-500">
                    &ldquo;
                  </span>
                  {t.title ? (
                    <p className="mt-1 font-display text-base font-semibold text-white">
                      <span data-eb-edit={`testimonials:${t.id}:title`}>{t.title}</span>
                    </p>
                  ) : null}
                  <blockquote className="mt-3 grow text-sm leading-relaxed text-ink-200">
                    <p data-eb-edit={`testimonials:${t.id}:quote`}>{t.quote}</p>
                  </blockquote>
                  <figcaption className="mt-5 flex items-baseline justify-between gap-3 border-t border-white/10 pt-4">
                    <span className="font-display text-sm font-semibold text-white" data-eb-edit={`testimonials:${t.id}:author`}>
                      {t.author}
                    </span>
                    <span className="text-xs tracking-wide text-ink-400 uppercase">
                      {PLATFORM_LABEL[t.platform]}
                    </span>
                  </figcaption>
                </figure>
              </Reveal>
            </li>
          ))}
        </ul>
      </div>
    </section>
  )
}

export default TestimonialStrip
