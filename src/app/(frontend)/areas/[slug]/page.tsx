import type { Metadata } from 'next'
import Link from 'next/link'
import { notFound } from 'next/navigation'

import { RichText } from '@payloadcms/richtext-lexical/react'

import { AreaTestimonials } from '@/components/areas/AreaTestimonials'
import { LocalAngles, type AngleImage } from '@/components/areas/LocalAngles'
import { FAQAccordion } from '@/components/faq/FAQAccordion'
import { CTABand } from '@/components/ui/CTABand'
import { QuoteCTA } from '@/components/ui/QuoteCTA'
import { Reveal } from '@/components/ui/Reveal'
import { SectionHeading } from '@/components/ui/SectionHeading'
import { getAllAreas, getArea, getGalleryItems, getSiteSettings, getTestimonials } from '@/lib/data'
import { formatPhone, telHref, waHref } from '@/lib/format'
import { faqPage, jsonLdScript, localBusinessService } from '@/lib/jsonld'
import { ORDER_STEPS, SITE } from '@/lib/site'

type Params = Promise<{ slug: string }>

export async function generateStaticParams() {
  const areas = await getAllAreas()
  return areas.map((area) => ({ slug: area.slug }))
}

export async function generateMetadata({ params }: { params: Params }): Promise<Metadata> {
  const { slug } = await params
  const area = await getArea(slug)
  if (!area) return {}

  return {
    // Seeded metaTitles already carry "| EazyBase" — absolute avoids the
    // layout template doubling the suffix.
    title: area.seo?.metaTitle
      ? { absolute: area.seo.metaTitle }
      : `Modular Home Extensions in ${area.name}`,
    description:
      area.seo?.metaDescription ??
      `Factory-built modular home extensions for ${area.name} — built in Blackburn in as little as four weeks, installed at your home in under one.`,
    alternates: { canonical: `/areas/${area.slug}` },
  }
}

/** Small deterministic hash so each area rotates gallery/testimonials differently. */
function hashSlug(slug: string): number {
  let h = 0
  for (let i = 0; i < slug.length; i++) h = (h * 31 + slug.charCodeAt(i)) % 997
  return h
}

const REGION_LABEL = { 'north-west': 'The North West', london: 'London' } as const

export default async function AreaPage({ params }: { params: Params }) {
  const { slug } = await params
  const area = await getArea(slug)
  if (!area) notFound()

  const [galleryItems, testimonials, settings] = await Promise.all([
    getGalleryItems(),
    getTestimonials(),
    getSiteSettings(),
  ])
  const phone = settings?.phone?.trim() || SITE.phone
  const whatsappNumber = settings?.whatsappNumber?.trim() || SITE.whatsappNumber
  const seed = hashSlug(area.slug)

  // Rotate through seeded gallery media (exteriors first, then interiors),
  // offset per-area so neighbouring pages don't repeat the same photos.
  const usable = galleryItems
    .filter((item) => typeof item.image === 'object' && item.image?.url)
    .sort((a, b) => {
      const rank = (c: string) => (c === 'exterior' ? 0 : c === 'interior' ? 1 : 2)
      return rank(a.category) - rank(b.category)
    })
  const angleImages: AngleImage[] = usable.map((item) => {
    const media = item.image as Exclude<typeof item.image, number>
    return { src: media.sizes?.card?.url ?? media.url ?? '', alt: item.alt }
  })
  const rotated =
    angleImages.length > 0
      ? angleImages.slice(seed % angleImages.length).concat(angleImages.slice(0, seed % angleImages.length))
      : []

  // 1–2 testimonials, featured first, rotated per-area.
  const rankedTestimonials = [...testimonials].sort(
    (a, b) => Number(Boolean(b.featured)) - Number(Boolean(a.featured)),
  )
  const picked =
    rankedTestimonials.length > 0
      ? [0, 1]
          .map((n) => rankedTestimonials[(seed + n) % rankedTestimonials.length])
          .filter((t, i, arr) => arr.findIndex((x) => x.id === t.id) === i)
      : []

  const heroHeading = area.heroHeading ?? `Modular Home Extensions in ${area.name}`
  const faqs = area.faqs ?? []
  const angles = area.localAngles ?? []
  const whatsappHref = waHref(
    whatsappNumber,
    `Hi EazyBase, I'd like to talk about a modular extension in ${area.name}.`,
  )

  const schema = [localBusinessService(area)]
  if (faqs.length > 0) schema.push(faqPage(faqs))

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: jsonLdScript(...schema) }}
      />

      {/* Static hero band — simple fade/rise only */}
      <section className="bg-ink-950">
        <div className="eb-container py-16 md:py-24">
          <Reveal>
            <p className="mb-3 flex items-center gap-2.5 font-display text-xs font-semibold tracking-[0.2em] uppercase text-brand-400">
              <span className="eb-block-accent h-2.5 w-4" aria-hidden="true" />
              <Link href="/areas" className="transition-colors hover:text-brand-300">
                Areas we serve
              </Link>
              <span aria-hidden="true" className="text-ink-500">
                /
              </span>
              <span>{REGION_LABEL[area.region]}</span>
            </p>
            <h1 className="max-w-3xl text-3xl font-semibold text-white sm:text-4xl md:text-5xl">
              <span data-eb-edit={`areas:${area.id}:heroHeading`}>{heroHeading}</span>
            </h1>
            <p className="mt-5 max-w-2xl text-base leading-relaxed text-ink-200 sm:text-lg">
              Designed around your home, factory-built in Blackburn in as little as{' '}
              {SITE.stats.factoryWeeks} weeks, and installed on-site in under one.
            </p>
            <div className="mt-8 flex flex-wrap items-center gap-5">
              <QuoteCTA />
              <a
                href={telHref(phone)}
                className="font-display text-base font-semibold text-white transition-colors hover:text-brand-400"
              >
                Call {formatPhone(phone)}
              </a>
            </div>
          </Reveal>
        </div>
      </section>

      {/* Unique local intro (CMS richText) */}
      {area.intro ? (
        <section className="bg-white">
          <div className="eb-container py-16 md:py-20">
            <Reveal>
              <SectionHeading align="left" eyebrow={`EazyBase in ${area.name}`}>
                Why {area.name} homeowners choose modular
              </SectionHeading>
              <div
                data-eb-edit-rich={`areas:${area.id}:intro`}
                className="mt-8 max-w-3xl space-y-5 text-base leading-relaxed text-ink-600 sm:text-lg [&_a]:font-semibold [&_a]:text-brand-700 [&_a]:underline [&_strong]:font-semibold [&_strong]:text-ink-800"
              >
                <RichText data={area.intro} />
              </div>
            </Reveal>
          </div>
        </section>
      ) : null}

      {/* Local angles — alternating image/text */}
      {angles.length > 0 ? (
        <section className="bg-ink-50">
          <div className="eb-container py-16 md:py-24">
            <Reveal>
              <SectionHeading eyebrow="Local knowledge" className="mb-12 md:mb-16">
                Built for {area.name} homes
              </SectionHeading>
            </Reveal>
            <LocalAngles areaId={area.id} angles={angles} images={rotated} />
          </div>
        </section>
      ) : null}

      {/* ORDER process strip + phone/WhatsApp */}
      <section className="bg-ink-900">
        <div className="eb-container flex flex-col items-start gap-6 py-12 md:flex-row md:items-center md:justify-between md:py-14">
          <div className="max-w-xl">
            <h2 className="font-display text-xl font-semibold text-white sm:text-2xl">
              Every {area.name} project follows our {ORDER_STEPS.length}-step ORDER process
            </h2>
            <p className="mt-2 text-sm leading-relaxed text-ink-300 sm:text-base">
              From discovery call to final quality check — one team, one plan, no surprises.{' '}
              <Link
                href="/what-we-do#process"
                className="font-semibold text-brand-400 transition-colors hover:text-brand-300"
              >
                See how it works →
              </Link>
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-4">
            <a
              href={telHref(phone)}
              className="eb-btn border-2 border-white text-white transition-colors hover:bg-white hover:text-ink-900"
            >
              Call {formatPhone(phone)}
            </a>
            <a href={whatsappHref} target="_blank" rel="noopener noreferrer" className="eb-btn-primary">
              WhatsApp us
            </a>
          </div>
        </div>
      </section>

      {/* Testimonials */}
      {picked.length > 0 ? (
        <section className="bg-white">
          <div className="eb-container py-16 md:py-20">
            <Reveal>
              <SectionHeading eyebrow="What customers say" className="mb-10 md:mb-12">
                Trusted from first sketch to final fix
              </SectionHeading>
            </Reveal>
            <AreaTestimonials testimonials={picked} />
          </div>
        </section>
      ) : null}

      {/* Local FAQs */}
      {faqs.length > 0 ? (
        <section className="bg-ink-50">
          <div className="eb-container py-16 md:py-20">
            <Reveal>
              <SectionHeading eyebrow="Good to know" className="mb-10 md:mb-12">
                {area.name} questions, answered
              </SectionHeading>
            </Reveal>
            <div className="mx-auto max-w-3xl">
              <FAQAccordion
                items={faqs.map((faq, i) => ({
                  id: faq.id ?? i,
                  question: faq.q,
                  answer: faq.a,
                  questionEdit: `areas:${area.id}:faqs.${i}.q`,
                  answerEdit: `areas:${area.id}:faqs.${i}.a`,
                }))}
              />
            </div>
          </div>
        </section>
      ) : null}

      <CTABand
        heading={`Ready to extend your ${area.name} home?`}
        sub={
          <>
            Get a free, no-obligation quote — or{' '}
            <a
              href={whatsappHref}
              target="_blank"
              rel="noopener noreferrer"
              className="font-semibold text-white underline underline-offset-4 transition-colors hover:text-ink-900"
            >
              message us on WhatsApp
            </a>
            .
          </>
        }
      />
    </>
  )
}
