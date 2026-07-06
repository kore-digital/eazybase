import { SITE } from '@/lib/site'

/**
 * Single source of truth for absolute URLs. Mirrors the (frontend) layout's
 * metadataBase resolution (NEXT_PUBLIC_SERVER_URL first, production domain as
 * fallback) so the sitemap, robots.txt, JSON-LD and page canonicals can never
 * disagree about the host.
 */
export const BASE_URL = (process.env.NEXT_PUBLIC_SERVER_URL || SITE.domain).replace(/\/+$/, '')
