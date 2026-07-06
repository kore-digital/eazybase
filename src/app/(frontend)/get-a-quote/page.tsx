import type { Metadata } from 'next'
import { RichText } from '@payloadcms/richtext-lexical/react'

import { QuoteAside } from '@/components/quote/QuoteAside'
import { QuoteForm } from '@/components/quote/QuoteForm'
import { Reveal } from '@/components/ui/Reveal'
import { SectionHeading } from '@/components/ui/SectionHeading'
import { getPage } from '@/lib/data'

/**
 * /get-a-quote — the consolidated quote form (audit §8: the old site's two
 * different forms merged into one canonical form). Copy comes from the
 * seeded CMS page; the section carries id="quote-form" so the sticky mobile
 * CTA bar hides itself while the form is in view.
 */

const FALLBACK_TITLE = 'Get a Quote | EazyBase Modular Home Extensions'
const FALLBACK_DESCRIPTION =
  'Tell us about your project and get a fast, accurate quote for your modular home extension. Our team responds seven days a week.'

export async function generateMetadata(): Promise<Metadata> {
  const page = await getPage('get-a-quote')
  return {
    title: { absolute: page?.seo?.metaTitle || FALLBACK_TITLE },
    description: page?.seo?.metaDescription || FALLBACK_DESCRIPTION,
  }
}

export default async function GetAQuotePage() {
  const page = await getPage('get-a-quote')

  const sections = page?.sections ?? []
  const introIndex = sections.findIndex((s) => s.blockType === 'richText')
  const intro = introIndex >= 0 ? sections[introIndex] : null

  return (
    <>
      {/* Static page hero — simple fade/rise only (the home page owns the
          signature assembly animation). */}
      <section className="bg-ink-950 py-16 sm:py-20">
        <div className="eb-container">
          <Reveal>
            <SectionHeading
              as="h1"
              align="left"
              onDark
              eyebrow="Free & no obligation"
              lede={
                page?.heroSub ? (
                  <span data-eb-edit={`pages:${page.id}:heroSub`}>{page.heroSub}</span>
                ) : (
                  'Quick quotes, seven days a week.'
                )
              }
            >
              {page?.heroHeading ? (
                <span data-eb-edit={`pages:${page.id}:heroHeading`}>{page.heroHeading}</span>
              ) : (
                'Get a Quote'
              )}
            </SectionHeading>
          </Reveal>
        </div>
      </section>

      {/* The form + side column */}
      <section id="quote-form" data-quote-form className="bg-white py-14 sm:py-20">
        <div className="eb-container grid items-start gap-10 lg:grid-cols-[minmax(0,1fr)_360px] lg:gap-14">
          <Reveal>
            <div>
              {intro && page && 'content' in intro && intro.content ? (
                <div
                  data-eb-edit-rich={`pages:${page.id}:sections.${introIndex}.content`}
                  className="mb-8 max-w-2xl text-base leading-relaxed text-ink-600 [&_p+p]:mt-4"
                >
                  <RichText data={intro.content} />
                </div>
              ) : (
                <p className="mb-8 max-w-2xl text-base leading-relaxed text-ink-600">
                  Give us a few brief details about your project and one of our team will be in
                  touch to talk it through and provide an accurate quote.
                </p>
              )}
              <QuoteForm />
            </div>
          </Reveal>

          <Reveal delay={0.12}>
            <QuoteAside />
          </Reveal>
        </div>
      </section>
    </>
  )
}
