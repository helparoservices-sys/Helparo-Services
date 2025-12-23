import { Metadata } from 'next'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { 
  SEO_SERVICES, 
  TARGET_CITIES, 
  getServiceBySlug, 
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
  Zap
} from 'lucide-react'
import { Button } from '@/components/ui/button'

interface PageProps {
  params: Promise<{ service: string }>
}

// Generate static params for all services
export async function generateStaticParams() {
  return SEO_SERVICES.map((service) => ({
    service: service.slug,
  }))
}

// Generate metadata for SEO
export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { service: serviceSlug } = await params
  const service = getServiceBySlug(serviceSlug)
  
  if (!service) {
    return { title: 'Service Not Found' }
  }

  const title = `${service.title} Near Me | Book ${service.titlePlural} Online | Helparo`
  const description = `Book verified ${service.titlePlural.toLowerCase()} near you. ${service.description} ⭐ ${service.avgRating} rated. Same-day service. ${service.priceRange}. Book now!`

  return {
    title,
    description,
    keywords: [
      ...service.keywords,
      `${service.slug} near me`,
      `${service.slug} service`,
      `best ${service.slug}`,
      `${service.slug} at home`,
      `book ${service.slug} online`,
    ],
    openGraph: {
      title,
      description,
      url: `${SITE_CONFIG.url}/services/${service.slug}`,
      siteName: SITE_CONFIG.name,
      images: [{ url: SITE_CONFIG.defaultImage, width: 1200, height: 630 }],
      locale: 'en_IN',
      type: 'website',
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description,
      images: [SITE_CONFIG.defaultImage],
    },
    alternates: {
      canonical: `${SITE_CONFIG.url}/services/${service.slug}`,
    },
  }
}

export default async function ServicePage({ params }: PageProps) {
  const { service: serviceSlug } = await params
  const service = getServiceBySlug(serviceSlug)

  if (!service) {
    notFound()
  }

  // JSON-LD Schema for Service
  const serviceSchema = {
    '@context': 'https://schema.org',
    '@type': 'Service',
    '@id': `${SITE_CONFIG.url}/services/${service.slug}#service`,
    name: `${service.name} Services`,
    description: service.description,
    provider: {
      '@type': 'LocalBusiness',
      '@id': `${SITE_CONFIG.url}/#business`,
      name: SITE_CONFIG.name,
    },
    areaServed: TARGET_CITIES.map(city => ({
      '@type': 'City',
      name: city.name,
      addressRegion: city.state,
      addressCountry: 'IN',
    })),
    hasOfferCatalog: {
      '@type': 'OfferCatalog',
      name: `${service.name} Services`,
      itemListElement: service.subServices.map((subService, index) => ({
        '@type': 'Offer',
        itemOffered: {
          '@type': 'Service',
          name: subService,
        },
        position: index + 1,
      })),
    },
    aggregateRating: {
      '@type': 'AggregateRating',
      ratingValue: service.avgRating,
      ratingCount: service.totalJobs,
      bestRating: 5,
      worstRating: 1,
    },
  }

  const breadcrumbSchema = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: [
      { '@type': 'ListItem', position: 1, name: 'Home', item: SITE_CONFIG.url },
      { '@type': 'ListItem', position: 2, name: 'Services', item: `${SITE_CONFIG.url}/services` },
      { '@type': 'ListItem', position: 3, name: service.name, item: `${SITE_CONFIG.url}/services/${service.slug}` },
    ],
  }

  return (
    <>
      {/* JSON-LD Structured Data */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(serviceSchema) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbSchema) }}
      />

      <main className="min-h-screen bg-gradient-to-b from-slate-50 to-white">
        {/* Hero Section */}
        <section className="relative bg-gradient-to-br from-emerald-600 via-teal-600 to-cyan-700 text-white py-12 sm:py-20">
          <div className="absolute inset-0 bg-[url('/pattern.svg')] opacity-10" />
          <div className="container mx-auto px-4 relative">
            {/* Breadcrumb */}
            <nav className="flex items-center gap-2 text-sm text-emerald-100 mb-6" aria-label="Breadcrumb">
              <Link href="/" className="hover:text-white">Home</Link>
              <ChevronRight className="w-4 h-4" />
              <Link href="/services" className="hover:text-white">Services</Link>
              <ChevronRight className="w-4 h-4" />
              <span className="text-white font-medium">{service.name}</span>
            </nav>

            <div className="max-w-4xl">
              <div className="flex items-center gap-3 mb-4">
                <span className="text-5xl">{service.icon}</span>
                <div>
                  <h1 className="text-3xl sm:text-4xl md:text-5xl font-bold">
                    {service.title} Near Me
                  </h1>
                  <p className="text-emerald-100 text-lg mt-1">
                    Book verified {service.titlePlural.toLowerCase()} at your doorstep
                  </p>
                </div>
              </div>

              <p className="text-lg sm:text-xl text-emerald-50 mb-6 max-w-2xl">
                {service.description}
              </p>

              {/* Trust Badges */}
              <div className="flex flex-wrap gap-4 mb-8">
                <div className="flex items-center gap-2 bg-white/10 backdrop-blur-sm rounded-full px-4 py-2">
                  <Star className="w-5 h-5 text-yellow-400 fill-yellow-400" />
                  <span className="font-semibold">{service.avgRating} Rating</span>
                </div>
                <div className="flex items-center gap-2 bg-white/10 backdrop-blur-sm rounded-full px-4 py-2">
                  <Users className="w-5 h-5" />
                  <span>{service.totalJobs.toLocaleString()}+ Jobs Done</span>
                </div>
                <div className="flex items-center gap-2 bg-white/10 backdrop-blur-sm rounded-full px-4 py-2">
                  <BadgeCheck className="w-5 h-5 text-green-400" />
                  <span>Verified Professionals</span>
                </div>
              </div>

              <div className="flex flex-col sm:flex-row gap-4">
                <Link href="/customer/new-request">
                  <Button size="lg" className="bg-white text-emerald-700 hover:bg-emerald-50 font-semibold text-lg px-8">
                    Book Now - {service.priceRange}
                  </Button>
                </Link>
                <Link href="tel:+91XXXXXXXXXX">
                  <Button size="lg" variant="outline" className="border-white text-white hover:bg-white/10">
                    <Phone className="w-5 h-5 mr-2" />
                    Call for Booking
                  </Button>
                </Link>
              </div>
            </div>
          </div>
        </section>

        {/* Services Offered */}
        <section className="py-12 sm:py-16 container mx-auto px-4">
          <h2 className="text-2xl sm:text-3xl font-bold text-slate-900 mb-8 text-center">
            Our {service.name} Services
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {service.subServices.map((subService, index) => (
              <div 
                key={index}
                className="bg-white rounded-xl p-6 border border-slate-200 shadow-sm hover:shadow-md transition-shadow"
              >
                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 rounded-full bg-emerald-100 flex items-center justify-center flex-shrink-0">
                    <CheckCircle className="w-5 h-5 text-emerald-600" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-slate-900">{subService}</h3>
                    <p className="text-sm text-slate-600 mt-1">
                      Professional {subService.toLowerCase()} service at your doorstep
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* City-wise Service Pages - Important for Local SEO */}
        <section className="py-12 sm:py-16 bg-slate-50">
          <div className="container mx-auto px-4">
            <h2 className="text-2xl sm:text-3xl font-bold text-slate-900 mb-4 text-center">
              {service.title} in Your City
            </h2>
            <p className="text-slate-600 text-center mb-8 max-w-2xl mx-auto">
              We provide {service.name.toLowerCase()} services in major Indian cities. 
              Find trusted {service.titlePlural.toLowerCase()} near you.
            </p>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              {TARGET_CITIES.map((city) => (
                <Link
                  key={city.slug}
                  href={`/services/${service.slug}/${city.slug}`}
                  className="bg-white rounded-xl p-4 border border-slate-200 hover:border-emerald-500 hover:shadow-md transition-all group"
                >
                  <div className="flex items-center gap-2">
                    <MapPin className="w-4 h-4 text-emerald-600" />
                    <span className="font-medium text-slate-900 group-hover:text-emerald-600">
                      {city.name}
                    </span>
                  </div>
                  <p className="text-xs text-slate-500 mt-1">
                    {service.title} in {city.name}
                  </p>
                </Link>
              ))}
            </div>
          </div>
        </section>

        {/* Why Choose Us */}
        <section className="py-12 sm:py-16 container mx-auto px-4">
          <h2 className="text-2xl sm:text-3xl font-bold text-slate-900 mb-8 text-center">
            Why Choose Helparo for {service.name}?
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {[
              { icon: Shield, title: 'Verified Professionals', desc: 'Background checked & ID verified' },
              { icon: Clock, title: 'Same Day Service', desc: 'Get help within 30 mins - 2 hours' },
              { icon: Star, title: 'Quality Guaranteed', desc: '100% satisfaction or free redo' },
              { icon: Zap, title: 'Transparent Pricing', desc: 'No hidden charges, pay after service' },
            ].map((feature, index) => (
              <div key={index} className="text-center">
                <div className="w-14 h-14 rounded-full bg-emerald-100 flex items-center justify-center mx-auto mb-4">
                  <feature.icon className="w-7 h-7 text-emerald-600" />
                </div>
                <h3 className="font-semibold text-slate-900 mb-2">{feature.title}</h3>
                <p className="text-sm text-slate-600">{feature.desc}</p>
              </div>
            ))}
          </div>
        </section>

        {/* FAQ Section for SEO */}
        <section className="py-12 sm:py-16 bg-slate-50">
          <div className="container mx-auto px-4 max-w-3xl">
            <h2 className="text-2xl sm:text-3xl font-bold text-slate-900 mb-8 text-center">
              Frequently Asked Questions
            </h2>
            <div className="space-y-4">
              {[
                {
                  q: `How do I book a ${service.title.toLowerCase()} on Helparo?`,
                  a: `Simply visit our website or app, select "${service.name}" from services, enter your location, describe your issue, and book. We'll assign a verified ${service.title.toLowerCase()} within minutes.`
                },
                {
                  q: `What is the cost of ${service.name.toLowerCase()} services?`,
                  a: `${service.name} services typically range from ${service.priceRange}. Exact pricing depends on the specific service needed. You'll see the price estimate before booking.`
                },
                {
                  q: `Are your ${service.titlePlural.toLowerCase()} verified?`,
                  a: `Yes! All our ${service.titlePlural.toLowerCase()} undergo thorough background verification, skill assessment, and ID verification before joining Helparo.`
                },
                {
                  q: `Do you provide same-day ${service.name.toLowerCase()} service?`,
                  a: `Yes, we offer same-day service in most cases. Our ${service.titlePlural.toLowerCase()} can reach you within 30 minutes to 2 hours of booking.`
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

        {/* CTA Section */}
        <section className="py-12 sm:py-16 bg-gradient-to-r from-emerald-600 to-teal-600 text-white">
          <div className="container mx-auto px-4 text-center">
            <h2 className="text-2xl sm:text-3xl font-bold mb-4">
              Need a {service.title} Now?
            </h2>
            <p className="text-emerald-100 mb-8 max-w-xl mx-auto">
              Get verified {service.titlePlural.toLowerCase()} at your doorstep in under 2 hours. 
              {service.avgRating}★ rated service with transparent pricing.
            </p>
            <Link href="/customer/new-request">
              <Button size="lg" className="bg-white text-emerald-700 hover:bg-emerald-50 font-semibold text-lg px-8">
                Book {service.name} Service Now
              </Button>
            </Link>
          </div>
        </section>
      </main>
    </>
  )
}
