'use client'

import { useState } from 'react'

/** Pill segmented control that toggles between the two (server-rendered) panels. */
export function Tabs({
  labels,
  children,
}: {
  labels: [string, string]
  children: [React.ReactNode, React.ReactNode]
}) {
  const [active, setActive] = useState(0)
  return (
    <>
      <div className="sticky top-[3.9rem] z-10 -mx-4 bg-ink-50/95 px-4 pb-2 pt-3 backdrop-blur">
        <div className="flex rounded-full bg-ink-200/70 p-1">
          {labels.map((label, i) => (
            <button
              key={label}
              type="button"
              onClick={() => setActive(i)}
              aria-pressed={active === i}
              className={[
                'flex-1 rounded-full px-3 py-2 text-center font-display text-[13px] font-semibold transition-colors',
                active === i ? 'bg-white text-ink-900 shadow-sm' : 'text-ink-500',
              ].join(' ')}
            >
              {label}
            </button>
          ))}
        </div>
      </div>
      <div className="mt-3">{children[active]}</div>
    </>
  )
}
