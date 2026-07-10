import type { Metadata } from 'next'

import { PromoBanner } from '@/components/layout/PromoModal'
import { QuoteModes } from '@/components/quote/QuoteModes'
import { resolveQuotePricing } from '@/components/quote/pricing'
import { Reveal } from '@/components/ui/Reveal'
import { SectionHeading } from '@/components/ui/SectionHeading'
import { getPage, getQuotePricing, getSiteSettings } from '@/lib/data'

/**
 * /get-a-quote — the single quote page, two modes. A toggle swaps between the
 * Instant estimator (a price in ~60s) and the Eazy chat assistant, both on the
 * same pricing model. Deep-link a mode with ?mode=chat|instant. The old
 * /instant-quote URL 301s here (see next.config.ts). data-quote-form hides the
 * sticky mobile CTA while the tool is in view.
 */

const FALLBACK_TITLE = 'Get a Quote | EazyBase Modular Home Extensions'
const FALLBACK_DESCRIPTION =
  'Get an indicative price in 60 seconds with our estimator, or chat it through with our team — then we confirm your fixed-price quote. No obligation, ever.'

const BENEFITS = ['No obligation, ever', 'Fixed price after survey', 'Response within hours', 'Finance options available']

export async function generateMetadata(): Promise<Metadata> {
  const page = await getPage('get-a-quote')
  return {
    title: { absolute: page?.seo?.metaTitle || FALLBACK_TITLE },
    description: page?.seo?.metaDescription || FALLBACK_DESCRIPTION,
    alternates: { canonical: '/get-a-quote' },
  }
}

export default async function GetAQuotePage({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>
}) {
  const sp = await searchParams
  const modeParam = Array.isArray(sp.mode) ? sp.mode[0] : sp.mode
  const initialMode = modeParam === 'chat' ? 'chat' : 'instant'

  const [page, pricingGlobal, settings] = await Promise.all([
    getPage('get-a-quote'),
    getQuotePricing(),
    getSiteSettings(),
  ])
  const pricing = resolveQuotePricing(pricingGlobal)
  const promoOn = settings?.promoEnabled !== false

  return (
    <>
      {/* Hero */}
      <section className="bg-ink-950 py-16 sm:py-20">
        <div className="eb-container">
          <Reveal>
            <SectionHeading
              as="h1"
              align="left"
              onDark
              eyebrow={page?.heroEyebrow || 'Free, no-obligation quote'}
              eyebrowEdit={page ? `pages:${page.id}:heroEyebrow` : undefined}
              lede={
                page?.heroSub ? (
                  <span data-eb-edit={`pages:${page.id}:heroSub`}>{page.heroSub}</span>
                ) : (
                  'A price in 60 seconds, or a friendly chat — your choice.'
                )
              }
            >
              {page?.heroHeading ? (
                <span data-eb-edit={`pages:${page.id}:heroHeading`}>{page.heroHeading}</span>
              ) : (
                'Get your quote, your way'
              )}
            </SectionHeading>
          </Reveal>
        </div>
      </section>

      {/* The quote tool — toggle between instant estimate and chat */}
      <section data-quote-form className="bg-white py-14 sm:py-20">
        <div className="eb-container">
          {promoOn ? (
            <div className="mb-8">
              <PromoBanner />
            </div>
          ) : null}

          <Reveal delay={0.08}>
            <QuoteModes pricing={pricing} initialMode={initialMode} />
          </Reveal>

          <ul className="mx-auto mt-10 flex max-w-2xl flex-wrap items-center justify-center gap-x-6 gap-y-2.5 text-sm text-ink-600">
            {BENEFITS.map((b) => (
              <li key={b} className="flex items-center gap-2">
                <span aria-hidden="true" className="grid h-5 w-5 shrink-0 place-items-center rounded-full bg-brand-500">
                  <svg viewBox="0 0 16 16" className="h-3 w-3 text-ink-950" fill="none">
                    <path d="M3.5 8.5l3 3 6-7" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                </span>
                <span className="font-medium">{b}</span>
              </li>
            ))}
          </ul>
        </div>
      </section>
    </>
  )
}
