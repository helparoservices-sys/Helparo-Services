'use client'

import { useEffect, useState, useRef } from 'react'
import { createClient } from '@/lib/supabase/client'
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
  Lightbulb,
  Flame,
  Award,
  Users,
  MessageCircle,
  Phone,
  BadgeCheck,
  MapPin
} from 'lucide-react'
import { Button } from '@/components/ui/button'

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
  const [currentTip, setCurrentTip] = useState(0)

  const greeting = getGreeting()

  const tips = [
    { icon: Lightbulb, text: 'Use AI Smart Request for instant quotes!', color: 'text-amber-500' },
    { icon: Gift, text: 'Refer friends & earn ₹100 for each signup', color: 'text-pink-500' },
    { icon: Trophy, text: 'Complete 5 bookings to unlock Gold status', color: 'text-emerald-500' },
  ]

  useEffect(() => {
    const interval = setInterval(() => setCurrentTip((p) => (p + 1) % tips.length), 5000)
    return () => clearInterval(interval)
  }, [tips.length])

  useEffect(() => {
    async function loadData() {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      
      if (!user) {
        router.push('/auth/login')
        return
      }

      const { data: userProfile } = await supabase
        .from('profiles')
        .select('phone, phone_verified, full_name, avatar_url')
        .eq('id', user.id)
        .single()

      if (!userProfile?.phone || !userProfile?.phone_verified) {
        router.push('/auth/complete-signup')
        return
      }

      setProfile(userProfile)

      const [walletRes, loyaltyRes, requestsRes, activeRes, completedRes] = await Promise.all([
        supabase.from('wallet_accounts').select('available_balance').eq('user_id', user.id).single(),
        supabase.from('loyalty_points').select('points_balance').eq('user_id', user.id).single(),
        supabase.from('service_requests').select('id, title, status, created_at, city').eq('customer_id', user.id).order('created_at', { ascending: false }).limit(5),
        supabase.from('service_requests').select('id', { count: 'exact', head: true }).eq('customer_id', user.id).in('status', ['open', 'assigned', 'in_progress']),
        supabase.from('service_requests').select('id', { count: 'exact', head: true }).eq('customer_id', user.id).eq('status', 'completed'),
      ])

      setWallet(walletRes.data)
      setLoyalty(loyaltyRes.data)
      setRequests(requestsRes.data || [])
      setActiveCount(activeRes.count || 0)
      setCompletedCount(completedRes.count || 0)
      setLoading(false)
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
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-emerald-50/30">
      {/* Decorative Background Elements */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        <div className="absolute top-0 right-0 w-[600px] h-[600px] bg-gradient-to-br from-emerald-100/40 via-teal-100/30 to-transparent rounded-full blur-3xl transform translate-x-1/3 -translate-y-1/3" />
        <div className="absolute bottom-0 left-0 w-[500px] h-[500px] bg-gradient-to-tr from-amber-100/30 via-orange-100/20 to-transparent rounded-full blur-3xl transform -translate-x-1/3 translate-y-1/3" />
        <div className="absolute top-1/2 left-1/2 w-[400px] h-[400px] bg-gradient-to-r from-violet-100/20 to-pink-100/20 rounded-full blur-3xl transform -translate-x-1/2 -translate-y-1/2" />
      </div>

      <main className="relative max-w-6xl mx-auto px-4 sm:px-6 py-6 sm:py-10">
        {/* ═══════════════════════════════════════════════════════════════════
            HERO WELCOME SECTION
        ═══════════════════════════════════════════════════════════════════ */}
        <div className="mb-8">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-gradient-to-r from-emerald-500/10 to-teal-500/10 rounded-full mb-3">
                <span className="text-lg">{greeting.emoji}</span>
                <span className="text-sm font-semibold text-emerald-700">{greeting.text}</span>
              </div>
              <h1 className="text-3xl sm:text-4xl lg:text-5xl font-black text-gray-900 tracking-tight">
                Hi, <span className="bg-gradient-to-r from-emerald-600 via-teal-600 to-cyan-600 bg-clip-text text-transparent">{firstName}</span>!
              </h1>
              <p className="text-gray-500 mt-2 text-lg">What do you need help with today?</p>
            </div>
            
            {/* Quick Stats Pill */}
            <div className="flex items-center gap-3 sm:gap-4">
              <Link href="/customer/wallet" className="group flex items-center gap-2 px-4 py-2.5 bg-white rounded-2xl border border-gray-100 shadow-sm hover:shadow-lg hover:border-emerald-200 transition-all">
                <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center shadow-lg shadow-emerald-500/20">
                  <Wallet className="w-4 h-4 text-white" />
                </div>
                <div>
                  <p className="text-xs text-gray-500">Wallet</p>
                  <p className="font-bold text-gray-900">₹{wallet?.available_balance || 0}</p>
                </div>
              </Link>
              <Link href="/customer/badges" className="group flex items-center gap-2 px-4 py-2.5 bg-white rounded-2xl border border-gray-100 shadow-sm hover:shadow-lg hover:border-amber-200 transition-all">
                <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-amber-500 to-orange-500 flex items-center justify-center shadow-lg shadow-amber-500/20">
                  <Trophy className="w-4 h-4 text-white" />
                </div>
                <div>
                  <p className="text-xs text-gray-500">Points</p>
                  <p className="font-bold text-gray-900">{loyalty?.points_balance || 0}</p>
                </div>
              </Link>
            </div>
          </div>
        </div>

        {/* ═══════════════════════════════════════════════════════════════════
            MAIN ACTION CARDS - AI & MANUAL REQUEST
        ═══════════════════════════════════════════════════════════════════ */}
        <div className="grid lg:grid-cols-2 gap-5 mb-8">
          {/* AI Smart Request Card */}
          <Link href="/customer/requests/ai" className="group relative">
            <div className="absolute inset-0 bg-gradient-to-r from-emerald-600 to-teal-600 rounded-[28px] blur-xl opacity-30 group-hover:opacity-50 transition-opacity" />
            <div className="relative bg-gradient-to-br from-emerald-500 via-emerald-600 to-teal-700 rounded-[28px] p-6 sm:p-8 text-white overflow-hidden shadow-2xl shadow-emerald-600/30 hover:shadow-emerald-600/40 transition-all duration-500 group-hover:scale-[1.02]">
              {/* Animated Background Elements */}
              <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full -translate-y-1/2 translate-x-1/3 group-hover:translate-x-1/4 transition-transform duration-700" />
              <div className="absolute bottom-0 left-0 w-48 h-48 bg-white/5 rounded-full translate-y-1/2 -translate-x-1/4 group-hover:-translate-x-1/3 transition-transform duration-700" />
              <div className="absolute top-1/2 right-1/4 w-20 h-20 bg-amber-400/20 rounded-full blur-xl animate-pulse" />
              
              <div className="relative z-10">
                {/* Badge */}
                <div className="inline-flex items-center gap-2 px-4 py-1.5 bg-gradient-to-r from-amber-400 to-orange-400 text-amber-900 rounded-full text-sm font-bold mb-5 shadow-lg shadow-amber-500/30">
                  <Flame className="w-4 h-4" />
                  MOST POPULAR
                </div>
                
                {/* Icon & Title */}
                <div className="flex items-start gap-4 mb-5">
                  <div className="w-16 h-16 bg-white/20 backdrop-blur-sm rounded-2xl flex items-center justify-center flex-shrink-0 shadow-xl group-hover:scale-110 transition-transform duration-300">
                    <Wand2 className="w-8 h-8" />
                  </div>
                  <div>
                    <h3 className="text-2xl sm:text-3xl font-black mb-1">AI Smart Request</h3>
                    <p className="text-emerald-100 font-medium">Describe your problem in simple words</p>
                  </div>
                </div>
                
                {/* Features */}
                <div className="grid grid-cols-2 gap-3 mb-6">
                  <div className="flex items-center gap-2 text-sm text-white/90">
                    <div className="w-6 h-6 rounded-lg bg-white/20 flex items-center justify-center">
                      <Zap className="w-3.5 h-3.5" />
                    </div>
                    <span>Instant AI quotes</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm text-white/90">
                    <div className="w-6 h-6 rounded-lg bg-white/20 flex items-center justify-center">
                      <Clock className="w-3.5 h-3.5" />
                    </div>
                    <span>30 second booking</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm text-white/90">
                    <div className="w-6 h-6 rounded-lg bg-white/20 flex items-center justify-center">
                      <BadgeCheck className="w-3.5 h-3.5" />
                    </div>
                    <span>Verified helpers</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm text-white/90">
                    <div className="w-6 h-6 rounded-lg bg-white/20 flex items-center justify-center">
                      <Shield className="w-3.5 h-3.5" />
                    </div>
                    <span>100% safe</span>
                  </div>
                </div>
                
                {/* CTA */}
                <div className="flex items-center justify-between">
                  <p className="text-emerald-100 text-sm max-w-[200px]">Tell us what you need, AI handles the rest</p>
                  <div className="bg-white text-emerald-700 font-bold px-6 py-3 rounded-2xl text-sm flex items-center gap-2 shadow-xl group-hover:gap-3 transition-all">
                    Try Now <ArrowRight className="w-4 h-4" />
                  </div>
                </div>
              </div>
            </div>
          </Link>

          {/* Manual Request Card */}
          <Link href="/customer/requests/new" className="group relative">
            <div className="absolute inset-0 bg-gradient-to-r from-amber-500 to-orange-500 rounded-[28px] blur-xl opacity-30 group-hover:opacity-50 transition-opacity" />
            <div className="relative bg-gradient-to-br from-amber-500 via-orange-500 to-orange-600 rounded-[28px] p-6 sm:p-8 text-white overflow-hidden shadow-2xl shadow-orange-500/30 hover:shadow-orange-500/40 transition-all duration-500 group-hover:scale-[1.02]">
              {/* Animated Background Elements */}
              <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full -translate-y-1/2 translate-x-1/3 group-hover:translate-x-1/4 transition-transform duration-700" />
              <div className="absolute bottom-0 left-0 w-48 h-48 bg-white/5 rounded-full translate-y-1/2 -translate-x-1/4 group-hover:-translate-x-1/3 transition-transform duration-700" />
              
              <div className="relative z-10">
                {/* Badge */}
                <div className="inline-flex items-center gap-2 px-4 py-1.5 bg-white/20 backdrop-blur-sm text-white rounded-full text-sm font-bold mb-5">
                  <Crown className="w-4 h-4" />
                  YOU SET THE PRICE
                </div>
                
                {/* Icon & Title */}
                <div className="flex items-start gap-4 mb-5">
                  <div className="w-16 h-16 bg-white/20 backdrop-blur-sm rounded-2xl flex items-center justify-center flex-shrink-0 shadow-xl group-hover:scale-110 transition-transform duration-300">
                    <IndianRupee className="w-8 h-8" />
                  </div>
                  <div>
                    <h3 className="text-2xl sm:text-3xl font-black mb-1">Post a Request</h3>
                    <p className="text-orange-100 font-medium">Name your budget, helpers bid</p>
                  </div>
                </div>
                
                {/* Features */}
                <div className="grid grid-cols-2 gap-3 mb-6">
                  <div className="flex items-center gap-2 text-sm text-white/90">
                    <div className="w-6 h-6 rounded-lg bg-white/20 flex items-center justify-center">
                      <Target className="w-3.5 h-3.5" />
                    </div>
                    <span>Your budget</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm text-white/90">
                    <div className="w-6 h-6 rounded-lg bg-white/20 flex items-center justify-center">
                      <Users className="w-3.5 h-3.5" />
                    </div>
                    <span>Multiple offers</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm text-white/90">
                    <div className="w-6 h-6 rounded-lg bg-white/20 flex items-center justify-center">
                      <Star className="w-3.5 h-3.5" />
                    </div>
                    <span>Compare helpers</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm text-white/90">
                    <div className="w-6 h-6 rounded-lg bg-white/20 flex items-center justify-center">
                      <Heart className="w-3.5 h-3.5" />
                    </div>
                    <span>Fair pricing</span>
                  </div>
                </div>
                
                {/* CTA */}
                <div className="flex items-center justify-between">
                  <p className="text-orange-100 text-sm max-w-[200px]">Set your price and let helpers compete</p>
                  <div className="bg-white text-orange-700 font-bold px-6 py-3 rounded-2xl text-sm flex items-center gap-2 shadow-xl group-hover:gap-3 transition-all">
                    Post Now <ArrowRight className="w-4 h-4" />
                  </div>
                </div>
              </div>
            </div>
          </Link>
        </div>

        {/* ═══════════════════════════════════════════════════════════════════
            STATS OVERVIEW SECTION
        ═══════════════════════════════════════════════════════════════════ */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-8">
          <Link href="/customer/bookings?tab=active" className="group bg-white rounded-2xl p-5 border border-gray-100 shadow-sm hover:shadow-xl hover:border-amber-200 hover:-translate-y-1 transition-all duration-300">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-amber-100 to-amber-50 flex items-center justify-center mb-3 group-hover:scale-110 transition-transform">
              <Clock className="w-6 h-6 text-amber-600" />
            </div>
            <p className="text-3xl font-black text-gray-900">
              <AnimatedCounter end={activeCount} />
            </p>
            <p className="text-sm text-gray-500 font-medium">Active Requests</p>
          </Link>

          <Link href="/customer/bookings?tab=completed" className="group bg-white rounded-2xl p-5 border border-gray-100 shadow-sm hover:shadow-xl hover:border-emerald-200 hover:-translate-y-1 transition-all duration-300">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-emerald-100 to-emerald-50 flex items-center justify-center mb-3 group-hover:scale-110 transition-transform">
              <CheckCircle className="w-6 h-6 text-emerald-600" />
            </div>
            <p className="text-3xl font-black text-gray-900">
              <AnimatedCounter end={completedCount} />
            </p>
            <p className="text-sm text-gray-500 font-medium">Completed</p>
          </Link>

          <Link href="/customer/wallet" className="group bg-white rounded-2xl p-5 border border-gray-100 shadow-sm hover:shadow-xl hover:border-blue-200 hover:-translate-y-1 transition-all duration-300">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-blue-100 to-blue-50 flex items-center justify-center mb-3 group-hover:scale-110 transition-transform">
              <Wallet className="w-6 h-6 text-blue-600" />
            </div>
            <p className="text-3xl font-black text-gray-900">
              <AnimatedCounter end={wallet?.available_balance || 0} prefix="₹" />
            </p>
            <p className="text-sm text-gray-500 font-medium">Wallet Balance</p>
          </Link>

          <Link href="/customer/referrals" className="group bg-white rounded-2xl p-5 border border-gray-100 shadow-sm hover:shadow-xl hover:border-purple-200 hover:-translate-y-1 transition-all duration-300">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-purple-100 to-purple-50 flex items-center justify-center mb-3 group-hover:scale-110 transition-transform">
              <Gift className="w-6 h-6 text-purple-600" />
            </div>
            <p className="text-3xl font-black text-gray-900">
              <AnimatedCounter end={loyalty?.points_balance || 0} />
            </p>
            <p className="text-sm text-gray-500 font-medium">Reward Points</p>
          </Link>
        </div>

        {/* ═══════════════════════════════════════════════════════════════════
            RECENT ACTIVITY & QUICK LINKS SECTION
        ═══════════════════════════════════════════════════════════════════ */}
        <div className="grid lg:grid-cols-3 gap-6 mb-8">
          {/* Recent Requests - Takes 2 columns */}
          <div className="lg:col-span-2">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2">
                <Calendar className="w-5 h-5 text-emerald-600" />
                Recent Activity
              </h2>
              <Link href="/customer/requests" className="text-emerald-600 text-sm font-semibold hover:text-emerald-700 flex items-center gap-1 group">
                View all <ChevronRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
              </Link>
            </div>

            <div className="bg-white rounded-3xl border border-gray-100 shadow-sm overflow-hidden">
              {requests.length > 0 ? (
                <div className="divide-y divide-gray-50">
                  {requests.slice(0, 4).map((req, idx) => (
                    <Link
                      key={req.id}
                      href={`/customer/requests/${req.id}`}
                      className="flex items-center justify-between p-5 hover:bg-gradient-to-r hover:from-emerald-50/50 hover:to-transparent transition-all group"
                    >
                      <div className="flex items-center gap-4">
                        <div className={`w-12 h-12 rounded-2xl flex items-center justify-center shadow-lg ${
                          req.status === 'completed' 
                            ? 'bg-gradient-to-br from-emerald-500 to-teal-600 shadow-emerald-500/30' 
                            : req.status === 'in_progress' 
                            ? 'bg-gradient-to-br from-blue-500 to-indigo-600 shadow-blue-500/30' 
                            : 'bg-gradient-to-br from-amber-500 to-orange-500 shadow-amber-500/30'
                        }`}>
                          {req.status === 'completed' ? (
                            <CheckCircle className="w-5 h-5 text-white" />
                          ) : req.status === 'in_progress' ? (
                            <Clock className="w-5 h-5 text-white" />
                          ) : (
                            <Sparkles className="w-5 h-5 text-white" />
                          )}
                        </div>
                        <div>
                          <p className="font-bold text-gray-900 group-hover:text-emerald-700 transition-colors">{req.title}</p>
                          <p className="text-sm text-gray-500 flex items-center gap-2">
                            <span>{new Date(req.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}</span>
                            {req.city && (
                              <>
                                <span className="w-1 h-1 rounded-full bg-gray-300" />
                                <span className="flex items-center gap-1">
                                  <MapPin className="w-3 h-3" />
                                  {req.city}
                                </span>
                              </>
                            )}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        <span className={`text-xs font-bold px-3 py-1.5 rounded-full ${
                          req.status === 'completed' 
                            ? 'bg-emerald-100 text-emerald-700' 
                            : req.status === 'in_progress' 
                            ? 'bg-blue-100 text-blue-700' 
                            : 'bg-amber-100 text-amber-700'
                        }`}>
                          {req.status === 'completed' ? 'Done' : req.status === 'in_progress' ? 'Active' : 'Open'}
                        </span>
                        <ChevronRight className="w-5 h-5 text-gray-300 group-hover:text-emerald-500 group-hover:translate-x-1 transition-all" />
                      </div>
                    </Link>
                  ))}
                </div>
              ) : (
                <div className="p-12 text-center">
                  <div className="w-20 h-20 bg-gradient-to-br from-emerald-100 to-teal-100 rounded-3xl flex items-center justify-center mx-auto mb-5">
                    <Sparkles className="w-10 h-10 text-emerald-600" />
                  </div>
                  <h3 className="text-xl font-bold text-gray-900 mb-2">No requests yet</h3>
                  <p className="text-gray-500 mb-6 max-w-sm mx-auto">Book your first service and experience the Helparo difference!</p>
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
          <div className="space-y-4">
            {/* Tips Card */}
            <div className="bg-gradient-to-br from-violet-500 to-purple-600 rounded-3xl p-6 text-white shadow-2xl shadow-purple-500/30 overflow-hidden relative">
              <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -translate-y-1/2 translate-x-1/2" />
              <div className="relative">
                <div className="flex items-center gap-2 mb-4">
                  <div className="w-8 h-8 rounded-xl bg-white/20 flex items-center justify-center">
                    <Lightbulb className="w-4 h-4" />
                  </div>
                  <span className="font-bold">Pro Tip</span>
                </div>
                <p className="text-white/90 text-sm leading-relaxed">
                  {tips[currentTip].text}
                </p>
                <div className="flex gap-1.5 mt-4">
                  {tips.map((_, i) => (
                    <div key={i} className={`w-2 h-2 rounded-full transition-all ${i === currentTip ? 'bg-white w-6' : 'bg-white/30'}`} />
                  ))}
                </div>
              </div>
            </div>

            {/* Quick Links */}
            <div className="bg-white rounded-3xl border border-gray-100 shadow-sm p-5">
              <h3 className="font-bold text-gray-900 mb-4">Quick Links</h3>
              <div className="space-y-2">
                <Link href="/customer/support" className="flex items-center gap-3 p-3 rounded-2xl hover:bg-emerald-50 transition-colors group">
                  <div className="w-10 h-10 rounded-xl bg-emerald-100 flex items-center justify-center group-hover:bg-emerald-200 transition-colors">
                    <MessageCircle className="w-5 h-5 text-emerald-600" />
                  </div>
                  <div>
                    <p className="font-semibold text-gray-900 text-sm">Support</p>
                    <p className="text-xs text-gray-500">Get help 24/7</p>
                  </div>
                </Link>
                <Link href="/customer/referrals" className="flex items-center gap-3 p-3 rounded-2xl hover:bg-pink-50 transition-colors group">
                  <div className="w-10 h-10 rounded-xl bg-pink-100 flex items-center justify-center group-hover:bg-pink-200 transition-colors">
                    <Gift className="w-5 h-5 text-pink-600" />
                  </div>
                  <div>
                    <p className="font-semibold text-gray-900 text-sm">Refer & Earn</p>
                    <p className="text-xs text-gray-500">Get ₹100 per referral</p>
                  </div>
                </Link>
                <Link href="/customer/notifications" className="flex items-center gap-3 p-3 rounded-2xl hover:bg-amber-50 transition-colors group">
                  <div className="w-10 h-10 rounded-xl bg-amber-100 flex items-center justify-center group-hover:bg-amber-200 transition-colors">
                    <Bell className="w-5 h-5 text-amber-600" />
                  </div>
                  <div>
                    <p className="font-semibold text-gray-900 text-sm">Notifications</p>
                    <p className="text-xs text-gray-500">Stay updated</p>
                  </div>
                </Link>
              </div>
            </div>
          </div>
        </div>

        {/* ═══════════════════════════════════════════════════════════════════
            TRUST BANNER SECTION
        ═══════════════════════════════════════════════════════════════════ */}
        <div className="bg-gradient-to-r from-gray-900 via-gray-800 to-gray-900 rounded-3xl p-8 shadow-2xl overflow-hidden relative">
          {/* Background Pattern */}
          <div className="absolute inset-0 opacity-10">
            <div className="absolute top-0 left-0 w-full h-full" style={{ backgroundImage: 'radial-gradient(circle at 20% 50%, #10b981 0%, transparent 50%), radial-gradient(circle at 80% 50%, #f59e0b 0%, transparent 50%)' }} />
          </div>
          
          <div className="relative flex flex-col lg:flex-row items-center justify-between gap-8">
            <div className="text-center lg:text-left">
              <div className="inline-flex items-center gap-2 px-4 py-1.5 bg-emerald-500/20 text-emerald-400 rounded-full text-sm font-bold mb-3">
                <Sparkles className="w-4 h-4" />
                Trusted by 50,000+ Indians
              </div>
              <h3 className="text-2xl sm:text-3xl font-black text-white mb-2">Book with 100% confidence</h3>
              <p className="text-gray-400">Every helper is verified, every service is guaranteed</p>
            </div>
            
            <div className="flex items-center gap-6 sm:gap-10">
              <div className="text-center">
                <div className="flex items-center justify-center gap-2 mb-2">
                  <Shield className="w-6 h-6 text-emerald-400" />
                  <span className="text-3xl font-black text-white">100%</span>
                </div>
                <p className="text-sm text-gray-400">Verified Helpers</p>
              </div>
              <div className="w-px h-16 bg-gray-700" />
              <div className="text-center">
                <div className="flex items-center justify-center gap-2 mb-2">
                  <Star className="w-6 h-6 text-amber-400" />
                  <span className="text-3xl font-black text-white">4.9</span>
                </div>
                <p className="text-sm text-gray-400">Average Rating</p>
              </div>
              <div className="w-px h-16 bg-gray-700" />
              <div className="text-center">
                <div className="flex items-center justify-center gap-2 mb-2">
                  <Zap className="w-6 h-6 text-blue-400" />
                  <span className="text-3xl font-black text-white">30m</span>
                </div>
                <p className="text-sm text-gray-400">Avg Response</p>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}
