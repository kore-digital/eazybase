/**
 * Cache revalidation hooks — every CMS write flushes the `unstable_cache`
 * tags the frontend reads through (src/lib/data.ts and
 * src/components/home/queries.ts), so admin-panel edits reach the site
 * without a rebuild or the manual admin-bar refresh.
 */
import { revalidateTag } from 'next/cache'
import type {
  CollectionAfterChangeHook,
  CollectionAfterDeleteHook,
  GlobalAfterChangeHook,
} from 'payload'

/**
 * revalidateTag throws outside a Next.js request scope (e.g. `payload run`
 * seed/fix scripts) — cache freshness is moot there, so swallow the error.
 * It expires the tag outright and is callable from Payload's REST route
 * handlers (unlike the request-scoped updateTag).
 */
const safeRevalidate = (tags: (string | undefined)[]) => {
  for (const tag of tags) {
    if (!tag) continue
    try {
      revalidateTag(tag)
    } catch {
      /* non-Next context (payload run script) — nothing to revalidate */
    }
  }
}

type SluggedDoc = { slug?: string | null } | undefined

/**
 * afterChange + afterDelete hooks for a collection.
 * @param tags   static tags to flush on every write/delete
 * @param docTag optional per-doc tag (e.g. `page-${slug}`) — on change the
 *               previous doc's tag is flushed too, covering slug renames
 */
export const collectionRevalidateHooks = (
  tags: string[],
  docTag?: (doc: SluggedDoc) => string | undefined,
): { afterChange: CollectionAfterChangeHook[]; afterDelete: CollectionAfterDeleteHook[] } => ({
  afterChange: [
    ({ doc, previousDoc }) => {
      safeRevalidate([...tags, docTag?.(doc), docTag?.(previousDoc)])
      return doc
    },
  ],
  afterDelete: [
    ({ doc }) => {
      safeRevalidate([...tags, docTag?.(doc)])
      return doc
    },
  ],
})

/** afterChange hook for a global (e.g. 'site-settings', 'navigation'). */
export const globalRevalidateHooks = (...tags: string[]): { afterChange: GlobalAfterChangeHook[] } => ({
  afterChange: [
    ({ doc }) => {
      safeRevalidate(tags)
      return doc
    },
  ],
})
