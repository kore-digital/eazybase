import type { CollectionConfig } from 'payload'

import { anyone, isAdmin, isAdminFieldLevel, isAdminOrEditor } from '../access/roles'
import { PROPERTY_TYPES, TIMELINES } from '../components/quote/pricing'
import { FROM_CUSTOMER, FROM_TEAM, customerConfirmEmail, leadNotifyTo, teamLeadEmail } from '../lib/email'
import { sendLeadPush } from '../lib/push'

export const QuoteRequests: CollectionConfig = {
  slug: 'quote-requests',
  labels: { singular: 'Enquiry', plural: 'Enquiries' },
  admin: {
    useAsTitle: 'email',
    defaultColumns: ['firstName', 'lastName', 'email', 'type', 'status', 'createdAt'],
    group: 'Enquiries',
  },
  access: {
    create: anyone, // public form submissions
    read: isAdminOrEditor,
    update: isAdmin,
    delete: isAdmin,
  },
  hooks: {
    afterChange: [
      async ({ doc, operation, req }) => {
        if (operation !== 'create') return

        // Audit trail (always).
        req.payload.logger.info(
          `[quote-requests] New ${doc.type ?? 'full'} enquiry from ` +
            `${doc.firstName ?? ''} ${doc.lastName ?? ''} <${doc.email ?? 'no email'}> ` +
            `(postcode ${doc.postcode ?? '—'}).`,
        )

        // Email is best-effort — never block or fail the submission. The adapter
        // (src/lib/email.ts) no-ops with a log when RESEND_API_KEY is unset.

        // 1) Notify the team; replies go straight back to the customer.
        try {
          const team = teamLeadEmail(doc)
          await req.payload.sendEmail({
            to: leadNotifyTo(),
            from: FROM_TEAM,
            replyTo: doc.email || undefined,
            subject: team.subject,
            html: team.html,
            text: team.text,
          })
        } catch (err) {
          req.payload.logger.error(`[quote-requests] team email failed: ${String(err)}`)
        }

        // 2) Confirm to the customer; replies go to the team.
        if (doc.email) {
          try {
            const conf = customerConfirmEmail(doc)
            await req.payload.sendEmail({
              to: doc.email,
              from: FROM_CUSTOMER,
              replyTo: leadNotifyTo(),
              subject: conf.subject,
              html: conf.html,
              text: conf.text,
            })
          } catch (err) {
            req.payload.logger.error(`[quote-requests] confirmation email failed: ${String(err)}`)
          }
        }

        // 3) Push a phone notification to the analytics app (best-effort; no-ops
        //    when VAPID keys are unset).
        try {
          await sendLeadPush(req.payload, doc)
        } catch (err) {
          req.payload.logger.error(`[quote-requests] lead push failed: ${String(err)}`)
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
        {
          name: 'surveyRequired',
          type: 'checkbox',
          admin: { description: 'Postcode is beyond the survey radius — a call-out fee applies.' },
        },
        { name: 'surveyFee', type: 'number', admin: { description: 'Survey call-out fee (£).' } },
        {
          name: 'distanceMiles',
          type: 'number',
          admin: { description: 'Straight-line miles from the HQ postcode.' },
        },
      ],
    },
    {
      name: 'status',
      type: 'select',
      options: [
        { label: 'New', value: 'new' },
        { label: 'Emailed — no answer', value: 'emailed_no_answer' },
        { label: 'Called — no answer', value: 'called_no_answer' },
        { label: 'Spoke to customer', value: 'spoke' },
        { label: 'Quote sent', value: 'quote_sent' },
        { label: 'Won', value: 'won' },
        { label: 'Lost', value: 'lost' },
        // Legacy values — kept so pre-existing leads still render.
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
    {
      name: 'lastContactedAt',
      type: 'date',
      admin: {
        position: 'sidebar',
        description: 'Set when the lead is emailed/called/spoken to.',
        date: { pickerAppearance: 'dayAndTime' },
      },
    },
    {
      name: 'nextFollowUpAt',
      type: 'date',
      admin: {
        position: 'sidebar',
        description: 'When this lead is due a chase. Auto-set 7 days ahead on "no answer".',
        date: { pickerAppearance: 'dayAndTime' },
      },
    },
    {
      name: 'internalNotes',
      type: 'textarea',
      admin: {
        position: 'sidebar',
        description: 'Private staff notes (not shown to the customer).',
      },
    },
  ],
}
