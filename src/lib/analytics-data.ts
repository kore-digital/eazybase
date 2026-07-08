/**
 * Shared analytics data — the same figures the admin dashboard shows, computed
 * once here so the mobile "EazyBase Analytics" PWA (/analytics) and the admin
 * Dashboard stay in sync. Website traffic comes from PostHog (HogQL); leads &
 * enquiries come from the QuoteRequests collection. Everything degrades
 * gracefully to zeros/empties if analytics is unconfigured or a query fails.
 */
import config from '@payload-config'
import { getPayload } from 'payload'

import { hogql, posthogConfigured } from '@/lib/posthog'
import { addDays, ymd, type DateRange } from '@/lib/analytics-range'

export type CityPoint = { name: string; lat: number; lng: number; count: number }

export type TrafficData = {
  configured: boolean
  views: number
  visitors: number
  series: { label: string; count: number }[]
  pages: [string, number][]
  clicks: { label: string; n: number }[]
  cities: [string, number][]
  points: CityPoint[]
}

export type LeadRow = {
  id: string | number
  firstName?: string
  email?: string
  town?: string
  type?: string
  status?: string
  createdAt?: string
}

export type LeadsData = {
  total: number
  newLeads: number
  avgEstimate: number
  monthly: { label: string; count: number }[]
  towns: [string, number][]
  byType: [string, number][]
  byStatus: [string, number][]
  recent: LeadRow[]
}

export type AnalyticsData = { traffic: TrafficData; leads: LeadsData }

const num = (v: string | number | null | undefined): number =>
  typeof v === 'number' ? v : Number(v) || 0

function distribution(rows: LeadRow[], key: (r: LeadRow) => string | undefined): [string, number][] {
  const counts = new Map<string, number>()
  for (const r of rows) {
    const k = key(r)
    if (!k) continue
    counts.set(k, (counts.get(k) ?? 0) + 1)
  }
  return [...counts.entries()].sort((a, b) => b[1] - a[1])
}

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']
type Gran = 'day' | 'week' | 'month' | 'year'

/** Bucket size that keeps the time-series to a sensible number of bars for any range. */
function granularityFor(from: Date, to: Date): Gran {
  const days = Math.round((to.getTime() - from.getTime()) / 86400000)
  if (days <= 8) return 'day'
  if (days <= 56) return 'week'
  if (days <= 750) return 'month'
  return 'year'
}
const startOfWeek = (d: Date) => {
  const x = new Date(d.getFullYear(), d.getMonth(), d.getDate())
  x.setDate(x.getDate() - ((x.getDay() + 6) % 7)) // back to Monday
  return x
}
function bucketStart(d: Date, g: Gran): Date {
  if (g === 'day') return new Date(d.getFullYear(), d.getMonth(), d.getDate())
  if (g === 'week') return startOfWeek(d)
  if (g === 'month') return new Date(d.getFullYear(), d.getMonth(), 1)
  return new Date(d.getFullYear(), 0, 1)
}
function nextBucket(d: Date, g: Gran): Date {
  if (g === 'day') return new Date(d.getFullYear(), d.getMonth(), d.getDate() + 1)
  if (g === 'week') return new Date(d.getFullYear(), d.getMonth(), d.getDate() + 7)
  if (g === 'month') return new Date(d.getFullYear(), d.getMonth() + 1, 1)
  return new Date(d.getFullYear() + 1, 0, 1)
}
function bucketLabel(d: Date, g: Gran, multiYear: boolean): string {
  if (g === 'day' || g === 'week') return `${d.getDate()} ${MONTHS[d.getMonth()]}`
  if (g === 'month') return multiYear ? `${MONTHS[d.getMonth()]} ${String(d.getFullYear()).slice(2)}` : MONTHS[d.getMonth()]
  return String(d.getFullYear())
}

/** Count leads per time bucket across [from, to); shows the most recent ~40 buckets. */
function leadsOverTime(rows: LeadRow[], range: DateRange): { label: string; count: number }[] {
  const g = granularityFor(range.from, range.to)
  const multiYear = range.from.getFullYear() !== addDays(range.to, -1).getFullYear()
  const buckets: { start: Date; count: number }[] = []
  let cur = bucketStart(range.from, g)
  while (cur < range.to && buckets.length < 80) {
    buckets.push({ start: cur, count: 0 })
    cur = nextBucket(cur, g)
  }
  for (const r of rows) {
    if (!r.createdAt) continue
    const d = new Date(r.createdAt)
    for (let i = buckets.length - 1; i >= 0; i--) {
      if (d >= buckets[i].start) {
        buckets[i].count += 1
        break
      }
    }
  }
  return buckets.slice(-40).map((b) => ({ label: bucketLabel(b.start, g, multiYear), count: b.count }))
}

export async function getAnalyticsData(range: DateRange): Promise<AnalyticsData> {
  const payload = await getPayload({ config })

  // PostHog date filter (range.to is exclusive — start of the day after the end).
  const filter = `timestamp >= toDateTime('${ymd(range.from)} 00:00:00') AND timestamp < toDateTime('${ymd(range.to)} 00:00:00')`
  const g = granularityFor(range.from, range.to)
  const bucketExpr =
    g === 'day' ? 'toDate(timestamp)'
    : g === 'week' ? 'toStartOfWeek(timestamp, 1)'
    : g === 'month' ? 'toStartOfMonth(timestamp)'
    : 'toStartOfYear(timestamp)'
  const multiYear = range.from.getFullYear() !== addDays(range.to, -1).getFullYear()
  const seriesLabel = (ds: string): string => {
    const [y, m, d] = ds.split('-').map(Number)
    if (g === 'year') return String(y)
    if (g === 'month') return multiYear ? `${MONTHS[(m || 1) - 1]} ${String(y).slice(2)}` : MONTHS[(m || 1) - 1]
    return `${d} ${MONTHS[(m || 1) - 1]}`
  }

  const quotesResult = await payload.find({
    collection: 'quote-requests',
    where: {
      createdAt: { greater_than_equal: range.from.toISOString(), less_than: range.to.toISOString() },
    },
    limit: 1000,
    depth: 0,
    sort: '-createdAt',
  })

  const configured = posthogConfigured()
  const [pvTotals, pvSeries, topPages, clickRow, locations] = await Promise.all([
    hogql(`SELECT count() AS views, count(DISTINCT person_id) AS visitors FROM events WHERE event = '$pageview' AND ${filter}`),
    hogql(`SELECT toString(${bucketExpr}) AS d, count() AS c FROM events WHERE event = '$pageview' AND ${filter} GROUP BY d ORDER BY d`),
    hogql(`SELECT properties['$pathname'] AS path, count() AS c FROM events WHERE event = '$pageview' AND ${filter} AND path != '' GROUP BY path ORDER BY c DESC LIMIT 8`),
    hogql(`SELECT countIf(elements_chain LIKE '%wa.me%') AS whatsapp, countIf(elements_chain LIKE '%tel:%') AS call, countIf(elements_chain LIKE '%/get-a-quote%') AS quote, countIf(elements_chain LIKE '%/instant-quote%') AS instant FROM events WHERE event = '$autocapture' AND properties['$event_type'] = 'click' AND ${filter}`),
    hogql(`SELECT properties['$geoip_city_name'] AS city, avg(toFloat(properties['$geoip_latitude'])) AS lat, avg(toFloat(properties['$geoip_longitude'])) AS lng, count(DISTINCT person_id) AS c FROM events WHERE event = '$pageview' AND ${filter} AND city != '' GROUP BY city ORDER BY c DESC LIMIT 20`),
  ])

  const traffic: TrafficData = {
    configured,
    views: num(pvTotals[0]?.[0]),
    visitors: num(pvTotals[0]?.[1]),
    series: pvSeries.map((r) => ({ label: seriesLabel(String(r[0] ?? '')), count: num(r[1]) })).slice(-40),
    pages: topPages.map((r) => [String(r[0] ?? ''), num(r[1])] as [string, number]),
    clicks: [
      { label: 'WhatsApp', n: num(clickRow[0]?.[0]) },
      { label: 'Call', n: num(clickRow[0]?.[1]) },
      { label: 'Quote page', n: num(clickRow[0]?.[2]) },
      { label: 'Instant quote', n: num(clickRow[0]?.[3]) },
    ],
    cities: locations.map((r) => [String(r[0] ?? ''), num(r[3])] as [string, number]),
    points: locations.map((r) => ({
      name: String(r[0] ?? ''),
      lat: num(r[1]),
      lng: num(r[2]),
      count: num(r[3]),
    })),
  }

  const quotes = quotesResult.docs as unknown as LeadRow[]
  const estimates = quotesResult.docs
    .map((q) => {
      const est = q.estimator
      return est?.estimateLow != null && est?.estimateHigh != null
        ? (est.estimateLow + est.estimateHigh) / 2
        : null
    })
    .filter((n): n is number => n !== null)

  const leads: LeadsData = {
    total: quotesResult.totalDocs,
    newLeads: quotes.filter((q) => (q.status ?? 'new') === 'new').length,
    avgEstimate: estimates.length
      ? Math.round(estimates.reduce((a, b) => a + b, 0) / estimates.length)
      : 0,
    monthly: leadsOverTime(quotes, range),
    towns: distribution(quotes, (q) => q.town).slice(0, 5),
    byType: distribution(quotes, (q) => q.type),
    byStatus: distribution(quotes, (q) => q.status ?? 'new'),
    recent: quotes.slice(0, 6),
  }

  return { traffic, leads }
}
