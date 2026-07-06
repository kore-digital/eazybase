import { unstable_cache } from 'next/cache'

import { getPayloadClient } from '@/lib/data'
import type { Award } from '@/payload-types'

/** The featured award (Northern Enterprise Awards 2023) — falls back to the newest award. */
export const getFeaturedAward = unstable_cache(
  async (): Promise<Award | null> => {
    try {
      const payload = await getPayloadClient()
      const featured = await payload.find({
        collection: 'awards',
        where: { featured: { equals: true } },
        limit: 1,
        depth: 1,
      })
      if (featured.docs[0]) return featured.docs[0]
      const any = await payload.find({ collection: 'awards', limit: 1, sort: '-year', depth: 1 })
      return any.docs[0] ?? null
    } catch {
      return null
    }
  },
  ['award-featured'],
  { tags: ['awards'] },
)
