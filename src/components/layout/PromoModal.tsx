'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useCallback, useEffect, useRef, useState } from 'react'

/**
 * Site-wide launch-offer pop-up: a free SkyPod (roof skylight) with every
 * booking in July & August. Confetti burst on open, a SkyPod illustration, and
 * a "Claim my reward" CTA to the instant-quote page.
 *
 * Shows once per session (sessionStorage); a claim/dismiss is remembered for
 * good (localStorage). Auto-retires after the offer ends so it never goes
 * stale, and never appears on the quote pages it points to.
 */

const OFFER_ENDS = new Date('2026-09-01T00:00:00') // show through 31 Aug
const SEEN_KEY = 'eb_promo_skypod_seen' // this session
const DONE_KEY = 'eb_promo_skypod_done' // ever

const HIDE_ON = ['/instant-quote', '/get-a-quote']

export function PromoModal() {
  const pathname = usePathname()
  const [open, setOpen] = useState(false)
  const canvasRef = useRef<HTMLCanvasElement | null>(null)

  // Decide whether to show (client-only; respects date + storage + route).
  useEffect(() => {
    if (HIDE_ON.some((p) => pathname?.startsWith(p))) return
    if (new Date() >= OFFER_ENDS) return
    try {
      if (localStorage.getItem(DONE_KEY) || sessionStorage.getItem(SEEN_KEY)) return
    } catch {
      /* storage blocked — still show once */
    }
    const t = setTimeout(() => setOpen(true), 1100)
    return () => clearTimeout(t)
  }, [pathname])

  const close = useCallback((remember: 'session' | 'forever') => {
    setOpen(false)
    try {
      sessionStorage.setItem(SEEN_KEY, '1')
      if (remember === 'forever') localStorage.setItem(DONE_KEY, '1')
    } catch {
      /* ignore */
    }
  }, [])

  // Body scroll-lock + Escape while open.
  useEffect(() => {
    if (!open) return
    const prev = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && close('session')
    window.addEventListener('keydown', onKey)
    return () => {
      document.body.style.overflow = prev
      window.removeEventListener('keydown', onKey)
    }
  }, [open, close])

  // Confetti burst (skipped under reduced-motion).
  useEffect(() => {
    if (!open) return
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    const dpr = Math.min(window.devicePixelRatio || 1, 2)
    const resize = () => {
      canvas.width = window.innerWidth * dpr
      canvas.height = window.innerHeight * dpr
    }
    resize()
    window.addEventListener('resize', resize)

    const COLORS = ['#96c11f', '#adcf2f', '#c5df5b', '#ffd54a', '#ffffff', '#1e1f1d']
    const W = () => window.innerWidth
    type Piece = { x: number; y: number; r: number; c: string; vx: number; vy: number; a: number; va: number; sh: number }
    const rand = (a: number, b: number) => a + Math.random() * (b - a)
    const make = (): Piece => ({
      x: rand(0, W()),
      y: rand(-window.innerHeight * 0.3, -10),
      r: rand(5, 11),
      c: COLORS[Math.floor(Math.random() * COLORS.length)],
      vx: rand(-1.1, 1.1),
      vy: rand(2.4, 5.2),
      a: rand(0, Math.PI * 2),
      va: rand(-0.2, 0.2),
      sh: Math.random() > 0.5 ? 0 : 1,
    })
    let pieces: Piece[] = Array.from({ length: 160 }, make)

    const start = performance.now()
    let raf = 0
    const tick = (now: number) => {
      const elapsed = now - start
      ctx.clearRect(0, 0, canvas.width, canvas.height)
      ctx.save()
      ctx.scale(dpr, dpr)
      let alive = 0
      for (const p of pieces) {
        p.x += p.vx
        p.y += p.vy
        p.vy += 0.03 // gravity
        p.a += p.va
        if (p.y < window.innerHeight + 20) alive++
        ctx.save()
        ctx.translate(p.x, p.y)
        ctx.rotate(p.a)
        ctx.fillStyle = p.c
        if (p.sh === 0) ctx.fillRect(-p.r / 2, -p.r / 2, p.r, p.r * 0.6)
        else {
          ctx.beginPath()
          ctx.arc(0, 0, p.r / 2, 0, Math.PI * 2)
          ctx.fill()
        }
        ctx.restore()
      }
      ctx.restore()
      // Top-up emission for the first ~1.2s for a fuller burst, then let it fall out.
      if (elapsed < 1200 && pieces.length < 320) pieces.push(...Array.from({ length: 6 }, make))
      if (alive > 0) raf = requestAnimationFrame(tick)
      else ctx.clearRect(0, 0, canvas.width, canvas.height)
    }
    raf = requestAnimationFrame(tick)

    return () => {
      cancelAnimationFrame(raf)
      window.removeEventListener('resize', resize)
      pieces = []
    }
  }, [open])

  if (!open) return null

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="EazyBase launch offer"
      data-eb-chrome
      className="fixed inset-0 z-[9999] flex items-center justify-center p-4"
      style={{ animation: 'ebPromoFade 0.25s ease both' }}
    >
      <style>{PROMO_CSS}</style>

      {/* backdrop */}
      <button
        type="button"
        aria-label="Close offer"
        onClick={() => close('session')}
        className="absolute inset-0 bg-ink-950/70 backdrop-blur-sm"
      />

      {/* confetti sits above the backdrop, behind the card */}
      <canvas ref={canvasRef} className="pointer-events-none absolute inset-0 h-full w-full" />

      {/* card */}
      <div
        className="relative z-10 w-full max-w-[440px] overflow-hidden rounded-3xl bg-white shadow-2xl"
        style={{ animation: 'ebPromoPop 0.45s cubic-bezier(0.16,1,0.3,1) both' }}
      >
        {/* close */}
        <button
          type="button"
          aria-label="Close"
          onClick={() => close('session')}
          className="absolute right-3 top-3 z-20 flex h-9 w-9 items-center justify-center rounded-full bg-white/80 text-ink-600 shadow-sm backdrop-blur transition-colors hover:bg-white hover:text-ink-900"
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round">
            <path d="M6 6l12 12M18 6L6 18" />
          </svg>
        </button>

        {/* SkyPod illustration banner */}
        <SkyPodArt />

        <div className="px-6 pb-6 pt-5 text-center sm:px-7">
          <span className="inline-block rounded-full bg-brand-100 px-3 py-1 font-display text-[11px] font-bold uppercase tracking-wider text-brand-800">
            🎉 New website launch offer
          </span>
          <h2 className="mt-3 font-display text-[26px] font-extrabold leading-tight text-ink-950 sm:text-[28px]">
            A <span className="text-brand-600">FREE SkyPod</span> with every booking
          </h2>
          <p className="mt-2 text-[15px] leading-relaxed text-ink-600">
            We&apos;re celebrating our shiny new website — so book your extension in{' '}
            <strong className="text-ink-900">July or August</strong> and we&apos;ll drop in a{' '}
            <strong className="text-ink-900">SkyPod roof skylight, absolutely free.</strong> Flood your new space
            with natural light, on us. ☀️
          </p>

          <ul className="mx-auto mt-4 grid max-w-[300px] gap-1.5 text-left text-[13.5px] text-ink-700">
            {['Modern, stylish glass design', 'Brighter, warmer living space', 'Adds real value to your home', 'Yours FREE with every qualifying order'].map(
              (b) => (
                <li key={b} className="flex items-start gap-2">
                  <span className="mt-0.5 text-brand-600">✓</span>
                  <span>{b}</span>
                </li>
              ),
            )}
          </ul>

          <Link
            href="/instant-quote"
            onClick={() => close('forever')}
            className="mt-5 flex w-full items-center justify-center gap-2 rounded-full bg-brand-500 px-6 py-3.5 font-display text-[15px] font-extrabold text-ink-950 shadow-lg shadow-brand-500/30 transition-transform hover:scale-[1.02] active:scale-95"
          >
            🎁 Claim my reward
          </Link>

          <p className="mt-3 text-[12px] font-semibold text-ink-400">
            ⏳ Hurry — offer ends 31st August. Don&apos;t miss out!
          </p>
          <button
            type="button"
            onClick={() => close('session')}
            className="mt-1 text-[12px] font-medium text-ink-400 underline-offset-2 hover:underline"
          >
            Maybe later
          </button>
        </div>
      </div>
    </div>
  )
}

/** On-brand vector SkyPod / roof-lantern illustration (self-contained). */
function SkyPodArt() {
  return (
    <div className="relative">
      <svg viewBox="0 0 440 220" className="block h-auto w-full" role="img" aria-label="SkyPod roof skylight">
        <defs>
          <linearGradient id="ebSky" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0" stopColor="#bfe3f7" />
            <stop offset="1" stopColor="#eaf6fd" />
          </linearGradient>
          <linearGradient id="ebGlass" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0" stopColor="#dff1fb" />
            <stop offset="1" stopColor="#a9d8f0" />
          </linearGradient>
          <radialGradient id="ebSun" cx="0.5" cy="0.5" r="0.5">
            <stop offset="0" stopColor="#ffe9a8" />
            <stop offset="1" stopColor="#ffd54a" />
          </radialGradient>
        </defs>

        {/* sky */}
        <rect width="440" height="220" fill="url(#ebSky)" />

        {/* sun + rays */}
        <g transform="translate(360, 58)">
          {Array.from({ length: 12 }).map((_, i) => (
            <rect key={i} x="-1.5" y="-40" width="3" height="14" rx="1.5" fill="#ffd54a" opacity="0.75" transform={`rotate(${i * 30})`} />
          ))}
          <circle r="26" fill="url(#ebSun)" />
        </g>

        {/* soft light beams onto the pod */}
        <path d="M150 40 L120 210 L250 210 L210 40 Z" fill="#ffffff" opacity="0.35" />

        {/* roof base */}
        <rect x="0" y="180" width="440" height="40" fill="#e8eae4" />
        <rect x="0" y="176" width="440" height="8" fill="#d3d6cd" />

        {/* roof lantern / SkyPod */}
        <g transform="translate(220, 176)">
          {/* glass pyramid */}
          <polygon points="-70,0 70,0 40,-70 -40,-70" fill="url(#ebGlass)" stroke="#ffffff" strokeWidth="5" strokeLinejoin="round" />
          {/* glazing bars */}
          <line x1="0" y1="0" x2="0" y2="-70" stroke="#ffffff" strokeWidth="4" />
          <line x1="-35" y1="0" x2="-20" y2="-70" stroke="#ffffff" strokeWidth="4" />
          <line x1="35" y1="0" x2="20" y2="-70" stroke="#ffffff" strokeWidth="4" />
          <line x1="-58" y1="-24" x2="58" y2="-24" stroke="#ffffff" strokeWidth="4" />
          {/* highlight */}
          <polygon points="-40,-70 -10,-70 -46,-4 -66,-4" fill="#ffffff" opacity="0.35" />
          {/* base frame */}
          <rect x="-78" y="-2" width="156" height="14" rx="4" fill="#ffffff" />
          <rect x="-78" y="8" width="156" height="6" rx="3" fill="#d3d6cd" />
        </g>

        {/* FREE badge */}
        <g transform="translate(70, 60)">
          <circle r="34" fill="#96c11f" />
          <circle r="34" fill="none" stroke="#ffffff" strokeWidth="3" strokeDasharray="3 5" />
          <text textAnchor="middle" y="-2" fontFamily="Montserrat, sans-serif" fontSize="17" fontWeight="800" fill="#1e1f1d">
            FREE
          </text>
          <text textAnchor="middle" y="14" fontFamily="Montserrat, sans-serif" fontSize="8.5" fontWeight="700" fill="#1e1f1d" opacity="0.8">
            SKYPOD
          </text>
        </g>
      </svg>
    </div>
  )
}

const PROMO_CSS = `
@keyframes ebPromoFade { from { opacity: 0 } to { opacity: 1 } }
@keyframes ebPromoPop { from { opacity: 0; transform: translateY(16px) scale(0.94) } to { opacity: 1; transform: translateY(0) scale(1) } }
`

export default PromoModal
