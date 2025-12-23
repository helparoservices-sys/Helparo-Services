/**
 * SEO Configuration for Helparo
 * 
 * This file contains all SEO-related constants, city data, and service definitions
 * used across the application for consistent SEO optimization.
 */

// Target cities for local SEO (expand as you launch in new cities)
export const TARGET_CITIES = [
  {
    slug: 'guntur',
    name: 'Guntur',
    state: 'Andhra Pradesh',
    stateCode: 'AP',
    coordinates: { lat: 16.3067, lng: 80.4365 },
    population: '743000',
    areaServed: ['Guntur', 'Mangalagiri', 'Tenali', 'Narasaraopet', 'Chilakaluripet'],
    postalCodes: ['522001', '522002', '522003', '522004', '522005'],
  },
  {
    slug: 'vijayawada',
    name: 'Vijayawada',
    state: 'Andhra Pradesh',
    stateCode: 'AP',
    coordinates: { lat: 16.5062, lng: 80.6480 },
    population: '1048000',
    areaServed: ['Vijayawada', 'Benz Circle', 'Governorpet', 'Labbipet', 'Moghalrajpuram'],
    postalCodes: ['520001', '520002', '520003', '520004', '520010'],
  },
  {
    slug: 'hyderabad',
    name: 'Hyderabad',
    state: 'Telangana',
    stateCode: 'TS',
    coordinates: { lat: 17.3850, lng: 78.4867 },
    population: '10534000',
    areaServed: ['Hyderabad', 'Secunderabad', 'Gachibowli', 'Madhapur', 'Kukatpally', 'Begumpet'],
    postalCodes: ['500001', '500003', '500004', '500008', '500016'],
  },
  {
    slug: 'bangalore',
    name: 'Bangalore',
    state: 'Karnataka',
    stateCode: 'KA',
    coordinates: { lat: 12.9716, lng: 77.5946 },
    population: '12765000',
    areaServed: ['Bangalore', 'Whitefield', 'Koramangala', 'Indiranagar', 'HSR Layout', 'Electronic City'],
    postalCodes: ['560001', '560002', '560003', '560004', '560008'],
  },
] as const

export type CitySlug = typeof TARGET_CITIES[number]['slug']

// Service categories for SEO-optimized pages
export const SEO_SERVICES = [
  {
    slug: 'plumbing',
    name: 'Plumbing',
    title: 'Plumber',
    titlePlural: 'Plumbers',
    description: 'Professional plumbing services including leak repair, pipe fitting, bathroom fixtures, water heater installation, and emergency plumbing.',
    shortDesc: 'Expert plumbers for all your water and pipe needs',
    keywords: ['plumber', 'plumbing', 'leak repair', 'pipe fitting', 'tap repair', 'water heater', 'bathroom plumber', 'emergency plumber'],
    subServices: ['Tap & Faucet Repair', 'Pipe Leak Repair', 'Toilet Repair', 'Water Heater Installation', 'Drain Cleaning', 'Bathroom Fitting'],
    icon: '🔧',
    avgRating: 4.8,
    totalJobs: 12500,
    priceRange: '₹199 - ₹2999',
  },
  {
    slug: 'electrician',
    name: 'Electrical',
    title: 'Electrician',
    titlePlural: 'Electricians',
    description: 'Licensed electricians for wiring, switch installation, fan repair, MCB installation, and all electrical safety needs.',
    shortDesc: 'Certified electricians for safe electrical work',
    keywords: ['electrician', 'electrical repair', 'wiring', 'switch repair', 'fan installation', 'MCB', 'electrical safety', 'power backup'],
    subServices: ['Switch & Socket Repair', 'Fan Installation', 'Wiring Work', 'MCB & Fuse Repair', 'Inverter Installation', 'Light Fixtures'],
    icon: '⚡',
    avgRating: 4.7,
    totalJobs: 15200,
    priceRange: '₹149 - ₹4999',
  },
  {
    slug: 'cleaning',
    name: 'Cleaning',
    title: 'Cleaning Service',
    titlePlural: 'Cleaning Services',
    description: 'Professional house cleaning, deep cleaning, bathroom cleaning, kitchen cleaning by trained and verified cleaners.',
    shortDesc: 'Spotless cleaning by verified professionals',
    keywords: ['cleaning service', 'house cleaning', 'deep cleaning', 'bathroom cleaning', 'kitchen cleaning', 'home cleaner', 'maid service'],
    subServices: ['Full House Cleaning', 'Bathroom Deep Cleaning', 'Kitchen Cleaning', 'Sofa Cleaning', 'Carpet Cleaning', 'Window Cleaning'],
    icon: '🧹',
    avgRating: 4.9,
    totalJobs: 18900,
    priceRange: '₹499 - ₹3999',
  },
  {
    slug: 'ac-repair',
    name: 'AC Repair',
    title: 'AC Repair',
    titlePlural: 'AC Repair Services',
    description: 'Expert AC repair, servicing, gas refilling, installation and maintenance for all AC brands by certified technicians.',
    shortDesc: 'Complete AC care by certified technicians',
    keywords: ['AC repair', 'AC service', 'AC gas filling', 'AC installation', 'split AC', 'window AC', 'AC maintenance', 'air conditioner repair'],
    subServices: ['AC Regular Service', 'AC Gas Refilling', 'AC Installation', 'AC Uninstallation', 'AC Deep Cleaning', 'AC Compressor Repair'],
    icon: '❄️',
    avgRating: 4.6,
    totalJobs: 9800,
    priceRange: '₹399 - ₹5999',
  },
  {
    slug: 'carpentry',
    name: 'Carpentry',
    title: 'Carpenter',
    titlePlural: 'Carpenters',
    description: 'Skilled carpenters for furniture repair, door fitting, bed assembly, wardrobe installation, and custom woodwork.',
    shortDesc: 'Expert carpenters for all woodwork needs',
    keywords: ['carpenter', 'carpentry', 'furniture repair', 'door repair', 'bed assembly', 'wardrobe', 'wood work', 'furniture assembly'],
    subServices: ['Furniture Repair', 'Door & Window Repair', 'Bed Assembly', 'Wardrobe Installation', 'Cabinet Work', 'Custom Furniture'],
    icon: '🪚',
    avgRating: 4.7,
    totalJobs: 7600,
    priceRange: '₹299 - ₹9999',
  },
  {
    slug: 'painting',
    name: 'Painting',
    title: 'Painter',
    titlePlural: 'Painters',
    description: 'Professional painting services for interior and exterior walls, texture painting, waterproofing, and wood polishing.',
    shortDesc: 'Transform your space with expert painters',
    keywords: ['painter', 'painting', 'house painting', 'wall painting', 'interior painting', 'exterior painting', 'texture painting', 'waterproofing'],
    subServices: ['Interior Painting', 'Exterior Painting', 'Texture Painting', 'Wood Polishing', 'Waterproofing', 'Wall Putty'],
    icon: '🎨',
    avgRating: 4.8,
    totalJobs: 5400,
    priceRange: '₹12 - ₹45 per sq.ft',
  },
  {
    slug: 'pest-control',
    name: 'Pest Control',
    title: 'Pest Control',
    titlePlural: 'Pest Control Services',
    description: 'Effective pest control for cockroaches, termites, bed bugs, rodents, and mosquitoes using safe chemicals.',
    shortDesc: 'Safe & effective pest elimination',
    keywords: ['pest control', 'cockroach control', 'termite treatment', 'bed bug control', 'rodent control', 'mosquito control', 'fumigation'],
    subServices: ['Cockroach Control', 'Termite Treatment', 'Bed Bug Control', 'Rodent Control', 'Mosquito Control', 'General Pest Control'],
    icon: '🐜',
    avgRating: 4.5,
    totalJobs: 4200,
    priceRange: '₹699 - ₹4999',
  },
  {
    slug: 'appliance-repair',
    name: 'Appliance Repair',
    title: 'Appliance Repair',
    titlePlural: 'Appliance Repair Services',
    description: 'Expert repair for washing machines, refrigerators, microwaves, geysers, and all home appliances.',
    shortDesc: 'Quick appliance repair by experts',
    keywords: ['appliance repair', 'washing machine repair', 'refrigerator repair', 'microwave repair', 'geyser repair', 'TV repair', 'RO repair'],
    subServices: ['Washing Machine Repair', 'Refrigerator Repair', 'Microwave Repair', 'Geyser Repair', 'Chimney Repair', 'RO Service'],
    icon: '🔌',
    avgRating: 4.6,
    totalJobs: 8100,
    priceRange: '₹299 - ₹3999',
  },
] as const

export type ServiceSlug = typeof SEO_SERVICES[number]['slug']

// Get service by slug
export function getServiceBySlug(slug: string) {
  return SEO_SERVICES.find(s => s.slug === slug)
}

// Get city by slug
export function getCityBySlug(slug: string) {
  return TARGET_CITIES.find(c => c.slug === slug)
}

// Generate all service-city combinations for sitemap
export function getAllServiceCityPairs() {
  const pairs: { service: string; city: string }[] = []
  for (const service of SEO_SERVICES) {
    for (const city of TARGET_CITIES) {
      pairs.push({ service: service.slug, city: city.slug })
    }
  }
  return pairs
}

// Site-wide SEO constants
export const SITE_CONFIG = {
  name: 'Helparo',
  tagline: 'Your Trusted Home Service Partner',
  url: 'https://helparo.in',
  phone: '+91-XXXXXXXXXX', // Add your actual phone
  email: 'support@helparo.in',
  foundingDate: '2024',
  socialLinks: {
    facebook: 'https://facebook.com/helparo',
    instagram: 'https://instagram.com/helparo',
    twitter: 'https://twitter.com/helparo',
    linkedin: 'https://linkedin.com/company/helparo',
  },
  defaultImage: '/og-image.png',
  logoUrl: '/logo.svg',
}
