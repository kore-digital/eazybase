import Image from 'next/image'

import { Reveal } from '@/components/ui/Reveal'

export type AngleImage = {
  src: string
  alt: string
}

type LocalAnglesProps = {
  /** Area doc id — used to build data-eb-edit paths. */
  areaId: number | string
  angles: { heading: string; body: string; id?: string | null }[]
  /** Gallery imagery to rotate through, one per angle (cycled if fewer). */
  images: AngleImage[]
}

/**
 * The area page's local-knowledge section: alternating image/text rows built
 * from the area's `localAngles` array, with photography rotated through the
 * seeded gallery.
 */
export function LocalAngles({ areaId, angles, images }: LocalAnglesProps) {
  if (angles.length === 0) return null

  return (
    <div className="space-y-16 md:space-y-24">
      {angles.map((angle, i) => {
        const image = images.length > 0 ? images[i % images.length] : null
        const imageRight = i % 2 === 1

        return (
          <Reveal key={angle.id ?? i}>
            <div className="grid items-center gap-8 md:grid-cols-2 md:gap-12">
              {image ? (
                <div
                  className={[
                    'relative aspect-[4/3] overflow-hidden rounded-lg bg-ink-100',
                    imageRight ? 'md:order-2' : '',
                  ].join(' ')}
                >
                  <Image
                    src={image.src}
                    alt={image.alt}
                    fill
                    sizes="(min-width: 768px) 50vw, 100vw"
                    className="object-cover"
                  />
                  {/* Angled block accent echoing the logo modules */}
                  <span
                    aria-hidden="true"
                    className={[
                      'absolute bottom-0 h-2.5 w-16 -skew-x-[18deg] bg-brand-500',
                      imageRight ? 'right-6' : 'left-6',
                    ].join(' ')}
                  />
                </div>
              ) : null}

              <div className={imageRight ? 'md:order-1' : ''}>
                <h3
                  className="font-display text-xl font-semibold text-ink-900 sm:text-2xl"
                  data-eb-edit={`areas:${areaId}:localAngles.${i}.heading`}
                >
                  {angle.heading}
                </h3>
                <p
                  className="mt-4 text-base leading-relaxed text-ink-600"
                  data-eb-edit={`areas:${areaId}:localAngles.${i}.body`}
                >
                  {angle.body}
                </p>
              </div>
            </div>
          </Reveal>
        )
      })}
    </div>
  )
}

export default LocalAngles
