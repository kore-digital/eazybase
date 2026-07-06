import type { Metadata } from 'next'

import { CTABand } from '@/components/ui/CTABand'
import { Reveal } from '@/components/ui/Reveal'
import { SectionHeading } from '@/components/ui/SectionHeading'
import { getPage, getTestimonials } from '@/lib/data'
import { SITE } from '@/lib/site'
import type { Testimonial } from '@/payload-types'

const FALLBACK_TITLE = 'Time to Get Social'
const FALLBACK_SUB = 'Read our reviews and follow our latest projects.'
const FALLBACK_DESCRIPTION =
  'See what EazyBase customers say on Google, Yell and Facebook, and follow our latest modular extension projects on social media.'

export async function generateMetadata(): Promise<Metadata> {
  const page = await getPage('social')
  return {
    title: page?.seo?.metaTitle ? { absolute: page.seo.metaTitle } : FALLBACK_TITLE,
    description: page?.seo?.metaDescription ?? FALLBACK_DESCRIPTION,
  }
}

/* ---------------------------------------------------------------------------
 * Inline platform glyphs — no fetched logo images.
 * ------------------------------------------------------------------------- */

function GoogleGlyph({ className = 'h-4 w-4' }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} aria-hidden="true">
      <path
        fill="#4285F4"
        d="M23.5 12.27c0-.85-.08-1.66-.22-2.45H12v4.64h6.45a5.52 5.52 0 0 1-2.39 3.62v3h3.87c2.26-2.09 3.57-5.16 3.57-8.81Z"
      />
      <path
        fill="#34A853"
        d="M12 24c3.24 0 5.96-1.07 7.94-2.91l-3.87-3a7.24 7.24 0 0 1-10.8-3.8H1.27v3.1A12 12 0 0 0 12 24Z"
      />
      <path
        fill="#FBBC05"
        d="M5.27 14.28a7.2 7.2 0 0 1 0-4.56v-3.1H1.27a12 12 0 0 0 0 10.76l4-3.1Z"
      />
      <path
        fill="#EA4335"
        d="M12 4.77c1.76 0 3.34.6 4.58 1.8l3.44-3.44A11.97 11.97 0 0 0 1.27 6.62l4 3.1A7.18 7.18 0 0 1 12 4.77Z"
      />
    </svg>
  )
}

function YellGlyph({ className = 'h-4 w-4' }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} aria-hidden="true">
      <rect width="24" height="24" rx="5" fill="#FFDC00" />
      <path
        d="M6.2 6.5h2.9l2.9 5.2 2.9-5.2h2.9l-4.4 7.6v3.4h-2.8v-3.4L6.2 6.5Z"
        fill="#1e1f1d"
      />
    </svg>
  )
}

function FacebookGlyph({ className = 'h-4 w-4' }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} aria-hidden="true">
      <path
        fill="#1877F2"
        d="M24 12a12 12 0 1 0-13.88 11.85v-8.38H7.08V12h3.04V9.36c0-3 1.79-4.67 4.53-4.67 1.31 0 2.68.24 2.68.24v2.95h-1.51c-1.49 0-1.96.93-1.96 1.88V12h3.33l-.53 3.47h-2.8v8.38A12 12 0 0 0 24 12Z"
      />
    </svg>
  )
}

function InstagramGlyph({ className = 'h-5 w-5' }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} aria-hidden="true" fill="currentColor">
      <path d="M12 2.16c3.2 0 3.58.01 4.85.07 1.17.05 1.8.25 2.23.41.56.22.96.48 1.38.9.42.42.68.82.9 1.38.16.42.36 1.06.41 2.23.06 1.27.07 1.65.07 4.85s-.01 3.58-.07 4.85c-.05 1.17-.25 1.8-.41 2.23a3.72 3.72 0 0 1-.9 1.38c-.42.42-.82.68-1.38.9-.42.16-1.06.36-2.23.41-1.27.06-1.65.07-4.85.07s-3.58-.01-4.85-.07c-1.17-.05-1.8-.25-2.23-.41a3.72 3.72 0 0 1-1.38-.9 3.72 3.72 0 0 1-.9-1.38c-.16-.42-.36-1.06-.41-2.23-.06-1.27-.07-1.65-.07-4.85s.01-3.58.07-4.85c.05-1.17.25-1.8.41-2.23.22-.56.48-.96.9-1.38.42-.42.82-.68 1.38-.9.42-.16 1.06-.36 2.23-.41 1.27-.06 1.65-.07 4.85-.07ZM12 0C8.74 0 8.33.01 7.05.07 5.78.13 4.9.33 4.14.63a5.88 5.88 0 0 0-2.13 1.38A5.88 5.88 0 0 0 .63 4.14C.33 4.9.13 5.78.07 7.05.01 8.33 0 8.74 0 12s.01 3.67.07 4.95c.06 1.27.26 2.15.56 2.91.31.8.72 1.47 1.38 2.13a5.88 5.88 0 0 0 2.13 1.38c.76.3 1.64.5 2.91.56C8.33 23.99 8.74 24 12 24s3.67-.01 4.95-.07c1.27-.06 2.15-.26 2.91-.56a5.88 5.88 0 0 0 2.13-1.38 5.88 5.88 0 0 0 1.38-2.13c.3-.76.5-1.64.56-2.91.06-1.28.07-1.69.07-4.95s-.01-3.67-.07-4.95c-.06-1.27-.26-2.15-.56-2.91a5.88 5.88 0 0 0-1.38-2.13A5.88 5.88 0 0 0 19.86.63c-.76-.3-1.64-.5-2.91-.56C15.67.01 15.26 0 12 0Z" />
      <path d="M12 5.84A6.16 6.16 0 1 0 12 18.16 6.16 6.16 0 0 0 12 5.84Zm0 10.15a4 4 0 1 1 0-7.98 4 4 0 0 1 0 7.98ZM19.85 5.59a1.44 1.44 0 1 1-2.88 0 1.44 1.44 0 0 1 2.88 0Z" />
    </svg>
  )
}

function FacebookOutlineGlyph({ className = 'h-5 w-5' }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} aria-hidden="true" fill="currentColor">
      <path d="M24 12a12 12 0 1 0-13.88 11.85v-8.38H7.08V12h3.04V9.36c0-3 1.79-4.67 4.53-4.67 1.31 0 2.68.24 2.68.24v2.95h-1.51c-1.49 0-1.96.93-1.96 1.88V12h3.33l-.53 3.47h-2.8v8.38A12 12 0 0 0 24 12Z" />
    </svg>
  )
}

/* ---------------------------------------------------------------------------
 * Platform metadata
 * ------------------------------------------------------------------------- */

const PLATFORMS: Record<
  Testimonial['platform'],
  { name: string; reviewUrl: string; Glyph: (props: { className?: string }) => React.JSX.Element }
> = {
  google: { name: 'Google', reviewUrl: SITE.social.google, Glyph: GoogleGlyph },
  yell: { name: 'Yell', reviewUrl: SITE.social.yell, Glyph: YellGlyph },
  facebook: { name: 'Facebook', reviewUrl: SITE.social.facebook, Glyph: FacebookGlyph },
}

function PlatformChip({ platform }: { platform: Testimonial['platform'] }) {
  const { name, Glyph } = PLATFORMS[platform]
  return (
    <span className="inline-flex items-center gap-1.5 rounded-full border border-ink-100 bg-ink-50 px-3 py-1 font-display text-xs font-semibold tracking-wide text-ink-700">
      <Glyph className="h-3.5 w-3.5" />
      {name}
    </span>
  )
}

/* ---------------------------------------------------------------------------
 * Page
 * ------------------------------------------------------------------------- */

export default async function SocialPage() {
  const [page, testimonials] = await Promise.all([getPage('social'), getTestimonials()])

  const heroHeading = page?.heroHeading ?? FALLBACK_TITLE
  const heroSub = page?.heroSub ?? FALLBACK_SUB
  const ctaBlock = page?.sections?.find((s) => s.blockType === 'ctaBand')

  return (
    <>
      {/* Static page hero — simple fade/rise only */}
      <section className="relative overflow-hidden bg-ink-950">
        <div
          aria-hidden="true"
          className="absolute -top-10 -right-20 h-72 w-72 -skew-x-[18deg] bg-brand-500/10"
        />
        <div className="eb-container relative py-16 md:py-24">
          <Reveal>
            <SectionHeading
              as="h1"
              align="left"
              onDark
              eyebrow="Reviews & Social"
              lede={
                page ? (
                  <span data-eb-edit={`pages:${page.id}:heroSub`}>{heroSub}</span>
                ) : (
                  heroSub
                )
              }
            >
              {page ? (
                <span data-eb-edit={`pages:${page.id}:heroHeading`}>{heroHeading}</span>
              ) : (
                heroHeading
              )}
            </SectionHeading>
          </Reveal>
        </div>
      </section>

      {/* Testimonials — plain blockquote markup, deliberately no Review schema */}
      {testimonials.length > 0 ? (
        <section className="bg-white py-16 md:py-24">
          <div className="eb-container">
            <Reveal>
              <SectionHeading
                eyebrow="Customer Reviews"
                lede="Word for word, from the homeowners we have built for — on Google, Yell and Facebook."
              >
                What our customers say
              </SectionHeading>
            </Reveal>

            <ul className="mt-12 grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              {testimonials.map((t, i) => (
                <li key={t.id} className="h-full">
                  <Reveal delay={i * 0.08} className="h-full">
                    <figure className="flex h-full flex-col rounded-lg border border-ink-100 bg-white p-6 shadow-sm transition-shadow duration-300 hover:shadow-md">
                      <PlatformChip platform={t.platform} />
                      {t.title ? (
                        <p className="mt-4 font-display text-lg font-semibold text-ink-900">
                          <span data-eb-edit={`testimonials:${t.id}:title`}>{t.title}</span>
                        </p>
                      ) : null}
                      <blockquote className="mt-2 flex-1">
                        <p className="text-[15px] leading-relaxed text-ink-600">
                          &ldquo;
                          <span data-eb-edit={`testimonials:${t.id}:quote`}>{t.quote}</span>
                          &rdquo;
                        </p>
                      </blockquote>
                      <figcaption className="mt-5 font-display text-sm font-semibold text-ink-900">
                        <span data-eb-edit={`testimonials:${t.id}:author`}>{t.author}</span>
                        <span className="font-body font-normal text-ink-400">
                          {' '}
                          · review on {PLATFORMS[t.platform].name}
                        </span>
                      </figcaption>
                    </figure>
                  </Reveal>
                </li>
              ))}
            </ul>
          </div>
        </section>
      ) : null}

      {/* Review-platform CTA row */}
      <section className="bg-ink-50 py-16 md:py-24">
        <div className="eb-container">
          <Reveal>
            <SectionHeading
              eyebrow="Leave a Review"
              lede="Had an EazyBase extension? A quick review helps other homeowners find us — and it makes our week."
            >
              Share your experience
            </SectionHeading>
          </Reveal>

          <div className="mx-auto mt-12 grid max-w-3xl gap-4 sm:grid-cols-3">
            {(['google', 'yell', 'facebook'] as const).map((key, i) => {
              const { name, reviewUrl, Glyph } = PLATFORMS[key]
              return (
                <Reveal key={key} delay={i * 0.08}>
                  <a
                    href={reviewUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="group flex items-center justify-center gap-3 rounded-lg border border-ink-100 bg-white px-5 py-4 font-display text-sm font-semibold text-ink-800 shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md"
                  >
                    <Glyph className="h-5 w-5" />
                    <span>
                      Review us on {name}
                      <span className="sr-only"> (opens in a new tab)</span>
                    </span>
                  </a>
                </Reveal>
              )
            })}
          </div>
        </div>
      </section>

      {/* Follow band */}
      <section className="bg-ink-900 py-16 md:py-20">
        <div className="eb-container flex flex-col items-center gap-8 text-center md:flex-row md:justify-between md:text-left">
          <Reveal>
            <SectionHeading
              align="left"
              onDark
              eyebrow="Follow Along"
              lede="Factory builds, installs and finished extensions — posted as they happen."
              className="md:max-w-md"
            >
              Follow the builds
            </SectionHeading>
          </Reveal>
          <Reveal delay={0.1}>
            <div className="flex flex-col gap-4 sm:flex-row">
              <a
                href={SITE.social.instagram}
                target="_blank"
                rel="noopener noreferrer"
                className="eb-btn eb-btn-primary"
              >
                <InstagramGlyph />
                Instagram
                <span className="sr-only"> (opens in a new tab)</span>
              </a>
              <a
                href={SITE.social.facebook}
                target="_blank"
                rel="noopener noreferrer"
                className="eb-btn border-2 border-white/40 text-white transition-colors hover:border-white hover:bg-white hover:text-ink-900"
              >
                <FacebookOutlineGlyph />
                Facebook
                <span className="sr-only"> (opens in a new tab)</span>
              </a>
            </div>
          </Reveal>
        </div>
      </section>

      <CTABand
        heading={ctaBlock?.heading ?? 'Join our happy customers'}
        sub={ctaBlock?.body ?? undefined}
      />
    </>
  )
}
