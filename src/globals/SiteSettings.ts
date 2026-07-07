import type { GlobalConfig } from 'payload'

import { isAdminOrEditor } from '../access/roles'
import { globalRevalidateHooks } from '../lib/revalidate-hooks'

export const SiteSettings: GlobalConfig = {
  slug: 'site-settings',
  label: 'Site Settings',
  admin: { group: 'Settings' },
  access: {
    read: () => true,
    update: isAdminOrEditor,
  },
  hooks: globalRevalidateHooks('site-settings'),
  fields: [
    { name: 'phone', type: 'text', admin: { description: 'Display format, e.g. 0330 229 0775' } },
    {
      name: 'whatsappNumber',
      type: 'text',
      admin: { description: 'International format without +, e.g. 447845655113' },
    },
    { name: 'email', type: 'email' },
    { name: 'tagline', type: 'text' },
    {
      name: 'awardLine',
      type: 'text',
      admin: { description: 'Trust line shown near the fold and in the footer.' },
    },
    {
      name: 'socials',
      type: 'group',
      fields: [
        { name: 'facebook', type: 'text' },
        { name: 'instagram', type: 'text' },
        { name: 'tiktok', type: 'text', admin: { description: 'e.g. https://www.tiktok.com/@eazybase2' } },
        { name: 'yell', type: 'text' },
        { name: 'google', type: 'text' },
      ],
    },
    {
      name: 'stats',
      type: 'group',
      fields: [
        { name: 'factoryWeeks', type: 'number', admin: { description: 'Factory build, weeks' } },
        { name: 'installDays', type: 'number', admin: { description: 'On-site install, days' } },
        { name: 'guaranteeYears', type: 'number', admin: { description: 'Guarantee, years' } },
      ],
    },
  ],
}
