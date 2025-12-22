'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import Link from 'next/link'
import { 
  Award, 
  Trophy, 
  Target, 
  Star, 
  Lock, 
  CheckCircle, 
  Sparkles,
  Home,
  Zap,
  Heart,
  Users,
  Flame,
  Crown,
  Gift,
  Clock,
  MessageCircle,
  Calendar,
  Rocket,
  ArrowRight
} from 'lucide-react'
import { Button } from '@/components/ui/button'

// Badge Category Configuration - Ola Style
const BADGE_CATEGORIES = [
  {
    id: 'first_steps',
    name: 'First Steps',
    description: 'Begin your Helparo journey',
    icon: Rocket,
    gradient: 'from-blue-500 to-cyan-400',
    bgLight: 'bg-blue-50',
    textColor: 'text-blue-600',
    badges: [
      { id: 'first_booking', name: 'First Booking', description: 'Complete your first service booking', icon: '🎉', requirement: 1, type: 'bookings' },
      { id: 'profile_complete', name: 'Profile Pro', description: 'Complete your profile 100%', icon: '✨', requirement: 1, type: 'profile' },
      { id: 'first_review', name: 'Voice Heard', description: 'Leave your first review', icon: '💬', requirement: 1, type: 'reviews' },
    ]
  },
  {
    id: 'bookings',
    name: 'Bookings',
    description: 'Track your service milestones',
    icon: Calendar,
    gradient: 'from-emerald-500 to-teal-400',
    bgLight: 'bg-emerald-50',
    textColor: 'text-emerald-600',
    badges: [
      { id: 'booking_5', name: 'Getting Started', description: 'Complete 5 bookings', icon: '🌱', requirement: 5, type: 'bookings' },
      { id: 'booking_10', name: 'Regular', description: 'Complete 10 bookings', icon: '🌿', requirement: 10, type: 'bookings' },
      { id: 'booking_25', name: 'Frequent User', description: 'Complete 25 bookings', icon: '🌳', requirement: 25, type: 'bookings' },
      { id: 'booking_50', name: 'Power User', description: 'Complete 50 bookings', icon: '🏆', requirement: 50, type: 'bookings' },
      { id: 'booking_100', name: 'Centurion', description: 'Complete 100 bookings', icon: '👑', requirement: 100, type: 'bookings' },
    ]
  },
  {
    id: 'savings',
    name: 'Savings',
    description: 'Smart saver rewards',
    icon: Gift,
    gradient: 'from-amber-500 to-orange-400',
    bgLight: 'bg-amber-50',
    textColor: 'text-amber-600',
    badges: [
      { id: 'save_500', name: 'Smart Saver', description: 'Save ₹500 using offers', icon: '💰', requirement: 500, type: 'savings' },
      { id: 'save_1000', name: 'Deal Hunter', description: 'Save ₹1,000 using offers', icon: '🎯', requirement: 1000, type: 'savings' },
      { id: 'save_2500', name: 'Savings Pro', description: 'Save ₹2,500 using offers', icon: '💎', requirement: 2500, type: 'savings' },
      { id: 'save_5000', name: 'Savings Master', description: 'Save ₹5,000 using offers', icon: '🏅', requirement: 5000, type: 'savings' },
    ]
  },
  {
    id: 'services',
    name: 'Service Explorer',
    description: 'Try different service categories',
    icon: Home,
    gradient: 'from-purple-500 to-pink-400',
    bgLight: 'bg-purple-50',
    textColor: 'text-purple-600',
    badges: [
      { id: 'service_2', name: 'Explorer', description: 'Try 2 different services', icon: '🔍', requirement: 2, type: 'service_types' },
      { id: 'service_4', name: 'Adventurer', description: 'Try 4 different services', icon: '🧭', requirement: 4, type: 'service_types' },
      { id: 'service_6', name: 'Diverse User', description: 'Try 6 different services', icon: '🌈', requirement: 6, type: 'service_types' },
      { id: 'service_all', name: 'All-Rounder', description: 'Try all service categories', icon: '🎪', requirement: 10, type: 'service_types' },
    ]
  },
  {
    id: 'loyalty',
    name: 'Loyalty',
    description: 'Rewards for staying with us',
    icon: Heart,
    gradient: 'from-rose-500 to-pink-400',
    bgLight: 'bg-rose-50',
    textColor: 'text-rose-600',
    badges: [
      { id: 'month_1', name: '1 Month Club', description: 'Be active for 1 month', icon: '📅', requirement: 30, type: 'days_active' },
      { id: 'month_3', name: 'Quarter Champion', description: 'Be active for 3 months', icon: '🗓️', requirement: 90, type: 'days_active' },
      { id: 'month_6', name: 'Half Year Hero', description: 'Be active for 6 months', icon: '⏰', requirement: 180, type: 'days_active' },
      { id: 'year_1', name: 'Annual Star', description: 'Be with us for 1 year', icon: '⭐', requirement: 365, type: 'days_active' },
    ]
  },
  {
    id: 'community',
    name: 'Community',
    description: 'Help grow the Helparo family',
    icon: Users,
    gradient: 'from-indigo-500 to-blue-400',
    bgLight: 'bg-indigo-50',
    textColor: 'text-indigo-600',
    badges: [
      { id: 'refer_1', name: 'Friendly', description: 'Refer 1 friend who joins', icon: '🤝', requirement: 1, type: 'referrals' },
      { id: 'refer_3', name: 'Connector', description: 'Refer 3 friends who join', icon: '🔗', requirement: 3, type: 'referrals' },
      { id: 'refer_5', name: 'Ambassador', description: 'Refer 5 friends who join', icon: '📢', requirement: 5, type: 'referrals' },
      { id: 'refer_10', name: 'Influencer', description: 'Refer 10 friends who join', icon: '🌟', requirement: 10, type: 'referrals' },
    ]
  },
  {
    id: 'reviews',
    name: 'Reviews',
    description: 'Share your experience',
    icon: MessageCircle,
    gradient: 'from-cyan-500 to-teal-400',
    bgLight: 'bg-cyan-50',
    textColor: 'text-cyan-600',
    badges: [
      { id: 'review_3', name: 'Vocal', description: 'Leave 3 reviews', icon: '💬', requirement: 3, type: 'reviews' },
      { id: 'review_10', name: 'Reviewer', description: 'Leave 10 reviews', icon: '📝', requirement: 10, type: 'reviews' },
      { id: 'review_25', name: 'Critic', description: 'Leave 25 reviews', icon: '✍️', requirement: 25, type: 'reviews' },
      { id: 'review_5star', name: '5-Star Giver', description: 'Give 10 five-star ratings', icon: '⭐', requirement: 10, type: 'five_star_reviews' },
    ]
  },
  {
    id: 'special',
    name: 'Special',
    description: 'Exclusive achievements',
    icon: Crown,
    gradient: 'from-yellow-500 to-amber-400',
    bgLight: 'bg-yellow-50',
    textColor: 'text-yellow-600',
    badges: [
      { id: 'early_bird', name: 'Early Bird', description: 'Book a service before 8 AM', icon: '🌅', requirement: 1, type: 'early_booking' },
      { id: 'night_owl', name: 'Night Owl', description: 'Book a service after 10 PM', icon: '🦉', requirement: 1, type: 'late_booking' },
      { id: 'weekend_warrior', name: 'Weekend Warrior', description: 'Book 5 weekend services', icon: '🎊', requirement: 5, type: 'weekend_bookings' },
      { id: 'instant_fan', name: 'Instant Fan', description: 'Use instant booking 3 times', icon: '⚡', requirement: 3, type: 'instant_bookings' },
      { id: 'beta_tester', name: 'Beta Tester', description: 'Early adopter of Helparo', icon: '🧪', requirement: 1, type: 'beta' },
    ]
  },
]

interface UserStats {
  totalBookings: number
  totalSavings: number
  serviceTypes: number
  daysActive: number
  referrals: number
  reviews: number
  fiveStarReviews: number
  earlyBookings: number
  lateBookings: number
  weekendBookings: number
  instantBookings: number
  profileComplete: boolean
  isBetaTester: boolean
}

export default function CustomerBadgesPage() {
  const supabase = createClient()
  const [loading, setLoading] = useState(true)
  const [stats, setStats] = useState<UserStats>({
    totalBookings: 0,
    totalSavings: 0,
    serviceTypes: 0,
    daysActive: 0,
    referrals: 0,
    reviews: 0,
    fiveStarReviews: 0,
    earlyBookings: 0,
    lateBookings: 0,
    weekendBookings: 0,
    instantBookings: 0,
    profileComplete: false,
    isBetaTester: true // Early users get this
  })
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null)

  useEffect(() => {
    loadUserStats()
  }, [])

  const loadUserStats = async () => {
    setLoading(true)
    const { data: { user } } = await supabase.auth.getUser()
    
    if (!user) {
      setLoading(false)
      return
    }

    try {
      // Get completed bookings count
      const { count: bookingsCount } = await supabase
        .from('service_requests')
        .select('*', { count: 'exact', head: true })
        .eq('customer_id', user.id)
        .eq('status', 'completed')

      // Get unique service categories
      const { data: serviceData } = await supabase
        .from('service_requests')
        .select('category')
        .eq('customer_id', user.id)
        .eq('status', 'completed')

      const uniqueServices = new Set(serviceData?.map(s => s.category) || []).size

      // Get referrals count
      const { count: referralsCount } = await supabase
        .from('referrals')
        .select('*', { count: 'exact', head: true })
        .eq('referrer_id', user.id)
        .eq('status', 'converted')

      // Get reviews count
      const { count: reviewsCount } = await supabase
        .from('reviews')
        .select('*', { count: 'exact', head: true })
        .eq('customer_id', user.id)

      // Get 5-star reviews
      const { count: fiveStarCount } = await supabase
        .from('reviews')
        .select('*', { count: 'exact', head: true })
        .eq('customer_id', user.id)
        .eq('rating', 5)

      // Calculate days since signup
      const { data: profile } = await supabase
        .from('profiles')
        .select('created_at, full_name, phone, avatar_url, address')
        .eq('id', user.id)
        .single()

      const daysActive = profile?.created_at 
        ? Math.floor((Date.now() - new Date(profile.created_at).getTime()) / (1000 * 60 * 60 * 24))
        : 0

      const profileComplete = !!(profile?.full_name && profile?.phone && profile?.address)

      setStats({
        totalBookings: bookingsCount || 0,
        totalSavings: 0,
        serviceTypes: uniqueServices,
        daysActive,
        referrals: referralsCount || 0,
        reviews: reviewsCount || 0,
        fiveStarReviews: fiveStarCount || 0,
        earlyBookings: 0,
        lateBookings: 0,
        weekendBookings: 0,
        instantBookings: 0,
        profileComplete,
        isBetaTester: true
      })
    } catch (error) {
      console.error('Error loading stats:', error)
    }

    setLoading(false)
  }

  const getBadgeProgress = (badge: typeof BADGE_CATEGORIES[0]['badges'][0]): { current: number; unlocked: boolean } => {
    let current = 0
    
    switch (badge.type) {
      case 'bookings':
        current = stats.totalBookings
        break
      case 'savings':
        current = stats.totalSavings
        break
      case 'service_types':
        current = stats.serviceTypes
        break
      case 'days_active':
        current = stats.daysActive
        break
      case 'referrals':
        current = stats.referrals
        break
      case 'reviews':
        current = stats.reviews
        break
      case 'five_star_reviews':
        current = stats.fiveStarReviews
        break
      case 'profile':
        current = stats.profileComplete ? 1 : 0
        break
      case 'beta':
        current = stats.isBetaTester ? 1 : 0
        break
      case 'early_booking':
        current = stats.earlyBookings
        break
      case 'late_booking':
        current = stats.lateBookings
        break
      case 'weekend_bookings':
        current = stats.weekendBookings
        break
      case 'instant_bookings':
        current = stats.instantBookings
        break
      default:
        current = 0
    }

    return {
      current,
      unlocked: current >= badge.requirement
    }
  }

  const getTotalUnlocked = () => {
    let total = 0
    let unlocked = 0
    
    BADGE_CATEGORIES.forEach(category => {
      category.badges.forEach(badge => {
        total++
        if (getBadgeProgress(badge).unlocked) unlocked++
      })
    })
    
    return { total, unlocked }
  }

  const getCategoryProgress = (category: typeof BADGE_CATEGORIES[0]) => {
    let unlocked = 0
    category.badges.forEach(badge => {
      if (getBadgeProgress(badge).unlocked) unlocked++
    })
    return { unlocked, total: category.badges.length }
  }

  const { total: totalBadges, unlocked: unlockedBadges } = getTotalUnlocked()

  if (loading) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <div className="text-center">
          <div className="relative">
            <div className="w-20 h-20 rounded-3xl bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center mx-auto shadow-2xl shadow-emerald-500/30 animate-pulse">
              <Trophy className="h-10 w-10 text-white" />
            </div>
          </div>
          <p className="text-gray-600 font-medium mt-6">Loading your achievements...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6 sm:space-y-8 pb-8">
      {/* Hero Header */}
      <div className="relative overflow-hidden rounded-2xl sm:rounded-3xl bg-gradient-to-br from-emerald-600 via-teal-600 to-cyan-600 p-6 sm:p-8 lg:p-10 text-white">
        <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full -translate-y-1/2 translate-x-1/3" />
        <div className="absolute bottom-0 left-0 w-48 h-48 bg-white/5 rounded-full translate-y-1/2 -translate-x-1/4" />
        
        <div className="relative z-10">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
            <div>
              <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-white/20 backdrop-blur-sm rounded-full text-sm font-semibold mb-4">
                <Sparkles className="w-4 h-4" />
                Your Achievement Journey
              </div>
              <h1 className="text-3xl sm:text-4xl lg:text-5xl font-black mb-3">
                Badges & Achievements
              </h1>
              <p className="text-emerald-100 text-base sm:text-lg max-w-xl">
                Complete bookings, explore services, and unlock exclusive badges. Every milestone brings you closer to amazing rewards!
              </p>
            </div>
            
            {/* Progress Circle */}
            <div className="flex-shrink-0">
              <div className="relative w-36 h-36 sm:w-44 sm:h-44">
                <svg className="w-full h-full" viewBox="0 0 100 100">
                  <circle cx="50" cy="50" r="42" fill="none" stroke="rgba(255,255,255,0.2)" strokeWidth="6" />
                  <circle 
                    cx="50" 
                    cy="50" 
                    r="42" 
                    fill="none" 
                    stroke="white" 
                    strokeWidth="6" 
                    strokeLinecap="round" 
                    strokeDasharray={`${(unlockedBadges / totalBadges) * 264} 264`}
                    transform="rotate(-90 50 50)"
                  />
                </svg>
                <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
                  <span className="text-4xl sm:text-5xl font-black leading-none">{unlockedBadges}</span>
                  <span className="text-emerald-200 text-xs sm:text-sm font-medium mt-1">of {totalBadges} badges</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Quick Stats Row */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        <Link href="/customer/bookings" className="bg-white rounded-xl sm:rounded-2xl p-4 sm:p-5 border border-gray-100 shadow-sm hover:shadow-lg hover:border-emerald-200 hover:-translate-y-1 transition-all duration-300 group">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 rounded-xl bg-emerald-100 flex items-center justify-center group-hover:scale-110 transition-transform">
              <CheckCircle className="w-5 h-5 text-emerald-600" />
            </div>
            <span className="text-xs sm:text-sm text-gray-500 font-medium">Bookings</span>
          </div>
          <p className="text-2xl sm:text-3xl font-black text-gray-900">{stats.totalBookings}</p>
        </Link>
        
        <Link href="/services" className="bg-white rounded-xl sm:rounded-2xl p-4 sm:p-5 border border-gray-100 shadow-sm hover:shadow-lg hover:border-purple-200 hover:-translate-y-1 transition-all duration-300 group">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 rounded-xl bg-purple-100 flex items-center justify-center group-hover:scale-110 transition-transform">
              <Home className="w-5 h-5 text-purple-600" />
            </div>
            <span className="text-xs sm:text-sm text-gray-500 font-medium">Services Tried</span>
          </div>
          <p className="text-2xl sm:text-3xl font-black text-gray-900">{stats.serviceTypes}</p>
        </Link>
        
        <Link href="/customer/referrals" className="bg-white rounded-xl sm:rounded-2xl p-4 sm:p-5 border border-gray-100 shadow-sm hover:shadow-lg hover:border-blue-200 hover:-translate-y-1 transition-all duration-300 group">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 rounded-xl bg-blue-100 flex items-center justify-center group-hover:scale-110 transition-transform">
              <Users className="w-5 h-5 text-blue-600" />
            </div>
            <span className="text-xs sm:text-sm text-gray-500 font-medium">Referrals</span>
          </div>
          <p className="text-2xl sm:text-3xl font-black text-gray-900">{stats.referrals}</p>
        </Link>
        
        <Link href="/customer/bookings" className="bg-white rounded-xl sm:rounded-2xl p-4 sm:p-5 border border-gray-100 shadow-sm hover:shadow-lg hover:border-amber-200 hover:-translate-y-1 transition-all duration-300 group">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 rounded-xl bg-amber-100 flex items-center justify-center group-hover:scale-110 transition-transform">
              <Star className="w-5 h-5 text-amber-600" />
            </div>
            <span className="text-xs sm:text-sm text-gray-500 font-medium">Reviews</span>
          </div>
          <p className="text-2xl sm:text-3xl font-black text-gray-900">{stats.reviews}</p>
        </Link>
      </div>

      {/* Motivation Banner */}
      {stats.totalBookings < 5 && (
        <div className="bg-gradient-to-r from-amber-500 to-orange-500 rounded-2xl sm:rounded-3xl p-5 sm:p-6 text-white relative overflow-hidden">
          <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -translate-y-1/2 translate-x-1/2" />
          <div className="relative z-10 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div className="flex items-start gap-4">
              <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center flex-shrink-0">
                <Flame className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-lg sm:text-xl font-bold mb-1">Start Your Journey!</h3>
                <p className="text-amber-100 text-sm">
                  Book {5 - stats.totalBookings} more service{5 - stats.totalBookings > 1 ? 's' : ''} to unlock your first Bookings badge! 🎯
                </p>
              </div>
            </div>
            <Button asChild className="bg-white text-orange-600 hover:bg-orange-50 font-bold shadow-lg whitespace-nowrap">
              <Link href="/customer/requests/ai">
                Book Now <ArrowRight className="w-4 h-4 ml-2" />
              </Link>
            </Button>
          </div>
        </div>
      )}

      {/* Badge Categories Grid */}
      <div>
        <h2 className="text-xl sm:text-2xl font-bold text-gray-900 mb-4 sm:mb-6 flex items-center gap-2">
          <Award className="w-6 h-6 text-emerald-600" />
          Badge Categories
        </h2>
        
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {BADGE_CATEGORIES.map((category) => {
            const { unlocked, total } = getCategoryProgress(category)
            const Icon = category.icon
            
            return (
              <button
                key={category.id}
                onClick={() => setSelectedCategory(selectedCategory === category.id ? null : category.id)}
                className={`bg-white rounded-2xl p-5 border-2 text-left transition-all duration-300 hover:shadow-lg group ${
                  selectedCategory === category.id 
                    ? 'border-emerald-500 shadow-lg shadow-emerald-500/20' 
                    : 'border-gray-100 hover:border-gray-200'
                }`}
              >
                <div className="flex items-start justify-between mb-4">
                  <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${category.gradient} flex items-center justify-center shadow-lg`}>
                    <Icon className="w-6 h-6 text-white" />
                  </div>
                  <div className={`px-2 py-1 rounded-full text-xs font-bold ${category.bgLight} ${category.textColor}`}>
                    {unlocked}/{total}
                  </div>
                </div>
                
                <h3 className="font-bold text-gray-900 mb-1">{category.name}</h3>
                <p className="text-sm text-gray-500 mb-3">{category.description}</p>
                
                <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                  <div className={`h-full bg-gradient-to-r ${category.gradient} transition-all duration-500`} style={{ width: `${(unlocked / total) * 100}%` }} />
                </div>
                
                <div className="flex items-center gap-1 mt-3">
                  {category.badges.slice(0, 4).map((badge) => {
                    const { unlocked: isUnlocked } = getBadgeProgress(badge)
                    return (
                      <div key={badge.id} className={`w-8 h-8 rounded-lg flex items-center justify-center text-base transition-all ${isUnlocked ? 'bg-gray-100' : 'bg-gray-50 grayscale opacity-40'}`}>
                        {badge.icon}
                      </div>
                    )
                  })}
                  {category.badges.length > 4 && (
                    <div className="w-8 h-8 rounded-lg bg-gray-100 flex items-center justify-center text-xs text-gray-500 font-medium">
                      +{category.badges.length - 4}
                    </div>
                  )}
                </div>
              </button>
            )
          })}
        </div>
      </div>

      {/* Expanded Category View */}
      {selectedCategory && (
        <div className="bg-white rounded-2xl sm:rounded-3xl border border-gray-100 shadow-lg overflow-hidden animate-in slide-in-from-top-4 duration-300">
          {(() => {
            const category = BADGE_CATEGORIES.find(c => c.id === selectedCategory)!
            const Icon = category.icon
            
            return (
              <>
                <div className={`bg-gradient-to-r ${category.gradient} p-5 sm:p-6 text-white`}>
                  <div className="flex items-center gap-4">
                    <div className="w-14 h-14 bg-white/20 backdrop-blur-sm rounded-2xl flex items-center justify-center">
                      <Icon className="w-7 h-7" />
                    </div>
                    <div>
                      <h3 className="text-xl sm:text-2xl font-bold">{category.name}</h3>
                      <p className="text-white/80">{category.description}</p>
                    </div>
                  </div>
                </div>
                
                <div className="p-5 sm:p-6">
                  <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
                    {category.badges.map((badge) => {
                      const { current, unlocked } = getBadgeProgress(badge)
                      const progress = Math.min((current / badge.requirement) * 100, 100)
                      
                      return (
                        <div key={badge.id} className={`relative rounded-2xl p-4 text-center transition-all ${unlocked ? 'bg-gradient-to-br from-emerald-50 to-teal-50 border-2 border-emerald-200' : 'bg-gray-50 border-2 border-gray-100'}`}>
                          <div className={`text-4xl sm:text-5xl mb-3 transition-all ${!unlocked && 'grayscale opacity-50'}`}>
                            {badge.icon}
                          </div>
                          
                          <h4 className={`font-bold text-sm mb-1 ${unlocked ? 'text-gray-900' : 'text-gray-500'}`}>
                            {badge.name}
                          </h4>
                          
                          <p className="text-xs text-gray-500 mb-3 line-clamp-2">
                            {badge.description}
                          </p>
                          
                          {unlocked ? (
                            <div className="flex items-center justify-center gap-1 text-emerald-600 text-xs font-semibold">
                              <CheckCircle className="w-3.5 h-3.5" />
                              Unlocked!
                            </div>
                          ) : (
                            <div className="space-y-1.5">
                              <div className="h-1.5 bg-gray-200 rounded-full overflow-hidden">
                                <div className={`h-full bg-gradient-to-r ${category.gradient}`} style={{ width: `${progress}%` }} />
                              </div>
                              <p className="text-xs text-gray-400">{current}/{badge.requirement}</p>
                            </div>
                          )}
                          
                          {!unlocked && (
                            <div className="absolute top-2 right-2">
                              <Lock className="w-3.5 h-3.5 text-gray-300" />
                            </div>
                          )}
                        </div>
                      )
                    })}
                  </div>
                </div>
              </>
            )
          })()}
        </div>
      )}

      {/* Call to Action */}
      <div className="bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 rounded-2xl sm:rounded-3xl p-6 sm:p-8 text-white relative overflow-hidden">
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-0 left-0 w-full h-full" style={{ backgroundImage: 'radial-gradient(circle at 20% 50%, #10b981 0%, transparent 50%), radial-gradient(circle at 80% 50%, #f59e0b 0%, transparent 50%)' }} />
        </div>
        
        <div className="relative z-10 flex flex-col md:flex-row md:items-center md:justify-between gap-6">
          <div>
            <h3 className="text-2xl sm:text-3xl font-black mb-2">Ready to Unlock More? 🚀</h3>
            <p className="text-gray-400 max-w-lg">
              Every booking brings you closer to exclusive badges and rewards. Start exploring services and watch your achievements grow!
            </p>
          </div>
          <div className="flex flex-col sm:flex-row gap-3 shrink-0">
            <Button asChild size="lg" className="bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white shadow-lg shadow-emerald-500/30 whitespace-nowrap">
              <Link href="/customer/requests/ai">
                <Sparkles className="w-4 h-4 mr-2" />
                Book a Service
              </Link>
            </Button>
            <Button asChild size="lg" className="bg-white text-gray-900 hover:bg-gray-100 font-semibold shadow-lg whitespace-nowrap">
              <Link href="/customer/referrals">
                <Users className="w-4 h-4 mr-2" />
                Refer Friends
              </Link>
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}
