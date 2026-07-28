import { withPayload } from '@payloadcms/next/withPayload'
import type { NextConfig } from 'next'
import path from 'path'
import { fileURLToPath } from 'url'

import { AREAS } from './src/lib/site'

const __filename = fileURLToPath(import.meta.url)
const dirname = path.dirname(__filename)

const nextConfig: NextConfig = {
  /**
   * 301s preserving the old WordPress URLs. Next's default trailing-slash
   * normalisation (trailingSlash: false) 308s `/foo/` → `/foo` before these
   * run, so each old slug only needs the non-trailing form here.
   *
   * `/instant-quote` now 301s into the merged `/get-a-quote` (one page, two
   * modes) so old links + bookmarks keep working. All other 1:1 slugs
   * (/about-us/, /faq/, …) need no entry; only the
   * `{town}-modular-home-extensions` pattern moved.
   */
  async redirects() {
    return [
      { source: '/instant-quote', destination: '/get-a-quote', permanent: true },
      ...AREAS.flatMap((area) =>
        area.oldSlug
          ? [
              {
                source: `/${area.oldSlug}`,
                destination: `/areas/${area.slug}`,
                permanent: true,
              },
            ]
          : [],
      ),
    ]
  },
  images: {
    // Optimization disabled. CMS media is served by Payload's own route
    // (`/api/media/file/**`), which streams from Supabase Storage; on Vercel the
    // image optimizer's internal self-fetch of that route 404s, so every CMS
    // photo silently failed to render. Payload already generates thumb/card/hero
    // variants (and the /public assets are small, <400KB each), so serving
    // originals directly costs little and renders reliably.
    unoptimized: true,
  },
  webpack: (webpackConfig) => {
    webpackConfig.resolve.extensionAlias = {
      '.cjs': ['.cts', '.cjs'],
      '.js': ['.ts', '.tsx', '.js', '.jsx'],
      '.mjs': ['.mts', '.mjs'],
    }

    return webpackConfig
  },
  turbopack: {
    root: path.resolve(dirname),
  },
}

export default withPayload(nextConfig, { devBundleServerPackages: false })
