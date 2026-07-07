import type { CollectionConfig } from 'payload'

import { isAdminOrEditor } from '../access/roles'
import { collectionRevalidateHooks } from '../lib/revalidate-hooks'

export const GalleryItems: CollectionConfig = {
  slug: 'gallery-items',
  labels: { singular: 'Gallery item', plural: 'Gallery' },
  admin: {
    useAsTitle: 'alt',
    defaultColumns: ['alt', 'category', 'order'],
    group: 'Content',
  },
  access: {
    read: () => true,
    create: isAdminOrEditor,
    update: isAdminOrEditor,
    delete: isAdminOrEditor,
  },
  // 'pages' too — galleryStrip blocks can embed gallery items in the cached page tree.
  hooks: collectionRevalidateHooks(['gallery-items', 'pages']),
  defaultSort: 'order',
  fields: [
    {
      name: 'image',
      type: 'upload',
      relationTo: 'media',
      required: true,
    },
    {
      name: 'alt',
      type: 'text',
      required: true,
    },
    {
      name: 'category',
      type: 'select',
      options: [
        { label: 'Exterior', value: 'exterior' },
        { label: 'Interior', value: 'interior' },
        { label: 'Build progress', value: 'build-progress' },
        { label: 'Before / After', value: 'before-after' },
      ],
      required: true,
    },
    {
      name: 'beforeImage',
      type: 'upload',
      relationTo: 'media',
      admin: {
        description: 'Optional — when set, the frontend renders a before/after slider.',
      },
    },
    {
      name: 'caption',
      type: 'text',
    },
    {
      name: 'order',
      type: 'number',
      defaultValue: 0,
      admin: { position: 'sidebar' },
    },
  ],
}
