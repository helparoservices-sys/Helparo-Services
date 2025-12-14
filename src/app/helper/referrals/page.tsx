'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { openWhatsApp } from '@/lib/capacitor'
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
  Briefcase,
  MessageCircle,
  Info,
  Star,
  TrendingUp,
  BadgeCheck,
  Sparkles,
  IndianRupee
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
  totalJobsNeeded: 25, // 5 helpers × 5 jobs
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
  }, [])

  const loadReferralData = async () => {
    setLoading(true)

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      setLoading(false)
      return
    }

    // Generate referral code from user ID
    const code = `HPRO${user.id.substring(0, 6).toUpperCase()}`
    setReferralCode(code)

    // Load referred helpers
    const { data: refData } = await supabase
      .from('helper_referrals')
      .select('*')
      .eq('referrer_id', user.id)
      .order('created_at', { ascending: false })

    // Mock data for demo - in production this comes from DB
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
    openWhatsApp('', message)
  }

  // Calculate stats
  const qualifiedHelpers = referrals.filter(r => r.jobs_completed >= REWARD_CONFIG.jobsPerHelper).length
  const totalJobsFromReferrals = referrals.reduce((sum, r) => sum + (r.jobs_completed || 0), 0)
  const totalHelpers = referrals.length
  
  // Progress calculation
  const helperProgress = Math.min((qualifiedHelpers / REWARD_CONFIG.helpersNeeded) * 100, 100)
  const jobsProgress = Math.min((totalJobsFromReferrals / REWARD_CONFIG.totalJobsNeeded) * 100, 100)
  const isUnlocked = qualifiedHelpers >= REWARD_CONFIG.helpersNeeded
  const helpersRemaining = Math.max(REWARD_CONFIG.helpersNeeded - qualifiedHelpers, 0)

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-slate-600">Loading...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="max-w-4xl mx-auto p-4 space-y-6">
      {/* Hero Header */}
      <div className="relative overflow-hidden bg-gradient-to-br from-blue-600 via-indigo-600 to-purple-700 rounded-3xl p-8 text-white">
        <div className="absolute inset-0 bg-gradient-to-br from-white/10 to-transparent" />
        <div className="absolute top-0 right-0 w-64 h-64 bg-white/5 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2" />
        <div className="absolute bottom-0 left-0 w-48 h-48 bg-purple-500/20 rounded-full blur-3xl translate-y-1/2 -translate-x-1/2" />
        
        <div className="relative">
          <div className="flex items-center gap-2 mb-2">
            <Crown className="w-8 h-8 text-yellow-400" />
            <span className="px-3 py-1 bg-yellow-400/20 text-yellow-300 rounded-full text-xs font-bold">
              HELPER EXCLUSIVE
            </span>
          </div>
          <h1 className="text-3xl md:text-4xl font-black mb-2">Refer 5 Helpers,</h1>
          <h2 className="text-2xl md:text-3xl font-bold text-blue-200">Go Commission FREE! 🚀</h2>
          <p className="text-blue-100 mt-3 max-w-lg">
            Invite fellow helpers to join Helparo. When 5 of them complete 5 jobs each, you'll never pay commission again!
          </p>
          
          {/* Quick info */}
          <div className="mt-4 flex flex-wrap gap-2">
            <span className="px-3 py-1.5 bg-white/10 backdrop-blur-sm rounded-lg text-xs">
              👥 5 Helpers Needed
            </span>
            <span className="px-3 py-1.5 bg-white/10 backdrop-blur-sm rounded-lg text-xs">
              ✅ 5 Jobs Each
            </span>
            <span className="px-3 py-1.5 bg-white/10 backdrop-blur-sm rounded-lg text-xs">
              🎯 25 Total Jobs
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
          <p className="text-3xl font-black text-gray-900">{totalHelpers}</p>
          <p className="text-xs text-gray-500 font-medium">Helpers Invited</p>
        </div>
        
        <div className="bg-white rounded-2xl p-4 shadow-md border border-gray-100 text-center">
          <div className="w-12 h-12 mx-auto mb-2 rounded-xl bg-green-100 flex items-center justify-center">
            <BadgeCheck className="w-6 h-6 text-green-600" />
          </div>
          <p className="text-3xl font-black text-green-600">{qualifiedHelpers}</p>
          <p className="text-xs text-gray-500 font-medium">Qualified (5+ jobs)</p>
        </div>
        
        <div className="bg-white rounded-2xl p-4 shadow-md border border-gray-100 text-center">
          <div className="w-12 h-12 mx-auto mb-2 rounded-xl bg-purple-100 flex items-center justify-center">
            <Briefcase className="w-6 h-6 text-purple-600" />
          </div>
          <p className="text-3xl font-black text-gray-900">{totalJobsFromReferrals}</p>
          <p className="text-xs text-gray-500 font-medium">Total Jobs Done</p>
        </div>
        
        <div className="bg-white rounded-2xl p-4 shadow-md border border-gray-100 text-center">
          <div className="w-12 h-12 mx-auto mb-2 rounded-xl bg-amber-100 flex items-center justify-center">
            <Target className="w-6 h-6 text-amber-600" />
          </div>
          <p className="text-3xl font-black text-amber-600">{helpersRemaining}</p>
          <p className="text-xs text-gray-500 font-medium">More Needed</p>
        </div>
      </div>

      {/* Progress Card */}
      <div className="bg-white rounded-3xl p-6 shadow-lg border border-gray-100">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-bold text-gray-900">Your Progress</h3>
          <span className={`px-3 py-1 rounded-full text-xs font-bold ${
            isUnlocked ? 'bg-green-100 text-green-700' : 'bg-blue-100 text-blue-700'
          }`}>
            {isUnlocked ? '🎉 UNLOCKED!' : `${qualifiedHelpers}/${REWARD_CONFIG.helpersNeeded} Helpers`}
          </span>
        </div>
        
        {/* Helper Progress */}
        <div className="mb-4">
          <div className="flex justify-between text-sm mb-1">
            <span className="text-gray-600">Qualified Helpers</span>
            <span className="font-bold text-blue-600">{qualifiedHelpers} / {REWARD_CONFIG.helpersNeeded}</span>
          </div>
          <div className="relative h-3 bg-gray-100 rounded-full overflow-hidden">
            <div 
              className={`absolute inset-y-0 left-0 rounded-full transition-all duration-500 ${
                isUnlocked 
                  ? 'bg-gradient-to-r from-green-500 to-emerald-500' 
                  : 'bg-gradient-to-r from-blue-500 to-indigo-500'
              }`}
              style={{ width: `${helperProgress}%` }}
            />
          </div>
        </div>

        {/* Jobs Progress */}
        <div>
          <div className="flex justify-between text-sm mb-1">
            <span className="text-gray-600">Total Jobs Completed</span>
            <span className="font-bold text-purple-600">{totalJobsFromReferrals} / {REWARD_CONFIG.totalJobsNeeded}</span>
          </div>
          <div className="relative h-3 bg-gray-100 rounded-full overflow-hidden">
            <div 
              className="absolute inset-y-0 left-0 bg-gradient-to-r from-purple-500 to-pink-500 rounded-full transition-all duration-500"
              style={{ width: `${jobsProgress}%` }}
            />
          </div>
        </div>
        
        <p className="text-center text-sm text-gray-600 mt-4">
          {isUnlocked ? (
            <span className="text-green-600 font-bold">🎉 Congratulations! You've unlocked 1 Year 0% Commission!</span>
          ) : (
            <>
              Need <span className="font-bold text-blue-600">{helpersRemaining} more helpers</span> with 5+ jobs each to unlock <span className="font-bold text-blue-600">1 Year 0% Commission</span>
            </>
          )}
        </p>
      </div>

      {/* The Reward Card */}
      <div className="relative bg-gradient-to-br from-yellow-50 via-amber-50 to-orange-50 rounded-3xl p-6 border-2 border-yellow-300 shadow-lg">
        <div className="absolute -top-3 left-1/2 -translate-x-1/2">
          <span className="px-4 py-1.5 bg-gradient-to-r from-yellow-500 to-orange-500 text-white text-xs font-bold rounded-full shadow-lg">
            🏆 THE ULTIMATE REWARD
          </span>
        </div>
        
        <div className="text-center pt-4">
          <div className="w-20 h-20 mx-auto mb-4 rounded-2xl bg-gradient-to-br from-yellow-400 to-amber-500 flex items-center justify-center shadow-xl">
            <Crown className="w-10 h-10 text-white" />
          </div>
          
          <h3 className="text-2xl font-black text-gray-900 mb-1">1 YEAR</h3>
          <p className="text-4xl font-black text-transparent bg-clip-text bg-gradient-to-r from-yellow-600 to-orange-600 mb-2">0% Commission</p>
          <p className="text-gray-600 mb-4">No platform fees for 12 months!</p>
          
          <div className="grid grid-cols-3 gap-3 mb-4">
            <div className="bg-white rounded-xl p-3 shadow-sm">
              <p className="text-xl font-black text-blue-600">5</p>
              <p className="text-[10px] text-gray-500 font-medium">Helpers</p>
            </div>
            <div className="bg-white rounded-xl p-3 shadow-sm">
              <p className="text-xl font-black text-purple-600">5</p>
              <p className="text-[10px] text-gray-500 font-medium">Jobs Each</p>
            </div>
            <div className="bg-white rounded-xl p-3 shadow-sm">
              <p className="text-xl font-black text-green-600">25</p>
              <p className="text-[10px] text-gray-500 font-medium">Total Jobs</p>
            </div>
          </div>
          
          <div className="p-3 bg-green-50 border border-green-200 rounded-xl">
            <p className="text-sm text-green-800 flex items-center justify-center gap-2">
              <IndianRupee className="w-4 h-4" />
              <span><strong>Save ₹15,000</strong> in commission fees!</span>
            </p>
          </div>
        </div>
      </div>

      {/* Referral Code Card */}
      <div className="bg-gradient-to-br from-blue-600 via-indigo-600 to-purple-700 rounded-3xl p-6 text-white shadow-xl">
        <div className="text-center">
          <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-white/20 backdrop-blur-sm flex items-center justify-center">
            <Share2 className="w-8 h-8" />
          </div>
          <h3 className="text-xl font-bold mb-1">Your Referral Code</h3>
          <p className="text-blue-200 text-sm mb-4">Share this code with fellow helpers</p>
          
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
        <div className="grid md:grid-cols-4 gap-4">
          <div className="text-center">
            <div className="w-14 h-14 mx-auto mb-3 rounded-2xl bg-blue-100 flex items-center justify-center">
              <Share2 className="w-7 h-7 text-blue-600" />
            </div>
            <div className="w-8 h-8 mx-auto -mt-6 mb-2 rounded-full bg-blue-600 text-white flex items-center justify-center text-sm font-bold">1</div>
            <h4 className="font-bold text-gray-900 mb-1">Share Code</h4>
            <p className="text-xs text-gray-500">Share your referral code with electricians, plumbers, etc.</p>
          </div>
          
          <div className="text-center">
            <div className="w-14 h-14 mx-auto mb-3 rounded-2xl bg-green-100 flex items-center justify-center">
              <Users className="w-7 h-7 text-green-600" />
            </div>
            <div className="w-8 h-8 mx-auto -mt-6 mb-2 rounded-full bg-green-600 text-white flex items-center justify-center text-sm font-bold">2</div>
            <h4 className="font-bold text-gray-900 mb-1">They Join</h4>
            <p className="text-xs text-gray-500">Helpers sign up & get verified on Helparo</p>
          </div>
          
          <div className="text-center">
            <div className="w-14 h-14 mx-auto mb-3 rounded-2xl bg-purple-100 flex items-center justify-center">
              <Briefcase className="w-7 h-7 text-purple-600" />
            </div>
            <div className="w-8 h-8 mx-auto -mt-6 mb-2 rounded-full bg-purple-600 text-white flex items-center justify-center text-sm font-bold">3</div>
            <h4 className="font-bold text-gray-900 mb-1">5 Jobs Each</h4>
            <p className="text-xs text-gray-500">Each helper completes 5 paid jobs</p>
          </div>
          
          <div className="text-center">
            <div className="w-14 h-14 mx-auto mb-3 rounded-2xl bg-amber-100 flex items-center justify-center">
              <Crown className="w-7 h-7 text-amber-600" />
            </div>
            <div className="w-8 h-8 mx-auto -mt-6 mb-2 rounded-full bg-amber-600 text-white flex items-center justify-center text-sm font-bold">4</div>
            <h4 className="font-bold text-gray-900 mb-1">Go FREE!</h4>
            <p className="text-xs text-gray-500">Unlock 1 year 0% commission</p>
          </div>
        </div>
      </div>

      {/* Referred Helpers List */}
      <div className="bg-white rounded-3xl p-6 shadow-md border border-gray-100">
        <h3 className="text-xl font-bold text-gray-900 mb-4">Your Referrals</h3>
        
        {referrals.length === 0 ? (
          <div className="text-center py-8">
            <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-gray-100 flex items-center justify-center">
              <Users className="w-8 h-8 text-gray-400" />
            </div>
            <p className="text-gray-500 font-medium">No referrals yet</p>
            <p className="text-sm text-gray-400 mt-1">Start sharing your code to bring helpers onboard!</p>
          </div>
        ) : (
          <div className="space-y-3">
            {referrals.map((ref) => (
              <div key={ref.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-xl">
                <div className="flex items-center gap-3">
                  <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${
                    ref.jobs_completed >= 5 
                      ? 'bg-gradient-to-br from-green-400 to-emerald-500' 
                      : 'bg-gradient-to-br from-gray-300 to-gray-400'
                  }`}>
                    <span className="text-white font-bold text-lg">
                      {ref.helper_name?.charAt(0) || 'H'}
                    </span>
                  </div>
                  <div>
                    <p className="font-bold text-gray-900">{ref.helper_name || 'Helper'}</p>
                    <p className="text-xs text-gray-500">
                      Joined {new Date(ref.created_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}
                    </p>
                  </div>
                </div>
                
                <div className="text-right">
                  <div className="flex items-center gap-2">
                    <span className={`text-lg font-bold ${ref.jobs_completed >= 5 ? 'text-green-600' : 'text-gray-600'}`}>
                      {ref.jobs_completed}/5
                    </span>
                    <span className="text-xs text-gray-500">jobs</span>
                  </div>
                  {ref.jobs_completed >= 5 ? (
                    <span className="text-xs text-green-600 font-semibold">✓ Qualified</span>
                  ) : (
                    <span className="text-xs text-gray-400">{5 - ref.jobs_completed} more needed</span>
                  )}
                </div>
              </div>
            ))}
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
            <p className="p-2 bg-red-100 border border-red-300 rounded text-red-800 text-[11px] font-semibold">
              ⚠️ READ CAREFULLY: By participating in this program, you agree to ALL terms below. If you do not agree, do NOT participate.
            </p>
            
            <p className="font-bold text-gray-700 mt-3">1. NATURE OF PROGRAM:</p>
            <p>• This referral program is a <strong>voluntary, promotional, non-binding marketing initiative</strong> operated by Helparo at its absolute discretion.</p>
            <p>• <strong>This is NOT a contract, agreement, or guarantee of any reward.</strong> It is purely a goodwill promotional offer.</p>
            <p>• Participation is entirely voluntary and at your own risk.</p>
            
            <p className="font-bold text-gray-700 mt-3">2. ABSOLUTE DISCRETION & TERMINATION RIGHTS:</p>
            <p>• <strong>Helparo reserves the ABSOLUTE, UNCONDITIONAL, and UNRESTRICTED right to modify, suspend, pause, cancel, discontinue, or permanently terminate this program at ANY time, for ANY reason or NO reason, with or without prior notice.</strong></p>
            <p>• <strong>Upon termination, ALL pending rewards and benefits are IMMEDIATELY forfeited and void, regardless of progress.</strong></p>
            <p>• Helparo may change reward criteria, eligibility rules, or any terms at any time without notice.</p>
            <p>• <strong>"1 Year" benefit starts from the date of approval and expires exactly 365 days later.</strong></p>
            
            <p className="font-bold text-gray-700 mt-3">3. REFERRAL ELIGIBILITY & VERIFICATION:</p>
            <p>• Referred helpers must be <strong>completely new to Helparo</strong> (never registered before).</p>
            <p>• Each referred helper must pass <strong>full verification</strong> (ID proof, address, skill verification).</p>
            <p>• Each referred helper must complete <strong>minimum 5 PAID jobs</strong> (cancelled jobs don't count).</p>
            <p>• <strong>Fake accounts, self-referrals, family members, or duplicate registrations will result in PERMANENT DISQUALIFICATION.</strong></p>
            <p>• Helparo reserves the right to verify all referrals using IP checks, device fingerprinting, and other methods.</p>
            
            <p className="font-bold text-gray-700 mt-3">4. REWARD CONDITIONS:</p>
            <p>• <strong>0% commission benefit applies ONLY to jobs booked through Helparo platform.</strong></p>
            <p>• <strong>Reward activation requires Helparo's explicit verification and approval (up to 30 days).</strong></p>
            <p>• Referrer must remain <strong>active on platform</strong> (minimum 1 job per month) to maintain benefit.</p>
            <p>• Benefit is <strong>non-transferable</strong> and applies only to the referrer's account.</p>
            <p>• <strong>Benefit expires automatically after 365 days. No extension guaranteed.</strong>
            <p>• Helparo may revoke this benefit early if terms are violated.</p></p>
            
            <p className="font-bold text-gray-700 mt-3">5. DISQUALIFICATION & PENALTIES:</p>
            <p>• Any violation or suspected violation will result in <strong>IMMEDIATE disqualification</strong> without warning.</p>
            <p>• Disqualified participants forfeit ALL progress and benefits with no recourse.</p>
            <p>• <strong>Helparo may permanently ban disqualified users from the platform.</strong></p>
            
            <p className="font-bold text-gray-700 mt-3">6. WAIVER OF CLAIMS:</p>
            <p>• <strong>BY PARTICIPATING, YOU WAIVE:</strong></p>
            <p className="pl-4">- Any right to sue or claim damages from Helparo</p>
            <p className="pl-4">- Any right to file complaints related to this program</p>
            <p className="pl-4">- Any claim for breach of contract (this is not a contract)</p>
            <p className="pl-4">- Any expectation of receiving the reward</p>
            
            <p className="font-bold text-gray-700 mt-3">7. LIMITATION OF LIABILITY:</p>
            <p>• <strong>HELPARO SHALL NOT BE LIABLE FOR ANY DAMAGES ARISING FROM THIS PROGRAM.</strong></p>
            <p>• <strong>IN NO EVENT SHALL HELPARO'S LIABILITY EXCEED ₹0 (ZERO).</strong></p>
            
            <p className="font-bold text-gray-700 mt-3">8. REVENUE IMPACT CLAUSE:</p>
            <p>• <strong>Helparo reserves the right to immediately terminate this program if it negatively impacts business revenue or operations.</strong></p>
            <p>• No prior notice is required for termination under this clause.</p>
            <p>• Existing benefits may be converted to alternative rewards at Helparo's discretion.</p>
            
            <p className="font-bold text-gray-700 mt-3">9. GOVERNING LAW:</p>
            <p>• All disputes shall be resolved through <strong>binding arbitration</strong> under Indian Arbitration Act, 1996.</p>
            <p>• Venue: Helparo's registered city. Arbitrator's decision is final.</p>
            
            <p className="mt-4 p-3 bg-red-100 border-2 border-red-400 rounded-lg text-red-800 text-[11px]">
              <strong>🚨 IMPORTANT:</strong> This program may be modified or cancelled at any time if it affects Helparo's revenue. The 1-year benefit starts from approval date and expires after exactly 365 days. <strong>Program rules may change. Helparo's decision is final.</strong>
            </p>
            
            <p className="mt-3 p-2 bg-gray-100 border border-gray-300 rounded text-gray-600 text-[10px]">
              By sharing your referral code, you confirm that you have READ, UNDERSTOOD, and AGREED to ALL terms above.
            </p>
            
            <p className="mt-2 text-[10px] text-gray-400 italic">Version 1.0 | Last updated: December 13, 2024 | Helparo reserves the right to update these terms at any time.</p>
          </div>
        )}
      </div>
    </div>
  )
}
