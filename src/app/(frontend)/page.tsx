/**
 * Home — the site's showpiece. Composition:
 * Hero + StatsBar → award trust strip → "Hire EazyBase" intro → use-case tabs
 * → statement intro + Build Story (pinned scroll-scrubbed 5-phase narrative)
 * → featured testimonials → gallery teaser → parallax break → CTA band. All copy is read from the seeded CMS home page
 * and carries data-eb-edit attributes for the visual editor.
 */

import type { Metadata } from 'next'
import React from 'react'

import { Hero } from '@/components/hero/Hero'
import { StatsBar } from '@/components/hero/StatsBar'
import { AwardStrip } from '@/components/home/AwardStrip'
import { FacilityShowcase } from '@/components/home/FacilityShowcase'
import { GalleryTeaser } from '@/components/home/GalleryTeaser'
import { HomeIntro } from '@/components/home/HomeIntro'
import { BuildStory } from '@/components/home/build-story/BuildStory'
import { StatementIntro } from '@/components/home/build-story/StatementIntro'
import { TestimonialStrip } from '@/components/home/TestimonialStrip'
import { UseCaseTabs, type UseCaseTab } from '@/components/home/UseCaseTabs'
import { galleryImage, mediaURL, pickByAlt, resolveMedia } from '@/components/home/media'
import { getFeaturedAward } from '@/components/home/queries'
import { CTABand } from '@/components/ui/CTABand'
import { Reveal } from '@/components/ui/Reveal'
import { SectionHeading } from '@/components/ui/SectionHeading'
import { ParallaxSection } from '@/components/ui/ParallaxSection'
import { getGalleryItems, getPage, getTestimonials } from '@/lib/data'
import { jsonLdScript, organization, website } from '@/lib/jsonld'
import type { Page } from '@/payload-types'

type Section = NonNullable<Page['sections']>[number]

/** First block of a given type plus its index (for data-eb-edit field paths). */
function findBlock<T extends Section['blockType']>(
  sections: Section[],
  type: T,
): { block: Extract<Section, { blockType: T }>; index: number } | null {
  const index = sections.findIndex((section) => section.blockType === type)
  if (index === -1) return null
  return { block: sections[index] as Extract<Section, { blockType: T }>, index }
}

/** Real project photo for each use-case tab, matched from seeded gallery alts. */
const TAB_IMAGE_KEYWORDS: Record<string, string> = {
  Playrooms: 'furnished living room',
  'Home Office': 'white garden room',
  'Dining Rooms': 'flagship',
  Kitchens: 'flooding',
}

export async function generateMetadata(): Promise<Metadata> {
  const page = await getPage('home')
  return {
    // Seeded metaTitles already carry "| EazyBase" — absolute avoids the
    // layout template doubling the suffix.
    title: { absolute: page?.seo?.metaTitle ?? 'Modular Home Extensions | EazyBase' },
    description:
      page?.seo?.metaDescription ??
      'Award-winning prefab modular home extensions — factory-built in Blackburn in as little as 4 weeks, installed on-site in under a week.',
    alternates: { canonical: '/' },
  }
}

export default async function HomePage() {
  const [page, testimonials, galleryItems, award] = await Promise.all([
    getPage('home'),
    getTestimonials(),
    getGalleryItems(),
    getFeaturedAward(),
  ])

  const sections: Section[] = page?.sections ?? []
  const editBase = (index: number) => `pages:${page?.id}:sections.${index}`

  const intro = findBlock(sections, 'richText')
  const useCases = findBlock(sections, 'useCaseTabs')
  const process = findBlock(sections, 'processTimeline')
  const galleryStrip = findBlock(sections, 'galleryStrip')
  const testimonialStrip = findBlock(sections, 'testimonialStrip')
  const awardBadge = findBlock(sections, 'awardBadge')
  const ctaBand = findBlock(sections, 'ctaBand')

  // Photography picks (all real project photos, seeded with verified alt text)
  const introImage = galleryImage(
    pickByAlt(galleryItems, 'full-width bifold') ?? galleryItems[0] ?? null,
  )
  const exteriors = galleryItems.filter((item) => item.category === 'exterior')
  const parallaxItem = pickByAlt(galleryItems, 'photographed at dusk') ?? exteriors[0] ?? null
  const parallaxImage = parallaxItem
    ? (mediaURL(resolveMedia(parallaxItem.image), 'hero') ?? null)
    : null

  const featuredTestimonials = (
    testimonials.some((t) => t.featured) ? testimonials.filter((t) => t.featured) : testimonials
  ).slice(0, 3)

  const tabs: UseCaseTab[] =
    useCases?.block.tabs?.map((tab, i) => {
      // Prefer an image set on the tab in the CMS; fall back to a keyword-matched
      // gallery photo so the seeded (image-less) tabs still get real photography.
      const tabMedia = resolveMedia(tab.image)
      const tabImageURL = mediaURL(tabMedia, 'card')
      const keyword = TAB_IMAGE_KEYWORDS[tab.label]
      const matched = keyword ? pickByAlt(galleryItems, keyword) : null
      return {
        label: tab.label,
        heading: tab.heading,
        body: tab.body,
        image: tabImageURL
          ? { url: tabImageURL, alt: tabMedia?.alt ?? tab.heading }
          : galleryImage(matched),
        editBase: useCases ? `${editBase(useCases.index)}.tabs.${i}` : undefined,
      }
    }) ?? []

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: jsonLdScript(organization(), website()) }}
      />

      {/* 1 — Signature hero + stats (the only hero-level animation on the site) */}
      <Hero
        heading={page?.heroHeading ?? undefined}
        sub={page?.heroSub ?? undefined}
        editHeading={page ? `pages:${page.id}:heroHeading` : undefined}
        editSub={page ? `pages:${page.id}:heroSub` : undefined}
      />
      <StatsBar />

      {/* 2 — Award trust signal, near the fold */}
      <AwardStrip
        award={award}
        heading={awardBadge?.block.heading}
        headingEdit={awardBadge ? `${editBase(awardBadge.index)}.heading` : undefined}
      />

      {/* 3 — "Hire EazyBase" intro with a real project photo */}
      {intro ? (
        <HomeIntro block={intro.block} editBase={editBase(intro.index)} image={introImage} />
      ) : null}

      {/* 3.5 — HQ + fleet credibility band */}
      <FacilityShowcase />

      {/* 4 — Use cases: Kids Playrooms / Home Office / Dining Rooms / Kitchens */}
      {tabs.length > 0 ? (
        <section id="use-cases" className="scroll-mt-24 bg-ink-50">
          <div className="eb-container py-16 md:py-24">
            <Reveal>
              <SectionHeading
                eyebrow="Use cases"
                lede="Four of the most popular ways homeowners put their new space to work."
              >
                <span data-eb-edit={useCases ? `${editBase(useCases.index)}.heading` : undefined}>
                  {useCases?.block.heading ?? 'One extension, endless uses'}
                </span>
              </SectionHeading>
            </Reveal>
            <div className="mt-12">
              <UseCaseTabs tabs={tabs} />
            </div>
          </div>
        </section>
      ) : null}

      {/* 5 — Build Story: statement title card + the pinned scroll-scrubbed
             five-phase build narrative (the site's scroll signature) */}
      {process ? (
        <>
          <StatementIntro />
          <BuildStory block={process.block} editBase={editBase(process.index)} />
        </>
      ) : null}

      {/* 6 — Featured testimonials */}
      <TestimonialStrip
        heading={testimonialStrip?.block.heading}
        headingEdit={testimonialStrip ? `${editBase(testimonialStrip.index)}.heading` : undefined}
        testimonials={featuredTestimonials}
      />

      {/* 7 — Gallery teaser */}
      <GalleryTeaser
        heading={galleryStrip?.block.heading}
        headingEdit={galleryStrip ? `${editBase(galleryStrip.index)}.heading` : undefined}
        items={exteriors.length >= 6 ? exteriors : galleryItems}
      />

      {/* 8 — Full-bleed break with one-line value proposition */}
      {parallaxImage ? (
        <ParallaxSection src={parallaxImage} heightClassName="min-h-[45vh] md:min-h-[55vh]">
          <div className="mx-auto max-w-3xl text-center">
            <p className="flex items-center justify-center gap-3 font-display text-xs font-semibold tracking-[0.2em] text-brand-400 uppercase">
              <span className="eb-block-accent" aria-hidden="true" />
              Factory-built in Blackburn
            </p>
            <p className="mt-5 font-display text-2xl leading-snug font-semibold text-white sm:text-3xl">
              Designed with you, built in our factory and installed at your home in days — not
              months.
            </p>
          </div>
        </ParallaxSection>
      ) : null}

      {/* 9 — Conversion band */}
      <CTABand
        heading={
          ctaBand ? (
            <span data-eb-edit={`${editBase(ctaBand.index)}.heading`}>{ctaBand.block.heading}</span>
          ) : undefined
        }
        sub={
          ctaBand?.block.body ? (
            <span data-eb-edit={`${editBase(ctaBand.index)}.body`}>{ctaBand.block.body}</span>
          ) : undefined
        }
        quoteHref={ctaBand?.block.buttonHref ?? '/get-a-quote'}
        quoteLabel={ctaBand?.block.buttonLabel ?? 'Get A Quote'}
      />
    </>
  )
}
