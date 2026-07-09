import { NextResponse } from 'next/server'

import { FROM_CUSTOMER, FROM_TEAM } from '../../../../lib/email'

/**
 * TEMPORARY diagnostic — reports whether the Resend key is present in the
 * deployed env and does a live test send, WITHOUT ever exposing the key.
 * Guarded by ?token=eazybase-diag. Delete after email is confirmed working.
 */
export async function GET(req: Request) {
  const url = new URL(req.url)
  if (url.searchParams.get('token') !== 'eazybase-diag') {
    return NextResponse.json({ error: 'forbidden' }, { status: 403 })
  }

  const key = process.env.RESEND_API_KEY
  const to = url.searchParams.get('to') || 'kothdiwalanaeem@gmail.com'
  const from = url.searchParams.get('from') === 'customer' ? FROM_CUSTOMER : FROM_TEAM

  const info = {
    hasKey: Boolean(key),
    keyPrefix: key ? key.slice(0, 3) : null,
    keyLen: key ? key.length : 0,
    leadNotifyEmail: process.env.LEAD_NOTIFY_EMAIL || '(default) info@eazybase.co.uk',
    from,
    to,
  }

  if (!key) return NextResponse.json({ ...info, sent: false, reason: 'RESEND_API_KEY missing in this deployment' })

  try {
    const res = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: { Authorization: `Bearer ${key}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        from,
        to: [to],
        subject: 'EazyBase email diagnostic',
        text: 'If you can read this, Resend delivery is working from the deployed environment.',
        html: '<p>If you can read this, <strong>Resend delivery is working</strong> from the deployed environment.</p>',
      }),
    })
    const bodyText = await res.text()
    let body: unknown = bodyText
    try {
      body = JSON.parse(bodyText)
    } catch {
      /* keep as text */
    }
    return NextResponse.json({ ...info, sent: res.ok, status: res.status, resend: body })
  } catch (err) {
    return NextResponse.json({ ...info, sent: false, error: String(err) })
  }
}
