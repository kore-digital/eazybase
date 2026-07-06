import { getSiteSettings } from '@/lib/data'
import { formatPhone, telHref, waHref } from '@/lib/format'
import { SITE } from '@/lib/site'

const WA_TEXT = "Hi EazyBase, I'd like to talk about a modular extension."

/**
 * Side column for /get-a-quote: why-EazyBase bullets, the award line, and
 * phone + WhatsApp contact cards for people who would rather talk.
 * Server component — no interactivity.
 */

const WHY_EAZYBASE = [
  `Factory-built in ${SITE.base.split(',')[0]} in as little as ${SITE.stats.factoryWeeks} weeks`,
  'Installed on-site in under a week',
  'One team from design to building-control sign-off',
  `Up to a ${SITE.stats.guaranteeYears}-year guarantee on roofing`,
  'Free survey and a no-obligation quotation',
]

export async function QuoteAside() {
  const settings = await getSiteSettings()
  const phone = settings?.phone?.trim() || SITE.phone
  const whatsappHref = settings?.whatsappNumber?.trim()
    ? waHref(settings.whatsappNumber, WA_TEXT)
    : SITE.whatsappHref

  return (
    <aside className="space-y-6" aria-label="Why choose EazyBase and other ways to get in touch">
      {/* Why EazyBase */}
      <div className="rounded-xl bg-ink-900 p-7 text-white">
        <h2 className="font-display text-lg font-semibold">Why homeowners choose EazyBase</h2>
        <ul className="mt-5 space-y-3.5">
          {WHY_EAZYBASE.map((point) => (
            <li key={point} className="flex items-start gap-3 text-sm leading-relaxed text-ink-200">
              <span
                aria-hidden="true"
                className="eb-block-accent mt-1.5 h-2 w-3.5 shrink-0"
              />
              {point}
            </li>
          ))}
        </ul>
        <p className="mt-6 border-t border-white/10 pt-5 text-xs leading-relaxed text-ink-300">
          <span className="font-semibold text-brand-400">{SITE.awardBody}</span> — {SITE.award}
        </p>
      </div>

      {/* Phone card */}
      <a
        href={telHref(phone)}
        className="group block rounded-xl border border-ink-100 bg-white p-6 transition-colors hover:border-brand-300"
      >
        <div className="flex items-center gap-4">
          <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg bg-brand-50 text-brand-600">
            <svg
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth={2}
              strokeLinecap="round"
              strokeLinejoin="round"
              className="h-5 w-5"
              aria-hidden="true"
            >
              <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72c.127.96.361 1.903.7 2.81a2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0 1 22 16.92z" />
            </svg>
          </span>
          <div>
            <p className="font-display text-sm font-semibold text-ink-900">
              Prefer to talk it through?
            </p>
            <p className="mt-0.5 font-display text-lg font-semibold text-brand-600 group-hover:text-brand-700">
              {formatPhone(phone)}
            </p>
            <p className="mt-0.5 text-xs text-ink-400">Seven days a week</p>
          </div>
        </div>
      </a>

      {/* WhatsApp card */}
      <a
        href={whatsappHref}
        target="_blank"
        rel="noopener noreferrer"
        className="group block rounded-xl border border-ink-100 bg-white p-6 transition-colors hover:border-brand-300"
      >
        <div className="flex items-center gap-4">
          <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg bg-brand-500 text-white">
            <svg viewBox="0 0 24 24" fill="currentColor" className="h-5 w-5" aria-hidden="true">
              <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.297-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 0 1-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 0 1-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 0 1 2.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0 0 12.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 0 0 5.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 0 0-3.48-8.413z" />
            </svg>
          </span>
          <div>
            <p className="font-display text-sm font-semibold text-ink-900">Message us on WhatsApp</p>
            <p className="mt-0.5 text-xs text-ink-400">
              Send photos of your space — we’ll reply with first thoughts
            </p>
          </div>
        </div>
      </a>
    </aside>
  )
}

export default QuoteAside
