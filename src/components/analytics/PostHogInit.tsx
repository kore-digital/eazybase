'use client'

import posthog from 'posthog-js'
import { useEffect } from 'react'

/**
 * Initialises PostHog once, client-side, on the public site only (not the admin).
 * With `defaults` set, PostHog auto-captures page views (incl. SPA navigations)
 * and clicks (autocapture) — so WhatsApp / Call / Quote / Instant-Quote link
 * clicks are recorded via their href without per-button wiring. The admin
 * dashboard reads these back through the PostHog query API (Phase B, part 2).
 */
let initialised = false

export function PostHogInit() {
  useEffect(() => {
    const key = process.env.NEXT_PUBLIC_POSTHOG_KEY
    if (!key || initialised) return
    initialised = true
    posthog.init(key, {
      api_host: process.env.NEXT_PUBLIC_POSTHOG_HOST || 'https://eu.i.posthog.com',
      defaults: '2026-05-30',
    })
  }, [])

  return null
}

export default PostHogInit
