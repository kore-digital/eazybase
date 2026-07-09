import type { EmailAdapter } from 'payload'

/**
 * Email for EazyBase — a custom Payload email adapter that sends through the
 * Resend HTTP API (no SDK / SMTP dependency). It powers:
 *   - Payload admin/system mail (e.g. password resets), and
 *   - payload.sendEmail(...) used by the enquiry hooks (team + customer mail).
 *
 * When RESEND_API_KEY is unset it no-ops with a log line, so local dev and
 * un-configured deploys never error. Sending domain (eazybase.co.uk) must be
 * verified in Resend for delivery.
 */

const RESEND_ENDPOINT = 'https://api.resend.com/emails'

export const FROM_TEAM = 'EazyBase Leads <leads@eazybase.co.uk>'
export const FROM_CUSTOMER = 'EazyBase <hello@eazybase.co.uk>'
export const DEFAULT_FROM_ADDRESS = 'leads@eazybase.co.uk'
export const DEFAULT_FROM_NAME = 'EazyBase'

export const leadNotifyTo = () => process.env.LEAD_NOTIFY_EMAIL || 'info@eazybase.co.uk'

export const resendHttpAdapter: EmailAdapter = ({ payload }) => ({
  name: 'resend-http',
  defaultFromAddress: DEFAULT_FROM_ADDRESS,
  defaultFromName: DEFAULT_FROM_NAME,
  sendEmail: async (message) => {
    const apiKey = process.env.RESEND_API_KEY
    const to = (Array.isArray(message.to) ? message.to : [message.to]).filter(Boolean)
    const from = message.from || `${DEFAULT_FROM_NAME} <${DEFAULT_FROM_ADDRESS}>`
    if (!apiKey) {
      payload.logger.warn(`[email] RESEND_API_KEY unset — skipped "${message.subject}" to ${to.join(', ')}`)
      return { skipped: true }
    }
    try {
      const res = await fetch(RESEND_ENDPOINT, {
        method: 'POST',
        headers: { Authorization: `Bearer ${apiKey}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({
          from,
          to,
          subject: message.subject,
          html: message.html,
          text: message.text,
          reply_to: message.replyTo,
          cc: message.cc,
          bcc: message.bcc,
        }),
      })
      if (!res.ok) {
        payload.logger.error(`[email] Resend send failed ${res.status}: ${await res.text()}`)
      }
      return res.ok ? await res.json().catch(() => ({})) : { error: res.status }
    } catch (err) {
      payload.logger.error(`[email] Resend errored: ${String(err)}`)
      return { error: String(err) }
    }
  },
})

/* -------------------------------------------------------------- templates */

const BRAND = '#96c11f'
const INK = '#1e1f1d'
const esc = (s: unknown) =>
  String(s ?? '').replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' })[c]!)

/** Branded HTML shell for all EazyBase emails. */
function shell(bodyHtml: string): string {
  return `<div style="margin:0;padding:24px;background:#f4f5f0;font-family:-apple-system,Segoe UI,Helvetica,Arial,sans-serif;color:${INK}">
  <div style="max-width:560px;margin:0 auto;background:#fff;border-radius:14px;overflow:hidden;border:1px solid #e6e8e0">
    <div style="background:${INK};padding:18px 24px">
      <span style="font-size:20px;font-weight:800;color:#fff">Eazy<span style="color:${BRAND}">Base</span></span>
    </div>
    <div style="padding:24px">${bodyHtml}</div>
    <div style="padding:16px 24px;border-top:1px solid #eee;color:#8a8f86;font-size:12px">
      EazyBase Extensions Ltd &middot; Modular home extensions &middot; eazybase.co.uk
    </div>
  </div>
</div>`
}

type LeadDoc = {
  type?: string | null
  firstName?: string | null
  lastName?: string | null
  email?: string | null
  phone?: string | null
  postcode?: string | null
  addressLine1?: string | null
  town?: string | null
  message?: string | null
  estimator?: {
    extensionType?: string | null
    widthM?: number | null
    depthM?: number | null
    estimateLow?: number | null
    estimateHigh?: number | null
    surveyRequired?: boolean | null
    surveyFee?: number | null
    distanceMiles?: number | null
  } | null
}

const gbp = (n?: number | null) => (n != null ? `£${n.toLocaleString('en-GB')}` : '')
const fullName = (d: LeadDoc) => `${d.firstName ?? ''} ${d.lastName ?? ''}`.trim() || 'there'

/** Internal notification to the EazyBase team. */
export function teamLeadEmail(doc: LeadDoc): { subject: string; html: string; text: string } {
  const est = doc.estimator ?? {}
  const rows: [string, string][] = [
    ['Type', doc.type ?? 'full'],
    ['Name', fullName(doc)],
    ['Email', doc.email ?? '—'],
    ['Phone', doc.phone ?? '—'],
    ['Postcode', doc.postcode ?? '—'],
    ...(doc.addressLine1 ? ([['Address', `${doc.addressLine1}${doc.town ? `, ${doc.town}` : ''}`]] as [string, string][]) : []),
    ...(est.extensionType ? ([['Extension', est.extensionType]] as [string, string][]) : []),
    ...(est.widthM ? ([['Size', `${est.widthM}m × ${est.depthM}m`]] as [string, string][]) : []),
    ...(est.estimateLow ? ([['Estimate', `${gbp(est.estimateLow)}–${gbp(est.estimateHigh)}`]] as [string, string][]) : []),
    ...(est.surveyRequired
      ? ([['Survey fee', `${gbp(est.surveyFee)} (${est.distanceMiles ? `${Math.round(est.distanceMiles)} mi` : 'beyond radius'})`]] as [string, string][])
      : []),
  ]
  const table = rows
    .map(
      ([k, v]) =>
        `<tr><td style="padding:6px 10px;color:#8a8f86;font-size:13px;white-space:nowrap;vertical-align:top">${esc(k)}</td><td style="padding:6px 10px;font-size:14px;font-weight:600">${esc(v)}</td></tr>`,
    )
    .join('')
  const html = shell(
    `<p style="margin:0 0 4px;font-size:12px;letter-spacing:.08em;text-transform:uppercase;color:${BRAND};font-weight:700">New enquiry</p>
     <h1 style="margin:0 0 14px;font-size:20px">${esc(fullName(doc))} wants a quote</h1>
     <table style="border-collapse:collapse;width:100%;background:#fafbf7;border-radius:10px">${table}</table>
     ${doc.message ? `<p style="margin:16px 0 4px;color:#8a8f86;font-size:13px">Message</p><p style="margin:0;font-size:14px;line-height:1.5">${esc(doc.message)}</p>` : ''}
     <p style="margin:18px 0 0;font-size:13px;color:#8a8f86">Reply to this email to respond directly to ${esc(doc.email ?? 'the customer')}.</p>`,
  )
  const text = rows.map(([k, v]) => `${k}: ${v}`).join('\n') + (doc.message ? `\n\nMessage: ${doc.message}` : '')
  return { subject: `New ${doc.type ?? 'full'} enquiry — ${fullName(doc)}`, html, text }
}

/** Confirmation to the person who submitted the enquiry. */
export function customerConfirmEmail(doc: LeadDoc): { subject: string; html: string; text: string } {
  const est = doc.estimator ?? {}
  const estimateLine =
    est.estimateLow && est.estimateHigh
      ? `<div style="margin:16px 0;padding:14px 16px;background:#f7fbe8;border-radius:10px">
           <span style="font-size:12px;color:#6f8a14;text-transform:uppercase;letter-spacing:.06em;font-weight:700">Your indicative range</span><br>
           <span style="font-size:22px;font-weight:800;color:${INK}">${gbp(est.estimateLow)} – ${gbp(est.estimateHigh)}</span>
           <div style="font-size:12px;color:#8a8f86;margin-top:2px">Indicative, subject to a free survey.</div>
         </div>`
      : ''
  const html = shell(
    `<h1 style="margin:0 0 12px;font-size:20px">Thanks, ${esc(doc.firstName ?? 'there')} 👋</h1>
     <p style="margin:0 0 12px;font-size:15px;line-height:1.6">We've received your enquiry and a member of the EazyBase team will be in touch within <strong>1 working day</strong> to talk it through and arrange your free, no-obligation survey.</p>
     ${estimateLine}
     <p style="margin:12px 0 0;font-size:15px;line-height:1.6">In a hurry? Call us on <a href="tel:03302290775" style="color:${INK};font-weight:600">0330 229 0775</a> or reply to this email.</p>`,
  )
  const text = `Thanks, ${doc.firstName ?? 'there'}!\n\nWe've received your enquiry and will be in touch within 1 working day to arrange your free survey.${
    est.estimateLow ? `\n\nYour indicative range: ${gbp(est.estimateLow)}–${gbp(est.estimateHigh)} (subject to survey).` : ''
  }\n\nIn a hurry? Call 0330 229 0775 or reply to this email.\n\nEazyBase`
  return { subject: `Thanks ${doc.firstName ?? ''} — we've got your enquiry`.trim(), html, text }
}
