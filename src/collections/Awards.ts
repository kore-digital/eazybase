import type { CollectionConfig } from 'payload'

import { isAdminOrEditor } from '../access/roles'
import { collectionRevalidateHooks } from '../lib/revalidate-hooks'

export const Awards: CollectionConfig = {
  slug: 'awards',
  admin: {
    useAsTitle: 'title',
    defaultColumns: ['title', 'year', 'featured'],
    group: 'Content',
  },
  access: {
    read: () => true,
    create: isAdminOrEditor,
    update: isAdminOrEditor,
    delete: isAdminOrEditor,
  },
  // 'pages' too — awardBadge blocks can embed award docs in the cached page tree.
  hooks: collectionRevalidateHooks(['awards', 'pages']),
  fields: [
    {
      name: 'title',
      type: 'text',
      required: true,
    },
    {
      name: 'body',
      type: 'text',
      admin: { description: 'Awarding body, e.g. Northern Enterprise Awards.' },
    },
    {
      name: 'year',
      type: 'number',
    },
    {
      name: 'image',
      type: 'upload',
      relationTo: 'media',
    },
    {
      name: 'featured',
      type: 'checkbox',
      defaultValue: false,
      admin: { position: 'sidebar' },
    },
  ],
}
