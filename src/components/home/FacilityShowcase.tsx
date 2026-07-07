import Image from 'next/image'

import { Reveal } from '@/components/ui/Reveal'

/**
 * Full-width HQ + fleet photo with an overlaid caption — a trust/credibility
 * band showing that EazyBase designs, builds and delivers in-house.
 */
export function FacilityShowcase() {
  return (
    <section aria-label="Our HQ and delivery fleet" className="bg-ink-950">
      <Reveal>
        <div className="relative aspect-[16/9] w-full overflow-hidden sm:aspect-[2/1] lg:aspect-[21/9]">
          <Image
            src="/hq-fleet.jpg"
            alt="EazyBase's Blackburn headquarters and branded delivery fleet"
            fill
            sizes="100vw"
            className="object-cover"
          />
          {/* readability gradient */}
          <div
            aria-hidden="true"
            className="absolute inset-0 bg-gradient-to-t from-ink-950/85 via-ink-950/25 to-transparent"
          />
          <div className="absolute inset-x-0 bottom-0">
            <div className="eb-container pb-8 md:pb-12">
              <p className="flex items-center gap-2.5 font-display text-xs font-semibold tracking-[0.2em] text-brand-400 uppercase">
                <span className="eb-block-accent h-2.5 w-4" aria-hidden="true" />
                Our home
              </p>
              <h2 className="mt-3 max-w-2xl font-display text-2xl font-bold text-white sm:text-3xl md:text-4xl">
                Designed, built and delivered in-house
              </h2>
              <p className="mt-3 max-w-xl text-sm leading-relaxed text-ink-200 sm:text-base">
                Every extension is manufactured at our own Blackburn facility and installed by our
                own branded fleet — one team, start to finish.
              </p>
            </div>
          </div>
        </div>
      </Reveal>
    </section>
  )
}

export default FacilityShowcase
