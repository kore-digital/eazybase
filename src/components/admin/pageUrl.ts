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
