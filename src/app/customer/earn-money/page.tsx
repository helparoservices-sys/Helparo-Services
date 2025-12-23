'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { 
  IndianRupee, 
  TrendingUp, 
  Users, 
  Shield, 
  Clock, 
  Star, 
  CheckCircle,
  ArrowRight,
  Sparkles,
  Wallet,
  BadgeCheck,
  Zap,
  Heart,
  Gift,
  Target,
  Award,
  ChevronRight,
  Loader2,
  X,
  AlertTriangle
} from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { supabase } from '@/lib/supabase/client'
import { switchToHelperRole } from '@/app/actions/onboarding'
import { toast } from 'sonner'
import { useStatusBar } from '@/lib/use-status-bar'

interface ServiceCategory {
  id: string
  name: string
  icon: string
  description: string
  children?: ServiceCategory[]
}

// Icon mapping for categories
const iconMap: { [key: string]: React.ElementType } = {
  'Wrench': Zap,
  'Zap': Zap,
  'Sparkles': Sparkles,
  'Truck': TrendingUp,
  'DoorOpen': Shield,
  'Paintbrush': Star,
  'default': CheckCircle
}

const benefits = [
  {
    icon: IndianRupee,
    title: 'Earn ₹15,000-₹50,000/month',
    description: 'Top helpers earn up to ₹50,000+ monthly with consistent work',
    color: 'from-green-500 to-emerald-600'
  },
  {
    icon: Wallet,
    title: 'Zero Commission',
    description: 'Keep 100% of what you earn. No platform fees, no hidden charges!',
    color: 'from-purple-500 to-violet-600'
  },
  {
    icon: Users,
    title: 'No Middlemen',
    description: 'Connect directly with customers. No brokers, no agents!',
    color: 'from-blue-500 to-cyan-600'
  },
  {
    icon: Clock,
    title: 'Instant Payments',
    description: 'Get paid directly to your bank account after each job',
    color: 'from-orange-500 to-red-500'
  },
  {
    icon: Target,
    title: 'Work Your Way',
    description: 'Set your own hours, choose your area, accept jobs you want',
    color: 'from-pink-500 to-rose-600'
  },
  {
    icon: Shield,
    title: 'Full Support',
    description: 'Insurance coverage, 24/7 support, and safety features',
    color: 'from-teal-500 to-cyan-600'
  }
]

const stats = [
  { value: '10,000+', label: 'Active Helpers' },
  { value: '₹2Cr+', label: 'Paid to Helpers' },
  { value: '50,000+', label: 'Jobs Completed' },
  { value: '4.8★', label: 'Average Rating' }
]

const steps = [
  { step: 1, title: 'Quick Sign Up', description: 'Fill basic details & verify your identity' },
  { step: 2, title: 'Add Your Skills', description: 'Select services you can provide' },
  { step: 3, title: 'Start Earning', description: 'Accept nearby jobs & get paid instantly' }
]

export default function EarnMoneyPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [categories, setCategories] = useState<ServiceCategory[]>([])
  const [showConfirmModal, setShowConfirmModal] = useState(false)
  const [switching, setSwitching] = useState(false)
  const [userName, setUserName] = useState('')

  // Dynamic status bar color for this page
  useStatusBar('#059669', 'light')

  useEffect(() => {
    loadData()
  }, [])

  const loadData = async () => {
    setLoading(true)
    try {
      // Load user profile
      const { data: { user } } = await supabase.auth.getUser()
      if (user) {
        const { data: profileData, error: profileError } = await supabase
          .from('profiles')
          .select('full_name')
          .eq('id', user.id)
          .single()
        
        if (!profileError && profileData) {
          const fullName = (profileData as { full_name?: string }).full_name
          if (fullName) {
            setUserName(fullName.split(' ')[0])
          }
        }
      }

      // Load service categories
      const { data: rootCategories } = await supabase
        .from('service_categories')
        .select('id, name, icon, description')
        .is('parent_id', null)
        .eq('is_active', true)
        .order('display_order', { ascending: true })

      setCategories(rootCategories || [])
    } catch (error) {
      console.error('Error loading data:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleBecomeHelper = () => {
    setShowConfirmModal(true)
  }

  const confirmSwitch = async () => {
    setSwitching(true)
    try {
      const result = await switchToHelperRole()

      if ('error' in result && result.error) {
        throw new Error(result.error)
      }

      toast.success('Welcome to Helparo as a Helper! 🎉')
      
      // Redirect to helper onboarding
      router.push('/helper/onboarding')
    } catch (error: any) {
      console.error('Error switching to helper:', error)
      toast.error(error.message || 'Failed to switch. Please try again.')
    } finally {
      setSwitching(false)
      setShowConfirmModal(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-emerald-600" />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-white to-teal-50 dark:from-slate-900 dark:via-slate-900 dark:to-slate-800">
      {/* Hero Section */}
      <div className="relative overflow-hidden bg-gradient-to-r from-emerald-600 via-teal-600 to-cyan-600 text-white">
        {/* Background Pattern */}
        <div className="absolute inset-0 opacity-10">
          <div className="absolute inset-0" style={{ 
            backgroundImage: 'url("data:image/svg+xml,%3Csvg width=\'60\' height=\'60\' viewBox=\'0 0 60 60\' xmlns=\'http://www.w3.org/2000/svg\'%3E%3Cg fill=\'none\' fill-rule=\'evenodd\'%3E%3Cg fill=\'%23ffffff\' fill-opacity=\'0.4\'%3E%3Cpath d=\'M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z\'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")',
          }} />
        </div>
        
        <div className="relative px-4 py-12 md:py-20">
          <div className="max-w-4xl mx-auto text-center">
            {/* Badge */}
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-white/20 backdrop-blur-sm rounded-full mb-6">
              <Sparkles className="h-4 w-4" />
              <span className="text-sm font-medium">Transform Your Skills Into Income</span>
            </div>
            
            <h1 className="text-3xl md:text-5xl font-bold mb-4 leading-tight">
              {userName ? `${userName}, ` : ''}Earn Money with<br />
              <span className="text-yellow-300">Your Skills!</span>
            </h1>
            
            <p className="text-lg md:text-xl text-emerald-100 mb-8 max-w-2xl mx-auto">
              Join 10,000+ skilled professionals earning ₹15,000 - ₹50,000+ monthly. 
              <span className="font-semibold text-white"> Zero commission. Direct payments. Be your own boss!</span>
            </p>

            <Button 
              onClick={handleBecomeHelper}
              size="lg"
              className="bg-yellow-400 hover:bg-yellow-300 text-slate-900 font-bold text-lg px-8 py-6 rounded-xl shadow-2xl shadow-yellow-500/30 transform hover:scale-105 transition-all"
            >
              <IndianRupee className="h-5 w-5 mr-2" />
              Start Earning Now
              <ArrowRight className="h-5 w-5 ml-2" />
            </Button>

            {/* Quick Stats */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-12 max-w-3xl mx-auto">
              {stats.map((stat, idx) => (
                <div key={idx} className="text-center">
                  <div className="text-2xl md:text-3xl font-bold text-yellow-300">{stat.value}</div>
                  <div className="text-sm text-emerald-100">{stat.label}</div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Wave Separator */}
        <div className="absolute bottom-0 left-0 right-0">
          <svg viewBox="0 0 1440 120" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full">
            <path d="M0 120L60 110C120 100 240 80 360 70C480 60 600 60 720 65C840 70 960 80 1080 85C1200 90 1320 90 1380 90L1440 90V120H1380C1320 120 1200 120 1080 120C960 120 840 120 720 120C600 120 480 120 360 120C240 120 120 120 60 120H0Z" 
              fill="currentColor" className="text-emerald-50 dark:text-slate-900"/>
          </svg>
        </div>
      </div>

      <div className="px-4 pb-20 -mt-4 relative z-10">
        <div className="max-w-4xl mx-auto space-y-8">

          {/* Benefits Section */}
          <section>
            <div className="text-center mb-6">
              <h2 className="text-2xl font-bold text-slate-800 dark:text-white mb-2">Why Become a Helper?</h2>
              <p className="text-slate-600 dark:text-slate-400">Maximum earnings, minimum hassle</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {benefits.map((benefit, idx) => {
                const Icon = benefit.icon
                return (
                  <Card key={idx} className="group hover:shadow-lg transition-all duration-300 border-0 bg-white/80 dark:bg-slate-800/80 backdrop-blur-sm">
                    <CardContent className="p-5">
                      <div className="flex items-start gap-4">
                        <div className={`p-3 rounded-xl bg-gradient-to-r ${benefit.color} shrink-0`}>
                          <Icon className="h-6 w-6 text-white" />
                        </div>
                        <div>
                          <h3 className="font-bold text-slate-800 dark:text-white mb-1">{benefit.title}</h3>
                          <p className="text-sm text-slate-600 dark:text-slate-400">{benefit.description}</p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                )
              })}
            </div>
          </section>

          {/* How It Works */}
          <section>
            <div className="text-center mb-6">
              <h2 className="text-2xl font-bold text-slate-800 dark:text-white mb-2">How It Works</h2>
              <p className="text-slate-600 dark:text-slate-400">Get started in 3 simple steps</p>
            </div>

            <Card className="border-0 bg-gradient-to-r from-emerald-500 to-teal-600 text-white overflow-hidden">
              <CardContent className="p-6">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  {steps.map((item, idx) => (
                    <div key={idx} className="text-center relative">
                      <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-white/20 backdrop-blur-sm mb-3">
                        <span className="text-xl font-bold">{item.step}</span>
                      </div>
                      <h3 className="font-bold text-lg mb-1">{item.title}</h3>
                      <p className="text-emerald-100 text-sm">{item.description}</p>
                      
                      {idx < steps.length - 1 && (
                        <ChevronRight className="hidden md:block absolute right-0 top-1/2 -translate-y-1/2 h-6 w-6 text-white/50" />
                      )}
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </section>

          {/* Available Services */}
          <section>
            <div className="text-center mb-6">
              <h2 className="text-2xl font-bold text-slate-800 dark:text-white mb-2">Services You Can Offer</h2>
              <p className="text-slate-600 dark:text-slate-400">Choose from {categories.length}+ service categories</p>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
              {categories.map((category) => {
                const IconComponent = iconMap[category.icon || 'default'] || iconMap['default']
                return (
                  <Card 
                    key={category.id} 
                    className="group hover:shadow-md hover:scale-105 transition-all duration-300 cursor-pointer border-0 bg-white/80 dark:bg-slate-800/80 backdrop-blur-sm"
                  >
                    <CardContent className="p-4 text-center">
                      <div className="w-12 h-12 mx-auto mb-2 rounded-xl bg-gradient-to-r from-emerald-100 to-teal-100 dark:from-emerald-900/30 dark:to-teal-900/30 flex items-center justify-center group-hover:from-emerald-500 group-hover:to-teal-500 transition-all">
                        <IconComponent className="h-6 w-6 text-emerald-600 dark:text-emerald-400 group-hover:text-white transition-colors" />
                      </div>
                      <h3 className="font-semibold text-sm text-slate-800 dark:text-white">{category.name}</h3>
                    </CardContent>
                  </Card>
                )
              })}
            </div>
          </section>

          {/* Success Stories Highlight */}
          <section>
            <Card className="border-0 bg-gradient-to-br from-yellow-400 via-orange-400 to-red-400 text-white overflow-hidden">
              <CardContent className="p-6">
                <div className="flex flex-col md:flex-row items-center gap-6">
                  <div className="flex-1 text-center md:text-left">
                    <div className="inline-flex items-center gap-2 px-3 py-1 bg-white/20 rounded-full text-sm mb-3">
                      <Star className="h-4 w-4" />
                      <span>Top Earner Story</span>
                    </div>
                    <h3 className="text-2xl font-bold mb-2">"I Earn ₹45,000/month Working Part-Time!"</h3>
                    <p className="text-yellow-100 mb-4">
                      "Joined Helparo as an electrician. Now I choose my hours, work near home, 
                      and earn more than my previous full-time job. Best decision ever!"
                    </p>
                    <div className="flex items-center gap-2 justify-center md:justify-start">
                      <Award className="h-5 w-5" />
                      <span className="font-medium">Rajesh K. - Electrician, Bangalore</span>
                    </div>
                  </div>
                  <div className="shrink-0">
                    <div className="text-center">
                      <div className="text-4xl font-bold">₹45K+</div>
                      <div className="text-yellow-100 text-sm">Monthly Earnings</div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </section>

          {/* Final CTA */}
          <section className="text-center pb-8">
            <Card className="border-2 border-emerald-200 dark:border-emerald-800 bg-emerald-50/50 dark:bg-emerald-900/20">
              <CardContent className="p-8">
                <Gift className="h-12 w-12 text-emerald-600 mx-auto mb-4" />
                <h2 className="text-2xl font-bold text-slate-800 dark:text-white mb-2">
                  Ready to Start Earning?
                </h2>
                <p className="text-slate-600 dark:text-slate-400 mb-6 max-w-lg mx-auto">
                  Your skills are valuable. Join thousands of helpers who've transformed their expertise into a thriving income.
                </p>
                <Button 
                  onClick={handleBecomeHelper}
                  size="lg"
                  className="bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white font-bold px-8 py-6 rounded-xl shadow-lg"
                >
                  <BadgeCheck className="h-5 w-5 mr-2" />
                  Become a Helper Now
                  <ArrowRight className="h-5 w-5 ml-2" />
                </Button>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-4">
                  Free to join • No subscription required • Start earning immediately
                </p>
              </CardContent>
            </Card>
          </section>
        </div>
      </div>

      {/* Confirmation Modal */}
      {showConfirmModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <Card className="w-full max-w-md animate-in fade-in zoom-in duration-200">
            <CardContent className="p-6">
              <div className="flex justify-between items-start mb-4">
                <div className="w-12 h-12 rounded-full bg-emerald-100 dark:bg-emerald-900/30 flex items-center justify-center">
                  <AlertTriangle className="h-6 w-6 text-emerald-600" />
                </div>
                <button 
                  onClick={() => setShowConfirmModal(false)}
                  className="p-1 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors"
                >
                  <X className="h-5 w-5 text-slate-500" />
                </button>
              </div>

              <h3 className="text-xl font-bold text-slate-800 dark:text-white mb-2">
                Become a Helper?
              </h3>
              <p className="text-slate-600 dark:text-slate-400 mb-6">
                You're about to switch your account to a Helper account. This will allow you to:
              </p>

              <ul className="space-y-2 mb-6">
                <li className="flex items-center gap-2 text-sm text-slate-700 dark:text-slate-300">
                  <CheckCircle className="h-4 w-4 text-emerald-600" />
                  Receive and accept service requests
                </li>
                <li className="flex items-center gap-2 text-sm text-slate-700 dark:text-slate-300">
                  <CheckCircle className="h-4 w-4 text-emerald-600" />
                  Set your own rates and working hours
                </li>
                <li className="flex items-center gap-2 text-sm text-slate-700 dark:text-slate-300">
                  <CheckCircle className="h-4 w-4 text-emerald-600" />
                  Earn money by providing services
                </li>
              </ul>

              <div className="bg-amber-50 dark:bg-amber-900/20 rounded-lg p-3 mb-6">
                <p className="text-sm text-amber-800 dark:text-amber-200">
                  <strong>Note:</strong> You'll need to complete a quick onboarding process to verify your identity and skills.
                </p>
              </div>

              <div className="flex gap-3">
                <Button
                  variant="outline"
                  onClick={() => setShowConfirmModal(false)}
                  className="flex-1"
                  disabled={switching}
                >
                  Cancel
                </Button>
                <Button
                  onClick={confirmSwitch}
                  disabled={switching}
                  className="flex-1 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white"
                >
                  {switching ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Switching...
                    </>
                  ) : (
                    <>
                      <CheckCircle className="h-4 w-4 mr-2" />
                      Yes, Become Helper
                    </>
                  )}
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  )
}
