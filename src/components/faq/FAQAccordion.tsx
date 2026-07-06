'use client'

import { AnimatePresence, motion, useReducedMotion } from 'motion/react'
import { useId, useState } from 'react'

export type FAQAccordionItem = {
  id: string | number
  question: string
  answer: string
  /** Optional data-eb-edit value for the question text node (e.g. "faqs:3:question"). */
  questionEdit?: string
  /** Optional data-eb-edit value for the answer text node (e.g. "faqs:3:answer"). */
  answerEdit?: string
}

type FAQAccordionProps = {
  items: FAQAccordionItem[]
  /** Close the previously open item when a new one opens. Defaults to true. */
  singleOpen?: boolean
  /** Heading level for each question — h3 under a section H2 (default), h2 directly under a page H1. */
  headingLevel?: 'h2' | 'h3'
  /** Open one item on first render. */
  defaultOpenId?: string | number
  className?: string
}

/**
 * Accessible FAQ accordion with smooth height animation (Motion) and a
 * rotating chevron. Reusable: the site FAQ page feeds it CMS FAQs (with
 * data-eb-edit paths), area pages feed it their localised { q, a } arrays.
 */
export function FAQAccordion({
  items,
  singleOpen = true,
  headingLevel = 'h3',
  defaultOpenId,
  className = '',
}: FAQAccordionProps) {
  const [openIds, setOpenIds] = useState<(string | number)[]>(
    defaultOpenId === undefined ? [] : [defaultOpenId],
  )
  const reducedMotion = useReducedMotion()
  const baseId = useId()
  const Heading = headingLevel

  const toggle = (id: string | number) =>
    setOpenIds((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : singleOpen ? [id] : [...prev, id],
    )

  return (
    <div
      className={[
        'divide-y divide-ink-100 overflow-hidden rounded-lg border border-ink-100 bg-white shadow-sm',
        className,
      ].join(' ')}
    >
      {items.map((item) => {
        const open = openIds.includes(item.id)
        const buttonId = `${baseId}-q-${item.id}`
        const panelId = `${baseId}-a-${item.id}`

        return (
          <div key={item.id}>
            <Heading className="m-0">
              <button
                type="button"
                id={buttonId}
                aria-expanded={open}
                aria-controls={panelId}
                onClick={() => toggle(item.id)}
                className="flex w-full items-center justify-between gap-4 px-5 py-5 text-left font-display text-base font-semibold text-ink-900 transition-colors duration-200 hover:text-brand-600 sm:px-6 sm:text-lg"
              >
                <span data-eb-edit={item.questionEdit}>{item.question}</span>
                <motion.svg
                  viewBox="0 0 20 20"
                  className="h-5 w-5 shrink-0 text-brand-500"
                  aria-hidden="true"
                  animate={{ rotate: open ? 180 : 0 }}
                  transition={
                    reducedMotion ? { duration: 0 } : { duration: 0.3, ease: [0.16, 1, 0.3, 1] }
                  }
                >
                  <path
                    d="M4.5 7.5 10 13l5.5-5.5"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth={2}
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </motion.svg>
              </button>
            </Heading>

            <AnimatePresence initial={false}>
              {open ? (
                <motion.div
                  key="panel"
                  id={panelId}
                  role="region"
                  aria-labelledby={buttonId}
                  initial={reducedMotion ? false : { height: 0, opacity: 0 }}
                  animate={{ height: 'auto', opacity: 1 }}
                  exit={reducedMotion ? { opacity: 1 } : { height: 0, opacity: 0 }}
                  transition={
                    reducedMotion ? { duration: 0 } : { duration: 0.35, ease: [0.16, 1, 0.3, 1] }
                  }
                  className="overflow-hidden"
                >
                  <p
                    data-eb-edit={item.answerEdit}
                    className="px-5 pb-6 text-[15px] leading-relaxed text-ink-600 sm:px-6 sm:text-base"
                  >
                    {item.answer}
                  </p>
                </motion.div>
              ) : null}
            </AnimatePresence>
          </div>
        )
      })}
    </div>
  )
}

export default FAQAccordion
