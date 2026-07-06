'use client'

/**
 * SmoothScroll — site-wide Lenis smooth scrolling (the "weight" behind the
 * Build Story scroll signature).
 *
 * - Mounted once in the frontend layout; renders nothing.
 * - Disabled entirely under prefers-reduced-motion (native scroll remains).
 * - Touch devices keep native momentum (Lenis default `syncTouch: false`).
 * - `anchors` keeps in-page hash links working through Lenis, offset to clear
 *   the sticky header (matches the `scroll-mt-24` targets use natively).
 * - The instance is exposed on `window.__lenis` so components (e.g. the
 *   Build Story progress rail) can request smooth programmatic scrolls.
 */

import { useEffect } from 'react'
import Lenis from 'lenis'

declare global {
  interface Window {
    __lenis?: Lenis
  }
}

export function SmoothScroll() {
  useEffect(() => {
    const media = window.matchMedia('(prefers-reduced-motion: reduce)')

    let lenis: Lenis | null = null
    let frame = 0

    const stop = () => {
      cancelAnimationFrame(frame)
      lenis?.destroy()
      lenis = null
      if (window.__lenis) delete window.__lenis
      document.documentElement.style.removeProperty('scroll-behavior')
    }

    const start = () => {
      if (lenis || media.matches) return
      // CSS `scroll-behavior: smooth` (set globally in styles.css) fights
      // Lenis's programmatic positioning — neutralise it while Lenis runs.
      document.documentElement.style.scrollBehavior = 'auto'
      lenis = new Lenis({
        lerp: 0.1,
        syncTouch: false,
        anchors: { offset: -96 },
      })
      window.__lenis = lenis
      const loop = (time: number) => {
        lenis?.raf(time)
        frame = requestAnimationFrame(loop)
      }
      frame = requestAnimationFrame(loop)
    }

    // React to the OS setting changing mid-session.
    const onPreferenceChange = () => (media.matches ? stop() : start())
    media.addEventListener('change', onPreferenceChange)
    start()

    return () => {
      media.removeEventListener('change', onPreferenceChange)
      stop()
    }
  }, [])

  return null
}

export default SmoothScroll
