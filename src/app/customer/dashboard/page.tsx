'use client'

import { useEffect, useState, useRef } from 'react'
import { supabase } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { 
  CheckCircle,
  Clock,
  Sparkles,
  ChevronRight,
  IndianRupee,
  Crown,
  Loader2,
  Shield,
  Star,
  Zap,
  Heart,
  ArrowRight,
  Plus,
  Wand2,
  Wallet,
  Gift,
  TrendingUp,
  Calendar,
  Bell,
  Trophy,
  Target,
  Flame,
  Award,
  Users,
  MessageCircle,
  Phone,
  BadgeCheck,
  MapPin
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import ReferralCodeModal from '@/components/customer/ReferralCodeModal'

// Animated Counter Component
function AnimatedCounter({ end, duration = 1500, suffix = '', prefix = '' }: { end: number; duration?: number; suffix?: string; prefix?: string }) {
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

  return <span ref={ref}>{prefix}{count.toLocaleString()}{suffix}</span>
}

// Greeting based on time
function getGreeting() {
  const hour = new Date().getHours()
  if (hour < 12) return { text: 'Good Morning', emoji: '☀️' }
  if (hour < 17) return { text: 'Good Afternoon', emoji: '🌤️' }
  return { text: 'Good Evening', emoji: '🌙' }
}

export default function CustomerDashboard() {
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [profile, setProfile] = useState<{ full_name?: string; avatar_url?: string } | null>(null)
  const [wallet, setWallet] = useState<{ available_balance?: number } | null>(null)
  const [loyalty, setLoyalty] = useState<{ points_balance?: number } | null>(null)
  const [requests, setRequests] = useState<Array<{ id: string; title: string; status: string; created_at: string; city?: string }>>([])
  const [activeCount, setActiveCount] = useState(0)
  const [completedCount, setCompletedCount] = useState(0)
  const [badgeCount, setBadgeCount] = useState(0)
  const [referralCount, setReferralCount] = useState(0)
  const [showReferralModal, setShowReferralModal] = useState(false)

  const greeting = getGreeting()

  useEffect(() => {
    async function loadData() {
      // OPTIMIZATION: Use singleton client
      const { data: { user } } = await supabase.auth.getUser()
      
      if (!user) {
        router.push('/auth/login')
        return
      }

      const { data: userProfile } = await supabase
        .from('profiles')
        .select('role, phone, phone_verified, full_name, avatar_url')
        .eq('id', user.id)
        .single()

      // Check if user has customer role set
      if (!userProfile?.role || userProfile.role !== 'customer') {
        // User might be a helper or no role - redirect appropriately
        if (userProfile?.role === 'helper') {
          router.push('/helper/dashboard')
        } else {
          router.push('/auth/complete-signup')
        }
        return
      }

      // Customers don't need phone verification - it's collected during booking
      setProfile(userProfile)

      // OPTIMIZATION: Combine service_requests queries to reduce from 7 to 5 requests
      // Using Postgres aggregation to get all counts in one query
      const [walletRes, loyaltyRes, requestsWithCounts, badgesRes, referralsRes] = await Promise.all([
        supabase.from('wallet_accounts').select('available_balance').eq('user_id', user.id).single(),
        supabase.from('loyalty_points').select('points_balance').eq('user_id', user.id).single(),
        // Combined query: get recent requests + counts using Postgres aggregation
        supabase.rpc('get_customer_requests_summary', { customer_uuid: user.id }).then(res => {
          // Fallback to separate queries if RPC doesn't exist yet
          if (res.error) {
            return Promise.all([
              supabase.from('service_requests').select('id, title, status, broadcast_status, created_at, city').eq('customer_id', user.id).order('created_at', { ascending: false }).limit(5),
              supabase.from('service_requests').select('id', { count: 'exact', head: true }).eq('customer_id', user.id).in('broadcast_status', ['broadcasting', 'accepted', 'on_way', 'arrived', 'in_progress']),
              supabase.from('service_requests').select('id', { count: 'exact', head: true }).eq('customer_id', user.id).eq('broadcast_status', 'completed'),
            ]).then(([requests, active, completed]) => ({
              data: { requests: requests.data || [], active_count: active.count || 0, completed_count: completed.count || 0 }
            }))
          }
          return res
        }),
        supabase.from('user_badges').select('id', { count: 'exact', head: true }).eq('user_id', user.id),
        supabase.from('referrals').select('id', { count: 'exact', head: true }).eq('referrer_id', user.id),
      ])

      setWallet(walletRes.data)
      setLoyalty(loyaltyRes.data)
      setRequests(requestsWithCounts.data?.requests || [])
      setActiveCount(requestsWithCounts.data?.active_count || 0)
      setCompletedCount(requestsWithCounts.data?.completed_count || 0)
      setBadgeCount(badgesRes.count || 0)
      setReferralCount(referralsRes.count || 0)
      setLoading(false)

      // Check if we should show referral code modal (only for first-time customers)
      // Show modal if: completely new user (no requests at all) AND hasn't seen it before
      const hasSeenReferralPrompt = localStorage.getItem('helparo_referral_prompt_completed')
      const totalRequests = (requestsWithCounts.data?.requests?.length || 0)
      const isFirstTimeUser = totalRequests === 0 && (requestsWithCounts.data?.completed_count || 0) === 0
      
      if (!hasSeenReferralPrompt && isFirstTimeUser) {
        // Small delay to let dashboard render first
        setTimeout(() => setShowReferralModal(true), 1000)
      }
    }

    loadData()
  }, [router])

  const firstName = profile?.full_name?.split(' ')[0] || 'there'

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-emerald-50/30 flex items-center justify-center">
        <div className="text-center">
          <div className="relative">
            <div className="w-20 h-20 rounded-3xl bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center mx-auto shadow-2xl shadow-emerald-500/30">
              <Loader2 className="h-10 w-10 animate-spin text-white" />
            </div>
            <div className="absolute -bottom-1 -right-1 w-6 h-6 bg-amber-400 rounded-full animate-pulse" />
          </div>
          <p className="text-gray-600 font-medium mt-6">Loading your dashboard...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-emerald-50/30 overflow-x-hidden pt-safe-or-4">
      {/* Decorative Background Elements */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        <div className="absolute top-0 right-0 w-[600px] h-[600px] bg-gradient-to-br from-emerald-100/40 via-teal-100/30 to-transparent rounded-full blur-3xl transform translate-x-1/3 -translate-y-1/3" />
        <div className="absolute bottom-0 left-0 w-[500px] h-[500px] bg-gradient-to-tr from-amber-100/30 via-orange-100/20 to-transparent rounded-full blur-3xl transform -translate-x-1/3 translate-y-1/3" />
        <div className="absolute top-1/2 left-1/2 w-[400px] h-[400px] bg-gradient-to-r from-violet-100/20 to-pink-100/20 rounded-full blur-3xl transform -translate-x-1/2 -translate-y-1/2" />
      </div>

      <main className="relative w-full max-w-6xl mx-auto px-3 sm:px-6 py-4 sm:py-10 overflow-x-hidden">
        {/* ═══════════════════════════════════════════════════════════════════
            HERO WELCOME SECTION
        ═══════════════════════════════════════════════════════════════════ */}
        <div className="mb-6 sm:mb-8">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-gradient-to-r from-emerald-500/10 to-teal-500/10 rounded-full mb-3">
                <span className="text-lg">{greeting.emoji}</span>
                <span className="text-sm font-semibold text-emerald-700">{greeting.text}</span>
              </div>
              <h1 className="text-2xl sm:text-4xl lg:text-5xl font-black text-gray-900 tracking-tight">
                Hi, <span className="bg-gradient-to-r from-emerald-600 via-teal-600 to-cyan-600 bg-clip-text text-transparent">{firstName}</span>!
              </h1>
              <p className="text-gray-500 mt-2 text-base sm:text-lg">What do you need help with today?</p>
            </div>
            
{/* === HIDDEN FOR NOW - WALLET & POINTS BUTTONS ===
            <div className="flex items-center gap-2 sm:gap-4">
              <Link href="/customer/wallet" className="group flex items-center gap-2 px-3 sm:px-4 py-2 sm:py-2.5 bg-white rounded-2xl border border-gray-100 shadow-sm hover:shadow-lg hover:border-emerald-200 transition-all">
                <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center shadow-lg shadow-emerald-500/20">
                  <Wallet className="w-4 h-4 text-white" />
                </div>
                <div>
                  <p className="text-xs text-gray-500">Wallet</p>
                  <p className="font-bold text-gray-900">₹{wallet?.available_balance || 0}</p>
                </div>
              </Link>
              <Link href="/customer/badges" className="group flex items-center gap-2 px-3 sm:px-4 py-2 sm:py-2.5 bg-white rounded-2xl border border-gray-100 shadow-sm hover:shadow-lg hover:border-amber-200 transition-all">
                <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-amber-500 to-orange-500 flex items-center justify-center shadow-lg shadow-amber-500/20">
                  <Trophy className="w-4 h-4 text-white" />
                </div>
                <div>
                  <p className="text-xs text-gray-500">Points</p>
                  <p className="font-bold text-gray-900">{loyalty?.points_balance || 0}</p>
                </div>
              </Link>
            </div>
            === END HIDDEN WALLET & POINTS === */}
          </div>
        </div>

        {/* ═══════════════════════════════════════════════════════════════════
            MAIN ACTION CARDS - AI & MANUAL REQUEST
        ═══════════════════════════════════════════════════════════════════ */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-5 mb-6 sm:mb-8">
          {/* AI Smart Request Card */}
          <Link href="/customer/requests/ai" className="group relative">
            <div className="absolute inset-0 bg-gradient-to-r from-emerald-600 to-teal-600 rounded-2xl sm:rounded-[28px] blur-xl opacity-30 group-hover:opacity-50 transition-opacity" />
            <div className="relative bg-gradient-to-br from-emerald-500 via-emerald-600 to-teal-700 rounded-2xl sm:rounded-[28px] p-4 sm:p-6 lg:p-8 text-white overflow-hidden shadow-2xl shadow-emerald-600/30 hover:shadow-emerald-600/40 transition-all duration-500 group-hover:scale-[1.02]">
              {/* Animated Background Elements */}
              <div className="absolute top-0 right-0 w-40 sm:w-64 h-40 sm:h-64 bg-white/10 rounded-full -translate-y-1/2 translate-x-1/3 group-hover:translate-x-1/4 transition-transform duration-700" />
              <div className="absolute bottom-0 left-0 w-32 sm:w-48 h-32 sm:h-48 bg-white/5 rounded-full translate-y-1/2 -translate-x-1/4 group-hover:-translate-x-1/3 transition-transform duration-700" />
              <div className="absolute top-1/2 right-1/4 w-16 sm:w-20 h-16 sm:h-20 bg-amber-400/20 rounded-full blur-xl animate-pulse" />
              
              <div className="relative z-10">
                {/* Badge */}
                <div className="inline-flex items-center gap-2 px-3 sm:px-4 py-1 sm:py-1.5 bg-gradient-to-r from-amber-400 to-orange-400 text-amber-900 rounded-full text-xs sm:text-sm font-bold mb-4 sm:mb-5 shadow-lg shadow-amber-500/30">
                  <Flame className="w-3 h-3 sm:w-4 sm:h-4" />
                  MOST POPULAR
                </div>
                
                {/* Icon & Title */}
                <div className="flex items-start gap-3 sm:gap-4 mb-4 sm:mb-5">
                  <div className="w-12 h-12 sm:w-16 sm:h-16 bg-white/20 backdrop-blur-sm rounded-xl sm:rounded-2xl flex items-center justify-center flex-shrink-0 shadow-xl group-hover:scale-110 transition-transform duration-300">
                    <Wand2 className="w-6 h-6 sm:w-8 sm:h-8" />
                  </div>
                  <div className="min-w-0">
                    <h3 className="text-xl sm:text-2xl lg:text-3xl font-black mb-1">AI Smart Request</h3>
                    <p className="text-emerald-100 font-medium text-sm sm:text-base">Describe your problem in simple words</p>
                  </div>
                </div>
                
                {/* Features */}
                <div className="grid grid-cols-2 gap-2 sm:gap-3 mb-4 sm:mb-6">
                  <div className="flex items-center gap-2 text-xs sm:text-sm text-white/90">
                    <div className="w-5 h-5 sm:w-6 sm:h-6 rounded-lg bg-white/20 flex items-center justify-center flex-shrink-0">
                      <Zap className="w-3 h-3 sm:w-3.5 sm:h-3.5" />
                    </div>
                    <span className="truncate">Instant AI quotes</span>
                  </div>
                  <div className="flex items-center gap-2 text-xs sm:text-sm text-white/90">
                    <div className="w-5 h-5 sm:w-6 sm:h-6 rounded-lg bg-white/20 flex items-center justify-center flex-shrink-0">
                      <Clock className="w-3 h-3 sm:w-3.5 sm:h-3.5" />
                    </div>
                    <span className="truncate">30 sec booking</span>
                  </div>
                  <div className="flex items-center gap-2 text-xs sm:text-sm text-white/90">
                    <div className="w-5 h-5 sm:w-6 sm:h-6 rounded-lg bg-white/20 flex items-center justify-center flex-shrink-0">
                      <BadgeCheck className="w-3 h-3 sm:w-3.5 sm:h-3.5" />
                    </div>
                    <span className="truncate">Verified helpers</span>
                  </div>
                  <div className="flex items-center gap-2 text-xs sm:text-sm text-white/90">
                    <div className="w-5 h-5 sm:w-6 sm:h-6 rounded-lg bg-white/20 flex items-center justify-center flex-shrink-0">
                      <Shield className="w-3 h-3 sm:w-3.5 sm:h-3.5" />
                    </div>
                    <span className="truncate">100% safe</span>
                  </div>
                </div>
                
                {/* CTA */}
                <div className="flex items-center justify-between gap-2">
                  <p className="text-emerald-100 text-xs sm:text-sm hidden sm:block max-w-[200px]">Tell us what you need, AI handles the rest</p>
                  <div className="bg-white text-emerald-700 font-bold px-4 sm:px-6 py-2 sm:py-3 rounded-xl sm:rounded-2xl text-xs sm:text-sm flex items-center gap-2 shadow-xl group-hover:gap-3 transition-all whitespace-nowrap">
                    Try Now <ArrowRight className="w-3 h-3 sm:w-4 sm:h-4" />
                  </div>
                </div>
              </div>
            </div>
          </Link>

          {/* Manual Request Card */}
          <Link href="/customer/requests/new" className="group relative">
            <div className="absolute inset-0 bg-gradient-to-r from-amber-500 to-orange-500 rounded-2xl sm:rounded-[28px] blur-xl opacity-30 group-hover:opacity-50 transition-opacity" />
            <div className="relative bg-gradient-to-br from-amber-500 via-orange-500 to-orange-600 rounded-2xl sm:rounded-[28px] p-4 sm:p-6 lg:p-8 text-white overflow-hidden shadow-2xl shadow-orange-500/30 hover:shadow-orange-500/40 transition-all duration-500 group-hover:scale-[1.02]">
              {/* Animated Background Elements */}
              <div className="absolute top-0 right-0 w-40 sm:w-64 h-40 sm:h-64 bg-white/10 rounded-full -translate-y-1/2 translate-x-1/3 group-hover:translate-x-1/4 transition-transform duration-700" />
              <div className="absolute bottom-0 left-0 w-32 sm:w-48 h-32 sm:h-48 bg-white/5 rounded-full translate-y-1/2 -translate-x-1/4 group-hover:-translate-x-1/3 transition-transform duration-700" />
              
              <div className="relative z-10">
                {/* Badge */}
                <div className="inline-flex items-center gap-2 px-3 sm:px-4 py-1 sm:py-1.5 bg-white/20 backdrop-blur-sm text-white rounded-full text-xs sm:text-sm font-bold mb-4 sm:mb-5">
                  <Crown className="w-3 h-3 sm:w-4 sm:h-4" />
                  YOU SET THE PRICE
                </div>
                
                {/* Icon & Title */}
                <div className="flex items-start gap-3 sm:gap-4 mb-4 sm:mb-5">
                  <div className="w-12 h-12 sm:w-16 sm:h-16 bg-white/20 backdrop-blur-sm rounded-xl sm:rounded-2xl flex items-center justify-center flex-shrink-0 shadow-xl group-hover:scale-110 transition-transform duration-300">
                    <IndianRupee className="w-6 h-6 sm:w-8 sm:h-8" />
                  </div>
                  <div className="min-w-0">
                    <h3 className="text-xl sm:text-2xl lg:text-3xl font-black mb-1">Post a Request</h3>
                    <p className="text-orange-100 font-medium text-sm sm:text-base">Your budget, your rules</p>
                  </div>
                </div>
                
                {/* Features */}
                <div className="grid grid-cols-2 gap-2 sm:gap-3 mb-4 sm:mb-6">
                  <div className="flex items-center gap-2 text-xs sm:text-sm text-white/90">
                    <div className="w-5 h-5 sm:w-6 sm:h-6 rounded-lg bg-white/20 flex items-center justify-center flex-shrink-0">
                      <Target className="w-3 h-3 sm:w-3.5 sm:h-3.5" />
                    </div>
                    <span className="truncate">You decide the price</span>
                  </div>
                  <div className="flex items-center gap-2 text-xs sm:text-sm text-white/90">
                    <div className="w-5 h-5 sm:w-6 sm:h-6 rounded-lg bg-white/20 flex items-center justify-center flex-shrink-0">
                      <Users className="w-3 h-3 sm:w-3.5 sm:h-3.5" />
                    </div>
                    <span className="truncate">We find the right pro</span>
                  </div>
                  <div className="flex items-center gap-2 text-xs sm:text-sm text-white/90">
                    <div className="w-5 h-5 sm:w-6 sm:h-6 rounded-lg bg-white/20 flex items-center justify-center flex-shrink-0">
                      <Star className="w-3 h-3 sm:w-3.5 sm:h-3.5" />
                    </div>
                    <span className="truncate">Zero hidden fees</span>
                  </div>
                  <div className="flex items-center gap-2 text-xs sm:text-sm text-white/90">
                    <div className="w-5 h-5 sm:w-6 sm:h-6 rounded-lg bg-white/20 flex items-center justify-center flex-shrink-0">
                      <Heart className="w-3 h-3 sm:w-3.5 sm:h-3.5" />
                    </div>
                    <span className="truncate">100% in your control</span>
                  </div>
                </div>
                
                {/* CTA */}
                <div className="flex items-center justify-between gap-2">
                  <p className="text-orange-100 text-xs sm:text-sm hidden sm:block max-w-[200px]">Name your price, we handle the rest</p>
                  <div className="bg-white text-orange-700 font-bold px-4 sm:px-6 py-2 sm:py-3 rounded-xl sm:rounded-2xl text-xs sm:text-sm flex items-center gap-2 shadow-xl group-hover:gap-3 transition-all whitespace-nowrap">
                    Post Now <ArrowRight className="w-3 h-3 sm:w-4 sm:h-4" />
                  </div>
                </div>
              </div>
            </div>
          </Link>
        </div>

        {/* ═══════════════════════════════════════════════════════════════════
            STATS OVERVIEW SECTION
        ═══════════════════════════════════════════════════════════════════ */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4 mb-6 sm:mb-8">
          <Link href="/customer/active-requests" className="group bg-white rounded-xl sm:rounded-2xl p-3 sm:p-5 border border-gray-100 shadow-sm hover:shadow-xl hover:border-amber-200 hover:-translate-y-1 transition-all duration-300">
            <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl sm:rounded-2xl bg-gradient-to-br from-amber-100 to-amber-50 flex items-center justify-center mb-2 sm:mb-3 group-hover:scale-110 transition-transform">
              <Clock className="w-5 h-5 sm:w-6 sm:h-6 text-amber-600" />
            </div>
            <p className="text-2xl sm:text-3xl font-black text-gray-900">
              <AnimatedCounter end={activeCount} />
            </p>
            <p className="text-xs sm:text-sm text-gray-500 font-medium">Active Requests</p>
          </Link>

          <Link href="/customer/bookings?tab=completed" className="group bg-white rounded-xl sm:rounded-2xl p-3 sm:p-5 border border-gray-100 shadow-sm hover:shadow-xl hover:border-emerald-200 hover:-translate-y-1 transition-all duration-300">
            <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl sm:rounded-2xl bg-gradient-to-br from-emerald-100 to-emerald-50 flex items-center justify-center mb-2 sm:mb-3 group-hover:scale-110 transition-transform">
              <CheckCircle className="w-5 h-5 sm:w-6 sm:h-6 text-emerald-600" />
            </div>
            <p className="text-2xl sm:text-3xl font-black text-gray-900">
              <AnimatedCounter end={completedCount} />
            </p>
            <p className="text-xs sm:text-sm text-gray-500 font-medium">Completed</p>
          </Link>

          {/* === HIDDEN FOR NOW - WALLET BALANCE CARD ===
          <Link href="/customer/wallet" className="group bg-white rounded-xl sm:rounded-2xl p-3 sm:p-5 border border-gray-100 shadow-sm hover:shadow-xl hover:border-blue-200 hover:-translate-y-1 transition-all duration-300">
            <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl sm:rounded-2xl bg-gradient-to-br from-blue-100 to-blue-50 flex items-center justify-center mb-2 sm:mb-3 group-hover:scale-110 transition-transform">
              <Wallet className="w-5 h-5 sm:w-6 sm:h-6 text-blue-600" />
            </div>
            <p className="text-2xl sm:text-3xl font-black text-gray-900">
              <AnimatedCounter end={wallet?.available_balance || 0} prefix="₹" />
            </p>
            <p className="text-xs sm:text-sm text-gray-500 font-medium">Wallet Balance</p>
          </Link>
          === END HIDDEN WALLET BALANCE === */}

          <Link href="/customer/badges" className="group bg-white rounded-xl sm:rounded-2xl p-3 sm:p-5 border border-gray-100 shadow-sm hover:shadow-xl hover:border-purple-200 hover:-translate-y-1 transition-all duration-300">
            <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl sm:rounded-2xl bg-gradient-to-br from-purple-100 to-purple-50 flex items-center justify-center mb-2 sm:mb-3 group-hover:scale-110 transition-transform">
              <Trophy className="w-5 h-5 sm:w-6 sm:h-6 text-purple-600" />
            </div>
            <p className="text-2xl sm:text-3xl font-black text-gray-900">
              <AnimatedCounter end={badgeCount} />
            </p>
            <p className="text-xs sm:text-sm text-gray-500 font-medium">Badges</p>
          </Link>

          <Link href="/customer/referrals" className="group bg-white rounded-xl sm:rounded-2xl p-3 sm:p-5 border border-gray-100 shadow-sm hover:shadow-xl hover:border-pink-200 hover:-translate-y-1 transition-all duration-300">
            <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl sm:rounded-2xl bg-gradient-to-br from-pink-100 to-pink-50 flex items-center justify-center mb-2 sm:mb-3 group-hover:scale-110 transition-transform">
              <Users className="w-5 h-5 sm:w-6 sm:h-6 text-pink-600" />
            </div>
            <p className="text-2xl sm:text-3xl font-black text-gray-900">
              <AnimatedCounter end={referralCount} />
            </p>
            <p className="text-xs sm:text-sm text-gray-500 font-medium">Referrals</p>
          </Link>
        </div>

        {/* ═══════════════════════════════════════════════════════════════════
            RECENT ACTIVITY & QUICK LINKS SECTION
        ═══════════════════════════════════════════════════════════════════ */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6 mb-6 sm:mb-8">
          {/* Recent Requests - Takes 2 columns */}
          <div className="lg:col-span-2">
            <div className="flex items-center justify-between mb-3 sm:mb-4">
              <h2 className="text-lg sm:text-xl font-bold text-gray-900 flex items-center gap-2">
                <Calendar className="w-4 h-4 sm:w-5 sm:h-5 text-emerald-600" />
                Recent Activity
              </h2>
              <Link href="/customer/requests" className="text-emerald-600 text-xs sm:text-sm font-semibold hover:text-emerald-700 flex items-center gap-1 group">
                View all <ChevronRight className="w-3 h-3 sm:w-4 sm:h-4 group-hover:translate-x-1 transition-transform" />
              </Link>
            </div>

            <div className="bg-white rounded-2xl sm:rounded-3xl border border-gray-100 shadow-sm overflow-hidden">
              {requests.length > 0 ? (
                <div className="divide-y divide-gray-50">
                  {requests.slice(0, 4).map((req, idx) => (
                    <Link
                      key={req.id}
                      href={`/customer/requests/${req.id}`}
                      className="flex items-center justify-between p-3 sm:p-5 hover:bg-gradient-to-r hover:from-emerald-50/50 hover:to-transparent transition-all group"
                    >
                      <div className="flex items-center gap-3 sm:gap-4 min-w-0 flex-1">
                        <div className={`w-10 h-10 sm:w-12 sm:h-12 rounded-xl sm:rounded-2xl flex items-center justify-center shadow-lg flex-shrink-0 ${
                          req.status === 'completed' 
                            ? 'bg-gradient-to-br from-emerald-500 to-teal-600 shadow-emerald-500/30' 
                            : req.status === 'in_progress' 
                            ? 'bg-gradient-to-br from-blue-500 to-indigo-600 shadow-blue-500/30' 
                            : 'bg-gradient-to-br from-amber-500 to-orange-500 shadow-amber-500/30'
                        }`}>
                          {req.status === 'completed' ? (
                            <CheckCircle className="w-4 h-4 sm:w-5 sm:h-5 text-white" />
                          ) : req.status === 'in_progress' ? (
                            <Clock className="w-4 h-4 sm:w-5 sm:h-5 text-white" />
                          ) : (
                            <Sparkles className="w-4 h-4 sm:w-5 sm:h-5 text-white" />
                          )}
                        </div>
                        <div className="min-w-0">
                          <p className="font-bold text-gray-900 group-hover:text-emerald-700 transition-colors text-sm sm:text-base truncate">{req.title}</p>
                          <p className="text-xs sm:text-sm text-gray-500 flex items-center gap-2">
                            <span>{new Date(req.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}</span>
                            {req.city && (
                              <>
                                <span className="w-1 h-1 rounded-full bg-gray-300 hidden sm:block" />
                                <span className="items-center gap-1 hidden sm:flex">
                                  <MapPin className="w-3 h-3" />
                                  {req.city}
                                </span>
                              </>
                            )}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2 sm:gap-3 flex-shrink-0 ml-2">
                        <span className={`text-[10px] sm:text-xs font-bold px-2 sm:px-3 py-1 sm:py-1.5 rounded-full whitespace-nowrap ${
                          req.status === 'completed' 
                            ? 'bg-emerald-100 text-emerald-700' 
                            : req.status === 'in_progress' 
                            ? 'bg-blue-100 text-blue-700' 
                            : 'bg-amber-100 text-amber-700'
                        }`}>
                          {req.status === 'completed' ? 'Done' : req.status === 'in_progress' ? 'Active' : 'Open'}
                        </span>
                        <ChevronRight className="w-4 h-4 sm:w-5 sm:h-5 text-gray-300 group-hover:text-emerald-500 group-hover:translate-x-1 transition-all" />
                      </div>
                    </Link>
                  ))}
                </div>
              ) : (
                <div className="p-8 sm:p-12 text-center">
                  <div className="w-16 h-16 sm:w-20 sm:h-20 bg-gradient-to-br from-emerald-100 to-teal-100 rounded-2xl sm:rounded-3xl flex items-center justify-center mx-auto mb-4 sm:mb-5">
                    <Sparkles className="w-8 h-8 sm:w-10 sm:h-10 text-emerald-600" />
                  </div>
                  <h3 className="text-lg sm:text-xl font-bold text-gray-900 mb-2">No requests yet</h3>
                  <p className="text-gray-500 mb-4 sm:mb-6 max-w-sm mx-auto text-sm sm:text-base">Book your first service and experience the Helparo difference!</p>
                  <Button asChild className="bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white shadow-lg shadow-emerald-500/30">
                    <Link href="/customer/requests/ai" className="flex items-center gap-2">
                      <Plus className="w-4 h-4" /> Create Your First Request
                    </Link>
                  </Button>
                </div>
              )}
            </div>
          </div>

          {/* Quick Actions Sidebar */}
          <div className="space-y-3 sm:space-y-4">
            {/* Quick Links */}
            <div className="bg-white rounded-2xl sm:rounded-3xl border border-gray-100 shadow-sm p-4 sm:p-5">
              <h3 className="font-bold text-gray-900 mb-3 sm:mb-4 text-sm sm:text-base">Quick Links</h3>
              <div className="space-y-2">
                <Link href="/customer/support" className="flex items-center gap-3 p-2 sm:p-3 rounded-xl sm:rounded-2xl hover:bg-emerald-50 transition-colors group">
                  <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-lg sm:rounded-xl bg-emerald-100 flex items-center justify-center group-hover:bg-emerald-200 transition-colors">
                    <MessageCircle className="w-4 h-4 sm:w-5 sm:h-5 text-emerald-600" />
                  </div>
                  <div className="min-w-0">
                    <p className="font-semibold text-gray-900 text-xs sm:text-sm">Support</p>
                    <p className="text-[10px] sm:text-xs text-gray-500">Get help 24/7</p>
                  </div>
                </Link>
                <Link href="/customer/referrals" className="flex items-center gap-3 p-2 sm:p-3 rounded-xl sm:rounded-2xl hover:bg-pink-50 transition-colors group">
                  <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-lg sm:rounded-xl bg-pink-100 flex items-center justify-center group-hover:bg-pink-200 transition-colors">
                    <Gift className="w-4 h-4 sm:w-5 sm:h-5 text-pink-600" />
                  </div>
                  <div className="min-w-0">
                    <p className="font-semibold text-gray-900 text-xs sm:text-sm">Refer & Earn</p>
                    <p className="text-[10px] sm:text-xs text-gray-500">Get 1 month free services</p>
                  </div>
                </Link>
                <Link href="/customer/notifications" className="flex items-center gap-3 p-2 sm:p-3 rounded-xl sm:rounded-2xl hover:bg-amber-50 transition-colors group">
                  <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-lg sm:rounded-xl bg-amber-100 flex items-center justify-center group-hover:bg-amber-200 transition-colors">
                    <Bell className="w-4 h-4 sm:w-5 sm:h-5 text-amber-600" />
                  </div>
                  <div className="min-w-0">
                    <p className="font-semibold text-gray-900 text-xs sm:text-sm">Notifications</p>
                    <p className="text-[10px] sm:text-xs text-gray-500">Stay updated</p>
                  </div>
                </Link>
              </div>
            </div>
          </div>
        </div>

        {/* ═══════════════════════════════════════════════════════════════════
            TRUST BANNER SECTION
        ═══════════════════════════════════════════════════════════════════ */}
        <div className="bg-gradient-to-r from-gray-900 via-gray-800 to-gray-900 rounded-2xl sm:rounded-3xl p-5 sm:p-8 shadow-2xl overflow-hidden relative">
          {/* Background Pattern */}
          <div className="absolute inset-0 opacity-10">
            <div className="absolute top-0 left-0 w-full h-full" style={{ backgroundImage: 'radial-gradient(circle at 20% 50%, #10b981 0%, transparent 50%), radial-gradient(circle at 80% 50%, #f59e0b 0%, transparent 50%)' }} />
          </div>
          
          <div className="relative flex flex-col lg:flex-row items-center justify-between gap-6 sm:gap-8">
            <div className="text-center lg:text-left">
              <div className="inline-flex items-center gap-2 px-3 sm:px-4 py-1 sm:py-1.5 bg-emerald-500/20 text-emerald-400 rounded-full text-xs sm:text-sm font-bold mb-3">
                <Sparkles className="w-3 h-3 sm:w-4 sm:h-4" />
                Trusted by 50,000+ Indians
              </div>
              <h3 className="text-xl sm:text-2xl lg:text-3xl font-black text-white mb-2">Book with 100% confidence</h3>
              <p className="text-gray-400 text-sm sm:text-base">Every helper is verified, every service is guaranteed</p>
            </div>
            
            <div className="flex items-center gap-4 sm:gap-6 lg:gap-10">
              <div className="text-center">
                <div className="flex items-center justify-center gap-1 sm:gap-2 mb-1 sm:mb-2">
                  <Shield className="w-4 h-4 sm:w-6 sm:h-6 text-emerald-400" />
                  <span className="text-xl sm:text-2xl lg:text-3xl font-black text-white">100%</span>
                </div>
                <p className="text-[10px] sm:text-sm text-gray-400">Verified</p>
              </div>
              <div className="w-px h-10 sm:h-16 bg-gray-700" />
              <div className="text-center">
                <div className="flex items-center justify-center gap-1 sm:gap-2 mb-1 sm:mb-2">
                  <Star className="w-4 h-4 sm:w-6 sm:h-6 text-amber-400" />
                  <span className="text-xl sm:text-2xl lg:text-3xl font-black text-white">4.9</span>
                </div>
                <p className="text-[10px] sm:text-sm text-gray-400">Rating</p>
              </div>
              <div className="w-px h-10 sm:h-16 bg-gray-700" />
              <div className="text-center">
                <div className="flex items-center justify-center gap-1 sm:gap-2 mb-1 sm:mb-2">
                  <Zap className="w-4 h-4 sm:w-6 sm:h-6 text-blue-400" />
                  <span className="text-xl sm:text-2xl lg:text-3xl font-black text-white">30m</span>
                </div>
                <p className="text-[10px] sm:text-sm text-gray-400">Response</p>
              </div>
            </div>
          </div>
        </div>
      </main>

      {/* Referral Code Modal - Shows only for first-time customers */}
      <ReferralCodeModal 
        isOpen={showReferralModal} 
        onClose={() => setShowReferralModal(false)} 
      />
    </div>
  )
}
