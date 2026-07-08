import type { Block, CollectionConfig } from 'payload'

import { isAdmin, isAdminOrEditor, publishedOrLoggedIn } from '../access/roles'
import { collectionRevalidateHooks } from '../lib/revalidate-hooks'
import { seoField } from '../fields/seo'

/* ---------------------------------------------------------------------------
 * Section blocks — kept deliberately simple; the frontend maps them.
 * ------------------------------------------------------------------------- */

const RichTextBlock: Block = {
  slug: 'richText',
  interfaceName: 'RichTextBlock',
  fields: [
    { name: 'eyebrow', type: 'text' },
    { name: 'heading', type: 'text' },
    { name: 'lede', type: 'textarea' },
    { name: 'content', type: 'richText', required: true },
  ],
}

const ImageTextBlock: Block = {
  slug: 'imageText',
  interfaceName: 'ImageTextBlock',
  fields: [
    { name: 'eyebrow', type: 'text' },
    { name: 'heading', type: 'text' },
    { name: 'body', type: 'richText' },
    { name: 'image', type: 'upload', relationTo: 'media' },
    {
      name: 'imageSide',
      type: 'select',
      options: [
        { label: 'Left', value: 'left' },
        { label: 'Right', value: 'right' },
      ],
      defaultValue: 'right',
    },
  ],
}

const UseCaseTabsBlock: Block = {
  slug: 'useCaseTabs',
  interfaceName: 'UseCaseTabsBlock',
  fields: [
    { name: 'eyebrow', type: 'text' },
    { name: 'heading', type: 'text' },
    { name: 'lede', type: 'textarea' },
    {
      name: 'tabs',
      type: 'array',
      minRows: 1,
      fields: [
        { name: 'label', type: 'text', required: true },
        { name: 'heading', type: 'text', required: true },
        { name: 'body', type: 'textarea', required: true },
        { name: 'image', type: 'upload', relationTo: 'media' },
      ],
    },
  ],
}

const ProcessTimelineBlock: Block = {
  slug: 'processTimeline',
  interfaceName: 'ProcessTimelineBlock',
  fields: [
    { name: 'eyebrow', type: 'text' },
    { name: 'heading', type: 'text' },
    { name: 'lede', type: 'textarea' },
    {
      name: 'steps',
      type: 'array',
      minRows: 2,
      admin: {
        description:
          'Every step renders in the home page Build Story. The animated build illustration is hand-tuned for exactly 5 steps — any other count still animates, but falls back to evenly-spaced scene sampling (scene beats no longer align 1:1 with each step).',
      },
      fields: [
        { name: 'title', type: 'text', required: true },
        { name: 'body', type: 'textarea' },
      ],
    },
  ],
}

const StatsCountersBlock: Block = {
  slug: 'statsCounters',
  interfaceName: 'StatsCountersBlock',
  fields: [
    { name: 'eyebrow', type: 'text' },
    { name: 'heading', type: 'text' },
    { name: 'lede', type: 'textarea' },
    {
      name: 'stats',
      type: 'array',
      minRows: 1,
      fields: [
        { name: 'value', type: 'number', required: true },
        {
          name: 'suffix',
          type: 'text',
          admin: {
            description:
              'Rendered tight after the number — start word suffixes with a space, e.g. " weeks", " days", "-year".',
          },
        },
        { name: 'label', type: 'text', required: true },
      ],
    },
  ],
}

const CtaBandBlock: Block = {
  slug: 'ctaBand',
  interfaceName: 'CtaBandBlock',
  fields: [
    { name: 'eyebrow', type: 'text' },
    { name: 'heading', type: 'text', required: true },
    { name: 'body', type: 'textarea' },
    { name: 'buttonLabel', type: 'text' },
    { name: 'buttonHref', type: 'text' },
  ],
}

const FaqListBlock: Block = {
  slug: 'faqList',
  interfaceName: 'FaqListBlock',
  fields: [
    { name: 'eyebrow', type: 'text' },
    { name: 'heading', type: 'text' },
    { name: 'lede', type: 'textarea' },
    {
      name: 'faqs',
      type: 'relationship',
      relationTo: 'faqs',
      hasMany: true,
      admin: { description: 'Leave empty to show all FAQs in order.' },
    },
  ],
}

const TestimonialStripBlock: Block = {
  slug: 'testimonialStrip',
  interfaceName: 'TestimonialStripBlock',
  fields: [
    { name: 'eyebrow', type: 'text' },
    { name: 'heading', type: 'text' },
    { name: 'lede', type: 'textarea' },
    {
      name: 'testimonials',
      type: 'relationship',
      relationTo: 'testimonials',
      hasMany: true,
      admin: { description: 'Leave empty to show featured testimonials.' },
    },
  ],
}

const GalleryStripBlock: Block = {
  slug: 'galleryStrip',
  interfaceName: 'GalleryStripBlock',
  fields: [
    { name: 'eyebrow', type: 'text' },
    { name: 'heading', type: 'text' },
    { name: 'lede', type: 'textarea' },
    {
      name: 'category',
      type: 'select',
      options: [
        { label: 'Exterior', value: 'exterior' },
        { label: 'Interior', value: 'interior' },
        { label: 'Build progress', value: 'build-progress' },
        { label: 'Before / After', value: 'before-after' },
      ],
      admin: { description: 'Optional filter — leave empty to use the picked items below.' },
    },
    {
      name: 'items',
      type: 'relationship',
      relationTo: 'gallery-items',
      hasMany: true,
    },
  ],
}

const AwardBadgeBlock: Block = {
  slug: 'awardBadge',
  interfaceName: 'AwardBadgeBlock',
  fields: [
    { name: 'eyebrow', type: 'text' },
    { name: 'heading', type: 'text' },
    { name: 'award', type: 'relationship', relationTo: 'awards' },
  ],
}

/* ------------------------------------------------------------------------- */

export const Pages: CollectionConfig = {
  slug: 'pages',
  admin: {
    useAsTitle: 'title',
    defaultColumns: ['title', 'slug', 'published', 'updatedAt'],
    group: 'Pages',
  },
  access: {
    read: publishedOrLoggedIn,
    create: isAdmin,
    update: isAdminOrEditor,
    delete: isAdmin,
  },
  hooks: collectionRevalidateHooks(['pages'], (doc) => (doc?.slug ? `page-${doc.slug}` : undefined)),
  fields: [
    {
      name: 'slug',
      type: 'text',
      required: true,
      unique: true,
      index: true,
      admin: { position: 'sidebar' },
    },
    {
      name: 'title',
      type: 'text',
      required: true,
    },
    {
      name: 'cardImage',
      type: 'upload',
      relationTo: 'media',
      label: 'Card image (dashboard thumbnail)',
      admin: {
        description: 'Optional thumbnail shown on this page’s dashboard card. Falls back to the first image in the page.',
      },
    },
    {
      name: 'heroEyebrow',
      type: 'text',
      admin: { description: 'Small green kicker above the hero heading.' },
    },
    {
      name: 'heroHeading',
      type: 'text',
    },
    {
      name: 'heroSub',
      type: 'text',
    },
    {
      // Editable framing text for a page's fixed (non-block) sections. Each page
      // only uses the entries relevant to it; all optional, fall back to code.
      name: 'sectionCopy',
      type: 'group',
      label: 'Section labels (fixed page sections)',
      admin: { description: 'Eyebrow/heading/lede for this page’s built-in sections.' },
      fields: [
        { name: 'beforeAfterEyebrow', type: 'text' },
        { name: 'beforeAfterHeading', type: 'text' },
        { name: 'beforeAfterLede', type: 'textarea' },
        { name: 'photosEyebrow', type: 'text' },
        { name: 'photosHeading', type: 'text' },
        { name: 'photosLede', type: 'textarea' },
        { name: 'whyEyebrow', type: 'text' },
        { name: 'whyHeading', type: 'text' },
        { name: 'whyLede', type: 'textarea' },
        { name: 'exampleEyebrow', type: 'text' },
        { name: 'exampleHeading', type: 'text' },
        { name: 'exampleLede', type: 'textarea' },
        { name: 'processEyebrow', type: 'text' },
        { name: 'processHeading', type: 'text' },
        { name: 'processLede', type: 'textarea' },
      ],
    },
    {
      name: 'sections',
      type: 'blocks',
      blocks: [
        RichTextBlock,
        ImageTextBlock,
        UseCaseTabsBlock,
        ProcessTimelineBlock,
        StatsCountersBlock,
        CtaBandBlock,
        FaqListBlock,
        TestimonialStripBlock,
        GalleryStripBlock,
        AwardBadgeBlock,
      ],
    },
    seoField,
    {
      name: 'published',
      type: 'checkbox',
      defaultValue: false,
      admin: { position: 'sidebar' },
    },
  ],
}
