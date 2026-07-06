import type { CollectionConfig } from 'payload'

import {
  isAdmin,
  isAdminFieldLevel,
  isAdminOrSelf,
  isAdminOrSelfFieldLevel,
  roleOf,
} from '../access/roles'

export const Users: CollectionConfig = {
  slug: 'users',
  labels: { singular: 'Team member', plural: 'Team' },
  admin: {
    useAsTitle: 'email',
    defaultColumns: ['email', 'role'],
    group: 'Settings',
    hidden: ({ user }) => roleOf(user) !== 'admin',
  },
  auth: true,
  access: {
    // Editors have NO access to other users — they may only read/update themselves.
    read: isAdminOrSelf,
    create: isAdmin, // first user is created via the register-first-user flow (bypasses access)
    update: isAdminOrSelf,
    delete: isAdmin,
  },
  hooks: {
    beforeChange: [
      async ({ req, operation, data }) => {
        // The very first user created (via the admin UI) becomes an admin.
        if (operation === 'create') {
          const { totalDocs } = await req.payload.count({ collection: 'users' })
          if (totalDocs === 0) {
            data.role = 'admin'
          }
        }
        return data
      },
    ],
  },
  fields: [
    // Email + password added by auth: true
    {
      name: 'name',
      type: 'text',
    },
    {
      name: 'role',
      type: 'select',
      options: [
        { label: 'Admin', value: 'admin' },
        { label: 'Editor', value: 'editor' },
      ],
      defaultValue: 'editor',
      required: true,
      saveToJWT: true,
      access: {
        // Only admins can set roles, but every user may read their OWN —
        // /api/users/me must return `role` or the editor overlay never mounts.
        read: isAdminOrSelfFieldLevel,
        create: isAdminFieldLevel,
        update: isAdminFieldLevel,
      },
    },
  ],
}
