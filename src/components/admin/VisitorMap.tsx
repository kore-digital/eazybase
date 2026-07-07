/* eslint-disable @typescript-eslint/no-explicit-any */
import { geoMercator, geoPath } from 'd3-geo'
import { feature } from 'topojson-client'
import worldTopo from 'world-atlas/countries-110m.json'

/**
 * Server-rendered SVG world map with brand-green dots at visitor cities (sized
 * by visits). The projection auto-fits to wherever the visitors are — so a
 * UK-only audience zooms to the UK — with a UK default when there's no data.
 * All inline SVG: no client JS, no external tiles (admin CSP-safe).
 */
export type VisitorPoint = { name: string; lat: number; lng: number; count: number }

const W = 640
const H = 380

export function VisitorMap({ points }: { points: VisitorPoint[] }) {
  const topo = worldTopo as any
  const world = feature(topo, topo.objects.countries) as any
  const valid = points.filter((p) => Number.isFinite(p.lat) && Number.isFinite(p.lng))

  const projection = geoMercator()
  if (valid.length >= 2) {
    projection.fitExtent(
      [
        [36, 30],
        [W - 36, H - 30],
      ],
      { type: 'MultiPoint', coordinates: valid.map((p) => [p.lng, p.lat]) } as any,
    )
    if (projection.scale() > 2600) {
      const mLng = valid.reduce((a, p) => a + p.lng, 0) / valid.length
      const mLat = valid.reduce((a, p) => a + p.lat, 0) / valid.length
      projection.scale(2600).center([mLng, mLat]).translate([W / 2, H / 2])
    }
  } else if (valid.length === 1) {
    projection.center([valid[0].lng, valid[0].lat]).scale(1800).translate([W / 2, H / 2])
  } else {
    projection.center([-2, 54]).scale(1300).translate([W / 2, H / 2])
  }

  const path = geoPath(projection)
  const maxCount = Math.max(1, ...valid.map((p) => p.count))

  return (
    <svg
      viewBox={`0 0 ${W} ${H}`}
      style={{ width: '100%', height: 'auto', display: 'block', borderRadius: 12 }}
      role="img"
      aria-label="Map of visitor locations"
    >
      <rect width={W} height={H} fill="var(--theme-elevation-50)" />
      {world.features.map((f: any, i: number) => (
        <path key={i} d={path(f) ?? ''} fill="var(--theme-elevation-100)" stroke="var(--theme-elevation-200)" strokeWidth={0.5} />
      ))}
      {valid.map((p, i) => {
        const xy = projection([p.lng, p.lat])
        if (!xy) return null
        const r = 5 + (p.count / maxCount) * 13
        return (
          <g key={i}>
            <circle cx={xy[0]} cy={xy[1]} r={r} fill="#96c11f" fillOpacity={0.4} />
            <circle cx={xy[0]} cy={xy[1]} r={3.2} fill="#6f9e14" />
          </g>
        )
      })}
    </svg>
  )
}

export default VisitorMap
