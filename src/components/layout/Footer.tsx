import Link from 'next/link'
import { AREAS, SITE } from '@/lib/site'
import { formatPhone, telHref } from '@/lib/format'

/*
 * Dark ink footer. Uses a text logotype rather than /logo.png (the mark's
 * grey "Eazy" text vanishes on dark). TODO(asset): once /logo-white.png is
 * exported, swap the logotype for the white image variant.
 */

const QUICK_LINKS = [
  { label: 'Home', href: '/' },
  { label: 'About Us', href: '/about-us' },
  { label: 'What We Do', href: '/what-we-do' },
  { label: 'Gallery', href: '/gallery' },
  { label: 'FAQ', href: '/faq' },
  { label: 'Social', href: '/social' },
  { label: 'Get A Quote', href: '/get-a-quote' },
  { label: 'Instant Quote', href: '/instant-quote' },
]

const SOCIALS = [
  { label: 'Facebook', href: SITE.social.facebook },
  { label: 'Instagram', href: SITE.social.instagram },
  { label: 'Yell', href: SITE.social.yell },
  { label: 'Google', href: SITE.social.google },
]

export function Footer() {
  const year = new Date().getFullYear()
  const towns = AREAS.filter((a) => !a.hub)
  const hubs = AREAS.filter((a) => a.hub)

  return (
    <footer className="bg-ink-900 text-ink-300">
      {/* Green block-accent divider — angled modules from the logo */}
      <div aria-hidden="true" className="flex gap-1.5 overflow-hidden bg-ink-950 py-0">
        <div className="flex h-1.5 w-full">
          <span className="h-full w-1/3 -skew-x-[18deg] bg-brand-500" />
          <span className="ml-1.5 h-full w-1/4 -skew-x-[18deg] bg-brand-600" />
          <span className="ml-1.5 h-full flex-1 -skew-x-[18deg] bg-brand-700" />
        </div>
      </div>

      <div className="eb-container grid gap-10 py-14 sm:grid-cols-2 lg:grid-cols-[1.3fr_0.8fr_1.2fr_1fr]">
        {/* Brand */}
        <div>
          <p className="font-display text-2xl font-bold text-white">
            Eazy<span className="text-brand-500">Base</span>
          </p>
          <p className="mt-3 max-w-xs text-sm leading-relaxed">{SITE.tagline}</p>
          <p className="mt-4 flex items-start gap-2 text-sm leading-snug">
            <span className="eb-block-accent mt-1 h-2 w-3.5 shrink-0" aria-hidden="true" />
            <span>
              <span className="font-semibold text-white">{SITE.awardBody}</span> — {SITE.award}
            </span>
          </p>
          <p className="mt-4 text-sm">Factory-built in {SITE.base}.</p>
        </div>

        {/* Quick links */}
        <nav aria-label="Footer">
          <h3 className="mb-4 font-display text-sm font-semibold tracking-[0.18em] text-white uppercase">
            Quick Links
          </h3>
          <ul className="space-y-2">
            {QUICK_LINKS.map((link) => (
              <li key={link.href}>
                <Link href={link.href} className="text-sm transition-colors hover:text-brand-400">
                  {link.label}
                </Link>
              </li>
            ))}
          </ul>
        </nav>

        {/* Areas — two columns of towns */}
        <nav aria-label="Areas we cover">
          <h3 className="mb-4 font-display text-sm font-semibold tracking-[0.18em] text-white uppercase">
            Areas We Cover
          </h3>
          <ul className="grid grid-cols-2 gap-x-6 gap-y-2">
            {towns.map((area) => (
              <li key={area.slug}>
                <Link
                  href={`/areas/${area.slug}`}
                  className="text-sm transition-colors hover:text-brand-400"
                >
                  {area.name}
                </Link>
              </li>
            ))}
          </ul>
          <p className="mt-3 text-sm">
            {hubs.map((hub, i) => (
              <span key={hub.slug}>
                {i > 0 ? ' · ' : ''}
                <Link
                  href={`/areas/${hub.slug}`}
                  className="font-semibold text-white transition-colors hover:text-brand-400"
                >
                  {hub.name}
                </Link>
              </span>
            ))}
          </p>
        </nav>

        {/* Contact */}
        <div>
          <h3 className="mb-4 font-display text-sm font-semibold tracking-[0.18em] text-white uppercase">
            Contact
          </h3>
          <ul className="space-y-3 text-sm">
            <li>
              <a
                href={telHref(SITE.phone)}
                className="font-display text-lg font-semibold text-white transition-colors hover:text-brand-400"
              >
                {formatPhone(SITE.phone)}
              </a>
            </li>
            <li>
              <a href={SITE.whatsappHref} target="_blank" rel="noopener noreferrer" className="transition-colors hover:text-brand-400">
                WhatsApp {formatPhone(SITE.whatsappNumber)}
              </a>
            </li>
            <li>
              <a href={`mailto:${SITE.email}`} className="transition-colors hover:text-brand-400">
                {SITE.email}
              </a>
            </li>
          </ul>
          <ul className="mt-5 flex flex-wrap gap-x-4 gap-y-2">
            {SOCIALS.map((s) => (
              <li key={s.label}>
                <a
                  href={s.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-sm font-semibold text-ink-200 transition-colors hover:text-brand-400"
                >
                  {s.label}
                </a>
              </li>
            ))}
          </ul>
        </div>
      </div>

      {/* Bottom bar */}
      <div className="border-t border-ink-800 bg-ink-950">
        <div className="eb-container flex flex-col items-center justify-between gap-2 py-5 text-xs text-ink-400 sm:flex-row">
          <p>
            © {year} {SITE.legalName}. All rights reserved.
          </p>
          <p>
            Website by{' '}
            <a href="#" className="text-ink-300 transition-colors hover:text-brand-400">
              {/* TODO: credit + link */}
              —
            </a>
          </p>
        </div>
      </div>
    </footer>
  )
}

export default Footer
