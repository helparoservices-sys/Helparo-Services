'use client'

import { useState } from 'react'
import { X, Gift, Sparkles, Check, Loader2 } from 'lucide-react'
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
      const result = await convertReferral(code.trim().toUpperCase())
      
      if ('error' in result && result.error) {
        toast.error(result.error || 'Invalid or expired referral code')
        setLoading(false)
        return
      }

      setSuccess(true)
      toast.success('🎉 Referral code applied successfully!')
      
      // Mark as completed in localStorage
      localStorage.setItem('helparo_referral_prompt_completed', 'true')
      
      setTimeout(() => {
        onSuccess?.()
        onClose()
      }, 1500)
    } catch {
      toast.error('Failed to apply referral code. Please try again.')
    } finally {
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
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        onClick={handleSkip}
      />
      
      {/* Modal */}
      <div className="relative w-full max-w-md bg-white rounded-3xl shadow-2xl overflow-hidden animate-in zoom-in-95 duration-300">
        {/* Header with gradient */}
        <div className="bg-gradient-to-br from-emerald-500 via-teal-500 to-cyan-500 p-6 pb-12 text-white text-center relative overflow-hidden">
          {/* Decorative circles */}
          <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -translate-y-1/2 translate-x-1/2" />
          <div className="absolute bottom-0 left-0 w-24 h-24 bg-white/10 rounded-full translate-y-1/2 -translate-x-1/2" />
          
          {/* Close button */}
          <button 
            onClick={handleSkip}
            className="absolute top-4 right-4 w-8 h-8 rounded-full bg-white/20 hover:bg-white/30 flex items-center justify-center transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
          
          {/* Icon */}
          <div className="relative">
            <div className="w-20 h-20 mx-auto mb-4 bg-white/20 backdrop-blur-sm rounded-2xl flex items-center justify-center">
              <Gift className="w-10 h-10" />
            </div>
            <h2 className="text-2xl font-black mb-2">Welcome to Helparo! 🎉</h2>
            <p className="text-emerald-100 text-sm">Were you referred by a friend?</p>
          </div>
        </div>
        
        {/* Content */}
        <div className="p-6 -mt-6">
          <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-6">
            {success ? (
              <div className="text-center py-4">
                <div className="w-16 h-16 mx-auto mb-4 bg-emerald-100 rounded-full flex items-center justify-center">
                  <Check className="w-8 h-8 text-emerald-600" />
                </div>
                <h3 className="text-xl font-bold text-gray-900 mb-2">Code Applied!</h3>
                <p className="text-gray-500">Your friend will get rewarded when you complete your first booking.</p>
              </div>
            ) : (
              <form onSubmit={handleSubmit}>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Enter referral code (optional)
                </label>
                <Input
                  type="text"
                  placeholder="e.g., HELP1234ABCD"
                  value={code}
                  onChange={(e) => setCode(e.target.value.toUpperCase())}
                  className="w-full text-center text-lg font-mono tracking-widest uppercase h-14 rounded-xl border-2 border-gray-200 focus:border-emerald-500 focus:ring-emerald-500"
                  maxLength={12}
                  disabled={loading}
                />
                
                <div className="mt-4 flex gap-3">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={handleSkip}
                    className="flex-1 h-12 rounded-xl text-gray-600 hover:bg-gray-50"
                    disabled={loading}
                  >
                    Skip
                  </Button>
                  <Button
                    type="submit"
                    disabled={loading || !code.trim()}
                    className="flex-1 h-12 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white shadow-lg shadow-emerald-500/30"
                  >
                    {loading ? (
                      <>
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        Applying...
                      </>
                    ) : (
                      <>
                        <Sparkles className="w-4 h-4 mr-2" />
                        Apply Code
                      </>
                    )}
                  </Button>
                </div>
              </form>
            )}
          </div>
          
          {/* Info text */}
          {!success && (
            <p className="text-center text-xs text-gray-400 mt-4">
              Don&apos;t have a code? No worries! You can still earn rewards by referring your friends later.
            </p>
          )}
        </div>
      </div>
    </div>
  )
}
