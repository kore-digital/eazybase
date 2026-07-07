/* eslint-disable @typescript-eslint/no-explicit-any */
import { geoMercator, geoPath } from 'd3-geo'
import { feature } from 'topojson-client'
import worldTopo from 'world-atlas/countries-110m.json'

import { VisitorMapClient, type MapPoint } from './VisitorMapClient'

/**
 * Full world map (all continents) with visitor pins. The geometry is computed
 * server-side (d3-geo + world-atlas never ship to the client); a thin client
 * layer adds the pulse + hover tooltip. The projection always shows the whole
 * world — pins land wherever the cities are.
 */
export type VisitorPoint = { name: string; lat: number; lng: number; count: number }

const W = 900
const H = 560
// World minus most of Antarctica / empty polar caps — gives the familiar flat map.
const WORLD_BOX = {
  type: 'Polygon',
  coordinates: [[[-180, -56], [180, -56], [180, 80], [-180, 80], [-180, -56]]],
} as any

export function VisitorMap({ points }: { points: VisitorPoint[] }) {
  const topo = worldTopo as any
  const world = feature(topo, topo.objects.countries) as any

  const projection = geoMercator().fitExtent(
    [
      [8, 8],
      [W - 8, H - 8],
    ],
    WORLD_BOX,
  )
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
