/* eslint-disable @typescript-eslint/no-explicit-any */
import { geoMercator, geoPath } from 'd3-geo'
import { feature } from 'topojson-client'
import worldTopo from 'world-atlas/countries-110m.json'

import { VisitorMapClient, type MapPoint } from './VisitorMapClient'

/**
 * Computes the world map paths + projects visitor cities to SVG coordinates
 * (server-side, so d3-geo/world-atlas never ship to the client), then hands the
 * result to a thin client layer that adds the pulse animation + hover tooltips.
 * The projection auto-fits to where the visitors are (UK default when empty).
 */
export type VisitorPoint = { name: string; lat: number; lng: number; count: number }

const W = 720
const H = 420

export function VisitorMap({ points }: { points: VisitorPoint[] }) {
  const topo = worldTopo as any
  const world = feature(topo, topo.objects.countries) as any
  const valid = points.filter((p) => Number.isFinite(p.lat) && Number.isFinite(p.lng))

  const projection = geoMercator()
  if (valid.length >= 2) {
    projection.fitExtent(
      [
        [48, 54],
        [W - 48, H - 40],
      ],
      { type: 'MultiPoint', coordinates: valid.map((p) => [p.lng, p.lat]) } as any,
    )
    if (projection.scale() > 2400) {
      const mLng = valid.reduce((a, p) => a + p.lng, 0) / valid.length
      const mLat = valid.reduce((a, p) => a + p.lat, 0) / valid.length
      projection.scale(2400).center([mLng, mLat]).translate([W / 2, H / 2])
    }
  } else if (valid.length === 1) {
    projection.center([valid[0].lng, valid[0].lat]).scale(1700).translate([W / 2, H / 2])
  } else {
    projection.center([-2, 54]).scale(1200).translate([W / 2, H / 2])
  }

  const path = geoPath(projection)
  const countries: string[] = world.features.map((f: any) => path(f) ?? '').filter(Boolean)

  const projected: MapPoint[] = valid
    .map((p) => {
      const xy = projection([p.lng, p.lat])
      return xy ? { name: p.name, count: p.count, x: xy[0], y: xy[1] } : null
    })
    .filter((p): p is MapPoint => p !== null)

  return <VisitorMapClient width={W} height={H} countries={countries} points={projected} />
}

export default VisitorMap
