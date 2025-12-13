'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { 
  Gift, 
  Users, 
  Copy, 
  Check, 
  Trophy,
  Crown,
  Share2,
  Target,
  Zap,
  ChevronRight,
  Clock,
  Shield,
  Wrench,
  MessageCircle,
  Info
} from 'lucide-react'
import { toast } from 'sonner'

interface Referral {
  id: string
  referred_user_id: string | null
  referral_code: string
  status: string
  created_at: string
  converted_at: string | null
}

// Reward config - Simple 50 referrals = 1 month free
const REWARD_CONFIG = {
  invitesNeeded: 50,
  rewardDays: 30,
  dailyLimit: 1000, // ₹1000 per day max
  ordersPerDay: 1, // Only 1 order per day
  sameLocationOnly: true,
  minDistanceKm: 25, // Referred user must be at least 25km away
}

export default function CustomerReferralsPage() {
  const supabase = createClient()
  const [referralCode, setReferralCode] = useState('')
  const [referrals, setReferrals] = useState<Referral[]>([])
  const [loading, setLoading] = useState(true)
  const [copied, setCopied] = useState(false)
  const [showTnC, setShowTnC] = useState(false)

  useEffect(() => {
    loadReferralData()
  }, [])

  const loadReferralData = async () => {
    setLoading(true)

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      setLoading(false)
      return
    }

    // Generate referral code from user ID
    const code = `HELP${user.id.substring(0, 8).toUpperCase()}`
    setReferralCode(code)

    // Load referrals
    const { data: refData } = await supabase
      .from('referrals')
      .select('*')
      .eq('referrer_id', user.id)
      .order('created_at', { ascending: false })

    setReferrals(refData || [])
    setLoading(false)
  }

  const copyReferralCode = () => {
    navigator.clipboard.writeText(referralCode)
    setCopied(true)
    toast.success('Referral code copied!')
    setTimeout(() => setCopied(false), 2000)
  }

  const copyReferralLink = () => {
    const link = `${window.location.origin}/auth/signup?ref=${referralCode}`
    navigator.clipboard.writeText(link)
    toast.success('Referral link copied!')
  }

  const shareOnWhatsApp = () => {
    const message = `🎉 Join Helparo - India's fastest home service app! Use my code ${referralCode} to sign up and get amazing services. Download now: ${window.location.origin}/auth/signup?ref=${referralCode}`
    window.open(`https://wa.me/?text=${encodeURIComponent(message)}`, '_blank')
  }

  // Calculate stats
  const totalInvites = referrals.length
  const successfulReferrals = referrals.filter(r => r.status === 'converted' || r.status === 'rewarded').length
  
  // Simple progress calculation
  const progress = successfulReferrals
  const percentage = Math.min((progress / REWARD_CONFIG.invitesNeeded) * 100, 100)
  const isUnlocked = progress >= REWARD_CONFIG.invitesNeeded
  const remaining = Math.max(REWARD_CONFIG.invitesNeeded - progress, 0)

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-600 mx-auto"></div>
          <p className="mt-4 text-slate-600">Loading...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="max-w-4xl mx-auto p-4 space-y-6">
      {/* Hero Header */}
      <div className="relative overflow-hidden bg-gradient-to-br from-emerald-600 via-teal-600 to-cyan-600 rounded-3xl p-8 text-white">
        <div className="absolute inset-0 bg-gradient-to-br from-white/10 to-transparent" />
        <div className="absolute top-0 right-0 w-64 h-64 bg-white/5 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2" />
        
        <div className="relative">
          <div className="flex items-center gap-2 mb-2">
            <Gift className="w-8 h-8" />
            <span className="px-3 py-1 bg-white/20 rounded-full text-xs font-bold">LIMITED TIME OFFER</span>
          </div>
          <h1 className="text-3xl md:text-4xl font-black mb-2">Refer 50 Friends,</h1>
          <h2 className="text-2xl md:text-3xl font-bold text-emerald-100">Get 1 Month FREE! 🎉</h2>
          <p className="text-emerald-100 mt-3 max-w-lg">
            Invite friends from different cities. When 50 friends join & book, enjoy 30 days of free services worth ₹1000/day!
          </p>
          
          {/* Quick limits info */}
          <div className="mt-4 flex flex-wrap gap-2">
            <span className="px-3 py-1.5 bg-white/10 backdrop-blur-sm rounded-lg text-xs">
              💰 ₹1,000/day limit
            </span>
            <span className="px-3 py-1.5 bg-white/10 backdrop-blur-sm rounded-lg text-xs">
              📦 1 order/day
            </span>
            <span className="px-3 py-1.5 bg-white/10 backdrop-blur-sm rounded-lg text-xs">
              📍 Same location only
            </span>
          </div>
        </div>
      </div>

      {/* Progress Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-white rounded-2xl p-4 shadow-md border border-gray-100 text-center">
          <div className="w-12 h-12 mx-auto mb-2 rounded-xl bg-blue-100 flex items-center justify-center">
            <Users className="w-6 h-6 text-blue-600" />
          </div>
          <p className="text-3xl font-black text-gray-900">{totalInvites}</p>
          <p className="text-xs text-gray-500 font-medium">Friends Invited</p>
        </div>
        
        <div className="bg-white rounded-2xl p-4 shadow-md border border-gray-100 text-center">
          <div className="w-12 h-12 mx-auto mb-2 rounded-xl bg-green-100 flex items-center justify-center">
            <Check className="w-6 h-6 text-green-600" />
          </div>
          <p className="text-3xl font-black text-gray-900">{successfulReferrals}</p>
          <p className="text-xs text-gray-500 font-medium">Joined & Booked</p>
        </div>
        
        <div className="bg-white rounded-2xl p-4 shadow-md border border-gray-100 text-center">
          <div className="w-12 h-12 mx-auto mb-2 rounded-xl bg-purple-100 flex items-center justify-center">
            <Target className="w-6 h-6 text-purple-600" />
          </div>
          <p className="text-3xl font-black text-gray-900">{remaining}</p>
          <p className="text-xs text-gray-500 font-medium">More Needed</p>
        </div>
        
        <div className="bg-white rounded-2xl p-4 shadow-md border border-gray-100 text-center">
          <div className="w-12 h-12 mx-auto mb-2 rounded-xl bg-amber-100 flex items-center justify-center">
            <Trophy className="w-6 h-6 text-amber-600" />
          </div>
          <p className="text-3xl font-black text-gray-900">{isUnlocked ? '30' : '0'}</p>
          <p className="text-xs text-gray-500 font-medium">Days Earned</p>
        </div>
      </div>

      {/* Current Progress Card */}
      <div className="bg-white rounded-3xl p-6 shadow-lg border border-gray-100">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-bold text-gray-900">Your Progress to 1 Month FREE</h3>
          <span className={`px-3 py-1 rounded-full text-xs font-bold ${
            isUnlocked ? 'bg-green-100 text-green-700' : 'bg-emerald-100 text-emerald-700'
          }`}>
            {isUnlocked ? '🎉 UNLOCKED!' : `${Math.round(percentage)}% Complete`}
          </span>
        </div>
        
        {/* Progress Bar */}
        <div className="relative h-4 bg-gray-100 rounded-full overflow-hidden mb-4">
          <div 
            className={`absolute inset-y-0 left-0 rounded-full transition-all duration-500 ${
              isUnlocked 
                ? 'bg-gradient-to-r from-green-500 to-emerald-500' 
                : 'bg-gradient-to-r from-emerald-500 to-teal-500'
            }`}
            style={{ width: `${percentage}%` }}
          />
        </div>
        
        <div className="flex justify-between text-xs text-gray-500">
          <span>0</span>
          <span>25</span>
          <span>50 🎯</span>
        </div>
        
        <p className="text-center text-sm text-gray-600 mt-4">
          {isUnlocked ? (
            <span className="text-green-600 font-bold">🎉 Congratulations! You've unlocked 30 days FREE service!</span>
          ) : (
            <>
              <span className="font-bold text-emerald-600">{progress}</span> / 50 referrals completed • 
              <span className="font-bold text-emerald-600"> {remaining} more</span> to unlock 1 month FREE
            </>
          )}
        </p>
      </div>

      {/* The Reward Card */}
      <div className="relative bg-gradient-to-br from-amber-50 via-yellow-50 to-orange-50 rounded-3xl p-6 border-2 border-amber-200 shadow-lg">
        <div className="absolute -top-3 left-1/2 -translate-x-1/2">
          <span className="px-4 py-1.5 bg-gradient-to-r from-amber-500 to-orange-500 text-white text-xs font-bold rounded-full shadow-lg">
            🏆 THE REWARD
          </span>
        </div>
        
        <div className="text-center pt-4">
          <div className="w-20 h-20 mx-auto mb-4 rounded-2xl bg-gradient-to-br from-yellow-400 to-amber-500 flex items-center justify-center shadow-xl">
            <Crown className="w-10 h-10 text-white" />
          </div>
          
          <h3 className="text-2xl font-black text-gray-900 mb-2">1 Month FREE Services</h3>
          <p className="text-4xl font-black text-amber-600 mb-4">Worth ₹30,000</p>
          
          <div className="grid grid-cols-3 gap-3 mb-4">
            <div className="bg-white rounded-xl p-3 shadow-sm">
              <p className="text-xl font-black text-emerald-600">₹1,000</p>
              <p className="text-[10px] text-gray-500 font-medium">Daily Limit</p>
            </div>
            <div className="bg-white rounded-xl p-3 shadow-sm">
              <p className="text-xl font-black text-emerald-600">1</p>
              <p className="text-[10px] text-gray-500 font-medium">Order/Day</p>
            </div>
            <div className="bg-white rounded-xl p-3 shadow-sm">
              <p className="text-xl font-black text-emerald-600">30</p>
              <p className="text-[10px] text-gray-500 font-medium">Days Total</p>
            </div>
          </div>
          
          <p className="text-sm text-gray-600">
            Refer <span className="font-bold text-amber-600">50 friends</span> who sign up & complete their first booking
          </p>
        </div>
      </div>

      {/* Referral Code Card */}
      <div className="bg-gradient-to-br from-indigo-600 via-purple-600 to-pink-600 rounded-3xl p-6 text-white shadow-xl">
        <div className="text-center">
          <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-white/20 backdrop-blur-sm flex items-center justify-center">
            <Share2 className="w-8 h-8" />
          </div>
          <h3 className="text-xl font-bold mb-1">Your Invite Code</h3>
          <p className="text-purple-200 text-sm mb-4">Share this code with friends</p>
          
          <div className="bg-white/20 backdrop-blur-sm rounded-xl p-4 mb-4">
            <div className="flex items-center justify-center gap-3">
              <span className="text-2xl md:text-3xl font-mono font-black tracking-widest">{referralCode}</span>
              <button
                onClick={copyReferralCode}
                className="p-2 hover:bg-white/20 rounded-lg transition-colors"
              >
                {copied ? <Check className="w-5 h-5 text-green-300" /> : <Copy className="w-5 h-5" />}
              </button>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <button
              onClick={shareOnWhatsApp}
              className="flex items-center justify-center gap-2 px-6 py-3 bg-green-500 hover:bg-green-600 rounded-xl font-semibold transition-all shadow-lg"
            >
              <MessageCircle className="w-5 h-5" />
              Share on WhatsApp
            </button>
            <button
              onClick={copyReferralLink}
              className="flex items-center justify-center gap-2 px-6 py-3 bg-white/20 hover:bg-white/30 rounded-xl font-semibold transition-all"
            >
              <Copy className="w-5 h-5" />
              Copy Link
            </button>
          </div>
        </div>
      </div>

      {/* How It Works */}
      <div className="bg-white rounded-3xl p-6 shadow-md border border-gray-100">
        <h3 className="text-xl font-bold text-gray-900 mb-6">How It Works</h3>
        <div className="grid md:grid-cols-3 gap-6">
          <div className="text-center">
            <div className="w-14 h-14 mx-auto mb-3 rounded-2xl bg-blue-100 flex items-center justify-center">
              <Share2 className="w-7 h-7 text-blue-600" />
            </div>
            <div className="w-8 h-8 mx-auto -mt-6 mb-2 rounded-full bg-blue-600 text-white flex items-center justify-center text-sm font-bold">1</div>
            <h4 className="font-bold text-gray-900 mb-1">Share Your Code</h4>
            <p className="text-sm text-gray-500">Send your unique code to friends via WhatsApp, SMS, or social media</p>
          </div>
          
          <div className="text-center">
            <div className="w-14 h-14 mx-auto mb-3 rounded-2xl bg-green-100 flex items-center justify-center">
              <Users className="w-7 h-7 text-green-600" />
            </div>
            <div className="w-8 h-8 mx-auto -mt-6 mb-2 rounded-full bg-green-600 text-white flex items-center justify-center text-sm font-bold">2</div>
            <h4 className="font-bold text-gray-900 mb-1">Friends Join</h4>
            <p className="text-sm text-gray-500">They sign up using your code and book their first service</p>
          </div>
          
          <div className="text-center">
            <div className="w-14 h-14 mx-auto mb-3 rounded-2xl bg-amber-100 flex items-center justify-center">
              <Gift className="w-7 h-7 text-amber-600" />
            </div>
            <div className="w-8 h-8 mx-auto -mt-6 mb-2 rounded-full bg-amber-600 text-white flex items-center justify-center text-sm font-bold">3</div>
            <h4 className="font-bold text-gray-900 mb-1">Unlock Rewards</h4>
            <p className="text-sm text-gray-500">Get FREE service days based on how many friends you invite</p>
          </div>
        </div>
      </div>

      {/* What You Get Section */}
      <div className="bg-gradient-to-br from-emerald-50 to-teal-50 rounded-3xl p-6 border border-emerald-100">
        <h3 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
          <Zap className="w-5 h-5 text-emerald-600" />
          What's Included in Your FREE Month?
        </h3>
        <div className="grid sm:grid-cols-2 gap-3">
          {[
            { icon: Wrench, text: 'Any service category' },
            { icon: Clock, text: '1 order per day max' },
            { icon: Target, text: 'Up to ₹1,000 per order' },
            { icon: Shield, text: 'Same registered address only' },
          ].map((item, idx) => (
            <div key={idx} className="flex items-center gap-3 p-3 bg-white rounded-xl">
              <div className="w-10 h-10 rounded-xl bg-emerald-100 flex items-center justify-center">
                <item.icon className="w-5 h-5 text-emerald-600" />
              </div>
              <span className="font-medium text-gray-700">{item.text}</span>
            </div>
          ))}
        </div>
        
        <div className="mt-4 p-3 bg-amber-50 border border-amber-200 rounded-xl">
          <p className="text-sm text-amber-800 flex items-start gap-2">
            <Info className="w-4 h-4 flex-shrink-0 mt-0.5" />
            <span><strong>Important:</strong> Free service applies only to your registered address. Different locations are not covered.</span>
          </p>
        </div>
      </div>

      {/* Referral History */}
      <div className="bg-white rounded-3xl p-6 shadow-md border border-gray-100">
        <h3 className="text-xl font-bold text-gray-900 mb-4">Invite History</h3>
        
        {referrals.length === 0 ? (
          <div className="text-center py-8">
            <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-gray-100 flex items-center justify-center">
              <Users className="w-8 h-8 text-gray-400" />
            </div>
            <p className="text-gray-500 font-medium">No invites yet</p>
            <p className="text-sm text-gray-400 mt-1">Start sharing your code to earn free services!</p>
          </div>
        ) : (
          <div className="space-y-2">
            {referrals.slice(0, 5).map((ref) => (
              <div key={ref.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-xl">
                <div className="flex items-center gap-3">
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${
                    ref.status === 'rewarded' || ref.status === 'converted' 
                      ? 'bg-green-100' 
                      : 'bg-yellow-100'
                  }`}>
                    {ref.status === 'rewarded' || ref.status === 'converted' 
                      ? <Check className="w-5 h-5 text-green-600" />
                      : <Clock className="w-5 h-5 text-yellow-600" />
                    }
                  </div>
                  <div>
                    <p className="font-medium text-gray-900">
                      {ref.referred_user_id ? 'Friend Joined!' : 'Invite Sent'}
                    </p>
                    <p className="text-xs text-gray-500">
                      {new Date(ref.created_at).toLocaleDateString('en-IN', {
                        day: 'numeric',
                        month: 'short',
                        year: 'numeric'
                      })}
                    </p>
                  </div>
                </div>
                <span className={`px-3 py-1 text-xs font-bold rounded-full ${
                  ref.status === 'rewarded' ? 'bg-green-100 text-green-700' :
                  ref.status === 'converted' ? 'bg-blue-100 text-blue-700' :
                  'bg-yellow-100 text-yellow-700'
                }`}>
                  {ref.status === 'rewarded' ? '✓ Completed' : 
                   ref.status === 'converted' ? 'Joined' : 'Pending'}
                </span>
              </div>
            ))}
            
            {referrals.length > 5 && (
              <button className="w-full py-3 text-sm text-emerald-600 font-semibold hover:bg-emerald-50 rounded-xl transition-colors">
                View all {referrals.length} invites
              </button>
            )}
          </div>
        )}
      </div>

      {/* Terms & Conditions */}
      <div className="bg-gray-50 rounded-2xl p-4 border border-gray-200">
        <button 
          onClick={() => setShowTnC(!showTnC)}
          className="w-full flex items-center justify-between text-sm text-gray-600"
        >
          <span className="flex items-center gap-2">
            <Info className="w-4 h-4" />
            Terms & Conditions (Important - Please Read)
          </span>
          <ChevronRight className={`w-4 h-4 transition-transform ${showTnC ? 'rotate-90' : ''}`} />
        </button>
        
        {showTnC && (
          <div className="mt-4 pt-4 border-t border-gray-200 text-xs text-gray-500 space-y-2">
            <p className="font-bold text-gray-700">Campaign Rules:</p>
            <p>• This referral program is a <strong>limited-time promotional campaign</strong> run by Helparo.</p>
            <p>• <strong>Helparo reserves the absolute right to modify, suspend, cancel, or terminate this campaign at any time without prior notice or liability.</strong></p>
            <p>• No rewards will be honored if the campaign is terminated before completion.</p>
            
            <p className="font-bold text-gray-700 mt-4">Referral Eligibility:</p>
            <p>• <strong>Referred users must be located at least 25 kilometers away from the referrer's registered address.</strong></p>
            <p>• Referred users from the same city, locality, or within 25km radius will NOT be counted.</p>
            <p>• Each referred friend must sign up using your unique referral code AND complete at least one paid booking.</p>
            <p>• Fake, duplicate, or fraudulent accounts will be immediately disqualified and may result in permanent ban.</p>
            <p>• Self-referrals or referrals within the same household are strictly prohibited.</p>
            
            <p className="font-bold text-gray-700 mt-4">Reward Limitations:</p>
            <p>• Free service is limited to <strong>₹1,000 maximum per day</strong> for <strong>30 consecutive days</strong>.</p>
            <p>• Only <strong>1 order per day</strong> is allowed under this offer.</p>
            <p>• Free services are valid <strong>only at your registered address</strong>. Different locations are not covered.</p>
            <p>• Unused daily limits do NOT carry forward to the next day.</p>
            <p>• If service cost exceeds ₹1,000, the balance must be paid by the user.</p>
            <p>• Reward cannot be transferred, exchanged for cash, sold, or combined with other offers.</p>
            
            <p className="font-bold text-gray-700 mt-4">General Terms:</p>
            <p>• Helparo's decision on all matters relating to this program shall be final, binding, and non-contestable.</p>
            <p>• Service availability depends on helper availability in your area.</p>
            <p>• Helparo reserves the right to verify all referrals and may reject any suspicious activity.</p>
            <p>• By participating, you agree to these terms and Helparo's standard Terms of Service.</p>
            <p>• Violation of any terms will result in immediate disqualification without refund or compensation.</p>
            
            <p className="mt-4 text-[10px] text-gray-400 italic">Last updated: December 2024. Helparo may update these terms at any time.</p>
          </div>
        )}
      </div>
    </div>
  )
}
