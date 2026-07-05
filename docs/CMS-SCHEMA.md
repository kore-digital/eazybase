# CMS Schema Contract (Payload 3)

All collections live in `src/collections/`, globals in `src/globals/`, access
helpers in `src/access/`. Registered in `src/payload.config.ts`. After schema
changes run `npm run generate:types` (writes `src/payload-types.ts`).

## Roles & access (src/access/roles.ts)

`Users.role: 'admin' | 'editor'` (default `editor`).

- **admin** — full CRUD everywhere, including Users and structural fields.
- **editor** — read everything; update (not create/delete) Pages & Areas;
  full CRUD on content collections (FAQs, Testimonials, GalleryItems, Awards, Media);
  update Globals' content fields; NO access to Users, QuoteRequests read-only.
- **public** — read published docs only; create QuoteRequests only.

## Collections

### pages
slug (unique), title, heroHeading, heroSub, sections (blocks — richText, imageText,
useCaseTabs, processTimeline, statsCounters, ctaBand, faqList, testimonialStrip,
galleryStrip, awardBadge), seo { metaTitle, metaDescription }, published (checkbox).

### areas
slug (unique), name, region ('north-west'|'london'), isHub (checkbox),
heroHeading, intro (richText — the unique local copy),
localAngles (array of { heading, body }) — housing stock / planning / landmarks,
faqs (array { q, a } — localized), seo { metaTitle, metaDescription }, published.

### faqs
question, answer (textarea), order (number). Site-wide FAQ page + schema.

### testimonials
quote, author, platform ('google'|'yell'|'facebook'), title, featured (checkbox).

### gallery-items
image (upload rel media), alt (required), category ('exterior'|'interior'|'build-progress'|'before-after'),
beforeImage (upload, optional — when set renders as before/after slider), caption, order.

### awards
title, body (text), year, image (upload), featured.

### quote-requests  (form submissions — admin/editor read, public create)
type ('full'|'instant'), firstName, lastName, email, phone, postcode,
addressLine1?, town?, message, estimator { extensionType?, widthM?, depthM?, spec?, estimateLow?, estimateHigh? },
status ('new'|'contacted'|'closed') admin-only.

## Globals

### site-settings
phone, whatsappNumber, email, tagline, awardLine, socials { facebook, instagram, yell, google },
stats { factoryWeeks, installDays, guaranteeYears }.

### navigation
mainNav (array { label, href }), footerNav (same shape).

## Visual-editor convention

Every text node rendered from a CMS field carries
`data-eb-edit="<collection|global>:<docId>:<fieldPath>"` via the `<Editable>`
component (`src/components/editor/Editable.tsx`). The EditorOverlay
(`src/components/editor/EditorOverlay.tsx`) activates for authenticated users
(checked via `/api/users/me`) when `?edit=1`, makes those nodes
contentEditable, and PATCHes `/api/<collection>/<docId>` with `{ [fieldPath]: value }`
on blur. Rich-text blocks get a "open in admin" pencil instead of inline editing.
