'use client'

import { useState, useEffect, useRef } from 'react'
import Link from 'next/link'
import { 
  Mail, 
  Phone, 
  MapPin, 
  Clock, 
  MessageCircle,
  Send,
  Headphones,
  Heart,
  Sparkles,
  Zap,
  Shield,
  CheckCircle,
  ArrowRight,
  Star,
  Users,
  BadgeCheck
} from 'lucide-react'
import { Button } from '@/components/ui/button'

// Animated Counter Component
function AnimatedCounter({ end, duration = 2000, suffix = '' }: { end: number; duration?: number; suffix?: string }) {
  const [count, setCount] = useState(0)
  const [isVisible, setIsVisible] = useState(false)
  const ref = useRef<HTMLSpanElement>(null)

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => { if (entry.isIntersecting) setIsVisible(true) },
      { threshold: 0.1 }
    )
    if (ref.current) observer.observe(ref.current)
    return () => observer.disconnect()
  }, [])

  useEffect(() => {
    if (!isVisible) return
    let startTime: number
    const step = (timestamp: number) => {
      if (!startTime) startTime = timestamp
      const progress = Math.min((timestamp - startTime) / duration, 1)
      setCount(Math.floor(progress * end))
      if (progress < 1) requestAnimationFrame(step)
    }
    requestAnimationFrame(step)
  }, [isVisible, end, duration])

  return <span ref={ref}>{count.toLocaleString()}{suffix}</span>
}

export default function ContactPage() {
  const [isScrolled, setIsScrolled] = useState(false)
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    subject: '',
    message: ''
  })
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [submitted, setSubmitted] = useState(false)

  useEffect(() => {
    const handleScroll = () => setIsScrolled(window.scrollY > 20)
    window.addEventListener('scroll', handleScroll)
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  // Get current hour to show if live chat is available
  const currentHour = new Date().getHours()
  const isChatAvailable = currentHour >= 9 && currentHour < 18

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)
    // Simulate form submission
    await new Promise(resolve => setTimeout(resolve, 1500))
    setSubmitted(true)
    setIsSubmitting(false)
  }

  const contactMethods = [
    {
      icon: Phone,
      title: 'Call Us',
      description: 'Talk to our friendly team',
      value: '+91 9154781126',
      subValue: 'Mon-Sun: 9 AM - 6 PM',
      action: 'tel:+919154781126',
      actionText: 'Call Now',
      gradient: 'from-blue-500 to-cyan-500',
      bgColor: 'bg-blue-50',
      borderColor: 'border-blue-200',
      hoverBorder: 'hover:border-blue-400',
      emoji: '📞'
    },
    {
      icon: Mail,
      title: 'Email Us',
      description: 'We reply within 24 hours',
      value: 'support@helparo.in',
      subValue: 'We love hearing from you!',
      action: 'mailto:support@helparo.in',
      actionText: 'Send Email',
      gradient: 'from-emerald-500 to-teal-500',
      bgColor: 'bg-emerald-50',
      borderColor: 'border-emerald-200',
      hoverBorder: 'hover:border-emerald-400',
      emoji: '✉️'
    },
    {
      icon: MessageCircle,
      title: 'Live Chat',
      description: isChatAvailable ? 'We\'re online now!' : 'Back at 9 AM',
      value: isChatAvailable ? '🟢 Online' : '🔴 Offline',
      subValue: 'Available 9 AM - 6 PM',
      action: '#chat',
      actionText: isChatAvailable ? 'Start Chat' : 'Leave Message',
      gradient: 'from-violet-500 to-purple-600',
      bgColor: 'bg-violet-50',
      borderColor: 'border-violet-200',
      hoverBorder: 'hover:border-violet-400',
      emoji: '💬'
    },
  ]

  const faqs = [
    {
      question: 'How quickly can I get a helper?',
      answer: 'Most services are available within 30 minutes! Our AI instantly matches you with the nearest available verified professional.',
      icon: Zap,
      color: 'text-amber-500'
    },
    {
      question: 'What if I\'m not satisfied with the service?',
      answer: '100% satisfaction guaranteed! Not happy? We\'ll send another professional for free or give you a full refund. No questions asked.',
      icon: Shield,
      color: 'text-emerald-500'
    },
    {
      question: 'How does the pricing work?',
      answer: 'YOU decide your price! Tell us your budget, and our AI finds verified professionals willing to work at your rate. Revolutionary, right?',
      icon: Sparkles,
      color: 'text-violet-500'
    },
    {
      question: 'Are the helpers verified?',
      answer: 'Absolutely! Every helper undergoes Aadhaar verification, background checks, skill assessments, and training before joining Helparo.',
      icon: BadgeCheck,
      color: 'text-blue-500'
    },
  ]

  const supportHours = [
    { day: 'Phone Support', time: '9:00 AM - 6:00 PM', icon: Phone, available: currentHour >= 9 && currentHour < 18 },
    { day: 'Live Chat', time: '9:00 AM - 6:00 PM', icon: MessageCircle, available: currentHour >= 9 && currentHour < 18 },
    { day: 'Email Support', time: '24/7', icon: Mail, available: true },
    { day: 'Emergency Help', time: '24/7', icon: Headphones, available: true },
  ]

  return (
    <div className="min-h-screen bg-white">
      {/* Premium Glass Header */}
      <header className={`fixed top-0 left-0 right-0 z-50 transition-all duration-500 pt-safe ${
        isScrolled 
          ? 'bg-white/80 backdrop-blur-2xl shadow-[0_2px_40px_-12px_rgba(0,0,0,0.1)] border-b border-gray-100' 
          : 'bg-white/50 backdrop-blur-xl'
      }`}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16 lg:h-20">
            <Link href="/" className="flex items-center gap-2.5 group">
              <img src="/logo.svg" alt="Helparo" className="w-10 h-10 rounded-[12px] shadow-lg shadow-emerald-500/20 group-hover:scale-105 transition-transform" />
              <span className="text-xl font-extrabold text-gray-900 hidden sm:block">helparo</span>
            </Link>

            <nav className="hidden md:flex items-center gap-1">
              <Link href="/services" className="px-4 py-2 text-[15px] font-medium text-gray-600 hover:text-emerald-600 rounded-xl hover:bg-emerald-50 transition-all">Services</Link>
              <Link href="/about" className="px-4 py-2 text-[15px] font-medium text-gray-600 hover:text-emerald-600 rounded-xl hover:bg-emerald-50 transition-all">About</Link>
              <Link href="/contact" className="px-4 py-2 text-[15px] font-semibold text-emerald-600 bg-emerald-50 rounded-xl">Contact</Link>
            </nav>

            <div className="flex items-center gap-3">
              <Button variant="ghost" className="hidden sm:flex text-gray-700 hover:text-emerald-600 font-semibold rounded-xl" asChild>
                <Link href="/auth/login">Log in</Link>
              </Button>
              <Button className="bg-gray-900 hover:bg-gray-800 text-white rounded-xl px-5 font-semibold shadow-lg" asChild>
                <Link href="/auth/signup">Get Started</Link>
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Mobile (short) */}
      <div className="md:hidden">
        <section className="pt-24 pb-6 bg-white">
          <div className="max-w-7xl mx-auto px-4">
            <h1 className="text-3xl font-black text-gray-900 leading-tight">
              Contact
            </h1>
            <p className="text-gray-500 mt-2">
              Call, email, or message us — we&apos;ll respond soon.
            </p>

            <div className="mt-5 grid gap-3">
              {contactMethods.map((method) => (
                <a
                  key={method.title}
                  href={method.action}
                  className={`flex items-center justify-between rounded-2xl border ${method.borderColor} bg-white px-4 py-4 ${method.hoverBorder} transition-colors`}
                >
                  <div className="flex items-center gap-3">
                    <div className={`w-11 h-11 bg-gradient-to-br ${method.gradient} rounded-xl flex items-center justify-center`}> 
                      <method.icon className="w-5 h-5 text-white" />
                    </div>
                    <div>
                      <p className="font-semibold text-gray-900 leading-tight">{method.title}</p>
                      <p className="text-sm text-gray-500 leading-tight">{method.value}</p>
                    </div>
                  </div>
                  <ArrowRight className="w-4 h-4 text-gray-400" />
                </a>
              ))}
            </div>
          </div>
        </section>

        <section className="py-8 bg-gray-50">
          <div className="max-w-7xl mx-auto px-4">
            <div className="flex items-center gap-2 bg-violet-100 text-violet-700 px-3 py-1.5 rounded-full text-xs font-semibold w-fit">
              <Send className="w-3.5 h-3.5" />
              Send a message
            </div>
            <h2 className="text-2xl font-black text-gray-900 mt-3">Message us</h2>
            <p className="text-gray-500 mt-2">
              Prefer typing? Send a quick note.
            </p>

            <div className="mt-5 bg-white rounded-2xl p-4 shadow-sm border border-gray-100">
              {submitted ? (
                <div className="text-center py-6">
                  <div className="w-14 h-14 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <CheckCircle className="w-7 h-7 text-emerald-600" />
                  </div>
                  <h3 className="text-lg font-bold text-gray-900">Message sent</h3>
                  <p className="text-gray-500 mt-1">We&apos;ll reply within 24 hours.</p>
                  <Button onClick={() => setSubmitted(false)} variant="outline" className="rounded-xl mt-4">
                    Send another
                  </Button>
                </div>
              ) : (
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">Your name</label>
                    <input
                      type="text"
                      required
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      className="w-full px-4 py-3 rounded-xl border-2 border-gray-200 focus:border-violet-500 focus:ring-0 outline-none transition-colors"
                      placeholder="John"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">Email</label>
                    <input
                      type="email"
                      required
                      value={formData.email}
                      onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                      className="w-full px-4 py-3 rounded-xl border-2 border-gray-200 focus:border-violet-500 focus:ring-0 outline-none transition-colors"
                      placeholder="you@example.com"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">Message</label>
                    <textarea
                      required
                      rows={4}
                      value={formData.message}
                      onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                      className="w-full px-4 py-3 rounded-xl border-2 border-gray-200 focus:border-violet-500 focus:ring-0 outline-none transition-colors resize-none"
                      placeholder="How can we help?"
                    />
                  </div>

                  <Button
                    type="submit"
                    disabled={isSubmitting}
                    className="w-full h-12 bg-gray-900 hover:bg-gray-800 text-white font-semibold rounded-xl transition-all disabled:opacity-50"
                  >
                    {isSubmitting ? 'Sending…' : 'Send'}
                  </Button>
                </form>
              )}
            </div>

            <div className="mt-6 flex gap-3">
              <Link href="/services" className="flex-1">
                <Button className="w-full bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-semibold">
                  Browse services
                </Button>
              </Link>
              <Link href="/auth/signup" className="flex-1">
                <Button variant="outline" className="w-full rounded-xl font-semibold">
                  Get started
                </Button>
              </Link>
            </div>
          </div>
        </section>

        <footer className="bg-white py-8">
          <div className="max-w-7xl mx-auto px-4">
            <p className="text-xs text-gray-500">
              © {new Date().getFullYear()} Helparo Services Pvt. Ltd.
            </p>
          </div>
        </footer>
      </div>

      {/* Desktop (original long page) */}
      <div className="hidden md:block">

      {/* ═══════════════════════════════════════════════════════════════════
          HERO SECTION - FUN & FRIENDLY
      ═══════════════════════════════════════════════════════════════════ */}
      <section className="pt-28 lg:pt-36 pb-16 lg:pb-20 bg-gradient-to-b from-violet-50/80 via-white to-white relative overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_80%_50%_at_50%_-20%,rgba(139,92,246,0.12),transparent)]" />
        <div className="absolute top-40 right-0 w-96 h-96 bg-gradient-to-br from-violet-200/30 to-purple-200/30 rounded-full blur-3xl" />
        <div className="absolute bottom-0 left-0 w-80 h-80 bg-gradient-to-tr from-emerald-200/20 to-teal-200/20 rounded-full blur-3xl" />
        
        {/* Floating Elements */}
        <div className="absolute top-32 left-10 text-4xl animate-bounce hidden lg:block" style={{ animationDelay: '0s' }}>👋</div>
        <div className="absolute top-48 right-20 text-3xl animate-bounce hidden lg:block" style={{ animationDelay: '0.5s' }}>💬</div>
        <div className="absolute bottom-20 left-1/4 text-3xl animate-bounce hidden lg:block" style={{ animationDelay: '1s' }}>❤️</div>
        
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative">
          <div className="text-center max-w-4xl mx-auto">
            {/* Status Badge */}
            <div className="inline-flex items-center gap-2 bg-gradient-to-r from-emerald-500 to-teal-500 text-white px-4 py-2 rounded-full shadow-lg shadow-emerald-500/25 mb-6">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-white opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-white"></span>
              </span>
              <span className="text-sm font-bold">We&apos;re Here to Help!</span>
            </div>

            <h1 className="text-4xl sm:text-5xl lg:text-7xl font-black text-gray-900 mb-6 leading-tight">
              Let&apos;s <span className="bg-gradient-to-r from-violet-600 via-purple-600 to-pink-500 bg-clip-text text-transparent">Talk</span>
              <br />
              <span className="text-3xl sm:text-4xl lg:text-5xl text-gray-500">We&apos;re All Ears 👂</span>
            </h1>
            
            <p className="text-xl sm:text-2xl text-gray-500 mb-8 max-w-3xl mx-auto leading-relaxed">
              Got questions? Feedback? Just want to say hi? 
              <br className="hidden sm:block" />
              <span className="font-bold text-gray-900">Our team is always happy to hear from you!</span>
            </p>

            {/* Quick Contact Stats */}
            <div className="flex flex-wrap justify-center gap-6 mb-8">
              <div className="flex items-center gap-2 bg-white/80 backdrop-blur-sm rounded-full px-4 py-2 shadow-lg border border-gray-100">
                <Zap className="w-5 h-5 text-amber-500" />
                <span className="text-sm font-medium text-gray-700">Avg. Response: <span className="font-bold text-gray-900">2 mins</span></span>
              </div>
              <div className="flex items-center gap-2 bg-white/80 backdrop-blur-sm rounded-full px-4 py-2 shadow-lg border border-gray-100">
                <Heart className="w-5 h-5 text-rose-500" />
                <span className="text-sm font-medium text-gray-700">Satisfaction: <span className="font-bold text-gray-900">98%</span></span>
              </div>
              <div className="flex items-center gap-2 bg-white/80 backdrop-blur-sm rounded-full px-4 py-2 shadow-lg border border-gray-100">
                <Users className="w-5 h-5 text-violet-500" />
                <span className="text-sm font-medium text-gray-700">Helped: <span className="font-bold text-gray-900">50,000+</span></span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ═══════════════════════════════════════════════════════════════════
          CONTACT CARDS - ENGAGING
      ═══════════════════════════════════════════════════════════════════ */}
      <section className="py-16 bg-white relative">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl lg:text-4xl font-black text-gray-900 mb-4">
              Choose Your Way to <span className="text-violet-600">Connect</span>
            </h2>
            <p className="text-gray-500 text-lg">Pick whatever feels comfortable - we&apos;re flexible!</p>
          </div>

          <div className="grid md:grid-cols-3 gap-6 lg:gap-8">
            {contactMethods.map((method) => (
              <div key={method.title} className="group relative">
                <div className={`absolute -inset-1 bg-gradient-to-r ${method.gradient} rounded-3xl blur opacity-20 group-hover:opacity-40 transition duration-500`} />
                <div className={`relative ${method.bgColor} rounded-3xl p-8 border-2 ${method.borderColor} ${method.hoverBorder} transition-all duration-300 h-full`}>
                  
                  <div className={`w-16 h-16 bg-gradient-to-br ${method.gradient} rounded-2xl flex items-center justify-center mb-6 shadow-lg group-hover:scale-110 transition-transform duration-300`}>
                    <method.icon className="w-8 h-8 text-white" />
                  </div>
                  
                  <h3 className="text-xl font-bold text-gray-900 mb-2">{method.title}</h3>
                  <p className="text-gray-500 text-sm mb-4">{method.description}</p>
                  
                  <div className="mb-2">
                    <p className="text-xl font-bold text-gray-900">{method.value}</p>
                    <p className="text-sm text-gray-500">{method.subValue}</p>
                  </div>
                  
                  <a href={method.action} className="block mt-6">
                    <Button className={`w-full bg-gradient-to-r ${method.gradient} hover:opacity-90 text-white font-semibold rounded-xl h-12 shadow-lg transition-all`}>
                      {method.actionText}
                      <ArrowRight className="w-4 h-4 ml-2" />
                    </Button>
                  </a>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ═══════════════════════════════════════════════════════════════════
          SUPPORT HOURS & LOCATION - MODERN
      ═══════════════════════════════════════════════════════════════════ */}
      <section className="py-16 bg-gradient-to-br from-gray-50 to-violet-50/30">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid lg:grid-cols-2 gap-12">
            {/* Support Hours */}
            <div>
              <div className="inline-flex items-center gap-2 bg-amber-100 text-amber-700 px-4 py-2 rounded-full text-sm font-semibold mb-6">
                <Clock className="w-4 h-4" />
                Support Hours
              </div>
              <h2 className="text-3xl font-bold text-gray-900 mb-6">
                When Can You <span className="text-amber-600">Reach Us?</span>
              </h2>
              
              <div className="bg-white rounded-3xl p-6 shadow-xl border border-gray-100">
                <div className="space-y-4">
                  {supportHours.map((item, idx) => (
                    <div key={idx} className="flex items-center justify-between p-4 rounded-2xl bg-gray-50 hover:bg-gray-100 transition-colors">
                      <div className="flex items-center gap-4">
                        <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${item.available ? 'bg-emerald-100' : 'bg-gray-200'}`}>
                          <item.icon className={`w-6 h-6 ${item.available ? 'text-emerald-600' : 'text-gray-500'}`} />
                        </div>
                        <div>
                          <p className="font-semibold text-gray-900">{item.day}</p>
                          <p className="text-sm text-gray-500">{item.time}</p>
                        </div>
                      </div>
                      <div className={`px-3 py-1 rounded-full text-xs font-bold ${item.available ? 'bg-emerald-100 text-emerald-700' : 'bg-gray-200 text-gray-600'}`}>
                        {item.available ? '🟢 Available' : '🔴 Offline'}
                      </div>
                    </div>
                  ))}
                </div>
                
                {/* Fun note */}
                <div className="mt-6 p-4 bg-gradient-to-r from-amber-50 to-orange-50 rounded-2xl border border-amber-100">
                  <div className="flex items-start gap-3">
                    <div className="text-2xl">☕</div>
                    <div>
                      <p className="font-semibold text-gray-900">Fun Fact!</p>
                      <p className="text-sm text-gray-600">Our support team has consumed 10,000+ cups of chai while helping customers! 🍵</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Our Office */}
            <div>
              <div className="inline-flex items-center gap-2 bg-emerald-100 text-emerald-700 px-4 py-2 rounded-full text-sm font-semibold mb-6">
                <MapPin className="w-4 h-4" />
                Our Location
              </div>
              <h2 className="text-3xl font-bold text-gray-900 mb-6">
                Come Say <span className="text-emerald-600">Hello!</span>
              </h2>
              
              <div className="bg-white rounded-3xl p-6 shadow-xl border border-gray-100 h-fit">
                {/* Office Info */}
                <div className="mb-6">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="w-12 h-12 bg-emerald-100 rounded-xl flex items-center justify-center">
                      <MapPin className="w-6 h-6 text-emerald-600" />
                    </div>
                    <div>
                      <p className="font-bold text-gray-900">Helparo Office</p>
                      <p className="text-sm text-gray-500">Where the magic happens ✨</p>
                    </div>
                  </div>
                  <address className="not-italic text-gray-600 space-y-1 pl-15 ml-15">
                    <p className="font-medium text-gray-900">Helparo Services Pvt. Ltd.</p>
                    <p>Bangalore, Karnataka</p>
                    <p>India - 560001</p>
                  </address>
                </div>

                {/* Map Placeholder */}
                <div className="relative w-full h-48 bg-gradient-to-br from-emerald-100 to-teal-100 rounded-2xl overflow-hidden">
                  <div className="absolute inset-0 flex items-center justify-center">
                    <div className="text-center">
                      <MapPin className="w-10 h-10 text-emerald-600 mx-auto mb-2 animate-bounce" />
                      <p className="font-semibold text-emerald-800">Bangalore, KA</p>
                      <p className="text-sm text-emerald-600">📍 We&apos;re here!</p>
                    </div>
                  </div>
                  {/* Decorative circles */}
                  <div className="absolute top-4 right-4 w-16 h-16 bg-emerald-200/50 rounded-full"></div>
                  <div className="absolute bottom-4 left-4 w-20 h-20 bg-teal-200/50 rounded-full"></div>
                </div>

                {/* Social Links */}
                <div className="mt-6 pt-6 border-t border-gray-100">
                  <p className="text-sm font-semibold text-gray-700 mb-3">Connect With Us</p>
                  <div className="flex gap-3">
                    <a href="https://twitter.com/helparo" target="_blank" rel="noopener noreferrer" className="w-10 h-10 bg-gray-100 rounded-xl flex items-center justify-center hover:bg-sky-100 hover:text-sky-600 cursor-pointer transition-colors group" title="Twitter / X">
                      <svg className="w-5 h-5 text-gray-600 group-hover:text-sky-600" fill="currentColor" viewBox="0 0 24 24"><path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/></svg>
                    </a>
                    <a href="https://instagram.com/helparo" target="_blank" rel="noopener noreferrer" className="w-10 h-10 bg-gray-100 rounded-xl flex items-center justify-center hover:bg-pink-100 cursor-pointer transition-colors group" title="Instagram">
                      <svg className="w-5 h-5 text-gray-600 group-hover:text-pink-600" fill="currentColor" viewBox="0 0 24 24"><path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"/></svg>
                    </a>
                    <a href="https://linkedin.com/company/helparo" target="_blank" rel="noopener noreferrer" className="w-10 h-10 bg-gray-100 rounded-xl flex items-center justify-center hover:bg-blue-100 cursor-pointer transition-colors group" title="LinkedIn">
                      <svg className="w-5 h-5 text-gray-600 group-hover:text-blue-700" fill="currentColor" viewBox="0 0 24 24"><path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/></svg>
                    </a>
                    <a href="https://facebook.com/helparo" target="_blank" rel="noopener noreferrer" className="w-10 h-10 bg-gray-100 rounded-xl flex items-center justify-center hover:bg-blue-100 cursor-pointer transition-colors group" title="Facebook">
                      <svg className="w-5 h-5 text-gray-600 group-hover:text-blue-600" fill="currentColor" viewBox="0 0 24 24"><path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/></svg>
                    </a>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ═══════════════════════════════════════════════════════════════════
          CONTACT FORM - BEAUTIFUL
      ═══════════════════════════════════════════════════════════════════ */}
      <section className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid lg:grid-cols-2 gap-12 lg:gap-20 items-center">
            {/* Left - Why Contact Us */}
            <div>
              <div className="inline-flex items-center gap-2 bg-violet-100 text-violet-700 px-4 py-2 rounded-full text-sm font-semibold mb-6">
                <Send className="w-4 h-4" />
                Send a Message
              </div>
              <h2 className="text-4xl lg:text-5xl font-black text-gray-900 mb-6 leading-tight">
                Drop Us a <span className="text-violet-600">Line</span> 💌
              </h2>
              <p className="text-xl text-gray-500 mb-8 leading-relaxed">
                Whether it&apos;s a question, feedback, partnership inquiry, or just to tell us how awesome we are (we love those!) — we&apos;re here for it all.
              </p>

              {/* Trust Points */}
              <div className="space-y-4">
                {[
                  { icon: Zap, text: 'Lightning-fast responses (avg. 2 mins!)', color: 'text-amber-500' },
                  { icon: Heart, text: 'Genuinely helpful humans, not robots', color: 'text-rose-500' },
                  { icon: Shield, text: 'Your data is 100% safe with us', color: 'text-emerald-500' },
                  { icon: Star, text: '98% customer satisfaction rate', color: 'text-violet-500' },
                ].map((item, idx) => (
                  <div key={idx} className="flex items-center gap-3">
                    <div className={`w-10 h-10 bg-gray-100 rounded-xl flex items-center justify-center`}>
                      <item.icon className={`w-5 h-5 ${item.color}`} />
                    </div>
                    <span className="text-gray-700 font-medium">{item.text}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Right - Form */}
            <div className="relative">
              <div className="absolute -inset-4 bg-gradient-to-r from-violet-500/20 via-purple-500/20 to-pink-500/20 rounded-[2rem] blur-2xl" />
              <div className="relative bg-white rounded-3xl p-8 shadow-2xl border border-gray-100">
                {submitted ? (
                  <div className="text-center py-12">
                    <div className="w-20 h-20 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-6">
                      <CheckCircle className="w-10 h-10 text-emerald-600" />
                    </div>
                    <h3 className="text-2xl font-bold text-gray-900 mb-3">Message Sent! 🎉</h3>
                    <p className="text-gray-500 mb-6">Thanks for reaching out! We&apos;ll get back to you within 24 hours.</p>
                    <Button onClick={() => setSubmitted(false)} variant="outline" className="rounded-xl">
                      Send Another Message
                    </Button>
                  </div>
                ) : (
                  <form onSubmit={handleSubmit} className="space-y-5">
                    <div className="grid sm:grid-cols-2 gap-5">
                      <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-2">Your Name</label>
                        <input
                          type="text"
                          required
                          value={formData.name}
                          onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                          className="w-full px-4 py-3 rounded-xl border-2 border-gray-200 focus:border-violet-500 focus:ring-0 outline-none transition-colors"
                          placeholder="John Doe"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-2">Phone Number</label>
                        <input
                          type="tel"
                          value={formData.phone}
                          onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                          className="w-full px-4 py-3 rounded-xl border-2 border-gray-200 focus:border-violet-500 focus:ring-0 outline-none transition-colors"
                          placeholder="+91 XXXXX XXXXX"
                        />
                      </div>
                    </div>
                    
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-2">Email Address</label>
                      <input
                        type="email"
                        required
                        value={formData.email}
                        onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                        className="w-full px-4 py-3 rounded-xl border-2 border-gray-200 focus:border-violet-500 focus:ring-0 outline-none transition-colors"
                        placeholder="john@example.com"
                      />
                    </div>
                    
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-2">Subject</label>
                      <select
                        value={formData.subject}
                        onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
                        className="w-full px-4 py-3 rounded-xl border-2 border-gray-200 focus:border-violet-500 focus:ring-0 outline-none transition-colors bg-white"
                      >
                        <option value="">Select a topic</option>
                        <option value="general">General Inquiry</option>
                        <option value="support">Customer Support</option>
                        <option value="booking">Booking Issues</option>
                        <option value="feedback">Feedback & Suggestions</option>
                        <option value="partnership">Partnership Opportunities</option>
                        <option value="helper">Become a Helper</option>
                        <option value="other">Something Else</option>
                      </select>
                    </div>
                    
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-2">Your Message</label>
                      <textarea
                        required
                        rows={4}
                        value={formData.message}
                        onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                        className="w-full px-4 py-3 rounded-xl border-2 border-gray-200 focus:border-violet-500 focus:ring-0 outline-none transition-colors resize-none"
                        placeholder="Tell us what's on your mind..."
                      />
                    </div>
                    
                    <Button 
                      type="submit" 
                      disabled={isSubmitting}
                      className="w-full h-14 bg-gradient-to-r from-violet-600 to-purple-600 hover:from-violet-700 hover:to-purple-700 text-white font-bold text-lg rounded-xl shadow-lg shadow-violet-500/30 transition-all disabled:opacity-50"
                    >
                      {isSubmitting ? (
                        <span className="flex items-center gap-2">
                          <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                          Sending...
                        </span>
                      ) : (
                        <span className="flex items-center gap-2">
                          Send Message
                          <Send className="w-5 h-5" />
                        </span>
                      )}
                    </Button>
                  </form>
                )}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ═══════════════════════════════════════════════════════════════════
          FAQ SECTION - HELPFUL
      ═══════════════════════════════════════════════════════════════════ */}
      <section className="py-20 bg-gradient-to-br from-gray-50 via-white to-emerald-50/30">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <div className="inline-flex items-center gap-2 bg-emerald-100 text-emerald-700 px-4 py-2 rounded-full text-sm font-semibold mb-6">
              <Sparkles className="w-4 h-4" />
              Quick Answers
            </div>
            <h2 className="text-4xl font-black text-gray-900 mb-4">
              Got <span className="text-emerald-600">Questions?</span> 🤔
            </h2>
            <p className="text-xl text-gray-500">Here are answers to what most people ask us!</p>
          </div>

          <div className="space-y-4">
            {faqs.map((faq, index) => (
              <div key={index} className="group bg-white rounded-2xl p-6 shadow-lg border border-gray-100 hover:border-emerald-200 hover:shadow-xl transition-all duration-300">
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 bg-gray-100 rounded-xl flex items-center justify-center flex-shrink-0 group-hover:scale-110 transition-transform">
                    <faq.icon className={`w-6 h-6 ${faq.color}`} />
                  </div>
                  <div>
                    <h3 className="text-lg font-bold text-gray-900 mb-2">{faq.question}</h3>
                    <p className="text-gray-600 leading-relaxed">{faq.answer}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>

          <div className="text-center mt-10">
            <p className="text-gray-500 mb-4">
              Still have questions? We&apos;re just a message away!
            </p>
            <a href="mailto:support@helparo.in">
              <Button className="bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl px-8 font-semibold shadow-lg">
                Email Us Directly
                <Mail className="w-4 h-4 ml-2" />
              </Button>
            </a>
          </div>
        </div>
      </section>

      {/* ═══════════════════════════════════════════════════════════════════
          STATS SECTION - TRUST
      ═══════════════════════════════════════════════════════════════════ */}
      <section className="py-16 bg-gradient-to-r from-violet-600 via-purple-600 to-pink-600">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-10">
            <h2 className="text-3xl font-black text-white mb-2">Why People Love Talking to Us</h2>
            <p className="text-violet-200">Our support team is pretty awesome 😎</p>
          </div>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-8">
            {[
              { value: 50000, suffix: '+', label: 'Happy Conversations', emoji: '💬' },
              { value: 2, suffix: ' min', label: 'Avg. Response Time', emoji: '⚡' },
              { value: 98, suffix: '%', label: 'Satisfaction Rate', emoji: '❤️' },
              { value: 24, suffix: '/7', label: 'Email Support', emoji: '📧' },
            ].map((stat) => (
              <div key={stat.label} className="text-center group">
                <div className="text-4xl mb-2">{stat.emoji}</div>
                <p className="text-3xl lg:text-4xl font-black text-white mb-1">
                  <AnimatedCounter end={stat.value} suffix={stat.suffix} />
                </p>
                <p className="text-sm text-violet-200 font-medium">{stat.label}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ═══════════════════════════════════════════════════════════════════
          CTA SECTION - FINAL
      ═══════════════════════════════════════════════════════════════════ */}
      <section className="py-20 bg-white">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <div className="text-6xl mb-6">🚀</div>
          <h2 className="text-4xl font-black text-gray-900 mb-4">
            Ready to Get Started?
          </h2>
          <p className="text-xl text-gray-500 mb-8 max-w-2xl mx-auto">
            Join 50,000+ happy customers who trust Helparo for their home service needs. 
            Book your first service today!
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link href="/services">
              <Button size="lg" className="bg-emerald-600 hover:bg-emerald-700 text-white rounded-2xl px-10 h-14 text-lg font-bold shadow-xl shadow-emerald-500/25">
                Browse Services
                <ArrowRight className="ml-2 w-5 h-5" />
              </Button>
            </Link>
            <Link href="/auth/signup">
              <Button size="lg" variant="outline" className="rounded-2xl px-10 h-14 text-lg font-semibold border-2">
                Create Account
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* ═══════════════════════════════════════════════════════════════════
          FOOTER
      ═══════════════════════════════════════════════════════════════════ */}
      <footer className="bg-gray-900 text-white py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8 lg:gap-12">
            {/* Brand */}
            <div className="lg:col-span-1">
              <div className="flex items-center gap-2.5 mb-4">
                <img src="/logo.svg" alt="Helparo" className="w-10 h-10 rounded-xl" />
                <span className="text-xl font-bold">helparo</span>
              </div>
              <p className="text-gray-400 text-sm mb-6">
                India&apos;s most trusted home services platform. Verified professionals at your doorstep.
              </p>
              {/* Social Links */}
              <div className="flex gap-3">
                {['X', '📸', 'in', 'f'].map((icon, idx) => (
                  <div key={idx} className="w-10 h-10 bg-gray-800 rounded-xl flex items-center justify-center hover:bg-emerald-600 cursor-pointer transition-colors">
                    <span className="text-sm">{icon}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Services */}
            <div>
              <h4 className="font-bold text-white mb-4">SERVICES</h4>
              <ul className="space-y-3 text-sm text-gray-400">
                <li><Link href="/services" className="hover:text-white transition-colors">All Services</Link></li>
                <li><Link href="/customer/book" className="hover:text-white transition-colors">Book Now</Link></li>
                <li><Link href="/pricing" className="hover:text-white transition-colors">Pricing</Link></li>
              </ul>
            </div>

            {/* Partner */}
            <div>
              <h4 className="font-bold text-white mb-4">PARTNER</h4>
              <ul className="space-y-3 text-sm text-gray-400">
                <li><Link href="/helper/register" className="hover:text-white transition-colors">Become a Pro</Link></li>
                <li><Link href="/auth/login" className="hover:text-white transition-colors">Partner Login</Link></li>
                <li><Link href="/helper" className="hover:text-white transition-colors">Resources</Link></li>
              </ul>
            </div>

            {/* Company & Legal */}
            <div>
              <h4 className="font-bold text-white mb-4">COMPANY</h4>
              <ul className="space-y-3 text-sm text-gray-400">
                <li><Link href="/about" className="hover:text-white transition-colors">About Us</Link></li>
                <li><Link href="/contact" className="hover:text-white transition-colors">Contact</Link></li>
                <li><Link href="/legal/terms" className="hover:text-white transition-colors">Terms</Link></li>
                <li><Link href="/legal/privacy" className="hover:text-white transition-colors">Privacy</Link></li>
                <li><Link href="/legal/refunds" className="hover:text-white transition-colors">Refunds</Link></li>
              </ul>
            </div>
          </div>

          {/* Bottom Bar */}
          <div className="border-t border-gray-800 mt-12 pt-8 flex flex-col md:flex-row justify-between items-center gap-4">
            <p className="text-sm text-gray-400">
              © {new Date().getFullYear()} Helparo Services Pvt. Ltd. All rights reserved.
            </p>
            <p className="text-sm text-gray-400 flex items-center gap-2">
              Made with <Heart className="w-4 h-4 text-red-500" /> in India 🇮🇳
            </p>
          </div>
        </div>
      </footer>
      </div>
    </div>
  )
}
