import type { GlobalConfig } from 'payload'

import { isAdminOrEditor } from '../access/roles'
import { globalRevalidateHooks } from '../lib/revalidate-hooks'
import { DEFAULT_QUOTE_PRICING } from '../components/quote/pricing'

/**
 * Editable instant-quote pricing — the size-only £ model plus survey-fee and
 * size-cap settings. The frontend reads this via getQuotePricing() and merges
 * it with DEFAULT_QUOTE_PRICING, so blank fields fall back to the code defaults.
 */
export const QuotePricing: GlobalConfig = {
  slug: 'quote-pricing',
  label: 'Quote pricing',
  admin: {
    group: 'Settings',
    description:
      'Controls the /instant-quote estimator. Price = size only; extension type and finish do not change it.',
  },
  access: {
    read: () => true,
    update: isAdminOrEditor,
  },
  hooks: globalRevalidateHooks('quote-pricing'),
  fields: [
    {
      type: 'collapsible',
      label: 'Price model (size only)',
      admin: { initCollapsed: false },
      fields: [
        {
          type: 'row',
          fields: [
            {
              name: 'priceFloor',
              type: 'number',
              defaultValue: DEFAULT_QUOTE_PRICING.priceFloor,
              admin: {
                width: '50%',
                description: 'Base price (£) covering up to the floor area below.',
              },
            },
            {
              name: 'floorAreaM2',
              type: 'number',
              defaultValue: DEFAULT_QUOTE_PRICING.floorAreaM2,
              admin: { width: '50%', description: 'Floor area (m²) included in the base price.' },
            },
          ],
        },
        {
          type: 'row',
          fields: [
            {
              name: 'startRatePerM2',
              type: 'number',
              defaultValue: DEFAULT_QUOTE_PRICING.startRatePerM2,
              admin: {
                width: '50%',
                description: '£/m² added to the LOW price for each m² above the floor area.',
              },
            },
            {
              name: 'flatRatePerM2',
              type: 'number',
              defaultValue: DEFAULT_QUOTE_PRICING.flatRatePerM2,
              admin: { width: '50%', description: '£/m² flat rate that sets the HIGH price.' },
            },
          ],
        },
      ],
    },
    {
      type: 'collapsible',
      label: 'Survey call-out fee',
      admin: { initCollapsed: false },
      fields: [
        {
          type: 'row',
          fields: [
            {
              name: 'surveyFee',
              type: 'number',
              defaultValue: DEFAULT_QUOTE_PRICING.surveyFee,
              admin: {
                width: '33%',
                description: 'Fee (£) added beyond the radius. Deducted from final cost if they proceed.',
              },
            },
            {
              name: 'surveyDistanceMiles',
              type: 'number',
              defaultValue: DEFAULT_QUOTE_PRICING.surveyDistanceMiles,
              admin: { width: '33%', description: 'Distance (miles) that triggers the fee.' },
            },
            {
              name: 'basePostcode',
              type: 'text',
              defaultValue: DEFAULT_QUOTE_PRICING.basePostcode,
              admin: { width: '34%', description: 'HQ postcode the distance is measured from.' },
            },
          ],
        },
      ],
    },
    {
      type: 'collapsible',
      label: 'Size limits',
      admin: {
        initCollapsed: true,
        description: 'Slider caps. Anything larger routes to the bespoke enquiry path.',
      },
      fields: [
        {
          type: 'row',
          fields: [
            {
              name: 'minWidthM',
              type: 'number',
              defaultValue: DEFAULT_QUOTE_PRICING.minWidthM,
              admin: { width: '25%', description: 'Min width (m)' },
            },
            {
              name: 'maxWidthM',
              type: 'number',
              defaultValue: DEFAULT_QUOTE_PRICING.maxWidthM,
              admin: { width: '25%', description: 'Max width (m)' },
            },
            {
              name: 'minDepthM',
              type: 'number',
              defaultValue: DEFAULT_QUOTE_PRICING.minDepthM,
              admin: { width: '25%', description: 'Min depth (m)' },
            },
            {
              name: 'maxDepthM',
              type: 'number',
              defaultValue: DEFAULT_QUOTE_PRICING.maxDepthM,
              admin: { width: '25%', description: 'Max depth (m)' },
            },
          ],
        },
        {
          name: 'stepM',
          type: 'number',
          defaultValue: DEFAULT_QUOTE_PRICING.stepM,
          admin: { description: 'Slider step (m).' },
        },
      ],
    },
  ],
}
