import type { Metadata, Viewport } from 'next'
import { Montserrat, Open_Sans } from 'next/font/google'
import React from 'react'

import { PwaRegister } from './analytics/PwaRegister'

import '../(frontend)/styles.css'

/**
 * Standalone layout for the installable "EazyBase Analytics" phone app
 * (/analytics). Deliberately bare — no site header/footer, no PostHog (so the
 * app never pollutes the very analytics it displays). Own <html> because the
 * app router route groups each own their document (there is no root layout).
 */

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
  title: 'EazyBase Analytics',
  description: 'EazyBase website analytics — traffic and enquiries at a glance.',
  manifest: '/manifest.webmanifest',
  appleWebApp: { capable: true, title: 'EazyBase Analytics', statusBarStyle: 'default' },
  icons: { icon: '/icons/analytics-192.png', apple: '/icons/analytics-180.png' },
  robots: { index: false, follow: false },
}

export const viewport: Viewport = {
  themeColor: '#1e1f1d',
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  viewportFit: 'cover',
}

export default function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en-GB" className={`${montserrat.variable} ${openSans.variable}`}>
      <body className="bg-ink-50">
        {children}
        <PwaRegister />
      </body>
    </html>
  )
}
