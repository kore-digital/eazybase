import type { Field, GlobalConfig } from 'payload'

import { isAdminOrEditor } from '../access/roles'

const navArray = (name: string): Field => ({
  name,
  type: 'array',
  fields: [
    { name: 'label', type: 'text', required: true },
    { name: 'href', type: 'text', required: true },
  ],
})

export const Navigation: GlobalConfig = {
  slug: 'navigation',
  admin: { group: 'Site' },
  access: {
    read: () => true,
    update: isAdminOrEditor,
  },
  fields: [navArray('mainNav'), navArray('footerNav')],
}
