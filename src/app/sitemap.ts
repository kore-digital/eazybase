import type { MetadataRoute } from 'next'

import { BASE_URL } from '@/lib/base-url'
import { getAllAreas } from '@/lib/data'

const STATIC_ROUTES: { path: string; priority: number }[] = [
  { path: '/', priority: 1 },
  { path: '/about-us', priority: 0.7 },
  { path: '/what-we-do', priority: 0.9 },
  { path: '/faq', priority: 0.6 },
  { path: '/gallery', priority: 0.8 },
  { path: '/social', priority: 0.4 },
  { path: '/get-a-quote', priority: 0.9 },
  { path: '/instant-quote', priority: 0.8 },
  { path: '/areas', priority: 0.8 },
]

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const areas = await getAllAreas()

  return [
    ...STATIC_ROUTES.map(({ path, priority }) => ({
      url: `${BASE_URL}${path === '/' ? '/' : path}`,
      lastModified: new Date(),
      changeFrequency: 'monthly' as const,
      priority,
    })),
    ...areas.map((area) => ({
      url: `${BASE_URL}/areas/${area.slug}`,
      lastModified: new Date(area.updatedAt),
      changeFrequency: 'monthly' as const,
      priority: area.isHub ? 0.8 : 0.6,
    })),
  ]
}
