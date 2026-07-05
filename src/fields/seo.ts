import type { Field } from 'payload'

/** Reusable SEO group — metaTitle + metaDescription (schema contract: seo { metaTitle, metaDescription }). */
export const seoField: Field = {
  name: 'seo',
  type: 'group',
  admin: {
    description: 'Search-engine title tag and meta description for this page.',
  },
  fields: [
    {
      name: 'metaTitle',
      type: 'text',
      maxLength: 70,
    },
    {
      name: 'metaDescription',
      type: 'textarea',
      maxLength: 170,
    },
  ],
}
