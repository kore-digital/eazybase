'use client'

import { useActionState, useEffect } from 'react'

import { EazyBaseMark } from '@/components/brand/EazyBaseMark'

import { unlock, type UnlockState } from './actions'

const initial: UnlockState = { status: 'idle' }

/** Full-screen PIN lock. On the correct PIN the cookie is set, then we reload
 *  so the server renders the unlocked analytics app. */
export function PinGate() {
  const [state, action, pending] = useActionState(unlock, initial)

  useEffect(() => {
    if (state.status === 'ok') window.location.assign('/analytics')
  }, [state.status])

  return (
    <main
      className="grid min-h-[100dvh] place-items-center bg-ink-950 px-6 text-white"
      style={{ paddingTop: 'env(safe-area-inset-top)', paddingBottom: 'env(safe-area-inset-bottom)' }}
    >
      <div className="w-full max-w-xs text-center">
        <span aria-hidden="true" className="mx-auto flex h-20 w-20 items-center justify-center rounded-2xl bg-white shadow-lg">
          <EazyBaseMark className="h-12 w-12" />
        </span>
        <h1 className="mt-5 font-display text-2xl font-bold">EazyBase Analytics</h1>
        <p className="mt-2 text-sm text-ink-300">Enter your PIN to unlock.</p>

        <form action={action} className="mt-7">
          <input
            name="pin"
            type="password"
            inputMode="numeric"
            autoComplete="off"
            autoFocus
            pattern="[0-9]*"
            maxLength={6}
            aria-label="PIN"
            placeholder="••••••"
            className="w-full rounded-xl border border-white/15 bg-white/5 px-4 py-4 text-center font-display text-2xl tracking-[0.4em] text-white outline-none placeholder:text-ink-500 focus:border-brand-500 focus:ring-4 focus:ring-brand-500/25"
          />
          {(state.status === 'bad' || state.status === 'unset') && state.message ? (
            <p role="alert" className="mt-3 text-sm text-red-400">{state.message}</p>
          ) : null}
          <button
            type="submit"
            disabled={pending}
            className="mt-5 w-full rounded-xl bg-brand-500 py-3.5 font-display font-bold text-ink-950 transition-colors hover:bg-brand-600 disabled:opacity-60"
          >
            {pending ? 'Checking…' : 'Unlock'}
          </button>
        </form>
        <p className="mt-6 text-xs text-ink-500">EazyBase &middot; built by kore digital</p>
      </div>
    </main>
  )
}
