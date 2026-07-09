import config from '@payload-config'
import { getPayload } from 'payload'
import { NextResponse } from 'next/server'

import { countDueFollowUps } from '@/lib/analytics-data'
import { sendDueChasePush } from '@/lib/push'

/**
 * Daily follow-up check (Vercel Cron, see vercel.json). Counts leads whose
 * chase is due today and pushes a single reminder to the analytics app.
 * Mounted at /cron/... (not /api/...) to sit outside Payload's REST catch-all.
 * Protected by CRON_SECRET — Vercel Cron sends it as a Bearer token.
 */
export const dynamic = 'force-dynamic'

export async function GET(req: Request) {
  const secret = process.env.CRON_SECRET
  if (secret) {
    const auth = req.headers.get('authorization')
    if (auth !== `Bearer ${secret}`) {
      return NextResponse.json({ error: 'unauthorized' }, { status: 401 })
    }
  }

  const payload = await getPayload({ config })
  const due = await countDueFollowUps(new Date())
  if (due > 0) {
    await sendDueChasePush(payload, due)
  }
  return NextResponse.json({ ok: true, due })
}
