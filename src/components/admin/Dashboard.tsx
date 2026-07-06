import config from '@payload-config'
import { headers as getHeaders } from 'next/headers'
import { getPayload } from 'payload'

import { liveEditUrlForPage } from './pageUrl'
import styles from './Dashboard.module.scss'

/** First image URL found in a page's blocks, else null (used for the card thumb). */
function firstImageUrl(sections: unknown): string | null {
  if (!Array.isArray(sections)) return null
  for (const block of sections) {
    const image = (block as { image?: { url?: string } })?.image
    if (image && typeof image === 'object' && image.url) return image.url
  }
  return null
}

export async function Dashboard() {
  const payload = await getPayload({ config })
  const { user } = await payload.auth({ headers: await getHeaders() })

  const [pagesResult, totalPages, publishedPages, mediaCount, enquiryCount, recentEnquiries] =
    await Promise.all([
      payload.find({ collection: 'pages', limit: 12, depth: 1, sort: 'title' }),
      payload.count({ collection: 'pages' }),
      payload.count({ collection: 'pages', where: { published: { equals: true } } }),
      payload.count({ collection: 'media' }),
      payload.count({ collection: 'quote-requests' }),
      payload.find({ collection: 'quote-requests', limit: 5, sort: '-createdAt', depth: 0 }),
    ])

  const firstName = (user?.name as string | undefined)?.trim().split(' ')[0] || 'there'

  const tiles = [
    { num: totalPages.totalDocs, label: 'Total pages' },
    { num: publishedPages.totalDocs, label: 'Published' },
    { num: mediaCount.totalDocs, label: 'Images' },
    { num: enquiryCount.totalDocs, label: 'Enquiries' },
  ]

  return (
    <div className={styles.wrap}>
      <h1 className={styles.greeting}>Welcome back, {firstName}</h1>
      <p className={styles.sub}>Manage your website content, images, and enquiries in one place.</p>

      <div className={styles.tiles}>
        {tiles.map((t) => (
          <div key={t.label} className={styles.tile}>
            <div className={styles.tileNum}>{t.num}</div>
            <div className={styles.tileLabel}>{t.label}</div>
          </div>
        ))}
      </div>

      <h2 className={styles.sectionTitle}>Your pages</h2>
      <div className={styles.cards}>
        {pagesResult.docs.map((page) => {
          const slug = page.slug ? String(page.slug) : ''
          const thumb = firstImageUrl(page.sections)
          return (
            <div key={String(page.id)} className={styles.card}>
              <div className={styles.thumb}>
                {thumb ? <img src={thumb} alt="" /> : null}
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
        {pagesResult.docs.length === 0 ? <p>No pages yet — create your first one.</p> : null}
      </div>

      <h2 className={styles.sectionTitle}>Recent enquiries</h2>
      {recentEnquiries.docs.length === 0 ? (
        <p className={styles.sub}>No enquiries yet.</p>
      ) : (
        <ul>
          {recentEnquiries.docs.map((e) => {
            const enquiry = e as { firstName?: string; email?: string }
            return (
              <li key={String(e.id)}>
                <a href={`/admin/collections/quote-requests/${e.id}`}>
                  {enquiry.firstName ?? enquiry.email ?? 'Enquiry'}
                </a>
              </li>
            )
          })}
        </ul>
      )}

      <div className={styles.help}>
        <strong>Edit your site live</strong>
        <ol>
          <li>Log in here (you already are).</li>
          <li>Open a page with its <em>Edit live</em> button above.</li>
          <li>Click any text on the page to edit it — changes save automatically.</li>
        </ol>
      </div>
    </div>
  )
}

export default Dashboard
