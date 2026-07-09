'use server'

import config from '@payload-config'
import { getPayload } from 'payload'
import { revalidatePath } from 'next/cache'
import { cookies } from 'next/headers'

import { SEEN_COOKIE, isUnlocked } from '@/lib/analytics-auth'

/**
 * Lead-workspace mutations for the analytics PWA. Every action is gated by the
 * PIN unlock cookie (isUnlocked) and writes via the Local API — the same
 * trusted path the app already uses to read leads. On success the /analytics
 * route is revalidated so the board reflects the change.
 */

export type ActionResult = { ok: boolean; error?: string }

const CONTACT_STATUSES = new Set(['emailed_no_answer', 'called_no_answer', 'spoke', 'quote_sent'])
const NO_ANSWER_STATUSES = new Set(['emailed_no_answer', 'called_no_answer'])
const CLOSED_STATUSES = new Set(['won', 'lost', 'closed'])

async function guard(): Promise<boolean> {
  return isUnlocked()
}

/** Move a lead through the pipeline. Auto-schedules a 7-day chase on "no answer". */
export async function setLeadStatus(id: string | number, status: string): Promise<ActionResult> {
  if (!(await guard())) return { ok: false, error: 'Locked' }
  const payload = await getPayload({ config })
  const now = new Date()
  const data: Record<string, unknown> = { status }

  if (CONTACT_STATUSES.has(status)) data.lastContactedAt = now.toISOString()
  if (NO_ANSWER_STATUSES.has(status)) {
    const chase = new Date(now)
    chase.setDate(chase.getDate() + 7)
    data.nextFollowUpAt = chase.toISOString()
  }
  if (CLOSED_STATUSES.has(status)) data.nextFollowUpAt = null

  try {
    await payload.update({ collection: 'quote-requests', id, data })
    revalidatePath('/analytics')
    return { ok: true }
  } catch (err) {
    return { ok: false, error: String(err) }
  }
}

/** Schedule (or reschedule) a chase N days out. */
export async function chaseInDays(id: string | number, days = 7): Promise<ActionResult> {
  if (!(await guard())) return { ok: false, error: 'Locked' }
  const payload = await getPayload({ config })
  const when = new Date()
  when.setDate(when.getDate() + days)
  try {
    await payload.update({ collection: 'quote-requests', id, data: { nextFollowUpAt: when.toISOString() } })
    revalidatePath('/analytics')
    return { ok: true }
  } catch (err) {
    return { ok: false, error: String(err) }
  }
}

/** Mark a due follow-up as handled (clears the chase date). */
export async function clearFollowUp(id: string | number): Promise<ActionResult> {
  if (!(await guard())) return { ok: false, error: 'Locked' }
  const payload = await getPayload({ config })
  try {
    await payload.update({ collection: 'quote-requests', id, data: { nextFollowUpAt: null } })
    revalidatePath('/analytics')
    return { ok: true }
  } catch (err) {
    return { ok: false, error: String(err) }
  }
}

/** Save private staff notes on a lead. */
export async function saveLeadNote(id: string | number, notes: string): Promise<ActionResult> {
  if (!(await guard())) return { ok: false, error: 'Locked' }
  const payload = await getPayload({ config })
  try {
    await payload.update({ collection: 'quote-requests', id, data: { internalNotes: notes } })
    revalidatePath('/analytics')
    return { ok: true }
  } catch (err) {
    return { ok: false, error: String(err) }
  }
}

type SubInput = { endpoint: string; keys: { p256dh: string; auth: string }; label?: string }

/** Register this device for push alerts (upsert by endpoint). */
export async function savePushSubscription(sub: SubInput): Promise<ActionResult> {
  if (!(await guard())) return { ok: false, error: 'Locked' }
  if (!sub?.endpoint || !sub.keys?.p256dh || !sub.keys?.auth) return { ok: false, error: 'Bad subscription' }
  const payload = await getPayload({ config })
  try {
    const existing = await payload.find({
      collection: 'push-subscriptions',
      where: { endpoint: { equals: sub.endpoint } },
      limit: 1,
      depth: 0,
    })
    const data = {
      endpoint: sub.endpoint,
      p256dh: sub.keys.p256dh,
      auth: sub.keys.auth,
      label: sub.label ?? '',
    }
    if (existing.docs[0]) {
      await payload.update({ collection: 'push-subscriptions', id: existing.docs[0].id, data })
    } else {
      await payload.create({ collection: 'push-subscriptions', data })
    }
    return { ok: true }
  } catch (err) {
    return { ok: false, error: String(err) }
  }
}

/** Stamp "last visit" so the next open can show what's new since. */
export async function markSeen(): Promise<void> {
  if (!(await guard())) return
  const store = await cookies()
  store.set(SEEN_COOKIE, String(Date.now()), {
    httpOnly: true,
    secure: process.env.NODE_ENV !== 'development',
    sameSite: 'lax',
    path: '/',
    maxAge: 60 * 60 * 24 * 90,
  })
}

/** Unregister this device. */
export async function deletePushSubscription(endpoint: string): Promise<ActionResult> {
  if (!(await guard())) return { ok: false, error: 'Locked' }
  const payload = await getPayload({ config })
  try {
    await payload.delete({ collection: 'push-subscriptions', where: { endpoint: { equals: endpoint } } })
    return { ok: true }
  } catch (err) {
    return { ok: false, error: String(err) }
  }
}
