import type { Metadata } from 'next'

import { QuoteAssistant } from '@/components/quote/assistant/QuoteAssistant'
import { resolveQuotePricing } from '@/components/quote/pricing'
import { Reveal } from '@/components/ui/Reveal'
import { SectionHeading } from '@/components/ui/SectionHeading'
import { SITE } from '@/lib/site'
import { getPage, getQuotePricing } from '@/lib/data'

/**
 * /get-a-quote — the conversational Quote Assistant ("Eazy"). A chat-led
 * capture that gathers the same details as the /instant-quote wizard and
 * shows an indicative range, then hands the lead to the team. The section
 * carries data-quote-form so the sticky mobile CTA bar hides while it's in view.
 */

const FALLBACK_TITLE = 'Get a Quote | EazyBase Modular Home Extensions'
const FALLBACK_DESCRIPTION =
  'Answer a few quick questions and get an indicative price in about 60 seconds — then our team confirms your fixed-price quote. No obligation, ever.'

const BENEFITS = [
  'No obligation, ever',
  'Fixed price after survey',
  'Response within hours',
  'Finance options available',
]

export async function generateMetadata(): Promise<Metadata> {
  const page = await getPage('get-a-quote')
  return {
    title: { absolute: page?.seo?.metaTitle || FALLBACK_TITLE },
    description: page?.seo?.metaDescription || FALLBACK_DESCRIPTION,
    alternates: { canonical: '/get-a-quote' },
  }
}

export default async function GetAQuotePage() {
  const [page, pricingGlobal] = await Promise.all([getPage('get-a-quote'), getQuotePricing()])
  const pricing = resolveQuotePricing(pricingGlobal)

  return (
    <section
      data-quote-form
      className="bg-ink-50 py-14 sm:py-20"
      style={{
        backgroundImage:
          'radial-gradient(ellipse 60% 50% at 15% 0%, rgba(150,193,31,0.10), transparent 70%)',
      }}
    >
      <div className="eb-container grid items-center gap-12 lg:grid-cols-[minmax(0,1fr)_minmax(0,34rem)] lg:gap-16">
        {/* Left: pitch + trust */}
        <Reveal>
          <div>
            <SectionHeading
              as="h1"
              align="left"
              eyebrow="Instant quote"
              lede={
                page?.heroSub ? (
                  <span data-eb-edit={`pages:${page.id}:heroSub`}>{page.heroSub}</span>
                ) : (
                  'Answer a few quick questions and our team will prepare a personalised, fixed-price quote — no lengthy back-and-forth.'
                )
              }
            >
              {page?.heroHeading ? (
                <span data-eb-edit={`pages:${page.id}:heroHeading`}>{page.heroHeading}</span>
              ) : (
                'Get your free, fixed-price quote'
              )}
            </SectionHeading>

            <ul className="mt-8 space-y-3">
              {BENEFITS.map((b) => (
                <li key={b} className="flex items-center gap-3 text-ink-700">
                  <span
                    aria-hidden="true"
                    className="grid h-6 w-6 shrink-0 place-items-center rounded-full bg-brand-500"
                  >
                    <svg viewBox="0 0 16 16" className="h-3.5 w-3.5 text-ink-950" fill="none">
                      <path
                        d="M3.5 8.5l3 3 6-7"
                        stroke="currentColor"
                        strokeWidth={2}
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                    </svg>
                  </span>
                  <span className="font-medium">{b}</span>
                </li>
              ))}
            </ul>

            <div className="mt-8 flex items-center gap-3 rounded-xl border border-ink-100 bg-white/70 px-4 py-3">
              <svg viewBox="0 0 24 24" className="h-8 w-8 shrink-0 text-brand-600" fill="currentColor" aria-hidden="true">
                <path d="M12 2l2.4 5 5.6.5-4.2 3.7 1.3 5.5L12 19.3 6.9 22.2l1.3-5.5L4 13l5.6-.5L12 2z" />
              </svg>
              <p className="text-sm text-ink-600">
                <strong className="font-semibold text-ink-900">{SITE.awardBody}</strong> — {SITE.award}
              </p>
            </div>
          </div>
        </Reveal>

        {/* Right: the assistant */}
        <Reveal delay={0.12}>
          <QuoteAssistant pricing={pricing} />
        </Reveal>
      </div>
    </section>
  )
}
