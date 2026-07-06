import type { Metadata } from 'next'

import type { GalleryImage } from '@/components/gallery/GalleryGrid'
import { GalleryGrid } from '@/components/gallery/GalleryGrid'
import { BeforeAfter } from '@/components/ui/BeforeAfter'
import { CTABand } from '@/components/ui/CTABand'
import { Reveal } from '@/components/ui/Reveal'
import { SectionHeading } from '@/components/ui/SectionHeading'
import { getGalleryItems, getPage } from '@/lib/data'
import type { GalleryItem, Media } from '@/payload-types'

const FALLBACK_TITLE = 'Our Project Gallery'
const FALLBACK_SUB = 'Real EazyBase projects — from factory build to finished extension.'
const FALLBACK_DESCRIPTION =
  'Browse real EazyBase projects: finished exteriors, bright interiors and behind-the-scenes build progress from our modular extension installs.'

export async function generateMetadata(): Promise<Metadata> {
  const page = await getPage('gallery')
  return {
    title: page?.seo?.metaTitle ? { absolute: page.seo.metaTitle } : FALLBACK_TITLE,
    description: page?.seo?.metaDescription ?? FALLBACK_DESCRIPTION,
    alternates: { canonical: '/gallery' },
  }
}

/** Depth-1 relationships arrive as objects; bare ids mean the doc is missing. */
function resolveMedia(value: number | Media | null | undefined): Media | null {
  return value && typeof value === 'object' ? value : null
}

/** Map a CMS gallery item to the serialisable shape the client grid needs. */
function toGalleryImage(item: GalleryItem): GalleryImage | null {
  const media = resolveMedia(item.image)
  if (!media) return null

  const cardUrl = media.sizes?.card?.url ?? media.url
  const fullUrl = media.sizes?.hero?.url ?? media.url
  if (!cardUrl || !fullUrl) return null

  return {
    id: item.id,
    category: item.category,
    alt: item.alt || media.alt || 'EazyBase modular extension project photo',
    caption: item.caption ?? null,
    captionEdit: `gallery-items:${item.id}:caption`,
    src: cardUrl,
    width: media.sizes?.card?.width ?? media.width ?? 900,
    height: media.sizes?.card?.height ?? media.height ?? 675,
    fullSrc: fullUrl,
    fullWidth: media.sizes?.hero?.width ?? media.width ?? 1920,
    fullHeight: media.sizes?.hero?.height ?? media.height ?? 1440,
  }
}

export default async function GalleryPage() {
  const [page, items] = await Promise.all([getPage('gallery'), getGalleryItems()])

  const heroHeading = page?.heroHeading ?? FALLBACK_TITLE
  const heroSub = page?.heroSub ?? FALLBACK_SUB
  const sections = page?.sections ?? []
  const ctaBlock = sections.find((s) => s.blockType === 'ctaBand')
  // Address the block row by its stable id (index as legacy fallback) so the
  // edit path survives admin-side reorders. See src/components/editor/edit-api.ts.
  const ctaBase =
    page && ctaBlock
      ? `pages:${page.id}:sections.${ctaBlock.id ? `r_${ctaBlock.id}` : sections.indexOf(ctaBlock)}`
      : null

  const images = items.map(toGalleryImage).filter((img): img is GalleryImage => img !== null)

  // Before/after pairs — only items with a beforeImage set render the slider.
  const pairs = items.flatMap((item) => {
    const before = resolveMedia(item.beforeImage)
    const after = resolveMedia(item.image)
    if (!before || !after) return []
    const beforeSrc = before.sizes?.card?.url ?? before.url
    const afterSrc = after.sizes?.card?.url ?? after.url
    if (!beforeSrc || !afterSrc) return []
    return [
      {
        id: item.id,
        beforeSrc,
        afterSrc,
        beforeAlt: before.alt || `Before: ${item.alt}`,
        afterAlt: item.alt || after.alt,
        caption: item.caption ?? null,
      },
    ]
  })

  return (
    <>
      {/* Static page hero — simple fade/rise only */}
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
              eyebrow="Our Work"
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

      {/* Before & after showcase — renders only when pairs exist in the CMS */}
      {pairs.length > 0 ? (
        <section className="bg-ink-50 py-16 md:py-24">
          <div className="eb-container">
            <Reveal>
              <SectionHeading
                eyebrow="Before & After"
                lede="Drag the slider to see the space each extension unlocked."
              >
                The transformation, side by side
              </SectionHeading>
            </Reveal>
            <div
              className={[
                'mx-auto mt-12 grid gap-8',
                pairs.length === 1 ? 'max-w-3xl' : 'md:grid-cols-2',
              ].join(' ')}
            >
              {pairs.map((pair, i) => (
                <Reveal key={pair.id} delay={i * 0.1}>
                  <BeforeAfter
                    beforeSrc={pair.beforeSrc}
                    afterSrc={pair.afterSrc}
                    beforeAlt={pair.beforeAlt}
                    afterAlt={pair.afterAlt}
                  />
                  {pair.caption ? (
                    <p
                      className="mt-3 text-center text-sm text-ink-500"
                      data-eb-edit={`gallery-items:${pair.id}:caption`}
                    >
                      {pair.caption}
                    </p>
                  ) : null}
                </Reveal>
              ))}
            </div>
          </div>
        </section>
      ) : null}

      {/* Filterable project grid */}
      <section className="bg-white py-16 md:py-24">
        <div className="eb-container">
          <Reveal>
            <SectionHeading
              eyebrow="Project Photos"
              lede="Every photo below is a real EazyBase project — finished exteriors, bright interiors and the build in progress. Click any image to take a closer look."
            >
              Proof, not promises
            </SectionHeading>
          </Reveal>

          <div className="mt-12">
            {images.length > 0 ? (
              <GalleryGrid images={images} />
            ) : (
              <p className="text-center text-ink-500">
                Project photos are being added — check back soon.
              </p>
            )}
          </div>
        </div>
      </section>

      <CTABand
        heading={
          ctaBase && ctaBlock?.heading ? (
            <span data-eb-edit={`${ctaBase}.heading`}>{ctaBlock.heading}</span>
          ) : (
            (ctaBlock?.heading ?? 'Like what you see?')
          )
        }
        sub={
          ctaBase && ctaBlock?.body ? (
            <span data-eb-edit={`${ctaBase}.body`}>{ctaBlock.body}</span>
          ) : (
            (ctaBlock?.body ?? undefined)
          )
        }
      />
    </>
  )
}
