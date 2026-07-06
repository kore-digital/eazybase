import type { GalleryItem, Media } from '@/payload-types'

/** Payload relationships arrive as `number | Media` depending on depth — keep only populated docs. */
export function resolveMedia(value: number | Media | null | undefined): Media | null {
  return value != null && typeof value === 'object' ? value : null
}

/** Best URL for a media doc at a given generated size, falling back to the original. */
export function mediaURL(
  media: Media | null | undefined,
  size?: 'thumb' | 'card' | 'hero',
): string | null {
  if (!media) return null
  const sized = size ? media.sizes?.[size]?.url : null
  return sized ?? media.url ?? null
}

export type SimpleImage = { url: string; alt: string }

/** Flatten a gallery item to a plain { url, alt } — null when the image isn't populated. */
export function galleryImage(
  item: GalleryItem | null | undefined,
  size: 'thumb' | 'card' | 'hero' = 'card',
): SimpleImage | null {
  if (!item) return null
  const url = mediaURL(resolveMedia(item.image), size)
  return url ? { url, alt: item.alt } : null
}

/** First gallery item whose alt text contains the keyword (case-insensitive). */
export function pickByAlt(items: GalleryItem[], keyword: string): GalleryItem | null {
  const needle = keyword.toLowerCase()
  return items.find((item) => item.alt.toLowerCase().includes(needle)) ?? null
}
