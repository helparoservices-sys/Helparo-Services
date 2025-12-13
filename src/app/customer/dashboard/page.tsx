'use client'

import { useEffect, useState } from 'react'
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
  Wallet
} from 'lucide-react'
import { Button } from '@/components/ui/button'

export default function CustomerDashboard() {
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [profile, setProfile] = useState<{ full_name?: string; avatar_url?: string } | null>(null)
  const [wallet, setWallet] = useState<{ available_balance?: number } | null>(null)
  const [loyalty, setLoyalty] = useState<{ points_balance?: number } | null>(null)
  const [requests, setRequests] = useState<Array<{ id: string; title: string; status: string; created_at: string; city?: string }>>([])
  const [activeCount, setActiveCount] = useState(0)
  const [completedCount, setCompletedCount] = useState(0)

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
      <div className="min-h-screen bg-gradient-to-b from-emerald-50 via-white to-teal-50 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="h-10 w-10 animate-spin text-emerald-600 mx-auto mb-4" />
          <p className="text-gray-500 font-medium">Loading...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-emerald-50/50 via-white to-teal-50/50">
      {/* Decorative Background */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        <div className="absolute top-20 right-20 w-96 h-96 bg-emerald-100/50 rounded-full blur-3xl" />
        <div className="absolute bottom-20 left-20 w-80 h-80 bg-teal-100/50 rounded-full blur-3xl" />
      </div>

      <main className="relative max-w-6xl mx-auto px-4 sm:px-6 py-8">
        {/* Welcome */}
        <div className="mb-8">
          <p className="text-emerald-600 font-medium mb-1">👋 Welcome back</p>
          <h1 className="text-3xl sm:text-4xl font-bold text-gray-900">
            Hi {firstName}!
          </h1>
        </div>

        {/* Quick Actions - Two Big Cards */}
        <div className="grid sm:grid-cols-2 gap-5 mb-8">
          {/* AI Request */}
          <Link href="/customer/requests/ai" className="group">
            <div className="relative bg-gradient-to-br from-emerald-500 via-emerald-600 to-teal-600 rounded-3xl p-6 text-white overflow-hidden shadow-lg hover:shadow-xl hover:shadow-emerald-500/20 transition-all duration-300">
              {/* Decorative circles */}
              <div className="absolute top-0 right-0 w-40 h-40 bg-white/10 rounded-full -translate-y-1/2 translate-x-1/4" />
              <div className="absolute bottom-0 right-20 w-24 h-24 bg-white/5 rounded-full translate-y-1/2" />
              
              <div className="relative">
                {/* Top Badge */}
                <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-amber-400 text-amber-900 rounded-full text-xs font-bold mb-4">
                  <Zap className="w-3 h-3" />
                  RECOMMENDED
                </div>
                
                <div className="flex items-start gap-3 mb-4">
                  <div className="w-12 h-12 bg-white/20 backdrop-blur-sm rounded-xl flex items-center justify-center flex-shrink-0">
                    <Wand2 className="w-6 h-6" />
                  </div>
                  <div>
                    <h3 className="text-xl font-bold">AI Smart Request</h3>
                    <p className="text-emerald-200 text-sm">Instant pricing • Auto-match helpers</p>
                  </div>
                </div>
                
                {/* Description */}
                <p className="text-white/90 mb-5">
                  Describe your issue and get <span className="text-amber-300 font-semibold">instant AI quotes</span> in seconds!
                </p>
                
                {/* Bottom Row */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3 text-sm text-emerald-100">
                    <span className="flex items-center gap-1">
                      <Sparkles className="w-4 h-4" />
                      AI Pricing
                    </span>
                    <span className="flex items-center gap-1">
                      <Clock className="w-4 h-4" />
                      30 sec
                    </span>
                  </div>
                  <div className="bg-white text-emerald-700 font-bold px-4 py-2 rounded-full text-sm flex items-center gap-1.5 group-hover:gap-2.5 transition-all shadow-lg">
                    Try Now <ArrowRight className="w-4 h-4" />
                  </div>
                </div>
              </div>
            </div>
          </Link>

          {/* Manual Request */}
          <Link href="/customer/requests/new" className="group">
            <div className="relative bg-gradient-to-br from-amber-500 via-orange-500 to-orange-600 rounded-3xl p-6 text-white overflow-hidden shadow-lg hover:shadow-xl hover:shadow-orange-500/20 transition-all duration-300">
              {/* Decorative circles */}
              <div className="absolute top-0 right-0 w-40 h-40 bg-white/10 rounded-full -translate-y-1/2 translate-x-1/4" />
              <div className="absolute bottom-0 right-20 w-24 h-24 bg-white/5 rounded-full translate-y-1/2" />
              
              <div className="relative">
                {/* Top Badge */}
                <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-white/20 backdrop-blur-sm text-white rounded-full text-xs font-bold mb-4">
                  <Crown className="w-3 h-3" />
                  YOU DECIDE PRICE
                </div>
                
                {/* Icon + Title Row */}
                <div className="flex items-start gap-3 mb-4">
                  <div className="w-12 h-12 bg-white/20 backdrop-blur-sm rounded-xl flex items-center justify-center flex-shrink-0">
                    <IndianRupee className="w-6 h-6" />
                  </div>
                  <div>
                    <h3 className="text-xl font-bold">Post a Request</h3>
                    <p className="text-orange-200 text-sm">Name your price • Helpers accept</p>
                  </div>
                </div>
                
                {/* Description */}
                <p className="text-white/90 mb-5">
                  Set <span className="text-amber-200 font-semibold">your own budget</span> and helpers will accept your offer!
                </p>
                
                {/* Bottom Row */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3 text-sm text-orange-100">
                    <span className="flex items-center gap-1">
                      <Shield className="w-4 h-4" />
                      Verified
                    </span>
                    <span className="flex items-center gap-1">
                      <Heart className="w-4 h-4" />
                      Fair Pricing
                    </span>
                  </div>
                  <div className="bg-white text-orange-700 font-bold px-4 py-2 rounded-full text-sm flex items-center gap-1.5 group-hover:gap-2.5 transition-all shadow-lg">
                    Post Now <ArrowRight className="w-4 h-4" />
                  </div>
                </div>
              </div>
            </div>
          </Link>
        </div>

        {/* Stats Row */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-8">
          <Link href="/customer/bookings?tab=active" className="bg-white rounded-xl p-4 border border-gray-100 shadow-sm hover:shadow-md hover:border-emerald-200 transition-all">
            <div className="flex items-center gap-3 mb-2">
              <div className="w-10 h-10 bg-amber-100 rounded-lg flex items-center justify-center">
                <Clock className="w-5 h-5 text-amber-600" />
              </div>
            </div>
            <p className="text-2xl font-bold text-gray-900">{activeCount}</p>
            <p className="text-sm text-gray-500">Active</p>
          </Link>

          <Link href="/customer/bookings?tab=completed" className="bg-white rounded-xl p-4 border border-gray-100 shadow-sm hover:shadow-md hover:border-emerald-200 transition-all">
            <div className="flex items-center gap-3 mb-2">
              <div className="w-10 h-10 bg-emerald-100 rounded-lg flex items-center justify-center">
                <CheckCircle className="w-5 h-5 text-emerald-600" />
              </div>
            </div>
            <p className="text-2xl font-bold text-gray-900">{completedCount}</p>
            <p className="text-sm text-gray-500">Completed</p>
          </Link>

          <Link href="/customer/wallet" className="bg-white rounded-xl p-4 border border-gray-100 shadow-sm hover:shadow-md hover:border-emerald-200 transition-all">
            <div className="flex items-center gap-3 mb-2">
              <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                <Wallet className="w-5 h-5 text-blue-600" />
              </div>
            </div>
            <p className="text-2xl font-bold text-gray-900">₹{wallet?.available_balance || 0}</p>
            <p className="text-sm text-gray-500">Wallet</p>
          </Link>
        </div>

        {/* Recent Activity */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-bold text-gray-900">Recent Activity</h2>
            <Link href="/customer/requests" className="text-emerald-600 text-sm font-semibold hover:text-emerald-700 flex items-center gap-1">
              View all <ChevronRight className="w-4 h-4" />
            </Link>
          </div>

          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
            {requests.length > 0 ? (
              <div className="divide-y divide-gray-100">
                {requests.slice(0, 4).map((req) => (
                  <Link
                    key={req.id}
                    href={`/customer/requests/${req.id}`}
                    className="flex items-center justify-between p-4 hover:bg-gray-50 transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                        req.status === 'completed' ? 'bg-emerald-100' : req.status === 'in_progress' ? 'bg-blue-100' : 'bg-amber-100'
                      }`}>
                        {req.status === 'completed' ? (
                          <CheckCircle className="w-5 h-5 text-emerald-600" />
                        ) : req.status === 'in_progress' ? (
                          <Clock className="w-5 h-5 text-blue-600" />
                        ) : (
                          <Sparkles className="w-5 h-5 text-amber-600" />
                        )}
                      </div>
                      <div>
                        <p className="font-semibold text-gray-900">{req.title}</p>
                        <p className="text-sm text-gray-500">
                          {new Date(req.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                          {req.city && ` · ${req.city}`}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className={`text-xs font-semibold px-2 py-1 rounded-full ${
                        req.status === 'completed' ? 'bg-emerald-100 text-emerald-700' : 
                        req.status === 'in_progress' ? 'bg-blue-100 text-blue-700' : 'bg-amber-100 text-amber-700'
                      }`}>
                        {req.status === 'completed' ? 'Done' : req.status === 'in_progress' ? 'Active' : 'Open'}
                      </span>
                      <ChevronRight className="w-5 h-5 text-gray-400" />
                    </div>
                  </Link>
                ))}
              </div>
            ) : (
              <div className="p-12 text-center">
                <div className="w-16 h-16 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Sparkles className="w-8 h-8 text-emerald-600" />
                </div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">No requests yet</h3>
                <p className="text-gray-500 mb-4">Book your first service today!</p>
                <Button asChild className="bg-emerald-600 hover:bg-emerald-700">
                  <Link href="/customer/requests/ai" className="flex items-center gap-2">
                    <Plus className="w-4 h-4" /> Create Request
                  </Link>
                </Button>
              </div>
            )}
          </div>
        </div>

        {/* Trust Banner */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-6">
            <div className="text-center sm:text-left">
              <p className="text-emerald-600 font-semibold text-sm mb-1">✨ Trusted by 50,000+ Indians</p>
              <h3 className="text-xl font-bold text-gray-900">Book with confidence</h3>
            </div>
            <div className="flex items-center gap-8">
              <div className="text-center">
                <div className="flex items-center justify-center gap-1 mb-1">
                  <Shield className="w-5 h-5 text-emerald-600" />
                  <span className="text-xl font-bold text-gray-900">100%</span>
                </div>
                <p className="text-xs text-gray-500">Verified</p>
              </div>
              <div className="text-center">
                <div className="flex items-center justify-center gap-1 mb-1">
                  <Star className="w-5 h-5 text-amber-500" />
                  <span className="text-xl font-bold text-gray-900">4.9</span>
                </div>
                <p className="text-xs text-gray-500">Rating</p>
              </div>
              <div className="text-center">
                <div className="flex items-center justify-center gap-1 mb-1">
                  <Zap className="w-5 h-5 text-blue-600" />
                  <span className="text-xl font-bold text-gray-900">30m</span>
                </div>
                <p className="text-xs text-gray-500">Response</p>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}
