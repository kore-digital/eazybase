/**
 * Web-push for the EazyBase Analytics phone app. Sends a phone notification
 * when a new lead lands and (via the daily cron) when chases are due.
 *
 * Best-effort, exactly like the email adapter: if the VAPID keys are unset it
 * no-ops with a log line, so the app and enquiry flow never break. Dead
 * subscriptions (410/404) are pruned automatically.
 */
import type { Payload } from 'payload'
import webpush from 'web-push'

const PUBLIC_KEY = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY
const PRIVATE_KEY = process.env.VAPID_PRIVATE_KEY
const SUBJECT = process.env.VAPID_SUBJECT || 'mailto:info@eazybase.co.uk'

let configured = false
export function pushConfigured(): boolean {
  if (configured) return true
  if (!PUBLIC_KEY || !PRIVATE_KEY) return false
  webpush.setVapidDetails(SUBJECT, PUBLIC_KEY, PRIVATE_KEY)
  configured = true
  return true
}

type SubDoc = { id: string | number; endpoint: string; p256dh: string; auth: string }

type PushBody = { title: string; body: string; url?: string; tag?: string }

/** Send one notification to every subscribed device; prune dead ones. */
export async function sendPushToAll(payload: Payload, message: PushBody): Promise<{ sent: number; pruned: number }> {
  if (!pushConfigured()) {
    payload.logger.warn(`[push] VAPID keys unset — skipped "${message.title}"`)
    return { sent: 0, pruned: 0 }
  }

  const subs = await payload.find({ collection: 'push-subscriptions', limit: 500, depth: 0 })
  const payloadStr = JSON.stringify({ ...message, url: message.url || '/analytics' })

  let sent = 0
  let pruned = 0
  await Promise.all(
    (subs.docs as unknown as SubDoc[]).map(async (s) => {
      try {
        await webpush.sendNotification(
          { endpoint: s.endpoint, keys: { p256dh: s.p256dh, auth: s.auth } },
          payloadStr,
        )
        sent += 1
      } catch (err) {
        const status = (err as { statusCode?: number }).statusCode
        if (status === 404 || status === 410) {
          // Subscription is gone — remove it so we stop trying.
          await payload.delete({ collection: 'push-subscriptions', id: s.id }).catch(() => {})
          pruned += 1
        } else {
          payload.logger.error(`[push] send failed (${status ?? 'err'}): ${String(err)}`)
        }
      }
    }),
  )
  return { sent, pruned }
}

type LeadDoc = {
  firstName?: string | null
  lastName?: string | null
  town?: string | null
  postcode?: string | null
  type?: string | null
  estimator?: { estimateLow?: number | null; estimateHigh?: number | null } | null
}

/** New-lead alert. */
export async function sendLeadPush(payload: Payload, doc: LeadDoc): Promise<void> {
  const name = `${doc.firstName ?? ''} ${doc.lastName ?? ''}`.trim() || 'Someone'
  const where = doc.town || doc.postcode || ''
  const est = doc.estimator
  const range =
    est?.estimateLow != null && est?.estimateHigh != null
      ? ` · £${est.estimateLow.toLocaleString('en-GB')}–£${est.estimateHigh.toLocaleString('en-GB')}`
      : ''
  await sendPushToAll(payload, {
    title: '🟢 New lead',
    body: `${name}${where ? ` — ${where}` : ''}${range}`,
    url: '/analytics',
    tag: 'new-lead',
  })
}

/** Daily "follow-ups due" reminder. */
export async function sendDueChasePush(payload: Payload, count: number): Promise<void> {
  if (count <= 0) return
  await sendPushToAll(payload, {
    title: '⏰ Follow-ups due',
    body: count === 1 ? '1 lead is due a chase today.' : `${count} leads are due a chase today.`,
    url: '/analytics',
    tag: 'chase-due',
  })
}
