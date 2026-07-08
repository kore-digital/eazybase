'use client'

import { useRouter } from 'next/navigation'
import { useState, useTransition } from 'react'

import {
  PRESETS,
  activePresetKey,
  parseYmd,
  startOfDay,
  ymd,
  type RangeParams,
} from '@/lib/analytics-range'

const WD = ['Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa', 'Su']
const MONTHS = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December']
const fmt = (d: Date) => `${d.getDate()} ${MONTHS[d.getMonth()].slice(0, 3)}`

/** Range chip + calendar sheet. Presets push ?days=…, custom ranges push ?from&to=…. */
export function DateRangeBar({ params, label }: { params: RangeParams; label: string }) {
  const router = useRouter()
  const [pending, startTransition] = useTransition()
  const [open, setOpen] = useState(false)

  const today = startOfDay(new Date())
  const initFrom = parseYmd(params.from)
  const initTo = parseYmd(params.to)
  const [selStart, setSelStart] = useState<Date | null>(initFrom)
  const [selEnd, setSelEnd] = useState<Date | null>(initTo)
  const [view, setView] = useState<Date>(() => {
    const d = initTo ?? initFrom ?? today
    return new Date(d.getFullYear(), d.getMonth(), 1)
  })

  const active = activePresetKey(params)
  const go = (url: string) => startTransition(() => { setOpen(false); router.push(url) })
  const applyPreset = (days: string) => go(`/analytics?days=${days}`)
  const applyCustom = () => {
    if (selStart && selEnd) go(`/analytics?from=${ymd(selStart)}&to=${ymd(selEnd)}`)
  }

  const y = view.getFullYear()
  const m = view.getMonth()
  const lead = (new Date(y, m, 1).getDay() + 6) % 7
  const dim = new Date(y, m + 1, 0).getDate()
  const cells: (Date | null)[] = [
    ...Array<null>(lead).fill(null),
    ...Array.from({ length: dim }, (_, i) => new Date(y, m, i + 1)),
  ]
  const canNext = new Date(y, m, 1) < new Date(today.getFullYear(), today.getMonth(), 1)

  const pickDay = (d: Date) => {
    if (d > today) return
    if (!selStart || selEnd) {
      setSelStart(d)
      setSelEnd(null)
    } else if (d >= selStart) {
      setSelEnd(d)
    } else {
      setSelStart(d)
    }
  }

  const dayClass = (d: Date) => {
    const disabled = d > today
    const isStart = selStart && ymd(d) === ymd(selStart)
    const isEnd = selEnd && ymd(d) === ymd(selEnd)
    const between = selStart && selEnd && d > selStart && d < selEnd
    if (isStart || isEnd) return 'rounded-lg bg-brand-500 font-bold text-ink-950'
    if (between) return 'rounded-lg bg-brand-100 text-ink-900'
    return `rounded-lg ${disabled ? 'text-ink-300' : 'text-ink-700 hover:bg-ink-100'}`
  }

  return (
    <>
      <div className="border-b border-ink-100 bg-white px-4 py-2.5">
        <button
          type="button"
          onClick={() => setOpen(true)}
          className="flex w-full items-center justify-between rounded-xl bg-ink-50 px-3.5 py-2.5"
        >
          <span className="flex items-center gap-2 font-display text-sm font-semibold text-ink-900">
            <svg viewBox="0 0 24 24" className="h-4 w-4 text-brand-700" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
              <rect x="3" y="4.5" width="18" height="16" rx="2.5" /><path d="M3 9h18M8 2.5v4M16 2.5v4" />
            </svg>
            {label}
          </span>
          <svg viewBox="0 0 24 24" className="h-4 w-4 text-ink-400" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M6 9l6 6 6-6" /></svg>
        </button>
      </div>

      {open ? (
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/40" onClick={() => setOpen(false)}>
          <div
            className="w-full max-w-md rounded-t-2xl bg-white p-4"
            onClick={(e) => e.stopPropagation()}
            style={{ paddingBottom: 'calc(env(safe-area-inset-bottom) + 1.25rem)' }}
          >
            <div className="mb-3 flex items-center justify-between">
              <h3 className="font-display text-base font-bold text-ink-900">Date range</h3>
              <button type="button" onClick={() => setOpen(false)} aria-label="Close" className="text-lg text-ink-400">✕</button>
            </div>

            <div className="flex flex-wrap gap-2">
              {PRESETS.map((p) => {
                const key = String(p.days)
                const on = active === key
                return (
                  <button
                    key={p.key}
                    type="button"
                    onClick={() => applyPreset(key)}
                    className={[
                      'rounded-full px-3 py-1.5 text-xs font-semibold transition-colors',
                      on ? 'bg-ink-900 text-white' : 'bg-ink-100 text-ink-600 hover:bg-ink-200',
                    ].join(' ')}
                  >
                    {p.label}
                  </button>
                )
              })}
            </div>

            <div className="mt-4 rounded-xl border border-ink-100 p-3">
              <div className="mb-2 flex items-center justify-between">
                <button type="button" onClick={() => setView(new Date(y, m - 1, 1))} aria-label="Previous month" className="flex h-8 w-8 items-center justify-center rounded-lg text-ink-600 hover:bg-ink-100">‹</button>
                <span className="font-display text-sm font-bold text-ink-900">{MONTHS[m]} {y}</span>
                <button type="button" onClick={() => canNext && setView(new Date(y, m + 1, 1))} disabled={!canNext} aria-label="Next month" className="flex h-8 w-8 items-center justify-center rounded-lg text-ink-600 hover:bg-ink-100 disabled:opacity-30">›</button>
              </div>
              <div className="grid grid-cols-7 gap-1 text-center text-[10px] font-semibold text-ink-400">
                {WD.map((w) => <span key={w} className="py-1">{w}</span>)}
              </div>
              <div className="mt-0.5 grid grid-cols-7 gap-1">
                {cells.map((d, i) =>
                  d === null ? (
                    <span key={i} />
                  ) : (
                    <button key={i} type="button" disabled={d > today} onClick={() => pickDay(d)} className={`aspect-square text-[13px] ${dayClass(d)}`}>
                      {d.getDate()}
                    </button>
                  ),
                )}
              </div>
            </div>

            <button
              type="button"
              onClick={applyCustom}
              disabled={!selStart || !selEnd || pending}
              className="mt-4 w-full rounded-xl bg-brand-500 py-3 font-display font-bold text-ink-950 transition-colors hover:bg-brand-600 disabled:opacity-40"
            >
              {pending
                ? 'Loading…'
                : selStart && selEnd
                  ? `Apply · ${ymd(selStart) === ymd(selEnd) ? fmt(selStart) : `${fmt(selStart)} – ${fmt(selEnd)}`}`
                  : 'Pick a start & end date'}
            </button>
          </div>
        </div>
      ) : null}
    </>
  )
}
