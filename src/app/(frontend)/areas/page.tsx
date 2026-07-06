import type { Metadata } from 'next'
import Link from 'next/link'

import { RegionPanel, type RegionTown } from '@/components/areas/RegionPanel'
import { CTABand } from '@/components/ui/CTABand'
import { QuoteCTA } from '@/components/ui/QuoteCTA'
import { Reveal } from '@/components/ui/Reveal'
import { SectionHeading } from '@/components/ui/SectionHeading'
import { getAllAreas } from '@/lib/data'
import { jsonLdScript, organization } from '@/lib/jsonld'
import { AREAS, SITE } from '@/lib/site'

export const metadata: Metadata = {
  title: 'Areas We Serve — North West & London',
  description:
    'Factory-built modular home extensions across the North West and London. Built in Blackburn in as little as four weeks, installed at your home in under one.',
  alternates: { canonical: '/areas' },
}

export default async function AreasPage() {
  const areas = await getAllAreas()

  // Order published CMS areas by the canonical AREAS list, then group by region.
  const orderOf = (slug: string) => {
    const i = AREAS.findIndex((a) => a.slug === slug)
    return i === -1 ? AREAS.length : i
  }
  const sorted = [...areas].sort((a, b) => orderOf(a.slug) - orderOf(b.slug))

  const towns = (region: 'north-west' | 'london'): RegionTown[] =>
    sorted
      .filter((a) => a.region === region && !a.isHub)
      .map((a) => ({ id: a.id, slug: a.slug, name: a.name, hook: a.seo?.metaDescription }))

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: jsonLdScript(organization()) }}
      />

      {/* Static hero band — simple fade, no hero-level animation off the home page */}
      <section className="bg-ink-950">
        <div className="eb-container py-16 md:py-24">
          <Reveal>
            <SectionHeading
              as="h1"
              align="left"
              onDark
              eyebrow="Where we work"
              lede="Every EazyBase extension starts life in our Blackburn factory, then travels to your home for an on-site installation measured in days, not months. Here's where we install."
            >
              Areas we serve
            </SectionHeading>
          </Reveal>
        </div>
      </section>

      {/* Region panels — every name is a link (no dead region text) */}
      <section className="bg-white">
        <div className="eb-container space-y-8 py-16 md:py-20">
          <RegionPanel
            title="The North West"
            blurb="Our home turf. With the factory in Blackburn, most North West installs are under an hour from where your extension is built."
            hubHref="/areas/north-west"
            hubLabel="Explore the North West hub"
            towns={towns('north-west')}
          />
          <RegionPanel
            title="London"
            blurb="Full design-to-installation service across north and west London — the module travels, the disruption doesn't."
            hubHref="/areas/london"
            hubLabel="Explore the London hub"
            towns={towns('london')}
          />
        </div>
      </section>

      {/* Factory-in-Blackburn callout */}
      <section className="bg-ink-900">
        <div className="eb-container py-16 md:py-20">
          <div className="grid items-center gap-10 md:grid-cols-[1.2fr_1fr]">
            <Reveal>
              <SectionHeading align="left" onDark eyebrow="One factory, one team">
                Built in Blackburn, installed at your door
              </SectionHeading>
              <p className="mt-4 max-w-xl text-base leading-relaxed text-ink-200">
                Wherever you live, your extension is precision-built indoors at our Lancashire
                factory in as little as {SITE.stats.factoryWeeks} weeks — protected from the
                weather, checked at every stage — then delivered and installed on-site in under a
                week. No months of scaffolding, skips and mud.
              </p>
              <div className="mt-8 flex flex-wrap items-center gap-4">
                <QuoteCTA />
                <Link
                  href="/areas/blackburn"
                  className="font-display text-sm font-semibold tracking-wide text-brand-400 transition-colors hover:text-brand-300"
                >
                  Extensions in Blackburn →
                </Link>
              </div>
            </Reveal>
            <Reveal delay={0.15}>
              <dl className="grid grid-cols-1 gap-4 sm:grid-cols-3 md:grid-cols-1">
                {[
                  { value: `${SITE.stats.factoryWeeks} weeks`, label: 'factory build' },
                  { value: 'Under 1 week', label: 'on-site installation' },
                  { value: `${SITE.stats.guaranteeYears}-year`, label: 'roofing guarantee' },
                ].map((stat) => (
                  <div key={stat.label} className="flex flex-col rounded-lg bg-ink-950 p-5">
                    <dt className="order-2 text-sm text-ink-300">{stat.label}</dt>
                    <dd className="order-1 font-display text-2xl font-semibold text-brand-400">
                      {stat.value}
                    </dd>
                  </div>
                ))}
              </dl>
            </Reveal>
          </div>
        </div>
      </section>

      <CTABand
        heading="Not sure if we cover your street?"
        sub="Call us or send your postcode with a quote request — if we can get a module to your door, we can extend your home."
      />
    </>
  )
}
