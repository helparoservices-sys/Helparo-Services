'use client'

import React, { useState, useEffect } from 'react'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { 
  Bot, 
  IndianRupee, 
  Sparkles, 
  ArrowRight, 
  Check, 
  Smile,
  Crown,
  Shield,
  Zap,
  MessageCircle,
  ThumbsUp,
  TrendingDown,
  Users,
  Star
} from 'lucide-react'

export default function PricingPage() {
  const [homeHref, setHomeHref] = useState('/')

  // Check if user is logged in and determine home link
  useEffect(() => {
    const checkUser = async () => {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      if (user) {
        const { data: profile } = await supabase
          .from('profiles')
          .select('role')
          .eq('id', user.id)
          .single()
        if (profile?.role === 'helper') {
          setHomeHref('/helper/dashboard')
        } else if (profile?.role === 'customer') {
          setHomeHref('/customer/dashboard')
        }
      }
    }
    checkUser()
  }, [])

  return (
    <div className="min-h-screen bg-gradient-to-b from-amber-50 via-white to-emerald-50">
      {/* Premium Header */}
      <header className="fixed top-0 left-0 right-0 z-50 bg-white/80 backdrop-blur-xl border-b border-gray-100 pt-safe">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <Link href={homeHref} className="flex items-center space-x-2 group">
              <img src="/logo.svg" alt="Helparo" className="w-10 h-10 rounded-xl shadow-lg shadow-emerald-500/30 group-hover:shadow-emerald-500/50 transition-all duration-300 group-hover:scale-105" />
              <span className="text-xl font-bold text-gray-900">helparo</span>
            </Link>
            <Link 
              href="/services"
              className="px-6 py-2.5 bg-gradient-to-r from-emerald-500 to-teal-600 text-white rounded-full font-semibold hover:shadow-lg hover:shadow-emerald-500/30 transition-all duration-300 hover:scale-105"
            >
              Book Now
            </Link>
          </div>
        </div>
      </header>

      {/* Hero Section - Fun & Engaging */}
      <section className="pt-32 pb-16 px-4 relative overflow-hidden">
        {/* Floating Elements */}
        <div className="absolute top-40 left-10 w-20 h-20 bg-amber-400/20 rounded-full blur-2xl animate-pulse" />
        <div className="absolute top-60 right-20 w-32 h-32 bg-emerald-400/20 rounded-full blur-2xl animate-pulse" style={{ animationDelay: '1s' }} />
        <div className="absolute bottom-20 left-1/4 w-24 h-24 bg-teal-400/20 rounded-full blur-2xl animate-pulse" style={{ animationDelay: '2s' }} />

        <div className="max-w-4xl mx-auto text-center relative">
          {/* Fun Emoji Header */}
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-amber-100 rounded-full mb-6 animate-bounce">
            <span className="text-2xl">🤔</span>
            <span className="text-amber-700 font-medium">Wait a minute...</span>
          </div>

          {/* Main Headline */}
          <h1 className="text-4xl sm:text-5xl md:text-6xl font-black text-gray-900 mb-6 leading-tight">
            Hey, why are you
            <br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-amber-500 to-orange-500">
              checking pricing?
            </span>
          </h1>

          {/* Subheadline */}
          <p className="text-xl sm:text-2xl text-gray-600 mb-8 max-w-2xl mx-auto">
            At Helparo, <span className="font-bold text-emerald-600">YOU</span> are the boss! 
            <br className="hidden sm:block" />
            We don&apos;t decide the price — <span className="font-bold text-gray-900">you do!</span>
          </p>

          {/* Animated Hand Pointing */}
          <div className="text-6xl mb-8 animate-bounce">
            👇
          </div>
        </div>
      </section>

      {/* The Big Reveal Section */}
      <section className="py-16 px-4">
        <div className="max-w-6xl mx-auto">
          <div className="grid md:grid-cols-2 gap-8">
            {/* Option 1: You Decide */}
            <div className="group relative">
              <div className="absolute -inset-1 bg-gradient-to-r from-amber-400 to-orange-500 rounded-3xl blur opacity-30 group-hover:opacity-50 transition duration-500" />
              <div className="relative bg-white rounded-3xl p-8 shadow-xl border border-amber-100 hover:border-amber-300 transition-all duration-300 h-full">
                <div className="w-20 h-20 bg-gradient-to-br from-amber-400 to-orange-500 rounded-2xl flex items-center justify-center mb-6 shadow-lg shadow-amber-500/30 group-hover:scale-110 transition-transform duration-300">
                  <IndianRupee className="w-10 h-10 text-white" />
                </div>
                
                <div className="inline-flex items-center gap-2 px-3 py-1 bg-amber-100 text-amber-700 rounded-full text-sm font-semibold mb-4">
                  <Crown className="w-4 h-4" />
                  Most Popular
                </div>

                <h2 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-4">
                  YOU Decide Your Price
                </h2>
                
                <p className="text-gray-600 mb-6 leading-relaxed">
                  Think the job is worth ₹200? Pay ₹200. Feel it deserves ₹500? Go ahead! 
                  <span className="font-semibold text-gray-900"> You&apos;re in complete control.</span>
                </p>

                <ul className="space-y-3 mb-8">
                  {[
                    'No hidden charges, ever',
                    'Pay what feels fair to you',
                    'Helper accepts or negotiates',
                    'Win-win for everyone'
                  ].map((item, i) => (
                    <li key={i} className="flex items-center gap-3">
                      <div className="w-6 h-6 bg-amber-100 rounded-full flex items-center justify-center flex-shrink-0">
                        <Check className="w-4 h-4 text-amber-600" />
                      </div>
                      <span className="text-gray-700">{item}</span>
                    </li>
                  ))}
                </ul>

                <div className="bg-amber-50 rounded-2xl p-4 border border-amber-100">
                  <div className="flex items-center gap-3">
                    <Smile className="w-8 h-8 text-amber-500" />
                    <div>
                      <p className="font-semibold text-gray-900">Feel Good Pricing</p>
                      <p className="text-sm text-gray-600">Pay what makes you happy!</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Option 2: AI Estimate */}
            <div className="group relative">
              <div className="absolute -inset-1 bg-gradient-to-r from-emerald-400 to-teal-500 rounded-3xl blur opacity-30 group-hover:opacity-50 transition duration-500" />
              <div className="relative bg-white rounded-3xl p-8 shadow-xl border border-emerald-100 hover:border-emerald-300 transition-all duration-300 h-full">
                <div className="w-20 h-20 bg-gradient-to-br from-emerald-500 to-teal-600 rounded-2xl flex items-center justify-center mb-6 shadow-lg shadow-emerald-500/30 group-hover:scale-110 transition-transform duration-300">
                  <Bot className="w-10 h-10 text-white" />
                </div>
                
                <div className="inline-flex items-center gap-2 px-3 py-1 bg-emerald-100 text-emerald-700 rounded-full text-sm font-semibold mb-4">
                  <Sparkles className="w-4 h-4" />
                  AI Powered
                </div>

                <h2 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-4">
                  Use AI Smart Estimate
                </h2>
                
                <p className="text-gray-600 mb-6 leading-relaxed">
                  Not sure what to pay? Our AI analyzes the job, market rates & helper expertise to suggest a 
                  <span className="font-semibold text-gray-900"> fair price for both parties.</span>
                </p>

                <ul className="space-y-3 mb-8">
                  {[
                    'Smart market analysis',
                    'Considers job complexity',
                    'Fair for you & helper',
                    'Transparent breakdown'
                  ].map((item, i) => (
                    <li key={i} className="flex items-center gap-3">
                      <div className="w-6 h-6 bg-emerald-100 rounded-full flex items-center justify-center flex-shrink-0">
                        <Check className="w-4 h-4 text-emerald-600" />
                      </div>
                      <span className="text-gray-700">{item}</span>
                    </li>
                  ))}
                </ul>

                <div className="bg-emerald-50 rounded-2xl p-4 border border-emerald-100">
                  <div className="flex items-center gap-3">
                    <Zap className="w-8 h-8 text-emerald-500" />
                    <div>
                      <p className="font-semibold text-gray-900">Instant Estimate</p>
                      <p className="text-sm text-gray-600">Get AI suggestion in seconds!</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Why This is Revolutionary */}
      <section className="py-20 px-4 bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 relative overflow-hidden">
        {/* Decorative Elements */}
        <div className="absolute top-0 left-0 w-full h-full">
          <div className="absolute top-20 left-20 w-64 h-64 bg-emerald-500/10 rounded-full blur-3xl" />
          <div className="absolute bottom-20 right-20 w-80 h-80 bg-amber-500/10 rounded-full blur-3xl" />
        </div>

        <div className="max-w-4xl mx-auto text-center relative">
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-white/10 backdrop-blur rounded-full mb-6 border border-white/20">
            <span className="text-xl">🇮🇳</span>
            <span className="text-emerald-400 font-semibold">India&apos;s First</span>
          </div>

          <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold text-white mb-6">
            Why fixed pricing is
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-red-400 to-red-500"> broken</span>
          </h2>

          <p className="text-xl text-gray-400 mb-12 max-w-2xl mx-auto">
            Traditional platforms charge the same price regardless of your needs, location, or budget. 
            That&apos;s just not fair.
          </p>

          {/* Comparison Cards */}
          <div className="grid md:grid-cols-2 gap-6 max-w-3xl mx-auto">
            {/* Old Way */}
            <div className="bg-red-500/10 backdrop-blur border border-red-500/30 rounded-2xl p-6 text-left">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 bg-red-500/20 rounded-full flex items-center justify-center">
                  <span className="text-xl">😤</span>
                </div>
                <h3 className="text-xl font-bold text-red-400">The Old Way</h3>
              </div>
              <ul className="space-y-3 text-gray-400">
                <li className="flex items-center gap-2">
                  <span className="text-red-400">✗</span> Fixed prices set by platform
                </li>
                <li className="flex items-center gap-2">
                  <span className="text-red-400">✗</span> Hidden convenience fees
                </li>
                <li className="flex items-center gap-2">
                  <span className="text-red-400">✗</span> One size fits all pricing
                </li>
                <li className="flex items-center gap-2">
                  <span className="text-red-400">✗</span> Platform takes huge cuts
                </li>
              </ul>
            </div>

            {/* Helparo Way */}
            <div className="bg-emerald-500/10 backdrop-blur border border-emerald-500/30 rounded-2xl p-6 text-left">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 bg-emerald-500/20 rounded-full flex items-center justify-center">
                  <span className="text-xl">😊</span>
                </div>
                <h3 className="text-xl font-bold text-emerald-400">The Helparo Way</h3>
              </div>
              <ul className="space-y-3 text-gray-400">
                <li className="flex items-center gap-2">
                  <span className="text-emerald-400">✓</span> You set your own price
                </li>
                <li className="flex items-center gap-2">
                  <span className="text-emerald-400">✓</span> Zero hidden charges
                </li>
                <li className="flex items-center gap-2">
                  <span className="text-emerald-400">✓</span> AI helps if needed
                </li>
                <li className="flex items-center gap-2">
                  <span className="text-emerald-400">✓</span> Fair for everyone
                </li>
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* How It Works - Simple Flow */}
      <section className="py-20 px-4">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-4">
              It&apos;s actually super simple
            </h2>
            <p className="text-xl text-gray-600">Here&apos;s how you save money with Helparo</p>
          </div>

          <div className="grid md:grid-cols-4 gap-6">
            {[
              {
                step: '1',
                icon: MessageCircle,
                title: 'Describe Your Need',
                desc: 'Tell us what service you need',
                color: 'emerald'
              },
              {
                step: '2',
                icon: IndianRupee,
                title: 'Set Your Price',
                desc: 'Enter what you want to pay',
                color: 'amber'
              },
              {
                step: '3',
                icon: Users,
                title: 'Helper Responds',
                desc: 'Nearby helpers accept or counter',
                color: 'blue'
              },
              {
                step: '4',
                icon: ThumbsUp,
                title: 'Done!',
                desc: 'Service complete, pay agreed amount',
                color: 'purple'
              }
            ].map((item, i) => (
              <div key={i} className="relative">
                {i < 3 && (
                  <div className="hidden md:block absolute top-12 left-full w-full h-0.5 bg-gradient-to-r from-gray-300 to-transparent z-0" />
                )}
                <div className="relative bg-white rounded-2xl p-6 shadow-lg border border-gray-100 hover:shadow-xl transition-all duration-300 hover:-translate-y-1 text-center">
                  <div className={`w-12 h-12 bg-${item.color}-100 rounded-full flex items-center justify-center mx-auto mb-4`}
                       style={{ backgroundColor: item.color === 'emerald' ? '#d1fae5' : item.color === 'amber' ? '#fef3c7' : item.color === 'blue' ? '#dbeafe' : '#f3e8ff' }}>
                    <item.icon className={`w-6 h-6`} style={{ color: item.color === 'emerald' ? '#10b981' : item.color === 'amber' ? '#f59e0b' : item.color === 'blue' ? '#3b82f6' : '#a855f7' }} />
                  </div>
                  <div className="absolute -top-3 -right-3 w-8 h-8 bg-gray-900 text-white rounded-full flex items-center justify-center font-bold text-sm">
                    {item.step}
                  </div>
                  <h3 className="font-bold text-gray-900 mb-2">{item.title}</h3>
                  <p className="text-sm text-gray-600">{item.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Savings Calculator Teaser */}
      <section className="py-16 px-4">
        <div className="max-w-4xl mx-auto">
          <div className="bg-gradient-to-br from-emerald-500 to-teal-600 rounded-3xl p-8 md:p-12 text-white relative overflow-hidden">
            <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full -translate-y-1/2 translate-x-1/2" />
            <div className="absolute bottom-0 left-0 w-48 h-48 bg-white/10 rounded-full translate-y-1/2 -translate-x-1/2" />
            
            <div className="relative">
              <div className="flex flex-col md:flex-row items-center gap-8">
                <div className="flex-1 text-center md:text-left">
                  <div className="inline-flex items-center gap-2 px-3 py-1 bg-white/20 rounded-full text-sm font-medium mb-4">
                    <TrendingDown className="w-4 h-4" />
                    Average Savings
                  </div>
                  <h2 className="text-3xl sm:text-4xl font-bold mb-4">
                    Save up to ₹200-500 per booking!
                  </h2>
                  <p className="text-emerald-100 text-lg mb-6">
                    Our customers save an average of 30% compared to fixed-price platforms.
                  </p>
                  
                  <div className="flex flex-wrap gap-4 justify-center md:justify-start">
                    <div className="bg-white/20 backdrop-blur rounded-xl px-4 py-3">
                      <p className="text-2xl font-bold">₹15L+</p>
                      <p className="text-sm text-emerald-100">Saved by users</p>
                    </div>
                    <div className="bg-white/20 backdrop-blur rounded-xl px-4 py-3">
                      <p className="text-2xl font-bold">50K+</p>
                      <p className="text-sm text-emerald-100">Happy customers</p>
                    </div>
                  </div>
                </div>

                <div className="flex-shrink-0">
                  <div className="w-40 h-40 bg-white rounded-full flex items-center justify-center shadow-2xl">
                    <div className="text-center">
                      <p className="text-4xl font-black text-emerald-600">30%</p>
                      <p className="text-sm font-medium text-gray-600">Avg. Savings</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Testimonial */}
      <section className="py-16 px-4">
        <div className="max-w-3xl mx-auto">
          <div className="bg-white rounded-3xl p-8 shadow-xl border border-gray-100 text-center">
            <div className="flex justify-center gap-1 mb-4">
              {[...Array(5)].map((_, i) => (
                <Star key={i} className="w-6 h-6 fill-amber-400 text-amber-400" />
              ))}
            </div>
            <p className="text-xl sm:text-2xl text-gray-700 mb-6 italic">
              &ldquo;I was skeptical at first, but when I paid ₹150 for a plumber visit that would&apos;ve cost ₹400 elsewhere, I became a believer.
              <span className="font-bold text-emerald-600"> This is how all services should work!</span>&rdquo;
            </p>
            <div className="flex items-center justify-center gap-3">
              <div className="w-12 h-12 bg-gradient-to-br from-emerald-400 to-teal-500 rounded-full flex items-center justify-center text-white font-bold">
                R
              </div>
              <div className="text-left">
                <p className="font-semibold text-gray-900">Rahul M.</p>
                <p className="text-sm text-gray-500">Mumbai • Saved ₹250</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Final CTA */}
      <section className="py-20 px-4 bg-gradient-to-br from-amber-50 to-emerald-50">
        <div className="max-w-3xl mx-auto text-center">
          <div className="text-6xl mb-6">🎉</div>
          <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-4">
            Ready to pay YOUR price?
          </h2>
          <p className="text-xl text-gray-600 mb-8">
            Stop overpaying. Start deciding. Join 50,000+ smart Indians.
          </p>
          
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              href="/services"
              className="px-8 py-4 bg-gradient-to-r from-emerald-500 to-teal-600 text-white rounded-full font-semibold text-lg shadow-lg shadow-emerald-500/30 hover:shadow-emerald-500/50 hover:scale-105 transition-all duration-300 flex items-center justify-center gap-2"
            >
              Book a Service Now
              <ArrowRight className="w-5 h-5" />
            </Link>
            <Link
              href="/"
              className="px-8 py-4 bg-white text-gray-700 rounded-full font-semibold text-lg border-2 border-gray-200 hover:border-emerald-300 hover:bg-emerald-50 transition-all duration-300"
            >
              Back to Home
            </Link>
          </div>

          <p className="text-sm text-gray-500 mt-6 flex items-center justify-center gap-2">
            <Shield className="w-4 h-4" />
            100% Safe & Secure • No hidden fees • Cancel anytime
          </p>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 text-gray-400 py-8 px-4">
        <div className="max-w-7xl mx-auto text-center">
          <Link href="/" className="inline-flex items-center space-x-2 mb-4">
            <div className="w-8 h-8 bg-gradient-to-br from-emerald-500 to-teal-600 rounded-lg flex items-center justify-center">
              <span className="text-white font-bold">H</span>
            </div>
            <span className="text-lg font-bold text-white">helparo</span>
          </Link>
          <p className="text-sm">© 2025 Helparo. India&apos;s first self-price-deciding platform.</p>
        </div>
      </footer>
    </div>
  )
}
