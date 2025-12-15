import type { Metadata, Viewport } from 'next'
import './globals.css'
import { PageTransition } from '@/components/page-transition'
import { LanguageProvider } from '@/lib/language-context'

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
    // 🔴 IMPORTANT: Replace this with your actual Google Search Console verification code!
    // 1. Go to: https://search.google.com/search-console/
    // 2. Add property: helparo.in
    // 3. Choose "HTML tag" verification method
    // 4. Copy the content value and paste below
    google: process.env.NEXT_PUBLIC_GOOGLE_SITE_VERIFICATION || 'your-google-verification-code',
    // Bing Webmaster verification (optional but recommended)
    // Go to: https://www.bing.com/webmasters/
    // yandex: 'your-yandex-code',
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
  userScalable: true,
  themeColor: '#00C3B4', // Guardian Teal
  viewportFit: 'cover', // For iPhone notch support
}

// JSON-LD Structured Data for SEO - LocalBusiness
const localBusinessSchema = {
  '@context': 'https://schema.org',
  '@type': 'LocalBusiness',
  '@id': 'https://helparo.in/#business',
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

// WebSite schema for sitelinks search box
const websiteSchema = {
  '@context': 'https://schema.org',
  '@type': 'WebSite',
  '@id': 'https://helparo.in/#website',
  name: 'Helparo',
  url: 'https://helparo.in',
  description: 'On-demand home services platform - Book verified helpers for plumbing, electrical, cleaning & more',
  publisher: { '@id': 'https://helparo.in/#business' },
  potentialAction: {
    '@type': 'SearchAction',
    target: {
      '@type': 'EntryPoint',
      urlTemplate: 'https://helparo.in/services?search={search_term_string}'
    },
    'query-input': 'required name=search_term_string'
  }
}

// FAQ Schema for rich snippets
const faqSchema = {
  '@context': 'https://schema.org',
  '@type': 'FAQPage',
  mainEntity: [
    {
      '@type': 'Question',
      name: 'How do I book a service on Helparo?',
      acceptedAnswer: {
        '@type': 'Answer',
        text: 'Simply browse services, select what you need, choose a time slot, and book. Our verified professionals will arrive at your doorstep within 30 minutes to 2 hours.'
      }
    },
    {
      '@type': 'Question',
      name: 'Are Helparo professionals verified?',
      acceptedAnswer: {
        '@type': 'Answer',
        text: 'Yes! All our helpers undergo thorough background verification, skill assessment, and ID verification before joining our platform. We ensure 100% safety.'
      }
    },
    {
      '@type': 'Question',
      name: 'What payment methods does Helparo accept?',
      acceptedAnswer: {
        '@type': 'Answer',
        text: 'We accept Cash, UPI (Google Pay, PhonePe, Paytm), and Card payments. You can choose your preferred payment method during or after the service.'
      }
    },
    {
      '@type': 'Question',
      name: 'What services does Helparo offer?',
      acceptedAnswer: {
        '@type': 'Answer',
        text: 'Helparo offers plumbing, electrical repairs, house cleaning, AC service & repair, carpentry, appliance repair, painting, pest control, and many more home services.'
      }
    },
    {
      '@type': 'Question',
      name: 'Which cities does Helparo operate in?',
      acceptedAnswer: {
        '@type': 'Answer',
        text: 'Helparo currently operates in major Indian cities including Vijayawada, Hyderabad, Bangalore, Mumbai, Delhi, Chennai, Pune, Kolkata and more cities coming soon.'
      }
    },
    {
      '@type': 'Question',
      name: 'How quickly can I get a helper?',
      acceptedAnswer: {
        '@type': 'Answer',
        text: 'With our instant booking feature, you can get a helper within 30 minutes to 2 hours depending on availability in your area. We also offer scheduled bookings.'
      }
    }
  ]
}

// Organization schema
const organizationSchema = {
  '@context': 'https://schema.org',
  '@type': 'Organization',
  '@id': 'https://helparo.in/#organization',
  name: 'Helparo',
  url: 'https://helparo.in',
  logo: {
    '@type': 'ImageObject',
    url: 'https://helparo.in/logo.svg',
    width: '512',
    height: '512'
  },
  description: 'India\'s trusted on-demand home services platform',
  foundingDate: '2024',
  sameAs: [
    'https://facebook.com/helparo',
    'https://instagram.com/helparo',
    'https://twitter.com/helparo',
    'https://linkedin.com/company/helparo'
  ],
  contactPoint: [
    {
      '@type': 'ContactPoint',
      telephone: '+91-XXXXXXXXXX',
      contactType: 'customer service',
      availableLanguage: ['English', 'Hindi', 'Telugu']
    }
  ]
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
        
        {/* JSON-LD Structured Data for SEO */}
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(localBusinessSchema) }}
        />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(websiteSchema) }}
        />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(faqSchema) }}
        />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(organizationSchema) }}
        />
      </head>
      <body className="antialiased">
        <LanguageProvider>
          <PageTransition>
            {children}
          </PageTransition>
        </LanguageProvider>
      </body>
    </html>
  )
}
