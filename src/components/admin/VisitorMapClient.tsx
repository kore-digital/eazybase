'use client'

import { useEffect, useRef, useState } from 'react'

/** Projected visitor point in SVG coordinates. */
export type MapPoint = { name: string; count: number; x: number; y: number }

const CSS = `
@keyframes ebPulse { 0% { transform: scale(0.4); opacity: 0.55 } 100% { transform: scale(2.8); opacity: 0 } }
.eb-pulse { transform-box: fill-box; transform-origin: center; animation: ebPulse 2.4s ease-out infinite; }
@keyframes ebPop { from { opacity: 0; transform: translateY(6px) } to { opacity: 1; transform: translateY(0) } }
.eb-mk { animation: ebPop 0.5s ease both; }
.eb-mk:hover .eb-pill { transform: translateY(-2px); }
.eb-pill { transition: transform 0.15s ease; }
.eb-zbtn { -webkit-tap-highlight-color: transparent; }
`

const MIN_K = 1
// High cap so tightly-clustered towns (e.g. UK cities ~30km apart, sub-pixel on
// a world map at 1x) can be zoomed apart until their pins separate.
const MAX_K = 80
const BTN_STEP = 2

type Transform = { k: number; x: number; y: number }

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
  const [t, setT] = useState<Transform>({ k: 1, x: 0, y: 0 })
  const svgRef = useRef<SVGSVGElement | null>(null)
  const pointers = useRef<Map<number, { x: number; y: number }>>(new Map())
  const gesture = useRef<{ single?: { x: number; y: number }; dist?: number; mid?: { x: number; y: number } }>({})
  const moved = useRef(false)

  const total = points.reduce((a, p) => a + p.count, 0) || 1
  // Draw larger counts last so their pills sit on top.
  const order = points.map((_, i) => i).sort((a, b) => points[a].count - points[b].count)

  /** Keep the scaled map covering the frame — no panning into empty space. */
  const clamp = (tr: Transform): Transform => {
    const k = Math.max(MIN_K, Math.min(MAX_K, tr.k))
    const x = Math.max(width - width * k, Math.min(0, tr.x))
    const y = Math.max(height - height * k, Math.min(0, tr.y))
    return { k, x, y }
  }

  /** Zoom by `factor` keeping the focal SVG point fixed on screen. */
  const zoomAt = (fx: number, fy: number, factor: number) =>
    setT((prev) => {
      const k = Math.max(MIN_K, Math.min(MAX_K, prev.k * factor))
      const a = k / prev.k
      return clamp({ k, x: fx - (fx - prev.x) * a, y: fy - (fy - prev.y) * a })
    })

  /** Client (px) → SVG viewBox coords. */
  const toSvg = (cx: number, cy: number) => {
    const r = svgRef.current?.getBoundingClientRect()
    if (!r) return { x: cx, y: cy, sx: 1, sy: 1 }
    return { x: ((cx - r.left) / r.width) * width, y: ((cy - r.top) / r.height) * height, sx: width / r.width, sy: height / r.height }
  }

  // Non-passive wheel listener so we can zoom without scrolling the page.
  useEffect(() => {
    const svg = svgRef.current
    if (!svg) return
    const onWheel = (e: WheelEvent) => {
      e.preventDefault()
      const f = toSvg(e.clientX, e.clientY)
      zoomAt(f.x, f.y, Math.exp(-e.deltaY * 0.0015))
    }
    svg.addEventListener('wheel', onWheel, { passive: false })
    return () => svg.removeEventListener('wheel', onWheel)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [width, height])

  function onPointerDown(e: React.PointerEvent<SVGSVGElement>) {
    ;(e.target as Element).setPointerCapture?.(e.pointerId)
    pointers.current.set(e.pointerId, { x: e.clientX, y: e.clientY })
    gesture.current = {}
    moved.current = false
  }

  function onPointerMove(e: React.PointerEvent<SVGSVGElement>) {
    if (!pointers.current.has(e.pointerId)) return
    pointers.current.set(e.pointerId, { x: e.clientX, y: e.clientY })
    const pts = [...pointers.current.values()]
    const r = svgRef.current?.getBoundingClientRect()
    if (!r) return
    const sx = width / r.width
    const sy = height / r.height

    if (pts.length === 1) {
      const p = pts[0]
      if (gesture.current.single) {
        const dx = (p.x - gesture.current.single.x) * sx
        const dy = (p.y - gesture.current.single.y) * sy
        if (Math.abs(dx) + Math.abs(dy) > 1) moved.current = true
        setT((prev) => clamp({ ...prev, x: prev.x + dx, y: prev.y + dy }))
      }
      gesture.current.single = p
      gesture.current.dist = undefined
    } else if (pts.length >= 2) {
      moved.current = true
      const [a, b] = pts
      const dist = Math.hypot(a.x - b.x, a.y - b.y)
      const mid = { x: (a.x + b.x) / 2, y: (a.y + b.y) / 2 }
      if (gesture.current.dist && gesture.current.mid) {
        const factor = dist / gesture.current.dist
        const f = toSvg(mid.x, mid.y)
        const panX = (mid.x - gesture.current.mid.x) * sx
        const panY = (mid.y - gesture.current.mid.y) * sy
        setT((prev) => {
          const k = Math.max(MIN_K, Math.min(MAX_K, prev.k * factor))
          const g = k / prev.k
          return clamp({ k, x: f.x - (f.x - prev.x) * g + panX, y: f.y - (f.y - prev.y) * g + panY })
        })
      }
      gesture.current.dist = dist
      gesture.current.mid = mid
      gesture.current.single = undefined
    }
  }

  function onPointerUp(e: React.PointerEvent<SVGSVGElement>) {
    pointers.current.delete(e.pointerId)
    gesture.current = {}
  }

  const reset = () => setT({ k: 1, x: 0, y: 0 })

  return (
    <div style={{ position: 'relative', touchAction: 'none' }}>
      <svg
        ref={svgRef}
        viewBox={`0 0 ${width} ${height}`}
        style={{ width: '100%', height: 'auto', display: 'block', touchAction: 'none', cursor: t.k > 1 ? 'grab' : 'default' }}
        role="img"
        aria-label="World map of visitor locations"
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
        onPointerCancel={onPointerUp}
      >
        <style>{CSS}</style>
        <defs>
          <filter id="ebPillShadow" x="-30%" y="-30%" width="160%" height="200%">
            <feDropShadow dx="0" dy="1.5" stdDeviation="2" floodColor="#0b1220" floodOpacity="0.28" />
          </filter>
          <clipPath id="ebMapClip">
            <rect x="0" y="0" width={width} height={height} />
          </clipPath>
        </defs>

        <g clipPath="url(#ebMapClip)">
          {/* sea — fills the whole frame so pins over water still read as
              "on the map" rather than floating in the card's white padding. */}
          <rect x={0} y={0} width={width} height={height} fill="var(--eb-map-sea, #cddff2)" />

          {/* land — scales/pans as one layer */}
          <g transform={`translate(${t.x}, ${t.y}) scale(${t.k})`}>
            {countries.map((d, i) => (
              <path key={i} d={d} fill="var(--theme-elevation-200)" stroke="var(--theme-elevation-50)" strokeWidth={0.5 / t.k} />
            ))}
          </g>

          {/* markers — positions follow the transform, but glyphs stay a constant
              screen size so pins spread apart (not bloat) as you zoom in. */}
          {order.map((idx) => {
            const p = points[idx]
            const mx = t.x + p.x * t.k
            const my = t.y + p.y * t.k
            if (mx < -40 || my < -40 || mx > width + 40 || my > height + 40) return null
            const label = String(p.count.toLocaleString('en-GB'))
            const pillW = 30 + label.length * 8.5
            const isHover = hover === idx
            return (
              // Outer group holds the position (attribute). The inner .eb-mk group
              // carries the pop/hover animation — keeping the CSS `transform`
              // animation OFF the positioned element, or it would override the
              // translate and pile every marker at the SVG origin.
              <g key={idx} transform={`translate(${mx}, ${my})`}>
                <g
                  className="eb-mk"
                  style={{ cursor: 'pointer' }}
                  onMouseEnter={() => setHover(idx)}
                  onMouseLeave={() => setHover(null)}
                  onClick={() => {
                    if (!moved.current) setHover((h) => (h === idx ? null : idx))
                  }}
                >
                  {/* pulse + location dot */}
                  <circle cx={0} cy={0} r={8} className="eb-pulse" fill="#96c11f" />
                <circle cx={0} cy={0} r={4.5} fill="#6f9e14" stroke="#fff" strokeWidth={1.5} />

                {/* count pill with pointer, above the dot */}
                <g className="eb-pill" transform={`translate(0, ${-12})`} filter="url(#ebPillShadow)">
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

                {/* hover / tap tooltip */}
                {isHover
                  ? (() => {
                      const name = p.name || 'Unknown'
                      const sub = `${label} visit${p.count === 1 ? '' : 's'} · ${Math.round((p.count / total) * 100)}%`
                      const w = Math.max(name.length, sub.length) * 7 + 24
                      const tx = Math.min(Math.max(-w / 2, 6 - mx), width - w - 6 - mx)
                      return (
                        <g transform={`translate(${tx}, ${16})`} pointerEvents="none">
                          <rect width={w} height={46} rx={8} fill="#0f172a" opacity={0.97} />
                          <text x={12} y={20} fontSize={13} fontWeight={700} fill="#fff">{name}</text>
                          <text x={12} y={37} fontSize={11.5} fill="rgba(255,255,255,0.78)">{sub}</text>
                        </g>
                      )
                    })()
                  : null}
                </g>
              </g>
            )
          })}
        </g>
      </svg>

      {/* Zoom controls */}
      <div style={{ position: 'absolute', right: 8, bottom: 8, display: 'flex', flexDirection: 'column', gap: 6 }}>
        <ZoomBtn label="Zoom in" onTap={() => zoomAt(width / 2, height / 2, BTN_STEP)}>+</ZoomBtn>
        <ZoomBtn label="Zoom out" onTap={() => zoomAt(width / 2, height / 2, 1 / BTN_STEP)}>−</ZoomBtn>
        {t.k > 1 ? (
          <ZoomBtn label="Reset zoom" onTap={reset} small>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round">
              <path d="M3 12a9 9 0 1 0 3-6.7L3 8" />
              <path d="M3 3v5h5" />
            </svg>
          </ZoomBtn>
        ) : null}
      </div>
    </div>
  )
}

function ZoomBtn({
  children,
  onTap,
  label,
  small,
}: {
  children: React.ReactNode
  onTap: () => void
  label: string
  small?: boolean
}) {
  return (
    <button
      type="button"
      aria-label={label}
      onClick={onTap}
      className="eb-zbtn"
      style={{
        width: 34,
        height: 34,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        borderRadius: 10,
        border: '1px solid rgba(15,23,42,0.10)',
        background: 'rgba(255,255,255,0.94)',
        color: '#1e293b',
        fontSize: small ? 13 : 22,
        fontWeight: 700,
        lineHeight: 1,
        boxShadow: '0 1px 3px rgba(15,23,42,0.18)',
        cursor: 'pointer',
      }}
    >
      {children}
    </button>
  )
}

export default VisitorMapClient
