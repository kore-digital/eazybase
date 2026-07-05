'use client'

import { animate, useInView, useReducedMotion } from 'motion/react'
import { useEffect, useRef, useState } from 'react'

type AnimatedCounterProps = {
  /** Final value, e.g. 4 or 40. */
  value: number
  /** e.g. " weeks", "+", "-year". */
  suffix?: string
  /** e.g. "£", "under ". */
  prefix?: string
  /** Count-up duration in seconds. */
  duration?: number
  className?: string
}

/**
 * Counts up from 0 to `value` the first time it scrolls into view.
 * Respects prefers-reduced-motion (renders the final value immediately).
 * Style via `className` — typically a big font-display number.
 */
export function AnimatedCounter({
  value,
  suffix = '',
  prefix = '',
  duration = 1.6,
  className,
}: AnimatedCounterProps) {
  const ref = useRef<HTMLSpanElement>(null)
  const inView = useInView(ref, { once: true, margin: '0px 0px -10% 0px' })
  const reducedMotion = useReducedMotion()
  const [display, setDisplay] = useState(0)

  useEffect(() => {
    if (!inView || reducedMotion) return
    const controls = animate(0, value, {
      duration,
      ease: [0.16, 1, 0.3, 1],
      onUpdate: (latest) => setDisplay(Math.round(latest)),
    })
    return () => controls.stop()
  }, [inView, reducedMotion, value, duration])

  const shown = reducedMotion ? value : display

  return (
    <span ref={ref} className={className}>
      {prefix}
      {shown.toLocaleString('en-GB')}
      {suffix}
    </span>
  )
}

export default AnimatedCounter
