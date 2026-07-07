import config from '@payload-config'
import { unstable_cache } from 'next/cache'
import { getPayload } from 'payload'

import type { Area, Faq, GalleryItem, Page, Testimonial } from '@/payload-types'

export const getPayloadClient = () => getPayload({ config })

/** Cached lookups — revalidated by tag so CMS edits show up without a rebuild. */

export const getPage = (slug: string) =>
  unstable_cache(
    async (): Promise<Page | null> => {
      const payload = await getPayloadClient()
      const res = await payload.find({
        collection: 'pages',
        where: { slug: { equals: slug }, published: { equals: true } },
        limit: 1,
        depth: 2,
      })
      return res.docs[0] ?? null
    },
    [`page-${slug}`],
    { tags: [`page-${slug}`, 'pages'] },
  )()

export const getArea = (slug: string) =>
  unstable_cache(
    async (): Promise<Area | null> => {
      const payload = await getPayloadClient()
      const res = await payload.find({
        collection: 'areas',
        where: { slug: { equals: slug }, published: { equals: true } },
        limit: 1,
        depth: 2,
      })
      return res.docs[0] ?? null
    },
    [`area-${slug}`],
    { tags: [`area-${slug}`, 'areas'] },
  )()

export const getAllAreas = unstable_cache(
  async (): Promise<Area[]> => {
    const payload = await getPayloadClient()
    const res = await payload.find({
      collection: 'areas',
      where: { published: { equals: true } },
      limit: 100,
      sort: 'name',
    })
    return res.docs
  },
  ['areas-all'],
  { tags: ['areas'] },
)

export const getFaqs = unstable_cache(
  async (): Promise<Faq[]> => {
    const payload = await getPayloadClient()
    const res = await payload.find({ collection: 'faqs', limit: 100, sort: 'order' })
    return res.docs
  },
  ['faqs-all'],
  { tags: ['faqs'] },
)

export const getTestimonials = unstable_cache(
  async (): Promise<Testimonial[]> => {
    const payload = await getPayloadClient()
    const res = await payload.find({ collection: 'testimonials', limit: 100 })
    return res.docs
  },
  ['testimonials-all'],
  { tags: ['testimonials'] },
)

export const getGalleryItems = unstable_cache(
  async (): Promise<GalleryItem[]> => {
    const payload = await getPayloadClient()
    const res = await payload.find({ collection: 'gallery-items', limit: 200, sort: 'order', depth: 1 })
    return res.docs
  },
  ['gallery-all'],
  { tags: ['gallery-items'] },
)

export const getSiteSettings = unstable_cache(
  async () => {
    const payload = await getPayloadClient()
    return payload.findGlobal({ slug: 'site-settings' })
  },
  ['site-settings'],
  { tags: ['site-settings'] },
)

export const getNavigation = unstable_cache(
  async () => {
    const payload = await getPayloadClient()
    return payload.findGlobal({ slug: 'navigation' })
  },
  ['navigation'],
  { tags: ['navigation'] },
)

/**
 * Editable instant-quote pricing. Returns the raw global or null on failure —
 * callers pass it through resolveQuotePricing() so a missing global / unrun
 * migration degrades to the code defaults rather than a 500.
 */
export const getQuotePricing = unstable_cache(
  async () => {
    try {
      const payload = await getPayloadClient()
      return await payload.findGlobal({ slug: 'quote-pricing' })
    } catch (err) {
      console.error('[getQuotePricing] falling back to defaults:', err)
      return null
    }
  },
  ['quote-pricing'],
  { tags: ['quote-pricing'] },
)
