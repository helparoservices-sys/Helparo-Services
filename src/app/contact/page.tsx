import type { Metadata } from 'next'
import Link from 'next/link'
import { Mail, Phone, MapPin, Clock, MessageCircle } from 'lucide-react'
import { Button } from '@/components/ui/button'

export const metadata: Metadata = {
  title: 'Contact Helparo - Get Help & Support | Customer Service',
  description: 'Contact Helparo for support, feedback, or business inquiries. We\'re available 6 AM - 11 PM, 7 days a week. Email, phone, or chat with us.',
  keywords: [
    'contact helparo', 'helparo customer service', 'helparo support',
    'home services help', 'helparo phone number', 'helparo email'
  ],
  openGraph: {
    title: 'Contact Helparo - Get Help & Support',
    description: 'Need help? Contact our support team via email, phone, or chat. Available 6 AM - 11 PM, 7 days a week.',
    url: 'https://helparo.in/contact',
    type: 'website',
  },
  alternates: {
    canonical: 'https://helparo.in/contact',
  },
}

export default function ContactPage() {
  const contactMethods = [
    {
      icon: Phone,
      title: 'Phone Support',
      description: 'Talk to our support team',
      value: '+91-XXXXXXXXXX',
      action: 'tel:+91XXXXXXXXXX',
      actionText: 'Call Now',
    },
    {
      icon: Mail,
      title: 'Email',
      description: 'Send us an email',
      value: 'support@helparo.in',
      action: 'mailto:support@helparo.in',
      actionText: 'Send Email',
    },
    {
      icon: MessageCircle,
      title: 'Live Chat',
      description: 'Chat with us instantly',
      value: 'Available 6 AM - 11 PM',
      action: '#chat',
      actionText: 'Start Chat',
    },
  ]

  const faqs = [
    {
      question: 'How do I book a service?',
      answer: 'Simply browse our services, select what you need, choose a time slot, and confirm your booking. A verified helper will arrive at your doorstep.',
    },
    {
      question: 'What if the helper doesn\'t show up?',
      answer: 'We have a strict no-show policy. If a helper doesn\'t arrive, we\'ll immediately assign a replacement and compensate you for any inconvenience.',
    },
    {
      question: 'Can I cancel my booking?',
      answer: 'Yes, you can cancel for free up to 2 hours before the scheduled time. Cancellations after that may incur a small fee.',
    },
    {
      question: 'How do I become a helper on Helparo?',
      answer: 'Visit our registration page, complete your profile, submit your ID and skill documents, and pass our verification process. We\'ll contact you within 48 hours.',
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
              <Link href="/about" className="text-sm hover:text-white/80 transition-colors">About</Link>
              <Link href="/contact" className="text-sm font-medium">Contact</Link>
            </nav>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="bg-gradient-to-br from-emerald-50 to-teal-50 py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="max-w-3xl mx-auto text-center">
            <h1 className="text-4xl md:text-5xl font-bold text-gray-900 mb-6">
              Contact <span className="text-emerald-600">Us</span>
            </h1>
            <p className="text-xl text-gray-600">
              Have a question or need help? We&apos;re here for you 7 days a week.
            </p>
          </div>
        </div>
      </section>

      {/* Contact Methods */}
      <section className="py-16 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid md:grid-cols-3 gap-8">
            {contactMethods.map((method) => (
              <div key={method.title} className="bg-gray-50 rounded-2xl p-6 text-center">
                <div className="w-16 h-16 bg-emerald-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
                  <method.icon className="w-8 h-8 text-emerald-600" />
                </div>
                <h3 className="text-xl font-semibold text-gray-900 mb-2">{method.title}</h3>
                <p className="text-gray-500 text-sm mb-2">{method.description}</p>
                <p className="text-gray-900 font-medium mb-4">{method.value}</p>
                <a href={method.action}>
                  <Button className="w-full">{method.actionText}</Button>
                </a>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Office Hours & Location */}
      <section className="py-16 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid md:grid-cols-2 gap-12">
            <div>
              <h2 className="text-2xl font-bold text-gray-900 mb-6 flex items-center gap-2">
                <Clock className="w-6 h-6 text-emerald-500" />
                Support Hours
              </h2>
              <div className="bg-white rounded-xl p-6 shadow-sm">
                <div className="space-y-4">
                  <div className="flex justify-between items-center py-2 border-b">
                    <span className="text-gray-600">Monday - Sunday</span>
                    <span className="font-medium text-gray-900">6:00 AM - 11:00 PM</span>
                  </div>
                  <div className="flex justify-between items-center py-2">
                    <span className="text-gray-600">Emergency Services</span>
                    <span className="font-medium text-emerald-600">24/7 Available</span>
                  </div>
                </div>
              </div>
            </div>
            <div>
              <h2 className="text-2xl font-bold text-gray-900 mb-6 flex items-center gap-2">
                <MapPin className="w-6 h-6 text-emerald-500" />
                Our Office
              </h2>
              <div className="bg-white rounded-xl p-6 shadow-sm">
                <address className="not-italic text-gray-600 space-y-2">
                  <p className="font-medium text-gray-900">Helparo Services Pvt. Ltd.</p>
                  <p>Vijayawada, Andhra Pradesh</p>
                  <p>India - 520001</p>
                </address>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* FAQ Section */}
      <section className="py-16 bg-white">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-3xl font-bold text-gray-900 mb-8 text-center">
            Frequently Asked Questions
          </h2>
          <div className="space-y-4">
            {faqs.map((faq, index) => (
              <div key={index} className="bg-gray-50 rounded-xl p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-2">{faq.question}</h3>
                <p className="text-gray-600">{faq.answer}</p>
              </div>
            ))}
          </div>
          <div className="text-center mt-8">
            <p className="text-gray-500">
              Can&apos;t find what you&apos;re looking for?{' '}
              <a href="mailto:support@helparo.in" className="text-emerald-600 hover:underline">
                Email us directly
              </a>
            </p>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-16 bg-gradient-to-r from-emerald-600 to-teal-600">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl font-bold text-white mb-4">Need a Service Right Now?</h2>
          <p className="text-emerald-100 mb-8">
            Browse our services and book a verified helper in minutes.
          </p>
          <Link href="/services">
            <Button size="lg" variant="secondary">
              Browse Services
            </Button>
          </Link>
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
