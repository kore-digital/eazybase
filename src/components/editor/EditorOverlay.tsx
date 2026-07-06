'use client'

import dynamic from 'next/dynamic'
import { useEffect, useState } from 'react'

/**
 * Auth gate for the in-page visual editor.
 *
 * Mounted once in the (frontend) layout. Renders NOTHING for anonymous
 * visitors — the only cost is a single cookie-authenticated fetch to
 * /api/users/me. The heavy editor chrome (admin bar + inline-edit engine)
 * is code-split via next/dynamic and only downloaded after auth succeeds.
 */

export type EditorUser = {
  id: number | string
  email: string
  role?: 'admin' | 'editor'
}

const EditorChrome = dynamic(() => import('./EditorChrome'), { ssr: false })

export function EditorOverlay() {
  const [user, setUser] = useState<EditorUser | null>(null)

  useEffect(() => {
    let cancelled = false
    fetch('/api/users/me', { credentials: 'include' })
      .then((res) => (res.ok ? res.json() : null))
      .then((data: { user?: EditorUser | null } | null) => {
        // Payload's /api/users/me wraps the doc as { user: { …, role } }.
        // `role` can be absent (e.g. field-level read access strips it) —
        // treat that as "no editor" and stay invisible rather than crash.
        const u = data?.user
        const role = u?.role
        if (!cancelled && u && (role === 'admin' || role === 'editor')) {
          setUser(u)
        }
      })
      .catch(() => {
        /* not logged in / API unreachable — stay invisible */
      })
    return () => {
      cancelled = true
    }
  }, [])

  if (!user) return null
  return <EditorChrome user={user} />
}

export default EditorOverlay
