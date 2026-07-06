# Friendly Admin + Client Portal — Design Spec

**Date:** 2026-07-06
**Project:** eazybase (Payload 3.85.2 + Next.js 15.4.11, Supabase Postgres)
**Status:** Approved design, ready for implementation plan

## Goal

Replace the stock Payload admin experience with a friendly, WordPress-simple
interface, so that:

- The **agency (kore-digital, `admin` role)** maintains the site with full
  Payload power.
- The **client (EazyBase staff, `editor` role)** can, if they ever self-serve,
  edit their own site content with almost no learning curve.

Reference look-and-feel: NEXIM and Constructor dashboards (clean grouped
sidebar, page cards with thumbnails, simple stat tiles).

This is **Project A** of a two-part effort. Project B (visual page building —
inline image swap + section add/reorder/delete, and possibly a full drag-drop
builder) is deferred to its own spec.

## Out of scope

- The live on-site inline text editor — **already built and working**
  (`src/components/editor/*`, 89 editable nodes, saves to Payload + revalidates).
  This project only makes it more *discoverable*; it does not change it.
- Any full drag-drop / canvas page builder (Project B).
- Changes to collections' data shape, the database schema, or the public site.

## Current state (base to build on)

- **Collections:** Pages, Areas, FAQs, Testimonials, GalleryItems, Awards,
  Media, QuoteRequests, Users.
- **Globals:** SiteSettings, Navigation.
- **Roles:** `admin | editor` in `src/access/roles.ts`, with collection- and
  field-level access helpers already in use.
- **Admin config** in `src/payload.config.ts` is currently minimal
  (`admin: { user, importMap }`).

## Design

Everything is implemented through Payload's supported admin-customisation
surface (`admin.components.*`, per-collection `admin` options, and admin CSS).
No custom backend, no fork of Payload internals — upgrade-safe.

### 1. Custom Dashboard view

Replace the default dashboard via `admin.components.views.dashboard.Component`
(a React Server Component that can query Payload directly).

Sections, top to bottom:

- **Greeting** — "Welcome back, {firstName}" + short subtitle.
- **Stat tiles** (4): Total pages · Published pages · Images (Media count) ·
  New enquiries (QuoteRequests count, last 30 days). Counts via
  `payload.count()`.
- **"Your pages" card grid** — one card per Pages doc: hero-image thumbnail
  (fallback placeholder if none), page title, and two actions:
  - **Edit content** → Payload edit view (`/admin/collections/pages/{id}`).
  - **Edit live** → the public URL for that page with `?edit=1`, opened in a new
    tab (invokes the existing live editor in edit mode).
- **+ Create new page** button → `/admin/collections/pages/create`.
- **Recent enquiries** — small list (latest 5 QuoteRequests: name, date, link).
- **"How to edit your site" help panel** — 3 steps (log in → open a page →
  click any text to edit), making the existing live editor discoverable.

Editors and admins see the same dashboard; the data respects each role's
access automatically.

### 2. Simplified, branded sidebar (custom Nav)

Replace the default nav via `admin.components.Nav`. Grouped, friendly,
icon-led:

- **Dashboard**
- **Pages** — Pages, Local Areas (Areas)
- **Content** — Images (Media), Gallery, Testimonials, FAQs, Awards
- **Enquiries** — QuoteRequests (relabelled "Enquiries")
- **Settings** *(admin only)* — Site Settings, Navigation, Team (Users)

Group/label changes are driven by each collection's `admin.group` and
`labels`, so the custom Nav stays a thin presentation layer over Payload's
existing entity list where possible. EazyBase logo at top; brand green
`#96c11f` accents.

### 3. Two-tier roles

- **admin:** every collection and field visible (current behaviour).
- **editor:** Settings group hidden. Specifically hide from editors:
  - `Users` (Team) — via `admin.hidden` keyed on role.
  - `Navigation` global — structural, admin-only.
  - Technical/advanced fields already gated by field-level access stay gated.

`admin.hidden` accepts a function receiving `{ user }`, so visibility is
role-driven without duplicating collections.

### 4. Branding & chrome

- Custom **Logo** and **Icon** via `admin.components.graphics.{Logo,Icon}`.
- Brand palette + spacing polish via a small admin stylesheet
  (`admin.components.head` / custom CSS import) — accent green, softer cards,
  matching the reference aesthetic. Light touch; no wholesale CSS rewrite.
- Friendlier `labels` and `admin.description` on collections
  (e.g. QuoteRequests → "Enquiries", GalleryItems → "Gallery").

## Components / files (anticipated)

- `src/components/admin/Dashboard.tsx` — custom dashboard RSC.
- `src/components/admin/Nav.tsx` — custom grouped nav.
- `src/components/admin/Logo.tsx`, `Icon.tsx` — branding graphics.
- `src/styles/admin.css` — brand accents.
- `src/payload.config.ts` — wire `admin.components`; per-collection `admin`
  (`group`, `labels`, `hidden`) tweaks in the collection files.
- Regenerate importMap (already automated in the build) so the new components
  resolve.

Each unit is small and single-purpose: Dashboard reads counts + page list and
renders cards; Nav renders grouped links filtered by role; graphics render
static SVG/img; CSS restyles. They communicate only through Payload's
component props (`user`, `payload`) — no shared mutable state.

## Data flow

Dashboard (server component) → `payload.count()` / `payload.find()` for tiles,
page cards, and recent enquiries → renders links. "Edit live" links compute the
public URL from each page's slug + `?edit=1`. No new API endpoints; no writes
from the dashboard itself.

## Error handling

- Missing hero image → placeholder thumbnail.
- Zero pages / enquiries → friendly empty states ("No pages yet — create your
  first one").
- Count/query failure → tile shows "—" rather than crashing the dashboard.

## Testing / verification

- Build succeeds and importMap includes the new components.
- Log in as **admin**: dashboard shows tiles, page cards, all sidebar groups
  incl. Settings; "Edit content" and "Edit live" links resolve.
- Log in as **editor**: same dashboard; Settings/Team/Navigation hidden.
- "Edit live" opens the public page with the live editor active.
- Existing live inline editing still works unchanged.
- Responsive: dashboard grid and nav usable at mobile, tablet, desktop widths.

## Success criteria

A non-technical client editor can log in and, without training, find a page,
open it, and edit its content — either through the tidied Payload edit view or
by clicking "Edit live". The agency retains full Payload control. Nothing about
the public site or the existing live editor regresses.
