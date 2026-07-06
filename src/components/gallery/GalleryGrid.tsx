'use client'

import { AnimatePresence, motion, useReducedMotion } from 'motion/react'
import Image from 'next/image'
import { useState } from 'react'

import { Lightbox } from './Lightbox'

export type GalleryCategory = 'exterior' | 'interior' | 'build-progress' | 'before-after'

/** Serialisable image shape the server page maps CMS gallery items into. */
export type GalleryImage = {
  id: number
  category: GalleryCategory
  alt: string
  caption?: string | null
  /** data-eb-edit path for the caption, e.g. "gallery-items:7:caption". */
  captionEdit?: string
  /** Grid thumbnail (Payload `card` size). */
  src: string
  width: number
  height: number
  /** Lightbox image (Payload `hero` size or original). */
  fullSrc: string
  fullWidth: number
  fullHeight: number
}

type FilterKey = 'all' | Exclude<GalleryCategory, 'before-after'>

const FILTERS: { key: FilterKey; label: string }[] = [
  { key: 'all', label: 'All' },
  { key: 'exterior', label: 'Exteriors' },
  { key: 'interior', label: 'Interiors' },
  { key: 'build-progress', label: 'Build Progress' },
]

const EASE = [0.16, 1, 0.3, 1] as const

/**
 * Filterable project gallery: chip filters with a sliding active pill, Motion
 * layout re-flow when the filter changes, scale-in on first view, and an
 * accessible lightbox on click.
 */
export function GalleryGrid({ images, className = '' }: { images: GalleryImage[]; className?: string }) {
  const [filter, setFilter] = useState<FilterKey>('all')
  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null)
  const reducedMotion = useReducedMotion()

  const visible = filter === 'all' ? images : images.filter((img) => img.category === filter)

  // Only offer filters that have at least one image (plus "All").
  const filters = FILTERS.filter(
    (f) => f.key === 'all' || images.some((img) => img.category === f.key),
  )

  return (
    <div className={className}>
      {/* Filter chips */}
      <div
        role="group"
        aria-label="Filter gallery by category"
        className="mb-10 flex flex-wrap items-center justify-center gap-2"
      >
        {filters.map((f) => {
          const active = filter === f.key
          return (
            <button
              key={f.key}
              type="button"
              aria-pressed={active}
              onClick={() => {
                setFilter(f.key)
                setLightboxIndex(null)
              }}
              className={[
                'relative rounded-full px-5 py-2.5 font-display text-sm font-semibold tracking-wide transition-colors duration-200',
                active ? 'text-white' : 'text-ink-600 hover:text-ink-900',
              ].join(' ')}
            >
              {active ? (
                <motion.span
                  layoutId="gallery-filter-pill"
                  aria-hidden="true"
                  className="absolute inset-0 rounded-full bg-ink-900"
                  transition={reducedMotion ? { duration: 0 } : { duration: 0.35, ease: EASE }}
                />
              ) : (
                <span
                  aria-hidden="true"
                  className="absolute inset-0 rounded-full border border-ink-200"
                />
              )}
              <span className="relative">{f.label}</span>
            </button>
          )
        })}
      </div>

      {/* Grid — layout animation re-flows cards when the filter changes */}
      <motion.ul layout className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <AnimatePresence mode="popLayout">
          {visible.map((img, i) => (
            <motion.li
              key={img.id}
              layout={!reducedMotion}
              initial={reducedMotion ? false : { opacity: 0, scale: 0.94 }}
              whileInView={{ opacity: 1, scale: 1 }}
              exit={reducedMotion ? { opacity: 0 } : { opacity: 0, scale: 0.94 }}
              viewport={{ once: true, margin: '0px 0px -8% 0px' }}
              transition={reducedMotion ? { duration: 0 } : { duration: 0.45, ease: EASE }}
            >
              <button
                type="button"
                onClick={() => setLightboxIndex(i)}
                aria-label={`View larger image: ${img.alt}`}
                className="group relative block aspect-[4/3] w-full overflow-hidden rounded-lg bg-ink-100 focus-visible:ring-2 focus-visible:ring-brand-500 focus-visible:ring-offset-2 focus-visible:outline-none"
              >
                <Image
                  src={img.src}
                  alt={img.alt}
                  fill
                  sizes="(min-width: 1024px) 33vw, (min-width: 640px) 50vw, 100vw"
                  className="object-cover transition-transform duration-500 ease-out group-hover:scale-[1.04]"
                />
                {/* Hover scrim + zoom hint */}
                <span
                  aria-hidden="true"
                  className="absolute inset-0 bg-ink-950/0 transition-colors duration-300 group-hover:bg-ink-950/25"
                />
                <span
                  aria-hidden="true"
                  className="absolute right-3 bottom-3 flex h-9 w-9 -skew-x-[18deg] items-center justify-center rounded-sm bg-brand-500 opacity-0 shadow-md transition-opacity duration-300 group-hover:opacity-100"
                >
                  <svg viewBox="0 0 20 20" className="h-4 w-4 skew-x-[18deg] text-ink-950">
                    <path
                      d="M8.5 3a5.5 5.5 0 1 0 3.4 9.83l3.63 3.64a1 1 0 0 0 1.42-1.42l-3.64-3.63A5.5 5.5 0 0 0 8.5 3Zm-3.5 5.5a3.5 3.5 0 1 1 7 0 3.5 3.5 0 0 1-7 0Z"
                      fill="currentColor"
                    />
                  </svg>
                </span>
              </button>
            </motion.li>
          ))}
        </AnimatePresence>
      </motion.ul>

      {visible.length === 0 ? (
        <p className="py-10 text-center text-ink-500">No projects in this category yet.</p>
      ) : null}

      {lightboxIndex !== null && visible[lightboxIndex] ? (
        <Lightbox
          images={visible}
          index={lightboxIndex}
          onClose={() => setLightboxIndex(null)}
          onNavigate={setLightboxIndex}
        />
      ) : null}
    </div>
  )
}

export default GalleryGrid
