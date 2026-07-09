import React from 'react'
import { cookies } from 'next/headers'

import { SEEN_COOKIE, isUnlocked } from '@/lib/analytics-auth'
import { getAnalyticsData, getLeadsBoard } from '@/lib/analytics-data'
import { labelFromParams, rangeFromParams, type RangeParams } from '@/lib/analytics-range'

import { AppHeader } from './AppHeader'
import { DateRangeBar } from './DateRangeBar'
import { LeadsPanel } from './LeadsPanel'
import { PinGate } from './PinGate'
import { SeenTracker } from './SeenTracker'
import { Tabs } from './Tabs'
import { TrafficPanel } from './TrafficPanel'

/**
 * EazyBase Analytics — the installable phone app. PIN-gated (separate from the
 * admin login); once unlocked it shows two tabs — Website traffic and
 * Leads & enquiries — from the same data as the admin dashboard.
 */
export const dynamic = 'force-dynamic'

export default async function AnalyticsPage({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>
}) {
  if (!(await isUnlocked())) return <PinGate />

  const sp = await searchParams
  const one = (v: string | string[] | undefined) => (Array.isArray(v) ? v[0] : v)
  const params: RangeParams = { days: one(sp.days), from: one(sp.from), to: one(sp.to) }
  const range = rangeFromParams(params)
  const [data, board] = await Promise.all([getAnalyticsData(range), getLeadsBoard()])

  // "New since last visit" — count open leads created after the last-seen stamp.
  const store = await cookies()
  const lastSeen = Number(store.get(SEEN_COOKIE)?.value ?? 0)
  const newSince = lastSeen
    ? board.openLeads.filter((l) => l.createdAt && new Date(l.createdAt).getTime() > lastSeen).length
    : 0

  return (
    <div className="mx-auto min-h-[100dvh] max-w-md bg-ink-50">
      <AppHeader />
      <DateRangeBar params={params} label={labelFromParams(params)} />
      <div className="px-4 pb-16" style={{ paddingBottom: 'calc(env(safe-area-inset-bottom) + 3rem)' }}>
        <Tabs labels={['Website traffic', 'Leads & enquiries']}>
          <TrafficPanel data={data.traffic} />
          <LeadsPanel data={data.leads} board={board} newSince={newSince} />
        </Tabs>
      </div>
      <SeenTracker />
    </div>
  )
}
