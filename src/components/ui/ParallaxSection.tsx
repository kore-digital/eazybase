'use client'

import Image from 'next/image'
import { motion, useReducedMotion, useScroll, useTransform } from 'motion/react'
import { useRef } from 'react'
import type { ReactNode } from 'react'

type ParallaxSectionProps = {
  /** Background image (public path or imported asset URL). */
  src: string
  alt?: string
  /** Overlay content — headings, CTA etc. sit above the scrim. */
  children?: ReactNode
  /** Tailwind height classes for the band. */
  heightClassName?: string
  className?: string
}

/**
 * Full-bleed image section break with gentle parallax (max ~10% translate).
 * The image gets a charcoal scrim so overlaid text stays legible. Motion is
 * skipped entirely when the user prefers reduced motion.
 */
export function ParallaxSection({
  src,
  alt = '',
  children,
  heightClassName = 'min-h-[50vh] md:min-h-[60vh]',
  className = '',
}: ParallaxSectionProps) {
  const ref = useRef<HTMLElement>(null)
  const reducedMotion = useReducedMotion()

  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ['start end', 'end start'],
  })
  // Image is 20% taller than the band; slide it within the overflow (≤10%).
  const y = useTransform(scrollYProgress, [0, 1], ['-10%', '10%'])

  return (
    <section
      ref={ref}
      className={['relative isolate flex items-center overflow-hidden', heightClassName, className].join(' ')}
    >
      <motion.div
        aria-hidden={alt === ''}
        style={reducedMotion ? undefined : { y }}
        className="absolute inset-x-0 -top-[10%] -z-10 h-[120%]"
      >
        <Image src={src} alt={alt} fill sizes="100vw" className="object-cover" />
      </motion.div>

      {/* Charcoal scrim for legibility */}
      <div
        aria-hidden="true"
        className="absolute inset-0 -z-10 bg-gradient-to-t from-ink-950/80 via-ink-950/50 to-ink-950/30"
      />

      {children ? <div className="eb-container relative py-20 text-white">{children}</div> : null}
    </section>
  )
}

export default ParallaxSection
