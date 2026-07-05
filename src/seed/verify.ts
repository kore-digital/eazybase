/** Quick verification — run with: npx payload run src/seed/verify.ts */
import { getPayload } from 'payload'

import config from '../payload.config'

const payload = await getPayload({ config })

const collections = [
  'pages',
  'areas',
  'faqs',
  'testimonials',
  'gallery-items',
  'awards',
  'media',
  'quote-requests',
  'users',
] as const

console.log('Document counts per collection:')
for (const slug of collections) {
  const { totalDocs } = await payload.count({ collection: slug })
  console.log(`  ${slug}: ${totalDocs}`)
}

const settings = await payload.findGlobal({ slug: 'site-settings' })
const nav = await payload.findGlobal({ slug: 'navigation' })
console.log(`  site-settings: phone=${settings?.phone ?? '—'}`)
console.log(`  navigation: mainNav=${nav?.mainNav?.length ?? 0} items, footerNav=${nav?.footerNav?.length ?? 0} items`)

process.exit(0)
