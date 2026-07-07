import type { Field, GlobalConfig } from 'payload'

import { isAdminOrEditor, roleOf } from '../access/roles'
import { globalRevalidateHooks } from '../lib/revalidate-hooks'

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
  admin: {
    group: 'Settings',
    hidden: ({ user }) => roleOf(user) !== 'admin',
  },
  access: {
    read: () => true,
    update: isAdminOrEditor,
  },
  hooks: globalRevalidateHooks('navigation'),
  fields: [navArray('mainNav'), navArray('footerNav')],
}
