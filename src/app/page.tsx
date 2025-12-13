'use client'

import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { 
  ArrowRight,
  Shield,
  Clock,
  Star,
  MapPin,
  Zap,
  BadgeCheck,
  ChevronRight,
  Award,
  Headphones,
  Sparkles,
  ArrowUpRight,
  Menu,
  X,
  Play,
  Heart,
  Users,
  Timer,
  Phone,
  MessageCircle,
  IndianRupee,
  Rocket,
  Crown,
  Wand2,
  Search,
  UserCheck,
  PartyPopper
} from 'lucide-react'
import { useState, useEffect, useRef } from 'react'

// Animated Counter with intersection observer
function AnimatedCounter({ end, duration = 2000, suffix = '', prefix = '' }: { end: number; duration?: number; suffix?: string; prefix?: string }) {
  const [count, setCount] = useState(0)
  const [isVisible, setIsVisible] = useState(false)
  const ref = useRef<HTMLSpanElement>(null)

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) setIsVisible(true)
      },
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

  return <span ref={ref}>{prefix}{count.toLocaleString()}{suffix}</span>
}

export default function LandingPage() {
  const [currentService, setCurrentService] = useState(0)
  const [isScrolled, setIsScrolled] = useState(false)
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [activeTestimonial, setActiveTestimonial] = useState(0)
  const [showHowItWorks, setShowHowItWorks] = useState(false)
  
  const services = ['Plumber', 'Electrician', 'Cleaner', 'Carpenter', 'AC Expert']
  
  useEffect(() => {
    const interval = setInterval(() => setCurrentService((p) => (p + 1) % services.length), 2500)
    return () => clearInterval(interval)
  }, [services.length])

  useEffect(() => {
    const handleScroll = () => setIsScrolled(window.scrollY > 20)
    window.addEventListener('scroll', handleScroll)
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  useEffect(() => {
    const interval = setInterval(() => setActiveTestimonial((p) => (p + 1) % 3), 5000)
    return () => clearInterval(interval)
  }, [])

  const testimonials = [
    { name: 'Priya Sharma', location: 'Mumbai', text: 'Absolutely incredible service! The plumber arrived in 15 minutes and fixed everything perfectly. This is the future of home services.', rating: 5, avatar: 'PS' },
    { name: 'Rahul Verma', location: 'Bangalore', text: 'I\'ve tried many apps but Helparo is on another level. Professional, punctual, and the app experience is so smooth!', rating: 5, avatar: 'RV' },
    { name: 'Anita Desai', location: 'Delhi', text: 'The AC technician was so professional and knowledgeable. Fair pricing, no hidden charges. Highly recommend!', rating: 5, avatar: 'AD' },
  ]

  return (
    <div className="min-h-screen bg-white overflow-hidden">
      {/* ═══════════════════════════════════════════════════════════════════
          HOW IT WORKS MODAL - FULL FLOW EXPLANATION
      ═══════════════════════════════════════════════════════════════════ */}
      {showHowItWorks && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          {/* Backdrop */}
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setShowHowItWorks(false)} />
          
          {/* Modal */}
          <div className="relative bg-white rounded-3xl max-w-4xl w-full max-h-[90vh] overflow-y-auto shadow-2xl animate-fade-in">
            {/* Close Button */}
            <button 
              onClick={() => setShowHowItWorks(false)}
              className="absolute top-4 right-4 w-10 h-10 rounded-full bg-gray-100 hover:bg-gray-200 flex items-center justify-center transition-colors z-10"
            >
              <X className="w-5 h-5" />
            </button>

            {/* Modal Content */}
            <div className="p-8 lg:p-12">
              {/* Header */}
              <div className="text-center mb-10">
                <div className="inline-flex items-center gap-2 bg-gradient-to-r from-emerald-500 to-teal-500 text-white px-4 py-2 rounded-full text-sm font-bold mb-4">
                  <Play className="w-4 h-4" />
                  How Helparo Works
                </div>
                <h2 className="text-3xl lg:text-4xl font-black text-gray-900 mb-3">
                  Book in 60 seconds,<br /><span className="text-emerald-600">get help in minutes</span>
                </h2>
                <p className="text-gray-500 text-lg">Revolutionary AI-powered booking with self-pricing</p>
              </div>

              {/* Flow Steps */}
              <div className="space-y-6">
                {/* Step 1 */}
                <div className="flex gap-6 items-start p-6 bg-gradient-to-r from-blue-50 to-cyan-50 rounded-2xl border border-blue-100">
                  <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-blue-500 to-cyan-500 flex items-center justify-center flex-shrink-0 shadow-lg shadow-blue-500/30">
                    <span className="text-2xl">📱</span>
                  </div>
                  <div>
                    <div className="text-xs font-bold text-blue-600 mb-1">STEP 1</div>
                    <h3 className="text-xl font-bold text-gray-900 mb-2">Select Your Service</h3>
                    <p className="text-gray-600">Choose from 50+ professional services - plumbing, electrical, cleaning, AC repair, carpentry & more. Our AI understands exactly what you need.</p>
                  </div>
                </div>

                {/* Step 2 - THE GAME CHANGER */}
                <div className="flex gap-6 items-start p-6 bg-gradient-to-r from-amber-50 via-yellow-50 to-orange-50 rounded-2xl border-2 border-amber-300 relative overflow-hidden">
                  <div className="absolute top-2 right-2">
                    <span className="bg-gradient-to-r from-orange-500 to-pink-500 text-white text-xs font-bold px-3 py-1 rounded-full">🔥 REVOLUTIONARY</span>
                  </div>
                  <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-amber-400 to-orange-500 flex items-center justify-center flex-shrink-0 shadow-lg shadow-amber-500/30">
                    <IndianRupee className="w-7 h-7 text-white" />
                  </div>
                  <div>
                    <div className="text-xs font-bold text-amber-600 mb-1">STEP 2 • INDIA&apos;S FIRST</div>
                    <h3 className="text-xl font-bold text-gray-900 mb-2">YOU Decide Your Price! 💰</h3>
                    <p className="text-gray-600 mb-3">No fixed rates, no surprises! Tell us your budget and our AI matches you with pros willing to work at YOUR price. Fair for customers, fair for helpers.</p>
                    <div className="flex flex-wrap gap-2">
                      <span className="bg-white px-3 py-1 rounded-full text-xs font-semibold text-amber-700 border border-amber-200">✓ No Hidden Charges</span>
                      <span className="bg-white px-3 py-1 rounded-full text-xs font-semibold text-amber-700 border border-amber-200">✓ Transparent Pricing</span>
                      <span className="bg-white px-3 py-1 rounded-full text-xs font-semibold text-amber-700 border border-amber-200">✓ Win-Win for All</span>
                    </div>
                  </div>
                </div>

                {/* Step 3 */}
                <div className="flex gap-6 items-start p-6 bg-gradient-to-r from-violet-50 to-purple-50 rounded-2xl border border-violet-100">
                  <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-violet-500 to-purple-600 flex items-center justify-center flex-shrink-0 shadow-lg shadow-violet-500/30">
                    <Wand2 className="w-7 h-7 text-white" />
                  </div>
                  <div>
                    <div className="text-xs font-bold text-violet-600 mb-1">STEP 3 • AI MAGIC</div>
                    <h3 className="text-xl font-bold text-gray-900 mb-2">AI Finds Your Perfect Match</h3>
                    <p className="text-gray-600">Our smart AI instantly matches you with verified professionals near you who accept your price, have great ratings, and are available NOW.</p>
                  </div>
                </div>

                {/* Step 4 */}
                <div className="flex gap-6 items-start p-6 bg-gradient-to-r from-emerald-50 to-teal-50 rounded-2xl border border-emerald-100">
                  <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-emerald-500 to-teal-500 flex items-center justify-center flex-shrink-0 shadow-lg shadow-emerald-500/30">
                    <span className="text-2xl">🎯</span>
                  </div>
                  <div>
                    <div className="text-xs font-bold text-emerald-600 mb-1">STEP 4</div>
                    <h3 className="text-xl font-bold text-gray-900 mb-2">Pro Arrives in Minutes</h3>
                    <p className="text-gray-600">Track your professional in real-time. They arrive at your doorstep within 30 minutes on average. You can chat or call them directly.</p>
                  </div>
                </div>

                {/* Step 5 */}
                <div className="flex gap-6 items-start p-6 bg-gradient-to-r from-green-50 to-emerald-50 rounded-2xl border border-green-100">
                  <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-green-500 to-emerald-600 flex items-center justify-center flex-shrink-0 shadow-lg shadow-green-500/30">
                    <span className="text-2xl">✅</span>
                  </div>
                  <div>
                    <div className="text-xs font-bold text-green-600 mb-1">STEP 5</div>
                    <h3 className="text-xl font-bold text-gray-900 mb-2">Job Done, Pay Securely</h3>
                    <p className="text-gray-600">Only pay after you&apos;re satisfied. Secure payment options. Rate your experience. 100% satisfaction guaranteed or money back!</p>
                  </div>
                </div>
              </div>

              {/* CTA */}
              <div className="mt-10 text-center">
                <Button 
                  size="lg" 
                  className="bg-emerald-600 hover:bg-emerald-700 text-white rounded-2xl px-10 h-14 text-base font-bold shadow-xl shadow-emerald-500/30 hover:scale-105 transition-all" 
                  asChild
                >
                  <Link href="/auth/signup">
                    Try It Now - It&apos;s Free!
                    <ArrowRight className="ml-2 w-5 h-5" />
                  </Link>
                </Button>
                <p className="text-sm text-gray-500 mt-3">No credit card required • Book in 60 seconds</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Stunning Gradient Background */}
      <div className="fixed inset-0 pointer-events-none">
        <div className="absolute top-0 left-0 w-full h-full bg-[radial-gradient(ellipse_80%_50%_at_50%_-20%,rgba(16,185,129,0.12),transparent)]" />
        <div className="absolute bottom-0 right-0 w-[800px] h-[800px] bg-[radial-gradient(circle,rgba(16,185,129,0.06),transparent_70%)]" />
      </div>

      {/* Premium Glass Header */}
      <header className={`fixed top-0 left-0 right-0 z-50 transition-all duration-500 ${
        isScrolled 
          ? 'bg-white/80 backdrop-blur-2xl shadow-[0_2px_40px_-12px_rgba(0,0,0,0.1)] border-b border-gray-100' 
          : 'bg-transparent'
      }`}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-18 lg:h-20">
            {/* Logo */}
            <Link href="/" className="flex items-center gap-2.5 group">
              <div className="relative">
                <img src="/logo.svg" alt="Helparo" className="w-11 h-11 rounded-[14px] shadow-lg shadow-emerald-500/20 group-hover:shadow-emerald-500/40 group-hover:scale-105 transition-all duration-300" />
              </div>
              <div className="flex flex-col">
                <span className="text-[22px] font-extrabold tracking-tight text-gray-900">helparo</span>
                <span className="text-[10px] font-semibold text-emerald-600 tracking-[0.15em] uppercase -mt-1">Home Services</span>
              </div>
            </Link>

            {/* Desktop Nav */}
            <nav className="hidden md:flex items-center gap-1">
              <Link href="/services" className="px-4 py-2 text-[15px] font-medium text-gray-600 hover:text-emerald-600 rounded-xl hover:bg-emerald-50 transition-all">
                Services
              </Link>
              <Link href="/about" className="px-4 py-2 text-[15px] font-medium text-gray-600 hover:text-emerald-600 rounded-xl hover:bg-emerald-50 transition-all">
                About
              </Link>
              <Link href="/helper/register" className="px-4 py-2 text-[15px] font-medium text-gray-600 hover:text-emerald-600 rounded-xl hover:bg-emerald-50 transition-all flex items-center gap-1.5">
                <Sparkles className="w-4 h-4" />
                Partner with us
              </Link>
            </nav>

            {/* CTA Buttons */}
            <div className="hidden md:flex items-center gap-3">
              <Button variant="ghost" className="text-gray-700 hover:text-emerald-600 font-semibold rounded-xl hover:bg-emerald-50" asChild>
                <Link href="/auth/login">Log in</Link>
              </Button>
              <Button className="bg-gray-900 hover:bg-gray-800 text-white rounded-xl px-5 font-semibold shadow-lg shadow-gray-900/10 hover:shadow-gray-900/20 hover:scale-[1.02] transition-all" asChild>
                <Link href="/auth/signup">Get Started</Link>
              </Button>
            </div>

            {/* Mobile Menu */}
            <button 
              className="md:hidden p-2.5 rounded-xl hover:bg-gray-100 transition-colors"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            >
              {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>

        {/* Mobile Menu Panel */}
        {mobileMenuOpen && (
          <div className="md:hidden absolute top-full left-0 right-0 bg-white/95 backdrop-blur-2xl border-b border-gray-100 py-6 px-4">
            <div className="flex flex-col gap-2">
              <Link href="/services" className="px-4 py-3 text-gray-700 font-medium rounded-xl hover:bg-gray-50">Services</Link>
              <Link href="/about" className="px-4 py-3 text-gray-700 font-medium rounded-xl hover:bg-gray-50">About</Link>
              <Link href="/helper/register" className="px-4 py-3 text-gray-700 font-medium rounded-xl hover:bg-gray-50">Partner with us</Link>
              <hr className="my-2 border-gray-100" />
              <Link href="/auth/login" className="px-4 py-3 text-gray-700 font-medium rounded-xl hover:bg-gray-50">Log in</Link>
              <Button className="mt-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-semibold" asChild>
                <Link href="/auth/signup">Get Started Free</Link>
              </Button>
            </div>
          </div>
        )}
      </header>

      {/* ═══════════════════════════════════════════════════════════════════
          HERO SECTION - THE WOW FACTOR
      ═══════════════════════════════════════════════════════════════════ */}
      <section className="relative pt-28 sm:pt-32 lg:pt-40 pb-16 sm:pb-20 lg:pb-32">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid lg:grid-cols-2 gap-8 lg:gap-20 items-center">
            
            {/* Left: Content */}
            <div className="relative z-10">
              {/* 🚀 INDIA'S FIRST - Revolutionary Badge */}
              <div className="flex flex-wrap items-center gap-3 mb-6 animate-fade-in">
                <div className="inline-flex items-center gap-2 bg-gradient-to-r from-orange-500 to-pink-500 text-white px-4 py-2 rounded-full shadow-lg shadow-orange-500/25">
                  <Rocket className="w-4 h-4" />
                  <span className="text-sm font-bold">🇮🇳 India&apos;s First</span>
                </div>
                <div className="inline-flex items-center gap-2 bg-gradient-to-r from-violet-500 to-purple-600 text-white px-4 py-2 rounded-full shadow-lg shadow-purple-500/25">
                  <Sparkles className="w-4 h-4" />
                  <span className="text-sm font-bold">AI-Powered</span>
                </div>
              </div>

              {/* Trust Badge */}
              <div className="inline-flex items-center gap-2 bg-gradient-to-r from-emerald-50 to-teal-50 border border-emerald-100 px-4 py-2 rounded-full mb-4 animate-fade-in">
                <div className="flex -space-x-1.5">
                  {['😊', '🙂', '😄'].map((e, i) => (
                    <span key={i} className="w-6 h-6 rounded-full bg-white border-2 border-emerald-50 flex items-center justify-center text-xs">{e}</span>
                  ))}
                </div>
                <span className="text-sm font-semibold text-emerald-800">50,000+ happy customers</span>
                <span className="flex items-center text-sm font-bold text-amber-600">
                  <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400 mr-0.5" />
                  4.9
                </span>
              </div>

              {/* Main Headline */}
              <h1 className="text-[2.5rem] sm:text-5xl md:text-6xl lg:text-[4.25rem] font-black text-gray-900 leading-[1.05] tracking-tight mb-4">
                Home services
                <br />
                <span className="relative">
                  <span className="bg-gradient-to-r from-emerald-600 via-emerald-500 to-teal-500 bg-clip-text text-transparent">
                    made magical
                  </span>
                  <svg className="absolute -bottom-2 left-0 w-full" viewBox="0 0 300 12" fill="none">
                    <path d="M2 10C50 4 100 4 150 7C200 10 250 6 298 3" stroke="url(#underline)" strokeWidth="4" strokeLinecap="round"/>
                    <defs>
                      <linearGradient id="underline" x1="0" y1="0" x2="300" y2="0">
                        <stop stopColor="#10b981"/>
                        <stop offset="1" stopColor="#14b8a6"/>
                      </linearGradient>
                    </defs>
                  </svg>
                </span>
              </h1>

              {/* Subheadline with rotating service + YOU DECIDE PRICE */}
              <p className="text-xl sm:text-2xl text-gray-500 mb-4 leading-relaxed">
                Get a verified <span className="font-bold text-gray-900 transition-all duration-300">{services[currentService]}</span> at your
                <br className="hidden sm:block" />
                doorstep in <span className="text-emerald-600 font-bold">under 30 minutes</span>
              </p>

              {/* 💰 YOU DECIDE YOUR PRICE - THE GAME CHANGER */}
              <div className="bg-gradient-to-r from-amber-50 via-yellow-50 to-orange-50 border-2 border-amber-200 rounded-2xl p-3 mb-6 animate-fade-in">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-amber-400 to-orange-500 flex items-center justify-center shadow-lg shadow-amber-500/30">
                    <IndianRupee className="w-6 h-6 text-white" />
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-bold text-amber-800 flex items-center gap-2">
                      <Crown className="w-4 h-4 text-amber-600" />
                      YOU Decide Your Price!
                    </p>
                    <p className="text-xs text-amber-700">India&apos;s first self-price-deciding platform • No fixed rates • Fair for everyone</p>
                  </div>
                </div>
              </div>

              {/* CTA Group */}
              <div className="flex flex-col sm:flex-row gap-4 mb-12">
                <Button 
                  size="lg" 
                  className="group bg-emerald-600 hover:bg-emerald-700 text-white rounded-2xl px-8 h-14 text-base font-bold shadow-xl shadow-emerald-600/25 hover:shadow-emerald-600/40 hover:scale-[1.02] transition-all duration-300" 
                  asChild
                >
                  <Link href="/auth/signup">
                    Book a Pro Now
                    <ArrowRight className="ml-2 w-5 h-5 group-hover:translate-x-1 transition-transform" />
                  </Link>
                </Button>
                <Button 
                  size="lg" 
                  variant="outline" 
                  className="group rounded-2xl px-8 h-14 text-base font-semibold border-2 border-gray-200 hover:border-gray-300 hover:bg-gray-50 transition-all" 
                  onClick={() => setShowHowItWorks(true)}
                >
                  <Play className="w-5 h-5 mr-2 text-emerald-600" />
                  See how it works
                </Button>
              </div>

              {/* Trust Indicators */}
              <div className="flex flex-wrap items-center gap-6 text-sm text-gray-500">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-lg bg-emerald-100 flex items-center justify-center">
                    <Shield className="w-4 h-4 text-emerald-600" />
                  </div>
                  <span className="font-medium">Background verified</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-lg bg-blue-100 flex items-center justify-center">
                    <Clock className="w-4 h-4 text-blue-600" />
                  </div>
                  <span className="font-medium">On-time guarantee</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-lg bg-purple-100 flex items-center justify-center">
                    <Award className="w-4 h-4 text-purple-600" />
                  </div>
                  <span className="font-medium">Satisfaction assured</span>
                </div>
              </div>
            </div>

            {/* Right: Hero Visual */}
            <div className="relative hidden lg:block">
              {/* Main Hero Image/Illustration Area */}
              <div className="relative">
                {/* Decorative Background */}
                <div className="absolute inset-0 bg-gradient-to-br from-emerald-100 via-emerald-50 to-teal-50 rounded-[3rem] transform rotate-3 scale-105" />
                
                {/* Main Card */}
                <div className="relative bg-white rounded-[2.5rem] p-8 shadow-2xl shadow-gray-200/50 border border-gray-100">
                  {/* Live Booking Header */}
                  <div className="flex items-center justify-between mb-6">
                    <div className="flex items-center gap-3">
                      <div className="relative">
                        <div className="w-3 h-3 bg-emerald-500 rounded-full animate-pulse" />
                        <div className="absolute inset-0 w-3 h-3 bg-emerald-500 rounded-full animate-ping" />
                      </div>
                      <span className="text-sm font-bold text-emerald-700">Live Booking</span>
                    </div>
                    <span className="text-xs font-medium text-gray-400 bg-gray-100 px-3 py-1 rounded-full">Just now</span>
                  </div>

                  {/* Professional Card */}
                  <div className="bg-gradient-to-br from-gray-50 to-gray-100/50 rounded-2xl p-5 mb-5">
                    <div className="flex items-center gap-4">
                      <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-emerald-500 to-teal-500 flex items-center justify-center text-white text-2xl font-bold shadow-lg shadow-emerald-500/30">
                        RK
                      </div>
                      <div className="flex-1">
                        <h3 className="font-bold text-gray-900 text-lg">Rajesh Kumar</h3>
                        <p className="text-gray-500 text-sm">Expert Plumber • 8 yrs exp</p>
                        <div className="flex items-center gap-2 mt-1">
                          <div className="flex">
                            {[1,2,3,4,5].map(i => (
                              <Star key={i} className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
                            ))}
                          </div>
                          <span className="text-xs font-semibold text-gray-600">4.9 (2,847)</span>
                        </div>
                      </div>
                      <div className="text-right">
                        <span className="inline-flex items-center gap-1 text-xs font-bold text-emerald-700 bg-emerald-100 px-2.5 py-1 rounded-full">
                          <BadgeCheck className="w-3.5 h-3.5" />
                          Verified
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Arrival Time */}
                  <div className="flex items-center justify-between bg-emerald-50 rounded-2xl p-4 border border-emerald-100">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-emerald-500 flex items-center justify-center">
                        <Timer className="w-5 h-5 text-white" />
                      </div>
                      <div>
                        <p className="text-xs font-medium text-emerald-600">Arriving in</p>
                        <p className="text-2xl font-black text-emerald-700">12 min</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <button className="w-10 h-10 rounded-xl bg-white border border-emerald-200 flex items-center justify-center hover:bg-emerald-50 transition-colors">
                        <Phone className="w-4 h-4 text-emerald-600" />
                      </button>
                      <button className="w-10 h-10 rounded-xl bg-white border border-emerald-200 flex items-center justify-center hover:bg-emerald-50 transition-colors">
                        <MessageCircle className="w-4 h-4 text-emerald-600" />
                      </button>
                    </div>
                  </div>
                </div>

                {/* Floating Elements */}
                <div className="absolute -top-6 -right-6 bg-white rounded-2xl p-4 shadow-xl shadow-gray-200/50 border border-gray-100 animate-float">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-amber-400 to-orange-500 flex items-center justify-center shadow-lg shadow-orange-500/30">
                      <Star className="w-6 h-6 text-white fill-white" />
                    </div>
                    <div>
                      <p className="text-2xl font-black text-gray-900">4.9</p>
                      <p className="text-xs text-gray-500 font-medium">50K+ ratings</p>
                    </div>
                  </div>
                </div>

                <div className="absolute -bottom-4 -left-8 bg-white rounded-2xl p-4 shadow-xl shadow-gray-200/50 border border-gray-100 animate-float-delayed">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-500 flex items-center justify-center shadow-lg shadow-emerald-500/30">
                      <Users className="w-6 h-6 text-white" />
                    </div>
                    <div>
                      <p className="text-2xl font-black text-gray-900">10K+</p>
                      <p className="text-xs text-gray-500 font-medium">Expert pros</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ═══════════════════════════════════════════════════════════════════
          SOCIAL PROOF BAR
      ═══════════════════════════════════════════════════════════════════ */}
      <section className="py-8 bg-gray-50 border-y border-gray-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-wrap items-center justify-center gap-8 lg:gap-16">
            <div className="text-center">
              <p className="text-3xl lg:text-4xl font-black text-gray-900">
                <AnimatedCounter end={50000} suffix="+" />
              </p>
              <p className="text-sm text-gray-500 font-medium mt-1">Happy Customers</p>
            </div>
            <div className="hidden sm:block w-px h-12 bg-gray-200" />
            <div className="text-center">
              <p className="text-3xl lg:text-4xl font-black text-gray-900">
                <AnimatedCounter end={10000} suffix="+" />
              </p>
              <p className="text-sm text-gray-500 font-medium mt-1">Verified Pros</p>
            </div>
            <div className="hidden sm:block w-px h-12 bg-gray-200" />
            <div className="text-center">
              <p className="text-3xl lg:text-4xl font-black text-gray-900">
                <AnimatedCounter end={25} suffix="+" />
              </p>
              <p className="text-sm text-gray-500 font-medium mt-1">Cities</p>
            </div>
            <div className="hidden sm:block w-px h-12 bg-gray-200" />
            <div className="text-center">
              <p className="text-3xl lg:text-4xl font-black text-emerald-600">
                <AnimatedCounter end={98} suffix="%" />
              </p>
              <p className="text-sm text-gray-500 font-medium mt-1">Satisfaction</p>
            </div>
          </div>
        </div>
      </section>

      {/* ═══════════════════════════════════════════════════════════════════
          🔥 REVOLUTIONARY SECTION - AI + YOU DECIDE PRICE
      ═══════════════════════════════════════════════════════════════════ */}
      <section className="py-20 lg:py-28 bg-gradient-to-br from-gray-900 via-gray-900 to-gray-800 text-white relative overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,rgba(16,185,129,0.15),transparent_60%)]" />
        <div className="absolute inset-0 bg-[url('data:image/svg+xml,%3Csvg%20width%3D%2260%22%20height%3D%2260%22%20viewBox%3D%220%200%2060%2060%22%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%3E%3Cg%20fill%3D%22none%22%20fill-rule%3D%22evenodd%22%3E%3Cg%20fill%3D%22%23ffffff%22%20fill-opacity%3D%220.02%22%3E%3Cpath%20d%3D%22M36%2034v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6%2034v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6%204V0H4v4H0v2h4v4h2V6h4V4H6z%22%2F%3E%3C%2Fg%3E%3C%2Fg%3E%3C%2Fsvg%3E')] opacity-50" />
        
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative">
          <div className="text-center mb-16">
            <div className="inline-flex items-center gap-3 mb-6">
              <span className="bg-gradient-to-r from-orange-500 to-pink-500 text-white text-xs font-bold px-4 py-2 rounded-full animate-pulse">🇮🇳 INDIA&apos;S FIRST</span>
              <span className="bg-gradient-to-r from-violet-500 to-purple-600 text-white text-xs font-bold px-4 py-2 rounded-full">REVOLUTIONARY</span>
            </div>
            <h2 className="text-3xl sm:text-4xl lg:text-6xl font-black mb-6 leading-tight">
              AI-Powered Platform Where
              <br />
              <span className="bg-gradient-to-r from-amber-400 via-yellow-400 to-orange-400 bg-clip-text text-transparent">YOU Decide Your Price</span>
            </h2>
            <p className="text-xl text-gray-400 max-w-3xl mx-auto">
              No more fixed rates. No more overcharging. Tell us your budget, and our AI matches you with professionals who accept YOUR price. Revolutionary, fair, and transparent.
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 lg:gap-8">
            {/* Feature 1 */}
            <div className="bg-white/5 backdrop-blur-sm rounded-3xl p-8 border border-white/10 hover:border-amber-500/50 hover:bg-white/10 transition-all group">
              <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-amber-400 to-orange-500 flex items-center justify-center mb-6 shadow-xl shadow-amber-500/30 group-hover:scale-110 transition-transform">
                <IndianRupee className="w-8 h-8 text-white" />
              </div>
              <h3 className="text-2xl font-bold mb-3">Name Your Price</h3>
              <p className="text-gray-400 leading-relaxed">You set the budget. Plumber needed? Tell us ₹300. Cleaning? Maybe ₹500. YOU are in control. No bargaining, no stress.</p>
            </div>

            {/* Feature 2 */}
            <div className="bg-white/5 backdrop-blur-sm rounded-3xl p-8 border border-white/10 hover:border-violet-500/50 hover:bg-white/10 transition-all group">
              <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-violet-500 to-purple-600 flex items-center justify-center mb-6 shadow-xl shadow-violet-500/30 group-hover:scale-110 transition-transform">
                <Wand2 className="w-8 h-8 text-white" />
              </div>
              <h3 className="text-2xl font-bold mb-3">AI Smart Matching</h3>
              <p className="text-gray-400 leading-relaxed">Our AI instantly finds verified pros near you who are willing to work at your price. Smart algorithms ensure best match every time.</p>
            </div>

            {/* Feature 3 */}
            <div className="bg-white/5 backdrop-blur-sm rounded-3xl p-8 border border-white/10 hover:border-emerald-500/50 hover:bg-white/10 transition-all group md:col-span-2 lg:col-span-1">
              <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-emerald-500 to-teal-500 flex items-center justify-center mb-6 shadow-xl shadow-emerald-500/30 group-hover:scale-110 transition-transform">
                <Crown className="w-8 h-8 text-white" />
              </div>
              <h3 className="text-2xl font-bold mb-3">Win-Win for Everyone</h3>
              <p className="text-gray-400 leading-relaxed">Customers get fair prices. Helpers get fair work. No middleman markup. This is how home services should be!</p>
            </div>
          </div>

          {/* Trust Indicators */}
          <div className="mt-16 flex flex-wrap items-center justify-center gap-8 text-center">
            <div>
              <p className="text-4xl font-black text-amber-400">₹0</p>
              <p className="text-sm text-gray-500 mt-1">Hidden Charges</p>
            </div>
            <div className="w-px h-12 bg-white/10" />
            <div>
              <p className="text-4xl font-black text-emerald-400">100%</p>
              <p className="text-sm text-gray-500 mt-1">Transparent</p>
            </div>
            <div className="w-px h-12 bg-white/10" />
            <div>
              <p className="text-4xl font-black text-violet-400">AI</p>
              <p className="text-sm text-gray-500 mt-1">Powered Matching</p>
            </div>
            <div className="w-px h-12 bg-white/10" />
            <div>
              <p className="text-4xl font-black text-pink-400">#1</p>
              <p className="text-sm text-gray-500 mt-1">In India</p>
            </div>
          </div>

          {/* CTA */}
          <div className="mt-12 text-center">
            <Button 
              size="lg" 
              className="bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white rounded-2xl px-10 h-14 text-base font-bold shadow-xl shadow-amber-500/30 hover:scale-105 transition-all" 
              asChild
            >
              <Link href="/auth/signup">
                Try Self-Pricing Now
                <ArrowRight className="ml-2 w-5 h-5" />
              </Link>
            </Button>
          </div>
        </div>
      </section>

      {/* ═══════════════════════════════════════════════════════════════════
          SERVICES SECTION - STUNNING GRID
      ═══════════════════════════════════════════════════════════════════ */}
      <section className="py-24 lg:py-32 bg-white relative">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Section Header */}
          <div className="text-center mb-16">
            <div className="inline-flex items-center gap-2 bg-emerald-50 text-emerald-700 px-4 py-2 rounded-full text-sm font-semibold mb-6">
              <Sparkles className="w-4 h-4" />
              Popular Services
            </div>
            <h2 className="text-4xl lg:text-5xl font-black text-gray-900 mb-4">
              What do you need <span className="text-emerald-600">help</span> with?
            </h2>
            <p className="text-xl text-gray-500 max-w-2xl mx-auto">
              Professional services delivered by verified experts. Book in seconds.
            </p>
          </div>

          {/* Services Grid */}
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 lg:gap-6">
            {[
              { name: 'Plumbing', icon: '🔧', desc: 'Leaks, pipes & taps', bg: 'bg-blue-50', hover: 'hover:border-blue-200 hover:shadow-blue-100' },
              { name: 'Electrical', icon: '⚡', desc: 'Wiring & repairs', bg: 'bg-amber-50', hover: 'hover:border-amber-200 hover:shadow-amber-100' },
              { name: 'Cleaning', icon: '✨', desc: 'Deep clean homes', bg: 'bg-emerald-50', hover: 'hover:border-emerald-200 hover:shadow-emerald-100' },
              { name: 'Carpentry', icon: '🪵', desc: 'Furniture & wood', bg: 'bg-orange-50', hover: 'hover:border-orange-200 hover:shadow-orange-100' },
              { name: 'AC Service', icon: '❄️', desc: 'Repair & install', bg: 'bg-cyan-50', hover: 'hover:border-cyan-200 hover:shadow-cyan-100' },
              { name: 'Painting', icon: '🎨', desc: 'Interior & exterior', bg: 'bg-pink-50', hover: 'hover:border-pink-200 hover:shadow-pink-100' },
              { name: 'Appliances', icon: '🔌', desc: 'Repair all brands', bg: 'bg-violet-50', hover: 'hover:border-violet-200 hover:shadow-violet-100' },
              { name: 'Pest Control', icon: '🛡️', desc: 'Safe treatment', bg: 'bg-red-50', hover: 'hover:border-red-200 hover:shadow-red-100' },
            ].map((service) => (
              <Link
                key={service.name}
                href={`/auth/signup?service=${encodeURIComponent(service.name.toLowerCase())}`}
                className={`group relative p-6 rounded-3xl bg-white border-2 border-gray-100 ${service.hover} hover:shadow-xl hover:-translate-y-2 transition-all duration-300`}
              >
                <div className={`w-14 h-14 rounded-2xl ${service.bg} flex items-center justify-center text-3xl mb-4 group-hover:scale-110 transition-transform duration-300`}>
                  {service.icon}
                </div>
                <h3 className="text-lg font-bold text-gray-900 mb-1">{service.name}</h3>
                <p className="text-sm text-gray-500 mb-3">{service.desc}</p>
                <span className="inline-flex items-center text-sm font-semibold text-emerald-600 opacity-0 group-hover:opacity-100 transition-opacity">
                  Book now <ArrowRight className="w-4 h-4 ml-1 group-hover:translate-x-1 transition-transform" />
                </span>
              </Link>
            ))}
          </div>

          <div className="text-center mt-12">
            <Button variant="outline" className="rounded-full px-8 h-12 text-base font-semibold border-2 hover:bg-gray-50 group" asChild>
              <Link href="/services">
                View all 50+ services
                <ChevronRight className="w-4 h-4 ml-1 group-hover:translate-x-1 transition-transform" />
              </Link>
            </Button>
          </div>
        </div>
      </section>

      {/* ═══════════════════════════════════════════════════════════════════
          HOW IT WORKS - VISUAL TIMELINE
      ═══════════════════════════════════════════════════════════════════ */}
      <section className="py-24 lg:py-32 bg-gradient-to-b from-gray-50 to-white relative overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,rgba(16,185,129,0.05),transparent_70%)]" />
        
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative">
          <div className="text-center mb-16">
            <div className="inline-flex items-center gap-2 bg-emerald-50 text-emerald-700 px-4 py-2 rounded-full text-sm font-semibold mb-6">
              <Zap className="w-4 h-4" />
              Super Easy
            </div>
            <h2 className="text-4xl lg:text-5xl font-black text-gray-900 mb-4">
              Book in <span className="text-emerald-600">3 simple</span> steps
            </h2>
            <p className="text-xl text-gray-500 max-w-2xl mx-auto">
              No phone calls. No waiting. Just instant help.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8 lg:gap-12">
            {[
              { step: '01', title: 'Choose Service', desc: 'Pick from 50+ professional services', Icon: Search, color: 'from-blue-500 to-indigo-600' },
              { step: '02', title: 'Get Matched', desc: 'We find the best pro near you instantly', Icon: UserCheck, color: 'from-emerald-500 to-teal-500' },
              { step: '03', title: 'Job Done!', desc: 'Sit back & relax. Pay after service.', Icon: PartyPopper, color: 'from-amber-500 to-orange-500' }
            ].map((item, idx) => (
              <div key={item.step} className="relative group">
                {idx < 2 && (
                  <div className="hidden md:block absolute top-16 left-[60%] w-[80%] h-0.5 bg-gradient-to-r from-gray-200 to-transparent" />
                )}
                <div className="bg-white rounded-3xl p-8 shadow-lg shadow-gray-100 border border-gray-100 hover:shadow-xl hover:-translate-y-2 transition-all duration-300">
                  <div className={`w-20 h-20 rounded-2xl bg-gradient-to-br ${item.color} flex items-center justify-center mb-6 shadow-lg group-hover:scale-110 transition-transform duration-300`}>
                    <item.Icon className="w-10 h-10 text-white" strokeWidth={2} />
                  </div>
                  <div className="text-sm font-bold text-emerald-600 mb-2">STEP {item.step}</div>
                  <h3 className="text-2xl font-bold text-gray-900 mb-3">{item.title}</h3>
                  <p className="text-gray-500 leading-relaxed">{item.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ═══════════════════════════════════════════════════════════════════
          WHY CHOOSE US - TRUST SECTION
      ═══════════════════════════════════════════════════════════════════ */}
      <section className="py-24 lg:py-32 bg-white relative">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid lg:grid-cols-2 gap-16 lg:gap-24 items-center">
            {/* Left Content */}
            <div>
              <div className="inline-flex items-center gap-2 bg-emerald-50 text-emerald-700 px-4 py-2 rounded-full text-sm font-semibold mb-6">
                <Shield className="w-4 h-4" />
                Why Helparo
              </div>
              <h2 className="text-4xl lg:text-5xl font-black text-gray-900 mb-6 leading-tight">
                Built for <span className="text-emerald-600">trust</span>,
                <br />designed for <span className="text-blue-600">you</span>
              </h2>
              <p className="text-xl text-gray-500 mb-10 leading-relaxed">
                We&apos;re building India&apos;s most trusted home services platform. Every professional goes through rigorous verification.
              </p>

              <div className="space-y-6">
                {[
                  { icon: BadgeCheck, title: '100% Verified Professionals', desc: 'ID checked, background verified, skill tested', color: 'bg-emerald-100 text-emerald-600' },
                  { icon: Clock, title: 'On-Time Guarantee', desc: 'We compensate if the pro is late', color: 'bg-blue-100 text-blue-600' },
                  { icon: Award, title: 'Satisfaction Promise', desc: 'Not happy? Free re-service or full refund', color: 'bg-purple-100 text-purple-600' },
                  { icon: Headphones, title: '24/7 Support', desc: 'Real humans ready to help anytime', color: 'bg-amber-100 text-amber-600' },
                ].map((item) => (
                  <div key={item.title} className="flex gap-4 group">
                    <div className={`flex-shrink-0 w-12 h-12 rounded-2xl ${item.color} flex items-center justify-center group-hover:scale-110 transition-transform`}>
                      <item.icon className="w-6 h-6" />
                    </div>
                    <div>
                      <h3 className="text-lg font-bold text-gray-900 mb-1">{item.title}</h3>
                      <p className="text-gray-500">{item.desc}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Right: Testimonial */}
            <div className="relative">
              <div className="bg-gradient-to-br from-gray-900 via-gray-900 to-gray-800 rounded-[2.5rem] p-8 lg:p-10 shadow-2xl">
                <div className="flex gap-1 mb-6">
                  {[1,2,3,4,5].map(i => (
                    <Star key={i} className="w-6 h-6 fill-amber-400 text-amber-400" />
                  ))}
                </div>
                
                <div className="relative h-[120px] overflow-hidden">
                  {testimonials.map((t, idx) => (
                    <p 
                      key={idx}
                      className={`absolute inset-0 text-xl lg:text-2xl text-white/90 font-light leading-relaxed transition-all duration-500 ${
                        idx === activeTestimonial ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'
                      }`}
                    >
                      &ldquo;{t.text}&rdquo;
                    </p>
                  ))}
                </div>

                <div className="flex items-center gap-4 mt-8 pt-6 border-t border-white/10">
                  <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-emerald-400 to-teal-500 flex items-center justify-center text-white text-xl font-bold">
                    {testimonials[activeTestimonial].avatar}
                  </div>
                  <div>
                    <p className="text-white font-bold text-lg">{testimonials[activeTestimonial].name}</p>
                    <p className="text-gray-400">{testimonials[activeTestimonial].location} • Verified Customer</p>
                  </div>
                </div>

                {/* Dots */}
                <div className="flex gap-2 mt-6">
                  {testimonials.map((_, idx) => (
                    <button
                      key={idx}
                      onClick={() => setActiveTestimonial(idx)}
                      className={`w-2 h-2 rounded-full transition-all ${
                        idx === activeTestimonial ? 'w-6 bg-emerald-500' : 'bg-white/20 hover:bg-white/40'
                      }`}
                    />
                  ))}
                </div>
              </div>

              {/* Floating Badge */}
              <div className="absolute -top-6 -right-6 bg-white rounded-2xl p-4 shadow-xl border border-gray-100 animate-float">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-emerald-100 flex items-center justify-center">
                    <Heart className="w-5 h-5 text-emerald-600 fill-emerald-600" />
                  </div>
                  <div>
                    <p className="text-lg font-black text-gray-900">50K+</p>
                    <p className="text-xs text-gray-500">5-star reviews</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ═══════════════════════════════════════════════════════════════════
          SAFETY SECTION - GREEN GRADIENT
      ═══════════════════════════════════════════════════════════════════ */}
      <section className="py-24 lg:py-32 bg-gradient-to-br from-emerald-600 via-emerald-600 to-teal-600 text-white relative overflow-hidden">
        <div className="absolute inset-0 bg-[url('data:image/svg+xml,%3Csvg%20width%3D%2260%22%20height%3D%2260%22%20viewBox%3D%220%200%2060%2060%22%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%3E%3Cg%20fill%3D%22none%22%20fill-rule%3D%22evenodd%22%3E%3Cg%20fill%3D%22%23ffffff%22%20fill-opacity%3D%220.05%22%3E%3Cpath%20d%3D%22M36%2034v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6%2034v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6%204V0H4v4H0v2h4v4h2V6h4V4H6z%22%2F%3E%3C%2Fg%3E%3C%2Fg%3E%3C%2Fsvg%3E')] opacity-30" />
        
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative">
          <div className="text-center mb-16">
            <div className="inline-flex items-center gap-2 bg-white/20 text-white px-4 py-2 rounded-full text-sm font-semibold mb-6 backdrop-blur-sm">
              <Shield className="w-4 h-4" />
              Safety First
            </div>
            <h2 className="text-4xl lg:text-5xl font-black mb-4">
              Your safety is our <span className="text-emerald-200">priority</span>
            </h2>
            <p className="text-xl text-white/80 max-w-2xl mx-auto">
              Every professional undergoes rigorous verification
            </p>
          </div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {[
              { icon: BadgeCheck, title: 'ID Verified', desc: 'Aadhaar & PAN checked' },
              { icon: Shield, title: 'Background Check', desc: 'Police verification done' },
              { icon: MapPin, title: 'Live Tracking', desc: 'Track pro in real-time' },
              { icon: Headphones, title: 'SOS Support', desc: '24/7 emergency help' },
            ].map((item) => (
              <div key={item.title} className="group bg-white/10 backdrop-blur-sm rounded-3xl p-6 border border-white/20 hover:bg-white/20 transition-all text-center hover:-translate-y-2 duration-300">
                <div className="w-14 h-14 mx-auto rounded-2xl bg-white/20 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                  <item.icon className="w-7 h-7" />
                </div>
                <h3 className="text-lg font-bold mb-2">{item.title}</h3>
                <p className="text-white/70 text-sm">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ═══════════════════════════════════════════════════════════════════
          FINAL CTA - DARK PREMIUM
      ═══════════════════════════════════════════════════════════════════ */}
      <section className="py-24 lg:py-32 bg-gray-950 text-white relative overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,rgba(16,185,129,0.15),transparent_60%)]" />
        
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center relative">
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-black mb-6 leading-tight">
            Ready to experience
            <br />
            <span className="bg-gradient-to-r from-emerald-400 via-teal-400 to-cyan-400 bg-clip-text text-transparent">the magic?</span>
          </h2>
          <p className="text-xl text-gray-400 mb-10 max-w-2xl mx-auto">
            Join 50,000+ customers who trust Helparo for reliable, professional home services.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button 
              size="lg" 
              className="group bg-emerald-500 hover:bg-emerald-600 text-white rounded-2xl px-10 h-14 text-lg font-bold shadow-xl shadow-emerald-500/30 hover:shadow-emerald-500/50 hover:scale-105 transition-all duration-300" 
              asChild
            >
              <Link href="/auth/signup">
                Get Started Free
                <ArrowUpRight className="ml-2 w-5 h-5 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
              </Link>
            </Button>
            <Button 
              size="lg" 
              className="bg-white/10 hover:bg-white hover:text-gray-900 text-white border border-white/20 rounded-2xl px-10 h-14 text-lg font-semibold transition-all duration-300 hover:scale-105" 
              asChild
            >
              <Link href="/helper/register">
                Become a Partner
              </Link>
            </Button>
          </div>
        </div>
      </section>

      {/* ═══════════════════════════════════════════════════════════════════
          FOOTER - CLEAN & PREMIUM
      ═══════════════════════════════════════════════════════════════════ */}
      <footer className="bg-gray-950 text-gray-400 pt-16 sm:pt-20 pb-10 border-t border-white/5">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-5 gap-8 lg:gap-12 mb-12 sm:mb-16">
            <div className="col-span-2 lg:col-span-1">
              <Link href="/" className="flex items-center gap-2.5 mb-6 group">
                <img src="/logo.svg" alt="Helparo" className="w-10 h-10 rounded-xl shadow-lg shadow-emerald-500/20 group-hover:scale-105 transition-transform" />
                <span className="text-xl font-bold text-white">helparo</span>
              </Link>
              <p className="text-sm text-gray-500 mb-6 leading-relaxed">
                India&apos;s most trusted home services platform. Verified professionals at your doorstep.
              </p>
              <div className="flex gap-3">
                {['𝕏', '📷', 'in', 'f'].map((icon, i) => (
                  <a key={i} href="#" className="w-9 h-9 rounded-lg bg-white/5 flex items-center justify-center hover:bg-emerald-500 hover:text-white transition-all text-sm">
                    {icon}
                  </a>
                ))}
              </div>
            </div>

            {[
              { title: 'Services', links: [['All Services', '/services'], ['Book Now', '/auth/signup'], ['Pricing', '/pricing']] },
              { title: 'Partner', links: [['Become a Pro', '/helper/register'], ['Partner Login', '/helper/login'], ['Resources', '/about']] },
              { title: 'Company', links: [['About Us', '/about'], ['Contact', '/contact'], ['Careers', '/careers']] },
              { title: 'Legal', links: [['Terms', '/legal/terms'], ['Privacy', '/legal/privacy'], ['Refunds', '/legal/refunds']] },
            ].map((col) => (
              <div key={col.title}>
                <h3 className="text-white font-semibold mb-4 text-sm uppercase tracking-wider">{col.title}</h3>
                <ul className="space-y-3">
                  {col.links.map(([label, href]) => (
                    <li key={label}>
                      <Link href={href} className="text-sm hover:text-white transition-colors">{label}</Link>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>

          <div className="border-t border-white/5 pt-8 flex flex-col sm:flex-row justify-between items-center gap-4">
            <p className="text-sm text-gray-500">© {new Date().getFullYear()} Helparo. All rights reserved.</p>
            <p className="text-sm text-gray-500 flex items-center gap-1">Made with <Heart className="w-3.5 h-3.5 text-red-500 fill-red-500" /> in India</p>
          </div>
        </div>
      </footer>

      {/* Premium Animations */}
      <style jsx global>{`
        @keyframes fade-in {
          from { opacity: 0; transform: translateY(20px); }
          to { opacity: 1; transform: translateY(0); }
        }
        @keyframes float {
          0%, 100% { transform: translateY(0px); }
          50% { transform: translateY(-10px); }
        }
        @keyframes float-delayed {
          0%, 100% { transform: translateY(0px); }
          50% { transform: translateY(-8px); }
        }
        .animate-fade-in { animation: fade-in 0.6s ease-out forwards; }
        .animate-float { animation: float 4s ease-in-out infinite; }
        .animate-float-delayed { animation: float-delayed 5s ease-in-out infinite 1s; }
      `}</style>
    </div>
  )
}
