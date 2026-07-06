'use client'

import { useEffect, useState } from 'react'

/**
 * Hydration-safe prefers-reduced-motion.
 *
 * Motion's `useReducedMotion` reads the media query synchronously on the
 * first client render, so for reduced-motion visitors the first client tree
 * differs from the SSR HTML (which was rendered with `null` → full motion) —
 * a guaranteed React hydration failure wherever the flag switches whole
 * subtrees. This hook returns `false` during SSR *and* on the first client
 * render, then flips post-mount (and tracks live OS changes), so the swap to
 * the reduced variant happens as a normal state update instead of a
 * hydration mismatch.
 *
 * The SSR/default tree must therefore always be the full-motion variant.
 */
export function useReducedMotionSafe(): boolean {
  const [reduced, setReduced] = useState(false)

  useEffect(() => {
    const media = window.matchMedia('(prefers-reduced-motion: reduce)')
    const update = () => setReduced(media.matches)
    update()
    media.addEventListener('change', update)
    return () => media.removeEventListener('change', update)
  }, [])

  return reduced
}

export default useReducedMotionSafe
