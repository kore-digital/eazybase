'use client'

import { useMemo, useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'

import { STATUS_LABELS, type LeadRow, type LeadsBoard } from '@/lib/leads-types'

import { chaseInDays, clearFollowUp, saveLeadNote, setLeadStatus } from './lead-actions'

const TYPE_LABELS: Record<string, string> = {
  full: 'Full quote',
  instant: 'Instant quote',
  assistant: 'Quote assistant',
}

// Status → pill colour.
const STATUS_TONE: Record<string, string> = {
  new: 'bg-orange-100 text-orange-700',
  emailed_no_answer: 'bg-amber-100 text-amber-800',
  called_no_answer: 'bg-amber-100 text-amber-800',
  spoke: 'bg-blue-100 text-blue-700',
  quote_sent: 'bg-violet-100 text-violet-700',
  won: 'bg-brand-100 text-brand-800',
  lost: 'bg-ink-100 text-ink-500',
  contacted: 'bg-blue-100 text-blue-700',
  closed: 'bg-ink-100 text-ink-500',
}

// The buttons offered in the lead detail, in pipeline order.
const PIPELINE = ['new', 'emailed_no_answer', 'called_no_answer', 'spoke', 'quote_sent', 'won', 'lost'] as const

const FILTERS: { key: string; label: string; match: (s: string) => boolean }[] = [
  { key: 'open', label: 'All open', match: (s) => !['won', 'lost', 'closed'].includes(s) },
  { key: 'new', label: 'New', match: (s) => s === 'new' },
  { key: 'noanswer', label: 'No answer', match: (s) => s === 'emailed_no_answer' || s === 'called_no_answer' },
  { key: 'quote_sent', label: 'Quote sent', match: (s) => s === 'quote_sent' },
  { key: 'won', label: 'Won', match: (s) => s === 'won' },
  { key: 'lost', label: 'Lost', match: (s) => s === 'lost' },
]

const fullName = (l: LeadRow) => `${l.firstName ?? ''} ${l.lastName ?? ''}`.trim() || l.email || 'Enquiry'
const initial = (l: LeadRow) => (l.firstName ?? l.email ?? '?').slice(0, 1).toUpperCase()
const gbp = (n?: number | null) => (n != null ? `£${n.toLocaleString('en-GB')}` : '')

function waLink(phone?: string): string | null {
  if (!phone) return null
  let d = phone.replace(/[^\d]/g, '')
  if (d.startsWith('0')) d = '44' + d.slice(1)
  else if (!d.startsWith('44') && d.length <= 10) d = '44' + d
  return `https://wa.me/${d}`
}

function fmtDate(s?: string | null): string {
  if (!s) return ''
  const d = new Date(s)
  return d.toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })
}

function dueLabel(s?: string | null, now = Date.now()): { text: string; overdue: boolean } | null {
  if (!s) return null
  const t = new Date(s).getTime()
  const days = Math.round((t - now) / 86400000)
  if (t <= now) return { text: days <= -1 ? `${Math.abs(days)}d overdue` : 'Due today', overdue: true }
  return { text: `Chase in ${days}d`, overdue: false }
}

export function LeadsManager({ board, newSince }: { board: LeadsBoard; newSince: number }) {
  const router = useRouter()
  const [pending, startTransition] = useTransition()
  const [filter, setFilter] = useState('open')
  const [openId, setOpenId] = useState<string | number | null>(null)

  const allLeads = useMemo(() => {
    const map = new Map<string | number, LeadRow>()
    for (const l of [...board.openLeads, ...board.recentClosed]) map.set(l.id, l)
    return [...map.values()]
  }, [board])

  const active = FILTERS.find((f) => f.key === filter) ?? FILTERS[0]
  const shown = (filter === 'open' ? board.openLeads : allLeads.filter((l) => active.match(l.status ?? 'new')))

  function run(fn: () => Promise<{ ok: boolean }>) {
    startTransition(async () => {
      await fn()
      router.refresh()
    })
  }

  return (
    <div className={pending ? 'pointer-events-none opacity-70 transition-opacity' : 'transition-opacity'}>
      {/* New-since-last-visit badge */}
      {newSince > 0 && (
        <div className="mb-3 flex items-center gap-2 rounded-2xl bg-brand-500 px-4 py-3 text-ink-950">
          <span className="text-lg">🟢</span>
          <span className="font-display text-[13px] font-bold">
            {newSince} new {newSince === 1 ? 'lead' : 'leads'} since your last visit
          </span>
        </div>
      )}

      {/* Follow-ups due */}
      {board.dueFollowUps.length > 0 && (
        <section className="mb-3 rounded-2xl border border-red-200 bg-red-50 p-4">
          <div className="mb-2 flex items-center gap-2">
            <span>⏰</span>
            <h2 className="font-display text-sm font-bold text-red-700">
              Follow-ups due ({board.dueFollowUps.length})
            </h2>
          </div>
          <ul className="space-y-2">
            {board.dueFollowUps.map((l) => (
              <li key={String(l.id)} className="flex items-center justify-between gap-2">
                <button
                  type="button"
                  onClick={() => setOpenId(l.id)}
                  className="min-w-0 flex-1 text-left"
                >
                  <span className="block truncate text-[13px] font-semibold text-ink-900">{fullName(l)}</span>
                  <span className="block truncate text-[11px] text-red-600">
                    {dueLabel(l.nextFollowUpAt)?.text} · {STATUS_LABELS[l.status ?? 'new']}
                  </span>
                </button>
                <button
                  type="button"
                  onClick={() => run(() => clearFollowUp(l.id))}
                  className="shrink-0 rounded-full bg-white px-3 py-1.5 text-[11px] font-semibold text-red-700 shadow-sm"
                >
                  Done
                </button>
              </li>
            ))}
          </ul>
        </section>
      )}

      {/* Filter chips */}
      <div className="-mx-1 flex gap-1.5 overflow-x-auto px-1 pb-1">
        {FILTERS.map((f) => (
          <button
            key={f.key}
            type="button"
            onClick={() => setFilter(f.key)}
            className={[
              'shrink-0 rounded-full px-3 py-1.5 font-display text-[12px] font-semibold transition-colors',
              filter === f.key ? 'bg-ink-900 text-white' : 'bg-ink-100 text-ink-500',
            ].join(' ')}
          >
            {f.label}
          </button>
        ))}
      </div>

      {/* Lead list */}
      <div className="mt-2 space-y-2">
        {shown.length === 0 ? (
          <p className="py-8 text-center text-[13px] text-ink-400">No leads here.</p>
        ) : (
          shown.map((l) => (
            <LeadCard
              key={String(l.id)}
              lead={l}
              open={openId === l.id}
              onToggle={() => setOpenId(openId === l.id ? null : l.id)}
              run={run}
            />
          ))
        )}
      </div>
    </div>
  )
}

function LeadCard({
  lead,
  open,
  onToggle,
  run,
}: {
  lead: LeadRow
  open: boolean
  onToggle: () => void
  run: (fn: () => Promise<{ ok: boolean }>) => void
}) {
  const [note, setNote] = useState(lead.internalNotes ?? '')
  const wa = waLink(lead.phone)
  const due = dueLabel(lead.nextFollowUpAt)

  return (
    <div className="overflow-hidden rounded-2xl border border-ink-100 bg-white">
      <button type="button" onClick={onToggle} className="flex w-full items-center gap-3 p-3 text-left">
        <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-brand-100 text-[12px] font-bold text-brand-800">
          {initial(lead)}
        </span>
        <span className="min-w-0 flex-1">
          <span className="block truncate text-[13px] font-semibold text-ink-900">{fullName(lead)}</span>
          <span className="block truncate text-[11px] text-ink-400">
            {lead.town ? `${lead.town} · ` : ''}
            {TYPE_LABELS[lead.type ?? ''] ?? 'Quote'}
            {lead.estimateLow ? ` · ${gbp(lead.estimateLow)}–${gbp(lead.estimateHigh)}` : ''}
          </span>
        </span>
        <span className="flex shrink-0 flex-col items-end gap-1">
          <span className={`rounded-full px-2 py-0.5 text-[10px] font-semibold ${STATUS_TONE[lead.status ?? 'new'] ?? 'bg-ink-100 text-ink-500'}`}>
            {STATUS_LABELS[lead.status ?? 'new']}
          </span>
          {due && (
            <span className={`text-[10px] font-semibold ${due.overdue ? 'text-red-600' : 'text-ink-400'}`}>{due.text}</span>
          )}
        </span>
      </button>

      {open && (
        <div className="border-t border-ink-100 p-3">
          {/* Contact actions */}
          <div className="grid grid-cols-3 gap-2">
            {lead.phone && (
              <a href={`tel:${lead.phone}`} className="flex flex-col items-center gap-1 rounded-xl bg-ink-50 py-2.5 text-[11px] font-semibold text-ink-700">
                <span className="text-base">📞</span>Call
              </a>
            )}
            {lead.email && (
              <a href={`mailto:${lead.email}`} className="flex flex-col items-center gap-1 rounded-xl bg-ink-50 py-2.5 text-[11px] font-semibold text-ink-700">
                <span className="text-base">✉️</span>Email
              </a>
            )}
            {wa && (
              <a href={wa} target="_blank" rel="noreferrer" className="flex flex-col items-center gap-1 rounded-xl bg-ink-50 py-2.5 text-[11px] font-semibold text-ink-700">
                <span className="text-base">💬</span>WhatsApp
              </a>
            )}
          </div>

          {/* Detail rows */}
          <dl className="mt-3 space-y-1 text-[12px]">
            {lead.phone && <Row k="Phone" v={lead.phone} />}
            {lead.email && <Row k="Email" v={lead.email} />}
            {(lead.postcode || lead.addressLine1) && (
              <Row k="Address" v={[lead.addressLine1, lead.town, lead.postcode].filter(Boolean).join(', ')} />
            )}
            {lead.estimateLow != null && <Row k="Estimate" v={`${gbp(lead.estimateLow)}–${gbp(lead.estimateHigh)}`} />}
            <Row k="Enquired" v={fmtDate(lead.createdAt)} />
            {lead.lastContactedAt && <Row k="Last contacted" v={fmtDate(lead.lastContactedAt)} />}
            {lead.nextFollowUpAt && <Row k="Chase due" v={fmtDate(lead.nextFollowUpAt)} />}
          </dl>

          {lead.message && (
            <p className="mt-2 rounded-xl bg-ink-50 p-2.5 text-[12px] leading-relaxed text-ink-700">{lead.message}</p>
          )}

          {/* Status pipeline */}
          <p className="mt-3 mb-1.5 text-[11px] font-semibold uppercase tracking-wide text-ink-400">Update status</p>
          <div className="flex flex-wrap gap-1.5">
            {PIPELINE.map((s) => (
              <button
                key={s}
                type="button"
                onClick={() => run(() => setLeadStatus(lead.id, s))}
                className={[
                  'rounded-full px-2.5 py-1.5 text-[11px] font-semibold transition-colors',
                  lead.status === s ? 'bg-ink-900 text-white' : 'bg-ink-100 text-ink-600',
                ].join(' ')}
              >
                {STATUS_LABELS[s]}
              </button>
            ))}
          </div>

          {/* Chase */}
          <div className="mt-3 flex gap-2">
            <button
              type="button"
              onClick={() => run(() => chaseInDays(lead.id, 7))}
              className="flex-1 rounded-xl bg-ink-50 py-2.5 text-[12px] font-semibold text-ink-700"
            >
              ⏰ Chase in 7 days
            </button>
            {lead.nextFollowUpAt && (
              <button
                type="button"
                onClick={() => run(() => clearFollowUp(lead.id))}
                className="rounded-xl bg-ink-50 px-3 py-2.5 text-[12px] font-semibold text-ink-500"
              >
                Clear
              </button>
            )}
          </div>

          {/* Notes */}
          <p className="mt-3 mb-1.5 text-[11px] font-semibold uppercase tracking-wide text-ink-400">Notes</p>
          <textarea
            value={note}
            onChange={(e) => setNote(e.target.value)}
            rows={2}
            placeholder="Private staff notes…"
            className="w-full rounded-xl border border-ink-100 bg-ink-50 p-2.5 text-[12px] text-ink-800 outline-none focus:border-ink-300"
          />
          {note !== (lead.internalNotes ?? '') && (
            <button
              type="button"
              onClick={() => run(() => saveLeadNote(lead.id, note))}
              className="mt-1.5 rounded-xl bg-brand-500 px-3 py-2 text-[12px] font-bold text-ink-950"
            >
              Save note
            </button>
          )}
        </div>
      )}
    </div>
  )
}

function Row({ k, v }: { k: string; v: string }) {
  return (
    <div className="flex justify-between gap-3">
      <dt className="shrink-0 text-ink-400">{k}</dt>
      <dd className="min-w-0 truncate text-right font-medium text-ink-800">{v}</dd>
    </div>
  )
}
