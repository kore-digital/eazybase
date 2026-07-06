'use server'

import config from '@payload-config'
import { updateTag } from 'next/cache'
import { headers } from 'next/headers'
import { getPayload } from 'payload'

/**
 * Auth-guarded cache revalidation for the in-page visual editor.
 *
 * The editor PATCHes documents through Payload's REST API, then calls this
 * action so the `unstable_cache` lookups in src/lib/data.ts (tagged 'pages',
 * 'areas', `page-<slug>`, …) drop their stale entries before the client
 * calls router.refresh().
 *
 * Only tags on the allowlist (or matching the per-slug patterns) are
 * revalidated, and only for authenticated admin/editor users — anonymous
 * callers get a refusal, never a cache flush.
 */

const ALLOWED_TAGS = new Set([
  'pages',
  'areas',
  'faqs',
  'testimonials',
  'gallery-items',
  'awards',
  'site-settings',
  'navigation',
])

const SLUG_TAG_RE = /^(page|area)-[a-z0-9-]+$/

export type RevalidateResult = {
  ok: boolean
  revalidated: string[]
  error?: string
}

export async function revalidateContent(tags: string[]): Promise<RevalidateResult> {
  try {
    const payload = await getPayload({ config })
    const { user } = await payload.auth({ headers: await headers() })

    if (!user || (user.role !== 'admin' && user.role !== 'editor')) {
      return { ok: false, revalidated: [], error: 'Not authorised' }
    }

    const valid = [...new Set(tags)].filter(
      (tag) => typeof tag === 'string' && (ALLOWED_TAGS.has(tag) || SLUG_TAG_RE.test(tag)),
    )

    // updateTag (Next 16) expires the tag immediately with read-your-own-writes
    // semantics — exactly what the editor needs before router.refresh().
    for (const tag of valid) {
      updateTag(tag)
    }

    return { ok: true, revalidated: valid }
  } catch {
    return { ok: false, revalidated: [], error: 'Revalidation failed' }
  }
}

/** Convenience for the admin bar's "Refresh content" — flushes every content tag. */
export async function revalidateAllContent(): Promise<RevalidateResult> {
  return revalidateContent([...ALLOWED_TAGS])
}
