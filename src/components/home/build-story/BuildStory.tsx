'use client'

/**
 * BuildStory — the site's scroll signature: a pinned, scroll-scrubbed
 * five-phase retelling of the build (Concept → Design → Build → Interior →
 * Completion), NRG-“build your data center”-style but with NO scroll-jacking:
 * a tall track + `position: sticky` stage, so native scroll, deep links,
 * the sticky CTA bar and assistive tech all keep working.
 *
 * Scroll maths: `useScroll` over the track → 0→1, smoothed with a spring
 * (stiffness 100 / damping 30) so scrubbing feels weighted. Phase i owns
 * [i/N, (i+1)/N]; copy fades in over the first 15% of its window and out
 * over the last 15% (the final phase holds to the end for a clean release).
 *
 * Copy comes from the CMS processTimeline block with the same data-eb-edit
 * paths the old ProcessStrip used — every rendered step is inline-editable.
 * All copy blocks are always in the DOM (opacity-managed) for SEO. Under
 * prefers-reduced-motion the track collapses to stacked static panels
 * (final scene frame per phase + copy); that swap happens post-mount so the
 * first client render always matches the SSR HTML (no hydration mismatch).
 */

import {
  motion,
  useMotionValue,
  useMotionValueEvent,
  useScroll,
  useSpring,
  useTransform,
  type MotionValue,
} from 'motion/react'
import { useRef, useState } from 'react'

import type { ProcessTimelineBlock } from '@/payload-types'
import { useReducedMotionSafe } from '@/components/ui/useReducedMotionSafe'

import { BuildScene } from './BuildScene'
import { PhaseCopy } from './PhaseCopy'

/** The scene's keyframes are hand-tuned for exactly five phases. */
const SCENE_PHASE_COUNT = 5

/** Progress moment at which each of the five scene phases reads as
 *  "finished" — used for the reduced-motion static frames. */
const SCENE_FREEZE = [0.165, 0.36, 0.6, 0.77, 1] as const

/** Fallback copy used ONLY when the CMS block has fewer than 2 usable steps
 *  (mirrors the seed). Rendered steps always come 1:1 from the CMS otherwise,
 *  so everything an editor sees on the page is inline-editable. */
const FALLBACK_PHASES: { title: string; body: string }[] = [
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
    body: 'We build your extension from the ground up to our architects’ specification using only the best materials.',
  },
  {
    title: 'Interior',
    body: 'We carry out all the interior work too: plastering, doors, flooring, ceilings, electrics and much more.',
  },
  {
    title: 'Completion',
    body: 'We hand over your finished extension — snagged, certified and ready to live in.',
  },
]

/** Scene progress at which phase i of n should read as settled. Tuned values
 *  for the native five-phase scene; evenly-spaced sampling otherwise. */
function freezeAt(i: number, n: number): number {
  if (n === SCENE_PHASE_COUNT) return SCENE_FREEZE[i]
  if (n <= 1) return 1
  // Evenly spaced across the drawn range (0.165 = blueprint fully drawn).
  return 0.165 + (1 - 0.165) * (i / (n - 1))
}

type Phase = {
  key: string | number
  title: string
  body?: string | null
  editTitle?: string
  editBody?: string
}

export type BuildStoryProps = {
  block: ProcessTimelineBlock
  /** e.g. "pages:1:sections.4" — data-eb-edit base for the visual editor */
  editBase: string
}

/* ————————————————— Scroll-scrubbed copy block ————————————————— */

function PhaseCopyScrub({
  p,
  index,
  total,
  active,
  phase,
}: {
  p: MotionValue<number>
  index: number
  total: number
  active: boolean
  phase: Phase
}) {
  const s = index / total
  const e = (index + 1) / total
  // Fade in over the first 15% of the window, out over the last 15%.
  const opacity = useTransform(
    p,
    [s, s + 0.03, e - 0.03, e],
    [index === 0 ? 1 : 0, 1, 1, index === total - 1 ? 1 : 0],
  )
  const y = useTransform(
    p,
    [s, s + 0.03, e - 0.03, e],
    [index === 0 ? 0 : 28, 0, 0, index === total - 1 ? 0 : -28],
  )

  return (
    <motion.div
      style={{ opacity, y }}
      className={`absolute inset-0 flex flex-col justify-end md:justify-center ${
        active ? 'pointer-events-auto' : 'pointer-events-none'
      }`}
      aria-hidden={active ? undefined : true}
    >
      <PhaseCopy
        index={index}
        total={total}
        title={phase.title}
        body={phase.body}
        editTitle={phase.editTitle}
        editBody={phase.editBody}
      />
    </motion.div>
  )
}

/* ————————————————— Progress rail ————————————————— */

function ProgressRail({
  p,
  active,
  phases,
  onSelect,
}: {
  p: MotionValue<number>
  active: number
  phases: Phase[]
  onSelect: (index: number) => void
}) {
  const fill = useTransform(p, [0, 1], [0, 1])

  const node = (i: number) => {
    const passed = i < active
    const current = i === active
    return (
      <button
        key={phases[i].key}
        type="button"
        onClick={() => onSelect(i)}
        aria-label={`Go to phase ${i + 1}: ${phases[i].title}`}
        aria-current={current ? 'step' : undefined}
        className={`relative z-10 flex h-6 w-7 -skew-x-[18deg] items-center justify-center border-2 transition-colors duration-300 before:absolute before:-inset-2.5 before:content-[''] focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-brand-400 ${
          passed || current
            ? 'border-brand-500 bg-brand-500'
            : 'border-ink-600 bg-ink-950 hover:border-ink-300'
        }`}
      >
        <span className="skew-x-[18deg] font-display text-[10px] font-bold leading-none text-ink-950">
          {passed ? '✓' : current ? i + 1 : ''}
        </span>
      </button>
    )
  }

  return (
    <nav aria-label="Build phases">
      {/* Desktop: vertical rail on the right edge */}
      <div className="absolute top-1/2 right-5 z-20 hidden h-[46vh] -translate-y-1/2 md:right-8 md:flex">
        <div className="relative flex h-full flex-col items-center justify-between">
          <div aria-hidden="true" className="absolute inset-y-1 left-1/2 w-0.5 -translate-x-1/2 bg-ink-700" />
          <motion.div
            aria-hidden="true"
            className="absolute inset-y-1 left-1/2 w-0.5 origin-top -translate-x-1/2 bg-brand-500"
            style={{ scaleY: fill }}
          />
          {phases.map((_, i) => node(i))}
        </div>
      </div>

      {/* Mobile: horizontal rail along the top — below the 73px sticky header
          plus the editor admin bar when one is present (EditorChrome sets
          --eb-adminbar-h on html.eb-authed and offsets the header by it). */}
      <div
        className="absolute inset-x-8 z-20 md:hidden"
        style={{ top: 'calc(5.5rem + var(--eb-adminbar-h, 0px))' }}
      >
        <div className="relative flex w-full items-center justify-between">
          <div aria-hidden="true" className="absolute inset-x-1 top-1/2 h-0.5 -translate-y-1/2 bg-ink-700" />
          <motion.div
            aria-hidden="true"
            className="absolute inset-x-1 top-1/2 h-0.5 origin-left -translate-y-1/2 bg-brand-500"
            style={{ scaleX: fill }}
          />
          {phases.map((_, i) => node(i))}
        </div>
      </div>
    </nav>
  )
}

/* ————————————————— Reduced-motion static frame ————————————————— */

function StaticScene({ at, label, className }: { at: number; label: string; className?: string }) {
  const frozen = useMotionValue(at)
  return <BuildScene progress={frozen} label={label} className={className} />
}

/* ————————————————— Main component ————————————————— */

export function BuildStory({ block, editBase }: BuildStoryProps) {
  // Hydration-safe: false during SSR AND the first client render, so the
  // server tree (the full pinned track) always matches; the stacked
  // reduced-motion variant swaps in post-mount as a plain state update.
  const reducedMotion = useReducedMotionSafe()
  const trackRef = useRef<HTMLElement>(null)
  const [active, setActive] = useState(0)

  // Phases come 1:1 from the CMS steps array (the admin enforces minRows: 2);
  // hard-coded fallback copy only ever appears when the block is unusable
  // (fewer than 2 steps), never interleaved with editable CMS rows.
  const steps = block.steps ?? []
  const phases: Phase[] =
    steps.length >= 2
      ? steps.map((step, i) => ({
          key: step.id ?? i,
          title: step.title,
          body: step.body,
          editTitle: `${editBase}.steps.${i}.title`,
          editBody: step.body ? `${editBase}.steps.${i}.body` : undefined,
        }))
      : FALLBACK_PHASES.map((fallback, i) => ({ key: i, ...fallback }))
  const phaseCount = phases.length

  const { scrollYProgress } = useScroll({
    target: trackRef,
    offset: ['start start', 'end end'],
  })
  // Weighted scrubbing — every scene element hangs off this smoothed value.
  const smooth = useSpring(scrollYProgress, { stiffness: 100, damping: 30, restDelta: 0.001 })

  // The scene's keyframes are tuned for exactly 5 phases. With any other
  // step count we fall back to evenly-spaced scene sampling: each phase
  // window i ends on freezeAt(i, n), so the drawing still plays through
  // continuously and every phase settles on an evenly-spaced frame (the
  // scene's internal beats just no longer align 1:1 with the copy windows).
  const sceneProgress = useTransform(
    smooth,
    phaseCount === SCENE_PHASE_COUNT
      ? [0, 1]
      : [0, ...phases.map((_, i) => (i + 1) / phaseCount)],
    phaseCount === SCENE_PHASE_COUNT
      ? [0, 1]
      : [0, ...phases.map((_, i) => freezeAt(i, phaseCount))],
  )

  // Entry: the stage content settles in over the first 5% of the track.
  const stageScale = useTransform(smooth, [0, 0.05], [0.98, 1])
  const stageOpacity = useTransform(smooth, [0, 0.05], [0.55, 1])
  // Scroll hint fades once phase 1 is underway.
  const hintOpacity = useTransform(smooth, [0.04, 0.09], [1, 0])

  useMotionValueEvent(scrollYProgress, 'change', (v) => {
    const next = Math.min(phaseCount - 1, Math.max(0, Math.floor(v * phaseCount)))
    setActive((prev) => (prev === next ? prev : next))
  })

  /** Rail click → native/Lenis smooth scroll to the middle of phase i's window. */
  const scrollToPhase = (i: number) => {
    const track = trackRef.current
    if (!track) return
    const trackTop = track.getBoundingClientRect().top + window.scrollY
    const target = trackTop + ((i + 0.5) / phaseCount) * (track.offsetHeight - window.innerHeight)
    const lenis = window.__lenis
    if (lenis) lenis.scrollTo(target)
    else window.scrollTo({ top: target, behavior: 'smooth' })
  }

  const heading = block.heading ?? 'Our 5-step process'

  /* ————— Reduced motion: stacked static panels, no pinning ————— */
  if (reducedMotion) {
    return (
      <section ref={trackRef} id="build-story" className="bg-ink-950">
        <div className="eb-container pt-14 md:pt-16">
          <h2
            className="inline-block font-display text-xs font-bold tracking-[0.3em] text-ink-400 uppercase"
            data-eb-edit={`${editBase}.heading`}
          >
            {heading}
          </h2>
        </div>
        {phases.map((phase, i) => (
          <div
            key={phase.key}
            className={`eb-container grid items-center gap-10 py-16 md:grid-cols-2 md:py-20 ${
              i > 0 ? 'border-t border-ink-900' : ''
            }`}
          >
            <PhaseCopy
              index={i}
              total={phaseCount}
              title={phase.title}
              body={phase.body}
              editTitle={phase.editTitle}
              editBody={phase.editBody}
            />
            <StaticScene
              at={freezeAt(i, phaseCount)}
              label={`Phase ${i + 1} of ${phaseCount}: ${phase.title} — the extension illustration at this stage of the build`}
              className="h-auto w-full max-w-[560px] justify-self-center"
            />
          </div>
        ))}
      </section>
    )
  }

  /* ————— Full experience: 100vh-per-phase track + sticky stage ————— */
  return (
    <section
      ref={trackRef}
      id="build-story"
      className="relative bg-ink-950"
      style={{ height: `${phaseCount * 100}vh` }}
    >
      <div className="sticky top-0 h-screen overflow-hidden bg-ink-950 supports-[height:100dvh]:h-dvh">
        <motion.div style={{ scale: stageScale, opacity: stageOpacity }} className="relative h-full w-full">
          {/* Scene — right ~55% on desktop, dimmed backdrop on mobile */}
          <div className="pointer-events-none absolute inset-0 flex items-center justify-center opacity-50 md:left-[42%] md:opacity-100">
            <BuildScene progress={sceneProgress} className="h-auto w-full max-w-[560px] px-4 md:max-w-[680px]" />
          </div>
          {/* Mobile scrim so the copy stays legible over the scene */}
          <div
            aria-hidden="true"
            className="absolute inset-0 bg-gradient-to-t from-ink-950/90 via-ink-950/30 to-transparent md:hidden"
          />

          {/* Copy — left ~45% desktop, lower third mobile; all phases in the
              DOM. pointer-events-none so the full-stage wrapper never blocks
              the rail; the active copy re-enables them for the visual editor. */}
          <div className="pointer-events-none relative z-10 flex h-full items-end pb-28 md:items-center md:pb-0">
            <div className="eb-container w-full">
              {/* Visible section heading — keeps the block's heading
                  inline-editable (a sr-only node can't be hovered/clicked). */}
              <h2
                className="pointer-events-auto mb-5 inline-block font-display text-xs font-bold tracking-[0.3em] text-ink-400 uppercase"
                data-eb-edit={`${editBase}.heading`}
              >
                {heading}
              </h2>
              <div className="relative h-[38vh] max-w-xl md:h-[52vh] md:max-w-[40%]">
                {phases.map((phase, i) => (
                  <PhaseCopyScrub
                    key={phase.key}
                    p={smooth}
                    index={i}
                    total={phaseCount}
                    active={i === active}
                    phase={phase}
                  />
                ))}
              </div>
            </div>
          </div>

          {/* Progress rail */}
          <ProgressRail p={smooth} active={active} phases={phases} onSelect={scrollToPhase} />

          {/* Scroll hint — lifted above the fixed StickyMobileCTA bar on mobile */}
          <motion.p
            style={{ opacity: hintOpacity }}
            className="absolute bottom-[calc(4.5rem+env(safe-area-inset-bottom))] left-5 z-10 flex items-center gap-2.5 font-display text-xs font-semibold tracking-[0.2em] text-ink-400 uppercase sm:left-8 md:bottom-8"
            aria-hidden="true"
          >
            <svg viewBox="0 0 16 26" className="h-6 w-4" fill="none" aria-hidden="true">
              <rect x="1" y="1" width="14" height="24" rx="7" stroke="currentColor" strokeWidth="1.5" />
              <circle cx="8" cy="8" r="2" fill="currentColor" />
            </svg>
            Scroll to build
          </motion.p>
        </motion.div>
      </div>
    </section>
  )
}

export default BuildStory
