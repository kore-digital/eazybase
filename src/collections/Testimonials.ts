import type { CollectionConfig } from 'payload'

import { isAdminOrEditor } from '../access/roles'

export const Testimonials: CollectionConfig = {
  slug: 'testimonials',
  admin: {
    useAsTitle: 'author',
    defaultColumns: ['author', 'title', 'platform', 'featured'],
    group: 'Content',
  },
  access: {
    read: () => true,
    create: isAdminOrEditor,
    update: isAdminOrEditor,
    delete: isAdminOrEditor,
  },
  fields: [
    {
      name: 'quote',
      type: 'textarea',
      required: true,
    },
    {
      name: 'author',
      type: 'text',
      required: true,
    },
    {
      name: 'platform',
      type: 'select',
      options: [
        { label: 'Google', value: 'google' },
        { label: 'Yell', value: 'yell' },
        { label: 'Facebook', value: 'facebook' },
      ],
      required: true,
    },
    {
      name: 'title',
      type: 'text',
      admin: { description: 'Short review headline, e.g. "What a team!"' },
    },
    {
      name: 'featured',
      type: 'checkbox',
      defaultValue: false,
      admin: { position: 'sidebar' },
    },
  ],
}
