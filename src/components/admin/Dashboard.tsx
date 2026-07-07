import config from '@payload-config'
import { headers as getHeaders } from 'next/headers'
import { getPayload } from 'payload'
import type { ReactElement } from 'react'

import { hogql, posthogConfigured } from '@/lib/posthog'

import { liveEditUrlForPage } from './pageUrl'
import { VisitorMap } from './VisitorMap'
import styles from './Dashboard.module.scss'

/**
 * Custom EazyBase admin dashboard. Colourful stat tiles + charts built from the
 * quote data we already capture (QuoteRequests), a recent-enquiries feed, a
 * "connect analytics" slot for website traffic (PostHog, wired in Phase B), and
 * the editable page cards. Renders via `beforeDashboard`; fetches its own data.
 */

type Quote = {
  id: string | number
  firstName?: string
  email?: string
  town?: string
  type?: string
  status?: string
  estimateLow?: number
  estimateHigh?: number
  createdAt?: string
}

const CHART_COLOURS = ['#96c11f', '#8b5cf6', '#f97316', '#3b82f6', '#14b8a6', '#ec4899']

/** Minimal stroke icons (Lucide-style) for the stat tiles + feed. */
const svgProps = {
  width: 20,
  height: 20,
  viewBox: '0 0 24 24',
  fill: 'none',
  stroke: 'currentColor',
  strokeWidth: 1.8,
  strokeLinecap: 'round' as const,
  strokeLinejoin: 'round' as const,
  'aria-hidden': true,
}
const ICONS: Record<string, ReactElement> = {
  file: (
    <svg {...svgProps}><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" /><path d="M14 2v6h6" /><path d="M8 13h8M8 17h8" /></svg>
  ),
  check: (
    <svg {...svgProps}><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" /><path d="m9 11 3 3L22 4" /></svg>
  ),
  image: (
    <svg {...svgProps}><rect x="3" y="3" width="18" height="18" rx="2" /><circle cx="9" cy="9" r="1.6" /><path d="m21 15-5-5L5 21" /></svg>
  ),
  inbox: (
    <svg {...svgProps}><path d="M22 12h-6l-2 3h-4l-2-3H2" /><path d="M5.45 5.11 2 12v6a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2v-6l-3.45-6.89A2 2 0 0 0 16.76 4H7.24a2 2 0 0 0-1.79 1.11z" /></svg>
  ),
  bell: (
    <svg {...svgProps}><path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" /><path d="M13.73 21a2 2 0 0 1-3.46 0" /></svg>
  ),
  pound: (
    <svg {...svgProps}><path d="M18 7c0-2.2-1.8-4-4-4S10 4.8 10 7c0 6-2 8-2 8h11" /><path d="M8 15v4a2 2 0 0 0 2 2h8" /><path d="M6 12h9" /></svg>
  ),
  eye: (
    <svg {...svgProps}><path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7-10-7-10-7Z" /><circle cx="12" cy="12" r="3" /></svg>
  ),
  users: (
    <svg {...svgProps}><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" /><circle cx="9" cy="7" r="4" /><path d="M22 21v-2a4 4 0 0 0-3-3.87" /><path d="M16 3.13a4 4 0 0 1 0 7.75" /></svg>
  ),
  pointer: (
    <svg {...svgProps}><path d="M3 3l7.5 18 2.5-8 8-2.5L3 3z" /></svg>
  ),
  home: (
    <svg {...svgProps}><path d="M3 9.5 12 3l9 6.5" /><path d="M5 10v10h14V10" /><path d="M9 20v-6h6v6" /></svg>
  ),
  wrench: (
    <svg {...svgProps}><path d="M14.7 6.3a4 4 0 0 0-5.4 5.2L3 17.9 6.1 21l6.4-6.3a4 4 0 0 0 5.2-5.4l-2.5 2.5-2.3-2.3z" /></svg>
  ),
  help: (
    <svg {...svgProps}><circle cx="12" cy="12" r="9" /><path d="M9.1 9a3 3 0 0 1 5.8 1c0 2-3 2.5-3 4" /><path d="M12 17h.01" /></svg>
  ),
  zap: (
    <svg {...svgProps}><path d="M13 2 4 14h7l-1 8 9-12h-7l1-8z" /></svg>
  ),
  share: (
    <svg {...svgProps}><circle cx="18" cy="5" r="3" /><circle cx="6" cy="12" r="3" /><circle cx="18" cy="19" r="3" /><path d="M8.6 13.5 15.4 17.5M15.4 6.5 8.6 10.5" /></svg>
  ),
}

/** Pages that always use the designed placeholder, ignoring their own images. */
const PLACEHOLDER_ONLY = new Set(['about-us'])

/** Designed thumbnail (gradient + icon) for pages that have no image of their own. */
const DEFAULT_THUMB = { icon: 'file', grad: 'linear-gradient(135deg,#1e293b,#334155)' }
const PAGE_THUMBS: Record<string, { icon: string; grad: string }> = {
  home: { icon: 'home', grad: 'linear-gradient(135deg,#7cb518,#96c11f)' },
  'what-we-do': { icon: 'wrench', grad: 'linear-gradient(135deg,#2563eb,#3b82f6)' },
  faq: { icon: 'help', grad: 'linear-gradient(135deg,#7c3aed,#8b5cf6)' },
  'get-a-quote': { icon: 'pound', grad: 'linear-gradient(135deg,#ea580c,#f97316)' },
  'instant-quote': { icon: 'zap', grad: 'linear-gradient(135deg,#db2777,#ec4899)' },
  social: { icon: 'share', grad: 'linear-gradient(135deg,#0d9488,#14b8a6)' },
  gallery: { icon: 'image', grad: 'linear-gradient(135deg,#0891b2,#06b6d4)' },
  'about-us': { icon: 'users', grad: 'linear-gradient(135deg,#475569,#334155)' },
}

/** Recursively find the first image in a page's blocks, preferring a
 *  card/thumb-sized variant. Returns null if the page has no image. */
function firstImageUrl(node: unknown): string | null {
  if (Array.isArray(node)) {
    for (const item of node) {
      const found = firstImageUrl(item)
      if (found) return found
    }
    return null
  }
  if (node && typeof node === 'object') {
    const media = node as {
      url?: string
      mimeType?: string
      sizes?: { card?: { url?: string }; thumb?: { url?: string } }
    }
    if (media.url && typeof media.mimeType === 'string' && media.mimeType.startsWith('image/')) {
      return media.sizes?.card?.url ?? media.sizes?.thumb?.url ?? media.url
    }
    for (const value of Object.values(node)) {
      const found = firstImageUrl(value)
      if (found) return found
    }
  }
  return null
}

/** Count occurrences of a string key across quotes, sorted desc. */
function distribution(quotes: Quote[], key: (q: Quote) => string | undefined): [string, number][] {
  const counts = new Map<string, number>()
  for (const q of quotes) {
    const v = key(q)?.trim()
    if (!v) continue
    counts.set(v, (counts.get(v) ?? 0) + 1)
  }
  return [...counts.entries()].sort((a, b) => b[1] - a[1])
}

/** Last 6 calendar months as {label, count} from quote createdAt dates. */
function leadsByMonth(quotes: Quote[], now: Date): { label: string; count: number }[] {
  const months: { label: string; key: string; count: number }[] = []
  for (let i = 5; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1)
    months.push({
      label: d.toLocaleDateString('en-GB', { month: 'short' }),
      key: `${d.getFullYear()}-${d.getMonth()}`,
      count: 0,
    })
  }
  for (const q of quotes) {
    if (!q.createdAt) continue
    const d = new Date(q.createdAt)
    const key = `${d.getFullYear()}-${d.getMonth()}`
    const bucket = months.find((m) => m.key === key)
    if (bucket) bucket.count += 1
  }
  return months.map((m) => ({ label: m.label, count: m.count }))
}

const TYPE_LABELS: Record<string, string> = {
  full: 'Full quote',
  instant: 'Instant quote',
  assistant: 'Quote assistant',
}
const STATUS_LABELS: Record<string, string> = { new: 'New', contacted: 'Contacted', closed: 'Closed' }

export async function Dashboard() {
  const payload = await getPayload({ config })
  const { user } = await payload.auth({ headers: await getHeaders() })

  const [pagesResult, totalPages, publishedPages, mediaCount, quotesResult] = await Promise.all([
    payload.find({ collection: 'pages', limit: 12, depth: 1, sort: 'title' }),
    payload.count({ collection: 'pages' }),
    payload.count({ collection: 'pages', where: { published: { equals: true } } }),
    payload.count({ collection: 'media' }),
    payload.find({ collection: 'quote-requests', limit: 1000, depth: 0, sort: '-createdAt' }),
  ])

  // Website traffic (PostHog). All degrade to [] if unconfigured or on error.
  const analyticsOn = posthogConfigured()
  const [pvTotals, pvSeries, topPages, clickRow, locations] = await Promise.all([
    hogql(`SELECT count() AS views, count(DISTINCT person_id) AS visitors FROM events WHERE event = '$pageview' AND timestamp > now() - INTERVAL 30 DAY`),
    hogql(`SELECT toString(toDate(timestamp)) AS d, count() AS c FROM events WHERE event = '$pageview' AND timestamp > now() - INTERVAL 14 DAY GROUP BY d ORDER BY d`),
    hogql(`SELECT properties['$pathname'] AS path, count() AS c FROM events WHERE event = '$pageview' AND timestamp > now() - INTERVAL 30 DAY AND path != '' GROUP BY path ORDER BY c DESC LIMIT 8`),
    hogql(`SELECT countIf(elements_chain LIKE '%wa.me%') AS whatsapp, countIf(elements_chain LIKE '%tel:%') AS call, countIf(elements_chain LIKE '%/get-a-quote%') AS quote, countIf(elements_chain LIKE '%/instant-quote%') AS instant FROM events WHERE event = '$autocapture' AND properties['$event_type'] = 'click' AND timestamp > now() - INTERVAL 30 DAY`),
    hogql(`SELECT properties['$geoip_city_name'] AS city, avg(toFloat(properties['$geoip_latitude'])) AS lat, avg(toFloat(properties['$geoip_longitude'])) AS lng, count(DISTINCT person_id) AS c FROM events WHERE event = '$pageview' AND timestamp > now() - INTERVAL 30 DAY AND city != '' GROUP BY city ORDER BY c DESC LIMIT 20`),
  ])

  const num = (v: string | number | null | undefined): number => (typeof v === 'number' ? v : Number(v) || 0)
  const traffic = {
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
    points: locations.map((r) => ({ name: String(r[0] ?? ''), lat: num(r[1]), lng: num(r[2]), count: num(r[3]) })),
  }
  const maxPv = Math.max(1, ...traffic.series.map((s) => s.count))
  const maxTopPage = Math.max(1, ...traffic.pages.map((p) => p[1]))
  const maxClick = Math.max(1, ...traffic.clicks.map((c) => c.n))
  const maxCity = Math.max(1, ...traffic.cities.map((c) => c[1]))

  const quotes = quotesResult.docs as unknown as Quote[]
  const now = new Date(quotesResult.docs[0]?.createdAt ?? Date.now())

  const newLeads = quotes.filter((q) => (q.status ?? 'new') === 'new').length
  const estimates = quotes
    .map((q) => (q.estimateLow && q.estimateHigh ? (q.estimateLow + q.estimateHigh) / 2 : null))
    .filter((n): n is number => n !== null)
  const avgEstimate = estimates.length
    ? Math.round(estimates.reduce((a, b) => a + b, 0) / estimates.length)
    : 0

  const firstName = (user?.name as string | undefined)?.trim().split(' ')[0] || 'there'

  const monthly = leadsByMonth(quotes, now)
  const maxMonth = Math.max(1, ...monthly.map((m) => m.count))
  const towns = distribution(quotes, (q) => q.town).slice(0, 5)
  const maxTown = Math.max(1, ...towns.map((t) => t[1]))
  const byType = distribution(quotes, (q) => q.type)
  const maxType = Math.max(1, ...byType.map((t) => t[1]))
  const byStatus = distribution(quotes, (q) => q.status ?? 'new')
  const maxStatus = Math.max(1, ...byStatus.map((s) => s[1]))

  const tiles = [
    { num: totalPages.totalDocs, label: 'Total pages', cls: styles.green, icon: 'file' },
    { num: publishedPages.totalDocs, label: 'Published', cls: styles.teal, icon: 'check' },
    { num: mediaCount.totalDocs, label: 'Images', cls: styles.blue, icon: 'image' },
    { num: quotesResult.totalDocs, label: 'Total leads', cls: styles.purple, icon: 'inbox' },
    { num: newLeads, label: 'New leads', cls: styles.orange, icon: 'bell' },
    { num: avgEstimate ? `£${avgEstimate.toLocaleString('en-GB')}` : '—', label: 'Avg estimate', cls: styles.dark, icon: 'pound' },
  ]

  return (
    <div className={styles.wrap}>
      <h1 className={styles.greeting}>Welcome back, {firstName}</h1>
      <p className={styles.sub}>Your website content, leads, and analytics in one place.</p>

      {/* colourful stat cards */}
      <div className={styles.tiles}>
        {tiles.map((t) => (
          <div key={t.label} className={`${styles.tile} ${t.cls}`}>
            <span className={styles.tileIcon} aria-hidden="true">{ICONS[t.icon]}</span>
            <div className={styles.tileNum}>{t.num}</div>
            <div className={styles.tileLabel}>{t.label}</div>
          </div>
        ))}
      </div>

      {/* leads over time + where leads come from */}
      <h2 className={styles.sectionTitle}>Leads &amp; enquiries <span className={styles.subtle}>· from your quote forms</span></h2>
      <div className={styles.grid2}>
        <div className={styles.panel}>
          <h2 className={styles.panelTitle}>Leads over time <small>last 6 months</small></h2>
          {quotesResult.totalDocs === 0 ? (
            <p className={styles.empty}>No leads yet — they’ll chart here as quotes come in.</p>
          ) : (
            <div className={styles.bars}>
              {monthly.map((m) => (
                <div key={m.label} className={styles.barCol}>
                  <span className={styles.barVal}>{m.count || ''}</span>
                  <span className={styles.bar} style={{ height: `${(m.count / maxMonth) * 100}%` }} />
                  <span className={styles.barLabel}>{m.label}</span>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className={styles.panel}>
          <h2 className={styles.panelTitle}>Top towns <small>where leads come from</small></h2>
          {towns.length === 0 ? (
            <p className={styles.empty}>No lead locations yet.</p>
          ) : (
            <div className={styles.hbars}>
              {towns.map(([town, count], i) => (
                <div key={town} className={styles.hbarRow}>
                  <span className={styles.hbarLabel}>{town}</span>
                  <span className={styles.hbarTrack}>
                    <span className={styles.hbarFill} style={{ width: `${(count / maxTown) * 100}%`, background: CHART_COLOURS[i % CHART_COLOURS.length] }} />
                  </span>
                  <span className={styles.hbarVal}>{count}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* quote source + lead status + recent enquiries */}
      <div className={styles.grid3}>
        <div className={styles.panel}>
          <h2 className={styles.panelTitle}>Quote source</h2>
          {byType.length === 0 ? (
            <p className={styles.empty}>No quotes yet.</p>
          ) : (
            <div className={styles.hbars}>
              {byType.map(([type, count], i) => (
                <div key={type} className={styles.hbarRow}>
                  <span className={styles.hbarLabel}>{TYPE_LABELS[type] ?? type}</span>
                  <span className={styles.hbarTrack}>
                    <span className={styles.hbarFill} style={{ width: `${(count / maxType) * 100}%`, background: CHART_COLOURS[i % CHART_COLOURS.length] }} />
                  </span>
                  <span className={styles.hbarVal}>{count}</span>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className={styles.panel}>
          <h2 className={styles.panelTitle}>Lead status</h2>
          {byStatus.length === 0 ? (
            <p className={styles.empty}>No leads yet.</p>
          ) : (
            <div className={styles.hbars}>
              {byStatus.map(([status, count], i) => (
                <div key={status} className={styles.hbarRow}>
                  <span className={styles.hbarLabel}>{STATUS_LABELS[status] ?? status}</span>
                  <span className={styles.hbarTrack}>
                    <span className={styles.hbarFill} style={{ width: `${(count / maxStatus) * 100}%`, background: CHART_COLOURS[i % CHART_COLOURS.length] }} />
                  </span>
                  <span className={styles.hbarVal}>{count}</span>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className={styles.panel}>
          <h2 className={styles.panelTitle}>Recent enquiries</h2>
          {quotes.length === 0 ? (
            <p className={styles.empty}>No enquiries yet.</p>
          ) : (
            <div className={styles.feed}>
              {quotes.slice(0, 5).map((q) => (
                <a key={String(q.id)} className={styles.feedRow} href={`/admin/collections/quote-requests/${q.id}`}>
                  <span className={styles.feedDot} aria-hidden="true">{ICONS.inbox}</span>
                  <span>
                    <span className={styles.feedName}>{q.firstName ?? q.email ?? 'Enquiry'}</span>
                    <br />
                    <span className={styles.feedMeta}>{q.town ?? ''}{q.town ? ' · ' : ''}{TYPE_LABELS[q.type ?? ''] ?? 'Quote'}</span>
                  </span>
                </a>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* website traffic (PostHog) */}
      <h2 className={styles.sectionTitle}>Website traffic <span className={styles.subtle}>· last 30 days</span></h2>
      {!analyticsOn ? (
        <div className={styles.connect}>
          <strong>Analytics not connected</strong>
          <p>Add the PostHog keys to start tracking page views, visitor locations, and button clicks.</p>
        </div>
      ) : (
        <>
          <div className={styles.tiles}>
            <div className={`${styles.tile} ${styles.blue}`}>
              <span className={styles.tileIcon}>{ICONS.eye}</span>
              <div className={styles.tileNum}>{traffic.views.toLocaleString('en-GB')}</div>
              <div className={styles.tileLabel}>Page views</div>
            </div>
            <div className={`${styles.tile} ${styles.purple}`}>
              <span className={styles.tileIcon}>{ICONS.users}</span>
              <div className={styles.tileNum}>{traffic.visitors.toLocaleString('en-GB')}</div>
              <div className={styles.tileLabel}>Visitors</div>
            </div>
            {traffic.clicks.map((c, i) => (
              <div key={c.label} className={`${styles.tile} ${[styles.green, styles.orange, styles.teal, styles.dark][i]}`}>
                <span className={styles.tileIcon}>{ICONS.pointer}</span>
                <div className={styles.tileNum}>{c.n.toLocaleString('en-GB')}</div>
                <div className={styles.tileLabel}>{c.label} clicks</div>
              </div>
            ))}
          </div>

          <div className={styles.grid2}>
            <div className={styles.panel}>
              <h2 className={styles.panelTitle}>Page views <small>last 14 days</small></h2>
              {traffic.series.length === 0 ? (
                <p className={styles.empty}>No visits tracked yet — data appears within minutes of your first visitor.</p>
              ) : (
                <div className={styles.bars}>
                  {traffic.series.map((s) => (
                    <div key={s.label} className={styles.barCol}>
                      <span className={styles.barVal}>{s.count || ''}</span>
                      <span className={styles.bar} style={{ height: `${(s.count / maxPv) * 100}%`, background: 'linear-gradient(180deg,#3b82f6,#2563eb)' }} />
                      <span className={styles.barLabel}>{s.label}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className={styles.panel}>
              <h2 className={styles.panelTitle}>Top pages</h2>
              {traffic.pages.length === 0 ? (
                <p className={styles.empty}>No page views yet.</p>
              ) : (
                <div className={styles.hbars}>
                  {traffic.pages.map(([path, count], i) => (
                    <div key={path} className={styles.hbarRow}>
                      <span className={styles.hbarLabel}>{path === '/' ? 'Home' : path}</span>
                      <span className={styles.hbarTrack}>
                        <span className={styles.hbarFill} style={{ width: `${(count / maxTopPage) * 100}%`, background: CHART_COLOURS[i % CHART_COLOURS.length] }} />
                      </span>
                      <span className={styles.hbarVal}>{count}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          <div className={styles.grid2}>
            <div className={styles.panel}>
              <h2 className={styles.panelTitle}>Where your visitors are <small>top cities</small></h2>
              {traffic.cities.length === 0 ? (
                <p className={styles.empty}>No location data yet.</p>
              ) : (
                <div className={styles.hbars}>
                  {traffic.cities.map(([city, count], i) => (
                    <div key={city} className={styles.hbarRow}>
                      <span className={styles.hbarLabel}>{city}</span>
                      <span className={styles.hbarTrack}>
                        <span className={styles.hbarFill} style={{ width: `${(count / maxCity) * 100}%`, background: CHART_COLOURS[i % CHART_COLOURS.length] }} />
                      </span>
                      <span className={styles.hbarVal}>{count}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className={styles.panel}>
              <h2 className={styles.panelTitle}>Button clicks <small>last 30 days</small></h2>
              {maxClick === 1 && traffic.clicks.every((c) => c.n === 0) ? (
                <p className={styles.empty}>No clicks tracked yet.</p>
              ) : (
                <div className={styles.hbars}>
                  {traffic.clicks.map((c, i) => (
                    <div key={c.label} className={styles.hbarRow}>
                      <span className={styles.hbarLabel}>{c.label}</span>
                      <span className={styles.hbarTrack}>
                        <span className={styles.hbarFill} style={{ width: `${(c.n / maxClick) * 100}%`, background: CHART_COLOURS[i % CHART_COLOURS.length] }} />
                      </span>
                      <span className={styles.hbarVal}>{c.n}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          <div className={styles.panel}>
            <h2 className={styles.panelTitle}>Visitor map <small>last 30 days</small></h2>
            {traffic.points.length === 0 ? (
              <p className={styles.empty}>No location data yet — the map fills in as visitors arrive.</p>
            ) : (
              <VisitorMap points={traffic.points} />
            )}
          </div>
        </>
      )}

      {/* editable pages */}
      <h2 className={styles.sectionTitle}>Your pages</h2>
      <div className={styles.cards}>
        {pagesResult.docs.map((page) => {
          const slug = page.slug ? String(page.slug) : ''
          const chosen = page.cardImage
          const chosenUrl =
            chosen && typeof chosen === 'object'
              ? ((chosen as { sizes?: { card?: { url?: string } }; url?: string }).sizes?.card?.url ??
                (chosen as { url?: string }).url ??
                null)
              : null
          const auto = PLACEHOLDER_ONLY.has(slug) ? null : firstImageUrl(page.sections)
          const thumb = chosenUrl ?? auto
          const ph = thumb ? null : PAGE_THUMBS[slug] ?? DEFAULT_THUMB
          return (
            <div key={String(page.id)} className={styles.card}>
              <div className={styles.thumb} style={ph ? { background: ph.grad } : undefined}>
                {thumb ? (
                  <img src={thumb} alt="" />
                ) : (
                  <>
                    <span className={styles.phIcon} aria-hidden="true">{ICONS[ph!.icon]}</span>
                    <span className={styles.thumbLabel}>{String(page.title)}</span>
                  </>
                )}
              </div>
              <div className={styles.cardBody}>
                <p className={styles.cardTitle}>{String(page.title)}</p>
                <div className={styles.cardActions}>
                  <a className="btn btn--size-small btn--style-secondary" href={`/admin/collections/pages/${page.id}`}>
                    Edit content
                  </a>
                  {slug ? (
                    <a
                      className="btn btn--size-small btn--style-primary"
                      href={liveEditUrlForPage(slug)}
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      Edit live
                    </a>
                  ) : null}
                </div>
              </div>
            </div>
          )
        })}
        {pagesResult.docs.length === 0 ? <p className={styles.empty}>No pages yet — create your first one.</p> : null}
      </div>
    </div>
  )
}

export default Dashboard
