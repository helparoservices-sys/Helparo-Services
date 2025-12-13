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
  differentAreaRequired: true, // Referred user must be from different area/locality
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
            Invite friends from different areas. When 50 friends join & book, enjoy 30 days of free services worth ₹1000/day!
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
            <p className="p-2 bg-red-100 border border-red-300 rounded text-red-800 text-[11px] font-semibold">
              ⚠️ READ CAREFULLY: By participating in this program, you agree to ALL terms below. If you do not agree, do NOT participate.
            </p>
            
            <p className="font-bold text-gray-700 mt-3">1. NATURE OF CAMPAIGN:</p>
            <p>• This referral program is a <strong>voluntary, promotional, non-binding marketing campaign</strong> operated by Helparo at its absolute discretion.</p>
            <p>• <strong>This is NOT a contract, agreement, promise, or guarantee of any reward.</strong> It is purely a goodwill promotional offer.</p>
            <p>• Participation is entirely voluntary and at your own risk. No consideration is exchanged.</p>
            <p>• <strong>Helparo makes NO warranties, representations, or commitments regarding this campaign, express or implied.</strong></p>
            
            <p className="font-bold text-gray-700 mt-3">2. ABSOLUTE DISCRETION & TERMINATION RIGHTS:</p>
            <p>• <strong>Helparo reserves the ABSOLUTE, UNCONDITIONAL, and UNRESTRICTED right to modify, suspend, pause, cancel, discontinue, or permanently terminate this campaign at ANY time, for ANY reason or NO reason, with or without prior notice, and WITHOUT any obligation to explain.</strong></p>
            <p>• <strong>Upon termination, ALL pending rewards, progress, and benefits are IMMEDIATELY forfeited and void, regardless of how close you were to achieving the reward.</strong></p>
            <p>• Helparo may change reward values, eligibility criteria, or any terms at any time without notice.</p>
            <p>• <strong>No participant shall have any claim, right, or entitlement to any reward until Helparo, at its sole discretion, explicitly confirms and activates the reward.</strong></p>
            
            <p className="font-bold text-gray-700 mt-3">3. REFERRAL ELIGIBILITY & VERIFICATION:</p>
            <p>• <strong>Referred users must be from a genuinely different area/locality than the referrer.</strong></p>
            <p>• Referrals from the same locality, apartment complex, building, street, neighborhood, or PIN code are strictly INVALID.</p>
            <p>• Each referred person must: (a) be a new user, (b) sign up with your code, (c) verify their identity, (d) complete at least one PAID booking worth minimum ₹200.</p>
            <p>• <strong>Helparo reserves the right to conduct verification including but not limited to: IP address checks, device fingerprinting, location verification, phone number verification, address proof verification, and any other method deemed necessary.</strong></p>
            <p>• <strong>Helparo's determination of referral validity is FINAL and NON-APPEALABLE.</strong></p>
            <p>• Self-referrals, family referrals, referrals from same household, fake accounts, bot-generated referrals, incentivized referrals (paying someone to sign up), or any fraudulent activity will result in IMMEDIATE and PERMANENT disqualification.</p>
            
            <p className="font-bold text-gray-700 mt-3">4. REWARD LIMITATIONS & CONDITIONS:</p>
            <p>• Maximum benefit: ₹1,000 per day for 30 consecutive days (total potential value: ₹30,000).</p>
            <p>• <strong>STRICT LIMITS:</strong> Only 1 order per day. Only at your registered address. No exceptions.</p>
            <p>• Unused daily limits are permanently forfeited and do NOT carry forward.</p>
            <p>• If service cost exceeds ₹1,000, participant MUST pay the balance. No credits.</p>
            <p>• <strong>Reward activation requires Helparo's explicit approval and may take up to 30 days to verify.</strong></p>
            <p>• Rewards are non-transferable, non-exchangeable, cannot be converted to cash, cannot be sold, and cannot be combined with any other offer, discount, or promotion.</p>
            <p>• <strong>Helparo may reject reward activation for any reason without explanation.</strong></p>
            
            <p className="font-bold text-gray-700 mt-3">5. DISQUALIFICATION & PENALTIES:</p>
            <p>• <strong>Any violation, suspected violation, or attempted violation of these terms will result in IMMEDIATE disqualification without warning.</strong></p>
            <p>• Disqualified participants forfeit ALL progress, rewards, and benefits with no recourse.</p>
            <p>• <strong>Helparo may, at its discretion, permanently ban disqualified users from all Helparo services.</strong></p>
            <p>• Helparo reserves the right to pursue legal action for fraud, abuse, or damages caused.</p>
            <p>• <strong>Helparo may disqualify any participant for ANY reason or NO reason, at its sole discretion, without explanation.</strong></p>
            
            <p className="font-bold text-gray-700 mt-3">6. COMPLETE WAIVER OF CLAIMS:</p>
            <p>• <strong>BY PARTICIPATING, YOU IRREVOCABLY AND UNCONDITIONALLY WAIVE:</strong></p>
            <p className="pl-4">- Any right to sue, claim damages, or seek compensation from Helparo.</p>
            <p className="pl-4">- Any right to file consumer complaints related to this campaign.</p>
            <p className="pl-4">- Any claim for breach of contract (this is not a contract).</p>
            <p className="pl-4">- Any claim for promissory estoppel or detrimental reliance.</p>
            <p className="pl-4">- Any claim for unjust enrichment or quantum meruit.</p>
            <p className="pl-4">- Any right to class action or collective legal action.</p>
            <p>• <strong>You acknowledge that you have NO reasonable expectation of receiving any reward and participate purely on a speculative, hope basis.</strong></p>
            
            <p className="font-bold text-gray-700 mt-3">7. LIMITATION OF LIABILITY:</p>
            <p>• <strong>HELPARO SHALL NOT BE LIABLE FOR ANY DIRECT, INDIRECT, INCIDENTAL, SPECIAL, CONSEQUENTIAL, PUNITIVE, OR EXEMPLARY DAMAGES ARISING FROM OR RELATED TO THIS CAMPAIGN.</strong></p>
            <p>• <strong>IN NO EVENT SHALL HELPARO'S TOTAL LIABILITY EXCEED ₹0 (ZERO RUPEES).</strong></p>
            <p>• Helparo is not liable for: campaign termination, reward denial, technical errors, verification failures, or any loss suffered due to participation or non-participation.</p>
            <p>• You participate entirely at your own risk and expense.</p>
            
            <p className="font-bold text-gray-700 mt-3">8. INDEMNIFICATION:</p>
            <p>• <strong>You agree to indemnify, defend, and hold harmless Helparo, its directors, officers, employees, agents, and affiliates from any claims, damages, losses, or expenses arising from your participation or violation of these terms.</strong></p>
            
            <p className="font-bold text-gray-700 mt-3">9. DISPUTE RESOLUTION:</p>
            <p>• <strong>All disputes shall be resolved through BINDING ARBITRATION</strong> under the Arbitration and Conciliation Act, 1996.</p>
            <p>• Arbitration shall be conducted by a sole arbitrator appointed by Helparo.</p>
            <p>• Venue: Helparo's registered city. Language: English.</p>
            <p>• <strong>You waive any right to jury trial or court proceedings.</strong></p>
            <p>• Each party bears their own costs. Arbitrator's decision is final and binding.</p>
            <p>• <strong>This agreement is governed by the laws of India.</strong></p>
            
            <p className="font-bold text-gray-700 mt-3">10. MISCELLANEOUS:</p>
            <p>• <strong>Helparo's interpretation of these terms is final and conclusive.</strong></p>
            <p>• If any provision is found invalid, all other provisions remain in full effect.</p>
            <p>• Helparo's failure to enforce any term does not waive its right to enforce it later.</p>
            <p>• These terms constitute the entire agreement regarding this campaign.</p>
            <p>• <strong>Helparo may amend these terms at any time without notice. Continued participation constitutes acceptance.</strong></p>
            
            <p className="mt-4 p-3 bg-red-100 border-2 border-red-400 rounded-lg text-red-800 text-[11px]">
              <strong>🚨 FINAL WARNING:</strong> This is a PROMOTIONAL CAMPAIGN that may be CANCELLED at ANY MOMENT without notice. You have NO guaranteed right to any reward. Helparo may terminate this campaign when ONE person approaches the reward threshold, or for ANY other reason. <strong>DO NOT rely on this campaign. DO NOT make any decisions based on potential rewards. Participate ONLY if you accept that you may receive NOTHING.</strong>
            </p>
            
            <p className="mt-3 p-2 bg-gray-100 border border-gray-300 rounded text-gray-600 text-[10px]">
              By sharing your referral code or link, you confirm that you have READ, UNDERSTOOD, and AGREED to ALL terms above. You acknowledge that this campaign offers NO guarantees and can be terminated at Helparo's sole discretion at any time.
            </p>
            
            <p className="mt-2 text-[10px] text-gray-400 italic">Version 2.0 | Last updated: December 13, 2024 | Helparo reserves the right to update these terms at any time without prior notice.</p>
          </div>
        )}
      </div>
    </div>
  )
}
