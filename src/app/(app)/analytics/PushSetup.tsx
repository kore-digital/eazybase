'use client'

import { useEffect, useState } from 'react'

import { savePushSubscription } from './lead-actions'

const VAPID_PUBLIC = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY

function urlBase64ToUint8Array(base64: string): Uint8Array {
  const padding = '='.repeat((4 - (base64.length % 4)) % 4)
  const b64 = (base64 + padding).replace(/-/g, '+').replace(/_/g, '/')
  const raw = atob(b64)
  const arr = new Uint8Array(raw.length)
  for (let i = 0; i < raw.length; i++) arr[i] = raw.charCodeAt(i)
  return arr
}

const isStandalone = () =>
  typeof window !== 'undefined' &&
  (window.matchMedia('(display-mode: standalone)').matches ||
    // iOS Safari
    (window.navigator as unknown as { standalone?: boolean }).standalone === true)

type UIState = 'checking' | 'unsupported' | 'needs-install' | 'ready' | 'subscribed' | 'denied' | 'working' | 'error'

/**
 * "Turn on lead alerts" — subscribes this device to web-push. Must be triggered
 * by a tap (browsers require a user gesture for Notification permission). On
 * iOS, push only works once the PWA is installed to the home screen.
 */
export function PushSetup() {
  const [state, setState] = useState<UIState>('checking')

  useEffect(() => {
    if (!VAPID_PUBLIC) {
      setState('unsupported')
      return
    }
    if (typeof window === 'undefined' || !('serviceWorker' in navigator) || !('PushManager' in window)) {
      // iOS Safari only exposes PushManager inside an installed PWA.
      setState(isStandalone() ? 'unsupported' : 'needs-install')
      return
    }
    navigator.serviceWorker.ready
      .then((reg) => reg.pushManager.getSubscription())
      .then((sub) => {
        if (sub) setState('subscribed')
        else if (Notification.permission === 'denied') setState('denied')
        else setState('ready')
      })
      .catch(() => setState('error'))
  }, [])

  async function enable() {
    setState('working')
    try {
      const perm = await Notification.requestPermission()
      if (perm !== 'granted') {
        setState(perm === 'denied' ? 'denied' : 'ready')
        return
      }
      const reg = await navigator.serviceWorker.ready
      const sub = await reg.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(VAPID_PUBLIC!),
      })
      const json = sub.toJSON() as { endpoint?: string; keys?: { p256dh?: string; auth?: string } }
      const res = await savePushSubscription({
        endpoint: json.endpoint!,
        keys: { p256dh: json.keys!.p256dh!, auth: json.keys!.auth! },
        label: navigator.userAgent.slice(0, 120),
      })
      setState(res.ok ? 'subscribed' : 'error')
    } catch {
      setState('error')
    }
  }

  // Nothing to show when not configured or already on.
  if (state === 'checking' || state === 'unsupported' || state === 'subscribed') return null

  if (state === 'needs-install') {
    return (
      <div className="mt-3 rounded-2xl border border-ink-100 bg-white p-3.5 text-[12px] text-ink-500">
        📲 To get lead alerts on this iPhone, tap <span className="font-semibold text-ink-700">Share → Add to Home Screen</span>, then open EazyBase Analytics from your home screen and turn on alerts.
      </div>
    )
  }

  if (state === 'denied') {
    return (
      <div className="mt-3 rounded-2xl border border-ink-100 bg-white p-3.5 text-[12px] text-ink-500">
        🔕 Notifications are blocked. Enable them for this app in your phone’s settings to get lead alerts.
      </div>
    )
  }

  return (
    <button
      type="button"
      onClick={enable}
      disabled={state === 'working'}
      className="mt-3 flex w-full items-center justify-center gap-2 rounded-2xl bg-ink-900 px-4 py-3 font-display text-[13px] font-semibold text-white disabled:opacity-60"
    >
      {state === 'working' ? 'Turning on…' : '🔔 Turn on lead alerts'}
    </button>
  )
}
