import type { Metadata } from 'next'

import { QuoteModes } from '@/components/quote/QuoteModes'
import { resolveQuotePricing } from '@/components/quote/pricing'
import { Reveal } from '@/components/ui/Reveal'
import { SectionHeading } from '@/components/ui/SectionHeading'
import { getQuotePricing } from '@/lib/data'

/**
 * PREVIEW ONLY — /quote-preview. A working mock of the "merged" quote page so
 * we can compare it against the two separate pages before deciding. noindex.
 * Delete this route (and QuoteModes) if we don't go with the merge.
 */
export const metadata: Metadata = {
  title: { absolute: 'Quote (merge preview) | EazyBase' },
  robots: { index: false, follow: false },
}

export default async function QuotePreviewPage() {
  const pricing = resolveQuotePricing(await getQuotePricing())

  return (
    <>
      <section className="bg-ink-950 py-16 sm:py-20">
        <div className="eb-container">
          <Reveal>
            <SectionHeading
              as="h1"
              align="left"
              onDark
              eyebrow="Free, no-obligation quote"
              lede="A price in 60 seconds, or a friendly chat — your choice."
            >
              Get your quote, your way
            </SectionHeading>
          </Reveal>
        </div>
      </section>

      <section className="bg-white py-14 sm:py-20">
        <div className="eb-container">
          <Reveal delay={0.08}>
            <QuoteModes pricing={pricing} />
          </Reveal>
        </div>
      </section>
    </>
  )
}
