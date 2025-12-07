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
  MapPin,
  MessageSquare,
  Eye,
  StarOff
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
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Link 
          href="/customer/wallet"
          className="bg-white dark:bg-slate-800 rounded-xl p-6 shadow-sm border border-slate-200 dark:border-slate-700 hover:shadow-lg hover:border-green-300 dark:hover:border-green-600 transition-all cursor-pointer group"
        >
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm text-slate-600 dark:text-slate-400 group-hover:text-green-600 dark:group-hover:text-green-400 transition-colors">Wallet Balance</span>
            <Wallet className="h-5 w-5 text-green-600 group-hover:scale-110 transition-transform" />
          </div>
          <p className="text-2xl font-bold text-slate-900 dark:text-white">₹{availableBalance.toFixed(2)}</p>
          <p className="text-xs text-slate-500 mt-1">Escrow: ₹{escrowBalance.toFixed(2)}</p>
        </Link>

        <Link 
          href="/customer/bookings?tab=active"
          className="bg-white dark:bg-slate-800 rounded-xl p-6 shadow-sm border border-slate-200 dark:border-slate-700 hover:shadow-lg hover:border-blue-300 dark:hover:border-blue-600 transition-all cursor-pointer group"
        >
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm text-slate-600 dark:text-slate-400 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">Active Requests</span>
            <Clock className="h-5 w-5 text-blue-600 group-hover:scale-110 transition-transform" />
          </div>
          <p className="text-2xl font-bold text-slate-900 dark:text-white">{activeRequests || 0}</p>
          <p className="text-xs text-slate-500 mt-1">In progress</p>
        </Link>

        <Link 
          href="/customer/bookings?tab=completed"
          className="bg-white dark:bg-slate-800 rounded-xl p-6 shadow-sm border border-slate-200 dark:border-slate-700 hover:shadow-lg hover:border-green-300 dark:hover:border-green-600 transition-all cursor-pointer group"
        >
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm text-slate-600 dark:text-slate-400 group-hover:text-green-600 dark:group-hover:text-green-400 transition-colors">Completed</span>
            <CheckCircle className="h-5 w-5 text-green-600 group-hover:scale-110 transition-transform" />
          </div>
          <p className="text-2xl font-bold text-slate-900 dark:text-white">{completedRequests || 0}</p>
          <p className="text-xs text-slate-500 mt-1">Total jobs done</p>
        </Link>
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 w-full">
        <Link 
          href="/customer/requests/ai"
          className="block bg-gradient-to-br from-purple-600 via-violet-600 to-fuchsia-600 text-white rounded-2xl p-6 shadow-2xl hover:shadow-purple-500/50 transition-all duration-300 group relative overflow-hidden hover:scale-[1.02] transform"
        >
          {/* Animated gradient background */}
          <div className="absolute inset-0 bg-gradient-to-r from-purple-400/20 to-pink-400/20 opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
          
          {/* Sparkle effects */}
          <div className="absolute top-0 right-0 w-32 h-32 bg-yellow-300/10 rounded-full blur-3xl group-hover:bg-yellow-300/20 transition-all duration-500"></div>
          <div className="absolute bottom-0 left-0 w-24 h-24 bg-teal-300/10 rounded-full blur-2xl group-hover:bg-teal-300/20 transition-all duration-500"></div>
          
          <div className="relative z-10">
            <div className="absolute top-0 right-0 flex items-center gap-1">
              <span className="bg-gradient-to-r from-yellow-300 to-yellow-400 text-yellow-900 text-xs font-extrabold px-3 py-1.5 rounded-full shadow-lg animate-pulse flex items-center gap-1">
                <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                  <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                </svg>
                AI MAGIC
              </span>
            </div>
            
            <div className="flex items-start gap-4 mb-4 mt-2">
              <div className="p-3 bg-white/25 backdrop-blur-sm rounded-2xl shadow-lg group-hover:scale-110 group-hover:rotate-6 transition-transform duration-300">
                <svg className="h-8 w-8 text-white drop-shadow-lg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                </svg>
              </div>
              <div className="flex-1">
                <h3 className="text-2xl font-bold mb-1 drop-shadow-md">AI Smart Request</h3>
                <div className="flex items-center gap-2 text-xs font-medium text-purple-100">
                  <span className="bg-white/20 px-2 py-0.5 rounded-full">⚡ Instant</span>
                  <span className="bg-white/20 px-2 py-0.5 rounded-full">🎯 Accurate</span>
                  <span className="bg-white/20 px-2 py-0.5 rounded-full">🚀 Fast</span>
                </div>
              </div>
            </div>
            
            <p className="text-sm text-white/95 mb-4 leading-relaxed font-medium">
              📸 <span className="font-bold">Snap photos</span> → Get <span className="font-bold text-yellow-300">AI-powered pricing</span> in seconds → <span className="font-bold">Notify all helpers</span> instantly! 
            </p>
            
            <div className="flex items-center justify-between">
              <div className="flex flex-col gap-1">
                <span className="text-xs text-purple-100 font-medium">🤖 Powered by Advanced AI</span>
                <span className="text-xs text-purple-100 font-medium">⏱️ Save 10+ minutes per request</span>
              </div>
              <div className="flex items-center gap-2 text-base font-bold bg-white/20 backdrop-blur-sm px-4 py-2 rounded-full group-hover:bg-white/30 group-hover:gap-3 transition-all shadow-lg">
                Try Now <ArrowRight className="h-5 w-5 group-hover:translate-x-1 transition-transform" />
              </div>
            </div>
          </div>
        </Link>

        <Link 
          href="/customer/requests/new"
          className="block bg-gradient-to-br from-blue-600 via-indigo-600 to-blue-700 text-white rounded-2xl p-6 shadow-2xl hover:shadow-blue-500/50 transition-all duration-300 group relative overflow-hidden hover:scale-[1.02] transform"
        >
          {/* Animated gradient background */}
          <div className="absolute inset-0 bg-gradient-to-r from-blue-400/20 to-indigo-400/20 opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
          
          {/* Glow effects */}
          <div className="absolute top-0 right-0 w-32 h-32 bg-cyan-300/10 rounded-full blur-3xl group-hover:bg-cyan-300/20 transition-all duration-500"></div>
          <div className="absolute bottom-0 left-0 w-24 h-24 bg-indigo-300/10 rounded-full blur-2xl group-hover:bg-indigo-300/20 transition-all duration-500"></div>
          
          <div className="relative z-10">
            <div className="absolute top-0 right-0">
              <span className="bg-gradient-to-r from-green-300 to-emerald-400 text-green-900 text-xs font-extrabold px-3 py-1.5 rounded-full shadow-lg flex items-center gap-1">
                <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M6.267 3.455a3.066 3.066 0 001.745-.723 3.066 3.066 0 013.976 0 3.066 3.066 0 001.745.723 3.066 3.066 0 012.812 2.812c.051.643.304 1.254.723 1.745a3.066 3.066 0 010 3.976 3.066 3.066 0 00-.723 1.745 3.066 3.066 0 01-2.812 2.812 3.066 3.066 0 00-1.745.723 3.066 3.066 0 01-3.976 0 3.066 3.066 0 00-1.745-.723 3.066 3.066 0 01-2.812-2.812 3.066 3.066 0 00-.723-1.745 3.066 3.066 0 010-3.976 3.066 3.066 0 00.723-1.745 3.066 3.066 0 012.812-2.812zm7.44 5.252a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
                VERIFIED
              </span>
            </div>
            
            <div className="flex items-start gap-4 mb-4 mt-2">
              <div className="p-3 bg-white/25 backdrop-blur-sm rounded-2xl shadow-lg group-hover:scale-110 group-hover:-rotate-6 transition-transform duration-300">
                <Search className="h-8 w-8 text-white drop-shadow-lg" strokeWidth={2.5} />
              </div>
              <div className="flex-1">
                <h3 className="text-2xl font-bold mb-1 drop-shadow-md">Get Quotes</h3>
                <div className="flex items-center gap-2 text-xs font-medium text-blue-100">
                  <span className="bg-white/20 px-2 py-0.5 rounded-full">💰 Best Prices</span>
                  <span className="bg-white/20 px-2 py-0.5 rounded-full">👥 Multiple Bids</span>
                  <span className="bg-white/20 px-2 py-0.5 rounded-full">✅ Verified</span>
                </div>
              </div>
            </div>
            
            <p className="text-sm text-white/95 mb-4 leading-relaxed font-medium">
              📝 <span className="font-bold">Post your needs</span> → Receive <span className="font-bold text-cyan-300">competitive quotes</span> from verified helpers → <span className="font-bold">Choose the best!</span>
            </p>
            
            <div className="flex items-center justify-between">
              <div className="flex flex-col gap-1">
                <span className="text-xs text-blue-100 font-medium">🎯 Compare prices instantly</span>
                <span className="text-xs text-blue-100 font-medium">💯 100% verified helpers</span>
              </div>
              <div className="flex items-center gap-2 text-base font-bold bg-white/20 backdrop-blur-sm px-4 py-2 rounded-full group-hover:bg-white/30 group-hover:gap-3 transition-all shadow-lg">
                Get Started <ArrowRight className="h-5 w-5 group-hover:translate-x-1 transition-transform" />
              </div>
            </div>
          </div>
        </Link>
      </div>

      {/* Recent Requests */}
      <div className="bg-gradient-to-br from-white to-slate-50 dark:from-slate-800 dark:to-slate-900 rounded-2xl p-6 shadow-lg border border-slate-200 dark:border-slate-700">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-2xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <Clock className="h-6 w-6 text-purple-600" />
              Recent Activity
            </h2>
            <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">Your latest service requests</p>
          </div>
          <Link 
            href="/customer/requests" 
            className="text-sm text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300 font-semibold flex items-center gap-1 bg-blue-50 dark:bg-blue-900/20 px-4 py-2 rounded-full hover:bg-blue-100 dark:hover:bg-blue-900/30 transition-all"
          >
            View All <ArrowRight className="h-4 w-4" />
          </Link>
        </div>

        {requests && requests.length > 0 ? (
          <div className="space-y-3">
            {requests.slice(0, 3).map((req: any) => (
              <div
                key={req.id}
                className="group relative bg-white dark:bg-slate-800 rounded-xl p-5 border-2 border-slate-100 dark:border-slate-700 hover:border-purple-200 dark:hover:border-purple-700 hover:shadow-xl transition-all duration-300"
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1">
                    <div className="flex items-start gap-3 mb-2">
                      <div className={`p-2 rounded-lg ${
                        req.status === 'completed' ? 'bg-green-100 dark:bg-green-900/30' :
                        req.status === 'in_progress' ? 'bg-blue-100 dark:bg-blue-900/30' :
                        req.status === 'assigned' ? 'bg-yellow-100 dark:bg-yellow-900/30' :
                        'bg-slate-100 dark:bg-slate-700'
                      }`}>
                        {req.status === 'completed' ? (
                          <CheckCircle className="h-5 w-5 text-green-600 dark:text-green-400" />
                        ) : req.status === 'in_progress' ? (
                          <Clock className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                        ) : (
                          <Star className="h-5 w-5 text-slate-600 dark:text-slate-400" />
                        )}
                      </div>
                      <div className="flex-1">
                        <h3 className="font-bold text-slate-900 dark:text-white text-lg group-hover:text-purple-600 dark:group-hover:text-purple-400 transition-colors">
                          {req.title}
                        </h3>
                        <div className="flex items-center gap-3 mt-1">
                          <p className="text-sm text-slate-500 dark:text-slate-400 flex items-center gap-1">
                            <Clock className="h-3.5 w-3.5" />
                            {new Date(req.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                          </p>
                          {req.service_address && (
                            <p className="text-xs text-slate-400 dark:text-slate-500 flex items-center gap-1">
                              <MapPin className="h-3 w-3" />
                              {req.city || 'Location'}
                            </p>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="flex flex-col items-end gap-2">
                    <span className={`px-3 py-1.5 text-xs font-bold rounded-full shadow-sm ${
                      req.status === 'completed' ? 'bg-gradient-to-r from-green-500 to-emerald-500 text-white' :
                      req.status === 'in_progress' ? 'bg-gradient-to-r from-blue-500 to-cyan-500 text-white' :
                      req.status === 'assigned' ? 'bg-gradient-to-r from-yellow-400 to-orange-400 text-white' :
                      'bg-gradient-to-r from-slate-400 to-slate-500 text-white'
                    }`}>
                      {req.status === 'completed' ? '✓ Completed' :
                       req.status === 'in_progress' ? '⚡ In Progress' :
                       req.status === 'assigned' ? '👤 Assigned' :
                       req.status.replace('_', ' ')}
                    </span>
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="flex items-center gap-2 mt-4 pt-4 border-t border-slate-100 dark:border-slate-700">
                  {req.status === 'completed' ? (
                    <>
                      <Link
                        href={`/customer/requests/${req.id}/review`}
                        className="flex-1 flex items-center justify-center gap-2 bg-gradient-to-r from-yellow-400 to-orange-500 hover:from-yellow-500 hover:to-orange-600 text-white font-bold py-2.5 px-4 rounded-lg shadow-md hover:shadow-lg transition-all duration-300 group/btn"
                      >
                        <Star className="h-4 w-4 group-hover/btn:scale-110 transition-transform" />
                        Rate Helper
                      </Link>
                      <Link
                        href={`/customer/requests/${req.id}`}
                        className="flex items-center justify-center gap-2 bg-slate-100 hover:bg-slate-200 dark:bg-slate-700 dark:hover:bg-slate-600 text-slate-700 dark:text-slate-200 font-semibold py-2.5 px-4 rounded-lg transition-all"
                      >
                        <Eye className="h-4 w-4" />
                        View
                      </Link>
                    </>
                  ) : req.status === 'in_progress' || req.status === 'assigned' ? (
                    <>
                      <Link
                        href={`/customer/requests/${req.id}/chat`}
                        className="flex-1 flex items-center justify-center gap-2 bg-gradient-to-r from-blue-500 to-cyan-500 hover:from-blue-600 hover:to-cyan-600 text-white font-bold py-2.5 px-4 rounded-lg shadow-md hover:shadow-lg transition-all duration-300"
                      >
                        <MessageSquare className="h-4 w-4" />
                        Chat with Helper
                      </Link>
                      <Link
                        href={`/customer/requests/${req.id}`}
                        className="flex items-center justify-center gap-2 bg-slate-100 hover:bg-slate-200 dark:bg-slate-700 dark:hover:bg-slate-600 text-slate-700 dark:text-slate-200 font-semibold py-2.5 px-4 rounded-lg transition-all"
                      >
                        <Eye className="h-4 w-4" />
                        Track
                      </Link>
                    </>
                  ) : (
                    <Link
                      href={`/customer/requests/${req.id}`}
                      className="flex-1 flex items-center justify-center gap-2 bg-gradient-to-r from-purple-500 to-indigo-500 hover:from-purple-600 hover:to-indigo-600 text-white font-bold py-2.5 px-4 rounded-lg shadow-md hover:shadow-lg transition-all duration-300"
                    >
                      <Eye className="h-4 w-4" />
                      View Details
                    </Link>
                  )}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-12 bg-gradient-to-br from-slate-50 to-white dark:from-slate-900 dark:to-slate-800 rounded-xl border-2 border-dashed border-slate-200 dark:border-slate-700">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-purple-100 dark:bg-purple-900/30 rounded-full mb-4">
              <StarOff className="h-8 w-8 text-purple-600 dark:text-purple-400" />
            </div>
            <p className="text-lg font-semibold text-slate-700 dark:text-slate-300 mb-2">No service requests yet</p>
            <p className="text-sm text-slate-500 dark:text-slate-400 mb-4">Start by creating your first request!</p>
            <Link 
              href="/customer/requests/new" 
              className="inline-flex items-center gap-2 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white font-bold px-6 py-3 rounded-lg shadow-lg hover:shadow-xl transition-all"
            >
              <Plus className="h-5 w-5" />
              Create Request
            </Link>
          </div>
        )}
      </div>
    </div>
  )
}
