import type { Metadata } from 'next'
import { RichText } from '@payloadcms/richtext-lexical/react'

import { InstantQuoteWizard } from '@/components/quote/InstantQuoteWizard'
import { CTABand } from '@/components/ui/CTABand'
import { Reveal } from '@/components/ui/Reveal'
import { SectionHeading } from '@/components/ui/SectionHeading'
import { getPage } from '@/lib/data'

/**
 * /instant-quote — a brand-new quick estimator (the old URL just duplicated
 * the contact form; there was never a real calculator). Three client-side
 * steps (type → size → spec) produce an animated indicative £range, then an
 * inline lead capture persists the estimate via the shared quote action.
 */

const FALLBACK_TITLE = 'Instant Quote | EazyBase Modular Home Extensions'
const FALLBACK_DESCRIPTION =
  'Use our instant estimator to get an indicative price range for your modular home extension — then request a full, accurate quote from our team.'

export async function generateMetadata(): Promise<Metadata> {
  const page = await getPage('instant-quote')
  return {
    title: { absolute: page?.seo?.metaTitle || FALLBACK_TITLE },
    description: page?.seo?.metaDescription || FALLBACK_DESCRIPTION,
  }
}

export default async function InstantQuotePage() {
  const page = await getPage('instant-quote')

  const sections = page?.sections ?? []
  const introIndex = sections.findIndex((s) => s.blockType === 'richText')
  const intro = introIndex >= 0 ? sections[introIndex] : null
  const ctaIndex = sections.findIndex((s) => s.blockType === 'ctaBand')
  const cta = ctaIndex >= 0 ? sections[ctaIndex] : null

  return (
    <>
      {/* Static page hero — simple fade/rise only. */}
      <section className="bg-ink-950 py-16 sm:py-20">
        <div className="eb-container">
          <Reveal>
            <SectionHeading
              as="h1"
              align="left"
              onDark
              eyebrow="60-second estimator"
              lede={
                page?.heroSub ? (
                  <span data-eb-edit={`pages:${page.id}:heroSub`}>{page.heroSub}</span>
                ) : (
                  'Get an indicative price for your extension in under a minute.'
                )
              }
            >
              {page?.heroHeading ? (
                <span data-eb-edit={`pages:${page.id}:heroHeading`}>{page.heroHeading}</span>
              ) : (
                'Instant Quote'
              )}
            </SectionHeading>
          </Reveal>
        </div>
      </section>

      {/* The estimator */}
      <section className="bg-white py-14 sm:py-20">
        <div className="eb-container">
          {intro && page && 'content' in intro && intro.content ? (
            <Reveal>
              <div
                data-eb-edit-rich={`pages:${page.id}:sections.${introIndex}.content`}
                className="mx-auto mb-10 max-w-2xl text-center text-base leading-relaxed text-ink-600 [&_p+p]:mt-4"
              >
                <RichText data={intro.content} />
              </div>
            </Reveal>
          ) : null}

          <Reveal delay={0.08}>
            <InstantQuoteWizard />
          </Reveal>
        </div>
      </section>

      {/* Seeded "prefer to talk" band → full-form path */}
      {cta && page && cta.blockType === 'ctaBand' ? (
        <CTABand
          variant="dark"
          heading={<span data-eb-edit={`pages:${page.id}:sections.${ctaIndex}.heading`}>{cta.heading}</span>}
          sub={
            cta.body ? (
              <span data-eb-edit={`pages:${page.id}:sections.${ctaIndex}.body`}>{cta.body}</span>
            ) : undefined
          }
          quoteHref="/get-a-quote"
          quoteLabel="Get a Full Quote"
        />
      ) : (
        <CTABand
          variant="dark"
          heading="Prefer to talk it through?"
          quoteHref="/get-a-quote"
          quoteLabel="Get a Full Quote"
        />
      )}
    </>
  )
}
