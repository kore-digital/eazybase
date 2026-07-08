'use client'

import { useEffect } from 'react'

/** Registers the service worker so the analytics app is installable + offline-tolerant. */
export function PwaRegister() {
  useEffect(() => {
    if (typeof navigator === 'undefined' || !('serviceWorker' in navigator)) return
    navigator.serviceWorker.register('/sw.js', { scope: '/analytics' }).catch(() => {
      /* SW registration is best-effort; the app still works without it */
    })
  }, [])
  return null
}
