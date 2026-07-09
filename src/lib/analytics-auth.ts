/**
 * Lightweight PIN-gate auth for the EazyBase Analytics phone app (/analytics).
 * Separate from the Payload admin login: entering the PIN (stored on Site
 * Settings, admin-only) sets a long-lived HMAC-signed httpOnly cookie so it's
 * effectively a one-time unlock. No password, no Payload session involved.
 */
import crypto from 'crypto'
import { cookies } from 'next/headers'

const COOKIE = 'eb_analytics'
const MAX_AGE = 60 * 60 * 24 * 60 // 60 days ("one-time" unlock)

/** "Last visit" stamp cookie — drives the analytics "new leads since" badge. */
export const SEEN_COOKIE = 'eb_seen'

const secret = () => process.env.PAYLOAD_SECRET || 'eazybase-analytics-dev-secret'

function sign(payload: string): string {
  const sig = crypto.createHmac('sha256', secret()).update(payload).digest('base64url')
  return `${payload}.${sig}`
}

function valid(token: string | undefined): boolean {
  if (!token) return false
  const i = token.lastIndexOf('.')
  if (i < 0) return false
  const payload = token.slice(0, i)
  const sig = token.slice(i + 1)
  const expected = crypto.createHmac('sha256', secret()).update(payload).digest('base64url')
  if (sig.length !== expected.length) return false
  if (!crypto.timingSafeEqual(Buffer.from(sig), Buffer.from(expected))) return false
  const exp = Number(payload.split(':')[1])
  return Number.isFinite(exp) && exp > Date.now()
}

/** Constant-time compare of two secrets (hashed to a fixed length first). */
export function pinMatches(entered: string, stored: string | null | undefined): boolean {
  if (!stored) return false
  const a = crypto.createHash('sha256').update(entered).digest()
  const b = crypto.createHash('sha256').update(stored).digest()
  return crypto.timingSafeEqual(a, b)
}

export async function isUnlocked(): Promise<boolean> {
  const store = await cookies()
  return valid(store.get(COOKIE)?.value)
}

export async function setUnlocked(): Promise<void> {
  const token = sign(`analytics:${Date.now() + MAX_AGE * 1000}`)
  const store = await cookies()
  store.set(COOKIE, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV !== 'development',
    sameSite: 'lax',
    path: '/',
    maxAge: MAX_AGE,
  })
}

export async function clearUnlocked(): Promise<void> {
  const store = await cookies()
  store.delete(COOKIE)
}
