import path from 'path'
import { fileURLToPath } from 'url'
import type { CollectionConfig } from 'payload'

import { isAdminOrEditor } from '../access/roles'
import { collectionRevalidateHooks } from '../lib/revalidate-hooks'

const dirname = path.dirname(fileURLToPath(import.meta.url))

export const Media: CollectionConfig = {
  slug: 'media',
  labels: { singular: 'Image', plural: 'Images' },
  admin: {
    useAsTitle: 'alt',
    defaultColumns: ['filename', 'alt', 'updatedAt'],
    group: 'Content',
  },
  access: {
    read: () => true,
    create: isAdminOrEditor,
    update: isAdminOrEditor,
    delete: isAdminOrEditor,
  },
  // Media has no tag of its own — it is embedded (depth > 0) in these caches.
  hooks: collectionRevalidateHooks(['pages', 'areas', 'gallery-items', 'awards']),
  upload: {
    // repo-root ./media — gitignored
    staticDir: path.resolve(dirname, '../../media'),
    focalPoint: true,
    imageSizes: [
      { name: 'thumb', width: 480 },
      { name: 'card', width: 900 },
      { name: 'hero', width: 1920 },
    ],
  },
  fields: [
    {
      name: 'alt',
      type: 'text',
      required: true,
    },
  ],
}
