'use client'

/**
 * HeroAssembly — the site's one signature animation (home hero only).
 *
 * A flat-isometric SVG of a rear modular extension assembling from blocks,
 * driven entirely by Motion (deterministic, crisp, themable — our "Lottie").
 *
 * Geometry (2:1 isometric, viewBox 800×600):
 *   ground point  P(a, b)    = (400 + 56a − 56b, 480 − 28a − 28b)
 *   wall point    P(a, b, c) = ground − (0, c)          c = height in px
 *   A axis (+56, −28) runs to the back-right, B axis (−56, −28) to the
 *   back-left. The extension footprint is 3 units of A × 5 units of B,
 *   walls 138px tall, roof slab 16px thick. The existing house silhouette
 *   sits behind at b = 5…6.9.
 *
 * Sequence (~2.8s): slab → 3 front wall modules (greens/grey) → 2 side wall
 * modules (inks) → roof slab → glazing/door/frames fade in → downlights glow
 * + green tick sweep (echoing the logo checkmark) → gentle idle float.
 */

import { motion } from 'motion/react'
import type { ReactNode } from 'react'

import { useReducedMotionSafe } from '@/components/ui/useReducedMotionSafe'

const STROKE = '#ffffff' // white "mortar" seams between modules
const GLASS = '#c9d6de' // light blue-grey glazing
const GLASS_SIDE = '#b7c5cf' // slightly shaded glazing on the side face

type PieceProps = {
  /** Seconds into the sequence this module lands. */
  delay: number
  /** Entry offset — negative drops from above, positive rises from below. */
  dy?: number
  /** Slight settling rotation on entry (degrees). */
  rot?: number
  isStatic: boolean
  children: ReactNode
}

/** One modular block: drops in with a spring, settles level. */
function Piece({ delay, dy = -72, rot = -3, isStatic, children }: PieceProps) {
  return (
    <motion.g
      initial={isStatic ? false : { opacity: 0, y: dy, rotate: rot }}
      animate={{ opacity: 1, y: 0, rotate: 0 }}
      transition={
        isStatic
          ? { duration: 0 }
          : {
              delay,
              type: 'spring',
              stiffness: 220,
              damping: 21,
              mass: 0.9,
              opacity: { delay, duration: 0.25, ease: 'easeOut' },
            }
      }
    >
      {children}
    </motion.g>
  )
}

type FadeProps = {
  delay: number
  duration?: number
  isStatic: boolean
  children: ReactNode
}

/** Detail layer: simple fade (window frames, door, glow…). */
function Fade({ delay, duration = 0.45, isStatic, children }: FadeProps) {
  return (
    <motion.g
      initial={isStatic ? false : { opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={isStatic ? { duration: 0 } : { delay, duration, ease: 'easeOut' }}
    >
      {children}
    </motion.g>
  )
}

export type HeroAssemblyProps = {
  /** Render the completed frame with no animation (also forced by prefers-reduced-motion). */
  static?: boolean
  className?: string
}

export function HeroAssembly({ static: staticProp = false, className }: HeroAssemblyProps) {
  // Hydration-safe: false on SSR + first client render, flips post-mount so
  // reduced-motion visitors snap to the finished frame without a mismatch.
  const prefersReduced = useReducedMotionSafe()
  const isStatic = staticProp || prefersReduced

  return (
    <svg
      viewBox="0 0 800 600"
      role="img"
      aria-label="Illustration of a modular rear extension assembling from factory-built blocks"
      className={className ?? 'h-auto w-full'}
    >
      <title>Modular extension assembly</title>

      {/* ————— Soft long shadow under the build ————— */}
      <Fade delay={0.15} duration={0.6} isStatic={isStatic}>
        <ellipse cx="320" cy="497" rx="300" ry="42" fill="#000000" opacity="0.35" />
        {/* cast shadow thrown to the lower-right */}
        <polygon points="400,486 590,400 706,438 520,522" fill="#000000" opacity="0.16" />
      </Fade>

      {/* ————— The building (idle-floats as one group once assembled) ————— */}
      <motion.g
        animate={isStatic ? undefined : { y: [0, -3, 0, 3, 0] }}
        transition={{ delay: 3.1, duration: 6, repeat: Infinity, ease: 'easeInOut' }}
      >
        {/* Existing house silhouette behind (the extension attaches to it) */}
        <Fade delay={0} duration={0.5} isStatic={isStatic}>
          {/* front-left face, b = 5…6.9, 180px tall */}
          <polygon points="120,340 14,287 14,107 120,160" fill="#2b2b2b" stroke="#444546" strokeWidth="2" strokeLinejoin="round" />
          {/* right side face along A */}
          <polygon points="120,340 288,256 288,76 120,160" fill="#333333" stroke="#444546" strokeWidth="2" strokeLinejoin="round" />
          {/* flat roof cap */}
          <polygon points="120,160 14,107 182,23 288,76" fill="#3d3e40" stroke="#444546" strokeWidth="2" strokeLinejoin="round" />
          {/* dim upstairs window on the house front */}
          <polygon points="92,236 47,214 47,154 92,176" fill="#4a5258" stroke="#58595b" strokeWidth="2" strokeLinejoin="round" />
        </Fade>

        {/* 1 · Foundation slab (rises from the ground) */}
        <Piece delay={0.05} dy={46} rot={0} isStatic={isStatic}>
          <polygon points="400,505 98,354 98,340 400,491" fill="#2b2b2b" stroke={STROKE} strokeWidth="2" strokeLinejoin="round" />
          <polygon points="400,505 590,410 590,396 400,491" fill="#2b2b2b" stroke={STROKE} strokeWidth="2" strokeLinejoin="round" />
          <polygon points="400,491 590,396 288,245 98,340" fill="#444546" stroke={STROKE} strokeWidth="2" strokeLinejoin="round" />
        </Piece>

        {/* 2 · Front wall module — logo green (door goes here), b = 0…2 */}
        <Piece delay={0.45} isStatic={isStatic}>
          <polygon points="400,480 288,424 288,286 400,342" fill="#96c11f" stroke={STROKE} strokeWidth="2" strokeLinejoin="round" />
        </Piece>

        {/* 3 · Front wall module — light green, b = 2…3.5 */}
        <Piece delay={0.65} isStatic={isStatic}>
          <polygon points="288,424 204,382 204,244 288,286" fill="#adcf2f" stroke={STROKE} strokeWidth="2" strokeLinejoin="round" />
        </Piece>

        {/* 4 · Front wall module — logo grey (glazed bay), b = 3.5…5 */}
        <Piece delay={0.85} isStatic={isStatic}>
          <polygon points="204,382 120,340 120,202 204,244" fill="#58595b" stroke={STROKE} strokeWidth="2" strokeLinejoin="round" />
        </Piece>

        {/* 5 · Side wall module, a = 0…1.5 */}
        <Piece delay={1.05} isStatic={isStatic}>
          <polygon points="400,480 484,438 484,300 400,342" fill="#333333" stroke={STROKE} strokeWidth="2" strokeLinejoin="round" />
        </Piece>

        {/* 6 · Side wall module (window goes here), a = 1.5…3 */}
        <Piece delay={1.2} isStatic={isStatic}>
          <polygon points="484,438 568,396 568,258 484,300" fill="#3d3e40" stroke={STROKE} strokeWidth="2" strokeLinejoin="round" />
        </Piece>

        {/* 7 · Roof slab (16px thick) with dark fascia */}
        <Piece delay={1.45} dy={-90} rot={-2} isStatic={isStatic}>
          {/* fascia, front-left + front-right */}
          <polygon points="400,342 120,202 120,186 400,326" fill="#2b2b2b" stroke={STROKE} strokeWidth="2" strokeLinejoin="round" />
          <polygon points="400,342 568,258 568,242 400,326" fill="#2b2b2b" stroke={STROKE} strokeWidth="2" strokeLinejoin="round" />
          {/* roof deck */}
          <polygon points="400,326 568,242 288,102 120,186" fill="#e8eae4" stroke={STROKE} strokeWidth="2" strokeLinejoin="round" />
        </Piece>

        {/* 8 · Facade details fade in: glazing, frames, door, roof light */}
        <Fade delay={1.95} isStatic={isStatic}>
          {/* door on the green module (b = 0.55…1.45, 100px tall) */}
          <polygon points="369,465 319,439 319,339 369,365" fill="#2e3233" stroke={STROKE} strokeWidth="2" strokeLinejoin="round" />
          <circle cx="326" cy="402" r="2.5" fill="#ffffff" />

          {/* window on the light-green module (b = 2.3…3.2, c = 40…110) */}
          <polygon points="271,376 221,350 221,280 271,306" fill={GLASS} stroke={STROKE} strokeWidth="2" strokeLinejoin="round" />
          <line x1="246" y1="363" x2="246" y2="293" stroke={STROKE} strokeWidth="1.5" />

          {/* full-height glazed bay on the grey module (b = 3.65…4.85, c = 8…125) */}
          <polygon points="196,370 128,336 128,219 196,253" fill={GLASS} stroke={STROKE} strokeWidth="2" strokeLinejoin="round" />
          <line x1="173" y1="359" x2="173" y2="242" stroke={STROKE} strokeWidth="1.5" />
          <line x1="151" y1="347" x2="151" y2="230" stroke={STROKE} strokeWidth="1.5" />
          {/* glass shine */}
          <line x1="146" y1="316" x2="168" y2="270" stroke="#ffffff" strokeWidth="2" opacity="0.5" strokeLinecap="round" />

          {/* side window (a = 1.9…2.6, c = 45…110) */}
          <polygon points="506,382 546,362 546,297 506,317" fill={GLASS_SIDE} stroke={STROKE} strokeWidth="2" strokeLinejoin="round" />

          {/* roof light on the deck (a = 1…2, b = 1.5…3, plane raised 16px) */}
          <polygon points="372,256 428,228 344,186 288,214" fill={GLASS} stroke={STROKE} strokeWidth="2" strokeLinejoin="round" />
          <line x1="400" y1="242" x2="316" y2="200" stroke={STROKE} strokeWidth="1.5" />
        </Fade>

        {/* 9 · Downlights glow under the front fascia on completion */}
        <Fade delay={2.45} duration={0.5} isStatic={isStatic}>
          {[
            [330, 313],
            [260, 278],
            [190, 243],
          ].map(([x, y]) => (
            <g key={x}>
              <circle cx={x} cy={y} r="9" fill="#adcf2f" opacity="0.35" />
              <circle cx={x} cy={y} r="2.5" fill="#ffffff" />
            </g>
          ))}
        </Fade>
      </motion.g>

      {/* ————— Green "complete" tick sweep — echoes the logo checkmark ————— */}
      <motion.path
        d="M596 356 L636 392 L706 302"
        fill="none"
        stroke="#96c11f"
        strokeWidth="10"
        strokeLinecap="round"
        strokeLinejoin="round"
        initial={isStatic ? false : { pathLength: 0, opacity: 0 }}
        animate={{ pathLength: 1, opacity: 1 }}
        transition={
          isStatic
            ? { duration: 0 }
            : { delay: 2.35, duration: 0.5, ease: [0.16, 1, 0.3, 1], opacity: { delay: 2.35, duration: 0.15 } }
        }
      />
    </svg>
  )
}

export default HeroAssembly
