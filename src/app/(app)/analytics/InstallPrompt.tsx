'use client'

import { useEffect, useState } from 'react'

import { EazyBaseMark } from '@/components/brand/EazyBaseMark'

type BeforeInstallPromptEvent = Event & {
  prompt: () => Promise<void>
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>
}

/**
 * Install banner for the analytics PWA. Shows on every visit until the app is
 * actually installed (i.e. opened in standalone mode). Android/desktop Chrome
 * get a one-tap Install button via `beforeinstallprompt`; iOS Safari gets the
 * "Share → Add to Home Screen" hint (iOS has no programmatic install).
 */
export function InstallPrompt() {
  const [deferred, setDeferred] = useState<BeforeInstallPromptEvent | null>(null)
  const [ready, setReady] = useState(false)
  const [standalone, setStandalone] = useState(true)
  const [isIOS, setIsIOS] = useState(false)
  const [hidden, setHidden] = useState(false)

  useEffect(() => {
    const nav = navigator as Navigator & { standalone?: boolean }
    const sa = window.matchMedia('(display-mode: standalone)').matches || nav.standalone === true
    setStandalone(sa)
    setIsIOS(/iphone|ipad|ipod/i.test(navigator.userAgent) && !sa)
    setReady(true)

    const onBip = (e: Event) => {
      e.preventDefault()
      setDeferred(e as BeforeInstallPromptEvent)
    }
    const onInstalled = () => setStandalone(true)
    window.addEventListener('beforeinstallprompt', onBip)
    window.addEventListener('appinstalled', onInstalled)
    return () => {
      window.removeEventListener('beforeinstallprompt', onBip)
      window.removeEventListener('appinstalled', onInstalled)
    }
  }, [])

  const install = async () => {
    if (!deferred) return
    await deferred.prompt()
    const choice = await deferred.userChoice
    if (choice.outcome === 'accepted') setStandalone(true)
    setDeferred(null)
  }

  // Nothing to show: already installed, dismissed this view, still checking,
  // or no install path available (e.g. desktop browser that won't install).
  if (!ready || standalone || hidden || (!deferred && !isIOS)) return null

  return (
    <div
      className="fixed inset-x-0 bottom-0 z-[60] px-3 pb-3"
      style={{ paddingBottom: 'calc(env(safe-area-inset-bottom) + 0.75rem)' }}
    >
      <div className="mx-auto flex max-w-md items-center gap-3 rounded-2xl bg-ink-950 px-3.5 py-3 text-white shadow-2xl shadow-ink-950/40">
        <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-white">
          <EazyBaseMark className="h-6 w-6" />
        </span>
        <div className="min-w-0 flex-1">
          <p className="font-display text-sm font-bold leading-tight">Install EazyBase Analytics</p>
          {isIOS ? (
            <p className="text-[11px] leading-snug text-ink-300">
              Tap Share <span aria-hidden="true">⎋</span>, then “Add to Home Screen”.
            </p>
          ) : (
            <p className="text-[11px] leading-snug text-ink-300">Add it to your home screen for one-tap access.</p>
          )}
        </div>
        {deferred ? (
          <button
            type="button"
            onClick={install}
            className="shrink-0 rounded-lg bg-brand-500 px-3.5 py-2 font-display text-sm font-bold text-ink-950 transition-colors hover:bg-brand-600"
          >
            Install
          </button>
        ) : null}
        <button
          type="button"
          onClick={() => setHidden(true)}
          aria-label="Dismiss"
          className="shrink-0 px-1 text-lg text-ink-500 hover:text-ink-300"
        >
          ✕
        </button>
      </div>
    </div>
  )
}
