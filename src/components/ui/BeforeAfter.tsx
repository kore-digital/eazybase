'use client'

import Image from 'next/image'
import { useId, useState } from 'react'

type BeforeAfterProps = {
  beforeSrc: string
  afterSrc: string
  beforeAlt?: string
  afterAlt?: string
  /** Tailwind aspect classes — defaults to 4:3. */
  aspectClassName?: string
  /** Initial slider position, 0–100. */
  initial?: number
  className?: string
}

/**
 * Before/after image comparison slider. Clip-path reveal driven by an
 * invisible full-size range input, so pointer drag AND keyboard (arrow keys)
 * both work natively. The handle grip is a skewed parallelogram — the brand
 * block motif.
 */
export function BeforeAfter({
  beforeSrc,
  afterSrc,
  beforeAlt = 'Before',
  afterAlt = 'After',
  aspectClassName = 'aspect-[4/3]',
  initial = 50,
  className = '',
}: BeforeAfterProps) {
  const [position, setPosition] = useState(initial)
  const labelId = useId()

  return (
    <div
      className={[
        'group relative w-full overflow-hidden rounded-lg select-none focus-within:ring-2 focus-within:ring-brand-500 focus-within:ring-offset-2',
        aspectClassName,
        className,
      ].join(' ')}
    >
      {/* After (base layer) */}
      <Image src={afterSrc} alt={afterAlt} fill sizes="(min-width: 768px) 50vw, 100vw" className="object-cover" />

      {/* Before (clipped from the right) */}
      <div className="absolute inset-0" style={{ clipPath: `inset(0 ${100 - position}% 0 0)` }}>
        <Image
          src={beforeSrc}
          alt={beforeAlt}
          fill
          sizes="(min-width: 768px) 50vw, 100vw"
          className="object-cover"
        />
      </div>

      {/* Divider + parallelogram grip */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-y-0 z-10 w-0.5 -translate-x-1/2 bg-white shadow-[0_0_12px_rgba(0,0,0,0.4)]"
        style={{ left: `${position}%` }}
      >
        <span className="absolute top-1/2 left-1/2 flex h-8 w-11 -translate-x-1/2 -translate-y-1/2 -skew-x-[18deg] items-center justify-center gap-1 rounded-sm bg-brand-500 shadow-md transition-transform duration-200 group-hover:scale-110">
          <span className="block h-3.5 w-0.5 skew-x-[18deg] bg-white/90" />
          <span className="block h-3.5 w-0.5 skew-x-[18deg] bg-white/90" />
        </span>
      </div>

      {/* Corner labels */}
      <span
        aria-hidden="true"
        className="absolute top-3 left-3 z-10 rounded-sm bg-ink-950/70 px-2 py-1 font-display text-[11px] font-semibold tracking-[0.15em] text-white uppercase"
      >
        Before
      </span>
      <span
        aria-hidden="true"
        className="absolute top-3 right-3 z-10 rounded-sm bg-brand-500/90 px-2 py-1 font-display text-[11px] font-semibold tracking-[0.15em] text-ink-950 uppercase"
      >
        After
      </span>

      {/* Invisible range input: full-surface pointer drag + keyboard access */}
      <label id={labelId} className="sr-only">
        Compare before and after — slide to reveal
      </label>
      <input
        type="range"
        min={0}
        max={100}
        step={1}
        value={position}
        onChange={(e) => setPosition(Number(e.target.value))}
        aria-labelledby={labelId}
        aria-valuetext={`${position}% before, ${100 - position}% after`}
        className="absolute inset-0 z-20 h-full w-full cursor-ew-resize appearance-none bg-transparent opacity-0 [&::-webkit-slider-thumb]:h-full [&::-webkit-slider-thumb]:w-6 [&::-webkit-slider-thumb]:appearance-none"
      />
    </div>
  )
}

export default BeforeAfter
