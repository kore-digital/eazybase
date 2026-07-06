/**
 * HomeIntro — "Hire EazyBase for Modular Home Extensions": tightened intro
 * copy from the CMS beside a real project photo. Server component.
 */

import Image from 'next/image'
import Link from 'next/link'
import { RichText } from '@payloadcms/richtext-lexical/react'
import type { SerializedEditorState } from '@payloadcms/richtext-lexical/lexical'

import { Reveal } from '@/components/ui/Reveal'
import { SectionHeading } from '@/components/ui/SectionHeading'
import type { SimpleImage } from './media'
import type { RichTextBlock } from '@/payload-types'

type HomeIntroProps = {
  block: RichTextBlock
  /** e.g. "pages:1:sections.0" — heading/content paths derive from it. */
  editBase: string
  image: SimpleImage | null
}

export function HomeIntro({ block, editBase, image }: HomeIntroProps) {
  return (
    <section className="bg-white">
      <div className="eb-container grid items-center gap-12 py-16 md:py-24 lg:grid-cols-2 lg:gap-16">
        <Reveal>
          <SectionHeading align="left" eyebrow="Why EazyBase">
            <span data-eb-edit={`${editBase}.heading`}>
              {block.heading ?? 'Hire EazyBase for Modular Home Extensions'}
            </span>
          </SectionHeading>

          {block.content ? (
            <div
              data-eb-edit-rich={`${editBase}.content`}
              className="mt-6 leading-relaxed text-ink-600 [&_p]:mb-4 [&_p:last-child]:mb-0"
            >
              <RichText data={block.content as SerializedEditorState} />
            </div>
          ) : null}

          <Link
            href="/what-we-do"
            className="mt-7 inline-flex items-center gap-2 font-display text-sm font-semibold tracking-wide text-brand-700 uppercase underline-offset-4 hover:underline"
          >
            See how we build it
            <span aria-hidden="true">→</span>
          </Link>
        </Reveal>

        {image ? (
          <Reveal delay={0.15} className="relative">
            {/* Angled block accent behind the photo — echoes the logo motif */}
            <div
              aria-hidden="true"
              className="absolute -top-4 -right-4 hidden h-28 w-40 -skew-x-[18deg] bg-brand-500/15 sm:block"
            />
            <div className="relative aspect-[4/3] overflow-hidden rounded-lg shadow-xl">
              <Image
                src={image.url}
                alt={image.alt}
                fill
                sizes="(min-width: 1024px) 45vw, 100vw"
                className="object-cover"
              />
            </div>
          </Reveal>
        ) : null}
      </div>
    </section>
  )
}

export default HomeIntro
