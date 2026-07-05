'use client'

import { motion, useReducedMotion } from 'motion/react'
import type { ReactNode } from 'react'

type RevealProps = {
  children: ReactNode
  /** Seconds to wait before the animation starts — use for staggering siblings. */
  delay?: number
  /** Animation duration in seconds. */
  duration?: number
  /** Vertical rise distance in px. */
  y?: number
  className?: string
}

/**
 * Fade + rise on first scroll into view. Wrap section content in it; stagger
 * a row of cards by passing incremental `delay` values (e.g. i * 0.1).
 */
export function Reveal({ children, delay = 0, duration = 0.7, y = 24, className }: RevealProps) {
  const reducedMotion = useReducedMotion()

  if (reducedMotion) {
    return <div className={className}>{children}</div>
  }

  return (
    <motion.div
      className={className}
      initial={{ opacity: 0, y }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: '0px 0px -10% 0px' }}
      transition={{ duration, delay, ease: [0.16, 1, 0.3, 1] }}
    >
      {children}
    </motion.div>
  )
}

export default Reveal
