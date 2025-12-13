'use client'

import { useEffect, useState, useRef, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase/client'
import { Loader2, CheckCircle, FileText, Users, Briefcase, Shield, X, ArrowRight, Phone, AlertCircle, RefreshCw, Lock, Zap, Sparkles } from 'lucide-react'
import Link from 'next/link'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import { auth, RecaptchaVerifier, signInWithPhoneNumber, ConfirmationResult } from '@/lib/firebase'
import { Button } from '@/components/ui/button'

interface LegalDoc {
  title: string
  content_md: string
  version: number
  type: string
}

type LegalAudience = 'all' | 'customer' | 'helper'

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
  const [isScrolled, setIsScrolled] = useState(false)
  
  const [step, setStep] = useState<'loading' | 'selectRole' | 'verify' | 'otpVerify' | 'processing' | 'success' | 'error'>('loading')
  const [message, setMessage] = useState('Checking your account...')
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  
  const [user, setUser] = useState<{ id: string; email?: string } | null>(null)
  const [hoveredRole, setHoveredRole] = useState<'customer' | 'helper' | null>(null)
  const [finalRole, setFinalRole] = useState<string>('customer')
  
  const [termsAccepted, setTermsAccepted] = useState(false)
  const [privacyAccepted, setPrivacyAccepted] = useState(false)
  const [showLegalModal, setShowLegalModal] = useState(false)
  const [activeTab, setActiveTab] = useState<'terms' | 'privacy'>('terms')
  const [terms, setTerms] = useState<LegalDoc | null>(null)
  const [privacy, setPrivacy] = useState<LegalDoc | null>(null)
  const [loadingDocs, setLoadingDocs] = useState(false)
  
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

  useEffect(() => {
    const handleScroll = () => setIsScrolled(window.scrollY > 20)
    window.addEventListener('scroll', handleScroll)
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

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

  useEffect(() => {
    const checkAndSetup = async () => {
      try {
        const { data: { user: authUser }, error: userError } = await supabase.auth.getUser()
        if (userError || !authUser) {
          router.push('/auth/login')
          return
        }
        setUser({ id: authUser.id, email: authUser.email })

        const { data: profile } = await supabase
          .from('profiles')
          .select('role, phone, phone_verified, full_name')
          .eq('id', authUser.id)
          .maybeSingle()

        if (profile?.phone && profile?.phone_verified) {
          router.push(`/${profile.role || 'customer'}/dashboard`)
          return
        }

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

  useEffect(() => {
    if (countdown > 0) {
      const timer = setTimeout(() => setCountdown(countdown - 1), 1000)
      return () => clearTimeout(timer)
    }
  }, [countdown])

  useEffect(() => {
    if (phone) {
      const validation = validatePhone(phone)
      setPhoneError(validation.valid ? '' : validation.error || '')
    } else {
      setPhoneError('')
    }
  }, [phone])

  const handleRoleSelect = (role: 'customer' | 'helper') => {
    setFinalRole(role)
    localStorage.setItem('roleSelected', 'true')
    localStorage.setItem('pendingSignupRole', role)
    setStep('verify')
    setTimeout(initializeRecaptcha, 500)
  }

  const openLegalModal = async (tab: 'terms' | 'privacy') => {
    setActiveTab(tab)
    setShowLegalModal(true)
    if (!terms || !privacy) {
      setLoadingDocs(true)
      try {
        const audience: LegalAudience = finalRole === 'helper' ? 'helper' : 'customer'
        const fetchLatestDoc = async (type: 'terms' | 'privacy') => {
          const primary = await supabase
            .from('legal_documents')
            .select('title, content_md, version, type')
            .eq('type', type)
            .eq('audience', audience)
            .eq('is_active', true)
            .order('version', { ascending: false })
            .limit(1)
            .maybeSingle()
          if (primary.data) return primary.data

          const fallback = await supabase
            .from('legal_documents')
            .select('title, content_md, version, type')
            .eq('type', type)
            .eq('audience', 'all')
            .eq('is_active', true)
            .order('version', { ascending: false })
            .limit(1)
            .maybeSingle()
          return fallback.data
        }

        const termsData = await fetchLatestDoc('terms')
        const privacyData = await fetchLatestDoc('privacy')
        setTerms(termsData)
        setPrivacy(privacyData)
      } catch (err) { console.error('Error loading legal docs:', err) }
      setLoadingDocs(false)
    }
  }

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

  const handleVerifyAndSendOtp = async () => {
    if (!termsAccepted || !privacyAccepted || !user) return
    setLoading(true)
    setError('')

    try {
      const validation = validatePhone(phone)
      if (!validation.valid) {
        setError(validation.error || 'Invalid phone number')
        setLoading(false)
        return
      }

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

      const audience: LegalAudience = finalRole === 'helper' ? 'helper' : 'customer'

      const fetchLatestVersion = async (type: 'terms' | 'privacy') => {
        const primary = await supabase
          .from('legal_documents')
          .select('version')
          .eq('type', type)
          .eq('audience', audience)
          .eq('is_active', true)
          .order('version', { ascending: false })
          .limit(1)
          .maybeSingle()
        if (primary.data?.version) return primary.data

        const fallback = await supabase
          .from('legal_documents')
          .select('version')
          .eq('type', type)
          .eq('audience', 'all')
          .eq('is_active', true)
          .order('version', { ascending: false })
          .limit(1)
          .maybeSingle()
        return fallback.data
      }

      const termsDoc = await fetchLatestVersion('terms')
      const privacyDoc = await fetchLatestVersion('privacy')

      if (termsDoc?.version) {
        const { data: existing } = await supabase
          .from('legal_acceptances')
          .select('id')
          .eq('user_id', authUser.id)
          .eq('document_type', 'terms')
          .eq('document_audience', audience)
          .eq('document_version', termsDoc.version)
          .maybeSingle()
        if (!existing) await supabase
          .from('legal_acceptances')
          .insert({ user_id: authUser.id, document_type: 'terms', document_audience: audience, document_version: termsDoc.version })
      }
      if (privacyDoc?.version) {
        const { data: existing } = await supabase
          .from('legal_acceptances')
          .select('id')
          .eq('user_id', authUser.id)
          .eq('document_type', 'privacy')
          .eq('document_audience', audience)
          .eq('document_version', privacyDoc.version)
          .maybeSingle()
        if (!existing) await supabase
          .from('legal_acceptances')
          .insert({ user_id: authUser.id, document_type: 'privacy', document_audience: audience, document_version: privacyDoc.version })
      }

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

      if (!recaptchaVerifier || !recaptchaReady) {
        initializeRecaptcha()
        await new Promise(resolve => setTimeout(resolve, 1000))
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
      setMaskedPhone(`******${phone.slice(-4)}`)
      
      localStorage.removeItem('pendingSignupRole')
      localStorage.removeItem('roleSelected')

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
      await new Promise(resolve => setTimeout(resolve, 100))
      initializeRecaptcha()
      await new Promise(resolve => setTimeout(resolve, 500))
      
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

  const bothTermsAccepted = termsAccepted && privacyAccepted
  const phoneValid = phone.length === 10 && !phoneError
  const canContinue = bothTermsAccepted && phoneValid

  return (
    <div className="min-h-screen bg-white">
      {/* reCAPTCHA container */}
      <div id="recaptcha-container" ref={recaptchaContainerRef}></div>

      {/* Premium Glass Header */}
      <header className={`fixed top-0 left-0 right-0 z-50 transition-all duration-500 ${
        isScrolled 
          ? 'bg-white/80 backdrop-blur-2xl shadow-[0_2px_40px_-12px_rgba(0,0,0,0.1)] border-b border-gray-100' 
          : 'bg-white/50 backdrop-blur-xl'
      }`}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16 lg:h-20">
            {/* Logo */}
            <Link href="/" className="flex items-center gap-2.5 group">
              <img src="/logo.svg" alt="Helparo" className="w-10 h-10 rounded-[12px] shadow-lg shadow-emerald-500/20 group-hover:scale-105 transition-transform" />
              <span className="text-xl font-extrabold text-gray-900 hidden sm:block">helparo</span>
            </Link>

            {/* Nav */}
            <nav className="hidden md:flex items-center gap-1">
              <Link href="/services" className="px-4 py-2 text-[15px] font-medium text-gray-600 hover:text-emerald-600 rounded-xl hover:bg-emerald-50 transition-all">Services</Link>
              <Link href="/about" className="px-4 py-2 text-[15px] font-medium text-gray-600 hover:text-emerald-600 rounded-xl hover:bg-emerald-50 transition-all">About</Link>
              <Link href="/contact" className="px-4 py-2 text-[15px] font-medium text-gray-600 hover:text-emerald-600 rounded-xl hover:bg-emerald-50 transition-all">Contact</Link>
            </nav>

            {/* Auth Buttons */}
            <div className="flex items-center gap-3">
              <Button variant="ghost" className="hidden sm:flex text-gray-700 hover:text-emerald-600 font-semibold rounded-xl" asChild>
                <Link href="/auth/login">Log in</Link>
              </Button>
              <Button className="bg-gray-900 hover:bg-gray-800 text-white rounded-xl px-5 font-semibold shadow-lg" asChild>
                <Link href="/auth/signup">Get Started</Link>
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Hero Section with Gradient Background */}
      <section className="relative pt-32 pb-20 overflow-hidden min-h-screen flex items-center">
        {/* Gradient Orbs */}
        <div className="absolute top-0 left-1/4 w-[600px] h-[600px] bg-emerald-200/40 rounded-full blur-[120px] -translate-y-1/2" />
        <div className="absolute top-1/2 right-0 w-[400px] h-[400px] bg-cyan-200/30 rounded-full blur-[100px] translate-x-1/2" />
        <div className="absolute bottom-0 left-0 w-[300px] h-[300px] bg-teal-200/30 rounded-full blur-[80px] -translate-x-1/2" />
        
        {/* Grid Pattern */}
        <div className="absolute inset-0 bg-[linear-gradient(rgba(16,185,129,0.03)_1px,transparent_1px),linear-gradient(90deg,rgba(16,185,129,0.03)_1px,transparent_1px)] bg-[size:40px_40px]" />

        <div className="relative max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 w-full">
          {/* Main Card */}
          <div className="bg-white rounded-3xl shadow-2xl shadow-gray-200/50 border border-gray-100 p-8 sm:p-10">
            {/* Logo in Card */}
            <div className="flex justify-center mb-8">
              <Link href="/" className="flex items-center gap-3 group">
                <img src="/logo.svg" alt="Helparo" className="w-14 h-14 rounded-2xl shadow-xl shadow-emerald-500/20 group-hover:scale-105 transition-transform" />
                <div className="text-left">
                  <span className="text-2xl font-bold text-gray-900 block">helparo</span>
                  <span className="text-[10px] font-semibold text-emerald-600 tracking-[0.2em] uppercase">Home Services</span>
                </div>
              </Link>
            </div>

            {/* Role Selection */}
            {step === 'selectRole' && (
              <div className="space-y-8">
                <div className="text-center">
                  <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-700 text-sm font-medium mb-4">
                    <Zap className="w-4 h-4" />Almost there!
                  </div>
                  <h1 className="text-3xl font-bold text-gray-900 mb-3">Welcome to Helparo!</h1>
                  <p className="text-gray-600">How would you like to use our platform?</p>
                </div>

                <div className="space-y-4">
                  <button 
                    onClick={() => handleRoleSelect('customer')} 
                    onMouseEnter={() => setHoveredRole('customer')} 
                    onMouseLeave={() => setHoveredRole(null)} 
                    className={`w-full p-6 rounded-2xl border-2 text-left transition-all duration-300 group ${
                      hoveredRole === 'customer' 
                        ? 'border-emerald-500 bg-emerald-50 shadow-xl shadow-emerald-500/10' 
                        : 'border-gray-200 bg-gray-50/50 hover:border-emerald-300 hover:bg-emerald-50/50'
                    }`}
                  >
                    <div className="flex items-start gap-4">
                      <div className={`w-14 h-14 rounded-2xl flex items-center justify-center transition-all duration-300 ${
                        hoveredRole === 'customer' ? 'bg-emerald-500 text-white shadow-lg shadow-emerald-500/30' : 'bg-emerald-100 text-emerald-600'
                      }`}>
                        <Users className="w-7 h-7" />
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center justify-between">
                          <h3 className="text-xl font-bold text-gray-900">I need help</h3>
                          <ArrowRight className={`w-5 h-5 transition-all duration-300 ${
                            hoveredRole === 'customer' ? 'text-emerald-500 translate-x-1' : 'text-gray-400'
                          }`} />
                        </div>
                        <p className="text-gray-600 mt-1">Find verified professionals for your home services</p>
                        <div className="flex items-center gap-4 mt-4 text-sm text-gray-500">
                          <span className="flex items-center gap-1.5"><CheckCircle className="w-4 h-4 text-emerald-500" />Instant booking</span>
                          <span className="flex items-center gap-1.5"><CheckCircle className="w-4 h-4 text-emerald-500" />Verified helpers</span>
                        </div>
                      </div>
                    </div>
                  </button>

                  <button 
                    onClick={() => handleRoleSelect('helper')} 
                    onMouseEnter={() => setHoveredRole('helper')} 
                    onMouseLeave={() => setHoveredRole(null)} 
                    className={`w-full p-6 rounded-2xl border-2 text-left transition-all duration-300 group ${
                      hoveredRole === 'helper' 
                        ? 'border-cyan-500 bg-cyan-50 shadow-xl shadow-cyan-500/10' 
                        : 'border-gray-200 bg-gray-50/50 hover:border-cyan-300 hover:bg-cyan-50/50'
                    }`}
                  >
                    <div className="flex items-start gap-4">
                      <div className={`w-14 h-14 rounded-2xl flex items-center justify-center transition-all duration-300 ${
                        hoveredRole === 'helper' ? 'bg-cyan-500 text-white shadow-lg shadow-cyan-500/30' : 'bg-cyan-100 text-cyan-600'
                      }`}>
                        <Briefcase className="w-7 h-7" />
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center justify-between">
                          <h3 className="text-xl font-bold text-gray-900">I want to help</h3>
                          <ArrowRight className={`w-5 h-5 transition-all duration-300 ${
                            hoveredRole === 'helper' ? 'text-cyan-500 translate-x-1' : 'text-gray-400'
                          }`} />
                        </div>
                        <p className="text-gray-600 mt-1">Offer your services and earn money</p>
                        <div className="flex items-center gap-4 mt-4 text-sm text-gray-500">
                          <span className="flex items-center gap-1.5"><CheckCircle className="w-4 h-4 text-cyan-500" />Flexible hours</span>
                          <span className="flex items-center gap-1.5"><CheckCircle className="w-4 h-4 text-cyan-500" />Great earnings</span>
                        </div>
                      </div>
                    </div>
                  </button>
                </div>

                <p className="text-center text-sm text-gray-500">You can always change your role later in settings</p>
              </div>
            )}

            {/* Verify Step - T&C + Phone */}
            {step === 'verify' && (
              <div className="space-y-6">
                <div className="text-center">
                  <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-700 text-sm font-medium mb-4">
                    <Shield className="w-4 h-4" />Final Step
                  </div>
                  <h1 className="text-2xl font-bold text-gray-900 mb-2">Verify & Get Started</h1>
                  <p className="text-gray-600 text-sm">Accept our terms and verify your phone number</p>
                </div>

                {/* Terms Checkboxes */}
                <div className="space-y-3">
                  <label className={`flex items-center gap-3 p-4 rounded-xl border-2 cursor-pointer transition-all duration-300 ${
                    termsAccepted ? 'border-emerald-500 bg-emerald-50' : 'border-gray-200 bg-gray-50/50 hover:border-emerald-300'
                  }`}>
                    <div className={`w-5 h-5 rounded-md border-2 flex items-center justify-center flex-shrink-0 transition-all ${
                      termsAccepted ? 'bg-emerald-500 border-emerald-500' : 'border-gray-300'
                    }`}>
                      {termsAccepted && <CheckCircle className="w-3 h-3 text-white" />}
                    </div>
                    <input type="checkbox" checked={termsAccepted} onChange={(e) => setTermsAccepted(e.target.checked)} className="sr-only" />
                    <span className="flex-1 text-gray-900 text-sm font-medium">I agree to the Terms of Service</span>
                    <button type="button" onClick={(e) => { e.preventDefault(); openLegalModal('terms'); }} className="text-emerald-600 hover:text-emerald-700 text-xs flex items-center gap-1 font-semibold">
                      <FileText className="w-3.5 h-3.5" />Read
                    </button>
                  </label>

                  <label className={`flex items-center gap-3 p-4 rounded-xl border-2 cursor-pointer transition-all duration-300 ${
                    privacyAccepted ? 'border-emerald-500 bg-emerald-50' : 'border-gray-200 bg-gray-50/50 hover:border-emerald-300'
                  }`}>
                    <div className={`w-5 h-5 rounded-md border-2 flex items-center justify-center flex-shrink-0 transition-all ${
                      privacyAccepted ? 'bg-emerald-500 border-emerald-500' : 'border-gray-300'
                    }`}>
                      {privacyAccepted && <CheckCircle className="w-3 h-3 text-white" />}
                    </div>
                    <input type="checkbox" checked={privacyAccepted} onChange={(e) => setPrivacyAccepted(e.target.checked)} className="sr-only" />
                    <span className="flex-1 text-gray-900 text-sm font-medium">I agree to the Privacy Policy</span>
                    <button type="button" onClick={(e) => { e.preventDefault(); openLegalModal('privacy'); }} className="text-emerald-600 hover:text-emerald-700 text-xs flex items-center gap-1 font-semibold">
                      <Lock className="w-3.5 h-3.5" />Read
                    </button>
                  </label>
                </div>

                {/* Phone Input */}
                <div className="space-y-2 pt-2">
                  <label className="text-gray-700 text-sm font-semibold">Phone Number for Verification</label>
                  <div className="flex gap-3">
                    <div className="flex items-center justify-center w-20 h-12 bg-gray-100 border-2 border-gray-200 rounded-xl text-gray-700 text-sm font-medium">+91 🇮🇳</div>
                    <div className="relative flex-1">
                      <input 
                        type="tel" 
                        placeholder="9876543210" 
                        value={phone} 
                        onChange={(e) => setPhone(e.target.value.replace(/\D/g, '').slice(0, 10))} 
                        className={`w-full h-12 px-4 bg-gray-50 border-2 rounded-xl text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 transition-all ${
                          phoneError ? 'border-red-300 focus:border-red-400' : phone && !phoneError ? 'border-emerald-400 focus:border-emerald-500' : 'border-gray-200 focus:border-emerald-400'
                        }`} 
                      />
                      {phone && !phoneError && phone.length === 10 && (
                        <div className="absolute right-3 top-1/2 -translate-y-1/2">
                          <CheckCircle className="h-5 w-5 text-emerald-500" />
                        </div>
                      )}
                    </div>
                  </div>
                  {phoneError && (
                    <div className="flex items-center gap-2 text-red-600 text-xs font-medium">
                      <AlertCircle className="h-3.5 w-3.5" />{phoneError}
                    </div>
                  )}
                </div>

                {error && (
                  <div className="flex items-center gap-3 p-4 bg-red-50 border border-red-200 rounded-xl text-red-700 text-sm">
                    <AlertCircle className="w-5 h-5 flex-shrink-0" />
                    <span>{error}</span>
                  </div>
                )}

                <button 
                  onClick={handleVerifyAndSendOtp} 
                  disabled={!canContinue || loading} 
                  className="w-full h-12 bg-gray-900 hover:bg-gray-800 text-white font-semibold rounded-xl transition-all duration-300 shadow-lg disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                  {loading ? (
                    <><Loader2 className="w-5 h-5 animate-spin" />Processing...</>
                  ) : (
                    <>Continue & Send OTP<ArrowRight className="w-5 h-5" /></>
                  )}
                </button>
              </div>
            )}

            {/* OTP Verification */}
            {step === 'otpVerify' && (
              <div className="space-y-6">
                <div className="text-center">
                  <div className="w-16 h-16 mx-auto rounded-2xl bg-gradient-to-br from-emerald-500 to-teal-500 flex items-center justify-center shadow-xl shadow-emerald-500/25 mb-5">
                    <Phone className="h-8 w-8 text-white" />
                  </div>
                  <h1 className="text-2xl font-bold text-gray-900 mb-2">Enter Verification Code</h1>
                  <p className="text-gray-600">Code sent to {countryCode} {maskedPhone}</p>
                </div>

                <div className="flex justify-center gap-2 sm:gap-3" onPaste={handleOtpPaste}>
                  {otp.map((digit, index) => (
                    <input 
                      key={index} 
                      ref={(el) => { otpInputRefs.current[index] = el }} 
                      type="text" 
                      inputMode="numeric" 
                      maxLength={1} 
                      value={digit} 
                      onChange={(e) => handleOtpChange(index, e.target.value)} 
                      onKeyDown={(e) => handleOtpKeyDown(index, e)} 
                      className={`w-11 h-14 sm:w-12 sm:h-16 text-center text-2xl font-bold border-2 rounded-xl transition-all ${
                        digit ? 'border-emerald-500 bg-emerald-50 text-emerald-700' : 'border-gray-200 bg-gray-50 text-gray-900'
                      } focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 focus:outline-none`} 
                    />
                  ))}
                </div>

                {success && (
                  <div className="flex items-center gap-3 p-4 bg-emerald-50 border border-emerald-200 rounded-xl text-emerald-700 text-sm">
                    <CheckCircle className="w-5 h-5" />{success}
                  </div>
                )}
                {error && (
                  <div className="flex items-center gap-3 p-4 bg-red-50 border border-red-200 rounded-xl text-red-700 text-sm">
                    <AlertCircle className="w-5 h-5" />{error}
                  </div>
                )}

                <button 
                  onClick={handleVerifyOtp} 
                  disabled={loading || otp.join('').length !== 6} 
                  className="w-full h-12 bg-gray-900 hover:bg-gray-800 text-white font-semibold rounded-xl transition-all duration-300 shadow-lg disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                  {loading ? (
                    <><Loader2 className="w-5 h-5 animate-spin" />Verifying...</>
                  ) : (
                    <><CheckCircle className="w-5 h-5" />Verify & Continue</>
                  )}
                </button>

                <div className="flex items-center justify-between pt-2">
                  <button 
                    onClick={() => { setStep('verify'); setOtp(['', '', '', '', '', '']); setError(''); }} 
                    className="text-sm text-gray-600 hover:text-gray-900 transition-colors font-medium"
                  >
                    ← Change Number
                  </button>
                  <button 
                    onClick={handleResendOtp} 
                    disabled={countdown > 0 || loading} 
                    className={`flex items-center gap-2 text-sm font-semibold transition-all ${
                      countdown > 0 ? 'text-gray-400' : 'text-emerald-600 hover:text-emerald-700'
                    }`}
                  >
                    <RefreshCw className={`h-4 w-4 ${loading && countdown === 0 ? 'animate-spin' : ''}`} />
                    {countdown > 0 ? `Resend in ${countdown}s` : 'Resend OTP'}
                  </button>
                </div>
              </div>
            )}

            {/* Loading */}
            {step === 'loading' && (
              <div className="text-center space-y-6 py-8">
                <div className="w-20 h-20 mx-auto rounded-2xl bg-gradient-to-br from-emerald-500 to-teal-500 flex items-center justify-center shadow-xl shadow-emerald-500/25">
                  <Loader2 className="w-10 h-10 text-white animate-spin" />
                </div>
                <div>
                  <h2 className="text-2xl font-bold text-gray-900 mb-2">Loading...</h2>
                  <p className="text-gray-600">{message}</p>
                </div>
              </div>
            )}

            {/* Success */}
            {step === 'success' && (
              <div className="text-center space-y-6 py-8">
                <div className="w-20 h-20 mx-auto rounded-2xl bg-gradient-to-br from-emerald-500 to-teal-500 flex items-center justify-center shadow-xl shadow-emerald-500/25">
                  <CheckCircle className="w-10 h-10 text-white" />
                </div>
                <div>
                  <h2 className="text-2xl font-bold text-gray-900 mb-2">You&apos;re All Set!</h2>
                  <p className="text-gray-600">Redirecting you to your dashboard...</p>
                </div>
              </div>
            )}

            {/* Error */}
            {step === 'error' && (
              <div className="text-center space-y-6 py-8">
                <div className="w-20 h-20 mx-auto rounded-2xl bg-red-100 flex items-center justify-center">
                  <X className="w-10 h-10 text-red-500" />
                </div>
                <div>
                  <h2 className="text-2xl font-bold text-gray-900 mb-2">Oops!</h2>
                  <p className="text-gray-600">{message}</p>
                </div>
              </div>
            )}
          </div>

          {/* Trust Badges Below Card */}
          <div className="mt-8 flex flex-wrap items-center justify-center gap-6 text-sm text-gray-500">
            <span className="flex items-center gap-2">
              <Shield className="w-4 h-4 text-emerald-500" />
              100% Secure
            </span>
            <span className="flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-emerald-500" />
              Verified Professionals
            </span>
            <span className="flex items-center gap-2">
              <Zap className="w-4 h-4 text-emerald-500" />
              Instant Service
            </span>
          </div>
        </div>
      </section>

      {/* Legal Modal */}
      {showLegalModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="bg-white border border-gray-200 rounded-3xl shadow-2xl w-full max-w-3xl max-h-[85vh] overflow-hidden">
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200 bg-gray-50">
              <div className="flex gap-2">
                <button 
                  onClick={() => setActiveTab('terms')} 
                  className={`px-4 py-2 rounded-lg font-medium transition-all ${
                    activeTab === 'terms' ? 'bg-emerald-100 text-emerald-700' : 'text-gray-500 hover:text-gray-900 hover:bg-gray-100'
                  }`}
                >
                  {finalRole === 'helper' ? 'Helper Terms' : 'Customer Terms'}
                </button>
                <button 
                  onClick={() => setActiveTab('privacy')} 
                  className={`px-4 py-2 rounded-lg font-medium transition-all ${
                    activeTab === 'privacy' ? 'bg-emerald-100 text-emerald-700' : 'text-gray-500 hover:text-gray-900 hover:bg-gray-100'
                  }`}
                >
                  {finalRole === 'helper' ? 'Helper Privacy' : 'Customer Privacy'}
                </button>
              </div>
              <button onClick={() => setShowLegalModal(false)} className="p-2 rounded-lg hover:bg-gray-100 transition-colors">
                <X className="w-5 h-5 text-gray-500" />
              </button>
            </div>
            <div className="p-6 overflow-y-auto max-h-[calc(85vh-140px)]">
              {loadingDocs ? (
                <div className="flex items-center justify-center py-12">
                  <Loader2 className="w-8 h-8 text-emerald-500 animate-spin" />
                </div>
              ) : (
                <div className="text-gray-700 text-sm leading-relaxed space-y-4">
                  {activeTab === 'terms' ? (
                    terms?.content_md ? (
                      <ReactMarkdown 
                        remarkPlugins={[remarkGfm]}
                        components={{
                          h1: ({children}) => <h1 className="text-xl font-bold text-gray-900 mb-4">{children}</h1>,
                          h2: ({children}) => <h2 className="text-lg font-semibold text-gray-900 mt-6 mb-3">{children}</h2>,
                          h3: ({children}) => <h3 className="text-base font-semibold text-gray-900 mt-4 mb-2">{children}</h3>,
                          p: ({children}) => <p className="text-gray-700 mb-3">{children}</p>,
                          ul: ({children}) => <ul className="list-disc list-inside text-gray-700 space-y-1 ml-4">{children}</ul>,
                          ol: ({children}) => <ol className="list-decimal list-inside text-gray-700 space-y-1 ml-4">{children}</ol>,
                          li: ({children}) => <li className="text-gray-700">{children}</li>,
                          strong: ({children}) => <strong className="text-gray-900 font-semibold">{children}</strong>,
                          a: ({children, href}) => <a href={href} className="text-emerald-600 hover:underline">{children}</a>,
                        }}
                      >
                        {terms.content_md}
                      </ReactMarkdown>
                    ) : (
                      <p className="text-gray-500 text-center py-8">Terms of Service content not available.</p>
                    )
                  ) : (
                    privacy?.content_md ? (
                      <ReactMarkdown 
                        remarkPlugins={[remarkGfm]}
                        components={{
                          h1: ({children}) => <h1 className="text-xl font-bold text-gray-900 mb-4">{children}</h1>,
                          h2: ({children}) => <h2 className="text-lg font-semibold text-gray-900 mt-6 mb-3">{children}</h2>,
                          h3: ({children}) => <h3 className="text-base font-semibold text-gray-900 mt-4 mb-2">{children}</h3>,
                          p: ({children}) => <p className="text-gray-700 mb-3">{children}</p>,
                          ul: ({children}) => <ul className="list-disc list-inside text-gray-700 space-y-1 ml-4">{children}</ul>,
                          ol: ({children}) => <ol className="list-decimal list-inside text-gray-700 space-y-1 ml-4">{children}</ol>,
                          li: ({children}) => <li className="text-gray-700">{children}</li>,
                          strong: ({children}) => <strong className="text-gray-900 font-semibold">{children}</strong>,
                          a: ({children, href}) => <a href={href} className="text-emerald-600 hover:underline">{children}</a>,
                        }}
                      >
                        {privacy.content_md}
                      </ReactMarkdown>
                    ) : (
                      <p className="text-gray-500 text-center py-8">Privacy Policy content not available.</p>
                    )
                  )}
                </div>
              )}
            </div>
            <div className="px-6 py-4 border-t border-gray-200 bg-gray-50">
              <button 
                onClick={() => setShowLegalModal(false)} 
                className="w-full h-12 bg-gray-900 hover:bg-gray-800 text-white font-semibold rounded-xl transition-all"
              >
                I understand
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Footer */}
      <footer className="border-t border-gray-100 py-8 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-2">
              <img src="/logo.svg" alt="Helparo" className="w-8 h-8 rounded-lg" />
              <span className="text-gray-600 text-sm">© 2024 Helparo. All rights reserved.</span>
            </div>
            <div className="flex items-center gap-6 text-sm">
              <Link
                href={finalRole === 'helper' ? '/legal/helper/terms' : '/legal/customer/terms'}
                className="text-gray-600 hover:text-emerald-600 transition-colors"
              >
                {finalRole === 'helper' ? 'Helper Terms' : 'Customer Terms'}
              </Link>
              <Link
                href={finalRole === 'helper' ? '/legal/helper/privacy' : '/legal/customer/privacy'}
                className="text-gray-600 hover:text-emerald-600 transition-colors"
              >
                {finalRole === 'helper' ? 'Helper Privacy' : 'Customer Privacy'}
              </Link>
              <Link href="/contact" className="text-gray-600 hover:text-emerald-600 transition-colors">Contact</Link>
            </div>
          </div>
        </div>
      </footer>
    </div>
  )
}
