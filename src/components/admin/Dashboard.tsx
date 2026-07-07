import config from '@payload-config'
import { headers as getHeaders } from 'next/headers'
import { getPayload } from 'payload'

import { liveEditUrlForPage } from './pageUrl'
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
    { num: totalPages.totalDocs, label: 'Total pages', cls: styles.green, icon: '📄' },
    { num: publishedPages.totalDocs, label: 'Published', cls: styles.teal, icon: '✅' },
    { num: mediaCount.totalDocs, label: 'Images', cls: styles.blue, icon: '🖼️' },
    { num: quotesResult.totalDocs, label: 'Total leads', cls: styles.purple, icon: '📥' },
    { num: newLeads, label: 'New leads', cls: styles.orange, icon: '🔔' },
    { num: avgEstimate ? `£${avgEstimate.toLocaleString('en-GB')}` : '—', label: 'Avg estimate', cls: styles.dark, icon: '💷' },
  ]

  return (
    <div className={styles.wrap}>
      <h1 className={styles.greeting}>Welcome back, {firstName}</h1>
      <p className={styles.sub}>Your website content, leads, and analytics in one place.</p>

      {/* colourful stat cards */}
      <div className={styles.tiles}>
        {tiles.map((t) => (
          <div key={t.label} className={`${styles.tile} ${t.cls}`}>
            <span className={styles.tileIcon} aria-hidden="true">{t.icon}</span>
            <div className={styles.tileNum}>{t.num}</div>
            <div className={styles.tileLabel}>{t.label}</div>
          </div>
        ))}
      </div>

      {/* leads over time + where leads come from */}
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
                  <span className={styles.feedDot} aria-hidden="true">📥</span>
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

      {/* website traffic — wired in Phase B (PostHog) */}
      <div className={styles.connect}>
        <strong>Website traffic analytics — coming soon</strong>
        <p>Page views, a visitor map, and WhatsApp / Call / Quote click tracking will appear here once analytics is connected.</p>
      </div>

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
          const thumb = chosenUrl ?? firstImageUrl(page.sections)
          return (
            <div key={String(page.id)} className={styles.card}>
              <div className={styles.thumb}>
                {thumb ? <img src={thumb} alt="" /> : <span className={styles.thumbLabel}>{String(page.title)}</span>}
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
