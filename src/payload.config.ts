import { postgresAdapter } from '@payloadcms/db-postgres'
import { lexicalEditor } from '@payloadcms/richtext-lexical'
import { s3Storage } from '@payloadcms/storage-s3'
import path from 'path'
import { buildConfig } from 'payload'
import { fileURLToPath } from 'url'
import sharp from 'sharp'

import { Users } from './collections/Users'
import { Media } from './collections/Media'
import { Pages } from './collections/Pages'
import { Areas } from './collections/Areas'
import { FAQs } from './collections/FAQs'
import { Testimonials } from './collections/Testimonials'
import { GalleryItems } from './collections/GalleryItems'
import { Awards } from './collections/Awards'
import { QuoteRequests } from './collections/QuoteRequests'
import { Navigation } from './globals/Navigation'
import { SiteSettings } from './globals/SiteSettings'

const filename = fileURLToPath(import.meta.url)
const dirname = path.dirname(filename)

export default buildConfig({
  admin: {
    user: Users.slug,
    importMap: {
      baseDir: path.resolve(dirname),
    },
  },
  collections: [Pages, Areas, FAQs, Testimonials, GalleryItems, Awards, Media, QuoteRequests, Users],
  globals: [SiteSettings, Navigation],
  editor: lexicalEditor(),
  secret: process.env.PAYLOAD_SECRET || '',
  typescript: {
    outputFile: path.resolve(dirname, 'payload-types.ts'),
  },
  // Supabase Postgres. Use the connection POOLER string (Supavisor) for
  // serverless on Vercel — the direct 5432 connection exhausts under Functions.
  // Schema is driven by committed migrations (`payload migrate`, run in the
  // build) rather than live push; set PAYLOAD_DB_PUSH=true for quick local dev.
  db: postgresAdapter({
    pool: {
      connectionString: process.env.DATABASE_URI || '',
    },
    push: process.env.PAYLOAD_DB_PUSH === 'true',
  }),
  sharp,
  plugins: [
    // Media files → Supabase Storage (S3-compatible). The plugin disables
    // local disk for the media collection automatically.
    s3Storage({
      enabled: Boolean(process.env.S3_BUCKET),
      collections: {
        media: true,
      },
      bucket: process.env.S3_BUCKET || '',
      config: {
        endpoint: process.env.S3_ENDPOINT,
        region: process.env.S3_REGION || 'us-east-1',
        forcePathStyle: true, // required for Supabase Storage
        credentials: {
          accessKeyId: process.env.S3_ACCESS_KEY_ID || '',
          secretAccessKey: process.env.S3_SECRET_ACCESS_KEY || '',
        },
      },
    }),
  ],
})
