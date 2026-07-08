'use server'

import config from '@payload-config'
import { getPayload } from 'payload'

import { clearUnlocked, pinMatches, setUnlocked } from '@/lib/analytics-auth'

export type UnlockState = { status: 'idle' | 'ok' | 'bad' | 'unset'; message?: string }

/** Verify the entered PIN against Site Settings; on match, set the unlock cookie. */
export async function unlock(_prev: UnlockState, formData: FormData): Promise<UnlockState> {
  const pin = String(formData.get('pin') ?? '').trim()
  if (!pin) return { status: 'bad', message: 'Enter your PIN.' }

  const payload = await getPayload({ config })
  const settings = await payload.findGlobal({ slug: 'site-settings' })
  const stored = (settings as { analyticsPin?: string | null }).analyticsPin

  if (!stored) {
    return {
      status: 'unset',
      message: 'No PIN set yet. Add one in the admin under Settings → Site Settings.',
    }
  }

  if (!pinMatches(pin, stored)) {
    // Small delay to slow brute-force attempts.
    await new Promise((r) => setTimeout(r, 700))
    return { status: 'bad', message: 'Incorrect PIN. Try again.' }
  }

  await setUnlocked()
  return { status: 'ok' }
}

export async function signOut(): Promise<void> {
  await clearUnlocked()
}
