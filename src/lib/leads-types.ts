/**
 * Client-safe lead types + labels. Kept free of any server imports (Payload,
 * PostHog, next/cache) so client components like the analytics LeadsManager can
 * import them without pulling server-only code into the browser bundle.
 */

export type LeadRow = {
  id: string | number
  firstName?: string
  lastName?: string
  email?: string
  phone?: string
  town?: string
  postcode?: string
  addressLine1?: string
  message?: string
  type?: string
  status?: string
  createdAt?: string
  lastContactedAt?: string | null
  nextFollowUpAt?: string | null
  internalNotes?: string | null
  estimateLow?: number | null
  estimateHigh?: number | null
}

export type LeadsBoard = {
  openLeads: LeadRow[]
  dueFollowUps: LeadRow[]
  recentClosed: LeadRow[]
  openCount: number
}

/** Full pipeline status labels + display order, shared by the workspace UI. */
export const STATUS_LABELS: Record<string, string> = {
  new: 'New',
  emailed_no_answer: 'Emailed — no answer',
  called_no_answer: 'Called — no answer',
  spoke: 'Spoke to customer',
  quote_sent: 'Quote sent',
  won: 'Won',
  lost: 'Lost',
  contacted: 'Contacted',
  closed: 'Closed',
}

/** Statuses that take a lead out of the active working list. */
export const CLOSED_STATUSES = new Set(['won', 'lost', 'closed'])
