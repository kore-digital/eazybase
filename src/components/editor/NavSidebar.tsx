'use client'

import { useEffect, useState } from 'react'

import { getNav, type NavField, type NavItem } from './edit-api'

/**
 * Elementor-style menu editor. Opens when the nav bar is clicked in edit mode.
 * Edit each item's label + link, reorder, add, or remove — then Save writes the
 * whole array back to the navigation global. The editor (EditorChrome) handles
 * persistence + revalidation via `onSave`.
 */
export function NavSidebar({
  field,
  title,
  onSave,
  onClose,
  busy,
}: {
  field: NavField
  title: string
  onSave: (field: NavField, items: NavItem[]) => void
  onClose: () => void
  busy: boolean
}) {
  const [items, setItems] = useState<NavItem[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let alive = true
    getNav()
      .then((nav) => alive && setItems(nav[field]))
      .catch(() => alive && setError('Could not load the menu.'))
      .finally(() => alive && setLoading(false))
    return () => {
      alive = false
    }
  }, [field])

  const update = (i: number, patch: Partial<NavItem>) =>
    setItems((prev) => prev.map((it, idx) => (idx === i ? { ...it, ...patch } : it)))
  const move = (i: number, dir: -1 | 1) =>
    setItems((prev) => {
      const next = [...prev]
      const j = i + dir
      if (j < 0 || j >= next.length) return prev
      ;[next[i], next[j]] = [next[j], next[i]]
      return next
    })
  const remove = (i: number) => setItems((prev) => prev.filter((_, idx) => idx !== i))
  const add = () => setItems((prev) => [...prev, { label: 'New link', href: '/' }])

  const inputCls =
    'w-full rounded-md border border-ink-200 px-2.5 py-1.5 text-sm text-ink-800 outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-500/25'

  return (
    <aside
      data-eb-chrome
      className="fixed right-0 top-0 z-[120] flex h-full w-[360px] max-w-[88vw] flex-col border-l border-ink-200 bg-white shadow-2xl"
      style={{ paddingTop: 'var(--eb-adminbar-h, 2.5rem)' }}
    >
      <div className="flex items-center justify-between border-b border-ink-100 px-4 py-3">
        <div>
          <p className="font-display text-sm font-bold text-ink-900">{title}</p>
          <p className="text-[11px] text-ink-400">Edit labels &amp; links, reorder, add or remove</p>
        </div>
        <button
          type="button"
          onClick={onClose}
          aria-label="Close"
          className="grid h-7 w-7 place-items-center rounded-md text-ink-500 hover:bg-ink-100"
        >
          ✕
        </button>
      </div>

      <div className="flex-1 overflow-y-auto p-3">
        {loading ? (
          <p className="py-8 text-center text-sm text-ink-400">Loading…</p>
        ) : error ? (
          <p className="py-8 text-center text-sm text-red-600">{error}</p>
        ) : (
          <ul className="space-y-2.5">
            {items.map((it, i) => (
              <li key={it.id ?? i} className="rounded-lg border border-ink-100 bg-ink-50 p-2.5">
                <div className="mb-1.5 flex items-center gap-1">
                  <input
                    value={it.label}
                    onChange={(e) => update(i, { label: e.target.value })}
                    placeholder="Label"
                    className={`${inputCls} font-semibold`}
                    aria-label="Menu label"
                  />
                  <div className="flex shrink-0 flex-col">
                    <button type="button" onClick={() => move(i, -1)} disabled={i === 0} aria-label="Move up" className="px-1 text-ink-400 hover:text-ink-800 disabled:opacity-30">▲</button>
                    <button type="button" onClick={() => move(i, 1)} disabled={i === items.length - 1} aria-label="Move down" className="px-1 text-ink-400 hover:text-ink-800 disabled:opacity-30">▼</button>
                  </div>
                </div>
                <div className="flex items-center gap-1">
                  <input
                    value={it.href}
                    onChange={(e) => update(i, { href: e.target.value })}
                    placeholder="/link"
                    className={`${inputCls} font-mono text-[12px] text-ink-500`}
                    aria-label="Menu link"
                  />
                  <button
                    type="button"
                    onClick={() => remove(i)}
                    aria-label="Remove"
                    className="grid h-7 w-7 shrink-0 place-items-center rounded-md text-red-500 hover:bg-red-50"
                  >
                    ✕
                  </button>
                </div>
              </li>
            ))}
          </ul>
        )}

        {!loading && !error ? (
          <button
            type="button"
            onClick={add}
            className="mt-3 w-full rounded-lg border border-dashed border-ink-300 py-2 text-sm font-semibold text-ink-600 hover:border-brand-500 hover:text-ink-900"
          >
            + Add menu item
          </button>
        ) : null}
      </div>

      <div className="border-t border-ink-100 p-3">
        <button
          type="button"
          onClick={() => onSave(field, items)}
          disabled={busy || loading}
          className="w-full rounded-lg bg-brand-500 py-2.5 font-display text-sm font-bold text-ink-950 transition-colors hover:bg-brand-600 disabled:opacity-60"
        >
          {busy ? 'Saving…' : 'Save menu'}
        </button>
      </div>
    </aside>
  )
}
