// JSON-LD Structured Data for SEO
// This helps Google understand your business and show rich snippets

export function OrganizationSchema() {
  const schema = {
    "@context": "https://schema.org",
    "@type": "Organization",
    "name": "Helparo",
    "description": "On-demand home services platform connecting customers with verified local professionals",
    "url": "https://helparo.in",
    "logo": "https://helparo.in/logo.png",
    "sameAs": [
      "https://www.facebook.com/helparo",
      "https://www.instagram.com/helparo",
      "https://twitter.com/helparo"
    ],
    "contactPoint": {
      "@type": "ContactPoint",
      "telephone": "+91-XXXXXXXXXX",
      "contactType": "customer service",
      "availableLanguage": ["English", "Hindi", "Telugu"]
    },
    "areaServed": {
      "@type": "Country",
      "name": "India"
    }
  }

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
    />
  )
}

export function LocalBusinessSchema() {
  const schema = {
    "@context": "https://schema.org",
    "@type": "LocalBusiness",
    "@id": "https://helparo.in",
    "name": "Helparo - Home Services",
    "description": "Book verified plumbers, electricians, cleaners, carpenters and more. Instant booking, secure payments, 100% satisfaction guaranteed.",
    "url": "https://helparo.in",
    "telephone": "+91-XXXXXXXXXX",
    "priceRange": "₹₹",
    "address": {
      "@type": "PostalAddress",
      "addressLocality": "Hyderabad",
      "addressRegion": "Telangana",
      "addressCountry": "IN"
    },
    "geo": {
      "@type": "GeoCoordinates",
      "latitude": "17.385044",
      "longitude": "78.486671"
    },
    "openingHoursSpecification": {
      "@type": "OpeningHoursSpecification",
      "dayOfWeek": [
        "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"
      ],
      "opens": "06:00",
      "closes": "23:00"
    },
    "aggregateRating": {
      "@type": "AggregateRating",
      "ratingValue": "4.8",
      "reviewCount": "1000"
    }
  }

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
    />
  )
}

export function WebsiteSchema() {
  const schema = {
    "@context": "https://schema.org",
    "@type": "WebSite",
    "name": "Helparo",
    "url": "https://helparo.in",
    "description": "On-demand home services - Book plumbers, electricians, cleaners, carpenters and more",
    "potentialAction": {
      "@type": "SearchAction",
      "target": "https://helparo.in/services?q={search_term_string}",
      "query-input": "required name=search_term_string"
    }
  }

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
    />
  )
}

interface ServiceSchemaProps {
  name: string
  description: string
  slug: string
  image?: string
}

export function ServiceSchema({ name, description, slug, image }: ServiceSchemaProps) {
  const schema = {
    "@context": "https://schema.org",
    "@type": "Service",
    "serviceType": name,
    "name": `${name} Services in India`,
    "description": description,
    "url": `https://helparo.in/services/${slug}`,
    "provider": {
      "@type": "Organization",
      "name": "Helparo"
    },
    "areaServed": {
      "@type": "Country",
      "name": "India"
    },
    "hasOfferCatalog": {
      "@type": "OfferCatalog",
      "name": `${name} Services`,
      "itemListElement": [
        {
          "@type": "Offer",
          "itemOffered": {
            "@type": "Service",
            "name": `${name} Repair`,
            "description": `Professional ${name.toLowerCase()} repair services`
          }
        },
        {
          "@type": "Offer",
          "itemOffered": {
            "@type": "Service",
            "name": `${name} Installation`,
            "description": `Expert ${name.toLowerCase()} installation services`
          }
        }
      ]
    },
    ...(image && { "image": image })
  }

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
    />
  )
}

export function FAQSchema({ faqs }: { faqs: { question: string; answer: string }[] }) {
  const schema = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    "mainEntity": faqs.map(faq => ({
      "@type": "Question",
      "name": faq.question,
      "acceptedAnswer": {
        "@type": "Answer",
        "text": faq.answer
      }
    }))
  }

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
    />
  )
}

export function BreadcrumbSchema({ items }: { items: { name: string; url: string }[] }) {
  const schema = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    "itemListElement": items.map((item, index) => ({
      "@type": "ListItem",
      "position": index + 1,
      "name": item.name,
      "item": item.url
    }))
  }

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
    />
  )
}

// Combined schema for homepage - includes all relevant schemas
export function HomepageSchema() {
  return (
    <>
      <OrganizationSchema />
      <LocalBusinessSchema />
      <WebsiteSchema />
      <FAQSchema faqs={[
        {
          question: "How do I book a service on Helparo?",
          answer: "Simply browse services, select what you need, choose a time slot, and book. Our verified professionals will arrive at your doorstep."
        },
        {
          question: "Are Helparo professionals verified?",
          answer: "Yes! All our helpers undergo thorough background verification, skill assessment, and ID verification before joining our platform."
        },
        {
          question: "What payment methods does Helparo accept?",
          answer: "We accept Cash, UPI, and Card payments. You can choose your preferred payment method during or after the service."
        },
        {
          question: "What if I'm not satisfied with the service?",
          answer: "We offer a 100% satisfaction guarantee. If you're not happy with the service, contact us and we'll make it right or refund your money."
        },
        {
          question: "Which cities does Helparo operate in?",
          answer: "Helparo currently operates in major Indian cities including Hyderabad, Bangalore, Mumbai, Delhi, Chennai, Pune, and more cities coming soon."
        },
        {
          question: "How quickly can I get a helper?",
          answer: "With our instant booking feature, you can get a helper within 30 minutes to 2 hours depending on availability in your area."
        }
      ]} />
    </>
  )
}
