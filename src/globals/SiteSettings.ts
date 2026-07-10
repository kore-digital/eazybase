import type { GlobalConfig } from 'payload'

import { isAdminFieldLevel, isAdminOrEditor } from '../access/roles'
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
    {
      // The two full-width photo bands on the home page (HQ/fleet + team). Editable
      // via the live editor; each falls back to its original static photo/caption.
      name: 'homePhotos',
      type: 'group',
      label: 'Home page photo bands',
      admin: { description: 'The two full-width photo bands on the home page.' },
      fields: [
        { name: 'band1Image', type: 'upload', relationTo: 'media', label: 'Band 1 image (HQ / fleet)' },
        { name: 'band1Eyebrow', type: 'text' },
        { name: 'band1Heading', type: 'text' },
        { name: 'band1Sub', type: 'textarea' },
        { name: 'band2Image', type: 'upload', relationTo: 'media', label: 'Band 2 image (team)' },
        { name: 'band2Eyebrow', type: 'text' },
        { name: 'band2Heading', type: 'text' },
        { name: 'band2Sub', type: 'textarea' },
      ],
    },
    {
      // PIN that unlocks the "EazyBase Analytics" phone app (/analytics). Admin-only:
      // stripped from all public API reads; the app reads it server-side to verify.
      name: 'analyticsPin',
      type: 'text',
      label: 'Analytics app PIN',
      access: { read: isAdminFieldLevel, update: isAdminFieldLevel },
      admin: {
        description:
          'The 4–6 digit PIN that unlocks the EazyBase Analytics phone app (eazybase-kohl.vercel.app/analytics). Change it any time — it takes effect immediately.',
      },
    },
    {
      name: 'promoEnabled',
      type: 'checkbox',
      label: 'Show launch-offer pop-up',
      defaultValue: true,
      admin: {
        description:
          'Turn the free-SkyPod launch offer on or off (the pop-up and the instant-quote banner). Untick to hide it site-wide immediately.',
      },
    },
  ],
}
