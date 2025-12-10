'use client'

import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { 
  ArrowRight,
  Shield,
  Clock,
  Star,
  MapPin,
  CheckCircle,
  Phone,
  Zap,
  BadgeCheck,
  Play,
  ChevronRight,
  Sparkles
} from 'lucide-react'
import { useState, useEffect } from 'react'
import {
  PlumbingIcon,
  ElectricalIcon,
  CleaningIcon,
  CarpentryIcon,
  ACRepairIcon,
  PaintingIcon,
  AppliancesIcon,
  PestControlIcon
} from '@/components/ui/service-icons'

export default function LandingPage() {
  const [currentService, setCurrentService] = useState(0)
  const services = ['Plumber', 'Electrician', 'Cleaner', 'Carpenter', 'AC Repair']
  
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentService((prev) => (prev + 1) % 5)
    }, 2000)
    return () => clearInterval(interval)
  }, [])

  return (
    <div className="min-h-screen bg-white">
      {/* Header - Clean & Minimal like Zomato */}
      <header className="fixed top-0 left-0 right-0 z-50 bg-white/95 backdrop-blur-md border-b border-gray-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            {/* Logo */}
            <Link href="/" className="flex items-center gap-2">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center">
                <span className="text-white font-bold text-lg">H</span>
              </div>
              <span className="text-xl font-bold text-gray-900">Helparo</span>
            </Link>

            {/* Navigation */}
            <nav className="hidden md:flex items-center gap-8">
              <Link href="#services" className="text-sm font-medium text-gray-600 hover:text-gray-900 transition-colors">
                Services
              </Link>
              <Link href="#how-it-works" className="text-sm font-medium text-gray-600 hover:text-gray-900 transition-colors">
                How it works
              </Link>
              <Link href="#safety" className="text-sm font-medium text-gray-600 hover:text-gray-900 transition-colors">
                Safety
              </Link>
              <Link href="/helper/register" className="text-sm font-medium text-gray-600 hover:text-gray-900 transition-colors">
                Become a Helper
              </Link>
            </nav>

            {/* CTA Buttons */}
            <div className="flex items-center gap-3">
              <Button variant="ghost" size="sm" className="hidden sm:flex" asChild>
                <Link href="/auth/login">Log in</Link>
              </Button>
              <Button size="sm" className="bg-gray-900 hover:bg-gray-800 text-white rounded-full px-5" asChild>
                <Link href="/auth/signup">Sign up</Link>
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Hero Section - Modern & Bold */}
      <section className="pt-24 pb-16 lg:pt-32 lg:pb-24 overflow-hidden">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid lg:grid-cols-2 gap-12 lg:gap-16 items-center">
            {/* Left Content */}
            <div className="space-y-8">
              {/* Trust Badge */}
              <div className="inline-flex items-center gap-2 bg-emerald-50 text-emerald-700 px-4 py-2 rounded-full text-sm font-medium">
                <BadgeCheck className="w-4 h-4" />
                <span>100% Verified Professionals</span>
              </div>

              {/* Main Heading */}
              <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-gray-900 leading-tight">
                Get a trusted{' '}
                <span className="relative">
                  <span className="text-emerald-600 transition-all duration-500">
                    {services[currentService]}
                  </span>
                  <span className="absolute bottom-0 left-0 w-full h-1 bg-emerald-200 rounded-full"></span>
                </span>
                <br />
                at your doorstep
              </h1>

              {/* Subtitle */}
              <p className="text-lg sm:text-xl text-gray-600 max-w-lg">
                Book verified professionals for home services. Fast, reliable, and affordable. 
                Get help in minutes, not days.
              </p>

              {/* CTA Buttons */}
              <div className="flex flex-col sm:flex-row gap-4">
                <Button size="lg" className="bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl px-8 h-14 text-base font-semibold shadow-lg shadow-emerald-200" asChild>
                  <Link href="/auth/signup">
                    Book a Service
                    <ArrowRight className="ml-2 w-5 h-5" />
                  </Link>
                </Button>
                <Button size="lg" variant="outline" className="rounded-xl px-8 h-14 text-base font-semibold border-2" asChild>
                  <Link href="#how-it-works">
                    <Play className="mr-2 w-5 h-5" />
                    See how it works
                  </Link>
                </Button>
              </div>

              {/* Social Proof */}
              <div className="flex items-center gap-8 pt-4">
                <div className="flex -space-x-3">
                  {[1, 2, 3, 4, 5].map((i) => (
                    <div key={i} className="w-10 h-10 rounded-full bg-gradient-to-br from-gray-200 to-gray-300 border-2 border-white flex items-center justify-center text-xs font-medium text-gray-600">
                      {String.fromCharCode(64 + i)}
                    </div>
                  ))}
                </div>
                <div>
                  <div className="flex items-center gap-1">
                    {[1, 2, 3, 4, 5].map((i) => (
                      <Star key={i} className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                    ))}
                    <span className="ml-1 text-sm font-semibold text-gray-900">4.8</span>
                  </div>
                  <p className="text-sm text-gray-500">from 50,000+ reviews</p>
                </div>
              </div>
            </div>

            {/* Right Content - Hero Image/Cards */}
            <div className="relative hidden lg:block">
              <div className="relative">
                {/* Main Card */}
                <div className="bg-gradient-to-br from-emerald-500 to-teal-600 rounded-3xl p-6 pt-16 pb-16 shadow-2xl shadow-emerald-200/50">
                  <div className="bg-white rounded-2xl p-6 space-y-4 shadow-lg">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium text-gray-500">Live booking</span>
                      <span className="flex items-center gap-2 text-sm font-medium text-emerald-600">
                        <span className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse"></span>
                        Just now
                      </span>
                    </div>
                    <div className="flex items-center gap-4">
                      <div className="w-14 h-14 rounded-full bg-emerald-100 flex items-center justify-center">
                        <span className="text-2xl">🔧</span>
                      </div>
                      <div>
                        <h3 className="font-semibold text-gray-900">Plumber Booked</h3>
                        <p className="text-sm text-gray-500">Koramangala, Bangalore</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 text-sm text-gray-600">
                      <Clock className="w-4 h-4" />
                      <span>Arriving in 25 mins</span>
                    </div>
                  </div>
                </div>

                {/* Floating Stats Card */}
                <div className="absolute top-0 -right-4 bg-white rounded-2xl p-4 shadow-xl border border-gray-100">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-full bg-yellow-100 flex items-center justify-center">
                      <Star className="w-6 h-6 text-yellow-500 fill-yellow-500" />
                    </div>
                    <div>
                      <p className="text-2xl font-bold text-gray-900">4.8</p>
                      <p className="text-xs text-gray-500">Avg. Rating</p>
                    </div>
                  </div>
                </div>

                {/* Floating Badge */}
                <div className="absolute bottom-0 -left-4 bg-white rounded-2xl p-4 shadow-xl border border-gray-100">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-full bg-emerald-100 flex items-center justify-center">
                      <Shield className="w-6 h-6 text-emerald-600" />
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-gray-900">100% Safe</p>
                      <p className="text-xs text-gray-500">Verified helpers</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Trusted By Section */}
      <section className="py-12 bg-gray-50 border-y border-gray-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col md:flex-row items-center justify-between gap-8">
            <p className="text-sm font-medium text-gray-500 uppercase tracking-wider">
              Trusted by thousands across India
            </p>
            <div className="flex items-center gap-12 flex-wrap justify-center">
              <div className="text-center">
                <p className="text-3xl font-bold text-gray-900">10K+</p>
                <p className="text-sm text-gray-500">Active Helpers</p>
              </div>
              <div className="w-px h-12 bg-gray-200 hidden sm:block"></div>
              <div className="text-center">
                <p className="text-3xl font-bold text-gray-900">50K+</p>
                <p className="text-sm text-gray-500">Jobs Completed</p>
              </div>
              <div className="w-px h-12 bg-gray-200 hidden sm:block"></div>
              <div className="text-center">
                <p className="text-3xl font-bold text-gray-900">25+</p>
                <p className="text-sm text-gray-500">Cities</p>
              </div>
              <div className="w-px h-12 bg-gray-200 hidden sm:block"></div>
              <div className="text-center">
                <p className="text-3xl font-bold text-gray-900">4.8★</p>
                <p className="text-sm text-gray-500">Customer Rating</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Services Section */}
      <section id="services" className="py-20 lg:py-28">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-2xl mx-auto mb-16">
            <span className="inline-flex items-center gap-2 bg-purple-50 text-purple-700 px-4 py-2 rounded-full text-sm font-medium mb-4">
              <Sparkles className="w-4 h-4" />
              Our Services
            </span>
            <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-4">
              What do you need help with?
            </h2>
            <p className="text-lg text-gray-600">
              Choose from a wide range of home services. All professionals are verified and rated.
            </p>
          </div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-5">
            {[
              { name: 'Plumbing', Icon: PlumbingIcon, desc: 'Leaks, pipes, taps & more', gradient: 'from-blue-500 to-blue-600', bg: 'bg-blue-50', iconColor: 'text-blue-600', hoverBorder: 'hover:border-blue-200' },
              { name: 'Electrical', Icon: ElectricalIcon, desc: 'Wiring, switches & repairs', gradient: 'from-amber-400 to-amber-500', bg: 'bg-amber-50', iconColor: 'text-amber-500', hoverBorder: 'hover:border-amber-200' },
              { name: 'Cleaning', Icon: CleaningIcon, desc: 'Deep clean, sanitization', gradient: 'from-emerald-500 to-emerald-600', bg: 'bg-emerald-50', iconColor: 'text-emerald-600', hoverBorder: 'hover:border-emerald-200' },
              { name: 'Carpentry', Icon: CarpentryIcon, desc: 'Furniture, doors & fittings', gradient: 'from-orange-500 to-orange-600', bg: 'bg-orange-50', iconColor: 'text-orange-600', hoverBorder: 'hover:border-orange-200' },
              { name: 'AC Repair', Icon: ACRepairIcon, desc: 'Service, repair & install', gradient: 'from-cyan-500 to-cyan-600', bg: 'bg-cyan-50', iconColor: 'text-cyan-600', hoverBorder: 'hover:border-cyan-200' },
              { name: 'Painting', Icon: PaintingIcon, desc: 'Interior & exterior', gradient: 'from-pink-500 to-rose-500', bg: 'bg-pink-50', iconColor: 'text-pink-600', hoverBorder: 'hover:border-pink-200' },
              { name: 'Appliances', Icon: AppliancesIcon, desc: 'Repair & maintenance', gradient: 'from-violet-500 to-purple-600', bg: 'bg-violet-50', iconColor: 'text-violet-600', hoverBorder: 'hover:border-violet-200' },
              { name: 'Pest Control', Icon: PestControlIcon, desc: 'Fumigation & treatment', gradient: 'from-red-500 to-rose-600', bg: 'bg-red-50', iconColor: 'text-red-500', hoverBorder: 'hover:border-red-200' },
            ].map((service) => (
              <Link
                key={service.name}
                href={`/auth/signup?service=${encodeURIComponent(service.name.toLowerCase())}`}
                className={`group relative p-6 rounded-2xl bg-white border border-gray-100 ${service.hoverBorder} transition-all duration-300 hover:shadow-xl hover:-translate-y-1`}
              >
                {/* Gradient accent line */}
                <div className={`absolute top-0 left-6 right-6 h-1 bg-gradient-to-r ${service.gradient} rounded-b-full opacity-0 group-hover:opacity-100 transition-opacity`} />
                
                {/* Icon container */}
                <div className={`w-14 h-14 ${service.bg} rounded-2xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform duration-300`}>
                  <service.Icon size={28} className={service.iconColor} />
                </div>
                
                <h3 className="text-lg font-semibold text-gray-900 mb-1">{service.name}</h3>
                <p className="text-sm text-gray-500 mb-4">{service.desc}</p>
                
                <span className="inline-flex items-center text-sm font-medium text-gray-600 group-hover:text-gray-900 transition-colors">
                  Book now
                  <ChevronRight className="w-4 h-4 ml-1 group-hover:translate-x-1 transition-transform" />
                </span>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section id="how-it-works" className="py-20 lg:py-28 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-2xl mx-auto mb-16">
            <span className="inline-flex items-center gap-2 bg-emerald-50 text-emerald-700 px-4 py-2 rounded-full text-sm font-medium mb-4">
              <Zap className="w-4 h-4" />
              Simple Process
            </span>
            <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-4">
              Book in 3 easy steps
            </h2>
            <p className="text-lg text-gray-600">
              Getting help has never been this easy. No calls, no hassle.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8 lg:gap-12">
            {[
              {
                step: '01',
                title: 'Choose Service',
                desc: 'Select what you need. Browse through our wide range of services and pick what suits you.',
                icon: '📱'
              },
              {
                step: '02',
                title: 'Get Matched',
                desc: 'We instantly match you with verified professionals near you. Compare ratings and prices.',
                icon: '🎯'
              },
              {
                step: '03',
                title: 'Sit Back & Relax',
                desc: 'Your helper arrives on time. Pay securely after the job is done. Rate your experience.',
                icon: '✅'
              }
            ].map((item, index) => (
              <div key={item.step} className="relative">
                {index < 2 && (
                  <div className="hidden md:block absolute top-12 left-full w-full h-0.5 bg-gradient-to-r from-emerald-200 to-transparent -translate-x-1/2"></div>
                )}
                <div className="bg-white rounded-2xl p-8 shadow-sm border border-gray-100 hover:shadow-lg transition-shadow">
                  <div className="flex items-center gap-4 mb-6">
                    <span className="text-5xl">{item.icon}</span>
                    <span className="text-5xl font-bold text-gray-100">{item.step}</span>
                  </div>
                  <h3 className="text-xl font-semibold text-gray-900 mb-3">{item.title}</h3>
                  <p className="text-gray-600 leading-relaxed">{item.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Why Choose Us */}
      <section className="py-20 lg:py-28">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid lg:grid-cols-2 gap-16 items-center">
            <div>
              <span className="inline-flex items-center gap-2 bg-blue-50 text-blue-700 px-4 py-2 rounded-full text-sm font-medium mb-4">
                <Shield className="w-4 h-4" />
                Why Helparo
              </span>
              <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-6">
                Built for trust, designed for speed
              </h2>
              <p className="text-lg text-gray-600 mb-8">
                We&apos;re not just another service app. We&apos;re building the most trusted network of home service professionals in India.
              </p>

              <div className="space-y-6">
                {[
                  { icon: BadgeCheck, title: 'Verified Professionals', desc: 'Every helper goes through background checks and skill verification.' },
                  { icon: Clock, title: 'On-time Guarantee', desc: 'We respect your time. Get compensated if helper is late.' },
                  { icon: Shield, title: 'Safe & Secure', desc: 'Real-time tracking, SOS button, and 24/7 support.' },
                  { icon: Star, title: 'Quality Assured', desc: 'Not happy? Get a free re-service or full refund.' },
                ].map((item) => (
                  <div key={item.title} className="flex gap-4">
                    <div className="flex-shrink-0 w-12 h-12 rounded-xl bg-emerald-100 flex items-center justify-center">
                      <item.icon className="w-6 h-6 text-emerald-600" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-gray-900 mb-1">{item.title}</h3>
                      <p className="text-gray-600 text-sm">{item.desc}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="relative">
              <div className="bg-gradient-to-br from-gray-900 to-gray-800 rounded-3xl p-8 lg:p-12">
                <div className="space-y-6">
                  <div className="flex items-center gap-4">
                    <div className="w-16 h-16 rounded-full bg-emerald-500 flex items-center justify-center text-white text-2xl font-bold">
                      RS
                    </div>
                    <div>
                      <h4 className="text-white font-semibold text-lg">Rajesh S.</h4>
                      <div className="flex items-center gap-1">
                        {[1, 2, 3, 4, 5].map((i) => (
                          <Star key={i} className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                        ))}
                      </div>
                    </div>
                  </div>
                  <p className="text-gray-300 text-lg leading-relaxed">
                    &quot;Best service I&apos;ve ever used! The plumber came within 30 minutes and fixed my leaking pipe. 
                    Professional, affordable, and the app makes everything so easy. Highly recommend!&quot;
                  </p>
                  <p className="text-gray-500 text-sm">Bangalore • 2 days ago</p>
                </div>
              </div>

              {/* Floating Elements */}
              <div className="absolute -top-4 -right-4 bg-white rounded-xl p-4 shadow-xl">
                <div className="flex items-center gap-2">
                  <CheckCircle className="w-5 h-5 text-emerald-500" />
                  <span className="text-sm font-medium text-gray-900">50K+ Happy Customers</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Safety Section */}
      <section id="safety" className="py-20 lg:py-28 bg-gray-900 text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-2xl mx-auto mb-16">
            <span className="inline-flex items-center gap-2 bg-white/10 text-white px-4 py-2 rounded-full text-sm font-medium mb-4">
              <Shield className="w-4 h-4" />
              Your Safety First
            </span>
            <h2 className="text-3xl sm:text-4xl font-bold mb-4">
              We take safety seriously
            </h2>
            <p className="text-lg text-gray-400">
              Your trust is our priority. Here&apos;s how we keep you safe.
            </p>
          </div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {[
              { icon: BadgeCheck, title: 'ID Verified', desc: 'Aadhaar & PAN verified' },
              { icon: Shield, title: 'Background Check', desc: 'Police verification done' },
              { icon: MapPin, title: 'Live Tracking', desc: 'Track helper in real-time' },
              { icon: Phone, title: 'SOS Button', desc: '24/7 emergency support' },
            ].map((item) => (
              <div key={item.title} className="bg-white/5 backdrop-blur-sm rounded-2xl p-6 border border-white/10 hover:bg-white/10 transition-colors">
                <div className="w-12 h-12 rounded-xl bg-emerald-500/20 flex items-center justify-center mb-4">
                  <item.icon className="w-6 h-6 text-emerald-400" />
                </div>
                <h3 className="text-lg font-semibold mb-2">{item.title}</h3>
                <p className="text-gray-400 text-sm">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 lg:py-28 bg-gradient-to-br from-emerald-500 to-teal-600">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-white mb-6">
            Ready to get started?
          </h2>
          <p className="text-xl text-white/90 mb-8 max-w-2xl mx-auto">
            Join thousands of happy customers. Book your first service today and experience the difference.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button size="lg" className="bg-white text-emerald-600 hover:bg-gray-100 rounded-xl px-8 h-14 text-base font-semibold shadow-lg" asChild>
              <Link href="/auth/signup">
                Book a Service
                <ArrowRight className="ml-2 w-5 h-5" />
              </Link>
            </Button>
            <Button size="lg" className="bg-white/20 backdrop-blur-sm text-white border-2 border-white hover:bg-white hover:text-emerald-600 rounded-xl px-8 h-14 text-base font-semibold transition-all" asChild>
              <Link href="/helper/register">
                Become a Helper
              </Link>
            </Button>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 text-gray-400 py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-12 mb-12">
            <div>
              <Link href="/" className="flex items-center gap-2 mb-4">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center">
                  <span className="text-white font-bold text-lg">H</span>
                </div>
                <span className="text-xl font-bold text-white">Helparo</span>
              </Link>
              <p className="text-sm mb-4">
                India&apos;s most trusted home services platform. Connecting you with verified professionals.
              </p>
              <div className="flex gap-4">
                <a href="#" className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center hover:bg-white/20 transition-colors">
                  <span className="sr-only">Twitter</span>
                  𝕏
                </a>
                <a href="#" className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center hover:bg-white/20 transition-colors">
                  <span className="sr-only">Instagram</span>
                  📷
                </a>
                <a href="#" className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center hover:bg-white/20 transition-colors">
                  <span className="sr-only">LinkedIn</span>
                  in
                </a>
              </div>
            </div>

            <div>
              <h3 className="text-white font-semibold mb-4">For Customers</h3>
              <ul className="space-y-3 text-sm">
                <li><Link href="#" className="hover:text-white transition-colors">All Services</Link></li>
                <li><Link href="#" className="hover:text-white transition-colors">How it works</Link></li>
                <li><Link href="#" className="hover:text-white transition-colors">Pricing</Link></li>
                <li><Link href="#" className="hover:text-white transition-colors">FAQs</Link></li>
              </ul>
            </div>

            <div>
              <h3 className="text-white font-semibold mb-4">For Helpers</h3>
              <ul className="space-y-3 text-sm">
                <li><Link href="/helper/register" className="hover:text-white transition-colors">Become a Helper</Link></li>
                <li><Link href="#" className="hover:text-white transition-colors">Helper App</Link></li>
                <li><Link href="#" className="hover:text-white transition-colors">Earnings</Link></li>
                <li><Link href="#" className="hover:text-white transition-colors">Resources</Link></li>
              </ul>
            </div>

            <div>
              <h3 className="text-white font-semibold mb-4">Company</h3>
              <ul className="space-y-3 text-sm">
                <li><Link href="#" className="hover:text-white transition-colors">About Us</Link></li>
                <li><Link href="#" className="hover:text-white transition-colors">Careers</Link></li>
                <li><Link href="/legal/terms" className="hover:text-white transition-colors">Terms of Service</Link></li>
                <li><Link href="/legal/privacy" className="hover:text-white transition-colors">Privacy Policy</Link></li>
              </ul>
            </div>
          </div>

          <div className="border-t border-gray-800 pt-8 flex flex-col sm:flex-row justify-between items-center gap-4">
            <p className="text-sm">
              © {new Date().getFullYear()} Helparo. All rights reserved.
            </p>
            <p className="text-sm">
              Made with ❤️ in India
            </p>
          </div>
        </div>
      </footer>
    </div>
  )
}
