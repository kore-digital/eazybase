'use client'

/**
 * Reveal — staggered rise-in for the hero copy, timed against the
 * HeroAssembly sequence. Children stay server-rendered; this is only a
 * thin client wrapper around motion.div.
 */

import { motion } from 'motion/react'
import type { ReactNode } from 'react'

import { useReducedMotionSafe } from '@/components/ui/useReducedMotionSafe'

export type RevealProps = {
  children: ReactNode
  /** Seconds before the rise starts. */
  delay?: number
  className?: string
}

export function Reveal({ children, delay = 0, className }: RevealProps) {
  // Hydration-safe (false on SSR + first client render, flips post-mount) —
  // reduced-motion users get a duration-0 snap instead of a mismatch.
  const prefersReduced = useReducedMotionSafe()

  return (
    <motion.div
      className={className}
      initial={prefersReduced ? false : { opacity: 0, y: 26 }}
      animate={{ opacity: 1, y: 0 }}
      transition={prefersReduced ? { duration: 0 } : { delay, duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
    >
      {children}
    </motion.div>
  )
}

export default Reveal
