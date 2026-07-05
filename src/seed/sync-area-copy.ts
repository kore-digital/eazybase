/**
 * Re-syncs area docs from docs/area-copy/*.json — used when copy lands after
 * the initial seed. Run: npx payload run src/seed/sync-area-copy.ts
 * Only overwrites areas still holding the seed placeholder (or pass --force).
 */
import config from '@payload-config'
import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'
import { getPayload } from 'payload'

import { toRichText } from './richtext'

const dirname = path.dirname(fileURLToPath(import.meta.url))
const AREA_COPY_DIR = path.resolve(dirname, '../../docs/area-copy')
const force = process.argv.includes('--force')

const payload = await getPayload({ config })
const areas = await payload.find({ collection: 'areas', limit: 100 })
let updated = 0

for (const area of areas.docs) {
  const copyPath = path.join(AREA_COPY_DIR, `${area.slug}.json`)
  if (!fs.existsSync(copyPath)) continue

  const isPlaceholder = JSON.stringify(area.intro).includes('is being written and will appear here soon')
  if (!isPlaceholder && !force) continue

  const copy = JSON.parse(fs.readFileSync(copyPath, 'utf8'))
  await payload.update({
    collection: 'areas',
    id: area.id,
    data: {
      heroHeading: copy.heroHeading,
      intro: toRichText(copy.intro) as never,
      localAngles: copy.localAngles,
      faqs: copy.faqs,
      seo: { metaTitle: copy.metaTitle, metaDescription: copy.metaDescription },
    },
  })
  updated++
  console.log(`✔ updated ${area.slug}`)
}

console.log(`Done — ${updated} areas updated`)
