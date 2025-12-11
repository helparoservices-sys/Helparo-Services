'use client'

import { useEffect, useState, useRef, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase/client'
import { Loader2, CheckCircle, FileText, Users, Briefcase, Shield, X, ArrowRight, Sparkles, Star, Clock, BadgeCheck, Phone, AlertCircle, RefreshCw, Lock, Zap } from 'lucide-react'
import Image from 'next/image'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import { auth, RecaptchaVerifier, signInWithPhoneNumber, ConfirmationResult } from '@/lib/firebase'

interface LegalDoc {
  title: string
  content_md: string
  version: number
  type: string
}

// Invalid phone patterns to block
const INVALID_PHONE_PATTERNS = [
  /^(.)\1{9}$/,
  /^0{10}$/,
  /^1234567890$/,
  /^0123456789$/,
  /^9876543210$/,
  /^1234512345$/,
  /^0000000000$/,
  /^12345678(9|0)?0?$/,
]

function validatePhone(phone: string): { valid: boolean; error?: string } {
  const cleanPhone = phone.replace(/[\s-]/g, '')
  if (cleanPhone.length !== 10) return { valid: false, error: 'Phone number must be exactly 10 digits' }
  if (!/^\d{10}$/.test(cleanPhone)) return { valid: false, error: 'Phone number must contain only digits' }
  for (const pattern of INVALID_PHONE_PATTERNS) {
    if (pattern.test(cleanPhone)) return { valid: false, error: 'Please enter a valid phone number' }
  }
  if (!/^[6-9]/.test(cleanPhone)) return { valid: false, error: 'Indian phone numbers must start with 6, 7, 8, or 9' }
  return { valid: true }
}

export default function CompleteSignupPage() {
  const router = useRouter()
  
  // Simplified flow: loading -> selectRole (only if needed) -> verify (T&C + OTP combined) -> otpVerify -> success
  const [step, setStep] = useState<'loading' | 'selectRole' | 'verify' | 'otpVerify' | 'processing' | 'success' | 'error'>('loading')
  const [message, setMessage] = useState('Checking your account...')
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  
  // User & role state
  const [user, setUser] = useState<{ id: string; email?: string } | null>(null)
  const [hoveredRole, setHoveredRole] = useState<'customer' | 'helper' | null>(null)
  const [finalRole, setFinalRole] = useState<string>('customer')
  
  // Terms state
  const [termsAccepted, setTermsAccepted] = useState(false)
  const [privacyAccepted, setPrivacyAccepted] = useState(false)
  const [showLegalModal, setShowLegalModal] = useState(false)
  const [activeTab, setActiveTab] = useState<'terms' | 'privacy'>('terms')
  const [terms, setTerms] = useState<LegalDoc | null>(null)
  const [privacy, setPrivacy] = useState<LegalDoc | null>(null)
  const [loadingDocs, setLoadingDocs] = useState(false)
  
  // Phone verification state
  const [phone, setPhone] = useState('')
  const [phoneError, setPhoneError] = useState('')
  const [countryCode] = useState('+91')
  const [otp, setOtp] = useState(['', '', '', '', '', ''])
  const [countdown, setCountdown] = useState(0)
  const [maskedPhone, setMaskedPhone] = useState('')
  const [confirmationResult, setConfirmationResult] = useState<ConfirmationResult | null>(null)
  const [recaptchaVerifier, setRecaptchaVerifier] = useState<RecaptchaVerifier | null>(null)
  const [recaptchaReady, setRecaptchaReady] = useState(false)
  const [recaptchaInitialized, setRecaptchaInitialized] = useState(false)
  const [loading, setLoading] = useState(false)
  
  const otpInputRefs = useRef<(HTMLInputElement | null)[]>([])
  const recaptchaContainerRef = useRef<HTMLDivElement>(null)

  // Initialize reCAPTCHA
  const initializeRecaptcha = useCallback(() => {
    if (typeof window === 'undefined' || recaptchaInitialized || recaptchaVerifier) return
    setRecaptchaInitialized(true)
    try {
      const existingContainer = document.getElementById('recaptcha-container')
      if (existingContainer) existingContainer.innerHTML = ''
      const verifier = new RecaptchaVerifier(auth, 'recaptcha-container', {
        size: 'invisible',
        callback: () => setRecaptchaReady(true),
        'expired-callback': () => {
          setRecaptchaVerifier(null)
          setRecaptchaReady(false)
          setRecaptchaInitialized(false)
        }
      })
      setRecaptchaVerifier(verifier)
      setRecaptchaReady(true)
    } catch (err) {
      console.error('Failed to initialize reCAPTCHA:', err)
      setRecaptchaInitialized(false)
    }
  }, [recaptchaVerifier, recaptchaInitialized])

  // Initial check
  useEffect(() => {
    const checkAndSetup = async () => {
      try {
        const { data: { user: authUser }, error: userError } = await supabase.auth.getUser()
        if (userError || !authUser) {
          router.push('/auth/login')
          return
        }
        setUser({ id: authUser.id, email: authUser.email })

        // Check profile
        const { data: profile } = await supabase
          .from('profiles')
          .select('role, phone, phone_verified, full_name')
          .eq('id', authUser.id)
          .maybeSingle()

        // If phone already verified, go to dashboard
        if (profile?.phone && profile?.phone_verified) {
          router.push(`/${profile.role || 'customer'}/dashboard`)
          return
        }

        // For complete-signup, always show role selection first
        // This is the user's first time setting up their account
        // They should explicitly choose if they want to be a customer or helper
        setStep('selectRole')
      } catch (err) {
        console.error('Check error:', err)
        setStep('error')
        setMessage('Something went wrong. Please try logging in again.')
        setTimeout(() => router.push('/auth/login'), 3000)
      }
    }
    checkAndSetup()
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // Countdown timer
  useEffect(() => {
    if (countdown > 0) {
      const timer = setTimeout(() => setCountdown(countdown - 1), 1000)
      return () => clearTimeout(timer)
    }
  }, [countdown])

  // Validate phone as user types
  useEffect(() => {
    if (phone) {
      const validation = validatePhone(phone)
      setPhoneError(validation.valid ? '' : validation.error || '')
    } else {
      setPhoneError('')
    }
  }, [phone])

  // Role selection handler
  const handleRoleSelect = (role: 'customer' | 'helper') => {
    setFinalRole(role)
    localStorage.setItem('roleSelected', 'true')
    localStorage.setItem('pendingSignupRole', role)
    setStep('verify')
    setTimeout(initializeRecaptcha, 500)
  }

  // Open legal modal
  const openLegalModal = async (tab: 'terms' | 'privacy') => {
    setActiveTab(tab)
    setShowLegalModal(true)
    if (!terms || !privacy) {
      setLoadingDocs(true)
      try {
        const { data: termsData } = await supabase.from('legal_documents').select('title, content_md, version, type').eq('type', 'terms').eq('is_active', true).order('version', { ascending: false }).limit(1).maybeSingle()
        const { data: privacyData } = await supabase.from('legal_documents').select('title, content_md, version, type').eq('type', 'privacy').eq('is_active', true).order('version', { ascending: false }).limit(1).maybeSingle()
        setTerms(termsData)
        setPrivacy(privacyData)
      } catch (err) { console.error('Error loading legal docs:', err) }
      setLoadingDocs(false)
    }
  }

  // OTP handlers
  const handleOtpChange = (index: number, value: string) => {
    if (!/^\d*$/.test(value)) return
    const newOtp = [...otp]
    newOtp[index] = value.slice(-1)
    setOtp(newOtp)
    if (value && index < 5) otpInputRefs.current[index + 1]?.focus()
  }

  const handleOtpPaste = (e: React.ClipboardEvent) => {
    e.preventDefault()
    const pastedData = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, 6)
    if (pastedData.length === 6) {
      setOtp(pastedData.split(''))
      otpInputRefs.current[5]?.focus()
    }
  }

  const handleOtpKeyDown = (index: number, e: React.KeyboardEvent) => {
    if (e.key === 'Backspace' && !otp[index] && index > 0) otpInputRefs.current[index - 1]?.focus()
  }

  // Combined: Accept terms + Send OTP
  const handleVerifyAndSendOtp = async () => {
    if (!termsAccepted || !privacyAccepted || !user) return
    setLoading(true)
    setError('')

    try {
      // Validate phone first
      const validation = validatePhone(phone)
      if (!validation.valid) {
        setError(validation.error || 'Invalid phone number')
        setLoading(false)
        return
      }

      // Update profile with role
      const { data: { user: authUser } } = await supabase.auth.getUser()
      if (!authUser) throw new Error('No user')

      const { data: existingProfile } = await supabase.from('profiles').select('id, full_name').eq('id', authUser.id).maybeSingle()

      if (existingProfile) {
        await supabase.from('profiles').update({
          full_name: existingProfile.full_name || authUser.user_metadata?.full_name || authUser.user_metadata?.name,
          role: finalRole,
          avatar_url: authUser.user_metadata?.avatar_url || authUser.user_metadata?.picture
        }).eq('id', authUser.id)
      }

      // Accept legal terms
      const { data: termsDoc } = await supabase.from('legal_documents').select('version').eq('type', 'terms').eq('is_active', true).order('version', { ascending: false }).limit(1).maybeSingle()
      const { data: privacyDoc } = await supabase.from('legal_documents').select('version').eq('type', 'privacy').eq('is_active', true).order('version', { ascending: false }).limit(1).maybeSingle()

      if (termsDoc?.version) {
        const { data: existing } = await supabase.from('legal_acceptances').select('id').eq('user_id', authUser.id).eq('document_type', 'terms').eq('document_version', termsDoc.version).maybeSingle()
        if (!existing) await supabase.from('legal_acceptances').insert({ user_id: authUser.id, document_type: 'terms', document_version: termsDoc.version })
      }
      if (privacyDoc?.version) {
        const { data: existing } = await supabase.from('legal_acceptances').select('id').eq('user_id', authUser.id).eq('document_type', 'privacy').eq('document_version', privacyDoc.version).maybeSingle()
        if (!existing) await supabase.from('legal_acceptances').insert({ user_id: authUser.id, document_type: 'privacy', document_version: privacyDoc.version })
      }

      // Send OTP via API
      const response = await fetch('/api/otp/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone, countryCode })
      })
      const data = await response.json()
      if (!response.ok) {
        setError(data.error || 'Failed to send OTP')
        setLoading(false)
        return
      }

      // Initialize reCAPTCHA if not ready
      if (!recaptchaVerifier || !recaptchaReady) {
        initializeRecaptcha()
        await new Promise(resolve => setTimeout(resolve, 1000))
      }
      if (!recaptchaVerifier) {
        setError('Verification not ready. Please try again.')
        setLoading(false)
        return
      }

      // Send Firebase OTP
      const cleanPhone = phone.replace(/[\s-]/g, '')
      const fullPhone = `${countryCode}${cleanPhone}`
      const result = await signInWithPhoneNumber(auth, fullPhone, recaptchaVerifier)
      setConfirmationResult(result)
      setMaskedPhone(`******${phone.slice(-4)}`)
      
      localStorage.removeItem('pendingSignupRole')
      localStorage.removeItem('roleSelected')

      // Move to OTP verification
      setStep('otpVerify')
      setCountdown(60)
      setSuccess('OTP sent successfully!')
      setTimeout(() => setSuccess(''), 3000)
      setTimeout(() => otpInputRefs.current[0]?.focus(), 100)
    } catch (err: unknown) {
      const error = err as { code?: string; message?: string }
      console.error('Error:', err)
      if (error.code === 'auth/invalid-phone-number') setError('Invalid phone number format')
      else if (error.code === 'auth/too-many-requests') setError('Too many requests. Please try again later.')
      else setError(error.message || 'Something went wrong. Please try again.')
      
      if (recaptchaVerifier) {
        try { recaptchaVerifier.clear() } catch { /* ignore */ }
        setRecaptchaVerifier(null)
        setRecaptchaReady(false)
        setRecaptchaInitialized(false)
      }
    } finally {
      setLoading(false)
    }
  }

  // Verify OTP
  const handleVerifyOtp = async () => {
    const otpCode = otp.join('')
    if (otpCode.length !== 6) {
      setError('Please enter the complete 6-digit OTP')
      return
    }
    if (!confirmationResult) {
      setError('Session expired. Please request a new OTP.')
      setStep('verify')
      return
    }

    setError('')
    setLoading(true)

    try {
      await confirmationResult.confirm(otpCode)
      const cleanPhone = phone.replace(/[\s-]/g, '')

      const { error: updateError } = await supabase.from('profiles').update({
        phone: cleanPhone,
        country_code: countryCode,
        phone_verified: true,
        phone_verified_at: new Date().toISOString()
      }).eq('id', user?.id)

      if (updateError) {
        setError('Failed to update profile. Please try again.')
        setLoading(false)
        return
      }

      setStep('success')
      setSuccess('Phone verified successfully!')
      setTimeout(() => router.push(`/${finalRole}/dashboard`), 1500)
    } catch (err: unknown) {
      const error = err as { code?: string; message?: string }
      if (error.code === 'auth/invalid-verification-code') setError('Invalid OTP. Please check and try again.')
      else if (error.code === 'auth/code-expired') {
        setError('OTP has expired. Please request a new one.')
        setStep('verify')
      } else setError('Verification failed. Please try again.')
      setLoading(false)
    }
  }

  // Resend OTP
  const handleResendOtp = async () => {
    if (countdown > 0) return
    setOtp(['', '', '', '', '', ''])
    setConfirmationResult(null)
    setError('')
    setLoading(true)
    
    if (recaptchaVerifier) {
      try { recaptchaVerifier.clear() } catch { /* ignore */ }
      setRecaptchaVerifier(null)
    }
    setRecaptchaInitialized(false)
    
    try {
      // Re-initialize reCAPTCHA
      await new Promise(resolve => setTimeout(resolve, 100))
      initializeRecaptcha()
      await new Promise(resolve => setTimeout(resolve, 500))
      
      // Send OTP via API
      const response = await fetch('/api/otp/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone, countryCode })
      })
      const data = await response.json()
      if (!response.ok) {
        setError(data.error || 'Failed to send OTP')
        setLoading(false)
        return
      }

      if (!recaptchaVerifier) {
        setError('Verification not ready. Please try again.')
        setLoading(false)
        return
      }

      const cleanPhone = phone.replace(/[\s-]/g, '')
      const fullPhone = `${countryCode}${cleanPhone}`
      const result = await signInWithPhoneNumber(auth, fullPhone, recaptchaVerifier)
      setConfirmationResult(result)
      setCountdown(60)
      setSuccess('OTP sent successfully!')
      setTimeout(() => setSuccess(''), 3000)
      setTimeout(() => otpInputRefs.current[0]?.focus(), 100)
    } catch (err: unknown) {
      const error = err as { code?: string; message?: string }
      console.error('Resend error:', err)
      setError(error.message || 'Failed to resend OTP. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  // Get step number for progress indicator (now only 2 steps)
  const getStepNumber = () => {
    if (step === 'selectRole' || step === 'verify') return 1
    if (step === 'otpVerify') return 2
    return 2
  }

  // Left panel content based on step
  const getLeftPanelContent = () => {
    if (step === 'otpVerify') {
      return {
        title: 'Almost Done!',
        subtitle: 'Enter the 6-digit code we just sent to your phone. This keeps your account safe.',
        features: [
          { icon: Shield, title: 'Bank-Level Security', desc: 'Your data is encrypted and protected' },
          { icon: Zap, title: 'Instant Verification', desc: 'OTP delivered in seconds' },
          { icon: Lock, title: 'Privacy First', desc: 'We never share your phone number' }
        ]
      }
    }
    return {
      title: 'One step away from',
      titleHighlight: 'amazing services',
      subtitle: 'Join thousands of users who trust Helparo for reliable, verified home services.',
      features: [
        { icon: BadgeCheck, title: 'Verified Professionals', desc: 'Background checked & ID verified' },
        { icon: Clock, title: 'Quick Response', desc: 'Get help within 30 minutes' },
        { icon: Shield, title: '100% Secure', desc: 'Your data is always protected' }
      ]
    }
  }

  const leftContent = getLeftPanelContent()
  const bothTermsAccepted = termsAccepted && privacyAccepted
  const phoneValid = phone.length === 10 && !phoneError
  const canContinue = bothTermsAccepted && phoneValid

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-emerald-50/30 flex">
      {/* reCAPTCHA container */}
      <div id="recaptcha-container" ref={recaptchaContainerRef}></div>

      {/* Left Side - Branding */}
      <div className="hidden lg:flex lg:w-1/2 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-emerald-600 via-emerald-500 to-teal-500" />
        <div className="absolute inset-0 opacity-10" style={{ backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='1'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")` }} />

        <div className="relative z-10 flex flex-col justify-center px-12 xl:px-20">
          <Link href="/" className="flex items-center gap-3 mb-12">
            <div className="w-14 h-14 rounded-2xl bg-white/20 backdrop-blur-sm flex items-center justify-center">
              <Image src="/logo.jpg" alt="Helparo" width={36} height={36} className="rounded-lg" />
            </div>
            <span className="text-3xl font-bold text-white">Helparo</span>
          </Link>

          <h1 className="text-4xl xl:text-5xl font-bold text-white mb-6 leading-tight">
            {leftContent.title}<br />
            {('titleHighlight' in leftContent) && <span className="text-emerald-200">{leftContent.titleHighlight}</span>}
          </h1>
          <p className="text-xl text-emerald-100 mb-12 max-w-md">{leftContent.subtitle}</p>

          <div className="space-y-6">
            {leftContent.features.map((feature, i) => (
              <div key={i} className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-xl bg-white/20 backdrop-blur-sm flex items-center justify-center">
                  <feature.icon className="w-6 h-6 text-white" />
                </div>
                <div>
                  <p className="text-white font-semibold">{feature.title}</p>
                  <p className="text-emerald-200 text-sm">{feature.desc}</p>
                </div>
              </div>
            ))}
          </div>

          <div className="mt-16 flex items-center gap-4">
            <div className="flex -space-x-2">
              {[1,2,3,4].map((i) => (
                <div key={i} className="w-10 h-10 rounded-full bg-white/30 border-2 border-white/50 flex items-center justify-center text-white text-sm font-bold">
                  {String.fromCharCode(64+i)}
                </div>
              ))}
            </div>
            <div>
              <div className="flex items-center gap-1 text-yellow-300">
                {[1,2,3,4,5].map((i) => (<Star key={i} className="w-4 h-4 fill-current" />))}
              </div>
              <p className="text-emerald-100 text-sm">Loved by 50,000+ users</p>
            </div>
          </div>
        </div>
      </div>

      {/* Right Side - Form */}
      <div className="flex-1 flex items-center justify-center p-6 lg:p-12">
        <div className="w-full max-w-md">
          {/* Mobile Logo */}
          <div className="lg:hidden text-center mb-8">
            <Link href="/" className="inline-flex items-center gap-3">
              <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center">
                <Image src="/logo.jpg" alt="Helparo" width={28} height={28} className="rounded-lg" />
              </div>
              <span className="text-2xl font-bold text-gray-900">Helparo</span>
            </Link>
          </div>

          {/* Progress Indicator - Only 2 steps now */}
          {step !== 'loading' && step !== 'success' && step !== 'error' && step !== 'processing' && step !== 'selectRole' && (
            <div className="flex items-center justify-center gap-2 mb-8">
              {[1, 2].map((num) => (
                <div key={num} className="flex items-center">
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold transition-all ${
                    getStepNumber() > num ? 'bg-emerald-500 text-white' :
                    getStepNumber() === num ? 'bg-emerald-500 text-white ring-4 ring-emerald-100' :
                    'bg-gray-200 text-gray-500'
                  }`}>
                    {getStepNumber() > num ? <CheckCircle className="w-4 h-4" /> : num}
                  </div>
                  {num < 2 && <div className={`w-16 h-1 mx-2 rounded ${getStepNumber() > num ? 'bg-emerald-500' : 'bg-gray-200'}`} />}
                </div>
              ))}
            </div>
          )}

          {/* Fallback Role Selection (only if no role was selected on signup page) */}
          {step === 'selectRole' && (
            <div className="space-y-8">
              <div className="text-center">
                <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-emerald-50 text-emerald-600 text-sm font-medium mb-4">
                  <Sparkles className="w-4 h-4" />Almost there!
                </div>
                <h1 className="text-3xl font-bold text-gray-900 mb-2">Welcome to Helparo!</h1>
                <p className="text-gray-500">How would you like to use our platform?</p>
              </div>

              <div className="space-y-4">
                <button onClick={() => handleRoleSelect('customer')} onMouseEnter={() => setHoveredRole('customer')} onMouseLeave={() => setHoveredRole(null)} className={`w-full p-6 rounded-2xl border-2 text-left transition-all duration-300 group ${hoveredRole === 'customer' ? 'border-emerald-500 bg-emerald-50 shadow-lg shadow-emerald-100' : 'border-gray-200 bg-white hover:border-emerald-300'}`}>
                  <div className="flex items-start gap-4">
                    <div className={`w-14 h-14 rounded-2xl flex items-center justify-center transition-all duration-300 ${hoveredRole === 'customer' ? 'bg-emerald-500 text-white' : 'bg-emerald-100 text-emerald-600 group-hover:bg-emerald-500 group-hover:text-white'}`}>
                      <Users className="w-7 h-7" />
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center justify-between">
                        <h3 className="text-lg font-bold text-gray-900">I need help</h3>
                        <ArrowRight className={`w-5 h-5 transition-all duration-300 ${hoveredRole === 'customer' ? 'text-emerald-500 translate-x-1' : 'text-gray-300'}`} />
                      </div>
                      <p className="text-gray-500 text-sm mt-1">Find verified professionals for your home services</p>
                      <div className="flex items-center gap-4 mt-3 text-xs text-gray-400">
                        <span className="flex items-center gap-1"><CheckCircle className="w-3.5 h-3.5 text-emerald-500" />Instant booking</span>
                        <span className="flex items-center gap-1"><CheckCircle className="w-3.5 h-3.5 text-emerald-500" />Verified helpers</span>
                      </div>
                    </div>
                  </div>
                </button>

                <button onClick={() => handleRoleSelect('helper')} onMouseEnter={() => setHoveredRole('helper')} onMouseLeave={() => setHoveredRole(null)} className={`w-full p-6 rounded-2xl border-2 text-left transition-all duration-300 group ${hoveredRole === 'helper' ? 'border-blue-500 bg-blue-50 shadow-lg shadow-blue-100' : 'border-gray-200 bg-white hover:border-blue-300'}`}>
                  <div className="flex items-start gap-4">
                    <div className={`w-14 h-14 rounded-2xl flex items-center justify-center transition-all duration-300 ${hoveredRole === 'helper' ? 'bg-blue-500 text-white' : 'bg-blue-100 text-blue-600 group-hover:bg-blue-500 group-hover:text-white'}`}>
                      <Briefcase className="w-7 h-7" />
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center justify-between">
                        <h3 className="text-lg font-bold text-gray-900">I want to help</h3>
                        <ArrowRight className={`w-5 h-5 transition-all duration-300 ${hoveredRole === 'helper' ? 'text-blue-500 translate-x-1' : 'text-gray-300'}`} />
                      </div>
                      <p className="text-gray-500 text-sm mt-1">Offer your services and earn money</p>
                      <div className="flex items-center gap-4 mt-3 text-xs text-gray-400">
                        <span className="flex items-center gap-1"><CheckCircle className="w-3.5 h-3.5 text-blue-500" />Flexible hours</span>
                        <span className="flex items-center gap-1"><CheckCircle className="w-3.5 h-3.5 text-blue-500" />Great earnings</span>
                      </div>
                    </div>
                  </div>
                </button>
              </div>
              <p className="text-center text-xs text-gray-400">You can always change your role later in settings</p>
            </div>
          )}

          {/* Combined Step: T&C + Phone Verification */}
          {step === 'verify' && (
            <div className="space-y-6">
              <div className="text-center">
                <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-emerald-50 text-emerald-600 text-sm font-medium mb-4">
                  <Shield className="w-4 h-4" />Final Step
                </div>
                <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-2">Verify & Get Started</h1>
                <p className="text-gray-500">Accept our terms and verify your phone number</p>
              </div>

              {/* Terms Acceptance - Compact */}
              <div className="space-y-3">
                <label className={`flex items-center gap-3 p-4 rounded-xl border-2 cursor-pointer transition-all duration-300 ${termsAccepted ? 'border-emerald-500 bg-emerald-50' : 'border-gray-200 bg-white hover:border-gray-300'}`}>
                  <div className={`w-5 h-5 rounded-md border-2 flex items-center justify-center flex-shrink-0 transition-all duration-200 ${termsAccepted ? 'bg-emerald-500 border-emerald-500' : 'border-gray-300'}`}>
                    {termsAccepted && <CheckCircle className="w-3 h-3 text-white" />}
                  </div>
                  <input type="checkbox" checked={termsAccepted} onChange={(e) => setTermsAccepted(e.target.checked)} className="sr-only" />
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-gray-900 text-sm">I agree to the Terms of Service</p>
                  </div>
                  <button type="button" onClick={(e) => { e.preventDefault(); openLegalModal('terms'); }} className="text-emerald-600 hover:text-emerald-700 font-medium text-xs flex items-center gap-1 flex-shrink-0">
                    <FileText className="w-3.5 h-3.5" />Read
                  </button>
                </label>

                <label className={`flex items-center gap-3 p-4 rounded-xl border-2 cursor-pointer transition-all duration-300 ${privacyAccepted ? 'border-emerald-500 bg-emerald-50' : 'border-gray-200 bg-white hover:border-gray-300'}`}>
                  <div className={`w-5 h-5 rounded-md border-2 flex items-center justify-center flex-shrink-0 transition-all duration-200 ${privacyAccepted ? 'bg-emerald-500 border-emerald-500' : 'border-gray-300'}`}>
                    {privacyAccepted && <CheckCircle className="w-3 h-3 text-white" />}
                  </div>
                  <input type="checkbox" checked={privacyAccepted} onChange={(e) => setPrivacyAccepted(e.target.checked)} className="sr-only" />
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-gray-900 text-sm">I agree to the Privacy Policy</p>
                  </div>
                  <button type="button" onClick={(e) => { e.preventDefault(); openLegalModal('privacy'); }} className="text-emerald-600 hover:text-emerald-700 font-medium text-xs flex items-center gap-1 flex-shrink-0">
                    <Shield className="w-3.5 h-3.5" />Read
                  </button>
                </label>
              </div>

              {/* Phone Input */}
              <div className="space-y-2 pt-2">
                <Label htmlFor="phone" className="text-gray-700 font-semibold text-sm">Phone Number for Verification</Label>
                <div className="flex gap-3">
                  <div className="flex items-center justify-center w-20 h-12 bg-gray-100 border-2 border-gray-200 rounded-xl text-gray-700 font-semibold text-sm">+91 🇮🇳</div>
                  <div className="relative flex-1">
                    <Input id="phone" type="tel" placeholder="9876543210" value={phone} onChange={(e) => setPhone(e.target.value.replace(/\D/g, '').slice(0, 10))} className={`h-12 text-base font-medium bg-white border-2 ${phoneError ? 'border-red-300' : phone && !phoneError ? 'border-emerald-300' : 'border-gray-200'} rounded-xl focus:ring-4 focus:ring-emerald-100 transition-all duration-300`} />
                    {phone && !phoneError && phone.length === 10 && <div className="absolute right-3 top-1/2 -translate-y-1/2"><CheckCircle className="h-5 w-5 text-emerald-500" /></div>}
                  </div>
                </div>
                {phoneError && <div className="flex items-center gap-2 text-red-500 text-xs"><AlertCircle className="h-3.5 w-3.5" />{phoneError}</div>}
              </div>

              {error && (
                <div className="p-3 text-sm text-red-700 bg-red-50 border border-red-200 rounded-xl flex items-start gap-3">
                  <AlertCircle className="h-5 w-5 flex-shrink-0 mt-0.5" />
                  <span>{error}</span>
                </div>
              )}

              <Button onClick={handleVerifyAndSendOtp} disabled={!canContinue || loading} className="w-full h-14 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600 text-white font-semibold text-lg shadow-lg shadow-emerald-200 disabled:opacity-50 disabled:shadow-none transition-all duration-300">
                {loading ? <><Loader2 className="mr-2 w-5 h-5 animate-spin" />Processing...</> : <>Continue & Send OTP<ArrowRight className="ml-2 w-5 h-5" /></>}
              </Button>
              
              <p className="text-center text-xs text-gray-400">Standard SMS rates may apply</p>
            </div>
          )}

          {/* OTP Verification */}
          {step === 'otpVerify' && (
            <div className="space-y-6">
              <div className="text-center">
                <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl mb-5 shadow-lg bg-gradient-to-br from-teal-500 to-emerald-600">
                  <Phone className="h-8 w-8 text-white" />
                </div>
                <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-2">Enter Verification Code</h1>
                <p className="text-gray-500">Code sent to {countryCode} {maskedPhone}</p>
              </div>

              <div className="flex justify-center gap-3" onPaste={handleOtpPaste}>
                {otp.map((digit, index) => (
                  <input key={index} ref={(el) => { otpInputRefs.current[index] = el }} type="text" inputMode="numeric" maxLength={1} value={digit} onChange={(e) => handleOtpChange(index, e.target.value)} onKeyDown={(e) => handleOtpKeyDown(index, e)} className={`w-12 h-14 sm:w-14 sm:h-16 text-center text-2xl font-bold border-2 rounded-xl transition-all duration-300 ${digit ? 'border-emerald-500 bg-emerald-50 text-emerald-700' : 'border-gray-200 bg-white hover:border-gray-300'} focus:border-emerald-500 focus:ring-4 focus:ring-emerald-100 focus:outline-none`} />
                ))}
              </div>

              {success && <div className="p-4 text-sm text-emerald-700 bg-emerald-50 border border-emerald-200 rounded-xl flex items-center gap-3"><CheckCircle className="h-5 w-5" />{success}</div>}
              {error && <div className="p-4 text-sm text-red-700 bg-red-50 border border-red-200 rounded-xl flex items-start gap-3"><AlertCircle className="h-5 w-5 mt-0.5" />{error}</div>}

              <Button onClick={handleVerifyOtp} className="w-full h-14 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white font-bold text-lg rounded-xl shadow-lg transition-all duration-300" disabled={loading || otp.join('').length !== 6}>
                {loading ? <><Loader2 className="mr-2 h-5 w-5 animate-spin" />Verifying...</> : <><CheckCircle className="mr-2 h-5 w-5" />Verify & Continue</>}
              </Button>

              <div className="flex items-center justify-between pt-2">
                <button onClick={() => { setStep('verify'); setOtp(['', '', '', '', '', '']); setError(''); }} className="text-sm text-gray-600 hover:text-emerald-600 font-medium transition-colors">← Change Number</button>
                <button onClick={handleResendOtp} disabled={countdown > 0 || loading} className={`flex items-center gap-2 text-sm font-medium transition-all ${countdown > 0 ? 'text-gray-400' : 'text-emerald-600 hover:text-emerald-700'}`}>
                  <RefreshCw className={`h-4 w-4 ${loading && countdown === 0 ? 'animate-spin' : ''}`} />
                  {countdown > 0 ? `Resend in ${countdown}s` : 'Resend OTP'}
                </button>
              </div>
            </div>
          )}

          {/* Loading */}
          {step === 'loading' && (
            <div className="text-center space-y-6">
              <div className="relative inline-flex">
                <div className="w-20 h-20 rounded-full bg-gradient-to-br from-emerald-500 to-teal-500 flex items-center justify-center shadow-lg shadow-emerald-200">
                  <Loader2 className="w-10 h-10 text-white animate-spin" />
                </div>
              </div>
              <div>
                <h2 className="text-2xl font-bold text-gray-900 mb-2">Loading...</h2>
                <p className="text-gray-500">{message}</p>
              </div>
            </div>
          )}

          {/* Success */}
          {step === 'success' && (
            <div className="text-center space-y-6">
              <div className="w-20 h-20 mx-auto rounded-full bg-gradient-to-br from-emerald-500 to-teal-500 flex items-center justify-center shadow-lg shadow-emerald-200">
                <CheckCircle className="w-10 h-10 text-white" />
              </div>
              <div>
                <h2 className="text-2xl font-bold text-gray-900 mb-2">You&apos;re All Set!</h2>
                <p className="text-gray-500">Redirecting you to your dashboard...</p>
              </div>
            </div>
          )}

          {/* Error */}
          {step === 'error' && (
            <div className="text-center space-y-6">
              <div className="w-20 h-20 mx-auto rounded-full bg-red-100 flex items-center justify-center">
                <X className="w-10 h-10 text-red-500" />
              </div>
              <div>
                <h2 className="text-2xl font-bold text-gray-900 mb-2">Oops!</h2>
                <p className="text-gray-500">{message}</p>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Legal Modal */}
      {showLegalModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-3xl max-h-[85vh] overflow-hidden">
            <div className="flex items-center justify-between px-6 py-4 border-b">
              <div className="flex gap-2">
                <button onClick={() => setActiveTab('terms')} className={`px-4 py-2 rounded-lg font-medium transition-all ${activeTab === 'terms' ? 'bg-emerald-100 text-emerald-700' : 'text-gray-500 hover:bg-gray-100'}`}>Terms of Service</button>
                <button onClick={() => setActiveTab('privacy')} className={`px-4 py-2 rounded-lg font-medium transition-all ${activeTab === 'privacy' ? 'bg-emerald-100 text-emerald-700' : 'text-gray-500 hover:bg-gray-100'}`}>Privacy Policy</button>
              </div>
              <button onClick={() => setShowLegalModal(false)} className="p-2 rounded-lg hover:bg-gray-100 transition-colors"><X className="w-5 h-5 text-gray-500" /></button>
            </div>
            <div className="p-6 overflow-y-auto max-h-[calc(85vh-140px)]">
              {loadingDocs ? (
                <div className="flex items-center justify-center py-12"><Loader2 className="w-8 h-8 text-emerald-500 animate-spin" /></div>
              ) : (
                <div className="prose prose-sm max-w-none prose-headings:text-gray-900 prose-p:text-gray-600">
                  <ReactMarkdown remarkPlugins={[remarkGfm]}>
                    {activeTab === 'terms' ? (terms?.content_md || 'Terms of Service content not available.') : (privacy?.content_md || 'Privacy Policy content not available.')}
                  </ReactMarkdown>
                </div>
              )}
            </div>
            <div className="px-6 py-4 border-t bg-gray-50">
              <Button onClick={() => setShowLegalModal(false)} className="w-full h-12 rounded-xl bg-emerald-500 hover:bg-emerald-600 text-white font-medium">I understand</Button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
