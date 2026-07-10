'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useCallback, useEffect, useRef, useState } from 'react'

/**
 * Site-wide launch-offer pop-up: a free SkyPod (roof skylight) with every
 * booking in July & August. Confetti burst on open, a SkyPod illustration, and
 * a "Claim my reward" CTA to the instant-quote page.
 *
 * Shows at most once every 24h (localStorage timestamp); once a visitor clicks
 * "Claim" it never shows again. Auto-retires after the offer ends so it never
 * goes stale, and never appears on the quote pages it points to.
 */

const OFFER_ENDS = new Date('2026-09-01T00:00:00') // show through 31 Aug
const LAST_KEY = 'eb_promo_skypod_last' // timestamp last shown
const DONE_KEY = 'eb_promo_skypod_done' // claimed → never again
const COOLDOWN = 24 * 60 * 60 * 1000 // show at most once per 24h

// Auto-pop suppressed on the full-form page only; instant-quote gets the
// pop-up too (with the inline banner remaining after dismissal to reopen it).
const HIDE_ON = ['/get-a-quote']

/** Fire this event to open the offer modal on demand (e.g. the inline banner). */
export const PROMO_OPEN_EVENT = 'eb:open-promo'

export function PromoModal({ enabled = true }: { enabled?: boolean }) {
  const pathname = usePathname()
  const [open, setOpen] = useState(false)
  const canvasRef = useRef<HTMLCanvasElement | null>(null)

  // Decide whether to show (client-only; respects toggle + date + storage + route).
  useEffect(() => {
    if (!enabled) return
    if (HIDE_ON.some((p) => pathname?.startsWith(p))) return
    if (new Date() >= OFFER_ENDS) return
    try {
      if (localStorage.getItem(DONE_KEY)) return
      const last = Number(localStorage.getItem(LAST_KEY) || 0)
      if (Date.now() - last < COOLDOWN) return
    } catch {
      /* storage blocked — still show once */
    }
    const t = setTimeout(() => {
      setOpen(true)
      try {
        localStorage.setItem(LAST_KEY, String(Date.now()))
      } catch {
        /* ignore */
      }
    }, 1100)
    return () => clearTimeout(t)
  }, [pathname, enabled])

  // Open on demand (inline banner) — bypasses the cooldown/date guards.
  useEffect(() => {
    if (!enabled) return
    const onOpen = () => setOpen(true)
    window.addEventListener(PROMO_OPEN_EVENT, onOpen)
    return () => window.removeEventListener(PROMO_OPEN_EVENT, onOpen)
  }, [enabled])

  const close = useCallback((remember: 'cooldown' | 'forever') => {
    setOpen(false)
    try {
      localStorage.setItem(LAST_KEY, String(Date.now()))
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
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && close('cooldown')
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
        onClick={() => close('cooldown')}
        className="absolute inset-0 bg-ink-950/70 backdrop-blur-sm"
      />

      {/* confetti rains over the front of the card (pointer-events-none, so the
          card stays fully clickable underneath) */}
      <canvas ref={canvasRef} className="pointer-events-none absolute inset-0 z-20 h-full w-full" />

      {/* card */}
      <div
        className="relative z-10 max-h-[92dvh] w-full max-w-[440px] overflow-y-auto overflow-x-hidden rounded-3xl bg-white shadow-2xl"
        style={{ animation: 'ebPromoPop 0.45s cubic-bezier(0.16,1,0.3,1) both' }}
      >
        {/* close */}
        <button
          type="button"
          aria-label="Close"
          onClick={() => close('cooldown')}
          className="absolute right-3 top-3 z-20 flex h-9 w-9 items-center justify-center rounded-full bg-white/80 text-ink-600 shadow-sm backdrop-blur transition-colors hover:bg-white hover:text-ink-900"
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round">
            <path d="M6 6l12 12M18 6L6 18" />
          </svg>
        </button>

        {/* Photo banner with FREE badge */}
        <div className="relative">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="/skypod-offer.jpg"
            alt="A bright kitchen extension flooded with light from a SkyPod roof skylight"
            className="h-[188px] w-full object-cover object-[center_32%] sm:h-[208px]"
          />
          <div className="pointer-events-none absolute inset-x-0 bottom-0 h-10 bg-gradient-to-t from-white to-transparent" />
          <div className="absolute left-4 top-4 flex h-[70px] w-[70px] rotate-[-8deg] flex-col items-center justify-center rounded-full bg-brand-500 text-center shadow-lg ring-2 ring-white/85">
            <span className="font-display text-[16px] font-extrabold leading-none text-ink-950">FREE</span>
            <span className="mt-0.5 font-display text-[8px] font-bold tracking-[0.12em] text-ink-950/80">SKYPOD</span>
          </div>
        </div>

        <div className="px-6 pb-6 pt-5 text-center sm:px-7">
          <span className="inline-block rounded-full bg-brand-100 px-3 py-1 font-display text-[11px] font-bold uppercase tracking-wider text-brand-800">
            New website launch offer
          </span>
          <h2 className="mt-3 font-display text-[26px] font-extrabold leading-tight text-ink-950 sm:text-[28px]">
            A <span className="text-brand-600">FREE SkyPod</span> with every booking
          </h2>
          <p className="mt-2 text-[15px] leading-relaxed text-ink-600">
            We&apos;re celebrating our shiny new website — so book your extension in{' '}
            <strong className="text-ink-900">July or August</strong> and we&apos;ll drop in a{' '}
            <strong className="text-ink-900">SkyPod roof skylight, absolutely free.</strong> Flood your new space
            with natural light, on us.
          </p>

          <ul className="mx-auto mt-4 grid max-w-[300px] gap-1.5 text-left text-[13.5px] text-ink-700">
            {['Modern, stylish glass design', 'Brighter, warmer living space', 'Adds real value to your home', 'Yours FREE with every qualifying order'].map(
              (b) => (
                <li key={b} className="flex items-start gap-2">
                  <svg className="mt-0.5 shrink-0 text-brand-600" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                    <path d="M20 6L9 17l-5-5" />
                  </svg>
                  <span>{b}</span>
                </li>
              ),
            )}
          </ul>

          <Link
            href="/get-a-quote"
            onClick={() => close('forever')}
            className="mt-5 flex w-full items-center justify-center gap-2 rounded-full bg-brand-700 px-6 py-3.5 font-display text-[15px] font-extrabold text-white shadow-lg shadow-brand-700/30 transition-colors hover:bg-brand-800 active:scale-95"
          >
            Claim My Reward
          </Link>

          <p className="mt-3 text-[12px] font-semibold text-ink-400">
            Hurry — offer ends 31st August. Don&apos;t miss out!
          </p>
          <button
            type="button"
            onClick={() => close('cooldown')}
            className="mt-1 text-[12px] font-medium text-ink-400 underline-offset-2 hover:underline"
          >
            Maybe later
          </button>
        </div>
      </div>
    </div>
  )
}

/**
 * Inline "claim your free SkyPod" banner for the instant-quote page. Sits in
 * the page flow (not floating); tapping it opens the offer modal (which shoots
 * the confetti). Only shown while the offer is live.
 */
export function PromoBanner() {
  const [live, setLive] = useState(false)

  useEffect(() => {
    setLive(new Date() < OFFER_ENDS)
  }, [])

  if (!live) return null

  return (
    <button
      type="button"
      onClick={() => window.dispatchEvent(new CustomEvent(PROMO_OPEN_EVENT))}
      data-eb-chrome
      aria-label="Claim your free SkyPod offer"
      className="group mx-auto mb-8 flex w-full max-w-2xl items-center gap-3.5 rounded-2xl bg-brand-700 p-4 text-left shadow-lg shadow-brand-900/20 transition-colors hover:bg-brand-800 sm:gap-4"
    >
      <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-white/20 text-white" aria-hidden="true">
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
          <rect x="3" y="8" width="18" height="4" rx="1" />
          <path d="M12 8v13M5 12v7a1 1 0 0 0 1 1h12a1 1 0 0 0 1-1v-7" />
          <path d="M12 8S10.5 3 8 3a2.5 2.5 0 0 0 0 5M12 8s1.5-5 4-5a2.5 2.5 0 0 1 0 5" />
        </svg>
      </span>
      <span className="min-w-0 flex-1">
        <span className="block font-display text-[14px] font-extrabold leading-tight text-white sm:text-[15px]">
          Booking in July or August? Claim your FREE SkyPod
        </span>
        <span className="mt-0.5 block text-[12px] leading-snug text-white/85 sm:text-[12.5px]">
          A free roof skylight with every qualifying order — tap to see the offer
        </span>
      </span>
      <span className="shrink-0 text-white transition-transform group-hover:translate-x-0.5" aria-hidden="true">
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round">
          <path d="M5 12h14M13 6l6 6-6 6" />
        </svg>
      </span>
    </button>
  )
}

/**
 * Slim site-wide notification bar announcing the offer. Sits above the header
 * (scrolls away as the sticky header pins). Tapping it opens the offer modal.
 * Only shown while the offer is live and enabled.
 */
export function PromoTopBar({ enabled = true }: { enabled?: boolean }) {
  const [live, setLive] = useState(false)

  useEffect(() => {
    setLive(enabled && new Date() < OFFER_ENDS)
  }, [enabled])

  if (!live) return null

  return (
    <button
      type="button"
      onClick={() => window.dispatchEvent(new CustomEvent(PROMO_OPEN_EVENT))}
      data-eb-chrome
      aria-label="Claim your free SkyPod offer"
      className="flex w-full items-center justify-center gap-2.5 bg-brand-700 px-4 py-2 text-center text-white transition-colors hover:bg-brand-800"
    >
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" className="shrink-0" aria-hidden="true">
        <rect x="3" y="8" width="18" height="4" rx="1" />
        <path d="M12 8v13M5 12v7a1 1 0 0 0 1 1h12a1 1 0 0 0 1-1v-7" />
        <path d="M12 8S10.5 3 8 3a2.5 2.5 0 0 0 0 5M12 8s1.5-5 4-5a2.5 2.5 0 0 1 0 5" />
      </svg>
      <span className="text-[12px] font-semibold leading-tight sm:text-[13px]">
        <span className="font-extrabold">FREE SkyPod</span> with every booking this July &amp; August
      </span>
      <span className="hidden shrink-0 text-[12px] font-bold underline underline-offset-2 sm:inline">Claim yours →</span>
    </button>
  )
}

const PROMO_CSS = `
@keyframes ebPromoFade { from { opacity: 0 } to { opacity: 1 } }
@keyframes ebPromoPop { from { opacity: 0; transform: translateY(16px) scale(0.94) } to { opacity: 1; transform: translateY(0) scale(1) } }
`

export default PromoModal
