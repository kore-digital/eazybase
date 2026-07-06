/**
 * One-off content fixes for the EXISTING database (the seed skips sections
 * that already have docs, so seed-source fixes never reach a live DB).
 * Run: npx payload run src/seed/fix-content.ts
 *
 *  - statsCounters suffixes gain a leading space (' weeks', ' days') — the
 *    counters render {value}{suffix} tight, so 'weeks' showed as "4weeks".
 *  - UK English: 'meters' → 'metres' in the planning-permission FAQ (faqs
 *    collection + any page block carrying the same copy).
 *  - Meta descriptions over the 155-char SERP budget tightened (pages: home,
 *    about-us; areas: harrow) — matches the new seo field maxLength of 155.
 */
import config from '@payload-config'
import { getPayload } from 'payload'

const META_FIXES: Record<'pages' | 'areas', Record<string, string>> = {
  pages: {
    home:
      'Affordable prefab modular home extensions designed, built and installed by EazyBase. Factory-built in as little as 4 weeks, installed in under a week.',
    'about-us':
      'Meet the EazyBase team — experienced, fully insured and highly trained. We design, factory-build and install modular home extensions at affordable prices.',
  },
  areas: {
    harrow:
      'Factory-built modular home extensions for Harrow homes — designed around Metroland semis, installed in under a week. Kitchens, offices, garden rooms.',
  },
}

const metresFix = (s: string) =>
  s.replace(/3-meter projection or 4 meters/g, '3-metre projection or 4 metres')

const payload = await getPayload({ config })
console.log('Patching existing content…')

/* --------------------------------------------------------------------- faqs */
const faqs = await payload.find({ collection: 'faqs', limit: 100 })
for (const faq of faqs.docs) {
  const answer = metresFix(faq.answer ?? '')
  if (answer !== faq.answer) {
    await payload.update({ collection: 'faqs', id: faq.id, data: { answer } })
    console.log(`✔ faqs: 'metres' fix in "${faq.question}"`)
  }
}

/* -------------------------------------------------------------------- pages */
const pages = await payload.find({ collection: 'pages', limit: 100, depth: 0 })
for (const page of pages.docs) {
  const data: Record<string, unknown> = {}

  if (page.sections && page.sections.length > 0) {
    const before = JSON.stringify(page.sections)
    const after = metresFix(
      before.replace(/"suffix":"weeks"/g, '"suffix":" weeks"').replace(/"suffix":"days"/g, '"suffix":" days"'),
    )
    if (after !== before) data.sections = JSON.parse(after)
  }

  const newDesc = META_FIXES.pages[page.slug]
  if (newDesc && page.seo?.metaDescription !== newDesc) {
    data.seo = { ...(page.seo ?? {}), metaDescription: newDesc }
  }

  if (Object.keys(data).length > 0) {
    await payload.update({ collection: 'pages', id: page.id, data })
    console.log(`✔ pages/${page.slug}: patched ${Object.keys(data).join(' + ')}`)
  }
}

/* -------------------------------------------------------------------- areas */
const areas = await payload.find({ collection: 'areas', limit: 100, depth: 0 })
for (const area of areas.docs) {
  const newDesc = META_FIXES.areas[area.slug]
  if (newDesc && area.seo?.metaDescription !== newDesc) {
    await payload.update({
      collection: 'areas',
      id: area.id,
      data: { seo: { ...(area.seo ?? {}), metaDescription: newDesc } },
    })
    console.log(`✔ areas/${area.slug}: metaDescription tightened to ${newDesc.length} chars`)
  }
}

console.log('Content fixes complete.')
