import React from 'react'

/** Presentational building blocks for the analytics app (server-safe). */

const TONES: Record<string, { bg: string; fg: string }> = {
  blue: { bg: '#3b82f6', fg: '#fff' },
  purple: { bg: '#8b5cf6', fg: '#fff' },
  green: { bg: '#96c11f', fg: '#1e1f1d' },
  orange: { bg: '#f97316', fg: '#fff' },
  teal: { bg: '#14b8a6', fg: '#fff' },
  dark: { bg: '#1e1f1d', fg: '#fff' },
}

export const CHART_COLOURS = ['#96c11f', '#3b82f6', '#8b5cf6', '#f97316', '#14b8a6', '#ef4444']

export function Tile({ num, label, tone }: { num: React.ReactNode; label: string; tone: keyof typeof TONES }) {
  const t = TONES[tone]
  return (
    <div className="rounded-2xl px-4 py-3.5" style={{ background: t.bg, color: t.fg }}>
      <div className="font-display text-2xl font-bold leading-none">{num}</div>
      <div className="mt-1.5 text-[12px] font-medium opacity-90">{label}</div>
    </div>
  )
}

export function Panel({
  title,
  sub,
  children,
}: {
  title: string
  sub?: string
  children: React.ReactNode
}) {
  return (
    <section className="mt-3 rounded-2xl border border-ink-100 bg-white p-4">
      <div className="mb-3 flex items-baseline justify-between">
        <h2 className="font-display text-sm font-bold text-ink-900">{title}</h2>
        {sub ? <span className="text-[11px] text-ink-400">{sub}</span> : null}
      </div>
      {children}
    </section>
  )
}

export function BarRow({
  label,
  value,
  max,
  color = '#96c11f',
}: {
  label: string
  value: number
  max: number
  color?: string
}) {
  const pct = Math.max(3, Math.round((value / Math.max(1, max)) * 100))
  return (
    <div className="flex items-center gap-3 py-1">
      <span className="w-24 shrink-0 truncate text-[12px] text-ink-700">{label}</span>
      <span className="h-2 flex-1 overflow-hidden rounded-full bg-ink-100">
        <span className="block h-full rounded-full" style={{ width: `${pct}%`, background: color }} />
      </span>
      <span className="w-7 shrink-0 text-right font-display text-[12px] font-bold text-ink-900">{value}</span>
    </div>
  )
}

export function Empty({ children }: { children: React.ReactNode }) {
  return <p className="py-4 text-center text-[13px] text-ink-400">{children}</p>
}
