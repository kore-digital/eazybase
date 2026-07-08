import type { Metadata } from 'next'
import Image from 'next/image'
import Link from 'next/link'
import { RichText } from '@payloadcms/richtext-lexical/react'

import { ProcessTimeline, type ProcessTimelineStep } from '@/components/process/ProcessTimeline'
import { AnimatedCounter } from '@/components/ui/AnimatedCounter'
import { CTABand } from '@/components/ui/CTABand'
import { Reveal } from '@/components/ui/Reveal'
import { SectionHeading } from '@/components/ui/SectionHeading'
import { getGalleryItems, getPage } from '@/lib/data'
import { ORDER_STEPS } from '@/lib/site'
import type {
  CtaBandBlock,
  GalleryItem,
  GalleryStripBlock,
  Media,
  ProcessTimelineBlock,
  RichTextBlock,
  StatsCountersBlock,
} from '@/payload-types'

export async function generateMetadata(): Promise<Metadata> {
  const page = await getPage('what-we-do')
  return {
    // Seeded metaTitles already carry "| EazyBase" — absolute avoids the
    // layout template doubling the suffix.
    title: { absolute: page?.seo?.metaTitle ?? 'What We Do | EazyBase Modular Home Extensions' },
    description:
      page?.seo?.metaDescription ??
      'How EazyBase works: free 3D design visual, factory build in as little as 4 weeks, and on-site installation in under a week — whatever the weather.',
    alternates: { canonical: '/what-we-do' },
  }
}

/* ------------------------------------------------------------------ helpers */

function mediaUrl(media: number | Media | null | undefined): string | null {
  if (!media || typeof media !== 'object') return null
  return media.sizes?.card?.url ?? media.url ?? null
}

/**
 * Fallback 5-step copy — the old home slider (audit §5), tightened. Used only
 * if the home page's seeded processTimeline block cannot be found.
 */
const FALLBACK_STEPS: { title: string; body: string }[] = [
  {
    title: 'Concept',
    body: 'We map out your design after an in-depth consultation to find the modular extension best suited to your home.',
  },
  {
    title: 'Design',
    body: 'We plan the design of your extension in detail. It is fully signed off by you before the build, to the agreed specification.',
  },
  {
    title: 'Build',
    body: 'We build your extension from the ground up to our architects’ specification using only the best materials — foundations, brickwork and roof-line.',
  },
  {
    title: 'Interior',
    body: 'We carry out all the interior work too: plastering, doors, flooring, ceilings, electrics and much more. EazyBase is the one-stop shop for modular home extensions.',
  },
  {
    title: 'Completion',
    body: 'Before handover we complete a full snagging checklist — an experienced engineer checks for any imperfections so we can put them right before completion.',
  },
]

/** Per-step photo picks from the seeded gallery (matched by media filename prefix). */
const STEP_PHOTO_FILES = [
  'Set2_0006_IMG_0608', // Concept — team consultation on site
  'EZB-_0001', // Design — the finished vision: roof lantern, media wall, dining area
  'Set1_0005_IMG_5433', // Build — insulation fitted during factory build
  'Photo-08-08-2021-17-31-45', // Interior — freshly plastered, ready to decorate
  'Photo-22-03-2020-18-18-36', // Completion — the team with happy homeowners
]

/** Use-case cross-links back to the home page tabs + gallery. */
const USE_CASES = [
  { label: 'Kids Playrooms', href: '/#use-cases' },
  { label: 'Home Offices', href: '/#use-cases' },
  { label: 'Dining Rooms', href: '/#use-cases' },
  { label: 'Kitchens', href: '/#use-cases' },
  { label: 'See finished projects', href: '/gallery' },
]

/* --------------------------------------------------------------------- page */

export default async function WhatWeDoPage() {
  const [page, home, galleryItems] = await Promise.all([
    getPage('what-we-do'),
    getPage('home'),
    getGalleryItems(),
  ])

  const sections = page?.sections ?? []
  const richTextIdx = sections.findIndex((s) => s.blockType === 'richText')
  const richTextBlock = (sections[richTextIdx] ?? null) as RichTextBlock | null
  const orderIdx = sections.findIndex((s) => s.blockType === 'processTimeline')
  const orderBlock = (sections[orderIdx] ?? null) as ProcessTimelineBlock | null
  const statsIdx = sections.findIndex((s) => s.blockType === 'statsCounters')
  const statsBlock = (sections[statsIdx] ?? null) as StatsCountersBlock | null
  const stripIdx = sections.findIndex((s) => s.blockType === 'galleryStrip')
  const stripBlock = (sections[stripIdx] ?? null) as GalleryStripBlock | null
  const ctaIdx = sections.findIndex((s) => s.blockType === 'ctaBand')
  const ctaBlock = (sections[ctaIdx] ?? null) as CtaBandBlock | null

  const edit = (fieldPath: string) =>
    page ? { 'data-eb-edit': `pages:${page.id}:${fieldPath}` } : {}

  // The canonical 5-phase copy lives on the home page's processTimeline block —
  // reuse it here (single source of truth) and deep-link edits back to it.
  const homeSections = home?.sections ?? []
  const homeTimelineIdx = homeSections.findIndex(
    (s) => s.blockType === 'processTimeline' && (s.steps?.length ?? 0) === 5,
  )
  const homeTimeline = (homeSections[homeTimelineIdx] ?? null) as ProcessTimelineBlock | null

  const byFile = (needle: string): GalleryItem | undefined =>
    galleryItems.find(
      (item) => typeof item.image === 'object' && item.image?.filename?.startsWith(needle),
    )

  const timelineSteps: ProcessTimelineStep[] = (
    homeTimeline?.steps?.length
      ? homeTimeline.steps.map((step, i) => ({
          title: step.title,
          body: step.body,
          titleEdit: home
            ? `pages:${home.id}:sections.${homeTimelineIdx}.steps.${i}.title`
            : undefined,
          bodyEdit: home
            ? `pages:${home.id}:sections.${homeTimelineIdx}.steps.${i}.body`
            : undefined,
        }))
      : FALLBACK_STEPS
  ).map((step, i) => {
    const item = STEP_PHOTO_FILES[i] ? byFile(STEP_PHOTO_FILES[i]) : undefined
    const url = item ? mediaUrl(item.image) : null
    return { ...step, image: item && url ? { url, alt: item.alt } : null }
  })

  // Build-progress strip images (CMS galleryStrip block, category filter).
  const stripItems = galleryItems
    .filter((i) => i.category === (stripBlock?.category ?? 'build-progress'))
    .slice(0, 4)

  return (
    <>
      {/* Hero band — static inner-page hero */}
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
              Our Process
            </p>
            <h1 className="max-w-2xl text-4xl font-semibold text-white sm:text-5xl">
              <span {...edit('heroHeading')}>{page?.heroHeading ?? 'What We Do'}</span>
            </h1>
            {page?.heroSub ? (
              <p className="mt-4 max-w-xl text-lg text-ink-300">
                <span {...edit('heroSub')}>{page.heroSub}</span>
              </p>
            ) : null}
          </Reveal>
        </div>
      </section>

      {/* Intro (CMS richText) */}
      <section className="py-16 sm:py-24">
        <div className="eb-container">
          <Reveal>
            <SectionHeading
              eyebrow={richTextBlock?.eyebrow || 'What we do'}
              eyebrowEdit={page ? `pages:${page.id}:sections.${richTextIdx}.eyebrow` : undefined}
              align="left"
              className="mb-6 max-w-3xl"
            >
              {richTextBlock?.heading ? (
                <span {...edit(`sections.${richTextIdx}.heading`)}>{richTextBlock.heading}</span>
              ) : (
                'Modular extensions, from concept to completion'
              )}
            </SectionHeading>
            {richTextBlock ? (
              <div
                className="max-w-3xl space-y-4 leading-relaxed text-ink-600 sm:text-lg"
                data-eb-edit-rich={page ? `pages:${page.id}:sections.${richTextIdx}.content` : undefined}
              >
                <RichText data={richTextBlock.content} />
              </div>
            ) : (
              <div className="max-w-3xl space-y-4 leading-relaxed text-ink-600 sm:text-lg">
                <p>
                  EazyBase design, build and install modular extensions and outbuildings in a
                  fraction of the time of a traditional build. We start with a free consultation
                  and a free 3D visual of your design, so you can see exactly what you are getting
                  before a single panel is made.
                </p>
                <p>
                  Your extension is then manufactured in our factory, away from your home, in as
                  little as four weeks — unaffected by weather or site access. Finally we install
                  it on-site in under a week, complete with electrical sockets, LED downlights,
                  plastering and building control sign-off.
                </p>
              </div>
            )}
          </Reveal>
        </div>
      </section>

      {/* THE 5-step scroll-driven timeline — signature moment #2 */}
      <section id="process" className="scroll-mt-24 bg-ink-50 py-16 sm:py-24">
        <div className="eb-container">
          <Reveal>
            <SectionHeading
              eyebrow={page?.sectionCopy?.processEyebrow || 'The EazyBase way'}
              eyebrowEdit={page ? `pages:${page.id}:sectionCopy.processEyebrow` : undefined}
              lede={
                page?.sectionCopy?.processLede ||
                'Five phases take your extension from first sketch to final handover — most of it in our factory, not your garden.'
              }
              ledeEdit={page ? `pages:${page.id}:sectionCopy.processLede` : undefined}
            >
              <span data-eb-edit={page ? `pages:${page.id}:sectionCopy.processHeading` : undefined}>
                {page?.sectionCopy?.processHeading || 'Concept to completion, in five steps'}
              </span>
            </SectionHeading>
          </Reveal>
          <ProcessTimeline steps={timelineSteps} className="mx-auto mt-16 max-w-5xl" />
        </div>
      </section>

      {/* The 8-step order journey — how ordering works, beneath the 5 phases */}
      <section className="py-16 sm:py-24">
        <div className="eb-container">
          <Reveal>
            <SectionHeading
              eyebrow={orderBlock?.eyebrow || 'How ordering works'}
              eyebrowEdit={page ? `pages:${page.id}:sections.${orderIdx}.eyebrow` : undefined}
              lede={
                orderBlock?.lede ||
                'Within those five phases, your order moves through eight simple stages — and you will know exactly where it is at every one.'
              }
              ledeEdit={page ? `pages:${page.id}:sections.${orderIdx}.lede` : undefined}
            >
              {orderBlock?.heading ? (
                <span {...edit(`sections.${orderIdx}.heading`)}>{orderBlock.heading}</span>
              ) : (
                'Your order, step by step'
              )}
            </SectionHeading>
          </Reveal>
          <ol className="mx-auto mt-12 grid max-w-4xl grid-cols-2 gap-3 sm:gap-4 md:grid-cols-4">
            {(orderBlock?.steps?.length
              ? orderBlock.steps.map((s, j) => ({
                  title: s.title,
                  editAttr: edit(`sections.${orderIdx}.steps.${j}.title`),
                }))
              : ORDER_STEPS.map((title) => ({ title, editAttr: {} }))
            ).map((step, j) => (
              <li key={step.title}>
                <Reveal delay={(j % 4) * 0.07} className="h-full">
                  <div className="flex h-full items-center gap-3 rounded-lg border border-ink-100 bg-white p-4 shadow-sm">
                    <span
                      aria-hidden="true"
                      className="grid h-8 w-9 shrink-0 -skew-x-[18deg] place-items-center bg-brand-500/15 font-display text-sm font-bold text-brand-700"
                    >
                      <span className="skew-x-[18deg]">{String(j + 1).padStart(2, '0')}</span>
                    </span>
                    <span className="font-display text-sm font-semibold text-ink-800">
                      <span {...step.editAttr}>{step.title}</span>
                    </span>
                  </div>
                </Reveal>
              </li>
            ))}
          </ol>
        </div>
      </section>

      {/* Stats counters */}
      <section className="relative overflow-hidden bg-ink-900 py-16 sm:py-20">
        <div
          aria-hidden="true"
          className="absolute top-0 -right-24 h-full w-64 -skew-x-[18deg] bg-brand-500/[0.07]"
        />
        <div className="eb-container relative">
          <Reveal>
            <SectionHeading
              onDark
              eyebrow={statsBlock?.eyebrow || 'The numbers'}
              eyebrowEdit={page ? `pages:${page.id}:sections.${statsIdx}.eyebrow` : undefined}
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

      {/* From factory to finished — build-progress strip (CMS galleryStrip) */}
      {stripItems.length > 0 ? (
        <section className="py-16 sm:py-24">
          <div className="eb-container">
            <Reveal>
              <SectionHeading
                eyebrow={stripBlock?.eyebrow || 'Behind the scenes'}
                eyebrowEdit={page ? `pages:${page.id}:sections.${stripIdx}.eyebrow` : undefined}
                lede={stripBlock?.lede || 'Follow a build from insulated factory panels to a finished, plastered room.'}
                ledeEdit={page ? `pages:${page.id}:sections.${stripIdx}.lede` : undefined}
              >
                {stripBlock?.heading ? (
                  <span {...edit(`sections.${stripIdx}.heading`)}>{stripBlock.heading}</span>
                ) : (
                  'From factory to finished'
                )}
              </SectionHeading>
            </Reveal>
            <div className="mt-12 grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4">
              {stripItems.map((item, i) => {
                const url = mediaUrl(item.image)
                if (!url) return null
                return (
                  <Reveal key={item.id} delay={i * 0.08}>
                    <div className="group relative aspect-square overflow-hidden rounded-lg">
                      <Image
                        src={url}
                        alt={item.alt}
                        fill
                        sizes="(min-width: 1024px) 25vw, 50vw"
                        className="object-cover transition-transform duration-500 [transition-timing-function:var(--ease-out-expo)] group-hover:scale-105"
                      />
                    </div>
                  </Reveal>
                )
              })}
            </div>
          </div>
        </section>
      ) : null}

      {/* Use-case cross-links */}
      <section className="bg-ink-50 py-14 sm:py-16">
        <div className="eb-container text-center">
          <Reveal>
            <h2 className="text-2xl font-semibold text-ink-900 sm:text-3xl">
              What will you use yours for?
            </h2>
            <p className="mx-auto mt-3 max-w-xl text-ink-500">
              Playroom, office, dining room or kitchen — one extension, endless uses.
            </p>
            <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
              {USE_CASES.map((useCase) => (
                <Link
                  key={useCase.label}
                  href={useCase.href}
                  className="inline-flex items-center gap-2 rounded-md border border-ink-200 bg-white px-5 py-2.5 font-display text-sm font-semibold text-ink-800 transition-colors hover:border-brand-500 hover:text-brand-700"
                >
                  <span className="eb-block-accent h-2 w-3.5" aria-hidden="true" />
                  {useCase.label}
                </Link>
              ))}
            </div>
          </Reveal>
        </div>
      </section>

      {/* Conversion band (CMS ctaBand) */}
      <CTABand
        variant="green"
        heading={
          ctaBlock ? (
            <span {...edit(`sections.${ctaIdx}.heading`)}>{ctaBlock.heading}</span>
          ) : (
            'Start with a free discovery call'
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
