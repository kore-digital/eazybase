'use client'

import { useTransition } from 'react'

import { signOut } from './actions'

/** Sticky app header with the brand mark + a sign-out (clears the PIN cookie). */
export function AppHeader() {
  const [pending, start] = useTransition()
  return (
    <header
      className="sticky top-0 z-20 flex items-center justify-between bg-ink-950 px-4 pb-3 text-white"
      style={{ paddingTop: 'calc(env(safe-area-inset-top) + 0.85rem)' }}
    >
      <div className="flex items-center gap-2.5">
        <span aria-hidden="true" className="flex h-8 w-8 items-center justify-center rounded-lg bg-brand-500">
          <svg viewBox="0 0 512 512" className="h-4.5 w-4.5">
            <rect x="119" y="286" width="74" height="110" rx="14" fill="#1e1f1d" />
            <rect x="219" y="226" width="74" height="170" rx="14" fill="#1e1f1d" />
            <rect x="319" y="166" width="74" height="230" rx="14" fill="#1e1f1d" />
          </svg>
        </span>
        <div>
          <p className="font-display text-sm font-bold leading-tight">EazyBase Analytics</p>
          <p className="text-[11px] leading-tight text-ink-400">Live · last 30 days</p>
        </div>
      </div>
      <button
        type="button"
        onClick={() => start(async () => { await signOut(); window.location.assign('/analytics') })}
        disabled={pending}
        className="rounded-lg border border-white/15 px-3 py-1.5 text-xs font-semibold text-ink-200 transition-colors hover:bg-white/10 disabled:opacity-50"
      >
        {pending ? '…' : 'Sign out'}
      </button>
    </header>
  )
}
