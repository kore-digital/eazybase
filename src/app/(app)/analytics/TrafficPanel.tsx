import React from 'react'

import { VisitorMap } from '@/components/admin/VisitorMap'
import type { TrafficData } from '@/lib/analytics-data'

import { BarRow, CHART_COLOURS, Empty, Panel, Tile } from './parts'

/** Prettify a top-page path for display. */
const pageLabel = (p: string) => (p === '/' || p === '' ? 'Home' : p)

export function TrafficPanel({ data }: { data: TrafficData }) {
  const maxPage = Math.max(1, ...data.pages.map((p) => p[1]))
  const maxCity = Math.max(1, ...data.cities.map((c) => c[1]))
  const maxClick = Math.max(1, ...data.clicks.map((c) => c.n))

  if (!data.configured) {
    return (
      <Panel title="Website traffic">
        <Empty>Analytics isn’t connected yet. Add the PostHog keys to start tracking.</Empty>
      </Panel>
    )
  }

  return (
    <div>
      <div className="grid grid-cols-2 gap-2.5">
        <Tile num={data.views.toLocaleString('en-GB')} label="Page views" tone="blue" />
        <Tile num={data.visitors.toLocaleString('en-GB')} label="Visitors" tone="purple" />
        <Tile num={data.clicks[0].n} label="WhatsApp clicks" tone="green" />
        <Tile num={data.clicks[1].n} label="Call clicks" tone="orange" />
        <Tile num={data.clicks[2].n} label="Quote page clicks" tone="teal" />
        <Tile num={data.clicks[3].n} label="Instant quote clicks" tone="dark" />
      </div>

      <Panel title="Top pages" sub="last 30 days">
        {data.pages.length === 0 ? (
          <Empty>No page views yet.</Empty>
        ) : (
          data.pages.map(([path, n], i) => (
            <BarRow key={path} label={pageLabel(path)} value={n} max={maxPage} color={CHART_COLOURS[i % CHART_COLOURS.length]} />
          ))
        )}
      </Panel>

      <Panel title="Button clicks" sub="last 30 days">
        {data.clicks.map((c, i) => (
          <BarRow key={c.label} label={c.label} value={c.n} max={maxClick} color={CHART_COLOURS[i % CHART_COLOURS.length]} />
        ))}
      </Panel>

      <Panel title="Where visitors are" sub="top cities">
        {data.cities.length === 0 ? (
          <Empty>No visitor locations yet.</Empty>
        ) : (
          data.cities.slice(0, 6).map(([city, n], i) => (
            <BarRow key={city} label={city} value={n} max={maxCity} color={CHART_COLOURS[i % CHART_COLOURS.length]} />
          ))
        )}
      </Panel>

      {data.points.length > 0 ? (
        <Panel title="Visitor map" sub="last 30 days">
          {/* Supply the admin theme vars the map uses for land/borders. */}
          <div
            className="overflow-hidden rounded-xl"
            style={{ ['--theme-elevation-200' as string]: '#e2e8f0', ['--theme-elevation-50' as string]: '#f1f5f9' }}
          >
            <VisitorMap points={data.points} />
          </div>
        </Panel>
      ) : null}
    </div>
  )
}
