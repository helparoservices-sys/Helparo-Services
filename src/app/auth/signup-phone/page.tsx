'use client'

import { useState, useRef, useCallback, useEffect } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { Loader2, CheckCircle, ArrowLeft, Phone, User, Mail, Lock, Shield, Star, Sparkles, Zap, Clock, ArrowRight, AlertCircle, RefreshCw, X } from 'lucide-react'
import { auth, RecaptchaVerifier, signInWithPhoneNumber, ConfirmationResult } from '@/lib/firebase'
import { supabase as supabaseRaw } from '@/lib/supabase/client'
import { LegalModal } from '@/components/legal/legal-modal'
import { Button } from '@/components/ui/button'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'

const supabase: any = supabaseRaw

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

export default function PhoneSignupPage() {
  const router = useRouter()
  const [isScrolled, setIsScrolled] = useState(false)
  const [step, setStep] = useState<'phone' | 'otp' | 'profile'>('phone')
  
  // Phone step
  const [phone, setPhone] = useState('')
  const [phoneError, setPhoneError] = useState('')
  const [role, setRole] = useState<'customer' | 'helper'>('customer')
  const [hoveredRole, setHoveredRole] = useState<'customer' | 'helper' | null>(null)
  const [termsAccepted, setTermsAccepted] = useState(false)
  const [privacyAccepted, setPrivacyAccepted] = useState(false)
  const [showLegalModal, setShowLegalModal] = useState(false)
  const [activeTab, setActiveTab] = useState<'terms' | 'privacy'>('terms')
  const [terms, setTerms] = useState<LegalDoc | null>(null)
  const [privacy, setPrivacy] = useState<LegalDoc | null>(null)
  const [loadingDocs, setLoadingDocs] = useState(false)
  
  // OTP step
  const [otp, setOtp] = useState(['', '', '', '', '', ''])
  const [maskedPhone, setMaskedPhone] = useState('')
  const [countdown, setCountdown] = useState(0)
  const [confirmationResult, setConfirmationResult] = useState<ConfirmationResult | null>(null)
  
  // Profile step
  const [fullName, setFullName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  
  // Common
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [recaptchaVerifier, setRecaptchaVerifier] = useState<RecaptchaVerifier | null>(null)
  const [recaptchaReady, setRecaptchaReady] = useState(false)
  const [recaptchaInitialized, setRecaptchaInitialized] = useState(false)
  
  const otpInputRefs = useRef<(HTMLInputElement | null)[]>([])
  const recaptchaContainerRef = useRef<HTMLDivElement>(null)
  const countryCode = '+91'

  useEffect(() => {
    const handleScroll = () => setIsScrolled(window.scrollY > 20)
    window.addEventListener('scroll', handleScroll)
    return () => window.removeEventListener('scroll', handleScroll)
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
    if (step === 'phone') {
      setTimeout(initializeRecaptcha, 500)
    }
  }, [step, initializeRecaptcha])

  const openLegalModal = async (tab: 'terms' | 'privacy') => {
    setActiveTab(tab)
    setShowLegalModal(true)
    if (!terms || !privacy) {
      setLoadingDocs(true)
      try {
        const audience: LegalAudience = role === 'helper' ? 'helper' : 'customer'
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

          if (!primary.error && primary.data) return primary.data

          const fallback = await supabase
            .from('legal_documents')
            .select('title, content_md, version, type')
            .eq('type', type)
            .eq('audience', 'all')
            .eq('is_active', true)
            .order('version', { ascending: false })
            .limit(1)
            .maybeSingle()

          if (!fallback.error) return fallback.data

          const legacy = await supabase
            .from('legal_documents')
            .select('title, content_md, version, type')
            .eq('type', type)
            .eq('is_active', true)
            .order('version', { ascending: false })
            .limit(1)
            .maybeSingle()
          return legacy.data
        }

        const termsData = await fetchLatestDoc('terms')
        const privacyData = await fetchLatestDoc('privacy')
        setTerms(termsData)
        setPrivacy(privacyData)
      } catch (err) { console.error('Error loading legal docs:', err) }
      setLoadingDocs(false)
    }
  }

  const handleSendOtp = async () => {
    if (!termsAccepted || !privacyAccepted) {
      setError('Please accept Terms of Service and Privacy Policy')
      return
    }

    const validation = validatePhone(phone)
    if (!validation.valid) {
      setError(validation.error || 'Invalid phone number')
      return
    }

    setLoading(true)
    setError('')

    try {
      // Check if phone already exists
      const { data: existingUser } = await supabase
        .from('profiles')
        .select('id')
        .eq('phone', phone)
        .maybeSingle()

      if (existingUser) {
        setError('This phone number is already registered. Please login instead.')
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
      
      setStep('otp')
      setCountdown(60)
      setSuccess('OTP sent successfully!')
      setTimeout(() => setSuccess(''), 3000)
      setTimeout(() => otpInputRefs.current[0]?.focus(), 100)
    } catch (err: unknown) {
      const error = err as { code?: string; message?: string }
      console.error('Error:', err)
      if (error.code === 'auth/invalid-phone-number') setError('Invalid phone number format')
      else if (error.code === 'auth/too-many-requests') setError('Too many requests. Please try again later.')
      else setError(error.message || 'Failed to send OTP. Please try again.')
      
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

  const handleVerifyOtp = async () => {
    const otpCode = otp.join('')
    if (otpCode.length !== 6) {
      setError('Please enter the complete 6-digit OTP')
      return
    }
    if (!confirmationResult) {
      setError('Session expired. Please request a new OTP.')
      setStep('phone')
      return
    }

    setError('')
    setLoading(true)

    try {
      await confirmationResult.confirm(otpCode)
      setSuccess('OTP verified successfully!')
      setTimeout(() => setSuccess(''), 3000)
      setStep('profile')
    } catch (err: unknown) {
      const error = err as { code?: string; message?: string }
      if (error.code === 'auth/invalid-verification-code') setError('Invalid OTP. Please check and try again.')
      else if (error.code === 'auth/code-expired') {
        setError('OTP has expired. Please request a new one.')
        setStep('phone')
      } else setError('Verification failed. Please try again.')
    } finally {
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

  const handleCompleteSignup = async () => {
    if (!fullName.trim()) {
      setError('Please enter your full name')
      return
    }

    setLoading(true)
    setError('')

    try {
      const firebaseUser = auth.currentUser
      if (!firebaseUser) {
        setError('Authentication session expired. Please try again.')
        setStep('phone')
        setLoading(false)
        return
      }

      const cleanPhone = phone.replace(/[\s-]/g, '')
      const userId = firebaseUser.uid

      // If email and password provided, create Supabase auth account
      if (email && password) {
        const { data, error: signUpError } = await supabase.auth.signUp({
          email,
          password,
          options: {
            data: {
              phone: cleanPhone,
              full_name: fullName,
              role: role,
              phone_verified: true,
              firebase_uid: userId
            }
          }
        })

        if (signUpError) throw signUpError

        // Update profile with phone verification
        await supabase.from('profiles').update({
          phone: cleanPhone,
          country_code: countryCode,
          phone_verified: true,
          phone_verified_at: new Date().toISOString(),
          firebase_uid: userId
        }).eq('id', data.user!.id)

      } else {
        // Phone-only signup: Create profile directly without Supabase auth
        const { error: profileError } = await supabase
          .from('profiles')
          .insert({
            id: userId,
            phone: cleanPhone,
            country_code: countryCode,
            full_name: fullName,
            email: email || null,
            role: role,
            phone_verified: true,
            phone_verified_at: new Date().toISOString(),
            firebase_uid: userId
          })

        if (profileError) throw profileError
      }

      // Save legal acceptances
      const audience: LegalAudience = role === 'helper' ? 'helper' : 'customer'
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

        if (!primary.error && primary.data?.version) return primary.data

        const fallback = await supabase
          .from('legal_documents')
          .select('version')
          .eq('type', type)
          .eq('audience', 'all')
          .eq('is_active', true)
          .order('version', { ascending: false })
          .limit(1)
          .maybeSingle()

        if (!fallback.error) return fallback.data

        const legacy = await supabase
          .from('legal_documents')
          .select('version')
          .eq('type', type)
          .eq('is_active', true)
          .order('version', { ascending: false })
          .limit(1)
          .maybeSingle()
        return legacy.data
      }

      const termsDoc = await fetchLatestVersion('terms')
      const privacyDoc = await fetchLatestVersion('privacy')

      if (termsDoc?.version) {
        await supabase.from('legal_acceptances').insert({
          user_id: userId,
          document_type: 'terms',
          document_audience: audience,
          document_version: termsDoc.version
        })
      }

      if (privacyDoc?.version) {
        await supabase.from('legal_acceptances').insert({
          user_id: userId,
          document_type: 'privacy',
          document_audience: audience,
          document_version: privacyDoc.version
        })
      }

      setSuccess('Account created successfully!')
      setTimeout(() => router.push(`/${role}/dashboard`), 1500)
    } catch (err: unknown) {
      const error = err as { message?: string }
      console.error('Error completing signup:', err)
      setError(error.message || 'Failed to complete signup. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  const bothTermsAccepted = termsAccepted && privacyAccepted
  const phoneValid = phone.length === 10 && !phoneError
  const canContinue = bothTermsAccepted && phoneValid

  return (
    <div className="min-h-screen bg-white">
      <div id="recaptcha-container" ref={recaptchaContainerRef}></div>

      {/* Premium Glass Header */}
      <header className={`fixed top-0 left-0 right-0 z-50 transition-all duration-500 ${
        isScrolled 
          ? 'bg-white/80 backdrop-blur-2xl shadow-[0_2px_40px_-12px_rgba(0,0,0,0.1)] border-b border-gray-100' 
          : 'bg-white/50 backdrop-blur-xl'
      }`}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16 lg:h-20">
            <Link href="/" className="flex items-center gap-2.5 group">
              <img src="/logo.svg" alt="Helparo" className="w-10 h-10 rounded-[12px] shadow-lg shadow-emerald-500/20 group-hover:scale-105 transition-transform" />
              <span className="text-xl font-extrabold text-gray-900 hidden sm:block">helparo</span>
            </Link>

            <nav className="hidden md:flex items-center gap-1">
              <Link href="/services" className="px-4 py-2 text-[15px] font-medium text-gray-600 hover:text-emerald-600 rounded-xl hover:bg-emerald-50 transition-all">Services</Link>
              <Link href="/about" className="px-4 py-2 text-[15px] font-medium text-gray-600 hover:text-emerald-600 rounded-xl hover:bg-emerald-50 transition-all">About</Link>
              <Link href="/contact" className="px-4 py-2 text-[15px] font-medium text-gray-600 hover:text-emerald-600 rounded-xl hover:bg-emerald-50 transition-all">Contact</Link>
            </nav>

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

            {/* Step Indicator */}
            <div className="flex items-center justify-center gap-3 mb-8">
              <div className={`flex items-center gap-2 ${step === 'phone' ? 'text-emerald-600' : step === 'otp' || step === 'profile' ? 'text-emerald-600' : 'text-gray-300'}`}>
                <div className={`w-8 h-8 rounded-full flex items-center justify-center font-semibold text-sm ${step === 'phone' ? 'bg-emerald-600 text-white' : 'bg-emerald-100 text-emerald-600'}`}>
                  {step !== 'phone' ? <CheckCircle className="w-5 h-5" /> : '1'}
                </div>
                <span className="text-sm font-medium hidden sm:inline">Phone</span>
              </div>
              <div className="w-12 h-px bg-gray-200" />
              <div className={`flex items-center gap-2 ${step === 'otp' ? 'text-emerald-600' : step === 'profile' ? 'text-emerald-600' : 'text-gray-300'}`}>
                <div className={`w-8 h-8 rounded-full flex items-center justify-center font-semibold text-sm ${step === 'otp' ? 'bg-emerald-600 text-white' : step === 'profile' ? 'bg-emerald-100 text-emerald-600' : 'bg-gray-100 text-gray-400'}`}>
                  {step === 'profile' ? <CheckCircle className="w-5 h-5" /> : '2'}
                </div>
                <span className="text-sm font-medium hidden sm:inline">OTP</span>
              </div>
              <div className="w-12 h-px bg-gray-200" />
              <div className={`flex items-center gap-2 ${step === 'profile' ? 'text-emerald-600' : 'text-gray-300'}`}>
                <div className={`w-8 h-8 rounded-full flex items-center justify-center font-semibold text-sm ${step === 'profile' ? 'bg-emerald-600 text-white' : 'bg-gray-100 text-gray-400'}`}>
                  3
                </div>
                <span className="text-sm font-medium hidden sm:inline">Profile</span>
              </div>
            </div>

            {/* Error Message */}
            {error && (
              <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-2xl flex items-start gap-3 animate-in fade-in slide-in-from-top-2">
                <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
                <p className="text-sm text-red-800 flex-1">{error}</p>
                <button onClick={() => setError('')} className="text-red-400 hover:text-red-600">
                  <X className="w-4 h-4" />
                </button>
              </div>
            )}

            {/* Success Message */}
            {success && (
              <div className="mb-6 p-4 bg-emerald-50 border border-emerald-200 rounded-2xl flex items-start gap-3 animate-in fade-in slide-in-from-top-2">
                <CheckCircle className="w-5 h-5 text-emerald-600 flex-shrink-0 mt-0.5" />
                <p className="text-sm text-emerald-800 flex-1">{success}</p>
              </div>
            )}

            {/* STEP 1: Phone Number & Role Selection */}
            {step === 'phone' && (
              <div className="space-y-6">
                <div className="text-center mb-6">
                  <h1 className="text-2xl font-bold text-gray-900 mb-2">Sign up with Phone Number</h1>
                  <p className="text-sm text-gray-500">Quick and secure signup in just 3 steps</p>
                </div>

                {/* Role Selection */}
                <div>
                  <label className="block text-sm font-semibold text-gray-900 mb-3">I want to</label>
                  <div className="grid grid-cols-2 gap-4">
                    <button
                      type="button"
                      onClick={() => setRole('customer')}
                      onMouseEnter={() => setHoveredRole('customer')}
                      onMouseLeave={() => setHoveredRole(null)}
                      className={`relative p-6 rounded-2xl border-2 transition-all duration-300 ${
                        role === 'customer'
                          ? 'border-emerald-500 bg-emerald-50 shadow-lg shadow-emerald-500/20'
                          : 'border-gray-200 hover:border-emerald-300 hover:shadow-md'
                      }`}
                    >
                      <div className="flex flex-col items-center gap-3">
                        <div className={`w-12 h-12 rounded-xl flex items-center justify-center transition-all ${
                          role === 'customer' ? 'bg-emerald-500 text-white scale-110' : 'bg-gray-100 text-gray-600'
                        }`}>
                          <User className="w-6 h-6" />
                        </div>
                        <div className="text-center">
                          <div className="font-semibold text-gray-900">Get Help</div>
                          <div className="text-xs text-gray-500 mt-1">Book services</div>
                        </div>
                      </div>
                      {role === 'customer' && (
                        <div className="absolute top-3 right-3">
                          <CheckCircle className="w-5 h-5 text-emerald-600" />
                        </div>
                      )}
                    </button>

                    <button
                      type="button"
                      onClick={() => setRole('helper')}
                      onMouseEnter={() => setHoveredRole('helper')}
                      onMouseLeave={() => setHoveredRole(null)}
                      className={`relative p-6 rounded-2xl border-2 transition-all duration-300 ${
                        role === 'helper'
                          ? 'border-emerald-500 bg-emerald-50 shadow-lg shadow-emerald-500/20'
                          : 'border-gray-200 hover:border-emerald-300 hover:shadow-md'
                      }`}
                    >
                      <div className="flex flex-col items-center gap-3">
                        <div className={`w-12 h-12 rounded-xl flex items-center justify-center transition-all ${
                          role === 'helper' ? 'bg-emerald-500 text-white scale-110' : 'bg-gray-100 text-gray-600'
                        }`}>
                          <Sparkles className="w-6 h-6" />
                        </div>
                        <div className="text-center">
                          <div className="font-semibold text-gray-900">Provide Help</div>
                          <div className="text-xs text-gray-500 mt-1">Earn money</div>
                        </div>
                      </div>
                      {role === 'helper' && (
                        <div className="absolute top-3 right-3">
                          <CheckCircle className="w-5 h-5 text-emerald-600" />
                        </div>
                      )}
                    </button>
                  </div>
                </div>

                {/* Phone Input */}
                <div>
                  <label className="block text-sm font-semibold text-gray-900 mb-2">Phone Number</label>
                  <div className="relative">
                    <div className="absolute left-4 top-1/2 -translate-y-1/2 flex items-center gap-2 text-gray-500">
                      <Phone className="w-5 h-5" />
                      <span className="text-sm font-medium">+91</span>
                      <div className="w-px h-6 bg-gray-300" />
                    </div>
                    <input
                      type="tel"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value.replace(/\D/g, '').slice(0, 10))}
                      placeholder="9876543210"
                      className={`w-full h-14 pl-24 pr-4 bg-gray-50 border-2 rounded-2xl text-base text-gray-900 placeholder-gray-400 focus:bg-white focus:outline-none transition-all ${
                        phoneError ? 'border-red-300 focus:border-red-500' : 'border-gray-200 focus:border-emerald-500'
                      }`}
                    />
                  </div>
                  {phoneError && (
                    <p className="mt-2 text-sm text-red-600 flex items-center gap-1">
                      <AlertCircle className="w-4 h-4" />
                      {phoneError}
                    </p>
                  )}
                  <p className="mt-2 text-xs text-gray-500">We'll send you a verification code via SMS</p>
                </div>

                {/* Legal Checkboxes */}
                <div className="space-y-3 pt-4">
                  <label className="flex items-start gap-3 cursor-pointer group">
                    <input
                      type="checkbox"
                      checked={termsAccepted}
                      onChange={(e) => setTermsAccepted(e.target.checked)}
                      className="mt-0.5 w-5 h-5 rounded border-2 border-gray-300 text-emerald-600 focus:ring-2 focus:ring-emerald-500 focus:ring-offset-0 cursor-pointer"
                    />
                    <span className="text-sm text-gray-600 flex-1">
                      I agree to the{' '}
                      <button
                        type="button"
                        onClick={() => openLegalModal('terms')}
                        className="text-emerald-600 hover:text-emerald-700 font-semibold underline"
                      >
                        Terms of Service
                      </button>
                    </span>
                  </label>

                  <label className="flex items-start gap-3 cursor-pointer group">
                    <input
                      type="checkbox"
                      checked={privacyAccepted}
                      onChange={(e) => setPrivacyAccepted(e.target.checked)}
                      className="mt-0.5 w-5 h-5 rounded border-2 border-gray-300 text-emerald-600 focus:ring-2 focus:ring-emerald-500 focus:ring-offset-0 cursor-pointer"
                    />
                    <span className="text-sm text-gray-600 flex-1">
                      I agree to the{' '}
                      <button
                        type="button"
                        onClick={() => openLegalModal('privacy')}
                        className="text-emerald-600 hover:text-emerald-700 font-semibold underline"
                      >
                        Privacy Policy
                      </button>
                    </span>
                  </label>
                </div>

                {/* Send OTP Button */}
                <button
                  onClick={handleSendOtp}
                  disabled={!canContinue || loading}
                  className="w-full h-14 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white font-semibold rounded-2xl transition-all shadow-lg shadow-emerald-500/30 hover:shadow-emerald-500/40 hover:scale-[1.02] active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100 flex items-center justify-center gap-2"
                >
                  {loading ? (
                    <>
                      <Loader2 className="w-5 h-5 animate-spin" />
                      <span>Sending OTP...</span>
                    </>
                  ) : (
                    <>
                      <span>Send OTP</span>
                      <ArrowRight className="w-5 h-5" />
                    </>
                  )}
                </button>

                {/* Alternative Options */}
                <div className="flex items-center gap-3 my-6">
                  <div className="flex-1 h-px bg-gray-200" />
                  <span className="text-xs text-gray-400 font-medium">or</span>
                  <div className="flex-1 h-px bg-gray-200" />
                </div>

                <div className="text-center space-y-3">
                  <Link
                    href="/auth/signup"
                    className="block w-full h-12 flex items-center justify-center gap-2 bg-white hover:bg-gray-50 border-2 border-gray-200 hover:border-gray-300 rounded-xl font-semibold text-gray-700 transition-all"
                  >
                    <Mail className="w-5 h-5" />
                    <span>Sign up with Email</span>
                  </Link>

                  <p className="text-sm text-gray-500">
                    Already have an account?{' '}
                    <Link href="/auth/login" className="font-semibold text-emerald-600 hover:text-emerald-700">
                      Login
                    </Link>
                  </p>
                </div>
              </div>
            )}

            {/* STEP 2: OTP Verification */}
            {step === 'otp' && (
              <div className="space-y-6">
                <div className="text-center mb-6">
                  <div className="w-16 h-16 rounded-full bg-emerald-100 flex items-center justify-center mx-auto mb-4">
                    <Phone className="w-8 h-8 text-emerald-600" />
                  </div>
                  <h1 className="text-2xl font-bold text-gray-900 mb-2">Verify Phone Number</h1>
                  <p className="text-sm text-gray-500">
                    Enter the 6-digit code sent to <strong>{maskedPhone}</strong>
                  </p>
                </div>

                {/* OTP Input */}
                <div className="flex justify-center gap-2 sm:gap-3">
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
                      onPaste={handleOtpPaste}
                      className="w-12 h-14 sm:w-14 sm:h-16 text-center text-2xl font-bold bg-gray-50 border-2 border-gray-200 rounded-xl focus:bg-white focus:border-emerald-500 focus:outline-none transition-all"
                    />
                  ))}
                </div>

                {/* Resend OTP */}
                <div className="text-center">
                  {countdown > 0 ? (
                    <p className="text-sm text-gray-500">
                      Resend OTP in <span className="font-semibold text-emerald-600">{countdown}s</span>
                    </p>
                  ) : (
                    <button
                      onClick={handleResendOtp}
                      disabled={loading}
                      className="text-sm font-semibold text-emerald-600 hover:text-emerald-700 flex items-center gap-2 mx-auto"
                    >
                      <RefreshCw className="w-4 h-4" />
                      <span>Resend OTP</span>
                    </button>
                  )}
                </div>

                {/* Verify Button */}
                <button
                  onClick={handleVerifyOtp}
                  disabled={otp.join('').length !== 6 || loading}
                  className="w-full h-14 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white font-semibold rounded-2xl transition-all shadow-lg shadow-emerald-500/30 hover:shadow-emerald-500/40 hover:scale-[1.02] active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100 flex items-center justify-center gap-2"
                >
                  {loading ? (
                    <>
                      <Loader2 className="w-5 h-5 animate-spin" />
                      <span>Verifying...</span>
                    </>
                  ) : (
                    <>
                      <span>Verify OTP</span>
                      <ArrowRight className="w-5 h-5" />
                    </>
                  )}
                </button>

                <button
                  onClick={() => {
                    setStep('phone')
                    setOtp(['', '', '', '', '', ''])
                    setError('')
                  }}
                  className="w-full text-sm text-gray-500 hover:text-gray-700 flex items-center justify-center gap-2"
                >
                  <ArrowLeft className="w-4 h-4" />
                  <span>Change phone number</span>
                </button>
              </div>
            )}

            {/* STEP 3: Complete Profile */}
            {step === 'profile' && (
              <div className="space-y-6">
                <div className="text-center mb-6">
                  <div className="w-16 h-16 rounded-full bg-emerald-100 flex items-center justify-center mx-auto mb-4">
                    <CheckCircle className="w-8 h-8 text-emerald-600" />
                  </div>
                  <h1 className="text-2xl font-bold text-gray-900 mb-2">Almost There!</h1>
                  <p className="text-sm text-gray-500">Just a few more details to get you started</p>
                </div>

                {/* Full Name */}
                <div>
                  <label className="block text-sm font-semibold text-gray-900 mb-2">
                    Full Name <span className="text-red-500">*</span>
                  </label>
                  <div className="relative">
                    <div className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400">
                      <User className="w-5 h-5" />
                    </div>
                    <input
                      type="text"
                      value={fullName}
                      onChange={(e) => setFullName(e.target.value)}
                      placeholder="Enter your full name"
                      className="w-full h-14 pl-12 pr-4 bg-gray-50 border-2 border-gray-200 rounded-2xl text-base text-gray-900 placeholder-gray-400 focus:bg-white focus:border-emerald-500 focus:outline-none transition-all"
                    />
                  </div>
                </div>

                {/* Email (Optional) */}
                <div>
                  <label className="block text-sm font-semibold text-gray-900 mb-2">
                    Email <span className="text-gray-400 text-xs">(Optional)</span>
                  </label>
                  <div className="relative">
                    <div className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400">
                      <Mail className="w-5 h-5" />
                    </div>
                    <input
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="you@example.com"
                      className="w-full h-14 pl-12 pr-4 bg-gray-50 border-2 border-gray-200 rounded-2xl text-base text-gray-900 placeholder-gray-400 focus:bg-white focus:border-emerald-500 focus:outline-none transition-all"
                    />
                  </div>
                  <p className="mt-2 text-xs text-gray-500">Add email to login with email & password</p>
                </div>

                {/* Password (Optional) */}
                {email && (
                  <div>
                    <label className="block text-sm font-semibold text-gray-900 mb-2">
                      Password <span className="text-gray-400 text-xs">(Optional)</span>
                    </label>
                    <div className="relative">
                      <div className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400">
                        <Lock className="w-5 h-5" />
                      </div>
                      <input
                        type={showPassword ? 'text' : 'password'}
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        placeholder="Create a password (min 8 characters)"
                        className="w-full h-14 pl-12 pr-12 bg-gray-50 border-2 border-gray-200 rounded-2xl text-base text-gray-900 placeholder-gray-400 focus:bg-white focus:border-emerald-500 focus:outline-none transition-all"
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                      >
                        {showPassword ? <Lock className="w-5 h-5" /> : <Lock className="w-5 h-5" />}
                      </button>
                    </div>
                    <p className="mt-2 text-xs text-gray-500">Set a password to login with email & password later</p>
                  </div>
                )}

                {/* Complete Signup Button */}
                <button
                  onClick={handleCompleteSignup}
                  disabled={!fullName.trim() || loading}
                  className="w-full h-14 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white font-semibold rounded-2xl transition-all shadow-lg shadow-emerald-500/30 hover:shadow-emerald-500/40 hover:scale-[1.02] active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100 flex items-center justify-center gap-2"
                >
                  {loading ? (
                    <>
                      <Loader2 className="w-5 h-5 animate-spin" />
                      <span>Creating account...</span>
                    </>
                  ) : (
                    <>
                      <span>Complete Signup</span>
                      <CheckCircle className="w-5 h-5" />
                    </>
                  )}
                </button>

                {/* Info Box */}
                <div className="bg-blue-50 border border-blue-200 rounded-2xl p-4 flex items-start gap-3">
                  <Sparkles className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
                  <div className="text-sm text-blue-900">
                    <p className="font-semibold mb-1">You can add email & password later!</p>
                    <p className="text-blue-700">Skip them now and add from your profile settings anytime.</p>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Trust Badges */}
          <div className="mt-8 flex items-center justify-center gap-6 text-sm text-gray-500">
            <div className="flex items-center gap-2">
              <Shield className="w-4 h-4 text-emerald-600" />
              <span>Secure & Private</span>
            </div>
            <div className="w-px h-4 bg-gray-300" />
            <div className="flex items-center gap-2">
              <Zap className="w-4 h-4 text-emerald-600" />
              <span>2-Min Signup</span>
            </div>
            <div className="w-px h-4 bg-gray-300" />
            <div className="flex items-center gap-2">
              <Clock className="w-4 h-4 text-emerald-600" />
              <span>24/7 Support</span>
            </div>
          </div>
        </div>
      </section>

      {/* Legal Modal */}
      {showLegalModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-3xl shadow-2xl max-w-2xl w-full max-h-[80vh] overflow-hidden">
            <div className="p-6 border-b border-gray-200">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-2xl font-bold text-gray-900">Legal Documents</h2>
                <button
                  onClick={() => setShowLegalModal(false)}
                  className="w-10 h-10 rounded-full hover:bg-gray-100 flex items-center justify-center transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => setActiveTab('terms')}
                  className={`px-4 py-2 rounded-lg font-semibold transition-colors ${
                    activeTab === 'terms'
                      ? 'bg-emerald-600 text-white'
                      : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                  }`}
                >
                  Terms of Service
                </button>
                <button
                  onClick={() => setActiveTab('privacy')}
                  className={`px-4 py-2 rounded-lg font-semibold transition-colors ${
                    activeTab === 'privacy'
                      ? 'bg-emerald-600 text-white'
                      : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                  }`}
                >
                  Privacy Policy
                </button>
              </div>
            </div>
            <div className="p-6 overflow-y-auto max-h-[60vh]">
              {loadingDocs ? (
                <div className="flex items-center justify-center py-12">
                  <Loader2 className="w-8 h-8 animate-spin text-emerald-600" />
                </div>
              ) : (
                <div className="prose prose-sm max-w-none">
                  <ReactMarkdown remarkPlugins={[remarkGfm]}>
                    {activeTab === 'terms' ? terms?.content_md || 'Terms not available' : privacy?.content_md || 'Privacy policy not available'}
                  </ReactMarkdown>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
