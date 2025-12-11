'use client'

import Link from 'next/link'
import { useState, useEffect, useRef } from 'react'
import { Button } from '@/components/ui/button'
import { 
  ArrowRight, 
  Shield, 
  Users, 
  Award, 
  MapPin, 
  Clock, 
  Star,
  Heart,
  Sparkles,
  Zap,
  BadgeCheck,
  Bot,
  IndianRupee,
  Rocket,
  Crown,
  Target,
  Lightbulb,
  TrendingUp
} from 'lucide-react'

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

export default function AboutPage() {
  const [isScrolled, setIsScrolled] = useState(false)
  const [activeValue, setActiveValue] = useState(0)

  useEffect(() => {
    const handleScroll = () => setIsScrolled(window.scrollY > 20)
    window.addEventListener('scroll', handleScroll)
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  useEffect(() => {
    const interval = setInterval(() => setActiveValue((p) => (p + 1) % 4), 4000)
    return () => clearInterval(interval)
  }, [])

  const values = [
    { icon: Shield, title: 'Trust & Safety', desc: 'Every helper undergoes thorough background verification, skill assessment, and ID verification. Your safety is non-negotiable.', color: 'from-emerald-500 to-teal-500' },
    { icon: Zap, title: 'Instant Service', desc: 'Get a verified professional at your doorstep within 30 minutes. No more waiting days for simple repairs.', color: 'from-amber-500 to-orange-500' },
    { icon: Award, title: 'Quality Guaranteed', desc: '100% satisfaction guarantee. Not happy? We make it right or give you a full refund.', color: 'from-violet-500 to-purple-600' },
    { icon: Heart, title: 'Customer First', desc: 'Real humans available 24/7. We genuinely care about your experience and go above and beyond.', color: 'from-pink-500 to-rose-500' },
  ]

  return (
    <div className="min-h-screen bg-white">
      {/* Premium Glass Header */}
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

            {/* Nav */}
            <nav className="hidden md:flex items-center gap-1">
              <Link href="/services" className="px-4 py-2 text-[15px] font-medium text-gray-600 hover:text-emerald-600 rounded-xl hover:bg-emerald-50 transition-all">Services</Link>
              <Link href="/about" className="px-4 py-2 text-[15px] font-semibold text-emerald-600 bg-emerald-50 rounded-xl">About</Link>
              <Link href="/contact" className="px-4 py-2 text-[15px] font-medium text-gray-600 hover:text-emerald-600 rounded-xl hover:bg-emerald-50 transition-all">Contact</Link>
            </nav>

            {/* CTA */}
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

      {/* ═══════════════════════════════════════════════════════════════════
          HERO SECTION - STUNNING
      ═══════════════════════════════════════════════════════════════════ */}
      <section className="pt-28 lg:pt-36 pb-20 lg:pb-28 bg-gradient-to-b from-emerald-50/80 via-white to-white relative overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_80%_50%_at_50%_-20%,rgba(16,185,129,0.15),transparent)]" />
        <div className="absolute top-40 right-0 w-96 h-96 bg-gradient-to-br from-emerald-200/30 to-teal-200/30 rounded-full blur-3xl" />
        <div className="absolute bottom-0 left-0 w-80 h-80 bg-gradient-to-tr from-amber-200/20 to-orange-200/20 rounded-full blur-3xl" />
        
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative">
          <div className="text-center max-w-4xl mx-auto">
            {/* Badges */}
            <div className="flex flex-wrap items-center justify-center gap-3 mb-8">
              <div className="inline-flex items-center gap-2 bg-gradient-to-r from-orange-500 to-pink-500 text-white px-4 py-2 rounded-full shadow-lg shadow-orange-500/25">
                <Rocket className="w-4 h-4" />
                <span className="text-sm font-bold">🇮🇳 India&apos;s First</span>
              </div>
              <div className="inline-flex items-center gap-2 bg-gradient-to-r from-violet-500 to-purple-600 text-white px-4 py-2 rounded-full shadow-lg shadow-purple-500/25">
                <Bot className="w-4 h-4" />
                <span className="text-sm font-bold">AI-Powered</span>
              </div>
              <div className="inline-flex items-center gap-2 bg-gradient-to-r from-amber-500 to-orange-500 text-white px-4 py-2 rounded-full shadow-lg shadow-amber-500/25">
                <IndianRupee className="w-4 h-4" />
                <span className="text-sm font-bold">You Decide Price</span>
              </div>
            </div>

            <h1 className="text-4xl sm:text-5xl lg:text-7xl font-black text-gray-900 mb-6 leading-tight">
              We&apos;re Revolutionizing
              <br />
              <span className="bg-gradient-to-r from-emerald-600 via-teal-500 to-cyan-500 bg-clip-text text-transparent">Home Services</span>
            </h1>
            
            <p className="text-xl sm:text-2xl text-gray-500 mb-10 max-w-3xl mx-auto leading-relaxed">
              India&apos;s first AI-powered home services platform where <span className="font-bold text-gray-900">YOU decide your price</span>. 
              Connecting families with verified professionals since 2024.
            </p>

            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button size="lg" className="bg-emerald-600 hover:bg-emerald-700 text-white rounded-2xl px-8 h-14 text-base font-bold shadow-xl shadow-emerald-500/25 hover:scale-105 transition-all" asChild>
                <Link href="/auth/signup">
                  Join 50,000+ Happy Customers
                  <ArrowRight className="ml-2 w-5 h-5" />
                </Link>
              </Button>
              <Button size="lg" variant="outline" className="rounded-2xl px-8 h-14 text-base font-semibold border-2 hover:bg-gray-50" asChild>
                <Link href="/helper/register">Become a Partner</Link>
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* ═══════════════════════════════════════════════════════════════════
          STATS SECTION - ANIMATED
      ═══════════════════════════════════════════════════════════════════ */}
      <section className="py-16 bg-gray-50 border-y border-gray-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-8 lg:gap-12">
            {[
              { value: 50000, suffix: '+', label: 'Happy Customers', icon: Users, color: 'text-emerald-600' },
              { value: 10000, suffix: '+', label: 'Verified Professionals', icon: BadgeCheck, color: 'text-blue-600' },
              { value: 100000, suffix: '+', label: 'Services Completed', icon: Award, color: 'text-amber-600' },
              { value: 25, suffix: '+', label: 'Cities Served', icon: MapPin, color: 'text-purple-600' },
            ].map((stat) => (
              <div key={stat.label} className="text-center group">
                <div className={`w-14 h-14 rounded-2xl bg-white shadow-lg flex items-center justify-center mx-auto mb-4 group-hover:scale-110 transition-transform ${stat.color}`}>
                  <stat.icon className="w-7 h-7" />
                </div>
                <p className="text-3xl lg:text-4xl font-black text-gray-900 mb-1">
                  <AnimatedCounter end={stat.value} suffix={stat.suffix} />
                </p>
                <p className="text-sm text-gray-500 font-medium">{stat.label}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ═══════════════════════════════════════════════════════════════════
          OUR STORY - EMOTIONAL
      ═══════════════════════════════════════════════════════════════════ */}
      <section className="py-24 lg:py-32 bg-white relative overflow-hidden">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid lg:grid-cols-2 gap-16 lg:gap-24 items-center">
            {/* Left - Story */}
            <div>
              <div className="inline-flex items-center gap-2 bg-emerald-50 text-emerald-700 px-4 py-2 rounded-full text-sm font-semibold mb-6">
                <Heart className="w-4 h-4" />
                Our Story
              </div>
              <h2 className="text-4xl lg:text-5xl font-black text-gray-900 mb-6 leading-tight">
                Born from <span className="text-emerald-600">frustration</span>,
                <br />built with <span className="text-amber-600">passion</span>
              </h2>
              <div className="space-y-6 text-lg text-gray-600 leading-relaxed">
                <p>
                  It was 2 AM. A leaky pipe was flooding our founder&apos;s kitchen. Every plumber 
                  he called either didn&apos;t pick up or quoted outrageous prices. Sound familiar?
                </p>
                <p>
                  <span className="font-bold text-gray-900">That night, Helparo was born.</span> We realized 
                  millions of Indians face this problem daily - unreliable service, unfair pricing, and zero accountability.
                </p>
                <p>
                  We asked ourselves: <span className="italic">&quot;What if customers could decide their own price? What if AI 
                  could instantly match them with verified pros willing to accept?&quot;</span>
                </p>
                <p className="font-semibold text-gray-900">
                  Today, we&apos;re India&apos;s first self-price-deciding home services platform, 
                  trusted by 50,000+ families. And we&apos;re just getting started.
                </p>
              </div>
            </div>

            {/* Right - Visual */}
            <div className="relative">
              <div className="absolute inset-0 bg-gradient-to-br from-emerald-100 via-teal-50 to-amber-50 rounded-[3rem] transform rotate-3 scale-105" />
              <div className="relative bg-white rounded-[2.5rem] p-8 shadow-2xl shadow-gray-200/50 border border-gray-100">
                {/* Timeline */}
                <div className="space-y-6">
                  {[
                    { year: '2024', title: 'The Idea', desc: 'Late-night frustration sparks a revolution', icon: Lightbulb, color: 'bg-amber-500' },
                    { year: '2024', title: 'Launch', desc: 'First 1,000 customers in 30 days', icon: Rocket, color: 'bg-emerald-500' },
                    { year: '2024', title: 'AI Integration', desc: 'India\'s first AI-powered matching', icon: Bot, color: 'bg-violet-500' },
                    { year: '2025', title: 'Self-Pricing', desc: 'Revolutionary price control for customers', icon: Crown, color: 'bg-orange-500' },
                  ].map((item, idx) => (
                    <div key={idx} className="flex gap-4 items-start">
                      <div className={`w-12 h-12 rounded-2xl ${item.color} flex items-center justify-center flex-shrink-0 shadow-lg`}>
                        <item.icon className="w-6 h-6 text-white" />
                      </div>
                      <div>
                        <p className="text-xs font-bold text-gray-400 mb-1">{item.year}</p>
                        <h4 className="font-bold text-gray-900 mb-1">{item.title}</h4>
                        <p className="text-sm text-gray-500">{item.desc}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ═══════════════════════════════════════════════════════════════════
          WHAT MAKES US DIFFERENT - REVOLUTIONARY
      ═══════════════════════════════════════════════════════════════════ */}
      <section className="py-24 lg:py-32 bg-gradient-to-br from-gray-900 via-gray-900 to-gray-800 text-white relative overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,rgba(16,185,129,0.15),transparent_60%)]" />
        <div className="absolute inset-0 bg-[url('data:image/svg+xml,%3Csvg%20width%3D%2260%22%20height%3D%2260%22%20viewBox%3D%220%200%2060%2060%22%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%3E%3Cg%20fill%3D%22none%22%20fill-rule%3D%22evenodd%22%3E%3Cg%20fill%3D%22%23ffffff%22%20fill-opacity%3D%220.02%22%3E%3Cpath%20d%3D%22M36%2034v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6%2034v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6%204V0H4v4H0v2h4v4h2V6h4V4H6z%22%2F%3E%3C%2Fg%3E%3C%2Fg%3E%3C%2Fsvg%3E')] opacity-50" />
        
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative">
          <div className="text-center mb-16">
            <div className="inline-flex items-center gap-2 bg-white/10 backdrop-blur-sm px-4 py-2 rounded-full text-sm font-semibold mb-6">
              <Sparkles className="w-4 h-4" />
              What Makes Us Different
            </div>
            <h2 className="text-4xl lg:text-5xl font-black mb-6">
              Not just another <span className="text-emerald-400">service app</span>
            </h2>
            <p className="text-xl text-gray-400 max-w-3xl mx-auto">
              We&apos;re building the future of how India gets things done at home.
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[
              { icon: IndianRupee, title: 'You Set The Price', desc: 'No fixed rates. Tell us your budget, we find pros who accept. Revolutionary.', badge: '🔥 FIRST IN INDIA', color: 'from-amber-400 to-orange-500' },
              { icon: Bot, title: 'AI Smart Matching', desc: 'Our AI analyzes location, ratings, availability & price to find your perfect match in seconds.', badge: '🤖 AI POWERED', color: 'from-violet-500 to-purple-600' },
              { icon: BadgeCheck, title: '100% Verified Pros', desc: 'Aadhaar verified, background checked, skill tested. Only the best make it.', badge: '✓ VERIFIED', color: 'from-emerald-500 to-teal-500' },
              { icon: Clock, title: '30-Min Guarantee', desc: 'Pro at your door in 30 minutes or we compensate. Time is precious.', badge: '⚡ FAST', color: 'from-blue-500 to-cyan-500' },
              { icon: Shield, title: 'Safety First', desc: 'Live tracking, SOS button, 24/7 support. Your safety is non-negotiable.', badge: '🛡️ SAFE', color: 'from-rose-500 to-pink-500' },
              { icon: TrendingUp, title: 'Fair for Everyone', desc: 'Pros earn more, customers pay less. No middleman markup. Win-win.', badge: '💚 FAIR', color: 'from-green-500 to-emerald-500' },
            ].map((item) => (
              <div key={item.title} className="group bg-white/5 backdrop-blur-sm rounded-3xl p-6 border border-white/10 hover:border-emerald-500/50 hover:bg-white/10 transition-all">
                <div className="flex items-start justify-between mb-4">
                  <div className={`w-14 h-14 rounded-2xl bg-gradient-to-br ${item.color} flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform`}>
                    <item.icon className="w-7 h-7 text-white" />
                  </div>
                  <span className="text-xs font-bold bg-white/10 px-2 py-1 rounded-full">{item.badge}</span>
                </div>
                <h3 className="text-xl font-bold mb-2">{item.title}</h3>
                <p className="text-gray-400 text-sm leading-relaxed">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ═══════════════════════════════════════════════════════════════════
          OUR VALUES
      ═══════════════════════════════════════════════════════════════════ */}
      <section className="py-24 lg:py-32 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <div className="inline-flex items-center gap-2 bg-emerald-50 text-emerald-700 px-4 py-2 rounded-full text-sm font-semibold mb-6">
              <Target className="w-4 h-4" />
              Our Values
            </div>
            <h2 className="text-4xl lg:text-5xl font-black text-gray-900 mb-4">
              What we <span className="text-emerald-600">stand</span> for
            </h2>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {values.map((value, idx) => (
              <div 
                key={value.title}
                className={`group p-8 rounded-3xl border-2 transition-all duration-500 cursor-pointer ${
                  idx === activeValue 
                    ? 'bg-gradient-to-br from-emerald-50 to-teal-50 border-emerald-200 scale-105 shadow-xl' 
                    : 'bg-white border-gray-100 hover:border-emerald-200 hover:shadow-lg'
                }`}
                onClick={() => setActiveValue(idx)}
              >
                <div className={`w-16 h-16 rounded-2xl bg-gradient-to-br ${value.color} flex items-center justify-center mb-6 shadow-lg group-hover:scale-110 transition-transform`}>
                  <value.icon className="w-8 h-8 text-white" />
                </div>
                <h3 className="text-xl font-bold text-gray-900 mb-3">{value.title}</h3>
                <p className="text-gray-600 leading-relaxed">{value.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ═══════════════════════════════════════════════════════════════════
          SERVICES WE OFFER - GRID
      ═══════════════════════════════════════════════════════════════════ */}
      <section className="py-24 lg:py-32 bg-gradient-to-b from-gray-50 to-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <div className="inline-flex items-center gap-2 bg-blue-50 text-blue-700 px-4 py-2 rounded-full text-sm font-semibold mb-6">
              <Sparkles className="w-4 h-4" />
              50+ Services
            </div>
            <h2 className="text-4xl lg:text-5xl font-black text-gray-900 mb-4">
              Services we <span className="text-emerald-600">offer</span>
            </h2>
            <p className="text-xl text-gray-500">All delivered by verified professionals</p>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
            {[
              { name: 'Plumbing', icon: '🔧', color: 'bg-blue-50 border-blue-100 hover:border-blue-300' },
              { name: 'Electrical', icon: '⚡', color: 'bg-amber-50 border-amber-100 hover:border-amber-300' },
              { name: 'House Cleaning', icon: '✨', color: 'bg-emerald-50 border-emerald-100 hover:border-emerald-300' },
              { name: 'AC Service', icon: '❄️', color: 'bg-cyan-50 border-cyan-100 hover:border-cyan-300' },
              { name: 'Carpentry', icon: '🪵', color: 'bg-orange-50 border-orange-100 hover:border-orange-300' },
              { name: 'Painting', icon: '🎨', color: 'bg-pink-50 border-pink-100 hover:border-pink-300' },
              { name: 'Appliance Repair', icon: '🔌', color: 'bg-violet-50 border-violet-100 hover:border-violet-300' },
              { name: 'Pest Control', icon: '🛡️', color: 'bg-red-50 border-red-100 hover:border-red-300' },
              { name: 'Deep Cleaning', icon: '🧹', color: 'bg-teal-50 border-teal-100 hover:border-teal-300' },
              { name: 'Sofa Cleaning', icon: '🛋️', color: 'bg-indigo-50 border-indigo-100 hover:border-indigo-300' },
              { name: 'Geyser Repair', icon: '🚿', color: 'bg-rose-50 border-rose-100 hover:border-rose-300' },
              { name: 'And 40+ More', icon: '➕', color: 'bg-gray-50 border-gray-200 hover:border-gray-400' },
            ].map((service) => (
              <Link 
                key={service.name}
                href="/services"
                className={`group p-5 rounded-2xl border-2 ${service.color} transition-all hover:shadow-lg hover:-translate-y-1`}
              >
                <span className="text-3xl mb-3 block group-hover:scale-110 transition-transform">{service.icon}</span>
                <span className="font-semibold text-gray-900">{service.name}</span>
              </Link>
            ))}
          </div>

          <div className="text-center mt-10">
            <Button variant="outline" className="rounded-2xl px-8 h-12 text-base font-semibold border-2 hover:bg-emerald-50 hover:border-emerald-300 group" asChild>
              <Link href="/services">
                View All Services
                <ArrowRight className="ml-2 w-4 h-4 group-hover:translate-x-1 transition-transform" />
              </Link>
            </Button>
          </div>
        </div>
      </section>

      {/* ═══════════════════════════════════════════════════════════════════
          CTA SECTION
      ═══════════════════════════════════════════════════════════════════ */}
      <section className="py-24 lg:py-32 bg-gradient-to-br from-emerald-600 via-emerald-600 to-teal-600 text-white relative overflow-hidden">
        <div className="absolute inset-0 bg-[url('data:image/svg+xml,%3Csvg%20width%3D%2260%22%20height%3D%2260%22%20viewBox%3D%220%200%2060%2060%22%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%3E%3Cg%20fill%3D%22none%22%20fill-rule%3D%22evenodd%22%3E%3Cg%20fill%3D%22%23ffffff%22%20fill-opacity%3D%220.05%22%3E%3Cpath%20d%3D%22M36%2034v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6%2034v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6%204V0H4v4H0v2h4v4h2V6h4V4H6z%22%2F%3E%3C%2Fg%3E%3C%2Fg%3E%3C%2Fsvg%3E')] opacity-30" />
        
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center relative">
          <div className="inline-flex items-center gap-2 bg-white/20 px-4 py-2 rounded-full text-sm font-semibold mb-6 backdrop-blur-sm">
            <Rocket className="w-4 h-4" />
            Join the Revolution
          </div>
          
          <h2 className="text-4xl sm:text-5xl lg:text-6xl font-black mb-6">
            Ready to experience
            <br />
            <span className="text-emerald-200">the difference?</span>
          </h2>
          <p className="text-xl text-white/80 mb-10 max-w-2xl mx-auto">
            Join 50,000+ customers who&apos;ve discovered a better way to get home services done.
          </p>
          
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button size="lg" className="bg-white text-emerald-700 hover:bg-gray-100 rounded-2xl px-10 h-14 text-base font-bold shadow-xl hover:scale-105 transition-all" asChild>
              <Link href="/auth/signup">
                Get Started Free
                <ArrowRight className="ml-2 w-5 h-5" />
              </Link>
            </Button>
            <Button size="lg" className="bg-white/10 hover:bg-white/20 text-white border border-white/20 rounded-2xl px-10 h-14 text-base font-semibold backdrop-blur-sm hover:scale-105 transition-all" asChild>
              <Link href="/helper/register">Become a Partner</Link>
            </Button>
          </div>
        </div>
      </section>

      {/* ═══════════════════════════════════════════════════════════════════
          FOOTER
      ═══════════════════════════════════════════════════════════════════ */}
      <footer className="bg-gray-950 text-gray-400 pt-20 pb-10 border-t border-white/5">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 lg:grid-cols-5 gap-10 lg:gap-12 mb-16">
            <div className="col-span-2 lg:col-span-1">
              <Link href="/" className="flex items-center gap-2.5 mb-6 group">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center shadow-lg shadow-emerald-500/20 group-hover:scale-105 transition-transform">
                  <span className="text-white font-black text-lg">H</span>
                </div>
                <span className="text-xl font-bold text-white">helparo</span>
              </Link>
              <p className="text-sm text-gray-500 mb-6 leading-relaxed">
                India&apos;s first AI-powered home services platform. You decide the price.
              </p>
            </div>

            {[
              { title: 'Services', links: [['All Services', '/services'], ['Book Now', '/auth/signup'], ['Pricing', '/services']] },
              { title: 'Partner', links: [['Become a Pro', '/helper/register'], ['Partner Login', '/helper/login'], ['Resources', '/about']] },
              { title: 'Company', links: [['About Us', '/about'], ['Contact', '/contact'], ['Careers', '/about']] },
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

      {/* Animations */}
      <style jsx global>{`
        @keyframes fade-in {
          from { opacity: 0; transform: translateY(20px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .animate-fade-in { animation: fade-in 0.6s ease-out forwards; }
      `}</style>
    </div>
  )
}
