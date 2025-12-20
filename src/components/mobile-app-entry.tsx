"use client"

import Link from "next/link"
import { useRouter } from "next/navigation"
import { useEffect, useState } from "react"
import { ArrowRight, Star, Sparkles, Shield, Clock, MapPin, Zap, ChevronRight, CheckCircle2, TrendingUp, Heart, Briefcase, Loader2 } from "lucide-react"
import { createClient } from "@/lib/supabase/client"
import { initializeDeepLinkListener } from "@/lib/capacitor-auth"

// Animated Counter Component
function AnimatedCounter({ value, suffix = "" }: { value: string; suffix?: string }) {
  const [count, setCount] = useState(0)
  const numericValue = parseInt(value.replace(/\D/g, ''))
  
  useEffect(() => {
    const duration = 1500
    const steps = 30
    const increment = numericValue / steps
    let current = 0
    
    const timer = setInterval(() => {
      current += increment
      if (current >= numericValue) {
        setCount(numericValue)
        clearInterval(timer)
      } else {
        setCount(Math.floor(current))
      }
    }, duration / steps)
    
    return () => clearInterval(timer)
  }, [numericValue])
  
  return <span>{count.toLocaleString()}{suffix}</span>
}

// Hook to get user's current city
function useCurrentCity() {
  const [city, setCity] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)

  const saveCity = (value: string) => {
    const cleaned = value?.trim()
    if (!cleaned) return
    setCity(cleaned)
    localStorage.setItem('userCity', cleaned)
    localStorage.setItem('userCityTime', Date.now().toString())
  }

  useEffect(() => {
    // Check if we have cached city in localStorage (valid for 1 hour)
    const cached = localStorage.getItem('userCity')
    const cachedTime = localStorage.getItem('userCityTime')
    
    if (cached && cachedTime && Date.now() - parseInt(cachedTime) < 3600000 && cached !== 'India') {
      setCity(cached)
      setLoading(false)
      return
    }

    // Function to get city from IP using multiple fallback APIs
    const getCityFromIP = async () => {
      try {
        const response = await fetch('https://ipapi.co/json/', { cache: 'no-store' })
        const data = await response.json()
        if (data.city) return data.city
      } catch (e) {
        console.log('ipapi.co failed:', e)
      }

      try {
        const response = await fetch('https://ipinfo.io/json', { cache: 'no-store' })
        const data = await response.json()
        if (data.city) return data.city
      } catch (e) {
        console.log('ipinfo.io failed:', e)
      }

      try {
        const response = await fetch('https://freeipapi.com/api/json', { cache: 'no-store' })
        const data = await response.json()
        if (data.cityName) return data.cityName
      } catch (e) {
        console.log('freeipapi.com failed:', e)
      }

      return null
    }

    // Function to get city from GPS coordinates using server-side Google Geocoding (avoids CSP issues)
    const getCityFromGPS = async (latitude: number, longitude: number) => {
      try {
        const response = await fetch(`/api/geocode?lat=${latitude}&lng=${longitude}`, { cache: 'no-store' })
        if (!response.ok) throw new Error('Geocoding failed')
        const data = await response.json()
        return data.city || data.state || null
      } catch (error) {
        console.error('Reverse geocoding error:', error)
        return null
      }
    }

    // Try GPS first for most accurate, then fall back to IP
    const getLocation = async () => {
      setLoading(true)
      
      // Try GPS first (most accurate)
      if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(
          async (position) => {
            const gpsCity = await getCityFromGPS(position.coords.latitude, position.coords.longitude)
            if (gpsCity) {
              saveCity(gpsCity)
              setLoading(false)
              return
            }
            // If GPS reverse geocoding fails, try IP
            const ipCity = await getCityFromIP()
            if (ipCity) saveCity(ipCity)
            else setCity('Your City')
            setLoading(false)
          },
          async () => {
            // GPS denied/failed, try IP-based location
            const ipCity = await getCityFromIP()
            if (ipCity) saveCity(ipCity)
            else setCity('Your City')
            setLoading(false)
          },
          { timeout: 5000, enableHighAccuracy: false }
        )
      } else {
        // No GPS available, use IP
        const ipCity = await getCityFromIP()
        if (ipCity) saveCity(ipCity)
        else setCity('Your City')
        setLoading(false)
      }
    }

    getLocation()
  }, [])

  return { city, loading }
}

// Floating Service Bubble
function ServiceBubble({ 
  emoji, 
  name, 
  delay, 
  position 
}: { 
  emoji: string
  name: string
  delay: number
  position: { top: string; left?: string; right?: string }
}) {
  return (
    <div 
      className="absolute animate-float"
      style={{ 
        ...position,
        animationDelay: `${delay}ms`,
      }}
    >
      <div className="flex items-center gap-1.5 px-3 py-1.5 bg-white rounded-full shadow-lg border border-gray-100">
        <span className="text-sm">{emoji}</span>
        <span className="text-xs font-semibold text-gray-700">{name}</span>
      </div>
    </div>
  )
}

// Expanded roster for social proof (100 names)
const BOOKING_NAMES = [
  'Rahul','Priya','Amit','Neha','Karan','Ishita','Vikram','Ananya','Rohit','Sneha',
  'Arjun','Meera','Sahil','Kavya','Riya','Aditya','Pooja','Manish','Divya','Harsh',
  'Nikhil','Simran','Varun','Shweta','Yash','Tanvi','Abhishek','Aisha','Gaurav','Anjali',
  'Sanjay','Pallavi','Kunal','Dhruv','Sana','Virat','Radhika','Akash','Tanya','Sumeet',
  'Deepak','Bhavna','Rakesh','Aparna','Lokesh','Muskaan','Parth','Juhi','Sameer','Mitali',
  'Kabir','Natasha','Vivek','Srishti','Rohan','Lavanya','Nitin','Ira','Aayush','Maya',
  'Ritvik','Avni','Pranav','Myra','Saurabh','Ishaan','Komal','Rehan','Aarav','Nandini',
  'Dev','Trisha','Aman','Sukriti','Kartik','Vani','Ansh','Charvi','Hrithik','Ishika',
  'Arnav','Aarohi','Shivam','Jahnvi','Tejas','Mahima','Atharv','Sanya','Hardik','Krupa',
  'Harshit','Chahat','Omkar','Zoya','Pratyush','Vidhi','Samar','Pihu','Aryan','Diya'
]

const BOOKING_SERVICES = [
  'AC Repair','Cleaning','Plumbing','Electrical','Painting','Carpentry','Pest Control','Deep Cleaning','Salon at Home','Laundry'
]

const BOOKING_LOCATIONS = [
  'Koramangala','HSR Layout','Indiranagar','Whitefield','Marathahalli','JP Nagar','BTM Layout','Sarjapur Road','MG Road','Hebbal',
  'Baner','Wakad','Kalyani Nagar','Powai','Andheri','Bandra','Khar','Noida Sector 62','Gurgaon DLF Phase 3','Saket',
  'Connaught Place','Alwarpet','Gachibowli','Kondapur','Banjara Hills','Jubilee Hills','Kukatpally','Anna Nagar','Salt Lake','Park Street'
]

const BOOKING_TIMES = [
  'just now','2m ago','3m ago','4m ago','5m ago','6m ago','8m ago','10m ago','12m ago','15m ago',
  '18m ago','20m ago','22m ago','25m ago','28m ago','30m ago','35m ago','40m ago','45m ago','50m ago'
]

const BOOKING_SAVINGS = ['₹250 saved','₹300 saved','₹350 saved','₹400 saved','₹450 saved','₹500 saved','₹550 saved','₹600 saved','₹650 saved','₹700 saved']

const RECENT_BOOKINGS = BOOKING_NAMES.map((name, idx) => ({
  name,
  service: BOOKING_SERVICES[idx % BOOKING_SERVICES.length],
  time: BOOKING_TIMES[idx % BOOKING_TIMES.length],
  location: BOOKING_LOCATIONS[idx % BOOKING_LOCATIONS.length],
  savings: BOOKING_SAVINGS[idx % BOOKING_SAVINGS.length],
}))

// Live Pulse Indicator
function LivePulse() {
  return (
    <span className="relative flex h-2 w-2">
      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
      <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500"></span>
    </span>
  )
}

// Recent Booking Card
function RecentBooking({ name, service, time, location, savings }: {
  name: string
  service: string
  time: string
  location: string
  savings: string
}) {
  return (
    <div className="flex items-center gap-3 p-3 bg-white/80 backdrop-blur-sm rounded-2xl border border-gray-100 shadow-sm">
      <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-400 to-teal-500 flex items-center justify-center">
        <CheckCircle2 className="w-5 h-5 text-white" />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-bold text-gray-900 truncate">{name} booked {service}</p>
        <p className="text-xs text-gray-500">{location} • {time}</p>
      </div>
      <div className="px-2 py-1 bg-green-100 rounded-lg">
        <span className="text-xs font-bold text-green-600">{savings}</span>
      </div>
    </div>
  )
}

export default function MobileAppEntry() {
  const router = useRouter()
  const [showSplash, setShowSplash] = useState(true)
  const [activeCategory, setActiveCategory] = useState(0)
  const [bookingIndex, setBookingIndex] = useState(0)
  const [checkingAuth, setCheckingAuth] = useState(true)
  const [shouldShowContent, setShouldShowContent] = useState(false)
  const { city, loading: cityLoading } = useCurrentCity()

  const categories = [
    { name: "Cleaning", emoji: "✨", color: "from-blue-500 to-cyan-500", popular: true },
    { name: "Plumbing", emoji: "🔧", color: "from-orange-500 to-amber-500", popular: false },
    { name: "Electrical", emoji: "⚡", color: "from-yellow-500 to-orange-500", popular: true },
    { name: "AC Repair", emoji: "❄️", color: "from-cyan-500 to-blue-500", popular: false },
    { name: "Painting", emoji: "🎨", color: "from-pink-500 to-rose-500", popular: false },
    { name: "Carpentry", emoji: "🪚", color: "from-amber-500 to-yellow-600", popular: false },
  ]

  const recentBookings = RECENT_BOOKINGS

  // Check if user is logged in and redirect to dashboard - MUST run first
  useEffect(() => {
    // Initialize deep link listener for OAuth callbacks
    initializeDeepLinkListener()
    
    const checkAuth = async () => {
      try {
        const supabase = createClient()
        const { data: { user } } = await supabase.auth.getUser()
        
        if (user) {
          // User is logged in, check their role
          const { data: profile } = await supabase
            .from('profiles')
            .select('role')
            .eq('id', user.id)
            .single()
          
          if (profile?.role === 'helper') {
            router.replace('/helper/dashboard')
            return // Keep checkingAuth true while redirecting
          } else if (profile?.role === 'customer') {
            router.replace('/customer/dashboard')
            return // Keep checkingAuth true while redirecting
          }
        }
      } catch (error) {
        console.log('Not logged in')
      }
      // Only show content if user is NOT logged in
      setCheckingAuth(false)
      setShouldShowContent(true)
    }
    
    checkAuth()
  }, [router])

  // Only start splash countdown after auth check is done
  useEffect(() => {
    if (shouldShowContent) {
      const timer = setTimeout(() => setShowSplash(false), 1800)
      return () => clearTimeout(timer)
    }
  }, [shouldShowContent])

  useEffect(() => {
    const timer = setInterval(() => {
      setActiveCategory((prev) => (prev + 1) % categories.length)
    }, 2500)
    return () => clearInterval(timer)
  }, [])

  useEffect(() => {
    const timer = setInterval(() => {
      setBookingIndex((prev) => (prev + 1) % recentBookings.length)
    }, 4000)
    return () => clearInterval(timer)
  }, [])

  useEffect(() => {}, [])

  // Show loading while checking authentication
  if (checkingAuth || !shouldShowContent) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-gradient-to-br from-emerald-500 via-emerald-600 to-teal-600">
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute top-20 left-10 w-32 h-32 bg-white/10 rounded-full blur-2xl" />
          <div className="absolute bottom-32 right-10 w-40 h-40 bg-teal-400/20 rounded-full blur-3xl" />
        </div>
        <div className="relative text-center px-8">
          <h1 className="text-5xl font-black text-white tracking-tight mb-4">helparo</h1>
          <div className="h-0.5 w-12 bg-white/40 rounded-full mx-auto mb-4" />
          <p className="text-base font-semibold text-white/90 mb-4">
            India&apos;s 1st Self-Price Platform
          </p>
          <Loader2 className="w-8 h-8 text-white animate-spin mx-auto" />
        </div>
      </div>
    )
  }

  return (
    <div className="relative flex flex-col bg-[#FAFBFC] min-h-screen min-h-[100dvh]">
      {/* Custom Styles */}
      <style jsx global>{`
        @keyframes float {
          0%, 100% { transform: translateY(0px); }
          50% { transform: translateY(-8px); }
        }
        @keyframes slideUp {
          from { opacity: 0; transform: translateY(20px); }
          to { opacity: 1; transform: translateY(0); }
        }
        @keyframes shimmer {
          0% { background-position: -200% 0; }
          100% { background-position: 200% 0; }
        }
        .animate-float {
          animation: float 3s ease-in-out infinite;
        }
        .animate-slideUp {
          animation: slideUp 0.6s ease-out forwards;
        }
        .shimmer-text {
          background: linear-gradient(90deg, #10b981 0%, #14b8a6 25%, #10b981 50%, #14b8a6 75%, #10b981 100%);
          background-size: 200% auto;
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          animation: shimmer 3s linear infinite;
        }
      `}</style>

      {/* Splash Screen */}
      <div
        className={`fixed inset-0 z-50 flex items-center justify-center transition-all duration-700 ${
          showSplash ? 'opacity-100' : 'opacity-0 pointer-events-none'
        }`}
      >
        <div className="absolute inset-0 bg-gradient-to-br from-emerald-500 via-emerald-600 to-teal-600" />
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute top-20 left-10 w-32 h-32 bg-white/10 rounded-full blur-2xl" />
          <div className="absolute bottom-32 right-10 w-40 h-40 bg-teal-400/20 rounded-full blur-3xl" />
        </div>
        
        <div className={`relative text-center px-8 transition-all duration-500 ${showSplash ? 'scale-100' : 'scale-95'}`}>
          <h1 className="text-5xl font-black text-white tracking-tight mb-4">helparo</h1>
          <div className="h-0.5 w-12 bg-white/40 rounded-full mx-auto mb-4" />
          <p className="text-base font-semibold text-white/90 mb-2">
            India&apos;s 1st Self-Price Platform
          </p>
          <p className="text-sm text-white/70 max-w-[240px] mx-auto">
            You set the price. We find the perfect pro.
          </p>
        </div>
      </div>

      {/* Main Content */}
      <div className={`flex-1 flex flex-col transition-all duration-500 ${showSplash ? 'opacity-0 scale-95' : 'opacity-100 scale-100'}`}>
        
        <div className="flex-1 flex flex-col">
          {/* Header */}
          <header className="relative px-5 pt-3 pb-2 flex items-center justify-between" style={{ paddingTop: "max(env(safe-area-inset-top), 12px)" }}>
            <div>
              <h1 className="text-xl font-black text-gray-900 leading-none">helparo</h1>
              <div className="flex items-center gap-1">
                <MapPin className="w-2.5 h-2.5 text-emerald-600" />
                {cityLoading ? (
                  <div className="flex items-center gap-1">
                    <Loader2 className="w-2.5 h-2.5 text-emerald-600 animate-spin" />
                    <span className="text-[10px] font-semibold text-emerald-600">Detecting...</span>
                  </div>
                ) : (
                  <span className="text-[10px] font-semibold text-emerald-600">{city || 'India'}</span>
                )}
              </div>
            </div>
            
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-1 px-2.5 py-1 rounded-full bg-amber-50 border border-amber-200/50">
                <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
                <span className="text-xs font-black text-amber-700">4.9</span>
              </div>
            </div>
          </header>

          {/* Scrollable Content */}
          <div className="flex-1 overflow-y-auto">
          {/* Hero Section */}
          <div className="relative px-5 pt-4 pb-6 overflow-hidden">
            {/* Background Decoration */}
            <div className="absolute top-0 right-0 w-48 h-48 bg-gradient-to-br from-emerald-100/80 to-teal-50/50 rounded-full -translate-y-1/2 translate-x-1/4 blur-2xl" />
            
            {/* Floating Bubbles */}
            <ServiceBubble emoji="⚡" name="Electrical" delay={0} position={{ top: '5%', right: '5%' }} />
            <ServiceBubble emoji="🔧" name="Plumbing" delay={500} position={{ top: '60%', right: '-2%' }} />
            
            <div className="relative">
              {/* Main Headline */}
              <div className="mb-6">
                <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-emerald-100 rounded-full mb-3">
                  <Zap className="w-3 h-3 text-emerald-600" />
                  <span className="text-[10px] font-bold text-emerald-700 uppercase tracking-wide">India&apos;s #1 Home Services</span>
                </div>
                
                <h2 className="text-[28px] sm:text-[32px] leading-[1.1] mb-2 font-black text-gray-900">
                  Book any service,
                  <br />
                  <span className="shimmer-text">name your price</span>
                </h2>

                <p className="text-sm text-gray-500 max-w-[280px]">
                  Get verified pros at your doorstep in under 30 minutes
                </p>
              </div>

              {/* Quick Stats Row */}
              <div className="flex items-center gap-4 mb-6">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-full bg-emerald-100 flex items-center justify-center">
                    <Shield className="w-4 h-4 text-emerald-600" />
                  </div>
                  <div>
                    <p className="text-xs font-bold text-gray-900">100% Verified</p>
                    <p className="text-[10px] text-gray-500">Background checks</p>
                  </div>
                </div>
                <div className="w-px h-8 bg-gray-200" />
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-full bg-amber-100 flex items-center justify-center">
                    <Clock className="w-4 h-4 text-amber-600" />
                  </div>
                  <div>
                    <p className="text-xs font-bold text-gray-900">&lt;30 min</p>
                    <p className="text-[10px] text-gray-500">Avg. arrival</p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Primary CTAs */}
          <div className="px-5 mt-2 mb-5 space-y-3">
            <Link
              href="/auth/signup"
              className="group relative w-full flex items-center justify-center gap-2 overflow-hidden rounded-2xl bg-gradient-to-r from-emerald-500 via-emerald-500 to-teal-500 py-4 shadow-xl shadow-emerald-500/30 active:scale-[0.98] transition-all"
            >
              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/25 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000" />
              <Sparkles className="w-5 h-5 text-white/90" />
              <span className="text-base font-black text-white">Get Started Free</span>
              <ArrowRight className="w-5 h-5 text-white group-hover:translate-x-1 transition-transform" />
            </Link>

            <div className="flex items-center gap-3">
              <Link
                href="/auth/login"
                className="flex-1 flex items-center justify-center py-3 rounded-xl bg-gray-900 hover:bg-gray-800 transition-colors"
              >
                <span className="text-sm font-bold text-white">Log in</span>
              </Link>
              <Link
                href="/auth/signup?role=helper"
                className="flex-1 flex items-center justify-center gap-1.5 py-3 rounded-xl border-2 border-emerald-200 bg-emerald-50 hover:bg-emerald-100 transition-colors"
              >
                <Briefcase className="w-4 h-4 text-emerald-600" />
                <span className="text-sm font-bold text-emerald-700">Earn ₹₹₹</span>
              </Link>
            </div>
          </div>

          {/* Services (compact: horizontal chips; normal: grid) */}
          <div className="px-5 mb-5">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-bold text-gray-900">What do you need?</h3>
              <Link href="/services" className="text-xs font-semibold text-emerald-600 flex items-center gap-0.5">
                View all <ChevronRight className="w-3 h-3" />
              </Link>
            </div>

            <div className="grid grid-cols-3 gap-2">
              {categories.map((cat, i) => (
                <Link
                  key={cat.name}
                  href={`/auth/signup?service=${encodeURIComponent(cat.name)}`}
                  onClick={() => setActiveCategory(i)}
                  className={`relative p-3 rounded-2xl border-2 transition-all duration-300 block text-center ${
                    activeCategory === i
                      ? 'border-emerald-500 bg-gradient-to-br from-emerald-50 to-teal-50 scale-[1.02] shadow-lg shadow-emerald-500/20'
                      : 'border-gray-100 bg-white hover:border-gray-200'
                  }`}
                >
                  {cat.popular && (
                    <div className="absolute -top-1.5 -right-1.5 px-1.5 py-0.5 bg-orange-500 rounded-full">
                      <span className="text-[8px] font-bold text-white">HOT</span>
                    </div>
                  )}
                  <span className="text-2xl mb-1 block">{cat.emoji}</span>
                  <span className={`text-xs font-bold ${activeCategory === i ? 'text-emerald-700' : 'text-gray-700'}`}>
                    {cat.name}
                  </span>
                </Link>
              ))}
            </div>
          </div>

          {/* Social Proof Section */}
          <div className="px-5 mb-5">
            <div className="bg-gradient-to-br from-gray-900 to-gray-800 rounded-2xl p-4 relative overflow-hidden">
              <div className="absolute top-0 right-0 w-24 h-24 bg-emerald-500/20 rounded-full blur-2xl" />
              
              <div className="relative">
                <div className="flex items-center gap-2 mb-3">
                  <LivePulse />
                  <span className="text-[10px] font-bold text-white/70 uppercase tracking-wider">Live on Helparo</span>
                </div>
                
                <div className="grid grid-cols-3 gap-3 mb-4">
                  <div>
                    <p className="text-xl font-black text-white"><AnimatedCounter value="50000" suffix="+" /></p>
                    <p className="text-[10px] text-white/60">Happy Users</p>
                  </div>
                  <div>
                    <p className="text-xl font-black text-emerald-400"><AnimatedCounter value="10000" suffix="+" /></p>
                    <p className="text-[10px] text-white/60">Verified Pros</p>
                  </div>
                  <div>
                    <p className="text-xl font-black text-amber-400"><AnimatedCounter value="50" suffix="+" /></p>
                    <p className="text-[10px] text-white/60">Services</p>
                  </div>
                </div>

                <div className="animate-slideUp" key={bookingIndex}>
                  <RecentBooking {...recentBookings[bookingIndex]} />
                </div>
              </div>
            </div>
          </div>

          {/* Why Helparo */}
          <div className="px-5 mb-4">
            <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-hide">
              {[
                { icon: Heart, text: "Price you set", color: "text-rose-500 bg-rose-50" },
                { icon: Shield, text: "Verified pros", color: "text-emerald-500 bg-emerald-50" },
                { icon: TrendingUp, text: "Best in class", color: "text-blue-500 bg-blue-50" },
              ].map((item, i) => (
                <div key={i} className="flex items-center gap-2 px-3 py-2 bg-white rounded-xl border border-gray-100 flex-shrink-0">
                  <div className={`w-6 h-6 rounded-lg ${item.color.split(' ')[1]} flex items-center justify-center`}>
                    <item.icon className={`w-3 h-3 ${item.color.split(' ')[0]}`} />
                  </div>
                  <span className="text-xs font-semibold text-gray-700 whitespace-nowrap">{item.text}</span>
                </div>
              ))}
            </div>
          </div>
          </div>
        </div>

        {/* CTA row moved above services; bottom space kept simple */}
        <div className="bg-white/95 px-5 pt-2 pb-5 flex-shrink-0" />
      </div>
    </div>
  )
}
