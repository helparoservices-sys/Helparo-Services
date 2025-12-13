'use client'

import { useState } from 'react'
import { X, Gift, Sparkles, Check, Loader2, ArrowRight, Users, Star, Zap } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { toast } from 'sonner'
import { convertReferral } from '@/app/actions/promos'

interface ReferralCodeModalProps {
  isOpen: boolean
  onClose: () => void
  onSuccess?: () => void
}

export default function ReferralCodeModal({ isOpen, onClose, onSuccess }: ReferralCodeModalProps) {
  const [code, setCode] = useState('')
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState(false)

  if (!isOpen) return null

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!code.trim()) {
      toast.error('Please enter a referral code')
      return
    }

    setLoading(true)
    try {
      console.log('[ReferralModal] Submitting code:', code.trim().toUpperCase())
      const result = await convertReferral(code.trim().toUpperCase())
      console.log('[ReferralModal] Result:', result)
      
      // Check for error response
      if (result && 'error' in result && result.error) {
        console.log('[ReferralModal] Error in result:', result.error)
        toast.error(result.error || 'Invalid or expired referral code')
        setLoading(false)
        return
      }

      // Check for success (data === true means converted)
      if (result && ('success' in result || result.data === true)) {
        console.log('[ReferralModal] Success!')
        setSuccess(true)
        setLoading(false)
        toast.success('🎉 Referral code applied successfully!')
        
        // Mark as completed in localStorage
        localStorage.setItem('helparo_referral_prompt_completed', 'true')
        
        setTimeout(() => {
          onSuccess?.()
          onClose()
        }, 1500)
        return
      }
      
      // Unexpected response - treat as error
      console.log('[ReferralModal] Unexpected result:', result)
      toast.error('Invalid referral code. Please check and try again.')
      setLoading(false)
    } catch (err) {
      console.error('[ReferralModal] Error:', err)
      toast.error('Failed to apply referral code. Please try again.')
      setLoading(false)
    }
  }

  const handleSkip = () => {
    // Mark as completed so we don't ask again
    localStorage.setItem('helparo_referral_prompt_completed', 'true')
    onClose()
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop with blur */}
      <div 
        className="absolute inset-0 bg-gray-900/20 backdrop-blur-md"
        onClick={handleSkip}
      />
      
      {/* Modal */}
      <div className="relative w-full max-w-lg bg-white rounded-3xl shadow-2xl shadow-gray-300/50 overflow-hidden animate-in zoom-in-95 duration-300 border border-gray-100">
        {/* Gradient Orbs Background */}
        <div className="absolute top-0 left-0 w-[300px] h-[300px] bg-emerald-100/60 rounded-full blur-[80px] -translate-x-1/2 -translate-y-1/2 pointer-events-none" />
        <div className="absolute top-0 right-0 w-[200px] h-[200px] bg-cyan-100/50 rounded-full blur-[60px] translate-x-1/3 -translate-y-1/3 pointer-events-none" />
        <div className="absolute bottom-0 right-0 w-[150px] h-[150px] bg-teal-100/40 rounded-full blur-[50px] translate-x-1/4 translate-y-1/4 pointer-events-none" />
        
        {/* Close button */}
        <button 
          onClick={handleSkip}
          className="absolute top-5 right-5 z-10 w-10 h-10 rounded-xl bg-gray-100 hover:bg-gray-200 flex items-center justify-center transition-all hover:scale-105"
        >
          <X className="w-5 h-5 text-gray-500" />
        </button>
        
        {/* Content */}
        <div className="relative p-8 pt-10">
          {success ? (
            <div className="text-center py-8">
              {/* Success Animation */}
              <div className="relative w-24 h-24 mx-auto mb-6">
                <div className="absolute inset-0 bg-emerald-100 rounded-3xl animate-ping opacity-30" />
                <div className="relative w-24 h-24 bg-gradient-to-br from-emerald-500 to-teal-500 rounded-3xl flex items-center justify-center shadow-xl shadow-emerald-500/30">
                  <Check className="w-12 h-12 text-white" />
                </div>
              </div>
              <h3 className="text-2xl font-bold text-gray-900 mb-3">You&apos;re All Set! 🎉</h3>
              <p className="text-gray-600 max-w-xs mx-auto">Your friend will receive their reward when you complete your first booking.</p>
              
              {/* Benefits */}
              <div className="mt-6 flex justify-center gap-4 text-sm">
                <span className="flex items-center gap-1.5 text-emerald-600 bg-emerald-50 px-3 py-1.5 rounded-full">
                  <Star className="w-3.5 h-3.5" />
                  Rewards Unlocked
                </span>
              </div>
            </div>
          ) : (
            <>
              {/* Header */}
              <div className="text-center mb-8">
                {/* Logo/Icon */}
                <div className="relative w-20 h-20 mx-auto mb-6">
                  <div className="absolute inset-0 bg-gradient-to-br from-emerald-500 to-teal-500 rounded-2xl rotate-6 opacity-20" />
                  <div className="relative w-20 h-20 bg-gradient-to-br from-emerald-500 to-teal-500 rounded-2xl flex items-center justify-center shadow-xl shadow-emerald-500/25">
                    <Gift className="w-10 h-10 text-white" />
                  </div>
                  {/* Floating sparkles */}
                  <div className="absolute -top-2 -right-2 w-6 h-6 bg-amber-400 rounded-lg flex items-center justify-center shadow-lg animate-bounce">
                    <Sparkles className="w-3.5 h-3.5 text-white" />
                  </div>
                </div>
                
                <h2 className="text-3xl font-bold text-gray-900 mb-2">
                  Welcome to Helparo!
                </h2>
                <p className="text-gray-600">
                  Were you invited by a friend? Enter their code below!
                </p>
              </div>
              
              {/* Form */}
              <form onSubmit={handleSubmit} className="space-y-5">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Referral Code <span className="text-gray-400 font-normal">(optional)</span>
                  </label>
                  <div className="relative">
                    <Input
                      type="text"
                      placeholder="HELP1234ABCD"
                      value={code}
                      onChange={(e) => setCode(e.target.value.toUpperCase())}
                      className="w-full text-center text-xl font-mono tracking-[0.2em] uppercase h-16 rounded-2xl border-2 border-gray-200 bg-gray-50/50 focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/10 focus:bg-white transition-all placeholder:text-gray-300 placeholder:tracking-[0.15em]"
                      maxLength={12}
                      disabled={loading}
                    />
                    {code && (
                      <div className="absolute right-4 top-1/2 -translate-y-1/2">
                        <div className="w-8 h-8 rounded-full bg-emerald-100 flex items-center justify-center">
                          <Check className="w-4 h-4 text-emerald-600" />
                        </div>
                      </div>
                    )}
                  </div>
                </div>
                
                {/* Action Buttons */}
                <div className="flex gap-3 pt-2">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={handleSkip}
                    className="flex-1 h-14 rounded-2xl text-gray-600 hover:bg-gray-100 border-2 border-gray-200 font-semibold text-base transition-all hover:scale-[1.02]"
                    disabled={loading}
                  >
                    Skip for now
                  </Button>
                  <Button
                    type="submit"
                    disabled={loading || !code.trim()}
                    className="flex-1 h-14 rounded-2xl bg-gray-900 hover:bg-gray-800 text-white shadow-xl shadow-gray-900/20 font-semibold text-base transition-all hover:scale-[1.02] disabled:opacity-50 disabled:hover:scale-100"
                  >
                    {loading ? (
                      <>
                        <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                        Applying...
                      </>
                    ) : (
                      <>
                        Apply Code
                        <ArrowRight className="w-5 h-5 ml-2" />
                      </>
                    )}
                  </Button>
                </div>
              </form>
              
              {/* Benefits Section */}
              <div className="mt-8 pt-6 border-t border-gray-100">
                <p className="text-center text-sm font-medium text-gray-500 mb-4">
                  Why use a referral code?
                </p>
                <div className="grid grid-cols-3 gap-3">
                  <div className="flex flex-col items-center gap-2 p-3 rounded-xl bg-emerald-50/50">
                    <div className="w-10 h-10 rounded-xl bg-emerald-100 flex items-center justify-center">
                      <Zap className="w-5 h-5 text-emerald-600" />
                    </div>
                    <span className="text-xs font-medium text-gray-600 text-center">Priority Support</span>
                  </div>
                  <div className="flex flex-col items-center gap-2 p-3 rounded-xl bg-cyan-50/50">
                    <div className="w-10 h-10 rounded-xl bg-cyan-100 flex items-center justify-center">
                      <Users className="w-5 h-5 text-cyan-600" />
                    </div>
                    <span className="text-xs font-medium text-gray-600 text-center">Help a Friend</span>
                  </div>
                  <div className="flex flex-col items-center gap-2 p-3 rounded-xl bg-amber-50/50">
                    <div className="w-10 h-10 rounded-xl bg-amber-100 flex items-center justify-center">
                      <Star className="w-5 h-5 text-amber-600" />
                    </div>
                    <span className="text-xs font-medium text-gray-600 text-center">Earn Rewards</span>
                  </div>
                </div>
              </div>
              
              {/* Footer Note */}
              <p className="text-center text-xs text-gray-400 mt-6">
                No code? No problem! You can refer friends later and earn rewards together.
              </p>
            </>
          )}
        </div>
      </div>
    </div>
  )
}
