'use client'

import { useState, useEffect } from 'react'
import { auth, RecaptchaVerifier, signInWithPhoneNumber, ConfirmationResult } from '@/lib/firebase'

// TEST PHONE NUMBERS - Add these in Firebase Console
const TEST_NUMBERS = [
  { phone: '+919555512345', code: '123456' },
  { phone: '+919555567890', code: '654321' },
]

export default function FirebaseOTPTest() {
  const [phone, setPhone] = useState('+919555512345')
  const [otp, setOtp] = useState('123456')
  const [status, setStatus] = useState<string[]>([])
  const [confirmationResult, setConfirmationResult] = useState<ConfirmationResult | null>(null)
  const [verifier, setVerifier] = useState<RecaptchaVerifier | null>(null)
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState(false)

  const log = (msg: string) => {
    console.log(msg)
    setStatus(prev => [...prev, `${new Date().toLocaleTimeString()}: ${msg}`])
  }

  useEffect(() => {
    log('🚀 Page loaded')
    log(`📍 Current URL: ${window.location.href}`)
    log(`🔑 Firebase Auth ready: ${!!auth}`)
    log(`⚙️ Test mode: ${auth.settings?.appVerificationDisabledForTesting ? 'ENABLED' : 'DISABLED'}`)
    
    if (window.location.hostname === 'localhost') {
      log('⚠️ LOCALHOST DETECTED - You MUST use test phone numbers!')
      log('📋 Add test numbers in Firebase Console → Authentication → Phone')
    }
  }, [])

  const setupRecaptcha = async () => {
    try {
      log('🔧 Setting up reCAPTCHA...')
      
      const container = document.getElementById('recaptcha-test')
      if (container) container.innerHTML = ''
      
      if (verifier) {
        try { verifier.clear() } catch (e) { /* ignore */ }
      }

      const newVerifier = new RecaptchaVerifier(auth, 'recaptcha-test', {
        size: 'invisible',
        callback: () => log('✅ reCAPTCHA auto-solved (test mode)'),
        'expired-callback': () => log('⏰ reCAPTCHA expired')
      })

      setVerifier(newVerifier)
      log('✅ reCAPTCHA ready!')
      return newVerifier
    } catch (err: unknown) {
      const error = err as { code?: string; message?: string }
      log(`❌ reCAPTCHA error: ${error.message}`)
      return null
    }
  }

  const sendOTP = async () => {
    setLoading(true)
    setSuccess(false)
    try {
      log(`📤 Sending OTP to ${phone}...`)
      
      let v = verifier
      if (!v) {
        v = await setupRecaptcha()
        if (!v) {
          log('❌ Failed to setup reCAPTCHA')
          setLoading(false)
          return
        }
      }

      const result = await signInWithPhoneNumber(auth, phone, v)
      setConfirmationResult(result)
      log('✅ OTP sent! Enter verification code.')
    } catch (err: unknown) {
      const error = err as { code?: string; message?: string }
      log(`❌ Error: ${error.code} - ${error.message}`)
      
      if (error.code === 'auth/invalid-phone-number') {
        log('💡 Make sure the phone number includes country code (+91...)')
      } else if (error.code === 'auth/argument-error') {
        log('💡 This phone number is NOT a test number in Firebase Console')
        log('💡 On localhost, only test phone numbers work!')
      } else if (error.code?.includes('captcha') || error.code?.includes('recaptcha')) {
        log('💡 reCAPTCHA issue - try refreshing the page')
      }
    }
    setLoading(false)
  }

  const verifyOTP = async () => {
    if (!confirmationResult) {
      log('⚠️ Send OTP first')
      return
    }
    setLoading(true)
    try {
      log(`🔐 Verifying OTP: ${otp}...`)
      const result = await confirmationResult.confirm(otp)
      log(`🎉 SUCCESS! User signed in: ${result.user.phoneNumber}`)
      setSuccess(true)
    } catch (err: unknown) {
      const error = err as { code?: string; message?: string }
      log(`❌ Verify error: ${error.code} - ${error.message}`)
      if (error.code === 'auth/invalid-verification-code') {
        log('💡 Wrong OTP code. For test numbers, use the code you set in Firebase Console.')
      }
    }
    setLoading(false)
  }

  return (
    <div className="min-h-screen bg-gray-100 p-8">
      <div className="max-w-2xl mx-auto">
        <h1 className="text-3xl font-bold mb-2">🔥 Firebase Phone OTP Test</h1>
        <p className="text-gray-600 mb-6">Test page for debugging Firebase Phone Auth on localhost</p>
        
        {/* Important Notice */}
        <div className="bg-red-100 border-2 border-red-400 rounded-lg p-4 mb-6">
          <h3 className="font-bold text-red-800 text-lg mb-2">⚠️ IMPORTANT: Localhost Limitation</h3>
          <p className="text-red-700 mb-2">
            Firebase Phone Auth does <strong>NOT</strong> work with real phone numbers on localhost.
            You must use <strong>test phone numbers</strong> configured in Firebase Console.
          </p>
          <ol className="text-red-700 text-sm list-decimal list-inside space-y-1">
            <li>Go to <a href="https://console.firebase.google.com" target="_blank" className="underline">Firebase Console</a></li>
            <li>Select your project (helparo-firebase)</li>
            <li>Go to Authentication → Sign-in method → Phone</li>
            <li>Scroll down to "Phone numbers for testing"</li>
            <li>Add: <code className="bg-red-200 px-1">+919555512345</code> with code <code className="bg-red-200 px-1">123456</code></li>
          </ol>
        </div>

        {/* Quick Fill Test Numbers */}
        <div className="bg-white rounded-lg shadow p-6 mb-6">
          <h2 className="text-xl font-semibold mb-4">📋 Test Numbers (click to use)</h2>
          <div className="flex gap-2 flex-wrap">
            {TEST_NUMBERS.map((t, i) => (
              <button
                key={i}
                onClick={() => { setPhone(t.phone); setOtp(t.code); log(`Selected test: ${t.phone} / ${t.code}`) }}
                className="bg-gray-100 hover:bg-gray-200 px-3 py-2 rounded text-sm"
              >
                {t.phone} → {t.code}
              </button>
            ))}
          </div>
        </div>

        {/* Send OTP */}
        <div className="bg-white rounded-lg shadow p-6 mb-6">
          <h2 className="text-xl font-semibold mb-4">Step 1: Send OTP</h2>
          <input
            type="tel"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            placeholder="+919555512345"
            className="w-full border-2 rounded px-4 py-3 mb-4 text-lg"
          />
          <button 
            onClick={sendOTP}
            className="w-full bg-emerald-500 text-white px-4 py-3 rounded-lg hover:bg-emerald-600 font-semibold disabled:opacity-50"
            disabled={loading}
          >
            {loading ? '⏳ Sending...' : '📤 Send OTP'}
          </button>
          <div id="recaptcha-test"></div>
        </div>

        {/* Verify OTP */}
        <div className="bg-white rounded-lg shadow p-6 mb-6">
          <h2 className="text-xl font-semibold mb-4">Step 2: Verify OTP</h2>
          <input
            type="text"
            value={otp}
            onChange={(e) => setOtp(e.target.value)}
            placeholder="123456"
            maxLength={6}
            className="w-full border-2 rounded px-4 py-3 mb-4 text-lg text-center tracking-widest"
          />
          <button 
            onClick={verifyOTP}
            className={`w-full px-4 py-3 rounded-lg font-semibold disabled:opacity-50 ${
              success ? 'bg-green-500 text-white' : 'bg-blue-500 text-white hover:bg-blue-600'
            }`}
            disabled={loading || !confirmationResult}
          >
            {success ? '✅ Verified!' : loading ? '⏳ Verifying...' : '🔐 Verify OTP'}
          </button>
        </div>

        {/* Debug Log */}
        <div className="bg-gray-900 text-green-400 rounded-lg p-4 font-mono text-sm max-h-80 overflow-y-auto">
          <h3 className="text-white font-bold mb-2">📟 Debug Log:</h3>
          {status.length === 0 && <div className="text-gray-500">Waiting for actions...</div>}
          {status.map((s, i) => (
            <div key={i} className={s.includes('❌') ? 'text-red-400' : s.includes('✅') || s.includes('🎉') ? 'text-green-400' : ''}>{s}</div>
          ))}
        </div>
      </div>
    </div>
  )
}
