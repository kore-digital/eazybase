import type { CollectionConfig } from 'payload'

import { isAdminOrEditor } from '../access/roles'

export const GalleryItems: CollectionConfig = {
  slug: 'gallery-items',
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
