import type { Metadata, Viewport } from 'next'
import { Suspense } from 'react'
import './globals.css'
import { PageTransition } from '@/components/page-transition'

export const metadata: Metadata = {
  title: 'Helparo - Your Trusted Service Marketplace',
  description: 'Connect with verified service professionals for all your needs. Plumbing, electrical, cleaning, repairs, and more.',
  keywords: 'service marketplace, plumbing, electrical, cleaning, repairs, home services',
  authors: [{ name: 'Helparo' }],
  openGraph: {
    title: 'Helparo - Your Trusted Service Marketplace',
    description: 'Connect with verified service professionals for all your needs.',
    type: 'website',
    locale: 'en_US',
  },
}

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 5,
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" className="font-sans">
      <head>
        <link rel="dns-prefetch" href="https://opnjibjsddwyojrerbll.supabase.co" />
        <link rel="preconnect" href="https://opnjibjsddwyojrerbll.supabase.co" crossOrigin="anonymous" />
      </head>
      <body className="antialiased">
        <PageTransition>
          {children}
        </PageTransition>
      </body>
    </html>
  )
}
