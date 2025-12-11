import type { Metadata, Viewport } from 'next'
import './globals.css'
import { PageTransition } from '@/components/page-transition'

export const metadata: Metadata = {
  metadataBase: new URL('https://helparo.in'),
  title: {
    default: 'Helparo - Book Trusted Home Service Helpers Near You | Plumber, Electrician, Cleaner',
    template: '%s | Helparo - Home Services'
  },
  description: 'Book verified helpers for plumbing, electrical, cleaning, AC repair, carpentry & more. Get instant help at your doorstep. 4.8★ rated service. Cash/UPI payment. Same-day service available in India.',
  keywords: [
    'home services', 'helper near me', 'plumber near me', 'electrician near me', 
    'cleaner near me', 'AC repair', 'carpenter', 'home repair', 'handyman',
    'book helper online', 'trusted helpers', 'verified professionals',
    'emergency plumber', 'emergency electrician', 'house cleaning service',
    'appliance repair', 'home maintenance', 'local services', 'service at home',
    'helparo', 'helper app', 'service marketplace India', 'Vijayawada services',
    'Andhra Pradesh home services', 'on demand services'
  ],
  authors: [{ name: 'Helparo', url: 'https://helparo.in' }],
  creator: 'Helparo',
  publisher: 'Helparo Services',
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
  icons: {
    icon: '/favicon.svg',
    shortcut: '/favicon.svg',
    apple: '/logo.svg',
  },
  manifest: '/manifest.json',
  openGraph: {
    type: 'website',
    locale: 'en_IN',
    url: 'https://helparo.in',
    siteName: 'Helparo',
    title: 'Helparo - Book Trusted Home Service Helpers Near You',
    description: 'Book verified helpers for plumbing, electrical, cleaning & more. Instant service at your doorstep. 4.8★ rated. Cash/UPI accepted.',
    images: [
      {
        url: '/og-image.png',
        width: 1200,
        height: 630,
        alt: 'Helparo - Your Trusted Home Service Partner',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Helparo - Book Trusted Helpers Near You',
    description: 'Get verified plumbers, electricians, cleaners at your doorstep. Same-day service. 4.8★ rated.',
    images: ['/og-image.png'],
    creator: '@helparo',
  },
  verification: {
    google: 'your-google-verification-code', // Add your Google Search Console verification
  },
  alternates: {
    canonical: 'https://helparo.in',
    languages: {
      'en-IN': 'https://helparo.in',
    },
  },
  category: 'Home Services',
}

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 5,
  themeColor: '#10b981',
}

// JSON-LD Structured Data for SEO
const jsonLd = {
  '@context': 'https://schema.org',
  '@type': 'LocalBusiness',
  name: 'Helparo',
  description: 'Book trusted home service helpers - plumbers, electricians, cleaners & more at your doorstep.',
  url: 'https://helparo.in',
  logo: 'https://helparo.in/logo.svg',
  image: 'https://helparo.in/og-image.png',
  telephone: '+91-XXXXXXXXXX',
  address: {
    '@type': 'PostalAddress',
    addressLocality: 'Vijayawada',
    addressRegion: 'Andhra Pradesh',
    addressCountry: 'IN',
  },
  geo: {
    '@type': 'GeoCoordinates',
    latitude: '16.5062',
    longitude: '80.6480',
  },
  aggregateRating: {
    '@type': 'AggregateRating',
    ratingValue: '4.8',
    reviewCount: '10000',
    bestRating: '5',
    worstRating: '1',
  },
  priceRange: '₹₹',
  openingHoursSpecification: {
    '@type': 'OpeningHoursSpecification',
    dayOfWeek: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'],
    opens: '06:00',
    closes: '23:00',
  },
  sameAs: [
    'https://facebook.com/helparo',
    'https://instagram.com/helparo',
    'https://twitter.com/helparo',
  ],
  hasOfferCatalog: {
    '@type': 'OfferCatalog',
    name: 'Home Services',
    itemListElement: [
      { '@type': 'Offer', itemOffered: { '@type': 'Service', name: 'Plumbing Services' } },
      { '@type': 'Offer', itemOffered: { '@type': 'Service', name: 'Electrical Services' } },
      { '@type': 'Offer', itemOffered: { '@type': 'Service', name: 'House Cleaning' } },
      { '@type': 'Offer', itemOffered: { '@type': 'Service', name: 'AC Repair & Service' } },
      { '@type': 'Offer', itemOffered: { '@type': 'Service', name: 'Carpentry Work' } },
      { '@type': 'Offer', itemOffered: { '@type': 'Service', name: 'Appliance Repair' } },
    ],
  },
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
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        
        {/* JSON-LD Structured Data */}
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
      </head>
      <body className="antialiased">
        <PageTransition>
          {children}
        </PageTransition>
      </body>
    </html>
  )
}
