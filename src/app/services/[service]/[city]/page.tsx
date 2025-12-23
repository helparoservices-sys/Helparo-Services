import { Metadata } from 'next'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { 
  SEO_SERVICES, 
  TARGET_CITIES, 
  getServiceBySlug, 
  getCityBySlug,
  SITE_CONFIG 
} from '@/lib/seo-config'
import { 
  Star, 
  Shield, 
  Clock, 
  CheckCircle, 
  Phone, 
  MapPin,
  ChevronRight,
  Users,
  BadgeCheck,
  Zap,
  Navigation
} from 'lucide-react'
import { Button } from '@/components/ui/button'

interface PageProps {
  params: Promise<{ service: string; city: string }>
}

// Generate static params for all service-city combinations
export async function generateStaticParams() {
  const params: { service: string; city: string }[] = []
  
  for (const service of SEO_SERVICES) {
    for (const city of TARGET_CITIES) {
      params.push({
        service: service.slug,
        city: city.slug,
      })
    }
  }
  
  return params
}

// Generate metadata for SEO - This is CRITICAL for local search rankings
export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { service: serviceSlug, city: citySlug } = await params
  const service = getServiceBySlug(serviceSlug)
  const city = getCityBySlug(citySlug)
  
  if (!service || !city) {
    return { title: 'Service Not Found' }
  }

  // Optimized title for "plumber in guntur" type searches
  const title = `${service.title} in ${city.name} | Best ${service.titlePlural} Near Me | Helparo`
  
  // Rich description with city name, rating, and call-to-action
  const description = `Looking for ${service.title.toLowerCase()} in ${city.name}? Book verified ${service.titlePlural.toLowerCase()} near you. ⭐ ${service.avgRating} rated. ${service.totalJobs.toLocaleString()}+ jobs done in ${city.state}. Same-day service. ${service.priceRange}. Call now!`

  // City + Service specific keywords
  const keywords = [
    `${service.slug} in ${city.name.toLowerCase()}`,
    `${service.slug} ${city.name.toLowerCase()}`,
    `${service.title.toLowerCase()} in ${city.name.toLowerCase()}`,
    `${service.title.toLowerCase()} near me ${city.name.toLowerCase()}`,
    `best ${service.slug} in ${city.name.toLowerCase()}`,
    `${service.slug} service ${city.name.toLowerCase()}`,
    `${city.name.toLowerCase()} ${service.slug}`,
    ...service.keywords.map(kw => `${kw} ${city.name.toLowerCase()}`),
    ...city.areaServed.map(area => `${service.slug} in ${area.toLowerCase()}`),
  ]

  return {
    title,
    description,
    keywords,
    openGraph: {
      title,
      description,
      url: `${SITE_CONFIG.url}/services/${service.slug}/${city.slug}`,
      siteName: SITE_CONFIG.name,
      images: [{ url: SITE_CONFIG.defaultImage, width: 1200, height: 630, alt: `${service.title} in ${city.name}` }],
      locale: 'en_IN',
      type: 'website',
    },
    twitter: {
      card: 'summary_large_image',
      title: `${service.title} in ${city.name} | Helparo`,
      description: `Book verified ${service.titlePlural.toLowerCase()} in ${city.name}. ${service.avgRating}★ rated. Same-day service.`,
      images: [SITE_CONFIG.defaultImage],
    },
    alternates: {
      canonical: `${SITE_CONFIG.url}/services/${service.slug}/${city.slug}`,
    },
    // Geo targeting for local SEO
    other: {
      'geo.region': `IN-${city.stateCode}`,
      'geo.placename': city.name,
      'geo.position': `${city.coordinates.lat};${city.coordinates.lng}`,
      'ICBM': `${city.coordinates.lat}, ${city.coordinates.lng}`,
    },
  }
}

export default async function ServiceCityPage({ params }: PageProps) {
  const { service: serviceSlug, city: citySlug } = await params
  const service = getServiceBySlug(serviceSlug)
  const city = getCityBySlug(citySlug)

  if (!service || !city) {
    notFound()
  }

  // LocalBusiness + Service Schema - CRITICAL for local search
  const localBusinessSchema = {
    '@context': 'https://schema.org',
    '@type': 'LocalBusiness',
    '@id': `${SITE_CONFIG.url}/services/${service.slug}/${city.slug}#business`,
    name: `Helparo ${service.name} Services - ${city.name}`,
    description: `Professional ${service.name.toLowerCase()} services in ${city.name}, ${city.state}. ${service.description}`,
    url: `${SITE_CONFIG.url}/services/${service.slug}/${city.slug}`,
    logo: `${SITE_CONFIG.url}${SITE_CONFIG.logoUrl}`,
    image: `${SITE_CONFIG.url}${SITE_CONFIG.defaultImage}`,
    telephone: SITE_CONFIG.phone,
    email: SITE_CONFIG.email,
    address: {
      '@type': 'PostalAddress',
      addressLocality: city.name,
      addressRegion: city.state,
      addressCountry: 'IN',
      postalCode: city.postalCodes[0],
    },
    geo: {
      '@type': 'GeoCoordinates',
      latitude: city.coordinates.lat,
      longitude: city.coordinates.lng,
    },
    areaServed: city.areaServed.map(area => ({
      '@type': 'City',
      name: area,
    })),
    priceRange: service.priceRange,
    openingHoursSpecification: {
      '@type': 'OpeningHoursSpecification',
      dayOfWeek: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'],
      opens: '06:00',
      closes: '23:00',
    },
    aggregateRating: {
      '@type': 'AggregateRating',
      ratingValue: service.avgRating,
      reviewCount: Math.floor(service.totalJobs * 0.3), // Assuming 30% leave reviews
      bestRating: 5,
      worstRating: 1,
    },
    hasOfferCatalog: {
      '@type': 'OfferCatalog',
      name: `${service.name} Services in ${city.name}`,
      itemListElement: service.subServices.map((subService, index) => ({
        '@type': 'Offer',
        itemOffered: {
          '@type': 'Service',
          name: `${subService} in ${city.name}`,
          areaServed: { '@type': 'City', name: city.name },
        },
        position: index + 1,
      })),
    },
    sameAs: Object.values(SITE_CONFIG.socialLinks),
  }

  // Service Schema
  const serviceSchema = {
    '@context': 'https://schema.org',
    '@type': 'Service',
    '@id': `${SITE_CONFIG.url}/services/${service.slug}/${city.slug}#service`,
    name: `${service.name} Services in ${city.name}`,
    description: `${service.description} Available in ${city.areaServed.join(', ')}.`,
    provider: {
      '@id': `${SITE_CONFIG.url}/services/${service.slug}/${city.slug}#business`,
    },
    areaServed: {
      '@type': 'City',
      name: city.name,
      addressRegion: city.state,
      addressCountry: 'IN',
    },
    serviceType: service.name,
    offers: {
      '@type': 'Offer',
      priceSpecification: {
        '@type': 'PriceSpecification',
        priceCurrency: 'INR',
        price: service.priceRange,
      },
    },
  }

  // Breadcrumb Schema
  const breadcrumbSchema = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: [
      { '@type': 'ListItem', position: 1, name: 'Home', item: SITE_CONFIG.url },
      { '@type': 'ListItem', position: 2, name: 'Services', item: `${SITE_CONFIG.url}/services` },
      { '@type': 'ListItem', position: 3, name: service.name, item: `${SITE_CONFIG.url}/services/${service.slug}` },
      { '@type': 'ListItem', position: 4, name: city.name, item: `${SITE_CONFIG.url}/services/${service.slug}/${city.slug}` },
    ],
  }

  // FAQ Schema for rich snippets
  const faqSchema = {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: [
      {
        '@type': 'Question',
        name: `How much does ${service.title.toLowerCase()} cost in ${city.name}?`,
        acceptedAnswer: {
          '@type': 'Answer',
          text: `${service.name} services in ${city.name} typically cost ${service.priceRange}. The exact price depends on the specific service needed. Book on Helparo for transparent pricing with no hidden charges.`,
        },
      },
      {
        '@type': 'Question',
        name: `Where can I find a good ${service.title.toLowerCase()} near me in ${city.name}?`,
        acceptedAnswer: {
          '@type': 'Answer',
          text: `Helparo provides verified ${service.titlePlural.toLowerCase()} across ${city.name} including ${city.areaServed.slice(0, 3).join(', ')}. Our ${service.titlePlural.toLowerCase()} are background-checked and rated ${service.avgRating}★ by customers.`,
        },
      },
      {
        '@type': 'Question',
        name: `Do you provide emergency ${service.name.toLowerCase()} service in ${city.name}?`,
        acceptedAnswer: {
          '@type': 'Answer',
          text: `Yes! Helparo offers same-day ${service.name.toLowerCase()} service in ${city.name}. Our ${service.titlePlural.toLowerCase()} can reach your location within 30 minutes to 2 hours of booking.`,
        },
      },
      {
        '@type': 'Question',
        name: `Are ${service.titlePlural.toLowerCase()} on Helparo verified?`,
        acceptedAnswer: {
          '@type': 'Answer',
          text: `Absolutely! All ${service.titlePlural.toLowerCase()} on Helparo undergo thorough background verification, skill assessment, and ID verification. We've completed ${service.totalJobs.toLocaleString()}+ jobs with a ${service.avgRating}★ rating.`,
        },
      },
    ],
  }

  // Other cities offering this service (for internal linking)
  const otherCities = TARGET_CITIES.filter(c => c.slug !== city.slug)

  return (
    <>
      {/* JSON-LD Structured Data - Multiple schemas for rich results */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(localBusinessSchema) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(serviceSchema) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbSchema) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(faqSchema) }}
      />

      <main className="min-h-screen bg-gradient-to-b from-slate-50 to-white">
        {/* Hero Section with City Focus */}
        <section className="relative bg-gradient-to-br from-emerald-600 via-teal-600 to-cyan-700 text-white py-12 sm:py-20">
          <div className="absolute inset-0 bg-[url('/pattern.svg')] opacity-10" />
          <div className="container mx-auto px-4 relative">
            {/* Breadcrumb - Important for SEO */}
            <nav className="flex items-center gap-2 text-sm text-emerald-100 mb-6 flex-wrap" aria-label="Breadcrumb">
              <Link href="/" className="hover:text-white">Home</Link>
              <ChevronRight className="w-4 h-4" />
              <Link href="/services" className="hover:text-white">Services</Link>
              <ChevronRight className="w-4 h-4" />
              <Link href={`/services/${service.slug}`} className="hover:text-white">{service.name}</Link>
              <ChevronRight className="w-4 h-4" />
              <span className="text-white font-medium">{city.name}</span>
            </nav>

            <div className="max-w-4xl">
              {/* Location Badge */}
              <div className="inline-flex items-center gap-2 bg-white/20 backdrop-blur-sm rounded-full px-4 py-2 mb-4">
                <MapPin className="w-4 h-4" />
                <span className="font-medium">{city.name}, {city.state}</span>
              </div>

              <div className="flex items-center gap-3 mb-4">
                <span className="text-5xl">{service.icon}</span>
                <div>
                  {/* H1 with City + Service - Most important for ranking */}
                  <h1 className="text-3xl sm:text-4xl md:text-5xl font-bold">
                    {service.title} in {city.name}
                  </h1>
                  <p className="text-emerald-100 text-lg mt-1">
                    Best {service.titlePlural.toLowerCase()} near you in {city.name}
                  </p>
                </div>
              </div>

              <p className="text-lg sm:text-xl text-emerald-50 mb-6 max-w-2xl">
                Looking for a trusted {service.title.toLowerCase()} in {city.name}? 
                Book verified {service.titlePlural.toLowerCase()} for {service.subServices.slice(0, 3).join(', ').toLowerCase()} and more.
                Same-day service available across {city.areaServed.slice(0, 3).join(', ')}.
              </p>

              {/* Trust Badges */}
              <div className="flex flex-wrap gap-3 mb-8">
                <div className="flex items-center gap-2 bg-white/10 backdrop-blur-sm rounded-full px-4 py-2">
                  <Star className="w-5 h-5 text-yellow-400 fill-yellow-400" />
                  <span className="font-semibold">{service.avgRating} Rating</span>
                </div>
                <div className="flex items-center gap-2 bg-white/10 backdrop-blur-sm rounded-full px-4 py-2">
                  <Users className="w-5 h-5" />
                  <span>{service.totalJobs.toLocaleString()}+ Jobs in {city.state}</span>
                </div>
                <div className="flex items-center gap-2 bg-white/10 backdrop-blur-sm rounded-full px-4 py-2">
                  <BadgeCheck className="w-5 h-5 text-green-400" />
                  <span>Verified {service.titlePlural}</span>
                </div>
                <div className="flex items-center gap-2 bg-white/10 backdrop-blur-sm rounded-full px-4 py-2">
                  <Clock className="w-5 h-5" />
                  <span>30 Min Response</span>
                </div>
              </div>

              <div className="flex flex-col sm:flex-row gap-4">
                <Link href="/customer/new-request">
                  <Button size="lg" className="bg-white text-emerald-700 hover:bg-emerald-50 font-semibold text-lg px-8 w-full sm:w-auto">
                    Book {service.title} Now
                  </Button>
                </Link>
                <Link href="tel:+91XXXXXXXXXX">
                  <Button size="lg" variant="outline" className="border-white text-white hover:bg-white/10 w-full sm:w-auto">
                    <Phone className="w-5 h-5 mr-2" />
                    Call: +91-XXXXXXXXXX
                  </Button>
                </Link>
              </div>

              {/* Price Highlight */}
              <div className="mt-6 inline-block bg-yellow-400 text-yellow-900 px-4 py-2 rounded-lg font-semibold">
                Starting at {service.priceRange.split('-')[0].trim()} only
              </div>
            </div>
          </div>
        </section>

        {/* Services Offered in This City */}
        <section className="py-12 sm:py-16 container mx-auto px-4">
          <h2 className="text-2xl sm:text-3xl font-bold text-slate-900 mb-4 text-center">
            {service.name} Services in {city.name}
          </h2>
          <p className="text-slate-600 text-center mb-8 max-w-2xl mx-auto">
            We offer comprehensive {service.name.toLowerCase()} services across {city.name}. 
            Our verified {service.titlePlural.toLowerCase()} are available in {city.areaServed.join(', ')}.
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {service.subServices.map((subService, index) => (
              <div 
                key={index}
                className="bg-white rounded-xl p-6 border border-slate-200 shadow-sm hover:shadow-md hover:border-emerald-300 transition-all"
              >
                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 rounded-full bg-emerald-100 flex items-center justify-center flex-shrink-0">
                    <CheckCircle className="w-5 h-5 text-emerald-600" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-slate-900">{subService}</h3>
                    <p className="text-sm text-slate-600 mt-1">
                      Expert {subService.toLowerCase()} service in {city.name}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Areas We Serve - Important for local SEO */}
        <section className="py-12 sm:py-16 bg-slate-50">
          <div className="container mx-auto px-4">
            <h2 className="text-2xl sm:text-3xl font-bold text-slate-900 mb-4 text-center">
              Areas We Serve in {city.name}
            </h2>
            <p className="text-slate-600 text-center mb-8">
              Our {service.titlePlural.toLowerCase()} are available across {city.name} and nearby areas
            </p>
            <div className="flex flex-wrap justify-center gap-3">
              {city.areaServed.map((area, index) => (
                <div 
                  key={index}
                  className="bg-white px-4 py-2 rounded-full border border-slate-200 text-slate-700 flex items-center gap-2"
                >
                  <Navigation className="w-4 h-4 text-emerald-600" />
                  {area}
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Why Choose Us */}
        <section className="py-12 sm:py-16 container mx-auto px-4">
          <h2 className="text-2xl sm:text-3xl font-bold text-slate-900 mb-8 text-center">
            Why Book {service.title} from Helparo in {city.name}?
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {[
              { icon: Shield, title: 'Verified Professionals', desc: `All ${service.titlePlural.toLowerCase()} are background verified` },
              { icon: Clock, title: 'Quick Response', desc: 'Get help in 30 mins - 2 hours' },
              { icon: Star, title: `${service.avgRating}★ Rated Service`, desc: 'Trusted by thousands in ' + city.name },
              { icon: Zap, title: 'Transparent Pricing', desc: service.priceRange + ' - No hidden charges' },
            ].map((feature, index) => (
              <div key={index} className="text-center p-6 bg-white rounded-xl border border-slate-200">
                <div className="w-14 h-14 rounded-full bg-emerald-100 flex items-center justify-center mx-auto mb-4">
                  <feature.icon className="w-7 h-7 text-emerald-600" />
                </div>
                <h3 className="font-semibold text-slate-900 mb-2">{feature.title}</h3>
                <p className="text-sm text-slate-600">{feature.desc}</p>
              </div>
            ))}
          </div>
        </section>

        {/* FAQ Section - Rich snippets opportunity */}
        <section className="py-12 sm:py-16 bg-slate-50">
          <div className="container mx-auto px-4 max-w-3xl">
            <h2 className="text-2xl sm:text-3xl font-bold text-slate-900 mb-8 text-center">
              {service.name} FAQs for {city.name}
            </h2>
            <div className="space-y-4">
              {[
                {
                  q: `How much does ${service.title.toLowerCase()} cost in ${city.name}?`,
                  a: `${service.name} services in ${city.name} typically cost ${service.priceRange}. The exact price depends on the specific work needed. Helparo provides upfront pricing with no hidden charges.`
                },
                {
                  q: `Where can I find a reliable ${service.title.toLowerCase()} near me in ${city.name}?`,
                  a: `Helparo connects you with verified ${service.titlePlural.toLowerCase()} across ${city.name} including ${city.areaServed.slice(0, 3).join(', ')}. All our professionals are background-checked and rated ${service.avgRating}★ by customers.`
                },
                {
                  q: `Is same-day ${service.name.toLowerCase()} service available in ${city.name}?`,
                  a: `Yes! Helparo offers same-day ${service.name.toLowerCase()} service across ${city.name}. Our ${service.titlePlural.toLowerCase()} can reach you within 30 minutes to 2 hours after booking.`
                },
                {
                  q: `What ${service.name.toLowerCase()} services do you offer in ${city.name}?`,
                  a: `We offer ${service.subServices.join(', ')} in ${city.name}. All services come with quality guarantee and transparent pricing.`
                },
              ].map((faq, index) => (
                <div key={index} className="bg-white rounded-xl p-6 border border-slate-200">
                  <h3 className="font-semibold text-slate-900 mb-2">{faq.q}</h3>
                  <p className="text-slate-600">{faq.a}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Other Cities - Internal Linking for SEO */}
        <section className="py-12 sm:py-16 container mx-auto px-4">
          <h2 className="text-2xl sm:text-3xl font-bold text-slate-900 mb-4 text-center">
            {service.name} in Other Cities
          </h2>
          <p className="text-slate-600 text-center mb-8">
            We also provide {service.name.toLowerCase()} services in these cities
          </p>
          <div className="flex flex-wrap justify-center gap-4">
            {otherCities.map((otherCity) => (
              <Link
                key={otherCity.slug}
                href={`/services/${service.slug}/${otherCity.slug}`}
                className="bg-white rounded-xl px-6 py-3 border border-slate-200 hover:border-emerald-500 hover:shadow-md transition-all group flex items-center gap-2"
              >
                <MapPin className="w-4 h-4 text-emerald-600" />
                <span className="font-medium text-slate-900 group-hover:text-emerald-600">
                  {service.title} in {otherCity.name}
                </span>
              </Link>
            ))}
          </div>
        </section>

        {/* Other Services in This City - More Internal Linking */}
        <section className="py-12 sm:py-16 bg-slate-50">
          <div className="container mx-auto px-4">
            <h2 className="text-2xl sm:text-3xl font-bold text-slate-900 mb-4 text-center">
              Other Services in {city.name}
            </h2>
            <p className="text-slate-600 text-center mb-8">
              Explore more home services available in {city.name}
            </p>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              {SEO_SERVICES.filter(s => s.slug !== service.slug).slice(0, 4).map((otherService) => (
                <Link
                  key={otherService.slug}
                  href={`/services/${otherService.slug}/${city.slug}`}
                  className="bg-white rounded-xl p-4 border border-slate-200 hover:border-emerald-500 hover:shadow-md transition-all group text-center"
                >
                  <span className="text-3xl block mb-2">{otherService.icon}</span>
                  <span className="font-medium text-slate-900 group-hover:text-emerald-600 text-sm">
                    {otherService.name} in {city.name}
                  </span>
                </Link>
              ))}
            </div>
          </div>
        </section>

        {/* CTA Section */}
        <section className="py-12 sm:py-16 bg-gradient-to-r from-emerald-600 to-teal-600 text-white">
          <div className="container mx-auto px-4 text-center">
            <h2 className="text-2xl sm:text-3xl font-bold mb-4">
              Need a {service.title} in {city.name}?
            </h2>
            <p className="text-emerald-100 mb-8 max-w-xl mx-auto">
              Get verified {service.titlePlural.toLowerCase()} at your doorstep. 
              {service.avgRating}★ rated service with {service.totalJobs.toLocaleString()}+ jobs completed in {city.state}.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link href="/customer/new-request">
                <Button size="lg" className="bg-white text-emerald-700 hover:bg-emerald-50 font-semibold text-lg px-8">
                  Book {service.name} Now
                </Button>
              </Link>
              <Link href="tel:+91XXXXXXXXXX">
                <Button size="lg" variant="outline" className="border-white text-white hover:bg-white/10">
                  <Phone className="w-5 h-5 mr-2" />
                  Call for Instant Booking
                </Button>
              </Link>
            </div>
          </div>
        </section>
      </main>
    </>
  )
}
