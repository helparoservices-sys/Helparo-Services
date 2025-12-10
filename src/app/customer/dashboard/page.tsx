import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import dynamic from 'next/dynamic'
import Image from 'next/image'
import { 
  Search, 
  Plus, 
  CheckCircle,
  Clock,
  ArrowRight,
  MapPin,
  MessageSquare,
  Eye,
  Sparkles,
  Zap,
  Shield,
  Star,
  Calendar,
  ChevronRight,
  Wrench,
  Paintbrush,
  Truck,
  Plug,
  Home,
  Droplets,
  Wind,
  Camera,
  Gift
} from 'lucide-react'

const EmergencySOSButton = dynamic(() => import('@/components/emergency-sos-button'), { ssr: false })

export default async function CustomerDashboard() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  
  if (!user) {
    redirect('/auth/login')
  }

  // Check if phone is verified
  const { data: userProfile } = await supabase
    .from('profiles')
    .select('phone, phone_verified')
    .eq('id', user.id)
    .single()

  if (!userProfile?.phone || !userProfile?.phone_verified) {
    redirect('/auth/complete-profile')
  }

  // Fetch user data
  const { data: profile } = await supabase
    .from('profiles')
    .select('full_name, avatar_url')
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
  const { data: requests } = await supabase
    .from('service_requests')
    .select('id, title, status, created_at, city')
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

  const firstName = profile?.full_name?.split(' ')[0] || 'there'
  const greeting = getGreeting()

  function getGreeting() {
    const hour = new Date().getHours()
    if (hour < 12) return 'Good morning'
    if (hour < 17) return 'Good afternoon'
    return 'Good evening'
  }

  const services = [
    { name: 'Plumber', icon: Droplets, color: 'bg-blue-500', href: '/services/plumber' },
    { name: 'Electrician', icon: Plug, color: 'bg-amber-500', href: '/services/electrician' },
    { name: 'Carpenter', icon: Wrench, color: 'bg-orange-600', href: '/services/carpenter' },
    { name: 'Painter', icon: Paintbrush, color: 'bg-pink-500', href: '/services/painter' },
    { name: 'AC Repair', icon: Wind, color: 'bg-cyan-500', href: '/services/ac-repair' },
    { name: 'Cleaning', icon: Home, color: 'bg-emerald-500', href: '/services/cleaning' },
    { name: 'Movers', icon: Truck, color: 'bg-purple-500', href: '/services/movers' },
    { name: 'More', icon: Plus, color: 'bg-gray-600', href: '/services' },
  ]

  return (
    <div className="min-h-screen bg-white">
      {/* Clean Header */}
      <div className="bg-white border-b border-gray-100 sticky top-0 z-50">
        <div className="max-w-6xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            {/* Logo & Greeting */}
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 bg-emerald-500 rounded-xl flex items-center justify-center">
                <span className="text-white font-bold text-lg">H</span>
              </div>
              <div>
                <p className="text-xs text-gray-500 font-medium">{greeting}</p>
                <h1 className="text-lg font-bold text-gray-900">{firstName}</h1>
              </div>
            </div>
            
            {/* Right Actions */}
            <div className="flex items-center gap-3">
              <Link 
                href="/customer/wallet" 
                className="flex items-center gap-2 bg-emerald-50 text-emerald-700 px-3 py-2 rounded-xl hover:bg-emerald-100 transition-colors"
              >
                <Gift className="h-4 w-4" />
                <span className="font-semibold text-sm">₹{wallet?.available_balance || 0}</span>
              </Link>
              <Link href="/customer/profile" className="relative">
                <div className="h-10 w-10 rounded-full bg-gray-100 overflow-hidden border-2 border-gray-200">
                  {profile?.avatar_url ? (
                    <Image 
                      src={profile.avatar_url} 
                      alt={firstName} 
                      width={40} 
                      height={40}
                      className="object-cover w-full h-full"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center bg-emerald-500 text-white font-bold">
                      {firstName.charAt(0).toUpperCase()}
                    </div>
                  )}
                </div>
                <div className="absolute -bottom-0.5 -right-0.5 h-4 w-4 bg-emerald-500 rounded-full border-2 border-white flex items-center justify-center">
                  <CheckCircle className="h-2.5 w-2.5 text-white" />
                </div>
              </Link>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 py-6">
        {/* Main Heading */}
        <div className="mb-5">
          <h2 className="text-xl font-bold text-gray-900">What do you need help with?</h2>
          <p className="text-gray-500 text-sm">Choose how you want to find help</p>
        </div>

        {/* Two Main Options - 60/40 Priority */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
          {/* AI Smart Request - 60% Priority (slightly more prominent) */}
          <Link 
            href="/customer/requests/ai"
            className="relative bg-gradient-to-br from-emerald-500 via-emerald-600 to-teal-600 rounded-2xl p-5 overflow-hidden group hover:shadow-xl hover:shadow-emerald-500/20 transition-all"
          >
            {/* Decorative */}
            <div className="absolute right-0 top-0 w-24 h-24 bg-white/10 rounded-full -translate-y-1/2 translate-x-1/4"></div>
            <div className="absolute right-8 bottom-0 w-16 h-16 bg-white/10 rounded-full translate-y-1/2"></div>
            
            <div className="relative z-10">
              {/* Badge */}
              <div className="inline-flex items-center gap-1.5 bg-amber-400 text-amber-900 text-xs font-bold px-2.5 py-1 rounded-full mb-3">
                <Zap className="h-3 w-3" />
                RECOMMENDED
              </div>
              
              <div className="flex items-start gap-3 mb-3">
                <div className="h-12 w-12 bg-white/20 backdrop-blur-sm rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform">
                  <Camera className="h-6 w-6 text-white" />
                </div>
                <div className="flex-1">
                  <h3 className="text-lg font-bold text-white">AI Smart Request</h3>
                  <p className="text-emerald-100 text-xs mt-0.5">Instant pricing • Auto-match helpers</p>
                </div>
              </div>
              
              <p className="text-emerald-50 text-sm mb-4">
                Snap a photo, describe your issue, and get <span className="font-semibold text-amber-300">instant AI quotes</span> in seconds!
              </p>
              
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4 text-xs text-emerald-100">
                  <span className="flex items-center gap-1"><Sparkles className="h-3 w-3" /> AI Pricing</span>
                  <span className="flex items-center gap-1"><Clock className="h-3 w-3" /> 30 sec</span>
                </div>
                <div className="flex items-center gap-2 bg-white text-emerald-600 font-bold px-4 py-2 rounded-xl shadow-lg group-hover:gap-3 transition-all text-sm">
                  Try Now
                  <ArrowRight className="h-4 w-4" />
                </div>
              </div>
            </div>
          </Link>

          {/* Get Quotes / Bidding - 40% Priority (still prominent!) */}
          <Link 
            href="/customer/requests/new"
            className="relative bg-white border-2 border-gray-200 hover:border-emerald-300 rounded-2xl p-5 overflow-hidden group hover:shadow-xl transition-all"
          >
            {/* Decorative */}
            <div className="absolute right-0 top-0 w-24 h-24 bg-emerald-50 rounded-full -translate-y-1/2 translate-x-1/4"></div>
            
            <div className="relative z-10">
              {/* Badge */}
              <div className="inline-flex items-center gap-1.5 bg-blue-100 text-blue-700 text-xs font-bold px-2.5 py-1 rounded-full mb-3">
                <Star className="h-3 w-3" />
                BEST PRICES
              </div>
              
              <div className="flex items-start gap-3 mb-3">
                <div className="h-12 w-12 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-xl flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform">
                  <Search className="h-6 w-6 text-white" />
                </div>
                <div className="flex-1">
                  <h3 className="text-lg font-bold text-gray-900">Get Multiple Quotes</h3>
                  <p className="text-gray-500 text-xs mt-0.5">Compare bids • Choose your pro</p>
                </div>
              </div>
              
              <p className="text-gray-600 text-sm mb-4">
                Post your request and receive <span className="font-semibold text-blue-600">competitive bids</span> from verified helpers. You choose the best!
              </p>
              
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4 text-xs text-gray-500">
                  <span className="flex items-center gap-1"><Shield className="h-3 w-3" /> Verified</span>
                  <span className="flex items-center gap-1"><CheckCircle className="h-3 w-3" /> 5+ Bids</span>
                </div>
                <div className="flex items-center gap-2 bg-gradient-to-r from-blue-500 to-indigo-600 text-white font-bold px-4 py-2 rounded-xl shadow-lg group-hover:gap-3 transition-all text-sm">
                  Post Request
                  <ArrowRight className="h-4 w-4" />
                </div>
              </div>
            </div>
          </Link>
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-3 gap-3 mb-6">
          <Link 
            href="/customer/bookings?tab=active"
            className="bg-gray-50 hover:bg-gray-100 rounded-xl p-4 transition-colors group text-center"
          >
            <p className="text-2xl font-bold text-gray-900">{activeRequests || 0}</p>
            <p className="text-xs text-gray-500">Active</p>
          </Link>
          
          <Link 
            href="/customer/bookings?tab=completed"
            className="bg-gray-50 hover:bg-gray-100 rounded-xl p-4 transition-colors group text-center"
          >
            <p className="text-2xl font-bold text-gray-900">{completedRequests || 0}</p>
            <p className="text-xs text-gray-500">Completed</p>
          </Link>

          <div className="bg-red-50 hover:bg-red-100 rounded-xl p-4 transition-colors text-center">
            <div className="flex items-center justify-center mb-1">
              <Shield className="h-5 w-5 text-red-500" />
            </div>
            <EmergencySOSButton className="text-xs bg-red-500 hover:bg-red-600 text-white px-3 py-1 rounded-lg font-semibold" />
          </div>
        </div>

        {/* Services Grid */}
        <div className="mb-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-bold text-gray-900">Popular Services</h2>
            <Link href="/services" className="text-emerald-600 text-sm font-semibold flex items-center gap-1 hover:text-emerald-700">
              See all <ChevronRight className="h-4 w-4" />
            </Link>
          </div>
          
          <div className="grid grid-cols-4 gap-3">
            {services.map((service) => (
              <Link 
                key={service.name}
                href={service.href}
                className="flex flex-col items-center gap-2 p-3 bg-gray-50 hover:bg-gray-100 rounded-xl transition-all hover:scale-105 group"
              >
                <div className={`h-12 w-12 ${service.color} rounded-xl flex items-center justify-center shadow-lg group-hover:shadow-xl transition-shadow`}>
                  <service.icon className="h-6 w-6 text-white" />
                </div>
                <span className="text-xs font-medium text-gray-700 text-center">{service.name}</span>
              </Link>
            ))}
          </div>
        </div>

        {/* Recent Activity - Clean List */}
        <div className="bg-white rounded-xl border border-gray-100">
          <div className="flex items-center justify-between p-4 border-b border-gray-100">
            <h2 className="font-bold text-gray-900">Recent Activity</h2>
            <Link href="/customer/requests" className="text-emerald-600 text-sm font-semibold flex items-center gap-1 hover:text-emerald-700">
              View all <ChevronRight className="h-4 w-4" />
            </Link>
          </div>

          {requests && requests.length > 0 ? (
            <div className="divide-y divide-gray-50">
              {requests.slice(0, 4).map((req: any) => (
                <Link
                  key={req.id}
                  href={`/customer/requests/${req.id}`}
                  className="flex items-center justify-between p-4 hover:bg-gray-50 transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <div className={`h-10 w-10 rounded-lg flex items-center justify-center ${
                      req.status === 'completed' 
                        ? 'bg-emerald-100' 
                        : req.status === 'in_progress' 
                          ? 'bg-blue-100' 
                          : 'bg-amber-100'
                    }`}>
                      {req.status === 'completed' ? (
                        <CheckCircle className="h-5 w-5 text-emerald-600" />
                      ) : req.status === 'in_progress' ? (
                        <Clock className="h-5 w-5 text-blue-600" />
                      ) : (
                        <Sparkles className="h-5 w-5 text-amber-600" />
                      )}
                    </div>
                    <div>
                      <p className="font-medium text-gray-900 text-sm">{req.title}</p>
                      <p className="text-xs text-gray-500">
                        {new Date(req.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                        {req.city && ` · ${req.city}`}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className={`text-xs font-medium px-2 py-1 rounded-full ${
                      req.status === 'completed' 
                        ? 'bg-emerald-100 text-emerald-700' 
                        : req.status === 'in_progress' 
                          ? 'bg-blue-100 text-blue-700' 
                          : 'bg-amber-100 text-amber-700'
                    }`}>
                      {req.status === 'completed' ? 'Done' :
                       req.status === 'in_progress' ? 'Active' : 'Open'}
                    </span>
                    <ChevronRight className="h-4 w-4 text-gray-400" />
                  </div>
                </Link>
              ))}
            </div>
          ) : (
            <div className="p-8 text-center">
              <div className="h-16 w-16 bg-gray-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
                <Sparkles className="h-8 w-8 text-gray-400" />
              </div>
              <p className="text-gray-900 font-medium mb-1">No requests yet</p>
              <p className="text-gray-500 text-sm mb-4">Create your first request to get started</p>
              <Link 
                href="/customer/requests/new" 
                className="inline-flex items-center gap-2 bg-emerald-500 hover:bg-emerald-600 text-white font-semibold px-4 py-2 rounded-lg transition-colors"
              >
                <Plus className="h-4 w-4" />
                Create Request
              </Link>
            </div>
          )}
        </div>

        {/* Trust Badges - Bottom */}
        <div className="mt-6 flex items-center justify-center gap-6 py-4">
          <div className="flex items-center gap-2 text-gray-400">
            <Shield className="h-4 w-4" />
            <span className="text-xs font-medium">100% Verified</span>
          </div>
          <div className="w-px h-4 bg-gray-200"></div>
          <div className="flex items-center gap-2 text-gray-400">
            <Star className="h-4 w-4" />
            <span className="text-xs font-medium">4.8★ Rated</span>
          </div>
          <div className="w-px h-4 bg-gray-200"></div>
          <div className="flex items-center gap-2 text-gray-400">
            <Zap className="h-4 w-4" />
            <span className="text-xs font-medium">Fast Response</span>
          </div>
        </div>
      </div>
    </div>
  )
}
