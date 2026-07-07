'use client'

import { useState } from 'react'

/** Projected visitor point in SVG coordinates. */
export type MapPoint = { name: string; count: number; x: number; y: number }

const CSS = `
@keyframes ebPulse { 0% { transform: scale(0.4); opacity: 0.55 } 100% { transform: scale(2.8); opacity: 0 } }
.eb-pulse { transform-box: fill-box; transform-origin: center; animation: ebPulse 2.4s ease-out infinite; }
@keyframes ebPop { from { opacity: 0; transform: translateY(6px) } to { opacity: 1; transform: translateY(0) } }
.eb-mk { animation: ebPop 0.5s ease both; }
.eb-mk:hover .eb-pill { transform: translateY(-2px); }
.eb-pill { transition: transform 0.15s ease; }
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
  const total = points.reduce((a, p) => a + p.count, 0) || 1
  // Draw larger counts last so their pills sit on top.
  const order = points.map((_, i) => i).sort((a, b) => points[a].count - points[b].count)

  return (
    <svg
      viewBox={`0 0 ${width} ${height}`}
      style={{ width: '100%', height: 'auto', display: 'block' }}
      role="img"
      aria-label="World map of visitor locations"
    >
      <style>{CSS}</style>
      <defs>
        <filter id="ebPillShadow" x="-30%" y="-30%" width="160%" height="200%">
          <feDropShadow dx="0" dy="1.5" stdDeviation="2" floodColor="#0b1220" floodOpacity="0.28" />
        </filter>
      </defs>

      {/* land */}
      {countries.map((d, i) => (
        <path key={i} d={d} fill="var(--theme-elevation-200)" stroke="var(--theme-elevation-50)" strokeWidth={0.5} />
      ))}

      {/* markers */}
      {order.map((idx) => {
        const p = points[idx]
        const label = String(p.count.toLocaleString('en-GB'))
        const pillW = 30 + label.length * 8.5
        const isHover = hover === idx
        return (
          <g
            key={idx}
            className="eb-mk"
            style={{ cursor: 'pointer' }}
            onMouseEnter={() => setHover(idx)}
            onMouseLeave={() => setHover(null)}
          >
            {/* pulse + location dot */}
            <circle cx={p.x} cy={p.y} r={8} className="eb-pulse" fill="#96c11f" />
            <circle cx={p.x} cy={p.y} r={4.5} fill="#6f9e14" stroke="#fff" strokeWidth={1.5} />

            {/* count pill with pointer, above the dot */}
            <g className="eb-pill" transform={`translate(${p.x}, ${p.y - 12})`} filter="url(#ebPillShadow)">
              <path
                d={`M ${-pillW / 2} ${-24}
                    h ${pillW} a 6 6 0 0 1 6 6 v 12 a 6 6 0 0 1 -6 6
                    h ${-(pillW / 2 - 5)} l -5 6 l -5 -6
                    h ${-(pillW / 2 - 5)} a 6 6 0 0 1 -6 -6 v -12 a 6 6 0 0 1 6 -6 z`}
                fill="#fff"
              />
              <circle cx={-pillW / 2 + 12} cy={-12} r={3.5} fill="#96c11f" />
              <text x={-pillW / 2 + 21} y={-8} fontSize={12} fontWeight={700} fill="#1e293b">
                {label}
              </text>
            </g>

            {/* hover tooltip */}
            {isHover
              ? (() => {
                  const name = p.name || 'Unknown'
                  const sub = `${label} visit${p.count === 1 ? '' : 's'} · ${Math.round((p.count / total) * 100)}%`
                  const w = Math.max(name.length, sub.length) * 7 + 24
                  const tx = Math.min(Math.max(p.x - w / 2, 6), width - w - 6)
                  return (
                    <g transform={`translate(${tx}, ${p.y + 16})`} pointerEvents="none">
                      <rect width={w} height={46} rx={8} fill="#0f172a" opacity={0.97} />
                      <text x={12} y={20} fontSize={13} fontWeight={700} fill="#fff">{name}</text>
                      <text x={12} y={37} fontSize={11.5} fill="rgba(255,255,255,0.78)">{sub}</text>
                    </g>
                  )
                })()
              : null}
          </g>
        )
      })}
    </svg>
  )
}

export default VisitorMapClient
