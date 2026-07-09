'use client'

import { useEffect } from 'react'

import { markSeen } from './lead-actions'

/** Stamps the "last seen" cookie on each visit so the next open can show what's
 *  new. Runs once on mount; renders nothing. */
export function SeenTracker() {
  useEffect(() => {
    // Delay slightly so the current render's "new since" badge is read first.
    const t = setTimeout(() => {
      void markSeen()
    }, 1500)
    return () => clearTimeout(t)
  }, [])
  return null
}
