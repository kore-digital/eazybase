import type { CollectionConfig } from 'payload'

import { anyone, isAdmin, isAdminFieldLevel, isAdminOrEditor } from '../access/roles'

export const QuoteRequests: CollectionConfig = {
  slug: 'quote-requests',
  admin: {
    useAsTitle: 'email',
    defaultColumns: ['firstName', 'lastName', 'email', 'type', 'status', 'createdAt'],
    group: 'Admin',
  },
  access: {
    create: anyone, // public form submissions
    read: isAdminOrEditor,
    update: isAdmin,
    delete: isAdmin,
  },
  hooks: {
    afterChange: [
      ({ doc, operation }) => {
        if (operation === 'create') {
          // Email notification stub — SMTP not configured yet.
          console.log(
            `[quote-requests] New ${doc.type ?? 'full'} quote request from ` +
              `${doc.firstName ?? ''} ${doc.lastName ?? ''} <${doc.email ?? 'no email'}> ` +
              `(postcode ${doc.postcode ?? '—'}). TODO: send notification email to info@eazybase.co.uk.`,
          )
        }
      },
    ],
  },
  fields: [
    {
      name: 'type',
      type: 'select',
      options: [
        { label: 'Full quote', value: 'full' },
        { label: 'Instant quote', value: 'instant' },
      ],
      defaultValue: 'full',
      required: true,
    },
    { name: 'firstName', type: 'text', required: true },
    { name: 'lastName', type: 'text', required: true },
    { name: 'email', type: 'email', required: true },
    { name: 'phone', type: 'text', required: true },
    { name: 'postcode', type: 'text', required: true },
    { name: 'addressLine1', type: 'text' },
    { name: 'town', type: 'text' },
    { name: 'message', type: 'textarea' },
    {
      name: 'estimator',
      type: 'group',
      admin: { description: 'Instant-quote estimator inputs and indicative range.' },
      fields: [
        { name: 'extensionType', type: 'text' },
        { name: 'widthM', type: 'number' },
        { name: 'depthM', type: 'number' },
        { name: 'spec', type: 'text' },
        { name: 'estimateLow', type: 'number' },
        { name: 'estimateHigh', type: 'number' },
      ],
    },
    {
      name: 'status',
      type: 'select',
      options: [
        { label: 'New', value: 'new' },
        { label: 'Contacted', value: 'contacted' },
        { label: 'Closed', value: 'closed' },
      ],
      defaultValue: 'new',
      required: true,
      access: {
        // Only admins can move a lead through the pipeline.
        update: isAdminFieldLevel,
      },
      admin: { position: 'sidebar' },
    },
  ],
}
