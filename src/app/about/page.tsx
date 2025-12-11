import type { Metadata } from 'next'
import Link from 'next/link'
import { ArrowRight, Shield, Users, Award, MapPin, Clock, CheckCircle } from 'lucide-react'
import { Button } from '@/components/ui/button'

export const metadata: Metadata = {
  title: 'About Helparo - Your Trusted Home Service Partner in India',
  description: 'Learn about Helparo - India\'s fastest-growing home services platform. We connect you with verified plumbers, electricians, cleaners & more. 10,000+ happy customers, 500+ verified helpers.',
  keywords: [
    'about helparo', 'home services company', 'service marketplace India',
    'trusted helpers platform', 'verified professionals India',
    'on-demand services startup', 'home repair company'
  ],
  openGraph: {
    title: 'About Helparo - Your Trusted Home Service Partner',
    description: 'India\'s fastest-growing home services platform. Verified helpers, instant booking, 100% satisfaction guaranteed.',
    url: 'https://helparo.in/about',
    type: 'website',
  },
  alternates: {
    canonical: 'https://helparo.in/about',
  },
}

export default function AboutPage() {
  const stats = [
    { label: 'Happy Customers', value: '10,000+', icon: Users },
    { label: 'Verified Helpers', value: '500+', icon: Shield },
    { label: 'Services Completed', value: '25,000+', icon: Award },
    { label: 'Cities Served', value: '10+', icon: MapPin },
  ]

  const values = [
    {
      title: 'Trust & Safety',
      description: 'Every helper on our platform undergoes thorough background verification, skill assessment, and ID verification.',
      icon: Shield,
    },
    {
      title: 'Instant Service',
      description: 'Get a helper at your doorstep within 30 minutes to 2 hours. No more waiting days for repairs.',
      icon: Clock,
    },
    {
      title: 'Quality Guaranteed',
      description: '100% satisfaction guarantee. If you\'re not happy, we\'ll make it right or refund your money.',
      icon: CheckCircle,
    },
  ]

  return (
    <div className="min-h-screen bg-white">
      {/* Header */}
      <header className="bg-gradient-to-r from-emerald-600 to-teal-600 text-white py-4">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between">
            <Link href="/" className="flex items-center gap-2">
              <div className="w-10 h-10 rounded-xl bg-white/20 flex items-center justify-center">
                <span className="text-white font-bold text-lg">H</span>
              </div>
              <span className="text-xl font-bold">Helparo</span>
            </Link>
            <nav className="hidden md:flex items-center gap-6">
              <Link href="/services" className="text-sm hover:text-white/80 transition-colors">Services</Link>
              <Link href="/about" className="text-sm font-medium">About</Link>
              <Link href="/auth/login">
                <Button variant="secondary" size="sm">Login</Button>
              </Link>
            </nav>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="bg-gradient-to-br from-emerald-50 to-teal-50 py-16 md:py-24">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="max-w-3xl mx-auto text-center">
            <h1 className="text-4xl md:text-5xl font-bold text-gray-900 mb-6">
              About <span className="text-emerald-600">Helparo</span>
            </h1>
            <p className="text-xl text-gray-600 mb-8">
              We&apos;re on a mission to make home services simple, reliable, and accessible to everyone. 
              Connect with trusted professionals at the tap of a button.
            </p>
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="py-16 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            {stats.map((stat) => (
              <div key={stat.label} className="text-center">
                <stat.icon className="w-10 h-10 text-emerald-500 mx-auto mb-4" />
                <div className="text-3xl md:text-4xl font-bold text-gray-900 mb-2">{stat.value}</div>
                <div className="text-sm text-gray-600">{stat.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Our Story */}
      <section className="py-16 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="max-w-3xl mx-auto">
            <h2 className="text-3xl font-bold text-gray-900 mb-6 text-center">Our Story</h2>
            <div className="prose prose-lg mx-auto text-gray-600">
              <p>
                Helparo was born from a simple frustration - finding reliable home service professionals 
                shouldn&apos;t be so hard. We&apos;ve all been there: a leaky faucet at midnight, an AC that 
                breaks down during summer, or the need for a deep clean before guests arrive.
              </p>
              <p>
                Traditional methods of finding helpers - asking neighbors, searching classified ads, 
                or calling random numbers - often led to unreliable service, no-shows, and safety concerns.
              </p>
              <p>
                That&apos;s why we built Helparo. Our platform connects you with verified, skilled professionals 
                who are ready to help when you need them. Every helper on our platform is background-verified, 
                trained, and committed to delivering quality service.
              </p>
              <p>
                Today, Helparo serves thousands of customers across India, with a network of 500+ verified 
                helpers offering services from plumbing and electrical work to house cleaning and AC repair.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Our Values */}
      <section className="py-16 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-3xl font-bold text-gray-900 mb-12 text-center">Our Values</h2>
          <div className="grid md:grid-cols-3 gap-8">
            {values.map((value) => (
              <div key={value.title} className="text-center p-6 rounded-2xl bg-gray-50">
                <div className="w-16 h-16 bg-emerald-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
                  <value.icon className="w-8 h-8 text-emerald-600" />
                </div>
                <h3 className="text-xl font-semibold text-gray-900 mb-3">{value.title}</h3>
                <p className="text-gray-600">{value.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Services We Offer */}
      <section className="py-16 bg-emerald-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-3xl font-bold text-gray-900 mb-8 text-center">Services We Offer</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[
              'Plumbing', 'Electrical', 'House Cleaning', 'AC Repair & Service',
              'Carpentry', 'Painting', 'Appliance Repair', 'Pest Control',
              'Deep Cleaning', 'Sofa Cleaning', 'Water Tank Cleaning', 'Geyser Repair'
            ].map((service) => (
              <div key={service} className="bg-white p-4 rounded-xl text-center shadow-sm">
                <span className="text-gray-700 font-medium">{service}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-16 bg-gradient-to-r from-emerald-600 to-teal-600">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl font-bold text-white mb-4">Ready to Get Started?</h2>
          <p className="text-emerald-100 mb-8 max-w-2xl mx-auto">
            Join thousands of happy customers who trust Helparo for their home service needs.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link href="/services">
              <Button size="lg" variant="secondary" className="gap-2">
                Browse Services <ArrowRight className="w-4 h-4" />
              </Button>
            </Link>
            <Link href="/auth/register?role=helper">
              <Button size="lg" variant="outline" className="bg-transparent border-white text-white hover:bg-white/10">
                Become a Helper
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 text-white py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid md:grid-cols-4 gap-8">
            <div>
              <div className="flex items-center gap-2 mb-4">
                <div className="w-10 h-10 rounded-xl bg-emerald-500 flex items-center justify-center">
                  <span className="text-white font-bold text-lg">H</span>
                </div>
                <span className="text-xl font-bold">Helparo</span>
              </div>
              <p className="text-gray-400 text-sm">
                Your trusted partner for all home service needs.
              </p>
            </div>
            <div>
              <h4 className="font-semibold mb-4">Services</h4>
              <ul className="space-y-2 text-sm text-gray-400">
                <li><Link href="/services/plumbing" className="hover:text-white">Plumbing</Link></li>
                <li><Link href="/services/electrical" className="hover:text-white">Electrical</Link></li>
                <li><Link href="/services/cleaning" className="hover:text-white">Cleaning</Link></li>
                <li><Link href="/services/ac-repair" className="hover:text-white">AC Repair</Link></li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold mb-4">Company</h4>
              <ul className="space-y-2 text-sm text-gray-400">
                <li><Link href="/about" className="hover:text-white">About Us</Link></li>
                <li><Link href="/contact" className="hover:text-white">Contact</Link></li>
                <li><Link href="/auth/register?role=helper" className="hover:text-white">Become a Helper</Link></li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold mb-4">Legal</h4>
              <ul className="space-y-2 text-sm text-gray-400">
                <li><Link href="/legal/privacy" className="hover:text-white">Privacy Policy</Link></li>
                <li><Link href="/legal/terms" className="hover:text-white">Terms of Service</Link></li>
              </ul>
            </div>
          </div>
          <div className="border-t border-gray-800 mt-8 pt-8 text-center text-sm text-gray-400">
            © {new Date().getFullYear()} Helparo. All rights reserved.
          </div>
        </div>
      </footer>
    </div>
  )
}
