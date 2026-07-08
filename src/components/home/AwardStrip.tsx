/**
 * AwardStrip — trust signal directly under the StatsBar: the Northern
 * Enterprise Awards certificate photo with gold-laurel styling. Server
 * component; renders nothing if the award doc is missing.
 */

import Image from 'next/image'

import { mediaURL, resolveMedia } from './media'
import type { Award } from '@/payload-types'

/** Gold laurel branch — mirrored pair flanks the kicker. */
function LaurelBranch({ className, flipped = false }: { className?: string; flipped?: boolean }) {
  return (
    <svg
      viewBox="0 0 24 40"
      fill="none"
      aria-hidden="true"
      className={className}
      style={flipped ? { transform: 'scaleX(-1)' } : undefined}
    >
      <path
        d="M18 38C8.5 33.5 4.5 24 7.5 12"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinecap="round"
      />
      <path d="M8.2 18.5L3 16.6" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
      <path d="M9.4 24.4L4.6 27" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
      <path d="M12.4 30.4L9 34.6" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
      <path d="M8.6 12.4L5.4 8" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
      <path d="M9.6 7.8L9 2.6" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
    </svg>
  )
}

type AwardStripProps = {
  /** Section heading from the page's awardBadge block. */
  heading?: string | null
  /** Visual-editor path for the heading, e.g. "pages:1:sections.6.heading". */
  headingEdit?: string
  award: Award | null
}

export function AwardStrip({ heading, headingEdit, award }: AwardStripProps) {
  if (!award) return null

  const certificate = resolveMedia(award.image)
  const certificateURL = mediaURL(certificate, 'card')

  return (
    <section aria-label="Awards" className="border-b border-ink-100 bg-white">
      <div className="eb-container flex flex-col items-center justify-center gap-8 py-10 sm:flex-row sm:gap-12 md:py-12">
        {certificateURL ? (
          <span data-eb-edit-media={`awards:${award.id}:image`} className="inline-block">
            <Image
              src={certificateURL}
              alt={certificate?.alt || `${award.title} certificate`}
              width={certificate?.width ?? 640}
              height={certificate?.height ?? 449}
              className="h-32 w-auto rounded-sm shadow-lg ring-1 ring-ink-100 sm:h-36"
            />
          </span>
        ) : null}

        <div className="flex items-center gap-4">
          <LaurelBranch className="h-14 w-8 shrink-0 text-[#d4a72c]" />
          <div className="max-w-md text-center">
            {heading ? (
              <h2 className="font-display text-lg font-semibold text-ink-900 sm:text-xl">
                <span data-eb-edit={headingEdit}>{heading}</span>
              </h2>
            ) : null}
            <p className="mt-1.5 text-sm text-ink-500">
              {award.body ? (
                <>
                  <span data-eb-edit={`awards:${award.id}:body`}>{award.body}</span> —{' '}
                </>
              ) : null}
              <span className="font-semibold text-brand-700" data-eb-edit={`awards:${award.id}:title`}>
                {award.title}
              </span>
            </p>
          </div>
          <LaurelBranch flipped className="h-14 w-8 shrink-0 text-[#d4a72c]" />
        </div>
      </div>
    </section>
  )
}

export default AwardStrip
