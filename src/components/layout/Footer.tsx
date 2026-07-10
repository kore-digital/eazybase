import Link from 'next/link'
import { AREAS, SITE } from '@/lib/site'
import { formatPhone, telHref, waHref } from '@/lib/format'
import type { Navigation, SiteSetting } from '@/payload-types'

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
]

type FooterProps = {
  /** Values from the site-settings global; SITE constants are the fallback. */
  phone?: string | null
  whatsappNumber?: string | null
  email?: string | null
  tagline?: string | null
  awardLine?: string | null
  socials?: SiteSetting['socials']
  /** Footer nav from the navigation global; QUICK_LINKS fallback. */
  navItems?: Navigation['footerNav']
}

export function Footer({ phone, whatsappNumber, email, tagline, awardLine, socials, navItems }: FooterProps = {}) {
  const year = new Date().getFullYear()
  const towns = AREAS.filter((a) => !a.hub)
  const hubs = AREAS.filter((a) => a.hub)

  const phoneNumber = phone?.trim() || SITE.phone
  const waNumber = whatsappNumber?.trim() || SITE.whatsappNumber
  const whatsappLink = whatsappNumber?.trim()
    ? waHref(whatsappNumber, "Hi EazyBase, I'd like to talk about a modular extension.")
    : SITE.whatsappHref
  const emailAddress = email?.trim() || SITE.email
  const taglineText = tagline?.trim() || SITE.tagline
  const quickLinks = navItems?.length ? navItems : QUICK_LINKS
  const socialLinks = [
    { label: 'Facebook', href: socials?.facebook || SITE.social.facebook },
    { label: 'Instagram', href: socials?.instagram || SITE.social.instagram },
    { label: 'TikTok', href: socials?.tiktok || SITE.social.tiktok },
    { label: 'Yell', href: socials?.yell || SITE.social.yell },
    { label: 'Google', href: socials?.google || SITE.social.google },
  ]

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
          <p data-eb-edit="site-settings:site-settings:tagline" className="mt-3 max-w-xs text-sm leading-relaxed">
            {taglineText}
          </p>
          <p className="mt-4 flex items-start gap-2 text-sm leading-snug">
            <span className="eb-block-accent mt-1 h-2 w-3.5 shrink-0" aria-hidden="true" />
            <span data-eb-edit="site-settings:site-settings:awardLine">
              {awardLine || `${SITE.awardBody} — ${SITE.award}`}
            </span>
          </p>
          <p className="mt-4 text-sm">Factory-built in {SITE.base}.</p>
        </div>

        {/* Quick links */}
        <nav aria-label="Footer" data-eb-edit-nav="footerNav">
          <h3 className="mb-4 font-display text-sm font-semibold tracking-[0.18em] text-white uppercase">
            Quick Links
          </h3>
          <ul className="space-y-1">
            {quickLinks.map((link) => (
              <li key={link.href}>
                <Link
                  href={link.href}
                  className="inline-block py-1 text-sm transition-colors hover:text-brand-400"
                >
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
          <ul className="grid grid-cols-2 gap-x-6 gap-y-1">
            {towns.map((area) => (
              <li key={area.slug}>
                <Link
                  href={`/areas/${area.slug}`}
                  className="inline-block py-1 text-sm transition-colors hover:text-brand-400"
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
                  className="inline-block py-1 font-semibold text-white transition-colors hover:text-brand-400"
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
                href={telHref(phoneNumber)}
                className="inline-block py-1 font-display text-lg font-semibold text-white transition-colors hover:text-brand-400"
              >
                {formatPhone(phoneNumber)}
              </a>
            </li>
            <li>
              <a
                href={whatsappLink}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-block py-1 transition-colors hover:text-brand-400"
              >
                WhatsApp {formatPhone(waNumber)}
              </a>
            </li>
            <li>
              <a
                href={`mailto:${emailAddress}`}
                className="inline-block py-1 transition-colors hover:text-brand-400"
              >
                <span data-eb-edit="site-settings:site-settings:email">{emailAddress}</span>
              </a>
            </li>
          </ul>
          <ul className="mt-5 flex flex-wrap gap-x-4 gap-y-1">
            {socialLinks.map((s) => (
              <li key={s.label}>
                <a
                  href={s.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-block py-1 text-sm font-semibold text-ink-200 transition-colors hover:text-brand-400"
                >
                  {s.label}
                </a>
              </li>
            ))}
          </ul>
        </div>
      </div>

      {/* Bottom bar — extra mobile padding clears the StickyMobileCTA bar */}
      <div className="border-t border-ink-800 bg-ink-950">
        <div className="eb-container pt-5 pb-[calc(1.25rem_+_3.5rem_+_env(safe-area-inset-bottom))] text-center text-xs text-ink-400 md:pb-5">
          <p>
            © {year} {SITE.legalName}. All rights reserved.
          </p>
        </div>
      </div>
    </footer>
  )
}

export default Footer
