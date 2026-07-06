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
   * NOTE: `/instant-quote/` is deliberately NOT redirected — it is a real
   * page in the rebuild. All other 1:1 slugs (/about-us/, /faq/, …) need no
   * entry either; only the `{town}-modular-home-extensions` pattern moved.
   */
  async redirects() {
    return AREAS.flatMap((area) =>
      area.oldSlug
        ? [
            {
              source: `/${area.oldSlug}`,
              destination: `/areas/${area.slug}`,
              permanent: true,
            },
          ]
        : [],
    )
  },
  images: {
    localPatterns: [
      {
        pathname: '/api/media/file/**',
      },
    ],
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
