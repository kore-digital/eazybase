/**
 * One-off: align the live navigation global's mainNav with the current seed —
 * drop "Get a Quote" (the header CTA covers it) and surface "Social".
 * Run: npx payload run src/seed/fix-nav.ts
 */
import config from '@payload-config'
import { getPayload } from 'payload'

const payload = await getPayload({ config })

await payload.updateGlobal({
  slug: 'navigation',
  data: {
    mainNav: [
      { label: 'Home', href: '/' },
      { label: 'About Us', href: '/about-us' },
      { label: 'What We Do', href: '/what-we-do' },
      { label: 'Gallery', href: '/gallery' },
      { label: 'Areas', href: '/areas' },
      { label: 'FAQ', href: '/faq' },
    ],
  },
})

const nav = await payload.findGlobal({ slug: 'navigation' })
console.log(
  'mainNav is now:',
  (nav.mainNav ?? []).map((i: { label: string }) => i.label).join(', '),
)
