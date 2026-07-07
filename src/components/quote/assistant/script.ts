import { SITE } from '@/lib/site'

/**
 * Inline FAQ for the Quote Assistant. Tapping a chip drops a short answer into
 * the conversation without losing the current step — the active question's
 * input stays put. Answers are warm, UK English, and never invent numbers
 * beyond SITE.stats.
 */
export type AssistantFaq = { q: string; a: string }

export const FAQ_CHIPS: AssistantFaq[] = [
  {
    q: 'How long does it take?',
    a: `Your extension is built in our ${SITE.base.split(',')[0]} factory in as little as ${SITE.stats.factoryWeeks} weeks, then installed on-site in under a week — so there's only a few days of disruption at your home.`,
  },
  {
    q: 'Do I need planning permission?',
    a: 'Often not — many single-storey rear extensions fall under permitted development. It depends on your property and any local designations, so we check and guide you through whichever route applies. You never have to work it out alone.',
  },
  {
    q: 'Is it a fixed price?',
    a: 'Yes. The estimate here is indicative, but once our surveyor has visited we give you a written, fixed-price quote — no surprises later.',
  },
  {
    q: 'What guarantee do I get?',
    a: `Every build is structurally guaranteed, with up to a ${SITE.stats.guaranteeYears}-year structural guarantee. We're an award-winning nationwide modular builder.`,
  },
  {
    q: 'Do you offer finance?',
    a: 'We do — finance options are available to spread the cost. Just mention it to the team and they’ll talk you through what suits you.',
  },
]

/** Greeting shown as the first bot message. */
export const GREETING =
  "Hi, I'm Eazy 👋 Let's put together your extension quote in about 60 seconds. First up — what are you looking to build?"
