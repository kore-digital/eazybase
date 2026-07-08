'use client'

import { useEffect, useRef, useState } from 'react'

import { listMedia, mediaThumb, uploadMedia, type MediaDoc } from './edit-api'

/**
 * Elementor-style right-hand panel for swapping an image. Lists the existing
 * media library (click a thumbnail to use it) and uploads a new file
 * (POST /api/media) — the picked/uploaded media id is handed back to the
 * editor, which PATCHes it into the field. Tagged data-eb-chrome so the
 * editor's click/hover delegation ignores it.
 */
export function MediaSidebar({
  onSelect,
  onClose,
  busy,
}: {
  onSelect: (id: number) => void
  onClose: () => void
  busy: boolean
}) {
  const [items, setItems] = useState<MediaDoc[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [uploading, setUploading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const fileRef = useRef<HTMLInputElement>(null)

  const load = async (q?: string) => {
    setLoading(true)
    setError(null)
    try {
      setItems(await listMedia(q))
    } catch {
      setError('Could not load the media library.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    void load()
  }, [])

  // Debounced search on alt text.
  useEffect(() => {
    const t = setTimeout(() => void load(search.trim() || undefined), 300)
    return () => clearTimeout(t)
  }, [search])

  const onFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    setUploading(true)
    setError(null)
    try {
      const doc = await uploadMedia(file, file.name.replace(/\.[^.]+$/, ''))
      onSelect(doc.id) // use it immediately
    } catch {
      setError('Upload failed. Try a JPG, PNG or WebP.')
      setUploading(false)
    }
  }

  return (
    <aside
      data-eb-chrome
      className="fixed right-0 top-0 z-[120] flex h-full w-[340px] max-w-[85vw] flex-col border-l border-ink-200 bg-white shadow-2xl"
      style={{ paddingTop: 'var(--eb-adminbar-h, 2.5rem)' }}
    >
      {/* header */}
      <div className="flex items-center justify-between border-b border-ink-100 px-4 py-3">
        <div>
          <p className="font-display text-sm font-bold text-ink-900">Change image</p>
          <p className="text-[11px] text-ink-400">Pick from your library or upload a new one</p>
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

      {/* upload + search */}
      <div className="space-y-2.5 border-b border-ink-100 px-4 py-3">
        <button
          type="button"
          onClick={() => fileRef.current?.click()}
          disabled={uploading || busy}
          className="flex w-full items-center justify-center gap-2 rounded-lg bg-brand-500 py-2.5 font-display text-sm font-bold text-ink-950 transition-colors hover:bg-brand-600 disabled:opacity-60"
        >
          {uploading ? 'Uploading…' : '↑ Upload new image'}
        </button>
        <input
          ref={fileRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={onFile}
        />
        <input
          type="search"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search library…"
          className="w-full rounded-lg border border-ink-200 px-3 py-2 text-sm text-ink-800 outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-500/25"
        />
      </div>

      {error ? <p className="px-4 py-2 text-xs text-red-600">{error}</p> : null}

      {/* grid */}
      <div className="relative flex-1 overflow-y-auto p-3">
        {loading ? (
          <p className="py-8 text-center text-sm text-ink-400">Loading…</p>
        ) : items.length === 0 ? (
          <p className="py-8 text-center text-sm text-ink-400">No images found.</p>
        ) : (
          <div className="grid grid-cols-2 gap-2.5">
            {items.map((m) => {
              const url = mediaThumb(m)
              return (
                <button
                  key={m.id}
                  type="button"
                  onClick={() => onSelect(m.id)}
                  disabled={busy}
                  title={m.alt || m.filename}
                  className="group relative aspect-[4/3] overflow-hidden rounded-lg border border-ink-100 bg-ink-50 transition-shadow hover:shadow-md focus:outline-none focus:ring-2 focus:ring-brand-500 disabled:opacity-60"
                >
                  {url ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={url} alt={m.alt || ''} className="h-full w-full object-cover" />
                  ) : (
                    <span className="grid h-full w-full place-items-center text-[10px] text-ink-400">no preview</span>
                  )}
                </button>
              )
            })}
          </div>
        )}

        {busy ? (
          <div className="absolute inset-0 grid place-items-center bg-white/60">
            <span className="rounded-full bg-ink-950 px-3 py-1.5 text-xs font-semibold text-white">Updating…</span>
          </div>
        ) : null}
      </div>
    </aside>
  )
}
