/* eslint-disable @typescript-eslint/no-explicit-any */
import { geoMercator, geoPath } from 'd3-geo'
import { feature } from 'topojson-client'
// 50m (vs 110m) gives a clean UK coastline at this zoom. Parsed server-side
// only — it never ships to the client bundle.
import worldTopo from 'world-atlas/countries-50m.json'

import { VisitorMapClient, type MapPoint } from './VisitorMapClient'

/**
 * UK-focused map with visitor pins. Geometry is computed server-side (d3-geo +
 * world-atlas never ship to the client); a thin client layer adds the pulse,
 * hover tooltip and pinch/zoom. The default view frames the British Isles (with
 * Ireland + a sliver of NW Europe for context) so UK towns — which would be
 * sub-pixel on a world map — sit far enough apart to read. Pinch to zoom in
 * further; visitors outside the frame still appear in the "top cities" list.
 */
export type VisitorPoint = { name: string; lat: number; lng: number; count: number }

const W = 700
const H = 760
// British Isles + margin: lon [-11, 4], lat [49.5, 61].
const UK_BOX = {
  type: 'Polygon',
  coordinates: [[[-11, 49.5], [4, 49.5], [4, 61], [-11, 61], [-11, 49.5]]],
} as any

export function VisitorMap({ points }: { points: VisitorPoint[] }) {
  const topo = worldTopo as any
  const world = feature(topo, topo.objects.countries) as any

  const projection = geoMercator().fitExtent(
    [
      [8, 8],
      [W - 8, H - 8],
    ],
    UK_BOX,
  )
  // Clip geometry to the frame so far-off countries don't emit huge off-canvas
  // path strings into the server-rendered HTML. (Zoom only goes inward from
  // here, so nothing beyond the frame is ever revealed.)
  projection.clipExtent([
    [0, 0],
    [W, H],
  ])
  const path = geoPath(projection)
  const countries: string[] = world.features.map((f: any) => path(f) ?? '').filter(Boolean)

  const projected: MapPoint[] = points
    .filter((p) => Number.isFinite(p.lat) && Number.isFinite(p.lng))
    .map((p) => {
      const xy = projection([p.lng, p.lat])
      return xy ? { name: p.name, count: p.count, x: xy[0], y: xy[1] } : null
    })
    .filter((p): p is MapPoint => p !== null)

  return <VisitorMapClient width={W} height={H} countries={countries} points={projected} />
}

export default VisitorMap
