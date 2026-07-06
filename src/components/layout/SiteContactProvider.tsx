'use client'

import { createContext, useContext, useMemo } from 'react'

import { telHref, waHref } from '@/lib/format'
import { SITE } from '@/lib/site'

/**
 * Makes the CMS SiteSettings contact details (phone + WhatsApp) available to
 * client components anywhere in the tree, so editing them in the admin panel
 * updates every call/WhatsApp button on the site — not just the footer.
 *
 * The provider is seeded once, server-side, from getSiteSettings() in the root
 * layout. Each field falls back to the SITE constant only when the CMS value is
 * blank. Server components should read getSiteSettings() directly instead of
 * this hook.
 */

const DEFAULT_WA_TEXT = "Hi EazyBase, I'd like to talk about a modular extension."

export type SiteContact = {
  phone: string
  phoneHref: string
  whatsappNumber: string
  whatsappHref: string
}

const SiteContactContext = createContext<SiteContact | null>(null)

export function SiteContactProvider({
  phone,
  whatsappNumber,
  children,
}: {
  phone?: string | null
  whatsappNumber?: string | null
  children: React.ReactNode
}) {
  const value = useMemo<SiteContact>(() => {
    const resolvedPhone = phone?.trim() || SITE.phone
    const resolvedWa = whatsappNumber?.trim() || SITE.whatsappNumber
    return {
      phone: resolvedPhone,
      phoneHref: telHref(resolvedPhone),
      whatsappNumber: resolvedWa,
      whatsappHref: waHref(resolvedWa, DEFAULT_WA_TEXT),
    }
  }, [phone, whatsappNumber])

  return <SiteContactContext.Provider value={value}>{children}</SiteContactContext.Provider>
}

/**
 * Resolved contact details from the CMS. If used outside the provider (e.g. an
 * isolated test render) it returns the SITE constant fallbacks.
 */
export function useSiteContact(): SiteContact {
  const ctx = useContext(SiteContactContext)
  if (ctx) return ctx
  return {
    phone: SITE.phone,
    phoneHref: SITE.phoneHref,
    whatsappNumber: SITE.whatsappNumber,
    whatsappHref: SITE.whatsappHref,
  }
}
