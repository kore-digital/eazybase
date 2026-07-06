import { Reveal } from '@/components/ui/Reveal'
import type { Testimonial } from '@/payload-types'

const PLATFORM_LABEL: Record<Testimonial['platform'], string> = {
  google: 'Google review',
  yell: 'Yell review',
  facebook: 'Facebook review',
}

type AreaTestimonialsProps = {
  testimonials: Testimonial[]
}

/**
 * One or two testimonial cards for area pages. Quote text is edit-wired to
 * the testimonials collection.
 */
export function AreaTestimonials({ testimonials }: AreaTestimonialsProps) {
  if (testimonials.length === 0) return null

  return (
    <div
      className={[
        'grid gap-6',
        testimonials.length > 1 ? 'md:grid-cols-2' : 'mx-auto max-w-2xl',
      ].join(' ')}
    >
      {testimonials.map((t, i) => (
        <Reveal key={t.id} delay={i * 0.1} className="h-full">
          <figure className="flex h-full flex-col rounded-lg border border-ink-100 bg-white p-8">
            <span aria-hidden="true" className="eb-block-accent h-3 w-5" />
            {t.title ? (
              <p
                className="mt-4 font-display text-lg font-semibold text-ink-900"
                data-eb-edit={`testimonials:${t.id}:title`}
              >
                {t.title}
              </p>
            ) : null}
            <blockquote className="mt-3 flex-1 text-base leading-relaxed text-ink-600">
              {/* Decorative quotes live OUTSIDE the editable node so inline
                  edits never bake them into the CMS quote field. */}
              <p>
                <span aria-hidden="true">“</span>
                <span data-eb-edit={`testimonials:${t.id}:quote`}>{t.quote}</span>
                <span aria-hidden="true">”</span>
              </p>
            </blockquote>
            <figcaption className="mt-5 text-sm text-ink-500">
              <span className="font-semibold text-ink-800" data-eb-edit={`testimonials:${t.id}:author`}>
                {t.author}
              </span>
              <span aria-hidden="true"> · </span>
              {PLATFORM_LABEL[t.platform]}
            </figcaption>
          </figure>
        </Reveal>
      ))}
    </div>
  )
}

export default AreaTestimonials
