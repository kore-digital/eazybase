'use client'

import { useState } from 'react'

import { InstantQuoteWizard } from '@/components/quote/InstantQuoteWizard'
import { QuoteAssistant } from '@/components/quote/assistant/QuoteAssistant'
import type { QuotePricing } from '@/components/quote/pricing'

export type QuoteMode = 'instant' | 'chat'

/**
 * The quote page — one page, two modes. A segmented toggle swaps between the
 * Instant estimator and the Eazy chat assistant, both on the same live pricing
 * model. `initialMode` lets a link deep-link straight into a mode
 * (e.g. /get-a-quote?mode=chat).
 */
export function QuoteModes({ pricing, initialMode = 'instant' }: { pricing: QuotePricing; initialMode?: QuoteMode }) {
  const [mode, setMode] = useState<QuoteMode>(initialMode)

  return (
    <div>
      <div
        role="tablist"
        aria-label="Choose how to get your quote"
        className="mx-auto mb-8 flex max-w-md rounded-full bg-ink-100 p-1.5"
      >
        {(
          [
            { key: 'instant', label: '⚡ Instant estimate' },
            { key: 'chat', label: '💬 Chat to us' },
          ] as const
        ).map((m) => (
          <button
            key={m.key}
            type="button"
            role="tab"
            aria-selected={mode === m.key}
            onClick={() => setMode(m.key)}
            className={[
              'flex-1 rounded-full px-4 py-2.5 text-center font-display text-sm font-bold transition-colors',
              mode === m.key ? 'bg-white text-ink-900 shadow-sm' : 'text-ink-500 hover:text-ink-700',
            ].join(' ')}
          >
            {m.label}
          </button>
        ))}
      </div>

      {mode === 'instant' ? <InstantQuoteWizard pricing={pricing} /> : <QuoteAssistant pricing={pricing} />}
    </div>
  )
}
