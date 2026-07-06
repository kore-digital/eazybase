'use client'

import Image from 'next/image'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { AnimatePresence, motion, useReducedMotion } from 'motion/react'
import { useEffect, useRef, useState } from 'react'
import { AREAS, SITE } from '@/lib/site'
import { formatPhone, telHref } from '@/lib/format'
import { QuoteCTA } from '@/components/ui/QuoteCTA'
import type { Navigation } from '@/payload-types'

/*
 * Logo: /logo.png (green + grey mark on transparent — works on white).
 * TODO(asset): export a white-text variant to /logo-white.png for use on
 * dark/ink surfaces (footer, dark hero overlays).
 */

type NavItem = { label: string; href: string; hasAreas?: boolean }

const NAV: NavItem[] = [
  { label: 'Home', href: '/' },
  { label: 'About Us', href: '/about-us' },
  { label: 'What We Do', href: '/what-we-do' },
  { label: 'Gallery', href: '/gallery' },
  { label: 'FAQ', href: '/faq' },
  { label: 'Areas', href: '/areas', hasAreas: true },
  { label: 'Social', href: '/social' },
]

const NORTH_WEST = AREAS.filter((a) => a.region === 'north-west')
const LONDON = AREAS.filter((a) => a.region === 'london')

function PhoneIcon({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden="true"
    >
      <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72c.127.96.361 1.903.7 2.81a2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0 1 22 16.92z" />
    </svg>
  )
}

type HeaderProps = {
  /** Display-format phone from the site-settings global; SITE.phone fallback. */
  phone?: string | null
  /** Main nav items from the navigation global; hardcoded NAV fallback. */
  navItems?: Navigation['mainNav']
}

export function Header({ phone, navItems }: HeaderProps = {}) {
  const pathname = usePathname()
  const reducedMotion = useReducedMotion()

  const [hovered, setHovered] = useState<string | null>(null)
  const [areasOpen, setAreasOpen] = useState(false) // desktop dropdown
  const [mobileOpen, setMobileOpen] = useState(false)
  const [mobileAreasOpen, setMobileAreasOpen] = useState(false)

  const hamburgerRef = useRef<HTMLButtonElement>(null)
  const mobileMenuRef = useRef<HTMLDivElement>(null)
  const areasTriggerRef = useRef<HTMLAnchorElement>(null)

  // CMS-driven nav with the hardcoded NAV as fallback; the /areas item keeps
  // its mega-dropdown regardless of source.
  const nav: NavItem[] = navItems?.length
    ? navItems.map((item) => ({ label: item.label, href: item.href, hasAreas: item.href === '/areas' }))
    : NAV
  const phoneNumber = phone?.trim() || SITE.phone

  // Close the mobile menu on route change; lock body scroll while open.
  useEffect(() => {
    setMobileOpen(false)
    setAreasOpen(false)
  }, [pathname])

  useEffect(() => {
    document.body.style.overflow = mobileOpen ? 'hidden' : ''
    return () => {
      document.body.style.overflow = ''
    }
  }, [mobileOpen])

  // Mobile menu: Escape closes (returning focus to the hamburger) and Tab is
  // trapped within hamburger + menu while open.
  useEffect(() => {
    if (!mobileOpen) return

    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setMobileOpen(false)
        hamburgerRef.current?.focus()
        return
      }
      if (e.key !== 'Tab') return
      const menu = mobileMenuRef.current
      if (!menu) return

      const focusables = [
        hamburgerRef.current,
        ...Array.from(menu.querySelectorAll<HTMLElement>('a[href], button:not([disabled])')),
      ].filter((el): el is HTMLElement => Boolean(el))
      if (focusables.length === 0) return

      const first = focusables[0]
      const last = focusables[focusables.length - 1]
      const active = document.activeElement as HTMLElement | null
      const index = active ? focusables.indexOf(active) : -1

      if (e.shiftKey) {
        if (index <= 0) {
          e.preventDefault()
          last.focus()
        }
      } else if (index === -1 || index === focusables.length - 1) {
        e.preventDefault()
        first.focus()
      }
    }

    document.addEventListener('keydown', onKeyDown)
    return () => document.removeEventListener('keydown', onKeyDown)
  }, [mobileOpen])

  return (
    <header className="sticky top-0 z-50 border-b border-ink-100 bg-white/85 backdrop-blur-md">
      <div className="eb-container flex h-18 items-center justify-between gap-6">
        {/* Logo */}
        <Link href="/" className="flex shrink-0 items-center" aria-label="EazyBase — home">
          <Image
            src="/logo.png"
            alt="EazyBase Modular Home Extensions"
            width={129}
            height={90}
            priority
            className="h-12 w-auto"
          />
        </Link>

        {/* Desktop nav */}
        <nav aria-label="Main" className="hidden lg:block">
          <ul className="flex items-center gap-1" onMouseLeave={() => setHovered(null)}>
            {nav.map((item) => {
              const active =
                item.href === '/' ? pathname === '/' : pathname?.startsWith(item.href)
              return (
                <li
                  key={item.href}
                  className="relative"
                  onMouseEnter={() => {
                    setHovered(item.label)
                    if (item.hasAreas) setAreasOpen(true)
                    else setAreasOpen(false)
                  }}
                  onMouseLeave={() => {
                    if (item.hasAreas) setAreasOpen(false)
                  }}
                  onBlur={
                    item.hasAreas
                      ? (e) => {
                          // Close when focus moves outside the trigger + dropdown.
                          if (!e.currentTarget.contains(e.relatedTarget as Node | null)) {
                            setAreasOpen(false)
                          }
                        }
                      : undefined
                  }
                  onKeyDown={
                    item.hasAreas
                      ? (e) => {
                          if (e.key === 'Escape' && areasOpen) {
                            e.stopPropagation()
                            setAreasOpen(false)
                            areasTriggerRef.current?.focus()
                          }
                        }
                      : undefined
                  }
                >
                  <Link
                    ref={item.hasAreas ? areasTriggerRef : undefined}
                    href={item.href}
                    aria-current={active ? 'page' : undefined}
                    className={[
                      'relative inline-flex items-center gap-1 px-3 py-2 font-display text-sm font-semibold tracking-wide uppercase transition-colors',
                      active ? 'text-brand-600' : 'text-ink-800 hover:text-ink-950',
                    ].join(' ')}
                    onFocus={() => {
                      setHovered(item.label)
                      if (item.hasAreas) setAreasOpen(true)
                    }}
                  >
                    {item.label}
                    {item.hasAreas ? (
                      <svg
                        viewBox="0 0 12 12"
                        className={[
                          'h-2.5 w-2.5 transition-transform duration-200',
                          areasOpen ? 'rotate-180' : '',
                        ].join(' ')}
                        aria-hidden="true"
                      >
                        <path d="M2 4l4 4 4-4" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" />
                      </svg>
                    ) : null}
                    {/* Animated underline — slides between items via shared layoutId */}
                    {hovered === item.label && !reducedMotion ? (
                      <motion.span
                        layoutId="eb-nav-underline"
                        className="absolute inset-x-3 bottom-0 h-0.5 -skew-x-[18deg] bg-brand-500"
                        transition={{ type: 'spring', stiffness: 400, damping: 32 }}
                      />
                    ) : null}
                  </Link>

                  {/* Areas dropdown */}
                  {item.hasAreas ? (
                    <AnimatePresence>
                      {areasOpen ? (
                        <motion.div
                          initial={reducedMotion ? { opacity: 0 } : { opacity: 0, y: 8 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={reducedMotion ? { opacity: 0 } : { opacity: 0, y: 8 }}
                          transition={{ duration: reducedMotion ? 0 : 0.18, ease: 'easeOut' }}
                          className="absolute top-full left-1/2 w-[30rem] -translate-x-1/2 pt-2"
                        >
                          <div className="grid grid-cols-2 gap-6 rounded-lg border border-ink-100 bg-white p-6 shadow-xl shadow-ink-950/10">
                            {(
                              [
                                { label: 'North West', towns: NORTH_WEST },
                                { label: 'London', towns: LONDON },
                              ] as const
                            ).map((group) => (
                              <div key={group.label}>
                                <p className="mb-2 flex items-center gap-2 font-display text-xs font-semibold tracking-[0.18em] text-brand-600 uppercase">
                                  <span className="eb-block-accent h-2 w-3.5" aria-hidden="true" />
                                  {group.label}
                                </p>
                                <ul className="space-y-0.5">
                                  {group.towns.map((area) => (
                                    <li key={area.slug}>
                                      <Link
                                        href={`/areas/${area.slug}`}
                                        className={[
                                          'block rounded px-2 py-1 text-sm transition-colors hover:bg-ink-50 hover:text-ink-950',
                                          area.hub ? 'font-semibold text-ink-900' : 'text-ink-600',
                                        ].join(' ')}
                                      >
                                        {area.name}
                                        {area.hub ? ' (all areas)' : ''}
                                      </Link>
                                    </li>
                                  ))}
                                </ul>
                              </div>
                            ))}
                          </div>
                        </motion.div>
                      ) : null}
                    </AnimatePresence>
                  ) : null}
                </li>
              )
            })}
          </ul>
        </nav>

        {/* Right: phone + quote */}
        <div className="hidden items-center gap-5 lg:flex">
          <a
            href={telHref(phoneNumber)}
            className="group inline-flex items-center gap-2 font-display text-sm font-semibold tracking-wide text-ink-800 transition-colors hover:text-brand-600"
          >
            <PhoneIcon className="h-4 w-4 text-brand-600 transition-transform duration-200 group-hover:-rotate-12" />
            {formatPhone(phoneNumber)}
          </a>
          <QuoteCTA className="!px-5 !py-2.5" />
        </div>

        {/* Mobile: hamburger */}
        <button
          ref={hamburgerRef}
          type="button"
          className="inline-flex h-11 w-11 items-center justify-center rounded-md text-ink-900 lg:hidden"
          aria-expanded={mobileOpen}
          aria-controls="eb-mobile-menu"
          aria-label={mobileOpen ? 'Close menu' : 'Open menu'}
          onClick={() => setMobileOpen((v) => !v)}
        >
          <span className="relative block h-4 w-6" aria-hidden="true">
            <span
              className={[
                'absolute left-0 h-0.5 w-6 bg-current transition-all duration-300',
                mobileOpen ? 'top-1/2 -translate-y-1/2 rotate-45' : 'top-0',
              ].join(' ')}
            />
            <span
              className={[
                'absolute top-1/2 left-0 h-0.5 w-6 -translate-y-1/2 bg-current transition-opacity duration-200',
                mobileOpen ? 'opacity-0' : 'opacity-100',
              ].join(' ')}
            />
            <span
              className={[
                'absolute left-0 h-0.5 w-6 bg-current transition-all duration-300',
                mobileOpen ? 'top-1/2 -translate-y-1/2 -rotate-45' : 'bottom-0',
              ].join(' ')}
            />
          </span>
        </button>
      </div>

      {/* Mobile full-screen menu */}
      <AnimatePresence>
        {mobileOpen ? (
          <motion.div
            ref={mobileMenuRef}
            id="eb-mobile-menu"
            initial={reducedMotion ? { opacity: 0 } : { x: '100%' }}
            animate={reducedMotion ? { opacity: 1 } : { x: 0 }}
            exit={reducedMotion ? { opacity: 0 } : { x: '100%' }}
            transition={{ duration: reducedMotion ? 0 : 0.35, ease: [0.16, 1, 0.3, 1] }}
            className="fixed inset-0 top-18 z-40 flex flex-col overflow-y-auto bg-white lg:hidden"
          >
            <nav aria-label="Mobile" className="eb-container flex-1 py-6">
              <ul className="divide-y divide-ink-100">
                {nav.map((item) =>
                  item.hasAreas ? (
                    <li key={item.href}>
                      <button
                        type="button"
                        className="flex w-full items-center justify-between py-4 font-display text-lg font-semibold text-ink-900"
                        aria-expanded={mobileAreasOpen}
                        onClick={() => setMobileAreasOpen((v) => !v)}
                      >
                        Areas
                        <svg
                          viewBox="0 0 12 12"
                          className={[
                            'h-3 w-3 transition-transform duration-200',
                            mobileAreasOpen ? 'rotate-180' : '',
                          ].join(' ')}
                          aria-hidden="true"
                        >
                          <path d="M2 4l4 4 4-4" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" />
                        </svg>
                      </button>
                      <AnimatePresence initial={false}>
                        {mobileAreasOpen ? (
                          <motion.div
                            initial={{ height: 0, opacity: 0 }}
                            animate={{ height: 'auto', opacity: 1 }}
                            exit={{ height: 0, opacity: 0 }}
                            transition={{ duration: reducedMotion ? 0 : 0.25, ease: 'easeOut' }}
                            className="overflow-hidden"
                          >
                            <div className="grid grid-cols-2 gap-x-4 pb-4">
                              {(
                                [
                                  { label: 'North West', towns: NORTH_WEST },
                                  { label: 'London', towns: LONDON },
                                ] as const
                              ).map((group) => (
                                <div key={group.label}>
                                  <p className="mt-1 mb-1.5 font-display text-xs font-semibold tracking-[0.18em] text-brand-600 uppercase">
                                    {group.label}
                                  </p>
                                  <ul>
                                    {group.towns.map((area) => (
                                      <li key={area.slug}>
                                        <Link
                                          href={`/areas/${area.slug}`}
                                          className="flex min-h-11 items-center py-1.5 text-sm text-ink-600"
                                          onClick={() => setMobileOpen(false)}
                                        >
                                          {area.name}
                                        </Link>
                                      </li>
                                    ))}
                                  </ul>
                                </div>
                              ))}
                            </div>
                          </motion.div>
                        ) : null}
                      </AnimatePresence>
                    </li>
                  ) : (
                    <li key={item.href}>
                      <Link
                        href={item.href}
                        className="block py-4 font-display text-lg font-semibold text-ink-900"
                        onClick={() => setMobileOpen(false)}
                      >
                        {item.label}
                      </Link>
                    </li>
                  ),
                )}
              </ul>
            </nav>

            <div className="eb-container border-t border-ink-100 py-6 pb-28">
              <a
                href={telHref(phoneNumber)}
                className="mb-4 inline-flex items-center gap-2 font-display text-base font-semibold text-ink-900"
              >
                <PhoneIcon className="h-4 w-4 text-brand-600" />
                {formatPhone(phoneNumber)}
              </a>
              <QuoteCTA className="w-full" />
            </div>
          </motion.div>
        ) : null}
      </AnimatePresence>
    </header>
  )
}

export default Header
