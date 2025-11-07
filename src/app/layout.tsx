import type { Metadata } from 'next'
import { Inter, JetBrains_Mono } from 'next/font/google'
import './globals.css'

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-inter',
  display: 'swap',
})

const jetbrainsMono = JetBrains_Mono({
  subsets: ['latin'],
  variable: '--font-jetbrains-mono',
  display: 'swap',
})

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

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" className={`${inter.variable} ${jetbrainsMono.variable}`}>
      <body className={inter.className}>
        {children}
      </body>
    </html>
  )
}
