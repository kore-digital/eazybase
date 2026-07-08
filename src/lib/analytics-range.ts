/**
 * Date-range helpers for the analytics app — shared by the server (data query)
 * and the client (calendar picker), so no payload/server-only imports here.
 * The URL carries either `?days=<n|all>` (a preset) or `?from&to=YYYY-MM-DD`
 * (a custom calendar range). Default, with no params, is the last 30 days.
 */
export type DateRange = { from: Date; to: Date }
export type RangeParams = { days?: string; from?: string; to?: string }

export const PRESETS: { key: string; label: string; short: string; days: number | 'all' }[] = [
  { key: '7', label: 'Last 7 days', short: '7D', days: 7 },
  { key: '30', label: 'Last 30 days', short: '30D', days: 30 },
  { key: '90', label: 'Last 90 days', short: '90D', days: 90 },
  { key: '365', label: 'Last 12 months', short: '12M', days: 365 },
  { key: 'all', label: 'All time', short: 'All', days: 'all' },
]

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']
const ALL_TIME_FROM = new Date(2015, 0, 1)

export const startOfDay = (d: Date) => new Date(d.getFullYear(), d.getMonth(), d.getDate())
export const addDays = (d: Date, n: number) => new Date(d.getFullYear(), d.getMonth(), d.getDate() + n)

export function ymd(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}
export function parseYmd(s: string | undefined): Date | null {
  const m = s ? /^(\d{4})-(\d{1,2})-(\d{1,2})$/.exec(s) : null
  if (!m) return null
  const d = new Date(Number(m[1]), Number(m[2]) - 1, Number(m[3]))
  return Number.isNaN(d.getTime()) ? null : d
}

/** Resolve URL params → a concrete range. `to` is EXCLUSIVE (start of the day after the end). */
export function rangeFromParams(p: RangeParams, now = new Date()): DateRange {
  const today = startOfDay(now)
  const toExcl = addDays(today, 1)
  if (p.days) {
    if (p.days === 'all') return { from: ALL_TIME_FROM, to: toExcl }
    const n = Number(p.days)
    if (Number.isFinite(n) && n > 0) return { from: addDays(today, -(n - 1)), to: toExcl }
  }
  const f = parseYmd(p.from)
  const t = parseYmd(p.to)
  if (f && t && f <= t) return { from: startOfDay(f), to: addDays(startOfDay(t), 1) }
  return { from: addDays(today, -29), to: toExcl } // default: last 30 days
}

const fmtDay = (d: Date, withYear: boolean) => `${d.getDate()} ${MONTHS[d.getMonth()]}${withYear ? ` ${d.getFullYear()}` : ''}`

/** Human label for the current range (preset name, or "1 Jun – 30 Jun 2026"). */
export function labelFromParams(p: RangeParams): string {
  if (p.days) {
    const preset = PRESETS.find((x) => String(x.days) === p.days || x.key === p.days)
    if (preset) return preset.label
  }
  const f = parseYmd(p.from)
  const t = parseYmd(p.to)
  if (f && t) {
    if (ymd(f) === ymd(t)) return fmtDay(f, true)
    return `${fmtDay(f, f.getFullYear() !== t.getFullYear())} – ${fmtDay(t, true)}`
  }
  return 'Last 30 days'
}

/** Which preset (if any) the current params represent — for highlighting. */
export function activePresetKey(p: RangeParams): string | null {
  if (p.days && PRESETS.some((x) => String(x.days) === p.days)) return p.days
  if (!p.days && !p.from && !p.to) return '30'
  return null
}
