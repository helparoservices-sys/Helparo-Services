'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { 
  Users, 
  Copy, 
  Check, 
  Crown,
  Share2,
  Target,
  ChevronRight,
  Briefcase,
  MessageCircle,
  Info,
  BadgeCheck,
  IndianRupee,
  Gift,
  Sparkles,
  Star,
  Zap,
  TrendingUp
} from 'lucide-react'
import { toast } from 'sonner'

interface ReferredHelper {
  id: string
  referred_helper_id: string | null
  referral_code: string
  status: string
  created_at: string
  jobs_completed: number
  helper_name?: string
}

// Reward config
const REWARD_CONFIG = {
  helpersNeeded: 5,
  jobsPerHelper: 5,
  totalJobsNeeded: 25,
  reward: '1 Year 0% Commission',
  rewardDescription: 'No platform fees for 12 months!',
}

export default function HelperReferralsPage() {
  const supabase = createClient()
  const [referralCode, setReferralCode] = useState('')
  const [referrals, setReferrals] = useState<ReferredHelper[]>([])
  const [loading, setLoading] = useState(true)
  const [copied, setCopied] = useState(false)
  const [showTnC, setShowTnC] = useState(false)

  useEffect(() => {
    loadReferralData()
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const loadReferralData = async () => {
    setLoading(true)

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      setLoading(false)
      return
    }

    const code = `HPRO${user.id.substring(0, 6).toUpperCase()}`
    setReferralCode(code)

    const { data: refData } = await supabase
      .from('helper_referrals')
      .select('*')
      .eq('referrer_id', user.id)
      .order('created_at', { ascending: false })

    const mockReferrals: ReferredHelper[] = refData || []
    setReferrals(mockReferrals)
    setLoading(false)
  }

  const copyReferralCode = () => {
    navigator.clipboard.writeText(referralCode)
    setCopied(true)
    toast.success('Referral code copied!')
    setTimeout(() => setCopied(false), 2000)
  }

  const copyReferralLink = () => {
    const link = `https://helparo.in/auth/helper-signup?ref=${referralCode}`
    navigator.clipboard.writeText(link)
    toast.success('Referral link copied!')
  }

  const shareOnWhatsApp = () => {
    const message = `🔧 Join Helparo as a Helper!\n\n✅ Get direct customers\n✅ No commission for new joiners\n✅ Daily payments\n\nUse my code: ${referralCode}\n\nSign up now: https://helparo.in/auth/helper-signup?ref=${referralCode}`
    const encodedMessage = encodeURIComponent(message)
    window.open(`https://wa.me/?text=${encodedMessage}`, '_blank')
  }

  // Calculate stats
  const qualifiedHelpers = referrals.filter(r => r.jobs_completed >= REWARD_CONFIG.jobsPerHelper).length
  const totalJobsFromReferrals = referrals.reduce((sum, r) => sum + (r.jobs_completed || 0), 0)
  const totalHelpers = referrals.length
  
  const helperProgress = Math.min((qualifiedHelpers / REWARD_CONFIG.helpersNeeded) * 100, 100)
  const isUnlocked = qualifiedHelpers >= REWARD_CONFIG.helpersNeeded
  const helpersRemaining = Math.max(REWARD_CONFIG.helpersNeeded - qualifiedHelpers, 0)

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-emerald-600 mx-auto"></div>
          <p className="mt-3 text-slate-600 text-sm">Loading...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-4 px-1 pb-6">
      {/* Hero Header - Emerald Theme */}
      <div className="relative overflow-hidden bg-gradient-to-br from-emerald-500 via-emerald-600 to-teal-700 rounded-2xl p-5 text-white">
        {/* Decorative elements */}
        <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full blur-2xl -translate-y-1/2 translate-x-1/2" />
        <div className="absolute bottom-0 left-0 w-24 h-24 bg-teal-400/20 rounded-full blur-2xl translate-y-1/2 -translate-x-1/2" />
        <div className="absolute top-4 right-4 opacity-20">
          <Sparkles className="w-8 h-8" />
        </div>
        
        <div className="relative">
          <div className="flex items-center gap-2 mb-3">
            <div className="p-1.5 bg-yellow-400/20 rounded-lg">
              <Crown className="w-5 h-5 text-yellow-300" />
            </div>
            <span className="px-2.5 py-1 bg-yellow-400/20 text-yellow-200 rounded-full text-[10px] font-bold tracking-wide">
              HELPER EXCLUSIVE
            </span>
          </div>
          
          <h1 className="text-2xl font-black mb-1 leading-tight">
            Refer 5 Helpers,
            <br />
            <span className="text-emerald-200">Go Commission FREE!</span>
          </h1>
          
          <p className="text-emerald-100 text-xs mt-2 leading-relaxed">
            Invite fellow helpers to join Helparo. When 5 of them complete 5 jobs each, enjoy 1 year of zero commission!
          </p>
          
          {/* Floating badges */}
          <div className="flex flex-wrap gap-1.5 mt-4">
            <span className="px-2.5 py-1 bg-white/15 backdrop-blur-sm rounded-full text-[10px] font-medium flex items-center gap-1">
              <Users className="w-3 h-3" /> 5 Helpers
            </span>
            <span className="px-2.5 py-1 bg-white/15 backdrop-blur-sm rounded-full text-[10px] font-medium flex items-center gap-1">
              <Briefcase className="w-3 h-3" /> 5 Jobs Each
            </span>
            <span className="px-2.5 py-1 bg-white/15 backdrop-blur-sm rounded-full text-[10px] font-medium flex items-center gap-1">
              <Gift className="w-3 h-3" /> 0% Fee
            </span>
          </div>
        </div>
      </div>

      {/* Quick Stats - 2x2 Grid */}
      <div className="grid grid-cols-2 gap-2">
        <div className="bg-white rounded-xl p-3 shadow-sm border border-slate-100">
          <div className="flex items-center gap-2 mb-1.5">
            <div className="p-1.5 bg-emerald-50 rounded-lg">
              <Users className="w-4 h-4 text-emerald-600" />
            </div>
            <span className="text-[10px] text-slate-500 font-medium">Invited</span>
          </div>
          <p className="text-2xl font-black text-slate-900">{totalHelpers}</p>
        </div>
        
        <div className="bg-white rounded-xl p-3 shadow-sm border border-slate-100">
          <div className="flex items-center gap-2 mb-1.5">
            <div className="p-1.5 bg-green-50 rounded-lg">
              <BadgeCheck className="w-4 h-4 text-green-600" />
            </div>
            <span className="text-[10px] text-slate-500 font-medium">Qualified</span>
          </div>
          <p className="text-2xl font-black text-green-600">{qualifiedHelpers}</p>
        </div>
        
        <div className="bg-white rounded-xl p-3 shadow-sm border border-slate-100">
          <div className="flex items-center gap-2 mb-1.5">
            <div className="p-1.5 bg-blue-50 rounded-lg">
              <Briefcase className="w-4 h-4 text-blue-600" />
            </div>
            <span className="text-[10px] text-slate-500 font-medium">Jobs Done</span>
          </div>
          <p className="text-2xl font-black text-slate-900">{totalJobsFromReferrals}</p>
        </div>
        
        <div className="bg-white rounded-xl p-3 shadow-sm border border-slate-100">
          <div className="flex items-center gap-2 mb-1.5">
            <div className="p-1.5 bg-amber-50 rounded-lg">
              <Target className="w-4 h-4 text-amber-600" />
            </div>
            <span className="text-[10px] text-slate-500 font-medium">Need More</span>
          </div>
          <p className="text-2xl font-black text-amber-600">{helpersRemaining}</p>
        </div>
      </div>

      {/* Progress Card */}
      <div className="bg-white rounded-xl p-4 shadow-sm border border-slate-100">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <TrendingUp className="w-4 h-4 text-emerald-600" />
            <h3 className="text-sm font-bold text-slate-900">Your Progress</h3>
          </div>
          <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
            isUnlocked ? 'bg-green-100 text-green-700' : 'bg-emerald-100 text-emerald-700'
          }`}>
            {isUnlocked ? '🎉 UNLOCKED!' : `${qualifiedHelpers}/${REWARD_CONFIG.helpersNeeded}`}
          </span>
        </div>
        
        {/* Progress circles */}
        <div className="flex items-center justify-between mb-4">
          {[1, 2, 3, 4, 5].map((num) => (
            <div key={num} className="flex flex-col items-center">
              <div className={`w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold transition-all ${
                num <= qualifiedHelpers 
                  ? 'bg-gradient-to-br from-emerald-500 to-green-600 text-white shadow-lg shadow-emerald-200' 
                  : 'bg-slate-100 text-slate-400 border-2 border-dashed border-slate-200'
              }`}>
                {num <= qualifiedHelpers ? <Check className="w-5 h-5" /> : num}
              </div>
              <span className="text-[9px] text-slate-500 mt-1">Helper {num}</span>
            </div>
          ))}
        </div>
        
        {/* Progress bar */}
        <div className="relative h-2 bg-slate-100 rounded-full overflow-hidden">
          <div 
            className="absolute inset-y-0 left-0 bg-gradient-to-r from-emerald-500 to-green-500 rounded-full transition-all duration-700"
            style={{ width: `${helperProgress}%` }}
          />
        </div>
        
        <p className="text-center text-xs text-slate-600 mt-3">
          {isUnlocked ? (
            <span className="text-green-600 font-bold flex items-center justify-center gap-1">
              <Sparkles className="w-4 h-4" /> You&apos;ve unlocked 1 Year 0% Commission!
            </span>
          ) : (
            <>
              <span className="font-bold text-emerald-600">{helpersRemaining} more</span> qualified helpers to unlock reward
            </>
          )}
        </p>
      </div>

      {/* The Reward Card - Compact */}
      <div className="relative bg-gradient-to-br from-amber-50 via-yellow-50 to-orange-50 rounded-xl p-4 border border-amber-200/50 overflow-hidden">
        <div className="absolute -top-6 -right-6 w-24 h-24 bg-yellow-300/20 rounded-full blur-2xl" />
        
        <div className="relative flex items-center gap-3">
          <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-yellow-400 to-amber-500 flex items-center justify-center shadow-lg flex-shrink-0">
            <Crown className="w-7 h-7 text-white" />
          </div>
          
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-1.5 mb-0.5">
              <span className="text-[10px] font-bold text-amber-600 bg-amber-100 px-1.5 py-0.5 rounded">REWARD</span>
            </div>
            <p className="text-lg font-black text-slate-900 leading-tight">1 Year 0% Commission</p>
            <p className="text-[10px] text-slate-500 flex items-center gap-1 mt-0.5">
              <IndianRupee className="w-3 h-3" /> Save up to ₹15,000 in fees
            </p>
          </div>
        </div>
      </div>

      {/* Referral Code Card */}
      <div className="bg-gradient-to-br from-emerald-500 to-teal-600 rounded-xl p-4 text-white shadow-lg shadow-emerald-200/50">
        <div className="text-center">
          <div className="w-12 h-12 mx-auto mb-3 rounded-xl bg-white/20 backdrop-blur-sm flex items-center justify-center">
            <Share2 className="w-6 h-6" />
          </div>
          <h3 className="text-base font-bold mb-0.5">Your Referral Code</h3>
          <p className="text-emerald-100 text-[10px] mb-3">Share with fellow helpers</p>
          
          <div className="bg-white/20 backdrop-blur-sm rounded-lg p-3 mb-3">
            <div className="flex items-center justify-center gap-2">
              <span className="text-xl font-mono font-black tracking-widest">{referralCode}</span>
              <button
                onClick={copyReferralCode}
                className="p-1.5 hover:bg-white/20 rounded-lg transition-colors"
              >
                {copied ? <Check className="w-4 h-4 text-green-300" /> : <Copy className="w-4 h-4" />}
              </button>
            </div>
          </div>

          <div className="flex gap-2">
            <button
              onClick={shareOnWhatsApp}
              className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2.5 bg-green-500 hover:bg-green-600 rounded-lg text-xs font-semibold transition-all shadow-lg"
            >
              <MessageCircle className="w-4 h-4" />
              WhatsApp
            </button>
            <button
              onClick={copyReferralLink}
              className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2.5 bg-white/20 hover:bg-white/30 rounded-lg text-xs font-semibold transition-all"
            >
              <Copy className="w-4 h-4" />
              Copy Link
            </button>
          </div>
        </div>
      </div>

      {/* How It Works - Horizontal Steps */}
      <div className="bg-white rounded-xl p-4 shadow-sm border border-slate-100">
        <h3 className="text-sm font-bold text-slate-900 mb-4 flex items-center gap-2">
          <Zap className="w-4 h-4 text-emerald-600" />
          How It Works
        </h3>
        
        <div className="space-y-3">
          {[
            { icon: Share2, color: 'emerald', title: 'Share Code', desc: 'Send to electricians, plumbers, etc.' },
            { icon: Users, color: 'blue', title: 'They Join', desc: 'Helpers sign up & get verified' },
            { icon: Briefcase, color: 'purple', title: '5 Jobs Each', desc: 'Each completes 5 paid jobs' },
            { icon: Crown, color: 'amber', title: 'Go FREE!', desc: '1 year 0% commission unlocked' },
          ].map((step, idx) => (
            <div key={idx} className="flex items-center gap-3">
              <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${
                step.color === 'emerald' ? 'bg-emerald-100' :
                step.color === 'blue' ? 'bg-blue-100' :
                step.color === 'purple' ? 'bg-purple-100' : 'bg-amber-100'
              }`}>
                <step.icon className={`w-5 h-5 ${
                  step.color === 'emerald' ? 'text-emerald-600' :
                  step.color === 'blue' ? 'text-blue-600' :
                  step.color === 'purple' ? 'text-purple-600' : 'text-amber-600'
                }`} />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span className={`w-5 h-5 rounded-full text-white flex items-center justify-center text-[10px] font-bold ${
                    step.color === 'emerald' ? 'bg-emerald-600' :
                    step.color === 'blue' ? 'bg-blue-600' :
                    step.color === 'purple' ? 'bg-purple-600' : 'bg-amber-600'
                  }`}>
                    {idx + 1}
                  </span>
                  <h4 className="text-xs font-bold text-slate-900">{step.title}</h4>
                </div>
                <p className="text-[10px] text-slate-500 mt-0.5 pl-7">{step.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Referred Helpers List */}
      <div className="bg-white rounded-xl p-4 shadow-sm border border-slate-100">
        <h3 className="text-sm font-bold text-slate-900 mb-3 flex items-center gap-2">
          <Star className="w-4 h-4 text-emerald-600" />
          Your Referrals
        </h3>
        
        {referrals.length === 0 ? (
          <div className="text-center py-6">
            <div className="w-12 h-12 mx-auto mb-3 rounded-xl bg-slate-100 flex items-center justify-center">
              <Users className="w-6 h-6 text-slate-400" />
            </div>
            <p className="text-slate-600 font-medium text-sm">No referrals yet</p>
            <p className="text-[10px] text-slate-400 mt-1">Start sharing your code above!</p>
          </div>
        ) : (
          <div className="space-y-2">
            {referrals.map((ref) => (
              <div key={ref.id} className="flex items-center justify-between p-3 bg-slate-50 rounded-lg">
                <div className="flex items-center gap-2.5">
                  <div className={`w-9 h-9 rounded-lg flex items-center justify-center text-sm font-bold text-white ${
                    ref.jobs_completed >= 5 
                      ? 'bg-gradient-to-br from-emerald-500 to-green-600' 
                      : 'bg-gradient-to-br from-slate-400 to-slate-500'
                  }`}>
                    {ref.helper_name?.charAt(0) || 'H'}
                  </div>
                  <div>
                    <p className="text-xs font-bold text-slate-900">{ref.helper_name || 'Helper'}</p>
                    <p className="text-[10px] text-slate-500">
                      {new Date(ref.created_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}
                    </p>
                  </div>
                </div>
                
                <div className="text-right">
                  <div className="flex items-center gap-1">
                    <span className={`text-sm font-black ${ref.jobs_completed >= 5 ? 'text-green-600' : 'text-slate-600'}`}>
                      {ref.jobs_completed}/5
                    </span>
                  </div>
                  {ref.jobs_completed >= 5 ? (
                    <span className="text-[10px] text-green-600 font-semibold flex items-center gap-0.5 justify-end">
                      <Check className="w-3 h-3" /> Done
                    </span>
                  ) : (
                    <span className="text-[10px] text-slate-400">{5 - ref.jobs_completed} more</span>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Terms & Conditions - Compact */}
      <div className="bg-slate-50 rounded-xl p-3 border border-slate-200">
        <button 
          onClick={() => setShowTnC(!showTnC)}
          className="w-full flex items-center justify-between text-xs text-slate-600"
        >
          <span className="flex items-center gap-1.5">
            <Info className="w-3.5 h-3.5" />
            Terms & Conditions
          </span>
          <ChevronRight className={`w-4 h-4 transition-transform ${showTnC ? 'rotate-90' : ''}`} />
        </button>
        
        {showTnC && (
          <div className="mt-3 pt-3 border-t border-slate-200 text-[10px] text-slate-500 space-y-2">
            <p className="p-2 bg-red-50 border border-red-200 rounded-lg text-red-700 font-medium">
              ⚠️ READ CAREFULLY: By participating, you agree to ALL terms below.
            </p>
            
            <p className="font-bold text-slate-700">1. NATURE OF PROGRAM:</p>
            <p>• This is a <strong>voluntary, promotional, non-binding</strong> initiative.</p>
            <p>• <strong>NOT a contract or guarantee</strong> of any reward.</p>
            
            <p className="font-bold text-slate-700 mt-2">2. DISCRETION & TERMINATION:</p>
            <p>• Helparo may <strong>modify, suspend, or terminate</strong> this program at any time.</p>
            <p>• Upon termination, all pending rewards are <strong>void</strong>.</p>
            <p>• &quot;1 Year&quot; benefit starts from approval date and expires after 365 days.</p>
            
            <p className="font-bold text-slate-700 mt-2">3. ELIGIBILITY:</p>
            <p>• Referred helpers must be <strong>completely new</strong> to Helparo.</p>
            <p>• Each must pass <strong>full verification</strong> and complete <strong>5 PAID jobs</strong>.</p>
            <p>• Fake accounts or self-referrals = <strong>PERMANENT DISQUALIFICATION</strong>.</p>
            
            <p className="font-bold text-slate-700 mt-2">4. REWARD CONDITIONS:</p>
            <p>• 0% commission applies <strong>only to Helparo platform jobs</strong>.</p>
            <p>• Requires Helparo&apos;s <strong>explicit approval</strong> (up to 30 days).</p>
            <p>• Must remain <strong>active</strong> (min 1 job/month) to maintain benefit.</p>
            <p>• <strong>Non-transferable</strong> and expires after 365 days.</p>
            
            <p className="font-bold text-slate-700 mt-2">5. LIABILITY:</p>
            <p>• By participating, you <strong>waive all claims</strong> against Helparo.</p>
            <p>• Helparo&apos;s liability is <strong>₹0 (zero)</strong>.</p>
            
            <p className="mt-2 p-2 bg-slate-100 border border-slate-300 rounded text-slate-600 text-[9px]">
              By sharing your code, you confirm agreement to all terms. Helparo&apos;s decision is final.
            </p>
          </div>
        )}
      </div>
    </div>
  )
}
