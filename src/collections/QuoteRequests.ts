import type { CollectionConfig } from 'payload'

import { anyone, isAdmin, isAdminFieldLevel, isAdminOrEditor } from '../access/roles'
import { PROPERTY_TYPES, TIMELINES } from '../components/quote/pricing'

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
      async ({ doc, operation }) => {
        if (operation !== 'create') return

        // Always log the lead summary — the reliable audit trail either way.
        console.log(
          `[quote-requests] New ${doc.type ?? 'full'} quote request from ` +
            `${doc.firstName ?? ''} ${doc.lastName ?? ''} <${doc.email ?? 'no email'}> ` +
            `(postcode ${doc.postcode ?? '—'}).`,
        )

        // Lead notification email via the Resend HTTP API (plain fetch — no
        // SDK/SMTP dependency). The client must set RESEND_API_KEY (and
        // optionally LEAD_NOTIFY_EMAIL) on deploy — see .env.example. Without
        // a key we only log. Never blocks or fails the submission.
        const apiKey = process.env.RESEND_API_KEY
        if (!apiKey) return
        try {
          const to = process.env.LEAD_NOTIFY_EMAIL || 'info@eazybase.co.uk'
          const est = doc.estimator ?? {}
          const lines = [
            `Type: ${doc.type ?? 'full'}`,
            `Name: ${doc.firstName ?? ''} ${doc.lastName ?? ''}`,
            `Email: ${doc.email ?? '—'}`,
            `Phone: ${doc.phone ?? '—'}`,
            `Postcode: ${doc.postcode ?? '—'}`,
            doc.addressLine1 ? `Address: ${doc.addressLine1}${doc.town ? `, ${doc.town}` : ''}` : '',
            doc.message ? `Message: ${doc.message}` : '',
            est.extensionType ? `Extension: ${est.extensionType}` : '',
            est.widthM ? `Size: ${est.widthM}m × ${est.depthM}m (${est.spec ?? '—'})` : '',
            est.estimateLow ? `Estimate: £${est.estimateLow}–£${est.estimateHigh}` : '',
          ].filter(Boolean)
          const res = await fetch('https://api.resend.com/emails', {
            method: 'POST',
            headers: { Authorization: `Bearer ${apiKey}`, 'Content-Type': 'application/json' },
            body: JSON.stringify({
              // Placeholder sender — swap for a verified eazybase.co.uk address in Resend.
              from: 'EazyBase Leads <onboarding@resend.dev>',
              to: [to],
              subject: `New ${doc.type ?? 'full'} quote request — ${doc.firstName ?? ''} ${doc.lastName ?? ''}`,
              text: lines.join('\n'),
            }),
          })
          if (!res.ok) {
            console.error(`[quote-requests] lead email failed: ${res.status} ${await res.text()}`)
          }
        } catch (err) {
          console.error('[quote-requests] lead email errored:', err)
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
        { label: 'Quote assistant', value: 'assistant' },
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
      name: 'propertyType',
      type: 'select',
      options: PROPERTY_TYPES.map((p) => ({ label: p.label, value: p.key })),
      admin: { description: 'House style — access/complexity context; not a price input.' },
    },
    {
      name: 'timeline',
      type: 'select',
      options: TIMELINES.map((t) => ({ label: t.label, value: t.key })),
    },
    {
      name: 'materialPreferences',
      type: 'text',
      admin: { description: 'Free-text material preferences (e.g. brick, render, bi-folds).' },
    },
    {
      name: 'estimator',
      type: 'group',
      admin: { description: 'Estimator inputs and indicative range (instant wizard + assistant).' },
      fields: [
        { name: 'extensionType', type: 'text' },
        { name: 'sizeBand', type: 'text' },
        { name: 'areaM2', type: 'number' },
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
