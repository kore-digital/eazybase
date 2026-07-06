import type { CollectionConfig } from 'payload'

import { isAdmin, isAdminOrEditor, publishedOrLoggedIn } from '../access/roles'
import { collectionRevalidateHooks } from '../lib/revalidate-hooks'
import { seoField } from '../fields/seo'

export const Areas: CollectionConfig = {
  slug: 'areas',
  admin: {
    useAsTitle: 'name',
    defaultColumns: ['name', 'slug', 'region', 'isHub', 'published'],
    group: 'Site',
  },
  access: {
    read: publishedOrLoggedIn,
    create: isAdmin,
    update: isAdminOrEditor,
    delete: isAdmin,
  },
  hooks: collectionRevalidateHooks(['areas'], (doc) => (doc?.slug ? `area-${doc.slug}` : undefined)),
  fields: [
    {
      name: 'slug',
      type: 'text',
      required: true,
      unique: true,
      index: true,
      admin: { position: 'sidebar' },
    },
    {
      name: 'name',
      type: 'text',
      required: true,
    },
    {
      name: 'region',
      type: 'select',
      options: [
        { label: 'North West', value: 'north-west' },
        { label: 'London', value: 'london' },
      ],
      required: true,
      admin: { position: 'sidebar' },
    },
    {
      name: 'isHub',
      type: 'checkbox',
      defaultValue: false,
      admin: { position: 'sidebar', description: 'Regional hub page (North West / London).' },
    },
    {
      name: 'heroHeading',
      type: 'text',
    },
    {
      name: 'intro',
      type: 'richText',
      admin: { description: 'The unique local copy for this area.' },
    },
    {
      name: 'localAngles',
      type: 'array',
      admin: { description: 'Local housing stock / planning context / landmarks.' },
      fields: [
        { name: 'heading', type: 'text', required: true },
        { name: 'body', type: 'textarea', required: true },
      ],
    },
    {
      name: 'faqs',
      type: 'array',
      admin: { description: 'Localised FAQs for this area.' },
      fields: [
        { name: 'q', type: 'text', required: true },
        { name: 'a', type: 'textarea', required: true },
      ],
    },
    seoField,
    {
      name: 'published',
      type: 'checkbox',
      defaultValue: false,
      admin: { position: 'sidebar' },
    },
  ],
}
