/**
 * Pure helpers for the visual editor: parsing `data-eb-edit` keys, building
 * nested PATCH bodies from dot-paths, and talking to Payload's REST API.
 *
 * Key convention (see docs/CMS-SCHEMA.md):
 *   data-eb-edit="<collection|global>:<docId>:<fieldPath>"
 *   e.g. "pages:3:heroHeading", "areas:7:faqs.r_abc123.a", "site-settings:1:tagline"
 *
 * Array rows are addressed by their stable Payload row id (`r_<rowId>`),
 * resolved to the row's current index against a freshly fetched document at
 * save time, so edits survive admin-side reorders and deletes. Plain numeric
 * indices (e.g. "faqs.0.a") remain supported as a legacy fallback.
 */

const GLOBAL_SLUGS = new Set(['site-settings', 'navigation'])

export type ParsedEditKey = {
  collection: string
  id: string
  fieldPath: string
  isGlobal: boolean
}

export function parseEditKey(key: string): ParsedEditKey | null {
  const first = key.indexOf(':')
  const second = key.indexOf(':', first + 1)
  if (first <= 0 || second === -1) return null
  const collection = key.slice(0, first)
  const id = key.slice(first + 1, second)
  const fieldPath = key.slice(second + 1)
  if (!fieldPath) return null
  return { collection, id, fieldPath, isGlobal: GLOBAL_SLUGS.has(collection) }
}

/** Admin deep-link for a key (used for richtext fields). */
export function adminUrlFor(parsed: ParsedEditKey): string {
  return parsed.isGlobal
    ? `/admin/globals/${parsed.collection}`
    : `/admin/collections/${parsed.collection}/${parsed.id}`
}

/**
 * Immutably set a deep path (mixed object keys / numeric array indices)
 * to `text`. Missing intermediate levels are created, existing siblings kept.
 */
export function setDeep(value: unknown, parts: string[], text: string): unknown {
  if (parts.length === 0) return text
  const [head, ...rest] = parts
  if (/^\d+$/.test(head)) {
    const arr = Array.isArray(value) ? [...value] : []
    arr[Number(head)] = setDeep(arr[Number(head)], rest, text)
    return arr
  }
  const obj =
    value !== null && typeof value === 'object' && !Array.isArray(value)
      ? { ...(value as Record<string, unknown>) }
      : {}
  obj[head] = setDeep(obj[head], rest, text)
  return obj
}

const ROW_ID_RE = /^r_(.+)$/

/**
 * Resolve row-id path segments (`r_<rowId>`) to the row's current numeric
 * index by walking `value` (a freshly fetched top-level field). Payload array
 * rows carry a stable `id`, so looking the row up at save time keeps the edit
 * pointing at the right row even after admin-side reorders/deletes. Numeric
 * and object-key segments pass through unchanged (legacy fallback).
 *
 * Throws when a referenced row no longer exists — better a visible failure
 * than silently writing into a different row.
 */
export function resolveRowIds(value: unknown, parts: string[]): string[] {
  const resolved: string[] = []
  let current = value
  for (const part of parts) {
    const match = ROW_ID_RE.exec(part)
    if (match) {
      const rows = Array.isArray(current) ? current : []
      const index = rows.findIndex(
        (row) =>
          row !== null && typeof row === 'object' && (row as { id?: unknown }).id === match[1],
      )
      if (index === -1) {
        throw new Error('This row no longer exists in the CMS — refresh the page and try again.')
      }
      resolved.push(String(index))
      current = rows[index]
    } else {
      resolved.push(part)
      if (/^\d+$/.test(part)) {
        current = Array.isArray(current) ? current[Number(part)] : undefined
      } else {
        current =
          current !== null && typeof current === 'object' && !Array.isArray(current)
            ? (current as Record<string, unknown>)[part]
            : undefined
      }
    }
  }
  return resolved
}

/**
 * Persist a single text field through Payload REST.
 *
 * Top-level fields PATCH directly; dotted paths (array items / groups, e.g.
 * `sections.r_abc123.heading`, `faqs.0.a`) fetch the doc at depth 0, resolve
 * any row-id segments to current indices, immutably set the deep path, and
 * PATCH the whole top-level field back. Globals use
 * POST /api/globals/<slug> (Payload's global update verb).
 *
 * Returns the parsed JSON response (Payload wraps collections as { doc }).
 */
export async function saveEditKey(
  parsed: ParsedEditKey,
  text: string,
): Promise<Record<string, unknown>> {
  const base = parsed.isGlobal
    ? `/api/globals/${parsed.collection}`
    : `/api/${parsed.collection}/${parsed.id}`

  let body: Record<string, unknown>
  if (parsed.fieldPath.includes('.')) {
    const [topKey, ...rest] = parsed.fieldPath.split('.')
    const docRes = await fetch(`${base}?depth=0`, { credentials: 'include' })
    if (!docRes.ok) throw new Error(`Could not load document (${docRes.status})`)
    const doc = (await docRes.json()) as Record<string, unknown>
    const parts = resolveRowIds(doc?.[topKey], rest)
    body = { [topKey]: setDeep(doc?.[topKey], parts, text) }
  } else {
    body = { [parsed.fieldPath]: text }
  }

  const res = await fetch(base, {
    method: parsed.isGlobal ? 'POST' : 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include',
    body: JSON.stringify(body),
  })
  if (!res.ok) throw new Error(`Save failed (${res.status})`)
  return res.json().catch(() => ({}) as Record<string, unknown>)
}

/**
 * Cache tags to revalidate after a successful save. The collection tag
 * always; plus the per-slug tag for pages/areas when the PATCH response
 * carries a slug (src/lib/data.ts tags entries with both).
 */
export function tagsForSave(parsed: ParsedEditKey, response: Record<string, unknown>): string[] {
  if (parsed.isGlobal) return [parsed.collection]
  const tags = [parsed.collection]
  const doc = (response?.doc ?? response) as Record<string, unknown> | undefined
  const slug = doc && typeof doc.slug === 'string' ? doc.slug : null
  if (slug && parsed.collection === 'pages') tags.push(`page-${slug}`)
  if (slug && parsed.collection === 'areas') tags.push(`area-${slug}`)
  return tags
}
