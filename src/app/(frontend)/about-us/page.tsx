import type { Metadata } from 'next'
import Image from 'next/image'
import Link from 'next/link'
import { RichText } from '@payloadcms/richtext-lexical/react'
import type { ReactNode } from 'react'

import { AnimatedCounter } from '@/components/ui/AnimatedCounter'
import { CTABand } from '@/components/ui/CTABand'
import { Reveal } from '@/components/ui/Reveal'
import { SectionHeading } from '@/components/ui/SectionHeading'
import { getGalleryItems, getPage } from '@/lib/data'
import { SITE } from '@/lib/site'
import type {
  CtaBandBlock,
  GalleryItem,
  ImageTextBlock,
  Media,
  RichTextBlock,
  StatsCountersBlock,
} from '@/payload-types'

export async function generateMetadata(): Promise<Metadata> {
  const page = await getPage('about-us')
  return {
    // Seeded metaTitles already carry "| EazyBase" — absolute avoids the
    // layout template doubling the suffix.
    title: { absolute: page?.seo?.metaTitle ?? 'About Us | EazyBase Modular Home Extensions' },
    description:
      page?.seo?.metaDescription ??
      'Meet EazyBase — experienced, fully insured and highly trained. We design, factory-build and install quality modular home extensions at affordable prices.',
    alternates: { canonical: '/about-us' },
  }
}

/* ------------------------------------------------------------------ helpers */

function mediaUrl(media: number | Media | null | undefined): string | null {
  if (!media || typeof media !== 'object') return null
  return media.sizes?.card?.url ?? media.url ?? null
}

function galleryImage(item: GalleryItem): { url: string; alt: string } | null {
  const url = mediaUrl(item.image)
  return url ? { url, alt: item.alt } : null
}

/* -------------------------------------------------- capability badge icons */
/**
 * Eight simple inline icons, one per capability badge. Shared language:
 * 32×32 viewBox, 2px round strokes in the current ink colour, and a single
 * brand-green angled block (the logo's 18°-skewed module) as the accent.
 */
const iconProps = {
  viewBox: '0 0 32 32',
  fill: 'none',
  stroke: 'currentColor',
  strokeWidth: 2,
  strokeLinecap: 'round',
  strokeLinejoin: 'round',
  'aria-hidden': true,
} as const

const BADGES: { label: string; blurb: string; icon: ReactNode }[] = [
  {
    label: 'Professional',
    blurb: 'One accountable team from survey to sign-off.',
    icon: (
      <svg {...iconProps}>
        <rect x="6" y="11" width="20" height="14" rx="2" />
        <path d="M12 11V8h8v3" />
        <polygon points="14,16.5 20,16.5 18.5,21 12.5,21" className="fill-brand-500" stroke="none" />
      </svg>
    ),
  },
  {
    label: 'Free Surveys',
    blurb: 'A no-obligation survey before every project.',
    icon: (
      <svg {...iconProps}>
        <rect x="8" y="6" width="16" height="21" rx="2" />
        <path d="M13 6V4h6v2" />
        <path d="M12 13h8M12 17h8" />
        <polygon points="12.5,20.5 17,20.5 15.5,24.5 11,24.5" className="fill-brand-500" stroke="none" />
      </svg>
    ),
  },
  {
    label: 'Experienced',
    blurb: 'Decades of hands-on construction know-how.',
    icon: (
      <svg {...iconProps}>
        <polygon points="10,7 24,7 22,12 8,12" />
        <polygon points="9,14 23,14 21,19 7,19" className="fill-brand-500" stroke="none" />
        <polygon points="8,21 22,21 20,26 6,26" />
      </svg>
    ),
  },
  {
    label: 'Highly Trained',
    blurb: 'Skilled, certified specialists in every trade.',
    icon: (
      <svg {...iconProps}>
        <polygon points="16,6 28,11 16,16 4,11" className="fill-brand-500" stroke="none" />
        <path d="M10 14.5v4.5c0 1.5 3 2.8 6 2.8s6-1.3 6-2.8v-4.5" />
        <path d="M28 11v6" />
      </svg>
    ),
  },
  {
    label: 'Fully Insured',
    blurb: 'Comprehensive cover on projects of any size.',
    icon: (
      <svg {...iconProps}>
        <path d="M16 5l10 3.5V15c0 6.5-4.5 10-10 12-5.5-2-10-5.5-10-12V8.5L16 5z" />
        <path d="M11.5 15.5l3.5 3.5 6-7" className="stroke-brand-500" strokeWidth={2.4} />
      </svg>
    ),
  },
  {
    label: 'Health & Safety',
    blurb: 'Rigorous standards in the factory and on site.',
    icon: (
      <svg {...iconProps}>
        <path d="M8 21c0-8 3.5-12 8-12s8 4 8 12" />
        <path d="M5 21.5h22" />
        <polygon points="13.5,14.5 18.5,14.5 17,18.5 12,18.5" className="fill-brand-500" stroke="none" />
      </svg>
    ),
  },
  {
    label: 'Manufacturers',
    blurb: 'We build your extension in our own factory.',
    icon: (
      <svg {...iconProps}>
        <path d="M5 26V12l7 5v-5l7 5v-5l8 5.5V26H5z" />
        <polygon points="13,20.5 18,20.5 16.5,26 11.5,26" className="fill-brand-500" stroke="none" />
      </svg>
    ),
  },
  {
    label: 'Fully Certified',
    blurb: 'Building control sign-off on every install.',
    icon: (
      <svg {...iconProps}>
        <circle cx="16" cy="13" r="7.5" />
        <path d="M13 13l2.2 2.2 4-4.5" />
        <polygon points="11,20.5 15,22 13,27.5 9,26" />
        <polygon points="17,22 21,20.5 23,26 19,27.5" className="fill-brand-500" stroke="none" />
      </svg>
    ),
  },
]

/** Preferred order for the example-layouts grid — a mix of finished exteriors and interiors. */
const LAYOUT_GRID_FILES = [
  'EZB-_0001',
  'Photo-17-11-2021-11-58-25',
  'Set1_0002_IMG_5467',
  'Photo-04-10-2021-08-44-41',
  'Photo-14-11-2022-14-51-28',
  'Photo-17-11-2021-11-53-21',
  'Photo-29-11-2021-13-59-11',
  'Photo-13-11-2022-15-00-29',
]

/* --------------------------------------------------------------------- page */

export default async function AboutUsPage() {
  const [page, galleryItems] = await Promise.all([getPage('about-us'), getGalleryItems()])

  const sections = page?.sections ?? []
  const richTextIdx = sections.findIndex((s) => s.blockType === 'richText')
  const richTextBlock = (sections[richTextIdx] ?? null) as RichTextBlock | null
  const imageTextIdx = sections.findIndex((s) => s.blockType === 'imageText')
  const imageTextBlock = (sections[imageTextIdx] ?? null) as ImageTextBlock | null
  const statsIdx = sections.findIndex((s) => s.blockType === 'statsCounters')
  const statsBlock = (sections[statsIdx] ?? null) as StatsCountersBlock | null
  const ctaIdx = sections.findIndex((s) => s.blockType === 'ctaBand')
  const ctaBlock = (sections[ctaIdx] ?? null) as CtaBandBlock | null

  const edit = (fieldPath: string) =>
    page ? { 'data-eb-edit': `pages:${page.id}:${fieldPath}` } : {}

  // Example-layouts grid: preferred picks first, topped up from the rest.
  const byFile = (needle: string) =>
    galleryItems.find(
      (item) =>
        typeof item.image === 'object' && item.image?.filename?.startsWith(needle),
    )
  const preferred = LAYOUT_GRID_FILES.map(byFile).filter((i): i is GalleryItem => Boolean(i))
  const picks = [
    ...preferred,
    ...galleryItems.filter((i) => !preferred.includes(i) && i.category !== 'build-progress'),
  ].slice(0, 9)
  const flagship = picks[0] ?? null
  const layoutItems = picks.slice(1)

  const teamImageUrl = mediaUrl(imageTextBlock?.image)

  return (
    <>
      {/* Hero band — static inner-page hero (the animated hero lives on home only) */}
      <section className="relative overflow-hidden bg-ink-950 pt-18">
        <div
          aria-hidden="true"
          className="absolute -top-10 -right-20 h-72 w-72 -skew-x-[18deg] bg-brand-500/10"
        />
        <div
          aria-hidden="true"
          className="absolute -bottom-24 -left-16 h-56 w-56 -skew-x-[18deg] bg-white/[0.03]"
        />
        <div className="eb-container relative py-16 sm:py-20">
          <Reveal>
            <p className="mb-3 flex items-center gap-2.5 font-display text-xs font-semibold tracking-[0.2em] text-brand-400 uppercase">
              <span className="eb-block-accent h-2.5 w-4" aria-hidden="true" />
              About Us
            </p>
            <h1 className="max-w-2xl text-4xl font-semibold text-white sm:text-5xl">
              <span {...edit('heroHeading')}>{page?.heroHeading ?? 'About EazyBase'}</span>
            </h1>
            {page?.heroSub ? (
              <p className="mt-4 max-w-xl text-lg text-ink-300">
                <span {...edit('heroSub')}>{page.heroSub}</span>
              </p>
            ) : null}
          </Reveal>
        </div>
      </section>

      {/* About copy (CMS richText) */}
      <section className="py-16 sm:py-24">
        <div className="eb-container">
          <div className="grid items-start gap-12 lg:grid-cols-[7fr_5fr]">
            <Reveal>
              <SectionHeading
                eyebrow={richTextBlock?.eyebrow || 'Who we are'}
                eyebrowEdit={page ? `pages:${page.id}:sections.${richTextIdx}.eyebrow` : undefined}
                align="left"
                className="mb-6"
              >
                {richTextBlock?.heading ? (
                  <span {...edit(`sections.${richTextIdx}.heading`)}>{richTextBlock.heading}</span>
                ) : (
                  'Your trusted modular construction team'
                )}
              </SectionHeading>
              {richTextBlock ? (
                <div
                  className="space-y-4 leading-relaxed text-ink-600 sm:text-lg"
                  data-eb-edit-rich={page ? `pages:${page.id}:sections.${richTextIdx}.content` : undefined}
                >
                  <RichText data={richTextBlock.content} />
                </div>
              ) : (
                <div className="space-y-4 leading-relaxed text-ink-600 sm:text-lg">
                  <p>
                    EazyBase Extensions are your trusted nationwide modular construction team, with
                    vast experience across skylights, windows, doors and roofing systems. Our
                    specialist electricians fit everything from standard fixtures to the smart
                    technology more and more homeowners ask for.
                  </p>
                  <p>
                    Our roofing team keeps your extension watertight — flat, pitched or hipped, the
                    same skill and care goes into every job, backed by a structural guarantee of up
                    to 20 years.
                  </p>
                </div>
              )}
            </Reveal>

            {/* Flagship shot alongside the copy */}
            {flagship && galleryImage(flagship) ? (
              <Reveal delay={0.15}>
                <figure className="relative">
                  <div
                    aria-hidden="true"
                    className="absolute -top-4 -left-4 h-20 w-20 -skew-x-[18deg] bg-brand-500/20"
                  />
                  <div
                    data-eb-edit-media={`gallery-items:${flagship.id}:image`}
                    className="relative aspect-[4/3] overflow-hidden rounded-lg shadow-xl shadow-ink-900/10"
                  >
                    <Image
                      src={galleryImage(flagship)!.url}
                      alt={galleryImage(flagship)!.alt}
                      fill
                      sizes="(min-width: 1024px) 40vw, 90vw"
                      className="object-cover"
                    />
                  </div>
                  {flagship.caption ? (
                    <figcaption className="mt-3 text-sm text-ink-400">{flagship.caption}</figcaption>
                  ) : null}
                </figure>
              </Reveal>
            ) : null}
          </div>
        </div>
      </section>

      {/* Capability badges — the 8 trust claims as an icon grid */}
      <section className="bg-ink-50 py-16 sm:py-24">
        <div className="eb-container">
          <Reveal>
            <SectionHeading
              eyebrow="Why EazyBase"
              lede="Eight reasons homeowners across the North West and London trust us with their extensions."
            >
              Built on solid foundations
            </SectionHeading>
          </Reveal>
          <ul className="mt-12 grid grid-cols-2 gap-4 sm:gap-6 lg:grid-cols-4">
            {BADGES.map((badge, i) => (
              <li key={badge.label}>
                <Reveal delay={(i % 4) * 0.08} className="h-full">
                  <div className="h-full rounded-lg border border-ink-100 bg-white p-6 text-center shadow-sm">
                    <span className="mx-auto mb-4 block h-10 w-10 text-ink-700 sm:h-12 sm:w-12">
                      {badge.icon}
                    </span>
                    <h3 className="font-display text-sm font-semibold tracking-wide text-ink-900 uppercase">
                      {badge.label}
                    </h3>
                    <p className="mt-2 text-sm leading-relaxed text-ink-500">{badge.blurb}</p>
                  </div>
                </Reveal>
              </li>
            ))}
          </ul>
        </div>
      </section>

      {/* Team image + trust copy (CMS imageText) */}
      {imageTextBlock ? (
        <section className="py-16 sm:py-24">
          <div className="eb-container">
            <div className="grid items-center gap-12 lg:grid-cols-2">
              <Reveal className={imageTextBlock.imageSide === 'right' ? 'lg:order-1' : 'lg:order-2'}>
                <SectionHeading
                  eyebrow={imageTextBlock.eyebrow || 'The team'}
                  eyebrowEdit={page ? `pages:${page.id}:sections.${imageTextIdx}.eyebrow` : undefined}
                  align="left"
                  className="mb-6"
                >
                  {imageTextBlock.heading ? (
                    <span {...edit(`sections.${imageTextIdx}.heading`)}>{imageTextBlock.heading}</span>
                  ) : (
                    'A team you can trust in your home'
                  )}
                </SectionHeading>
                {imageTextBlock.body ? (
                  <div
                    className="space-y-4 leading-relaxed text-ink-600 sm:text-lg"
                    data-eb-edit-rich={page ? `pages:${page.id}:sections.${imageTextIdx}.body` : undefined}
                  >
                    <RichText data={imageTextBlock.body} />
                  </div>
                ) : null}
              </Reveal>
              {teamImageUrl ? (
                <Reveal
                  delay={0.15}
                  className={imageTextBlock.imageSide === 'right' ? 'lg:order-2' : 'lg:order-1'}
                >
                  <div
                    data-eb-edit-media={page ? `pages:${page.id}:sections.${imageTextIdx}.image` : undefined}
                    className="relative aspect-[4/3] overflow-hidden rounded-lg shadow-xl shadow-ink-900/10"
                  >
                    <Image
                      src={teamImageUrl}
                      alt={
                        typeof imageTextBlock.image === 'object' && imageTextBlock.image?.alt
                          ? imageTextBlock.image.alt
                          : 'The EazyBase team'
                      }
                      fill
                      sizes="(min-width: 1024px) 45vw, 90vw"
                      className="object-cover"
                    />
                  </div>
                </Reveal>
              ) : null}
            </div>
          </div>
        </section>
      ) : null}

      {/* Trust band — guarantee + experience lines with stats counters */}
      <section className="relative overflow-hidden bg-ink-900 py-16 sm:py-20">
        <div
          aria-hidden="true"
          className="absolute top-0 -right-24 h-full w-64 -skew-x-[18deg] bg-brand-500/[0.07]"
        />
        <div className="eb-container relative">
          <Reveal>
            <SectionHeading
              eyebrow={statsBlock?.eyebrow || 'Trust, built in'}
              eyebrowEdit={page ? `pages:${page.id}:sections.${statsIdx}.eyebrow` : undefined}
              onDark
              lede={
                statsBlock?.lede ||
                'Decades of experience are behind every survey, every panel and every handover — with a structural guarantee of up to 20 years on top.'
              }
              ledeEdit={page ? `pages:${page.id}:sections.${statsIdx}.lede` : undefined}
            >
              {statsBlock?.heading ? (
                <span {...edit(`sections.${statsIdx}.heading`)}>{statsBlock.heading}</span>
              ) : (
                'Factory-built speed, without the compromise'
              )}
            </SectionHeading>
          </Reveal>
          <dl className="mt-12 grid gap-10 text-center sm:grid-cols-3">
            {(statsBlock?.stats ?? []).map((stat, i) => (
              <Reveal key={stat.id ?? stat.label} delay={i * 0.1} className="flex flex-col">
                <dt className="order-2 mt-2 font-display text-xs font-semibold tracking-[0.18em] text-ink-300 uppercase">
                  <span {...edit(`sections.${statsIdx}.stats.${i}.label`)}>{stat.label}</span>
                </dt>
                <dd className="order-1">
                  <AnimatedCounter
                    value={stat.value}
                    suffix={stat.suffix ?? ''}
                    className="font-display text-5xl font-bold text-brand-400 sm:text-6xl"
                  />
                </dd>
              </Reveal>
            ))}
          </dl>
        </div>
      </section>

      {/* Example build layouts — seeded gallery media */}
      <section className="py-16 sm:py-24">
        <div className="eb-container">
          <Reveal>
            <SectionHeading
              eyebrow="Our work"
              lede="A few of the layouts and finishes we have designed, factory-built and installed for homeowners like you."
            >
              Example build layouts
            </SectionHeading>
          </Reveal>
          <div className="mt-12 grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4">
            {layoutItems.map((item, i) => {
              const img = galleryImage(item)
              if (!img) return null
              return (
                <Reveal key={item.id} delay={(i % 4) * 0.08}>
                  <div className="group relative aspect-square overflow-hidden rounded-lg">
                    <Image
                      src={img.url}
                      alt={img.alt}
                      fill
                      sizes="(min-width: 1024px) 25vw, 50vw"
                      className="object-cover transition-transform duration-500 [transition-timing-function:var(--ease-out-expo)] group-hover:scale-105"
                    />
                  </div>
                </Reveal>
              )
            })}
          </div>
          <p className="mt-8 text-center text-ink-500">
            Want more?{' '}
            <Link
              href="/gallery"
              className="font-semibold text-brand-600 underline-offset-4 hover:underline"
            >
              Browse the full project gallery
            </Link>{' '}
            — including build-progress shots from our {SITE.base.split(',')[0]} factory.
          </p>
        </div>
      </section>

      {/* Conversion band (CMS ctaBand) */}
      <CTABand
        heading={
          ctaBlock ? (
            <span {...edit(`sections.${ctaIdx}.heading`)}>{ctaBlock.heading}</span>
          ) : (
            'Talk to the team today'
          )
        }
        sub={
          ctaBlock?.body ? (
            <span {...edit(`sections.${ctaIdx}.body`)}>{ctaBlock.body}</span>
          ) : undefined
        }
        quoteHref="/get-a-quote"
        quoteLabel={ctaBlock?.buttonLabel ?? 'Get A Quote'}
      />
    </>
  )
}
