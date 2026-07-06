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
        const u = data?.user
        if (!cancelled && u && (u.role === 'admin' || u.role === 'editor')) {
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
