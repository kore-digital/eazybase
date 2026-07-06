import type { ReactNode } from 'react'

import type { ExtensionTypeKey } from '@/components/quote/pricing'

/**
 * Small illustrated icons for the instant-quote type cards, drawn in the
 * brand's angled-modular-block style: every icon sits on a skewed base
 * block (the logo's parallelogram module) with a simple line glyph on top.
 * Pure presentational SVG — decorative, cards carry their own text labels.
 */

const GREEN = 'var(--color-brand-500)'
const GREEN_LIGHT = 'var(--color-brand-300)'
const INK = 'var(--color-ink-700)'

function Blocks() {
  // Shared angled-block plinth — echoes the logo modules.
  return (
    <g>
      <path d="M10 50 14 42 30 42 26 50 Z" fill={GREEN} />
      <path d="M28 50 32 42 46 42 42 50 Z" fill={GREEN_LIGHT} />
      <path d="M44 50 48 42 54 42 50 50 Z" fill={INK} opacity="0.55" />
    </g>
  )
}

const glyphStroke = {
  stroke: INK,
  strokeWidth: 2.5,
  strokeLinecap: 'round' as const,
  strokeLinejoin: 'round' as const,
  fill: 'none',
}

const GLYPHS: Record<ExtensionTypeKey, ReactNode> = {
  kitchen: (
    <g {...glyphStroke}>
      {/* pan on a hob */}
      <path d="M18 30 h20 v6 h-20 Z" />
      <path d="M38 32 h6" />
      <path d="M22 24 c0 -3 3 -3 3 -6 M30 24 c0 -3 3 -3 3 -6" stroke={GREEN} />
    </g>
  ),
  'dining-room': (
    <g {...glyphStroke}>
      {/* table + two chairs */}
      <path d="M20 28 h24 M24 28 v8 M40 28 v8" />
      <path d="M15 22 v14 M49 22 v14" stroke={GREEN} />
    </g>
  ),
  'home-office': (
    <g {...glyphStroke}>
      {/* monitor on a desk */}
      <rect x="22" y="16" width="20" height="13" rx="1.5" />
      <path d="M32 29 v4 M26 33 h12" />
      <path d="M27 22 l4 0" stroke={GREEN} />
    </g>
  ),
  playroom: (
    <g {...glyphStroke}>
      {/* stacked toy blocks + ball */}
      <rect x="20" y="26" width="9" height="9" />
      <rect x="24" y="16" width="9" height="9" stroke={GREEN} />
      <circle cx="42" cy="30" r="5" />
    </g>
  ),
  'garden-room': (
    <g {...glyphStroke}>
      {/* little tree beside a window wall */}
      <path d="M20 35 v-16 h12 v16" />
      <path d="M26 19 v16" />
      <circle cx="42" cy="22" r="6" stroke={GREEN} />
      <path d="M42 28 v7" />
    </g>
  ),
  other: (
    <g {...glyphStroke}>
      {/* open plus — anything you like */}
      <path d="M32 16 v18 M23 25 h18" stroke={GREEN} />
    </g>
  ),
}

export function TypeIcon({ type, className }: { type: ExtensionTypeKey; className?: string }) {
  return (
    <svg viewBox="0 0 64 56" className={className} aria-hidden="true" focusable="false">
      <Blocks />
      {GLYPHS[type]}
    </svg>
  )
}

export default TypeIcon
