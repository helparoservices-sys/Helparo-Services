'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { 
  Search,
  Shield,
  CreditCard,
  Star,
  ChevronRight,
  Sparkles,
  Zap,
  Home,
  Bug,
  Truck,
  Car,
  GraduationCap,
  PartyPopper,
  TreePine,
  Laptop,
  Dog,
  Shirt,
  Heart,
  ArrowRight
} from 'lucide-react'

// Service categories with icons and colors
const serviceCategories = [
  {
    id: 'home-services',
    name: 'Home Services',
    description: 'All home maintenance and repair services',
    icon: Home,
    color: 'from-blue-500 to-blue-600',
    borderColor: 'border-blue-100',
    services: [
      'AC Repair & Service',
      'Appliance Repair',
      'Carpentry',
      'Electrical Work',
      'Painting',
      'Plumbing'
    ]
  },
  {
    id: 'cleaning',
    name: 'Cleaning Services',
    description: 'Professional cleaning for homes and offices',
    icon: Sparkles,
    color: 'from-emerald-500 to-teal-500',
    borderColor: 'border-emerald-100',
    services: [
      'Bathroom Cleaning',
      'House Cleaning',
      'Kitchen Cleaning',
      'Office Cleaning',
      'Sofa & Carpet Cleaning',
      'Window Cleaning'
    ]
  },
  {
    id: 'beauty',
    name: 'Beauty & Wellness',
    description: 'Personal care and beauty services at home',
    icon: Heart,
    color: 'from-pink-500 to-rose-500',
    borderColor: 'border-pink-100',
    services: [
      'Facial Treatment',
      'Haircut & Styling',
      'Makeup Artist',
      'Manicure & Pedicure',
      'Massage Therapy',
      'Waxing & Threading'
    ]
  },
  {
    id: 'car-services',
    name: 'Car Services',
    description: 'Vehicle maintenance and repair services',
    icon: Car,
    color: 'from-slate-600 to-slate-700',
    borderColor: 'border-slate-100',
    services: [
      'Battery Service',
      'Car AC Service',
      'Car Repair',
      'Car Wash',
      'Denting & Painting',
      'Tire Service'
    ]
  },
  {
    id: 'computer',
    name: 'Computer & IT Services',
    description: 'Technology repair and IT support',
    icon: Laptop,
    color: 'from-violet-500 to-purple-600',
    borderColor: 'border-violet-100',
    services: [
      'Data Recovery',
      'Desktop Repair',
      'Laptop Repair',
      'Network Setup',
      'Printer Repair',
      'Software Installation'
    ]
  },
  {
    id: 'events',
    name: 'Event Services',
    description: 'Party planning and event management',
    icon: PartyPopper,
    color: 'from-orange-500 to-amber-500',
    borderColor: 'border-orange-100',
    services: [
      'Birthday Party Planning',
      'Catering Service',
      'Decoration Service',
      'Entertainment',
      'Photography & Videography',
      'Wedding Planning'
    ]
  },
  {
    id: 'gardening',
    name: 'Gardening & Landscaping',
    description: 'Garden maintenance and outdoor services',
    icon: TreePine,
    color: 'from-green-500 to-green-600',
    borderColor: 'border-green-100',
    services: [
      'Garden Design',
      'Garden Pest Control',
      'Irrigation System',
      'Lawn Mowing',
      'Plant Care',
      'Tree Trimming'
    ]
  },
  {
    id: 'laundry',
    name: 'Laundry Services',
    description: 'Washing, ironing, and dry cleaning',
    icon: Shirt,
    color: 'from-cyan-500 to-cyan-600',
    borderColor: 'border-cyan-100',
    services: [
      'Carpet & Curtain Cleaning',
      'Dry Cleaning',
      'Iron Only',
      'Shoe Cleaning',
      'Steam Press',
      'Wash & Iron'
    ]
  },
  {
    id: 'moving',
    name: 'Moving & Packing',
    description: 'Relocation and packing services',
    icon: Truck,
    color: 'from-amber-500 to-yellow-500',
    borderColor: 'border-amber-100',
    services: [
      'Furniture Moving',
      'Intercity Moving',
      'Local Shifting',
      'Office Relocation',
      'Packing Services',
      'Vehicle Transport'
    ]
  },
  {
    id: 'pest-control',
    name: 'Pest Control',
    description: 'Professional pest and insect control services',
    icon: Bug,
    color: 'from-red-500 to-rose-600',
    borderColor: 'border-red-100',
    services: [
      'Bed Bug Control',
      'Cockroach Control',
      'General Pest Control',
      'Mosquito Control',
      'Rodent Control',
      'Termite Control'
    ]
  },
  {
    id: 'pet-care',
    name: 'Pet Care',
    description: 'Pet grooming, training, and care services',
    icon: Dog,
    color: 'from-yellow-500 to-orange-500',
    borderColor: 'border-yellow-100',
    services: [
      'Dog Walking',
      'Pet Grooming',
      'Pet Sitting',
      'Pet Taxi',
      'Pet Training',
      'Vet Consultation'
    ]
  },
  {
    id: 'tutoring',
    name: 'Tutoring & Training',
    description: 'Educational and skill development services',
    icon: GraduationCap,
    color: 'from-indigo-500 to-indigo-600',
    borderColor: 'border-indigo-100',
    services: [
      'Academic Tutoring',
      'Cooking Classes',
      'Dance Classes',
      'Language Classes',
      'Music Lessons',
      'Yoga & Fitness'
    ]
  }
]

export default function ServicesPage() {
  const [searchQuery, setSearchQuery] = useState('')
  const [isScrolled, setIsScrolled] = useState(false)

  useEffect(() => {
    const handleScroll = () => setIsScrolled(window.scrollY > 20)
    window.addEventListener('scroll', handleScroll)
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  const filteredCategories = serviceCategories.filter(cat => {
    const query = searchQuery.toLowerCase()
    return (
      cat.name.toLowerCase().includes(query) ||
      cat.description.toLowerCase().includes(query) ||
      cat.services.some(s => s.toLowerCase().includes(query))
    )
  })

  return (
    <div className="min-h-screen bg-white">
      {/* Premium Header with Back Navigation */}
      <header className={`fixed top-0 left-0 right-0 z-50 transition-all duration-500 ${
        isScrolled 
          ? 'bg-white/80 backdrop-blur-2xl shadow-[0_2px_40px_-12px_rgba(0,0,0,0.1)] border-b border-gray-100' 
          : 'bg-white/50 backdrop-blur-xl'
      }`}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16 lg:h-20">
            {/* Logo */}
            <Link href="/" className="flex items-center gap-2.5 group">
              <div className="w-10 h-10 rounded-[12px] bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center shadow-lg shadow-emerald-500/20 group-hover:scale-105 transition-transform">
                <span className="text-white font-black text-lg">H</span>
              </div>
              <span className="text-xl font-extrabold text-gray-900 hidden sm:block">helparo</span>
            </Link>

            {/* Search Bar - Desktop */}
            <div className="hidden md:flex flex-1 max-w-xl mx-8">
              <div className="relative w-full">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search for services..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-12 pr-4 py-3 rounded-2xl border-2 border-gray-100 bg-gray-50/50 focus:bg-white focus:border-emerald-200 focus:ring-4 focus:ring-emerald-100 outline-none transition-all text-sm font-medium placeholder:text-gray-400"
                />
              </div>
            </div>

            {/* CTA */}
            <div className="flex items-center gap-3">
              <Button variant="ghost" className="hidden sm:flex text-gray-700 hover:text-emerald-600 font-semibold rounded-xl" asChild>
                <Link href="/auth/login">Log in</Link>
              </Button>
              <Button className="bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl px-5 font-semibold shadow-lg shadow-emerald-500/20 hover:shadow-emerald-500/30 hover:scale-[1.02] transition-all" asChild>
                <Link href="/auth/signup">Book Now</Link>
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="pt-28 lg:pt-36 pb-12 lg:pb-16 bg-gradient-to-b from-emerald-50/50 to-white relative overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_80%_50%_at_50%_-20%,rgba(16,185,129,0.1),transparent)]" />
        
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative">
          <div className="text-center max-w-3xl mx-auto">
            {/* Breadcrumb */}
            <div className="flex items-center justify-center gap-2 text-sm text-gray-500 mb-6">
              <Link href="/" className="hover:text-emerald-600 transition-colors">Home</Link>
              <ChevronRight className="w-4 h-4" />
              <span className="text-gray-900 font-medium">All Services</span>
            </div>

            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-black text-gray-900 mb-6 leading-tight">
              Find the perfect
              <br />
              <span className="bg-gradient-to-r from-emerald-600 to-teal-500 bg-clip-text text-transparent">service for you</span>
            </h1>
            
            <p className="text-lg sm:text-xl text-gray-500 mb-10 max-w-2xl mx-auto">
              Explore 50+ services delivered by verified professionals. Book in seconds, get help in minutes.
            </p>

            {/* Mobile Search */}
            <div className="md:hidden relative max-w-md mx-auto mb-8">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="text"
                placeholder="Search for services..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-12 pr-4 py-4 rounded-2xl border-2 border-gray-100 bg-white focus:border-emerald-200 focus:ring-4 focus:ring-emerald-100 outline-none transition-all text-base font-medium placeholder:text-gray-400 shadow-lg shadow-gray-100"
              />
            </div>

            {/* Trust Badges */}
            <div className="flex flex-wrap items-center justify-center gap-4 sm:gap-6">
              <div className="flex items-center gap-2 bg-white rounded-full px-4 py-2 shadow-sm border border-gray-100">
                <div className="w-8 h-8 rounded-lg bg-emerald-100 flex items-center justify-center">
                  <Shield className="w-4 h-4 text-emerald-600" />
                </div>
                <span className="text-sm font-semibold text-gray-700">SSL Secured</span>
              </div>
              <div className="flex items-center gap-2 bg-white rounded-full px-4 py-2 shadow-sm border border-gray-100">
                <div className="w-8 h-8 rounded-lg bg-blue-100 flex items-center justify-center">
                  <CreditCard className="w-4 h-4 text-blue-600" />
                </div>
                <span className="text-sm font-semibold text-gray-700">Payment Protected</span>
              </div>
              <div className="flex items-center gap-2 bg-white rounded-full px-4 py-2 shadow-sm border border-gray-100">
                <div className="w-8 h-8 rounded-lg bg-amber-100 flex items-center justify-center">
                  <Star className="w-4 h-4 text-amber-600 fill-amber-600" />
                </div>
                <span className="text-sm font-semibold text-gray-700">4.9 Rating</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Quick Stats */}
      <section className="py-6 border-y border-gray-100 bg-gray-50/50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-wrap items-center justify-center gap-8 lg:gap-16 text-center">
            <div>
              <p className="text-2xl lg:text-3xl font-black text-gray-900">50+</p>
              <p className="text-sm text-gray-500 font-medium">Services</p>
            </div>
            <div className="hidden sm:block w-px h-10 bg-gray-200" />
            <div>
              <p className="text-2xl lg:text-3xl font-black text-gray-900">10K+</p>
              <p className="text-sm text-gray-500 font-medium">Verified Pros</p>
            </div>
            <div className="hidden sm:block w-px h-10 bg-gray-200" />
            <div>
              <p className="text-2xl lg:text-3xl font-black text-emerald-600">30 min</p>
              <p className="text-sm text-gray-500 font-medium">Avg. Arrival</p>
            </div>
            <div className="hidden sm:block w-px h-10 bg-gray-200" />
            <div>
              <p className="text-2xl lg:text-3xl font-black text-gray-900">98%</p>
              <p className="text-sm text-gray-500 font-medium">Satisfaction</p>
            </div>
          </div>
        </div>
      </section>

      {/* Services Grid */}
      <section className="py-16 lg:py-24">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Section Header */}
          <div className="flex items-center justify-between mb-12">
            <div>
              <h2 className="text-2xl lg:text-3xl font-bold text-gray-900 mb-2">All Categories</h2>
              <p className="text-gray-500">Browse {filteredCategories.length} service categories</p>
            </div>
          </div>

          {/* Categories Grid */}
          {filteredCategories.length > 0 ? (
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredCategories.map((category) => {
                const IconComponent = category.icon
                return (
                  <div 
                    key={category.id}
                    className={`group relative bg-white rounded-3xl p-6 border-2 ${category.borderColor} hover:border-transparent hover:shadow-2xl hover:shadow-gray-200/50 transition-all duration-300 hover:-translate-y-1`}
                  >
                    {/* Icon */}
                    <div className={`w-14 h-14 rounded-2xl bg-gradient-to-br ${category.color} flex items-center justify-center mb-5 shadow-lg group-hover:scale-110 transition-transform duration-300`}>
                      <IconComponent className="w-7 h-7 text-white" />
                    </div>

                    {/* Category Info */}
                    <h3 className="text-xl font-bold text-gray-900 mb-2">{category.name}</h3>
                    <p className="text-sm text-gray-500 mb-5">{category.description}</p>

                    {/* Services List */}
                    <div className="space-y-2 mb-6">
                      {category.services.map((service) => (
                        <Link
                          key={service}
                          href={`/auth/signup?service=${encodeURIComponent(service.toLowerCase())}`}
                          className="flex items-center text-sm text-gray-600 hover:text-emerald-600 transition-colors group/link"
                        >
                          <ChevronRight className="w-4 h-4 mr-1 text-gray-300 group-hover/link:text-emerald-500 group-hover/link:translate-x-1 transition-all" />
                          {service}
                        </Link>
                      ))}
                    </div>

                    {/* View All Link */}
                    <Link
                      href={`/auth/signup?category=${encodeURIComponent(category.name.toLowerCase())}`}
                      className="inline-flex items-center text-sm font-semibold text-emerald-600 hover:text-emerald-700 group/btn"
                    >
                      View all services
                      <ArrowRight className="w-4 h-4 ml-1 group-hover/btn:translate-x-1 transition-transform" />
                    </Link>
                  </div>
                )
              })}
            </div>
          ) : (
            <div className="text-center py-20">
              <div className="w-20 h-20 rounded-full bg-gray-100 flex items-center justify-center mx-auto mb-6">
                <Search className="w-10 h-10 text-gray-300" />
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-2">No services found</h3>
              <p className="text-gray-500 mb-6">Try searching with different keywords</p>
              <Button 
                variant="outline" 
                onClick={() => setSearchQuery('')}
                className="rounded-xl"
              >
                Clear search
              </Button>
            </div>
          )}
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-16 lg:py-24 bg-gradient-to-br from-emerald-600 via-emerald-600 to-teal-600 text-white relative overflow-hidden">
        <div className="absolute inset-0 bg-[url('data:image/svg+xml,%3Csvg%20width%3D%2260%22%20height%3D%2260%22%20viewBox%3D%220%200%2060%2060%22%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%3E%3Cg%20fill%3D%22none%22%20fill-rule%3D%22evenodd%22%3E%3Cg%20fill%3D%22%23ffffff%22%20fill-opacity%3D%220.05%22%3E%3Cpath%20d%3D%22M36%2034v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6%2034v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6%204V0H4v4H0v2h4v4h2V6h4V4H6z%22%2F%3E%3C%2Fg%3E%3C%2Fg%3E%3C%2Fsvg%3E')] opacity-30" />
        
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center relative">
          <div className="inline-flex items-center gap-2 bg-white/20 px-4 py-2 rounded-full text-sm font-semibold mb-6 backdrop-blur-sm">
            <Zap className="w-4 h-4" />
            Quick & Easy
          </div>
          
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-black mb-6">
            Can&apos;t find what you&apos;re looking for?
          </h2>
          <p className="text-lg sm:text-xl text-white/80 mb-10 max-w-2xl mx-auto">
            Tell us what you need and we&apos;ll connect you with the right professional.
          </p>
          
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button 
              size="lg" 
              className="bg-white text-emerald-700 hover:bg-gray-100 rounded-2xl px-8 h-14 text-base font-bold shadow-xl hover:scale-105 transition-all" 
              asChild
            >
              <Link href="/auth/signup">
                Get Started Free
                <ArrowRight className="ml-2 w-5 h-5" />
              </Link>
            </Button>
            <Button 
              size="lg" 
              className="bg-white/10 hover:bg-white/20 text-white border border-white/20 rounded-2xl px-8 h-14 text-base font-semibold backdrop-blur-sm transition-all hover:scale-105" 
              asChild
            >
              <Link href="/contact">Contact Support</Link>
            </Button>
          </div>
        </div>
      </section>

      {/* Footer Mini */}
      <footer className="py-8 bg-gray-50 border-t border-gray-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
            <Link href="/" className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center">
                <span className="text-white font-black text-sm">H</span>
              </div>
              <span className="text-lg font-bold text-gray-900">helparo</span>
            </Link>
            
            <div className="flex items-center gap-6 text-sm text-gray-500">
              <Link href="/about" className="hover:text-emerald-600 transition-colors">About</Link>
              <Link href="/contact" className="hover:text-emerald-600 transition-colors">Contact</Link>
              <Link href="/legal/terms" className="hover:text-emerald-600 transition-colors">Terms</Link>
              <Link href="/legal/privacy" className="hover:text-emerald-600 transition-colors">Privacy</Link>
            </div>
            
            <p className="text-sm text-gray-500">© {new Date().getFullYear()} Helparo</p>
          </div>
        </div>
      </footer>
    </div>
  )
}
