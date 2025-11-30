'use client'

import { useState, Suspense, useEffect } from 'react'
import Link from 'next/link'
import { useRouter, useSearchParams } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Sparkles, Eye, EyeOff, CheckCircle, XCircle, Loader2, MapPin } from 'lucide-react'
import { supabase } from '@/lib/supabase/client'
import { createClient } from '@/lib/supabase/client'
import { LegalModal } from '@/components/legal/legal-modal'
import { toast } from 'sonner'

function SignUpForm() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const defaultRole = searchParams.get('role') || 'customer'
  
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    confirmPassword: '',
    fullName: '',
    phone: '',
    countryCode: '+91',
    role: defaultRole as 'customer' | 'helper' | 'admin',
    state: '',
    city: '',
    address: '',
    pincode: '',
  })

  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [detecting, setDetecting] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)
  const [showTerms, setShowTerms] = useState(false)
  const [showPrivacy, setShowPrivacy] = useState(false)

  // Location state
  const [states, setStates] = useState<any[]>([])
  const [cities, setCities] = useState<any[]>([])
  const [loadingStates, setLoadingStates] = useState(false)
  const [loadingCities, setLoadingCities] = useState(false)

  useEffect(() => {
    loadStates()
  }, [])

  const loadStates = async () => {
    setLoadingStates(true)
    const supabase = createClient()
    const { data } = await supabase
      .from('service_areas')
      .select('id, name')
      .eq('level', 'state')
      .eq('is_active', true)
      .order('display_order')
    
    setStates(data || [])
    setLoadingStates(false)
  }

  const loadCities = async (stateName: string) => {
    setLoadingCities(true)
    const supabase = createClient()
    
    // Find state by name
    const state = states.find(s => s.name === stateName)
    if (!state) {
      setLoadingCities(false)
      return [] as any[]
    }

    // First get all districts for this state
    const { data: districts } = await supabase
      .from('service_areas')
      .select('id')
      .eq('parent_id', state.id)
      .eq('level', 'district')
      .eq('is_active', true)

    if (!districts || districts.length === 0) {
      setCities([])
      setLoadingCities(false)
      return [] as any[]
    }

    // Get all cities from all districts
    const districtIds = districts.map(d => d.id)
    const { data } = await supabase
      .from('service_areas')
      .select('id, name')
      .in('parent_id', districtIds)
      .eq('level', 'city')
      .eq('is_active', true)
      .order('name')
    
    setCities(data || [])
    setLoadingCities(false)
    return data || []
  }

  const handleStateChange = (stateName: string) => {
    setFormData({ ...formData, state: stateName, city: '' })
    setCities([])
    if (stateName) {
      loadCities(stateName)
    }
  }

  const detectLocation = async () => {
    setDetecting(true)

    if (!navigator.geolocation) {
      toast.error('Geolocation is not supported by your browser')
      setDetecting(false)
      return
    }

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const { latitude, longitude } = position.coords
        
        try {
          const response = await fetch(`/api/geocode?lat=${latitude}&lng=${longitude}`, { cache: 'no-store' })
          if (response.ok) {
            const geo = await response.json()

            const formattedAddress = geo.formatted_address || ''
            const detectedPincode = geo.pincode || ''
            const detectedState = (geo.state || '').toString()
            const detectedCity = (geo.city || '').toString()

            // Try to auto-select state from service_areas list (case-insensitive)
            let selectedState = formData.state
            if (detectedState) {
              const match = states.find(s => s.name.toLowerCase() === detectedState.toLowerCase())
              if (match) {
                selectedState = match.name
                setFormData(prev => ({ ...prev, state: match.name, city: '' }))
                // Ensure cities are loaded for this state, then set city if matched
                const loaded = await loadCities(match.name)
                if (detectedCity) {
                  const cityMatch = loaded.find((c: any) => c.name.toLowerCase() === detectedCity.toLowerCase())
                  if (cityMatch) {
                    setFormData(prev => ({ ...prev, city: cityMatch.name }))
                  }
                }
              }
            }

            setFormData(prev => ({
              ...prev,
              address: formattedAddress,
              pincode: detectedPincode,
            }))

            if (geo.source === 'nominatim') {
              const { LOCATION_FALLBACK_WARNING } = await import('@/lib/constants')
              toast.warning(LOCATION_FALLBACK_WARNING)
            } else {
              toast.success('✓ Location detected successfully!')
            }
          } else {
            toast.error('Failed to detect location. Please enter manually.')
          }
        } catch (error) {
          console.error('Geocoding error:', error)
          toast.error('Failed to detect location. Please enter manually.')
        }
        
        setDetecting(false)
      },
      () => {
        toast.error('Location permission denied. Please enter manually.')
        setDetecting(false)
      }
    )
  }

  // Password strength validation
  const passwordStrength = {
    hasLength: formData.password.length >= 12,
    hasUpper: /[A-Z]/.test(formData.password),
    hasLower: /[a-z]/.test(formData.password),
    hasNumber: /[0-9]/.test(formData.password),
    hasSpecial: /[!@#$%^&*]/.test(formData.password),
  }

  const passwordMatch = formData.password === formData.confirmPassword && formData.confirmPassword !== ''

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    try {
      // Validate password
      if (!Object.values(passwordStrength).every(Boolean)) {
        throw new Error('Password does not meet strength requirements')
      }

      if (!passwordMatch) {
        throw new Error('Passwords do not match')
      }

      // Validate location fields
      if (!formData.state || !formData.city || !formData.address || !formData.pincode) {
        throw new Error('Please fill in all location fields')
      }

      // Sign up with Supabase
      const { data, error: signUpError } = await supabase.auth.signUp({
        email: formData.email,
        password: formData.password,
        options: {
          data: {
            full_name: formData.fullName,
            phone: formData.phone,
            country_code: formData.countryCode,
            role: formData.role,
            state: formData.state,
            city: formData.city,
            address: formData.address,
            pincode: formData.pincode,
          },
          emailRedirectTo: `${window.location.origin}/auth/confirm`,
        },
      })

      if (signUpError) throw signUpError

      if (data.user) {
        setSuccess(true)
      }
    } catch (err: any) {
      setError(err.message || 'An error occurred during sign up')
    } finally {
      setLoading(false)
    }
  }

  if (success) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 dark:from-slate-900 dark:via-slate-800 dark:to-slate-900 p-4 relative overflow-hidden">
        {/* Logo Watermark Background */}
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          <img 
            src="/logo.jpg" 
            alt="Helparo" 
            className="h-96 w-96 object-contain opacity-[0.03] dark:opacity-[0.02]"
          />
        </div>

        {/* Success Card */}
        <div className="w-full max-w-md relative z-10">
          <div className="bg-white/80 dark:bg-slate-800/80 backdrop-blur-xl border border-white/20 dark:border-slate-700/50 shadow-2xl rounded-2xl p-8">
            <div className="text-center space-y-6">
              <div className="flex justify-center">
                <div className="flex h-16 w-16 items-center justify-center rounded-full bg-gradient-to-br from-green-500 to-emerald-600 text-white shadow-lg">
                  <CheckCircle className="h-8 w-8" />
                </div>
              </div>
              
              <div>
                <h1 className="text-2xl font-bold text-slate-900 dark:text-white mb-2">Check Your Email</h1>
                <p className="text-sm text-slate-600 dark:text-slate-400">
                  We've sent a verification link to <strong className="text-slate-900 dark:text-white">{formData.email}</strong>
                </p>
              </div>

              <p className="text-sm text-slate-600 dark:text-slate-400">
                Please check your email and click the verification link to activate your account.
              </p>

              <Button 
                className="w-full shadow-lg hover:shadow-xl transition-all duration-300" 
                onClick={() => router.push('/auth/login')}
              >
                Go to Login
              </Button>
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 dark:from-slate-900 dark:via-slate-800 dark:to-slate-900 p-4 relative overflow-hidden">
      {/* Logo Watermark Background */}
      <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
        <img 
          src="/logo.jpg" 
          alt="Helparo" 
          className="h-96 w-96 object-contain opacity-[0.03] dark:opacity-[0.02]"
          loading="lazy"
          decoding="async"
        />
      </div>

      {/* Signup Card */}
      <div className="w-full max-w-md relative z-10">
        <div className="bg-white/80 dark:bg-slate-800/80 backdrop-blur-xl border border-white/20 dark:border-slate-700/50 shadow-2xl rounded-2xl p-8">
          {/* Header with Logo */}
          <div className="text-center mb-8">
            <Link href="/" className="inline-flex items-center justify-center gap-2 mb-6 group">
              <div className="relative">
                <img
                  src="/logo.jpg"
                  alt="Helparo"
                  className="h-12 w-12 rounded-xl object-cover shadow-lg group-hover:shadow-xl transition-shadow duration-300"
                  loading="lazy"
                  decoding="async"
                  onError={(e) => {
                    const img = e.currentTarget as HTMLImageElement
                    img.style.display = 'none'
                    const fallback = document.getElementById('signup-logo-fallback')
                    if (fallback) fallback.style.display = 'flex'
                  }}
                />
                <div id="signup-logo-fallback" style={{ display: 'none' }} className="flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-primary to-blue-600 text-white shadow-lg">
                  <Sparkles className="h-7 w-7" />
                </div>
              </div>
              <span className="text-3xl font-bold bg-gradient-to-r from-slate-900 to-slate-700 dark:from-white dark:to-slate-300 bg-clip-text text-transparent">Helparo</span>
            </Link>
            
            <h1 className="text-2xl font-bold text-slate-900 dark:text-white mb-2">Create Your Account</h1>
            <p className="text-sm text-slate-600 dark:text-slate-400">
              Join thousands of customers and helpers
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Role Selection */}
            <div className="space-y-2">
              <Label className="text-slate-700 dark:text-slate-300">I want to</Label>
              <div className="grid grid-cols-2 gap-2">
                <Button
                  type="button"
                  variant={formData.role === 'customer' ? 'default' : 'outline'}
                  className={formData.role === 'customer' ? 'shadow-lg' : 'bg-white/50 dark:bg-slate-700/50'}
                  onClick={() => setFormData({ ...formData, role: 'customer' })}
                >
                  Find Services
                </Button>
                <Button
                  type="button"
                  variant={formData.role === 'helper' ? 'default' : 'outline'}
                  className={formData.role === 'helper' ? 'shadow-lg' : 'bg-white/50 dark:bg-slate-700/50'}
                  onClick={() => setFormData({ ...formData, role: 'helper' })}
                >
                  Offer Services
                </Button>
              </div>
            </div>

            {/* Full Name */}
            <div className="space-y-2">
              <Label htmlFor="fullName" className="text-slate-700 dark:text-slate-300">Full Name</Label>
              <Input
                id="fullName"
                placeholder="John Doe"
                value={formData.fullName}
                onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
                required
                className="bg-white/50 dark:bg-slate-900/50 border-slate-200 dark:border-slate-700 focus:ring-2 focus:ring-primary/50 focus:border-primary transition-all duration-300"
              />
            </div>

            {/* Email */}
            <div className="space-y-2">
              <Label htmlFor="email" className="text-slate-700 dark:text-slate-300">Email</Label>
              <Input
                id="email"
                type="email"
                placeholder="john@example.com"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                required
                className="bg-white/50 dark:bg-slate-900/50 border-slate-200 dark:border-slate-700 focus:ring-2 focus:ring-primary/50 focus:border-primary transition-all duration-300"
              />
            </div>

            {/* Phone with Country Code */}
            <div className="space-y-2">
              <Label htmlFor="phone" className="text-slate-700 dark:text-slate-300">Phone Number</Label>
              <div className="flex gap-2">
                <select
                  className="flex h-10 w-24 rounded-md border border-slate-200 dark:border-slate-700 bg-white/50 dark:bg-slate-900/50 px-3 py-2 text-sm focus:ring-2 focus:ring-primary/50 focus:border-primary transition-all duration-300"
                  value={formData.countryCode}
                  onChange={(e) => setFormData({ ...formData, countryCode: e.target.value })}
                >
                  <option value="+91">+91 (IN)</option>
                  {/* <option value="+1">+1 (US)</option>
                  <option value="+44">+44 (UK)</option>
                  <option value="+61">+61 (AU)</option>
                  <option value="+86">+86 (CN)</option> */}
                </select>
                <Input
                  id="phone"
                  type="tel"
                  placeholder="1234567890"
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  required
                  className="bg-white/50 dark:bg-slate-900/50 border-slate-200 dark:border-slate-700 focus:ring-2 focus:ring-primary/50 focus:border-primary transition-all duration-300"
                />
              </div>
            </div>

            {/* Location Section */}
            <div className="space-y-2 pt-2 border-t border-slate-200 dark:border-slate-700">
              <div className="flex items-center justify-between mb-2">
                <Label className="text-slate-700 dark:text-slate-300">Location Details</Label>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={detectLocation}
                  disabled={detecting}
                  className="text-xs"
                >
                  {detecting ? (
                    <>
                      <Loader2 className="mr-1 h-3 w-3 animate-spin" />
                      Detecting...
                    </>
                  ) : (
                    <>
                      <MapPin className="mr-1 h-3 w-3" />
                      Auto Detect
                    </>
                  )}
                </Button>
              </div>

              {/* State & City Row */}
              <div className="grid grid-cols-2 gap-2">
                <div className="space-y-2">
                  <Label htmlFor="state" className="text-xs text-slate-600 dark:text-slate-400">State *</Label>
                  <select
                    id="state"
                    value={formData.state}
                    onChange={(e) => handleStateChange(e.target.value)}
                    disabled={loadingStates}
                    required
                    className="flex h-10 w-full rounded-md border border-slate-200 dark:border-slate-700 bg-white/50 dark:bg-slate-900/50 px-3 py-2 text-sm focus:ring-2 focus:ring-primary/50 focus:border-primary transition-all duration-300 disabled:opacity-50"
                  >
                    <option value="">{loadingStates ? 'Loading states...' : 'Select State'}</option>
                    {states.map(state => (
                      <option key={state.id} value={state.name}>{state.name}</option>
                    ))}
                  </select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="city" className="text-xs text-slate-600 dark:text-slate-400">City *</Label>
                  <select
                    id="city"
                    value={formData.city}
                    onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                    disabled={!formData.state || loadingCities}
                    required
                    className="flex h-10 w-full rounded-md border border-slate-200 dark:border-slate-700 bg-white/50 dark:bg-slate-900/50 px-3 py-2 text-sm focus:ring-2 focus:ring-primary/50 focus:border-primary transition-all duration-300 disabled:opacity-50"
                  >
                    <option value="">{loadingCities ? 'Loading cities...' : 'Select City'}</option>
                    {cities.map(city => (
                      <option key={city.id} value={city.name}>{city.name}</option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Address */}
              <div className="space-y-2">
                <Label htmlFor="address" className="text-xs text-slate-600 dark:text-slate-400">Address *</Label>
                <Input
                  id="address"
                  placeholder="House no, Street, Area"
                  value={formData.address}
                  onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                  required
                  className="bg-white/50 dark:bg-slate-900/50 border-slate-200 dark:border-slate-700 focus:ring-2 focus:ring-primary/50 focus:border-primary transition-all duration-300"
                />
              </div>

              {/* Pincode */}
              <div className="space-y-2">
                <Label htmlFor="pincode" className="text-xs text-slate-600 dark:text-slate-400">PIN Code *</Label>
                <Input
                  id="pincode"
                  placeholder="500034"
                  value={formData.pincode}
                  onChange={(e) => setFormData({ ...formData, pincode: e.target.value })}
                  required
                  maxLength={6}
                  className="bg-white/50 dark:bg-slate-900/50 border-slate-200 dark:border-slate-700 focus:ring-2 focus:ring-primary/50 focus:border-primary transition-all duration-300"
                />
              </div>
            </div>

            {/* Password */}
            <div className="space-y-2">
              <Label htmlFor="password" className="text-slate-700 dark:text-slate-300">Password</Label>
              <div className="relative">
                <Input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  placeholder="••••••••"
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  required
                  className="bg-white/50 dark:bg-slate-900/50 border-slate-200 dark:border-slate-700 focus:ring-2 focus:ring-primary/50 focus:border-primary transition-all duration-300 pr-10"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 transition-colors"
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
              
              {/* Password Strength Indicators */}
              {formData.password && (
                <div className="space-y-1 text-xs">
                  <PasswordRequirement met={passwordStrength.hasLength} text="At least 12 characters" />
                  <PasswordRequirement met={passwordStrength.hasUpper} text="One uppercase letter" />
                  <PasswordRequirement met={passwordStrength.hasLower} text="One lowercase letter" />
                  <PasswordRequirement met={passwordStrength.hasNumber} text="One number" />
                  <PasswordRequirement met={passwordStrength.hasSpecial} text="One special character (!@#$%^&*)" />
                </div>
              )}
            </div>

            {/* Confirm Password */}
            <div className="space-y-2">
              <Label htmlFor="confirmPassword" className="text-slate-700 dark:text-slate-300">Confirm Password</Label>
              <div className="relative">
                <Input
                  id="confirmPassword"
                  type={showConfirmPassword ? 'text' : 'password'}
                  placeholder="••••••••"
                  value={formData.confirmPassword}
                  onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
                  required
                  className="bg-white/50 dark:bg-slate-900/50 border-slate-200 dark:border-slate-700 focus:ring-2 focus:ring-primary/50 focus:border-primary transition-all duration-300 pr-10"
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 transition-colors"
                >
                  {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
              {formData.confirmPassword && (
                <PasswordRequirement met={passwordMatch} text="Passwords match" />
              )}
            </div>

            {/* Legal consent */}
            <div className="flex items-start space-x-2">
              <input
                type="checkbox"
                id="legalConsent"
                required
                className="mt-1 h-4 w-4 rounded border-slate-300 dark:border-slate-600 focus:ring-2 focus:ring-primary/50"
              />
              <Label htmlFor="legalConsent" className="text-xs leading-tight text-slate-600 dark:text-slate-400">
                I have read and agree to the{' '}
                <Link href="/legal/terms" onClick={(e) => { e.preventDefault(); setShowTerms(true); }} className="text-primary hover:underline">Terms & Conditions</Link>{' '}and{' '}
                <Link href="/legal/privacy" onClick={(e) => { e.preventDefault(); setShowPrivacy(true); }} className="text-primary hover:underline">Privacy Policy</Link>. I understand I may be asked to re-accept if they update.
              </Label>
            </div>

            {/* Error Message */}
            {error && (
              <div className="p-3 text-sm text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg animate-fade-in">
                {error}
              </div>
            )}

            {/* Submit Button */}
            <Button 
              type="submit" 
              className="w-full shadow-lg hover:shadow-xl transition-all duration-300" 
              size="lg" 
              disabled={loading}
            >
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                  Creating Account...
                </>
              ) : (
                'Create Account'
              )}
            </Button>

            {/* Login Link */}
            <p className="text-center text-sm text-slate-600 dark:text-slate-400">
              Already have an account?{' '}
              <Link href="/auth/login" className="text-primary font-medium hover:underline transition-colors">
                Sign In
              </Link>
            </p>
          </form>
        </div>

        {/* Modals */}
        <LegalModal type="terms" open={showTerms} onOpenChange={setShowTerms} />
        <LegalModal type="privacy" open={showPrivacy} onOpenChange={setShowPrivacy} />
      </div>
    </div>
  )
}

function PasswordRequirement({ met, text }: { met: boolean; text: string }) {
  return (
    <div className="flex items-center gap-2">
      {met ? (
        <CheckCircle className="h-3 w-3 text-green-500 dark:text-green-400" />
      ) : (
        <XCircle className="h-3 w-3 text-slate-400 dark:text-slate-500" />
      )}
      <span className={met ? 'text-green-600 dark:text-green-400' : 'text-slate-500 dark:text-slate-400'}>{text}</span>
    </div>
  )
}

export default function SignUpPage() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center">Loading...</div>}>
      <SignUpForm />
    </Suspense>
  )
}
