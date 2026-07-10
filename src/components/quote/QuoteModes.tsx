'use client'

import { useState } from 'react'

import { InstantQuoteWizard } from '@/components/quote/InstantQuoteWizard'
import { QuoteAssistant } from '@/components/quote/assistant/QuoteAssistant'
import type { QuotePricing } from '@/components/quote/pricing'

/**
 * PREVIEW: the "merged" quote page — one page, two modes. A segmented toggle
 * swaps between the real Instant estimator and the real Eazy chat assistant,
 * both using the same live pricing model.
 */
export function QuoteModes({ pricing }: { pricing: QuotePricing }) {
  const [mode, setMode] = useState<'instant' | 'chat'>('instant')

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
