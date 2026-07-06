'use client'

import Image from 'next/image'
import { useCallback, useEffect, useRef } from 'react'
import { createPortal } from 'react-dom'

import type { GalleryImage } from './GalleryGrid'

type LightboxProps = {
  images: GalleryImage[]
  /** Index of the image currently shown. */
  index: number
  onClose: () => void
  onNavigate: (nextIndex: number) => void
}

const FOCUSABLE = 'button:not([disabled]), [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'

/**
 * Minimal, dependency-free lightbox: fixed overlay rendered through a portal,
 * focus trapped inside, Esc closes, arrow keys navigate. Prev/next wrap.
 */
export function Lightbox({ images, index, onClose, onNavigate }: LightboxProps) {
  const dialogRef = useRef<HTMLDivElement>(null)
  const restoreFocusRef = useRef<HTMLElement | null>(null)

  const count = images.length
  const image = images[index]

  const prev = useCallback(() => onNavigate((index - 1 + count) % count), [index, count, onNavigate])
  const next = useCallback(() => onNavigate((index + 1) % count), [index, count, onNavigate])

  // Mount: remember focus origin, move focus in, lock body scroll.
  useEffect(() => {
    restoreFocusRef.current = document.activeElement as HTMLElement | null
    const previousOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    dialogRef.current?.querySelector<HTMLElement>('[data-lightbox-close]')?.focus()

    return () => {
      document.body.style.overflow = previousOverflow
      restoreFocusRef.current?.focus()
    }
  }, [])

  // Keyboard: Esc / arrows / Tab focus trap.
  useEffect(() => {
    function onKeyDown(e: KeyboardEvent) {
      if (e.key === 'Escape') {
        e.preventDefault()
        onClose()
      } else if (e.key === 'ArrowRight') {
        e.preventDefault()
        next()
      } else if (e.key === 'ArrowLeft') {
        e.preventDefault()
        prev()
      } else if (e.key === 'Tab') {
        const dialog = dialogRef.current
        if (!dialog) return
        const focusable = Array.from(dialog.querySelectorAll<HTMLElement>(FOCUSABLE))
        if (focusable.length === 0) return
        const first = focusable[0]
        const last = focusable[focusable.length - 1]
        const active = document.activeElement

        if (e.shiftKey && (active === first || !dialog.contains(active))) {
          e.preventDefault()
          last.focus()
        } else if (!e.shiftKey && (active === last || !dialog.contains(active))) {
          e.preventDefault()
          first.focus()
        }
      }
    }

    document.addEventListener('keydown', onKeyDown)
    return () => document.removeEventListener('keydown', onKeyDown)
  }, [onClose, next, prev])

  if (!image) return null

  return createPortal(
    <div
      ref={dialogRef}
      role="dialog"
      aria-modal="true"
      aria-label={`Image ${index + 1} of ${count}: ${image.alt}`}
      className="fixed inset-0 z-[100] flex flex-col bg-ink-950/95 backdrop-blur-sm"
      onClick={(e) => {
        // Click on the dark backdrop (not the image or controls) closes.
        if (e.target === e.currentTarget) onClose()
      }}
    >
      {/* Top bar */}
      <div className="flex items-center justify-between px-4 py-3 sm:px-6">
        <p className="font-display text-sm font-semibold tracking-wide text-ink-300">
          {index + 1} / {count}
        </p>
        <button
          type="button"
          data-lightbox-close
          onClick={onClose}
          aria-label="Close image viewer"
          className="flex h-10 w-10 items-center justify-center rounded-md text-white transition-colors hover:bg-white/10 focus-visible:ring-2 focus-visible:ring-brand-500 focus-visible:outline-none"
        >
          <svg viewBox="0 0 20 20" className="h-5 w-5" aria-hidden="true">
            <path
              d="m5 5 10 10M15 5 5 15"
              stroke="currentColor"
              strokeWidth={2}
              strokeLinecap="round"
            />
          </svg>
        </button>
      </div>

      {/* Image stage */}
      <div
        className="relative flex min-h-0 flex-1 items-center justify-center px-14 pb-2 sm:px-20"
        onClick={(e) => {
          if (e.target === e.currentTarget) onClose()
        }}
      >
        <Image
          key={image.id}
          src={image.fullSrc}
          alt={image.alt}
          width={image.fullWidth}
          height={image.fullHeight}
          sizes="100vw"
          className="max-h-full w-auto max-w-full rounded-md object-contain shadow-2xl"
        />

        {count > 1 ? (
          <>
            <button
              type="button"
              onClick={prev}
              aria-label="Previous image"
              className="absolute top-1/2 left-2 flex h-11 w-11 -translate-y-1/2 items-center justify-center rounded-full bg-white/10 text-white transition-colors hover:bg-brand-500 focus-visible:ring-2 focus-visible:ring-brand-500 focus-visible:outline-none sm:left-4"
            >
              <svg viewBox="0 0 20 20" className="h-5 w-5" aria-hidden="true">
                <path
                  d="M12.5 4.5 7 10l5.5 5.5"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth={2}
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </button>
            <button
              type="button"
              onClick={next}
              aria-label="Next image"
              className="absolute top-1/2 right-2 flex h-11 w-11 -translate-y-1/2 items-center justify-center rounded-full bg-white/10 text-white transition-colors hover:bg-brand-500 focus-visible:ring-2 focus-visible:ring-brand-500 focus-visible:outline-none sm:right-4"
            >
              <svg viewBox="0 0 20 20" className="h-5 w-5" aria-hidden="true">
                <path
                  d="m7.5 4.5 5.5 5.5-5.5 5.5"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth={2}
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </button>
          </>
        ) : null}
      </div>

      {/* Caption */}
      <div className="px-6 pt-1 pb-5 text-center">
        <p className="mx-auto max-w-2xl text-sm text-ink-300">
          {image.caption ? (
            <span data-eb-edit={image.captionEdit}>{image.caption}</span>
          ) : (
            image.alt
          )}
        </p>
      </div>
    </div>,
    document.body,
  )
}

export default Lightbox
