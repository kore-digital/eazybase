import type { Metadata } from 'next'
import { Montserrat, Open_Sans } from 'next/font/google'
import React from 'react'

import { PostHogInit } from '@/components/analytics/PostHogInit'
import { EditorOverlay } from '@/components/editor/EditorOverlay'
import { Footer } from '@/components/layout/Footer'
import { Header } from '@/components/layout/Header'
import { SiteContactProvider } from '@/components/layout/SiteContactProvider'
import { SmoothScroll } from '@/components/layout/SmoothScroll'
import { StickyMobileCTA } from '@/components/layout/StickyMobileCTA'
import { WhatsAppFloat } from '@/components/layout/WhatsAppFloat'
import { getNavigation, getSiteSettings } from '@/lib/data'

import './styles.css'

const montserrat = Montserrat({
  subsets: ['latin'],
  variable: '--font-montserrat',
  weight: ['400', '500', '600', '700', '800'],
})

const openSans = Open_Sans({
  subsets: ['latin'],
  variable: '--font-open-sans',
  weight: ['400', '500', '600', '700'],
})

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_SERVER_URL || 'https://www.eazybase.co.uk'),
  title: {
    default: 'EazyBase | Modular Home Extensions — North West & London',
    template: '%s | EazyBase',
  },
  description:
    'Award-winning prefab modular home extensions. Factory-built in as little as 4 weeks, installed on-site in under a week. Serving the North West and London.',
  // Green skewed-block house glyph (see public/favicon.svg) — the .ico also
  // satisfies clients that request /favicon.ico directly (no more 404s).
  icons: {
    icon: [
      { url: '/favicon.ico', sizes: '48x48' },
      { url: '/favicon.svg', type: 'image/svg+xml' },
    ],
    shortcut: '/favicon.ico',
    apple: '/icons/analytics-180.png',
  },
  openGraph: {
    type: 'website',
    siteName: 'EazyBase',
    locale: 'en_GB',
    url: '/',
    title: 'EazyBase | Modular Home Extensions — North West & London',
    description:
      'Award-winning prefab modular home extensions. Factory-built in as little as 4 weeks, installed on-site in under a week. Serving the North West and London.',
    // TODO(asset): replace with a dedicated 1200×630 og image — /logo.png is a placeholder.
    images: [{ url: '/logo.png', alt: 'EazyBase Modular Home Extensions' }],
  },
  twitter: {
    card: 'summary_large_image',
  },
}

export default async function RootLayout(props: { children: React.ReactNode }) {
  const { children } = props
  const [settings, navigation] = await Promise.all([getSiteSettings(), getNavigation()])

  return (
    <html lang="en-GB" className={`${montserrat.variable} ${openSans.variable}`}>
      <body>
        {/* Site-wide Lenis smooth scrolling (no-op under prefers-reduced-motion) */}
        <SmoothScroll />
        <PostHogInit />
        <SiteContactProvider phone={settings?.phone} whatsappNumber={settings?.whatsappNumber}>
          <Header phone={settings?.phone} navItems={navigation?.mainNav} />
          <main>{children}</main>
          <Footer
            phone={settings?.phone}
            whatsappNumber={settings?.whatsappNumber}
            email={settings?.email}
            tagline={settings?.tagline}
            socials={settings?.socials}
            navItems={navigation?.footerNav}
          />
          <StickyMobileCTA />
          <WhatsAppFloat />
        </SiteContactProvider>
        <EditorOverlay />
      </body>
    </html>
  )
}
