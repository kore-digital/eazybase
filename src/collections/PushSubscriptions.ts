import type { CollectionConfig } from 'payload'

import { isAdmin } from '../access/roles'

/**
 * Web-push subscriptions for the EazyBase Analytics phone app. One row per
 * device that has opted in to lead alerts. Rows are written/read via the
 * Payload Local API from the analytics server actions (which run with
 * overrideAccess), so the admin-only access here just keeps the REST/admin
 * surface locked down — the PIN gate is the app's trust boundary.
 */
export const PushSubscriptions: CollectionConfig = {
  slug: 'push-subscriptions',
  labels: { singular: 'Push subscription', plural: 'Push subscriptions' },
  admin: {
    useAsTitle: 'endpoint',
    defaultColumns: ['label', 'endpoint', 'createdAt'],
    group: 'Enquiries',
    hidden: true,
  },
  access: {
    create: isAdmin,
    read: isAdmin,
    update: isAdmin,
    delete: isAdmin,
  },
  fields: [
    { name: 'endpoint', type: 'text', required: true, index: true },
    { name: 'p256dh', type: 'text', required: true },
    { name: 'auth', type: 'text', required: true },
    { name: 'label', type: 'text', admin: { description: 'Device / browser it was created from.' } },
  ],
}
