'use client'

/**
 * Reveal — staggered rise-in for the hero copy, timed against the
 * HeroAssembly sequence. Children stay server-rendered; this is only a
 * thin client wrapper around motion.div.
 */

import { motion, useReducedMotion } from 'motion/react'
import type { ReactNode } from 'react'

export type RevealProps = {
  children: ReactNode
  /** Seconds before the rise starts. */
  delay?: number
  className?: string
}

export function Reveal({ children, delay = 0, className }: RevealProps) {
  const prefersReduced = useReducedMotion()

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
