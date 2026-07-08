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

function leadsByMonth(rows: LeadRow[], now: Date): { label: string; count: number }[] {
  const months: { label: string; key: string; count: number }[] = []
  for (let i = 5; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1)
    months.push({
      label: d.toLocaleString('en-GB', { month: 'short' }),
      key: `${d.getFullYear()}-${d.getMonth()}`,
      count: 0,
    })
  }
  for (const r of rows) {
    if (!r.createdAt) continue
    const d = new Date(r.createdAt)
    const k = `${d.getFullYear()}-${d.getMonth()}`
    const m = months.find((mm) => mm.key === k)
    if (m) m.count += 1
  }
  return months.map((m) => ({ label: m.label, count: m.count }))
}

export async function getAnalyticsData(): Promise<AnalyticsData> {
  const payload = await getPayload({ config })

  const quotesResult = await payload.find({
    collection: 'quote-requests',
    limit: 1000,
    depth: 0,
    sort: '-createdAt',
  })

  const configured = posthogConfigured()
  const [pvTotals, pvSeries, topPages, clickRow, locations] = await Promise.all([
    hogql(`SELECT count() AS views, count(DISTINCT person_id) AS visitors FROM events WHERE event = '$pageview' AND timestamp > now() - INTERVAL 30 DAY`),
    hogql(`SELECT toString(toDate(timestamp)) AS d, count() AS c FROM events WHERE event = '$pageview' AND timestamp > now() - INTERVAL 14 DAY GROUP BY d ORDER BY d`),
    hogql(`SELECT properties['$pathname'] AS path, count() AS c FROM events WHERE event = '$pageview' AND timestamp > now() - INTERVAL 30 DAY AND path != '' GROUP BY path ORDER BY c DESC LIMIT 8`),
    hogql(`SELECT countIf(elements_chain LIKE '%wa.me%') AS whatsapp, countIf(elements_chain LIKE '%tel:%') AS call, countIf(elements_chain LIKE '%/get-a-quote%') AS quote, countIf(elements_chain LIKE '%/instant-quote%') AS instant FROM events WHERE event = '$autocapture' AND properties['$event_type'] = 'click' AND timestamp > now() - INTERVAL 30 DAY`),
    hogql(`SELECT properties['$geoip_city_name'] AS city, avg(toFloat(properties['$geoip_latitude'])) AS lat, avg(toFloat(properties['$geoip_longitude'])) AS lng, count(DISTINCT person_id) AS c FROM events WHERE event = '$pageview' AND timestamp > now() - INTERVAL 30 DAY AND city != '' GROUP BY city ORDER BY c DESC LIMIT 20`),
  ])

  const traffic: TrafficData = {
    configured,
    views: num(pvTotals[0]?.[0]),
    visitors: num(pvTotals[0]?.[1]),
    series: pvSeries.map((r) => ({ label: String(r[0] ?? '').slice(5), count: num(r[1]) })),
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
  const now = new Date(quotes[0]?.createdAt ?? Date.now())
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
    monthly: leadsByMonth(quotes, now),
    towns: distribution(quotes, (q) => q.town).slice(0, 5),
    byType: distribution(quotes, (q) => q.type),
    byStatus: distribution(quotes, (q) => q.status ?? 'new'),
    recent: quotes.slice(0, 6),
  }

  return { traffic, leads }
}
