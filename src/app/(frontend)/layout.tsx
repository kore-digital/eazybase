import type { Metadata } from 'next'
import { Montserrat, Open_Sans } from 'next/font/google'
import React from 'react'

import { Footer } from '@/components/layout/Footer'
import { Header } from '@/components/layout/Header'
import { StickyMobileCTA } from '@/components/layout/StickyMobileCTA'
import { WhatsAppFloat } from '@/components/layout/WhatsAppFloat'

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
}

export default async function RootLayout(props: { children: React.ReactNode }) {
  const { children } = props

  return (
    <html lang="en-GB" className={`${montserrat.variable} ${openSans.variable}`}>
      <body>
        <Header />
        <main>{children}</main>
        <Footer />
        <StickyMobileCTA />
        <WhatsAppFloat />
      </body>
    </html>
  )
}
