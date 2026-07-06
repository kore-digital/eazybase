# Friendly Admin + Client Portal Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the stock Payload admin with a friendly, WordPress-style interface — custom dashboard, branded/grouped nav, and a two-tier admin/editor experience — while keeping Payload underneath and the existing live editor untouched.

**Architecture:** Pure Payload admin customisation. A custom dashboard renders via `admin.components.beforeDashboard` and fetches its own data with `getPayload()` (the pattern already used in `src/app/(frontend)/actions/revalidate.ts`). Branding uses `admin.components.graphics` + a CSS-importing provider. Collection grouping/labels/role-visibility are set per-collection. No DB/schema changes, no new API routes.

**Tech Stack:** Payload 3.85.2, Next.js 15.4.11, React 19, TypeScript, Vitest 4, Supabase Postgres.

## Global Constraints

- Next.js pinned at `15.4.11` — do NOT use Next 16-only APIs (`updateTag`, `revalidateTag(tag, 'max')`, `'use cache'`). Verify with `npx tsc --noEmit`.
- Payload version is `3.85.2`; component paths in `payload.config.ts` are strings relative to `admin.importMap.baseDir` (already `path.resolve(dirname)` = the `src` dir), e.g. `'/components/admin/Dashboard#Dashboard'`.
- After adding/removing admin components, the importMap must be regenerated: `npm run generate:importmap` (also runs automatically in `npm run build`).
- Roles are `admin | editor` (`src/access/roles.ts`); `roleOf(user)` returns the role. Editors must never see Team/Users, Navigation, or the Settings group.
- Brand green is `#96c11f` (brand-500). Match the existing site palette.
- Git identity for commits in this repo is `kore-digital <info@koredigital.co.uk>` (already set locally). End commit messages with:
  `Co-Authored-By: Claude Opus 4.8 (1M context) <noreply@anthropic.com>`
- The live on-site editor (`src/components/editor/*`) and the public site must not regress.

---

## File Structure

- `src/components/admin/pageUrl.ts` — pure helpers mapping a page slug to its public URL and live-edit URL.
- `src/components/admin/pageUrl.test.ts` — unit tests for the helpers.
- `vitest.config.mts` — minimal Vitest config (currently missing; `package.json`'s `test:int` references it).
- `src/components/admin/Dashboard.tsx` — custom dashboard (async server component): stat tiles, page cards, recent enquiries, help panel.
- `src/components/admin/Dashboard.module.scss` — dashboard styles (scoped).
- `src/components/admin/AdminStyles.tsx` — provider component that imports the global admin stylesheet.
- `src/components/admin/admin.scss` — global admin brand tweaks + hide-default-dashboard rule.
- `src/components/admin/Logo.tsx`, `src/components/admin/Icon.tsx` — branding graphics.
- `src/payload.config.ts` — wire `admin.components` (graphics, providers, beforeDashboard).
- `src/collections/*.ts`, `src/globals/*.ts` — per-entity `admin` tweaks (`labels`, `group`, `admin.hidden`).

---

## Task 1: Page-URL helpers (+ Vitest config)

**Files:**
- Create: `src/components/admin/pageUrl.ts`
- Create: `src/components/admin/pageUrl.test.ts`
- Create: `vitest.config.mts`

**Interfaces:**
- Produces: `publicUrlForPage(slug: string): string` and `liveEditUrlForPage(slug: string): string`. Used by Task 4's Dashboard for the "Edit live" buttons.

Slug→URL rules (from the seeded pages `home, about-us, what-we-do, faq, gallery, social, get-a-quote, instant-quote`): `home` → `/`; any other slug → `/{slug}`. The live-edit URL appends the editor query param `?edit=1` (the flag `EditorChrome` reads).

- [ ] **Step 1: Write the failing test**

Create `src/components/admin/pageUrl.test.ts`:

```ts
import { describe, expect, it } from 'vitest'

import { liveEditUrlForPage, publicUrlForPage } from './pageUrl'

describe('publicUrlForPage', () => {
  it('maps the home slug to root', () => {
    expect(publicUrlForPage('home')).toBe('/')
  })
  it('maps any other slug to /{slug}', () => {
    expect(publicUrlForPage('about-us')).toBe('/about-us')
  })
  it('treats an empty slug as home', () => {
    expect(publicUrlForPage('')).toBe('/')
  })
})

describe('liveEditUrlForPage', () => {
  it('appends the edit flag to the home url', () => {
    expect(liveEditUrlForPage('home')).toBe('/?edit=1')
  })
  it('appends the edit flag to a normal page url', () => {
    expect(liveEditUrlForPage('faq')).toBe('/faq?edit=1')
  })
})
```

- [ ] **Step 2: Create the Vitest config so the test can run**

Create `vitest.config.mts`:

```ts
import { defineConfig } from 'vitest/config'

export default defineConfig({
  test: {
    environment: 'node',
    include: ['src/**/*.test.ts'],
  },
})
```

- [ ] **Step 3: Run the test to verify it fails**

Run: `npx vitest run src/components/admin/pageUrl.test.ts`
Expected: FAIL — `Cannot find module './pageUrl'` (or "publicUrlForPage is not a function").

- [ ] **Step 4: Write the implementation**

Create `src/components/admin/pageUrl.ts`:

```ts
/**
 * Maps a Pages `slug` to the public site URL. The site's routes are static
 * (`/about-us`, `/faq`, …) with the home page at the root, so the rule is:
 * `home` → `/`, everything else → `/{slug}`.
 */
export function publicUrlForPage(slug: string): string {
  if (!slug || slug === 'home') return '/'
  return `/${slug}`
}

/**
 * The public URL with the live-editor flag (`?edit=1`) the on-site editor
 * (`src/components/editor/EditorChrome.tsx`) reads to open in edit mode.
 */
export function liveEditUrlForPage(slug: string): string {
  const base = publicUrlForPage(slug)
  return base === '/' ? '/?edit=1' : `${base}?edit=1`
}
```

- [ ] **Step 5: Run the test to verify it passes**

Run: `npx vitest run src/components/admin/pageUrl.test.ts`
Expected: PASS (5 tests).

- [ ] **Step 6: Typecheck and commit**

Run: `npx tsc --noEmit` → expect exit 0.

```bash
git add src/components/admin/pageUrl.ts src/components/admin/pageUrl.test.ts vitest.config.mts
git commit -m "Add page-URL helpers for the admin dashboard + vitest config

Co-Authored-By: Claude Opus 4.8 (1M context) <noreply@anthropic.com>"
```

---

## Task 2: Friendly labels, grouping & role-based hiding

**Files:**
- Modify: `src/collections/QuoteRequests.ts` (label → "Enquiries", group → "Enquiries")
- Modify: `src/collections/GalleryItems.ts` (label → "Gallery")
- Modify: `src/collections/Media.ts` (label → "Images")
- Modify: `src/collections/Users.ts` (label → "Team", `admin.hidden` for editors, group → "Settings")
- Modify: `src/globals/Navigation.ts` (group → "Settings", `admin.hidden` for editors)
- Modify: `src/globals/SiteSettings.ts` (group → "Settings")
- Modify: `src/collections/Pages.ts`, `src/collections/Areas.ts` (group → "Pages")
- Modify: `src/collections/FAQs.ts`, `src/collections/Testimonials.ts`, `src/collections/Awards.ts` (group → "Content")

**Interfaces:**
- Consumes: `roleOf` from `src/access/roles.ts` (existing: `roleOf(user)` returns `'admin' | 'editor' | undefined`).
- Produces: sidebar groups **Pages / Content / Enquiries / Settings**; editors do not see Users, Navigation, or the Settings group.

Payload's `admin.hidden` accepts `boolean | (({ user }) => boolean)`. Returning `true` hides the entity for that user. `labels` sets `{ singular, plural }` shown in the nav and views.

- [ ] **Step 1: Relabel + regroup QuoteRequests → "Enquiries"**

In `src/collections/QuoteRequests.ts`, set the `admin` block and add `labels`:

```ts
  labels: { singular: 'Enquiry', plural: 'Enquiries' },
  admin: {
    group: 'Enquiries',
    // ...keep any existing useAsTitle/defaultColumns...
  },
```

- [ ] **Step 2: Relabel Gallery + Media, regroup content**

In `src/collections/GalleryItems.ts` add `labels: { singular: 'Gallery item', plural: 'Gallery' }` and keep `admin.group: 'Content'`.
In `src/collections/Media.ts` add `labels: { singular: 'Image', plural: 'Images' }` and set `admin.group: 'Content'`.
In `src/collections/FAQs.ts`, `Testimonials.ts`, `Awards.ts` keep `admin.group: 'Content'`.

- [ ] **Step 3: Move Pages + Areas into a "Pages" group**

In `src/collections/Pages.ts` set `admin.group: 'Pages'`.
In `src/collections/Areas.ts` set `admin.group: 'Pages'` and add `labels: { singular: 'Local area', plural: 'Local Areas' }`.

- [ ] **Step 4: Settings group + hide admin-only entities from editors**

In `src/collections/Users.ts`:

```ts
import { roleOf } from '../access/roles'
// ...
  labels: { singular: 'Team member', plural: 'Team' },
  admin: {
    group: 'Settings',
    hidden: ({ user }) => roleOf(user) !== 'admin',
    // ...keep existing useAsTitle/defaultColumns...
  },
```

In `src/globals/Navigation.ts`:

```ts
import { roleOf } from '../access/roles'
// ...
  admin: {
    group: 'Settings',
    hidden: ({ user }) => roleOf(user) !== 'admin',
  },
```

In `src/globals/SiteSettings.ts` set `admin.group: 'Settings'` (leave visible to editors — they may edit contact details).

- [ ] **Step 5: Regenerate importMap, typecheck, build check**

Run: `npm run generate:importmap`
Run: `npx tsc --noEmit` → expect exit 0.
Run: `npx next build --no-lint 2>&1 | tail -20` — expect "Compiled successfully" (a running DB is not required for the Next compile step; if `payload migrate` in the full `build` script needs `DATABASE_URI`, skip it and run `next build` directly as shown).

- [ ] **Step 6: Verify visually as both roles (manual)**

With the app running (deployed or local), log in as an **admin**: sidebar shows groups **Pages, Content, Enquiries, Settings**; Settings contains Site Settings, Navigation, Team. Log in as an **editor**: Settings/Team/Navigation are hidden; Site Settings still reachable. Record the result in the commit message.

- [ ] **Step 7: Commit**

```bash
git add src/collections src/globals
git commit -m "Admin: friendly labels, grouped nav, hide Team/Navigation from editors

Co-Authored-By: Claude Opus 4.8 (1M context) <noreply@anthropic.com>"
```

---

## Task 3: Branding — Logo, Icon & admin CSS

**Files:**
- Create: `src/components/admin/Logo.tsx`
- Create: `src/components/admin/Icon.tsx`
- Create: `src/components/admin/admin.scss`
- Create: `src/components/admin/AdminStyles.tsx`
- Modify: `src/payload.config.ts` (add `admin.components.graphics` + `providers`)

**Interfaces:**
- Produces: `Logo`, `Icon` React components (server components, static SVG/markup) and an `AdminStyles` provider that imports `admin.scss` globally. Consumed by `payload.config.ts` via component path strings.

- [ ] **Step 1: Create the Logo and Icon**

`src/components/admin/Logo.tsx`:

```tsx
export function Logo() {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
      <span
        aria-hidden="true"
        style={{ width: 22, height: 14, background: '#96c11f', display: 'inline-block', transform: 'skewX(-12deg)', borderRadius: 2 }}
      />
      <strong style={{ fontSize: 22, letterSpacing: '-0.01em' }}>EazyBase</strong>
    </div>
  )
}

export default Logo
```

`src/components/admin/Icon.tsx`:

```tsx
export function Icon() {
  return (
    <span
      aria-hidden="true"
      style={{ width: 20, height: 13, background: '#96c11f', display: 'inline-block', transform: 'skewX(-12deg)', borderRadius: 2 }}
    />
  )
}

export default Icon
```

- [ ] **Step 2: Create the global admin stylesheet**

`src/components/admin/admin.scss` — brand accents + hide the stock dashboard body (the custom dashboard from Task 4 renders via `beforeDashboard`, so the default entity-card list below it must be hidden):

```scss
:root {
  --theme-success-500: #96c11f;
}

/* Brand the primary buttons + active nav */
.btn--style-primary {
  background: #96c11f;
  border-color: #96c11f;
  color: #1e1f1d;
}

/* Hide the stock dashboard content; our custom dashboard renders above it
   via beforeDashboard. Scoped to the dashboard view only. */
.dashboard .dashboard__group,
.dashboard > .dashboard__label {
  display: none;
}
```

- [ ] **Step 3: Create the provider that loads the stylesheet**

`src/components/admin/AdminStyles.tsx`:

```tsx
import './admin.scss'

export function AdminStyles({ children }: { children: React.ReactNode }) {
  return <>{children}</>
}

export default AdminStyles
```

- [ ] **Step 4: Wire graphics + provider into the config**

In `src/payload.config.ts`, extend the `admin` block:

```ts
  admin: {
    user: Users.slug,
    importMap: {
      baseDir: path.resolve(dirname),
    },
    components: {
      graphics: {
        Logo: '/components/admin/Logo#Logo',
        Icon: '/components/admin/Icon#Icon',
      },
      providers: ['/components/admin/AdminStyles#AdminStyles'],
    },
  },
```

- [ ] **Step 5: Regenerate importMap + typecheck + build**

Run: `npm run generate:importmap`
Run: `npx tsc --noEmit` → expect exit 0.
Run: `npx next build --no-lint 2>&1 | tail -20` → expect "Compiled successfully".

- [ ] **Step 6: Verify visually (manual)**

Log in: the login page and nav show the EazyBase logo; primary buttons are brand green. Record result.

- [ ] **Step 7: Commit**

```bash
git add src/components/admin/Logo.tsx src/components/admin/Icon.tsx src/components/admin/admin.scss src/components/admin/AdminStyles.tsx src/payload.config.ts src/app/\(payload\)/admin/importMap.js
git commit -m "Admin: EazyBase branding (logo, icon, brand-green chrome)

Co-Authored-By: Claude Opus 4.8 (1M context) <noreply@anthropic.com>"
```

---

## Task 4: Custom Dashboard

**Files:**
- Create: `src/components/admin/Dashboard.tsx`
- Create: `src/components/admin/Dashboard.module.scss`
- Modify: `src/payload.config.ts` (add `admin.components.beforeDashboard`)

**Interfaces:**
- Consumes: `publicUrlForPage`, `liveEditUrlForPage` from Task 1; `getPayload` from `payload`; `config` from `@payload-config`; `headers` from `next/headers`.
- Produces: `Dashboard` async server component rendered via `beforeDashboard`.

The component fetches its own data (proven pattern — see `src/app/(frontend)/actions/revalidate.ts`): `const payload = await getPayload({ config })`, then `payload.count()` / `payload.find()`. It gets the current user via `payload.auth({ headers: await headers() })` for the greeting.

- [ ] **Step 1: Create the dashboard styles**

`src/components/admin/Dashboard.module.scss`:

```scss
.wrap { padding: 0 0 2rem; }
.greeting { font-size: 1.5rem; font-weight: 700; margin: 0 0 0.25rem; }
.sub { color: var(--theme-elevation-500); margin: 0 0 1.5rem; }
.tiles { display: grid; grid-template-columns: repeat(4, 1fr); gap: 1rem; margin-bottom: 2rem; }
.tile { border: 1px solid var(--theme-elevation-150); border-radius: 10px; padding: 1.25rem; }
.tileNum { font-size: 2rem; font-weight: 700; line-height: 1; }
.tileLabel { color: var(--theme-elevation-500); font-size: 0.85rem; margin-top: 0.4rem; }
.sectionTitle { font-size: 1.05rem; font-weight: 700; margin: 0 0 1rem; }
.cards { display: grid; grid-template-columns: repeat(3, 1fr); gap: 1rem; margin-bottom: 2rem; }
.card { border: 1px solid var(--theme-elevation-150); border-radius: 10px; overflow: hidden; }
.thumb { aspect-ratio: 16 / 9; background: linear-gradient(135deg, #1e1f1d, #3a3d36); display: flex; align-items: flex-end; padding: 0.75rem; }
.thumb img { width: 100%; height: 100%; object-fit: cover; }
.cardBody { padding: 0.85rem 1rem; }
.cardTitle { font-weight: 600; margin: 0 0 0.6rem; }
.cardActions { display: flex; gap: 0.5rem; }
.help { border: 1px solid var(--theme-elevation-150); border-radius: 10px; padding: 1.25rem 1.5rem; background: var(--theme-elevation-50); }
.help ol { margin: 0.5rem 0 0; padding-left: 1.1rem; line-height: 1.8; }
@media (max-width: 1024px) { .tiles { grid-template-columns: repeat(2, 1fr); } .cards { grid-template-columns: repeat(2, 1fr); } }
@media (max-width: 640px) { .tiles { grid-template-columns: 1fr; } .cards { grid-template-columns: 1fr; } }
```

- [ ] **Step 2: Create the dashboard component**

`src/components/admin/Dashboard.tsx`:

```tsx
import config from '@payload-config'
import { headers as getHeaders } from 'next/headers'
import { getPayload } from 'payload'

import { liveEditUrlForPage } from './pageUrl'
import styles from './Dashboard.module.scss'

/** First image URL found in a page's blocks, else null (used for the card thumb). */
function firstImageUrl(sections: unknown): string | null {
  if (!Array.isArray(sections)) return null
  for (const block of sections) {
    const image = (block as { image?: { url?: string } })?.image
    if (image && typeof image === 'object' && image.url) return image.url
  }
  return null
}

export async function Dashboard() {
  const payload = await getPayload({ config })
  const { user } = await payload.auth({ headers: await getHeaders() })

  const [pagesResult, totalPages, publishedPages, mediaCount, enquiryCount, recentEnquiries] =
    await Promise.all([
      payload.find({ collection: 'pages', limit: 12, depth: 1, sort: 'title' }),
      payload.count({ collection: 'pages' }),
      payload.count({ collection: 'pages', where: { published: { equals: true } } }),
      payload.count({ collection: 'media' }),
      payload.count({ collection: 'quote-requests' }),
      payload.find({ collection: 'quote-requests', limit: 5, sort: '-createdAt', depth: 0 }),
    ])

  const firstName = (user?.name as string | undefined)?.split(' ')[0] ?? 'there'

  const tiles = [
    { num: totalPages.totalDocs, label: 'Total pages' },
    { num: publishedPages.totalDocs, label: 'Published' },
    { num: mediaCount.totalDocs, label: 'Images' },
    { num: enquiryCount.totalDocs, label: 'Enquiries' },
  ]

  return (
    <div className={styles.wrap}>
      <h1 className={styles.greeting}>Welcome back, {firstName}</h1>
      <p className={styles.sub}>Manage your website content, images, and enquiries in one place.</p>

      <div className={styles.tiles}>
        {tiles.map((t) => (
          <div key={t.label} className={styles.tile}>
            <div className={styles.tileNum}>{t.num}</div>
            <div className={styles.tileLabel}>{t.label}</div>
          </div>
        ))}
      </div>

      <h2 className={styles.sectionTitle}>Your pages</h2>
      <div className={styles.cards}>
        {pagesResult.docs.map((page) => {
          const slug = String(page.slug)
          const thumb = firstImageUrl(page.sections)
          return (
            <div key={String(page.id)} className={styles.card}>
              <div className={styles.thumb}>
                {thumb ? <img src={thumb} alt="" /> : null}
              </div>
              <div className={styles.cardBody}>
                <p className={styles.cardTitle}>{String(page.title)}</p>
                <div className={styles.cardActions}>
                  <a className="btn btn--size-small btn--style-secondary" href={`/admin/collections/pages/${page.id}`}>
                    Edit content
                  </a>
                  <a
                    className="btn btn--size-small btn--style-primary"
                    href={liveEditUrlForPage(slug)}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    Edit live
                  </a>
                </div>
              </div>
            </div>
          )
        })}
        {pagesResult.docs.length === 0 ? <p>No pages yet — create your first one.</p> : null}
      </div>

      <h2 className={styles.sectionTitle}>Recent enquiries</h2>
      {recentEnquiries.docs.length === 0 ? (
        <p className={styles.sub}>No enquiries yet.</p>
      ) : (
        <ul>
          {recentEnquiries.docs.map((e) => (
            <li key={String(e.id)}>
              <a href={`/admin/collections/quote-requests/${e.id}`}>
                {String((e as { name?: string }).name ?? 'Enquiry')}
              </a>
            </li>
          ))}
        </ul>
      )}

      <div className={styles.help}>
        <strong>Edit your site live</strong>
        <ol>
          <li>Log in here (you already are).</li>
          <li>Open a page with its <em>Edit live</em> button above.</li>
          <li>Click any text on the page to edit it — changes save automatically.</li>
        </ol>
      </div>
    </div>
  )
}

export default Dashboard
```

- [ ] **Step 3: Register the dashboard via beforeDashboard**

In `src/payload.config.ts`, add to `admin.components`:

```ts
      beforeDashboard: ['/components/admin/Dashboard#Dashboard'],
```

(Alongside the `graphics` and `providers` added in Task 3.)

- [ ] **Step 4: Regenerate importMap + typecheck + build**

Run: `npm run generate:importmap`
Run: `npx tsc --noEmit` → expect exit 0.
Run: `npx next build --no-lint 2>&1 | tail -20` → expect "Compiled successfully".

- [ ] **Step 5: Verify in a browser (manual / Playwright)**

Deploy (Task 5) or run locally, then load `/admin`:
- Stat tiles show non-zero counts (pages/published/images/enquiries).
- "Your pages" grid lists pages; each has **Edit content** and **Edit live**.
- **Edit content** opens `/admin/collections/pages/{id}`.
- **Edit live** opens the public page in a new tab with the live editor active (`?edit=1`).
- The stock dashboard entity-card list is hidden (Task 3 CSS).
- Log in as an editor: same dashboard renders (no Settings group in nav).

- [ ] **Step 6: Commit**

```bash
git add src/components/admin/Dashboard.tsx src/components/admin/Dashboard.module.scss src/payload.config.ts src/app/\(payload\)/admin/importMap.js
git commit -m "Admin: custom WordPress-style dashboard (tiles, page cards, help)

Co-Authored-By: Claude Opus 4.8 (1M context) <noreply@anthropic.com>"
```

---

## Task 5: Full verification & deploy

**Files:** none (verification + deploy only)

- [ ] **Step 1: Full production build locally (or rely on Vercel)**

Run: `npx tsc --noEmit` → exit 0.
Run: `npx vitest run` → all tests pass.
Confirm the importMap includes the new components:
Run: `grep -c "components/admin" "src/app/(payload)/admin/importMap.js"` → expect ≥ 4 (Logo, Icon, AdminStyles, Dashboard).

- [ ] **Step 2: Push (auto-deploys)**

```bash
gh auth switch --user kore-digital
git push origin main
```

- [ ] **Step 3: Wait for the Vercel deploy to be Ready, then verify with Playwright**

- Load `https://eazybase-kohl.vercel.app/admin` — the custom dashboard renders (tiles + page cards + help panel), branded logo present.
- Click **Edit live** on a page card → the public page opens with the live editor bar visible.
- Confirm the public site is unchanged and the WhatsApp/phone numbers still come from the CMS (no regression): `curl -s https://eazybase-kohl.vercel.app/ | grep -oE 'wa\.me/[0-9]+' | sort -u`.
- Responsive: check `/admin` at 375px, 768px, 1280px — tiles/cards reflow (4→2→1), no horizontal scroll.

- [ ] **Step 4: Final commit if any fixes were needed, else done**

Record verification results. The feature is complete when an editor can log in, see the friendly dashboard, and reach a page's content or live editor in one click.

---

## Deferred (Project B — separate spec)

Inline image swap and section add/reorder/delete on the live site, and (if still wanted) a full drag-drop canvas builder. Not part of this plan.
