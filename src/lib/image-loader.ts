// Custom next/image loader.
//
// CMS media is served by Payload's own route (`/api/media/file/<file>`), which
// streams the object from Supabase Storage. On Vercel, the built-in image
// optimizer fetches each `src` server-side before optimizing — but its internal
// self-fetch of the Payload route 404s (the request falls through Payload's
// `/api/[...slug]` catch-all), even though the same URL returns 200 to a normal
// browser request. That made every CMS photo silently fail to render.
//
// So: route CMS media straight to the Payload URL (no `/_next/image` hop).
// Payload already generates thumb/card/hero variants and the components pick an
// appropriately sized one, so we lose little by skipping optimization here.
// Static `/public` assets still go through the optimizer as normal.
export default function imageLoader({
  src,
  width,
  quality,
}: {
  src: string
  width: number
  quality?: number
}): string {
  // Payload media — serve directly (relative or absolute forms both matched).
  if (src.includes('/api/media/')) {
    return src
  }

  // Everything else (static /public assets) — keep Vercel image optimization.
  const q = quality || 75
  return `/_next/image?url=${encodeURIComponent(src)}&w=${width}&q=${q}`
}
