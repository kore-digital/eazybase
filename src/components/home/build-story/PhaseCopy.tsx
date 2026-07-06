/**
 * PhaseCopy — the copy block for one Build Story phase: angled PHASE N chip,
 * oversized Montserrat title, one short paragraph and the phase counter.
 * Purely presentational (server-safe) — BuildStory owns opacity/position.
 * Title/body come from the CMS processTimeline block and keep the same
 * data-eb-edit paths the old ProcessStrip used, so the visual editor binds.
 */

export type PhaseCopyProps = {
  index: number
  total: number
  title: string
  body?: string | null
  /** data-eb-edit paths (only set when the phase is CMS-backed) */
  editTitle?: string
  editBody?: string
}

export function PhaseCopy({ index, total, title, body, editTitle, editBody }: PhaseCopyProps) {
  const pad = (n: number) => String(n).padStart(2, '0')

  return (
    <div>
      <span className="inline-flex -skew-x-[18deg] items-center bg-brand-500 px-3.5 py-1.5 shadow-sm">
        {/* dark ink on brand-500 for AA contrast */}
        <span className="skew-x-[18deg] font-display text-xs font-bold tracking-[0.18em] text-ink-950 uppercase">
          Phase {index + 1}
        </span>
      </span>

      <h3 className="mt-5 font-display text-[clamp(2.5rem,7vw,5rem)] leading-[0.95] font-extrabold tracking-tight text-white uppercase">
        <span data-eb-edit={editTitle}>{title}</span>
      </h3>

      {body ? (
        <p className="mt-5 max-w-md text-base leading-relaxed text-ink-200 md:text-lg" data-eb-edit={editBody}>
          {body}
        </p>
      ) : null}

      <p className="mt-6 font-display text-sm font-semibold tracking-[0.25em] text-ink-400 tabular-nums">
        {pad(index + 1)} / {pad(total)}
      </p>
    </div>
  )
}

export default PhaseCopy
