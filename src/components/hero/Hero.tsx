/**
 * Hero — full home-page hero section (server component).
 *
 * Ink-950 blueprint backdrop; left column = headline, CTAs, award line and
 * phone link (staggered rise via <Reveal>, timed with the assembly); right
 * column = the signature HeroAssembly animation.
 */

import Link from 'next/link'
import { SITE } from '@/lib/site'
import { QuoteCTA } from '@/components/ui/QuoteCTA'
import { HeroAssembly } from './HeroAssembly'
import { Reveal } from './Reveal'

/** Small gold laurel for the award line. */
function Laurel({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" aria-hidden="true" className={className}>
      {/* left branch */}
      <path
        d="M9.5 21C5.8 19.2 3.6 15.4 4.2 10.6"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
      />
      <path d="M4.6 13.8L2.2 13" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
      <path d="M5.6 16.9L3.5 18.2" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
      <path d="M7.6 19.5L6.4 21.7" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
      {/* right branch */}
      <path
        d="M14.5 21C18.2 19.2 20.4 15.4 19.8 10.6"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
      />
      <path d="M19.4 13.8L21.8 13" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
      <path d="M18.4 16.9L20.5 18.2" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
      <path d="M16.4 19.5L17.6 21.7" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
      {/* star */}
      <path d="M12 4l1.1 2.3 2.4.3-1.8 1.7.5 2.4L12 9.5l-2.2 1.2.5-2.4-1.8-1.7 2.4-.3L12 4z" fill="currentColor" />
    </svg>
  )
}

export type HeroProps = {
  heading?: string
  sub?: string
  /** data-eb-edit paths so the visual editor can bind the CMS fields */
  editHeading?: string
  editSub?: string
}

export function Hero({
  heading = 'Get a Modular Home Extension',
  sub = 'Creating more space for what matters.',
  editHeading,
  editSub,
}: HeroProps = {}) {
  return (
    <section className="relative overflow-hidden bg-ink-950 text-white">
      {/* Subtle blueprint grid */}
      <div
        aria-hidden="true"
        className="absolute inset-0"
        style={{
          backgroundImage:
            'linear-gradient(rgba(255,255,255,0.05) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.05) 1px, transparent 1px)',
          backgroundSize: '44px 44px',
          maskImage: 'radial-gradient(ellipse 90% 80% at 50% 40%, black 30%, transparent 100%)',
        }}
      />
      {/* Soft green glow behind the illustration */}
      <div
        aria-hidden="true"
        className="absolute inset-0"
        style={{
          background: 'radial-gradient(ellipse 40% 45% at 72% 45%, rgba(150,193,31,0.10), transparent 70%)',
        }}
      />

      <div className="eb-container relative grid items-center gap-12 py-16 sm:py-20 lg:grid-cols-2 lg:gap-16 lg:py-24">
        {/* ————— Copy ————— */}
        <div>
          <Reveal delay={0.1}>
            <p className="flex items-center gap-3 font-display text-xs font-semibold tracking-[0.2em] text-brand-400 uppercase">
              <span className="eb-block-accent" aria-hidden="true" />
              Factory-built in {SITE.base.split(',')[0]}
            </p>
          </Reveal>

          <Reveal delay={0.25}>
            <h1
              className="mt-5 text-4xl leading-tight font-bold text-white sm:text-5xl lg:text-[3.4rem]"
              data-eb-edit={editHeading}
            >
              {heading}
            </h1>
          </Reveal>

          <Reveal delay={0.4}>
            <p className="mt-5 max-w-md text-lg text-ink-200" data-eb-edit={editSub}>
              {sub}
            </p>
          </Reveal>

          <Reveal delay={0.55}>
            <div className="mt-8 flex flex-wrap gap-4">
              <QuoteCTA href="/get-a-quote">Get a Quote</QuoteCTA>
              <Link
                href="/instant-quote"
                className="eb-btn border-2 border-white text-white transition-colors hover:bg-white hover:text-ink-950"
              >
                Instant Quote
              </Link>
            </div>
          </Reveal>

          <Reveal delay={0.7}>
            <p className="mt-9 flex items-start gap-2.5 text-sm text-ink-300">
              <Laurel className="mt-0.5 h-5 w-5 shrink-0 text-[#d4a72c]" />
              <span>
                <span className="font-semibold text-ink-100">{SITE.awardBody} 2023</span> — {SITE.award}
              </span>
            </p>
            <p className="mt-3 text-sm text-ink-300">
              Or call{' '}
              <a href={SITE.phoneHref} className="font-semibold text-white underline-offset-4 hover:underline">
                {SITE.phone}
              </a>
            </p>
          </Reveal>
        </div>

        {/* ————— Signature assembly animation ————— */}
        <div className="relative">
          <HeroAssembly className="mx-auto h-auto w-full max-w-[640px]" />
        </div>
      </div>
    </section>
  )
}

export default Hero
