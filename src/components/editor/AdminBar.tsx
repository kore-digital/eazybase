'use client'

import { useState } from 'react'

import type { EditorUser } from './EditorOverlay'

/**
 * Slim fixed bar shown above the site header for authenticated admins and
 * editors. The push-down of the sticky site header is handled by the CSS
 * injected in EditorChrome (html.eb-authed body { padding-top } + header top
 * offset) — this component only renders the bar itself.
 */

type AdminBarProps = {
  user: EditorUser
  editMode: boolean
  onToggleEdit: (on: boolean) => void
  /** Flush content cache tags + refresh the route. Resolves when done. */
  onRefreshContent: () => Promise<void>
}

export function AdminBar({ user, editMode, onToggleEdit, onRefreshContent }: AdminBarProps) {
  const [refreshing, setRefreshing] = useState(false)
  const [loggingOut, setLoggingOut] = useState(false)

  const refresh = async () => {
    if (refreshing) return
    setRefreshing(true)
    try {
      await onRefreshContent()
    } finally {
      setRefreshing(false)
    }
  }

  const logout = async () => {
    if (loggingOut) return
    setLoggingOut(true)
    try {
      await fetch('/api/users/logout', { method: 'POST', credentials: 'include' })
    } catch {
      /* even if the request fails, reload — the cookie may already be gone */
    }
    window.location.reload()
  }

  return (
    <div
      data-eb-chrome
      className="fixed inset-x-0 top-0 z-[100] flex items-center gap-2 bg-ink-950 px-3 font-body text-xs text-ink-200 shadow-md sm:gap-4 sm:px-4"
      style={{ height: 'var(--eb-adminbar-h, 2.5rem)' }}
    >
      {/* Block-motif mark */}
      <span aria-hidden="true" className="hidden h-3 w-3 -skew-x-12 bg-brand-500 sm:inline-block" />

      <span className="hidden truncate md:inline">
        Editing as <span className="font-semibold text-white">{user.email}</span>
        {user.role ? <span className="text-ink-400"> ({user.role})</span> : null}
      </span>
      <span className="truncate md:hidden">
        <span className="font-semibold text-white">{user.email}</span>
      </span>

      <span className="ml-auto" />

      {/* Edit mode toggle */}
      <button
        type="button"
        role="switch"
        aria-checked={editMode}
        onClick={() => onToggleEdit(!editMode)}
        className="group flex items-center gap-2 rounded-full px-1 py-1 transition-colors hover:text-white focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-500"
      >
        <span className={editMode ? 'font-semibold text-brand-400' : ''}>Edit mode</span>
        <span
          aria-hidden="true"
          className={`relative inline-flex h-4 w-8 shrink-0 items-center rounded-full transition-colors ${
            editMode ? 'bg-brand-500' : 'bg-ink-600'
          }`}
        >
          <span
            className={`inline-block h-3 w-3 rounded-full bg-white transition-transform ${
              editMode ? 'translate-x-[1.125rem]' : 'translate-x-0.5'
            }`}
          />
        </span>
      </button>

      <span aria-hidden="true" className="h-4 w-px bg-ink-700" />

      <a
        href="/admin"
        target="_blank"
        rel="noopener"
        className="transition-colors hover:text-white focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-500"
      >
        Admin
      </a>

      <button
        type="button"
        onClick={refresh}
        disabled={refreshing}
        className="transition-colors hover:text-white disabled:opacity-60 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-500"
      >
        {refreshing ? 'Refreshing…' : 'Refresh content'}
      </button>

      <span aria-hidden="true" className="h-4 w-px bg-ink-700" />

      <button
        type="button"
        onClick={logout}
        disabled={loggingOut}
        className="transition-colors hover:text-white disabled:opacity-60 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-500"
      >
        {loggingOut ? 'Logging out…' : 'Log out'}
      </button>
    </div>
  )
}

export default AdminBar
