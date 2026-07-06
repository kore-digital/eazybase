'use client'

import { animate, useInView } from 'motion/react'
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
  const [display, setDisplay] = useState(0)

  // Reduced motion is only consulted post-mount (inside the effect): the SSR
  // HTML and the first client render both show 0, so the tree always
  // hydrates cleanly; reduced-motion users then jump straight to the value.
  useEffect(() => {
    if (!inView) return
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      setDisplay(value)
      return
    }
    const controls = animate(0, value, {
      duration,
      ease: [0.16, 1, 0.3, 1],
      onUpdate: (latest) => setDisplay(Math.round(latest)),
    })
    return () => controls.stop()
  }, [inView, value, duration])

  const shown = display

  return (
    <span ref={ref} className={className}>
      {prefix}
      {shown.toLocaleString('en-GB')}
      {suffix}
    </span>
  )
}

export default AnimatedCounter
