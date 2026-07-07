'use client'

import { useState } from 'react'

/** Projected visitor point in SVG coordinates. */
export type MapPoint = { name: string; count: number; x: number; y: number }

const CSS = `
@keyframes ebPulse { 0% { transform: scale(0.5); opacity: 0.5 } 100% { transform: scale(2.6); opacity: 0 } }
.eb-pulse { transform-box: fill-box; transform-origin: center; animation: ebPulse 2.4s ease-out infinite; }
@keyframes ebPop { from { opacity: 0; transform: translateY(4px) } to { opacity: 1; transform: translateY(0) } }
.eb-point { animation: ebPop 0.5s ease both; }
`

export function VisitorMapClient({
  width,
  height,
  countries,
  points,
}: {
  width: number
  height: number
  countries: string[]
  points: MapPoint[]
}) {
  const [hover, setHover] = useState<number | null>(null)
  const max = Math.max(1, ...points.map((p) => p.count))
  const total = points.reduce((a, p) => a + p.count, 0) || 1

  return (
    <svg
      viewBox={`0 0 ${width} ${height}`}
      style={{ width: '100%', height: 'auto', display: 'block', borderRadius: 12, background: 'var(--theme-elevation-50)' }}
      role="img"
      aria-label="Map of visitor locations"
    >
      <style>{CSS}</style>

      {/* land */}
      {countries.map((d, i) => (
        <path key={i} d={d} fill="var(--theme-elevation-150)" stroke="var(--theme-elevation-50)" strokeWidth={0.6} />
      ))}

      {/* points: pulse + dot + count pill */}
      {points.map((p, i) => {
        const r = 4 + (p.count / max) * 9
        const pillW = 20 + String(p.count).length * 8
        return (
          <g
            key={i}
            className="eb-point"
            style={{ animationDelay: `${i * 0.08}s`, cursor: 'pointer' }}
            onMouseEnter={() => setHover(i)}
            onMouseLeave={() => setHover(null)}
          >
            <circle cx={p.x} cy={p.y} r={r} className="eb-pulse" style={{ animationDelay: `${i * 0.3}s` }} fill="#96c11f" />
            <circle cx={p.x} cy={p.y} r={5} fill="#6f9e14" stroke="#fff" strokeWidth={1.6} />
            {/* count pill above the dot */}
            <g transform={`translate(${p.x - pillW / 2}, ${p.y - r - 26})`}>
              <rect width={pillW} height={20} rx={10} fill="var(--theme-elevation-0)" stroke="var(--theme-elevation-150)" strokeWidth={1} />
              <circle cx={11} cy={10} r={3} fill="#96c11f" />
              <text x={19} y={14} fontSize={11} fontWeight={700} fill="var(--theme-elevation-800)">
                {p.count.toLocaleString('en-GB')}
              </text>
            </g>
          </g>
        )
      })}

      {/* hover tooltip (drawn last so it's on top) */}
      {hover !== null &&
        (() => {
          const p = points[hover]
          const label = `${p.name || 'Unknown'}`
          const sub = `${p.count.toLocaleString('en-GB')} visit${p.count === 1 ? '' : 's'} · ${Math.round((p.count / total) * 100)}%`
          const w = Math.max(label.length, sub.length) * 7 + 24
          const tx = Math.min(Math.max(p.x - w / 2, 6), width - w - 6)
          const ty = p.y + 14
          return (
            <g transform={`translate(${tx}, ${ty})`} pointerEvents="none">
              <rect width={w} height={44} rx={8} fill="var(--theme-elevation-900)" opacity={0.96} />
              <text x={12} y={19} fontSize={12} fontWeight={700} fill="#fff">{label}</text>
              <text x={12} y={35} fontSize={11} fill="rgba(255,255,255,0.75)">{sub}</text>
            </g>
          )
        })()}
    </svg>
  )
}

export default VisitorMapClient
