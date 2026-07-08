import type { Metadata } from 'next'

import { FAQAccordion } from '@/components/faq/FAQAccordion'
import { CTABand } from '@/components/ui/CTABand'
import { Reveal } from '@/components/ui/Reveal'
import { SectionHeading } from '@/components/ui/SectionHeading'
import { getFaqs, getPage } from '@/lib/data'
import { formatPhone } from '@/lib/format'
import { SITE } from '@/lib/site'

const FALLBACK_TITLE = 'Frequently Asked Questions'
const FALLBACK_SUB = 'Everything homeowners ask us about modular extensions, answered.'
const FALLBACK_DESCRIPTION =
  'Answers to the questions we hear most about modular home extensions — planning permission, build times, finishes, and why our extensions cost less.'

export async function generateMetadata(): Promise<Metadata> {
  const page = await getPage('faq')
  return {
    title: page?.seo?.metaTitle ? { absolute: page.seo.metaTitle } : FALLBACK_TITLE,
    description: page?.seo?.metaDescription ?? FALLBACK_DESCRIPTION,
    alternates: { canonical: '/faq' },
  }
}

export default async function FAQPage() {
  const [page, faqs] = await Promise.all([getPage('faq'), getFaqs()])

  const heroHeading = page?.heroHeading ?? FALLBACK_TITLE
  const heroSub = page?.heroSub ?? FALLBACK_SUB
  const ctaBlock = page?.sections?.find((s) => s.blockType === 'ctaBand')

  const jsonLd =
    faqs.length > 0
      ? JSON.stringify({
          '@context': 'https://schema.org',
          '@type': 'FAQPage',
          mainEntity: faqs.map((faq) => ({
            '@type': 'Question',
            name: faq.question,
            acceptedAnswer: { '@type': 'Answer', text: faq.answer },
          })),
        }).replace(/</g, '\\u003c')
      : null

  return (
    <>
      {jsonLd ? (
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: jsonLd }} />
      ) : null}

      {/* Static page hero — simple fade/rise only (the home hero owns the signature animation) */}
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
              eyebrow={page?.heroEyebrow || 'Help & Advice'}
              eyebrowEdit={page ? `pages:${page.id}:heroEyebrow` : undefined}
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

      {/* FAQ accordion */}
      <section className="bg-white py-16 md:py-24">
        <div className="eb-container">
          <div className="mx-auto max-w-3xl">
            {faqs.length > 0 ? (
              <Reveal delay={0.1}>
                <FAQAccordion
                  headingLevel="h2"
                  defaultOpenId={faqs[0].id}
                  items={faqs.map((faq) => ({
                    id: faq.id,
                    question: faq.question,
                    answer: faq.answer,
                    questionEdit: `faqs:${faq.id}:question`,
                    answerEdit: `faqs:${faq.id}:answer`,
                  }))}
                />
              </Reveal>
            ) : (
              <p className="text-center text-ink-500">
                Questions and answers are on their way. In the meantime, call us on{' '}
                {formatPhone(SITE.phone)} — we are happy to help.
              </p>
            )}
          </div>
        </div>
      </section>

      <CTABand
        heading={ctaBlock?.heading ?? 'Still have a question?'}
        sub={
          ctaBlock?.body ??
          `Call ${formatPhone(SITE.phone)} or send us a message — our team answers quote requests seven days a week.`
        }
      />
    </>
  )
}
