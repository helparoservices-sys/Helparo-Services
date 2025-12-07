import { createClient } from '@/lib/supabase/server'
import Link from 'next/link'
import dynamic from 'next/dynamic'
import { 
  Search, 
  Plus, 
  Wallet, 
  Star, 
  Gift, 
  TrendingUp,
  CheckCircle,
  Clock,
  ArrowRight,
  MapPin
} from 'lucide-react'

const LocationSelector = dynamic(() => import('@/components/location-selector').then(mod => ({ default: mod.LocationSelector })), { ssr: false })

export default async function CustomerDashboard() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  
  if (!user) {
    return <div>Not authenticated</div>
  }

  // Fetch user data
  const { data: profile } = await supabase
    .from('profiles')
    .select('full_name')
    .eq('id', user.id)
    .single()

  // Fetch wallet balance
  const { data: wallet } = await supabase
    .from('wallet_accounts')
    .select('available_balance, escrow_balance')
    .eq('user_id', user.id)
    .single()

  // Fetch loyalty points
  const { data: loyalty } = await supabase
    .from('loyalty_points')
    .select('points_balance, tier_level')
    .eq('user_id', user.id)
    .single()

  // Fetch recent requests
  const { data: requests, count: totalRequests } = await supabase
    .from('service_requests')
    .select('id, title, status, created_at', { count: 'exact' })
    .eq('customer_id', user.id)
    .order('created_at', { ascending: false })
    .limit(5)

  // Count active requests
  const { count: activeRequests } = await supabase
    .from('service_requests')
    .select('id', { count: 'exact', head: true })
    .eq('customer_id', user.id)
    .in('status', ['open', 'assigned', 'in_progress'])

  const { count: completedRequests } = await supabase
    .from('service_requests')
    .select('id', { count: 'exact', head: true })
    .eq('customer_id', user.id)
    .eq('status', 'completed')

  const firstName = profile?.full_name?.split(' ')[0] || 'Customer'
  const availableBalance = Number(wallet?.available_balance || 0)
  const escrowBalance = Number(wallet?.escrow_balance || 0)
  const loyaltyPoints = loyalty?.points_balance || 0
  const tier = loyalty?.tier_level || 'bronze'

  return (
    <div className="space-y-6">
      {/* Welcome Section with Location */}
      <div className="bg-gradient-to-r from-blue-600 to-indigo-600 rounded-xl p-6 text-white shadow-lg">
        <div className="flex items-start justify-between gap-4">
          <div className="flex-1">
            <h1 className="text-3xl font-bold mb-2">Welcome back, {firstName}!</h1>
            <p className="text-blue-100">Manage your service requests and track your rewards</p>
          </div>
          <LocationSelector />
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white dark:bg-slate-800 rounded-xl p-6 shadow-sm border border-slate-200 dark:border-slate-700">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm text-slate-600 dark:text-slate-400">Wallet Balance</span>
            <Wallet className="h-5 w-5 text-green-600" />
          </div>
          <p className="text-2xl font-bold text-slate-900 dark:text-white">₹{availableBalance.toFixed(2)}</p>
          <p className="text-xs text-slate-500 mt-1">Escrow: ₹{escrowBalance.toFixed(2)}</p>
        </div>

        <div className="bg-white dark:bg-slate-800 rounded-xl p-6 shadow-sm border border-slate-200 dark:border-slate-700">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm text-slate-600 dark:text-slate-400">Loyalty Points</span>
            <Star className="h-5 w-5 text-yellow-600" />
          </div>
          <p className="text-2xl font-bold text-slate-900 dark:text-white">{loyaltyPoints}</p>
          <p className="text-xs text-slate-500 mt-1 capitalize">Tier: {tier}</p>
        </div>

        <div className="bg-white dark:bg-slate-800 rounded-xl p-6 shadow-sm border border-slate-200 dark:border-slate-700">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm text-slate-600 dark:text-slate-400">Active Requests</span>
            <Clock className="h-5 w-5 text-blue-600" />
          </div>
          <p className="text-2xl font-bold text-slate-900 dark:text-white">{activeRequests || 0}</p>
          <p className="text-xs text-slate-500 mt-1">In progress</p>
        </div>

        <div className="bg-white dark:bg-slate-800 rounded-xl p-6 shadow-sm border border-slate-200 dark:border-slate-700">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm text-slate-600 dark:text-slate-400">Completed</span>
            <CheckCircle className="h-5 w-5 text-green-600" />
          </div>
          <p className="text-2xl font-bold text-slate-900 dark:text-white">{completedRequests || 0}</p>
          <p className="text-xs text-slate-500 mt-1">Total jobs done</p>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 w-full">
        <Link 
          href="/customer/requests/ai"
          className="block bg-gradient-to-r from-purple-600 to-teal-600 text-white rounded-xl p-6 shadow-lg hover:shadow-xl transition-all group relative overflow-hidden"
        >
          <div className="absolute top-2 right-2">
            <span className="bg-yellow-400 text-yellow-900 text-xs font-bold px-2 py-1 rounded-full">
              AI ✨
            </span>
          </div>
          <div className="flex items-center gap-3 mb-3">
            <div className="p-2 bg-white/20 rounded-lg">
              <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
              </svg>
            </div>
            <h3 className="text-lg font-semibold">AI Smart Request</h3>
          </div>
          <p className="text-sm text-purple-100 mb-3">Upload photos, get instant AI pricing & notify all helpers</p>
          <div className="flex items-center text-sm font-medium group-hover:gap-2 transition-all">
            Try AI Magic <ArrowRight className="h-4 w-4 ml-1" />
          </div>
        </Link>

        <Link 
          href="/customer/requests/new"
          className="block bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-xl p-6 shadow-lg hover:shadow-xl transition-all group"
        >
          <div className="flex items-center gap-3 mb-3">
            <div className="p-2 bg-white/20 rounded-lg">
              <Search className="h-6 w-6" />
            </div>
            <h3 className="text-lg font-semibold">Get Quotes</h3>
          </div>
          <p className="text-sm text-blue-100 mb-3">Post your requirements and compare quotes from helpers</p>
          <div className="flex items-center text-sm font-medium group-hover:gap-2 transition-all">
            Request Quotes <ArrowRight className="h-4 w-4 ml-1" />
          </div>
        </Link>
      </div>

      {/* Recent Requests */}
      <div className="bg-white dark:bg-slate-800 rounded-xl p-6 shadow-sm border border-slate-200 dark:border-slate-700">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-bold text-slate-900 dark:text-white">Recent Requests</h2>
          <Link href="/customer/requests" className="text-sm text-blue-600 hover:text-blue-700 font-medium flex items-center gap-1">
            View All <ArrowRight className="h-4 w-4" />
          </Link>
        </div>

        {requests && requests.length > 0 ? (
          <div className="space-y-3">
            {requests.map((req: any) => (
              <Link
                key={req.id}
                href={`/customer/requests/${req.id}`}
                className="flex items-center justify-between p-4 bg-slate-50 dark:bg-slate-900/50 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-900 transition-colors"
              >
                <div className="flex-1">
                  <h3 className="font-medium text-slate-900 dark:text-white">{req.title}</h3>
                  <p className="text-sm text-slate-500 dark:text-slate-400">
                    {new Date(req.created_at).toLocaleDateString()}
                  </p>
                </div>
                <span className={`px-3 py-1 text-xs font-medium rounded-full ${
                  req.status === 'completed' ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400' :
                  req.status === 'in_progress' ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400' :
                  req.status === 'assigned' ? 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400' :
                  'bg-slate-100 text-slate-700 dark:bg-slate-700 dark:text-slate-300'
                }`}>
                  {req.status.replace('_', ' ')}
                </span>
              </Link>
            ))}
          </div>
        ) : (
          <div className="text-center py-8 text-slate-500 dark:text-slate-400">
            <p>No service requests yet</p>
            <Link href="/customer/requests/new" className="text-blue-600 hover:underline text-sm mt-2 inline-block">
              Create your first request
            </Link>
          </div>
        )}
      </div>

      {/* Feature Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Link href="/customer/loyalty" className="bg-white dark:bg-slate-800 rounded-xl p-6 shadow-sm border border-slate-200 dark:border-slate-700 hover:shadow-lg transition-all">
          <div className="flex items-center gap-3 mb-2">
            <Star className="h-6 w-6 text-yellow-600" />
            <h3 className="font-semibold text-slate-900 dark:text-white">Loyalty Program</h3>
          </div>
          <p className="text-sm text-slate-600 dark:text-slate-400">Earn points & unlock rewards</p>
        </Link>

        <Link href="/customer/referrals" className="bg-white dark:bg-slate-800 rounded-xl p-6 shadow-sm border border-slate-200 dark:border-slate-700 hover:shadow-lg transition-all">
          <div className="flex items-center gap-3 mb-2">
            <TrendingUp className="h-6 w-6 text-green-600" />
            <h3 className="font-semibold text-slate-900 dark:text-white">Refer & Earn</h3>
          </div>
          <p className="text-sm text-slate-600 dark:text-slate-400">Get rewards for referrals</p>
        </Link>

        <Link href="/customer/promos" className="bg-white dark:bg-slate-800 rounded-xl p-6 shadow-sm border border-slate-200 dark:border-slate-700 hover:shadow-lg transition-all">
          <div className="flex items-center gap-3 mb-2">
            <Gift className="h-6 w-6 text-purple-600" />
            <h3 className="font-semibold text-slate-900 dark:text-white">Promo Codes</h3>
          </div>
          <p className="text-sm text-slate-600 dark:text-slate-400">Apply discounts at checkout</p>
        </Link>

        <Link href="/customer/support" className="bg-white dark:bg-slate-800 rounded-xl p-6 shadow-sm border border-slate-200 dark:border-slate-700 hover:shadow-lg transition-all">
          <div className="flex items-center gap-3 mb-2">
            <Plus className="h-6 w-6 text-blue-600" />
            <h3 className="font-semibold text-slate-900 dark:text-white">Get Support</h3>
          </div>
          <p className="text-sm text-slate-600 dark:text-slate-400">24/7 customer assistance</p>
        </Link>
      </div>
    </div>
  )
}
