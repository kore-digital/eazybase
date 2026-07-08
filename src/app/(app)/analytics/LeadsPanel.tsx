import React from 'react'

import type { LeadsData } from '@/lib/analytics-data'

import { BarRow, CHART_COLOURS, Empty, Panel, Tile } from './parts'

const TYPE_LABELS: Record<string, string> = {
  full: 'Full quote',
  instant: 'Instant quote',
  assistant: 'Quote assistant',
}
const STATUS_LABELS: Record<string, string> = { new: 'New', contacted: 'Contacted', closed: 'Closed' }

export function LeadsPanel({ data }: { data: LeadsData }) {
  const maxMonth = Math.max(1, ...data.monthly.map((m) => m.count))
  const maxTown = Math.max(1, ...data.towns.map((t) => t[1]))
  const maxType = Math.max(1, ...data.byType.map((t) => t[1]))
  const maxStatus = Math.max(1, ...data.byStatus.map((s) => s[1]))

  return (
    <div>
      <div className="grid grid-cols-3 gap-2.5">
        <Tile num={data.total} label="Total leads" tone="purple" />
        <Tile num={data.newLeads} label="New leads" tone="orange" />
        <Tile num={data.avgEstimate ? `£${(data.avgEstimate / 1000).toFixed(0)}k` : '—'} label="Avg estimate" tone="dark" />
      </div>

      <Panel title="Leads over time" sub="last 6 months">
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

      <Panel title="Recent enquiries">
        {data.recent.length === 0 ? (
          <Empty>No enquiries yet.</Empty>
        ) : (
          <ul className="divide-y divide-ink-100">
            {data.recent.map((q) => (
              <li key={String(q.id)} className="flex items-center gap-3 py-2.5">
                <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-brand-100 text-[11px] font-bold text-brand-800">
                  {(q.firstName ?? q.email ?? '?').slice(0, 1).toUpperCase()}
                </span>
                <span className="min-w-0">
                  <span className="block truncate text-[13px] font-semibold text-ink-900">{q.firstName ?? q.email ?? 'Enquiry'}</span>
                  <span className="block truncate text-[11px] text-ink-400">
                    {q.town ? `${q.town} · ` : ''}{TYPE_LABELS[q.type ?? ''] ?? 'Quote'}
                  </span>
                </span>
              </li>
            ))}
          </ul>
        )}
      </Panel>
    </div>
  )
}
