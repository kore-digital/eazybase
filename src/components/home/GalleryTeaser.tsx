/**
 * GalleryTeaser — six recent project photos in a tight grid with a link
 * through to the full gallery. Server component.
 */

import Image from 'next/image'
import Link from 'next/link'

import { Reveal } from '@/components/ui/Reveal'
import { SectionHeading } from '@/components/ui/SectionHeading'
import { galleryImage } from './media'
import type { GalleryItem } from '@/payload-types'

type GalleryTeaserProps = {
  heading?: string | null
  /** e.g. "pages:1:sections.4.heading" */
  headingEdit?: string
  items: GalleryItem[]
}

export function GalleryTeaser({ heading, headingEdit, items }: GalleryTeaserProps) {
  const images = items
    .map((item) => ({ item, image: galleryImage(item, 'card') }))
    .filter((entry): entry is { item: GalleryItem; image: NonNullable<ReturnType<typeof galleryImage>> } => entry.image !== null)
    .slice(0, 6)

  if (images.length === 0) return null

  return (
    <section className="bg-ink-50">
      <div className="eb-container py-16 md:py-24">
        <Reveal>
          <SectionHeading
            eyebrow="Our work"
            lede="Every photo is a real EazyBase build — factory-made in Blackburn, installed at homes like yours."
          >
            <span data-eb-edit={headingEdit}>{heading ?? 'Recent projects'}</span>
          </SectionHeading>
        </Reveal>

        <ul className="mt-12 grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-3">
          {images.map(({ item, image }, i) => (
            <li key={item.id}>
              <Reveal delay={i * 0.06}>
                <Link
                  href="/gallery"
                  aria-label={`${image.alt} — view the gallery`}
                  className="group relative block aspect-[4/3] overflow-hidden rounded-md"
                >
                  <Image
                    src={image.url}
                    alt={image.alt}
                    fill
                    sizes="(min-width: 1024px) 30vw, 45vw"
                    className="object-cover transition-transform duration-500 ease-out group-hover:scale-105"
                  />
                  <span
                    aria-hidden="true"
                    className="absolute inset-0 bg-ink-950/0 transition-colors duration-300 group-hover:bg-ink-950/20"
                  />
                </Link>
              </Reveal>
            </li>
          ))}
        </ul>

        <div className="mt-10 text-center">
          <Link href="/gallery" className="eb-btn eb-btn-outline">
            View the full gallery
          </Link>
        </div>
      </div>
    </section>
  )
}

export default GalleryTeaser
