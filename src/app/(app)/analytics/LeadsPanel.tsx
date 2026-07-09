import React from 'react'

import { STATUS_LABELS, type LeadsBoard, type LeadsData } from '@/lib/analytics-data'

import { LeadsManager } from './LeadsManager'
import { PushSetup } from './PushSetup'
import { BarRow, CHART_COLOURS, Empty, Panel, Tile } from './parts'

const TYPE_LABELS: Record<string, string> = {
  full: 'Full quote',
  instant: 'Instant quote',
  assistant: 'Quote assistant',
}

export function LeadsPanel({
  data,
  board,
  newSince,
}: {
  data: LeadsData
  board: LeadsBoard
  newSince: number
}) {
  const maxMonth = Math.max(1, ...data.monthly.map((m) => m.count))
  const maxTown = Math.max(1, ...data.towns.map((t) => t[1]))
  const maxType = Math.max(1, ...data.byType.map((t) => t[1]))
  const maxStatus = Math.max(1, ...data.byStatus.map((s) => s[1]))

  return (
    <div>
      {/* Stat tiles */}
      <div className="grid grid-cols-3 gap-2.5">
        <Tile num={board.openCount} label="Open leads" tone="purple" />
        <Tile num={board.dueFollowUps.length} label="Chases due" tone="orange" />
        <Tile num={data.avgEstimate ? `£${(data.avgEstimate / 1000).toFixed(0)}k` : '—'} label="Avg estimate" tone="dark" />
      </div>

      {/* Alerts opt-in */}
      <PushSetup />

      {/* The working list */}
      <div className="mt-3">
        <LeadsManager board={board} newSince={newSince} />
      </div>

      {/* ── Insights (date-range applies below) ────────────────────────────── */}
      <div className="mt-6 mb-1 flex items-center gap-2">
        <h2 className="font-display text-[13px] font-bold uppercase tracking-wide text-ink-400">Insights</h2>
        <span className="text-[11px] text-ink-300">for the selected dates</span>
      </div>

      <Panel title="Leads over time">
        {data.total === 0 ? (
          <Empty>No leads yet — they’ll chart here as quotes come in.</Empty>
        ) : (
          data.monthly.map((m) => <BarRow key={m.label} label={m.label} value={m.count} max={maxMonth} />)
        )}
      </Panel>

      <Panel title="Top towns" sub="where leads come from">
        {data.towns.length === 0 ? (
          <Empty>No lead locations yet.</Empty>
        ) : (
          data.towns.map(([town, n], i) => (
            <BarRow key={town} label={town} value={n} max={maxTown} color={CHART_COLOURS[i % CHART_COLOURS.length]} />
          ))
        )}
      </Panel>

      <Panel title="Quote source">
        {data.byType.length === 0 ? (
          <Empty>No quotes yet.</Empty>
        ) : (
          data.byType.map(([type, n], i) => (
            <BarRow key={type} label={TYPE_LABELS[type] ?? type} value={n} max={maxType} color={CHART_COLOURS[i % CHART_COLOURS.length]} />
          ))
        )}
      </Panel>

      <Panel title="Lead status">
        {data.byStatus.length === 0 ? (
          <Empty>No leads yet.</Empty>
        ) : (
          data.byStatus.map(([status, n], i) => (
            <BarRow key={status} label={STATUS_LABELS[status] ?? status} value={n} max={maxStatus} color={CHART_COLOURS[i % CHART_COLOURS.length]} />
          ))
        )}
      </Panel>
    </div>
  )
}
