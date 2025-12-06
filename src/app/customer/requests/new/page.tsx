'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { PaymentProtectionBadge, MoneyBackGuarantee } from '@/components/trust-badges'
import AddressMapSelector from '@/components/address-map-selector'
import { InstantHelperCard } from '@/components/instant-helper-card'
import { createServiceRequest, getServiceCategories } from '@/app/actions/service-requests'
import { AlertCircle, CheckCircle2, MapPin, Calendar, DollarSign, Phone, Zap, Clock, Users } from 'lucide-react'

interface Category { id: string; name: string }

interface InstantHelper {
  id: string
  user_id: string
  instant_booking_price: number
  instant_booking_duration_minutes: number
  auto_accept_enabled: boolean
  response_time_minutes: number
  experience_years: number
  skills: string[]
  profiles: {
    id: string
    full_name: string
    avatar_url: string | null
  }
}

export default function NewRequestPage() {
  const router = useRouter()
  const [categories, setCategories] = useState<Category[]>([])
  const [bookingFlow, setBookingFlow] = useState<'instant' | 'normal'>('instant')
  const [instantHelpers, setInstantHelpers] = useState<InstantHelper[]>([])
  const [selectedHelper, setSelectedHelper] = useState<InstantHelper | null>(null)
  const [loadingHelpers, setLoadingHelpers] = useState(false)
  const [form, setForm] = useState({
    category_id: '',
    title: '',
    description: '',
    address: '',
    city: '',
    state: '',
    pincode: '',
    location_lat: null as number | null,
    location_lng: null as number | null,
    country: 'India',
    phone: '',
    budget_min: '',
    budget_max: '',
    preferred_date: '',
    preferred_time: '',
    urgency: 'normal' as 'instant' | 'normal' | 'flexible',
  })
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  useEffect(() => {
    const load = async () => {
      setLoading(true)
      const result = await getServiceCategories()
      if ('error' in result && result.error) {
        setError('Failed to load categories')
      } else if (result.data) {
        setCategories(result.data)
      }
      setLoading(false)
    }
    load()
  }, [])

  // Fetch instant helpers when category, location, or booking flow changes
  useEffect(() => {
    const fetchInstantHelpers = async () => {
      if (bookingFlow !== 'instant' || !form.category_id) {
        setInstantHelpers([])
        return
      }

      setLoadingHelpers(true)
      setError('') // Clear any previous errors
      try {
        const params = new URLSearchParams({
          category_id: form.category_id,
          ...(form.location_lat && { lat: form.location_lat.toString() }),
          ...(form.location_lng && { lng: form.location_lng.toString() }),
        })

        console.log('🔍 Fetching instant helpers with params:', {
          category_id: form.category_id,
          lat: form.location_lat,
          lng: form.location_lng,
          url: `/api/helpers/instant?${params}`
        })

        const response = await fetch(`/api/helpers/instant?${params}`)
        
        if (!response.ok) {
          throw new Error(`Failed to fetch helpers: ${response.status}`)
        }
        
        const data = await response.json()

        console.log('✅ Instant helpers response:', data)

        if (data.error) {
          throw new Error(data.error)
        }

        setInstantHelpers(data.data || [])
        console.log('📊 Set instant helpers:', data.data?.length || 0)
      } catch (err) {
        console.error('❌ Error fetching instant helpers:', err)
        // Don't show error to user - just show "no helpers available" in the UI
        setInstantHelpers([])
      } finally {
        setLoadingHelpers(false)
      }
    }

    fetchInstantHelpers()
  }, [bookingFlow, form.category_id, form.location_lat, form.location_lng])

  const submit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setSaving(true)
    setSuccess('')
    
    try {
      // Instant booking flow - redirect to payment with selected helper
      if (bookingFlow === 'instant' && selectedHelper) {
        // Store booking details in sessionStorage for payment page
        sessionStorage.setItem('instant_booking', JSON.stringify({
          helper: selectedHelper,
          service_details: {
            category_id: form.category_id,
            title: form.title,
            description: form.description,
            address: form.address,
            city: form.city,
            state: form.state,
            pincode: form.pincode,
            phone: form.phone,
            location_lat: form.location_lat,
            location_lng: form.location_lng,
          },
          price: selectedHelper.instant_booking_price,
          duration: selectedHelper.instant_booking_duration_minutes,
        }))
        
        // Redirect to instant booking confirmation/payment page
        router.push('/customer/bookings/instant-confirm')
        return
      }

      // Normal bidding flow
      if (!form.category_id || !form.title || !form.description) {
        throw new Error('Please fill in all required fields')
      }

      const result = await createServiceRequest({
        category_id: form.category_id,
        title: form.title,
        description: form.description,
        service_address: form.address || undefined,
        city: form.city || undefined,
        state: form.state || undefined,
        pincode: form.pincode || undefined,
        country: form.country || 'India',
        budget_min: form.budget_min ? Number(form.budget_min) : undefined,
        budget_max: form.budget_max ? Number(form.budget_max) : undefined,
        latitude: form.location_lat || undefined,
        longitude: form.location_lng || undefined,
      })

      if ('error' in result && result.error) {
        throw new Error(result.error)
      }

      setSuccess('✅ Request created successfully! Matching helpers will be notified.')
      
      setTimeout(() => {
        router.push('/customer/requests')
      }, 2000)
    } catch (e) {
      const errorMessage = e instanceof Error ? e.message : 'Failed to create request'
      setError(errorMessage)
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800 py-10 px-4">
      <div className="mx-auto max-w-7xl">
        <div className="mb-6">
          <h1 className="text-4xl font-bold bg-gradient-to-r from-purple-600 to-teal-600 bg-clip-text text-transparent">
            Get Help Now
          </h1>
          <p className="mt-2 text-slate-600 dark:text-slate-400">
            Choose instant booking for immediate service or post a request for competitive bids
          </p>
        </div>

        {/* Booking Flow Selector */}
        <Card className="border-2 border-purple-200 mb-6">
          <CardContent className="p-4">
            <div className="grid grid-cols-2 gap-4">
              <button
                type="button"
                onClick={() => setBookingFlow('instant')}
                className={`p-6 rounded-xl border-2 transition-all ${
                  bookingFlow === 'instant'
                    ? 'border-teal-500 bg-gradient-to-br from-teal-50 to-purple-50 shadow-lg shadow-teal-100'
                    : 'border-gray-200 hover:border-teal-300 bg-white'
                }`}
              >
                <div className="flex items-center gap-3 mb-2">
                  <Zap className={`h-8 w-8 ${bookingFlow === 'instant' ? 'text-teal-600' : 'text-gray-400'}`} />
                  <div className="text-left">
                    <div className="text-xl font-black">Instant Booking</div>
                    <div className="text-sm text-gray-600">Book now, start immediately</div>
                  </div>
                </div>
                <div className="flex items-center gap-2 mt-3">
                  <CheckCircle2 className="h-4 w-4 text-green-600" />
                  <span className="text-xs text-gray-600">Fixed price • Auto-confirm • Available now</span>
                </div>
              </button>

              <button
                type="button"
                onClick={() => setBookingFlow('normal')}
                className={`p-6 rounded-xl border-2 transition-all ${
                  bookingFlow === 'normal'
                    ? 'border-purple-500 bg-gradient-to-br from-purple-50 to-teal-50 shadow-lg shadow-purple-100'
                    : 'border-gray-200 hover:border-purple-300 bg-white'
                }`}
              >
                <div className="flex items-center gap-3 mb-2">
                  <Users className={`h-8 w-8 ${bookingFlow === 'normal' ? 'text-purple-600' : 'text-gray-400'}`} />
                  <div className="text-left">
                    <div className="text-xl font-black">Get Quotes</div>
                    <div className="text-sm text-gray-600">Post & receive bids</div>
                  </div>
                </div>
                <div className="flex items-center gap-2 mt-3">
                  <DollarSign className="h-4 w-4 text-purple-600" />
                  <span className="text-xs text-gray-600">Competitive pricing • Multiple options • Compare helpers</span>
                </div>
              </button>
            </div>
          </CardContent>
        </Card>

        <div className="grid lg:grid-cols-2 gap-6">
          {/* Left: Service Request Form */}
          <Card className="border-slate-200 dark:border-slate-700">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <MapPin className="h-5 w-5 text-purple-600" />
                {bookingFlow === 'instant' ? 'Service Details' : 'Request Details'}
              </CardTitle>
            </CardHeader>
            <CardContent>
              {error && (
                <div className="mb-4 rounded-lg border border-red-300 bg-red-50 dark:bg-red-900/20 p-4 flex gap-2">
                  <AlertCircle className="h-5 w-5 text-red-600 dark:text-red-400 flex-shrink-0" />
                  <p className="text-sm text-red-700 dark:text-red-400">{error}</p>
                </div>
              )}
              {success && (
                <div className="mb-4 rounded-lg border border-green-300 bg-green-50 dark:bg-green-900/20 p-4">
                  <div className="flex gap-2 mb-2">
                    <CheckCircle2 className="h-5 w-5 text-green-600 dark:text-green-400 flex-shrink-0" />
                    <p className="text-sm font-medium text-green-900 dark:text-green-400">{success}</p>
                  </div>
                </div>
              )}
              {loading ? (
                <p className="text-sm text-slate-500">Loading categories...</p>
              ) : (
                <form onSubmit={submit} className="space-y-6">
                  {/* Category Selection */}
                  <div className="space-y-2">
                    <Label htmlFor="category" className="text-sm font-medium">
                      Service Category *
                    </Label>
                    <select
                      id="category"
                      className="h-11 w-full rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 text-sm focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                      value={form.category_id}
                      onChange={(e) => {
                        setForm({ ...form, category_id: e.target.value })
                        setSelectedHelper(null) // Reset helper selection when category changes
                      }}
                      required
                    >
                      <option value="">Select a category</option>
                      {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                    </select>
                  </div>

                  {/* Title - Only required for normal flow */}
                  {bookingFlow === 'normal' && (
                    <div className="space-y-2">
                      <Label htmlFor="title" className="text-sm font-medium">
                        Service Title *
                      </Label>
                      <Input 
                        id="title" 
                        placeholder="e.g., Fix leaking kitchen faucet"
                        value={form.title} 
                        onChange={(e) => setForm({ ...form, title: e.target.value })} 
                        required={bookingFlow === 'normal'}
                        className="h-11"
                      />
                    </div>
                  )}

                  {/* Description */}
                  <div className="space-y-2">
                    <Label htmlFor="description" className="text-sm font-medium">
                      Description {bookingFlow === 'normal' ? '*' : '(Optional)'}
                    </Label>
                    <textarea
                      id="description"
                      placeholder="Describe what you need help with in detail..."
                      className="min-h-[120px] w-full rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 py-2 text-sm focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                      value={form.description}
                      onChange={(e) => setForm({ ...form, description: e.target.value })}
                      required={bookingFlow === 'normal'}
                    />
                  </div>

                  {/* Location - Map First */}
                  <div className="space-y-4">
                    <Label className="text-sm font-medium flex items-center gap-2">
                      <MapPin className="h-4 w-4 text-purple-600" />
                      Service Location *
                    </Label>
                    <div className="space-y-3">
                      <AddressMapSelector
                        value={form.address}
                        onChange={(value) => setForm({ ...form, address: value })}
                        onAddressSelect={(selected) => {
                          const addressParts = selected.display_name.split(',').map(p => p.trim())
                          const formattedAddress = addressParts.slice(1, 3).join(', ')
                          
                          setForm({
                            ...form,
                            address: formattedAddress || selected.display_name,
                            city: selected.city || '',
                            state: selected.state || '',
                            pincode: selected.pincode || '',
                            location_lat: selected.lat,
                            location_lng: selected.lng,
                          })
                          setSelectedHelper(null) // Reset helper when location changes
                        }}
                        placeholder="Search address or click on map to select location"
                      />
                      
                      {form.location_lat && form.location_lng && (
                        <div className="flex items-center gap-2 text-xs text-gray-600 bg-purple-50 border border-purple-200 rounded-lg px-3 py-2">
                          <MapPin className="h-3 w-3 text-purple-600" />
                          <span>Location: {form.location_lat.toFixed(6)}, {form.location_lng.toFixed(6)}</span>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* City, State, Pincode - Auto-filled but editable */}
                  <div className="grid grid-cols-3 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="city" className="text-sm font-medium">City</Label>
                      <Input 
                        id="city" 
                        value={form.city} 
                        onChange={(e) => setForm({ ...form, city: e.target.value })} 
                        placeholder="City"
                        className="bg-white border-gray-200 focus:border-purple-500 focus:ring-purple-100"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="state" className="text-sm font-medium">State</Label>
                      <Input 
                        id="state" 
                        value={form.state} 
                        onChange={(e) => setForm({ ...form, state: e.target.value })} 
                        placeholder="State"
                        className="bg-white border-gray-200 focus:border-purple-500 focus:ring-purple-100"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="pincode" className="text-sm font-medium">Pincode</Label>
                      <Input 
                        id="pincode" 
                        value={form.pincode} 
                        onChange={(e) => setForm({ ...form, pincode: e.target.value })} 
                        placeholder="Pincode"
                        className="bg-white border-gray-200 focus:border-purple-500 focus:ring-purple-100"
                      />
                    </div>
                  </div>

                  {/* Phone Number */}
                  <div className="space-y-2">
                    <Label htmlFor="phone" className="text-sm font-medium flex items-center gap-2">
                      <Phone className="h-4 w-4 text-purple-600" />
                      Contact Phone Number *
                    </Label>
                    <Input 
                      id="phone"
                      type="tel"
                      placeholder="+91 1234567890"
                      value={form.phone} 
                      onChange={(e) => setForm({ ...form, phone: e.target.value })} 
                      required
                      className="h-11 bg-white border-gray-200 focus:border-purple-500 focus:ring-purple-100"
                    />
                    <p className="text-xs text-gray-500">Helpers will contact you on this number</p>
                  </div>

                  {/* Budget - Only for normal flow */}
                  {bookingFlow === 'normal' && (
                    <div className="space-y-2">
                      <Label className="text-sm font-medium flex items-center gap-2">
                        <DollarSign className="h-4 w-4 text-purple-600" />
                        Budget Range (₹) <span className="text-gray-400 text-xs font-normal">(Optional)</span>
                      </Label>
                      <div className="grid grid-cols-2 gap-4">
                        <Input 
                          id="budget_min" 
                          type="number" 
                          min={0} 
                          placeholder="Min ₹"
                          value={form.budget_min} 
                          onChange={(e) => setForm({ ...form, budget_min: e.target.value })} 
                          className="bg-white border-gray-200 focus:border-purple-500 focus:ring-purple-100"
                        />
                        <Input 
                          id="budget_max" 
                          type="number" 
                          min={0} 
                          placeholder="Max ₹"
                          value={form.budget_max} 
                          onChange={(e) => setForm({ ...form, budget_max: e.target.value })} 
                          className="bg-white border-gray-200 focus:border-purple-500 focus:ring-purple-100"
                        />
                      </div>
                      <p className="text-xs text-gray-500">Leave empty if you want helpers to quote their rates</p>
                    </div>
                  )}

                  {/* Urgency Level - Only for normal flow */}
                  {bookingFlow === 'normal' && (
                    <>
                      <div className="space-y-2">
                        <Label className="text-sm font-medium flex items-center gap-2">
                          <Zap className="h-4 w-4 text-purple-600" />
                          When do you need this? *
                        </Label>
                        <div className="grid grid-cols-3 gap-3">
                          <button
                            type="button"
                            onClick={() => setForm({ ...form, urgency: 'instant' })}
                            className={`p-4 rounded-xl border-2 transition-all ${
                              form.urgency === 'instant'
                                ? 'border-red-500 bg-red-50 shadow-lg shadow-red-100'
                                : 'border-gray-200 hover:border-red-300'
                            }`}
                          >
                            <Zap className={`h-6 w-6 mx-auto mb-2 ${form.urgency === 'instant' ? 'text-red-600' : 'text-gray-400'}`} />
                            <div className="text-sm font-bold">Urgent</div>
                            <div className="text-xs text-gray-500">ASAP / Today</div>
                          </button>
                          <button
                            type="button"
                            onClick={() => setForm({ ...form, urgency: 'normal' })}
                            className={`p-4 rounded-xl border-2 transition-all ${
                              form.urgency === 'normal'
                                ? 'border-purple-500 bg-purple-50 shadow-lg shadow-purple-100'
                                : 'border-gray-200 hover:border-purple-300'
                            }`}
                          >
                            <Calendar className={`h-6 w-6 mx-auto mb-2 ${form.urgency === 'normal' ? 'text-purple-600' : 'text-gray-400'}`} />
                            <div className="text-sm font-bold">Normal</div>
                            <div className="text-xs text-gray-500">This week</div>
                          </button>
                          <button
                            type="button"
                            onClick={() => setForm({ ...form, urgency: 'flexible' })}
                            className={`p-4 rounded-xl border-2 transition-all ${
                              form.urgency === 'flexible'
                                ? 'border-green-500 bg-green-50 shadow-lg shadow-green-100'
                                : 'border-gray-200 hover:border-green-300'
                            }`}
                          >
                            <Calendar className={`h-6 w-6 mx-auto mb-2 ${form.urgency === 'flexible' ? 'text-green-600' : 'text-gray-400'}`} />
                            <div className="text-sm font-bold">Flexible</div>
                            <div className="text-xs text-gray-500">Anytime</div>
                          </button>
                        </div>
                      </div>

                      {/* Preferred Schedule - Only show if not instant */}
                      {form.urgency !== 'instant' && (
                        <div className="space-y-2">
                          <Label className="text-sm font-medium flex items-center gap-2">
                            <Calendar className="h-4 w-4 text-purple-600" />
                            Preferred Schedule <span className="text-gray-400 text-xs font-normal">(Optional)</span>
                          </Label>
                          <div className="grid grid-cols-2 gap-4">
                            <Input 
                              type="date" 
                              value={form.preferred_date} 
                              onChange={(e) => setForm({ ...form, preferred_date: e.target.value })} 
                              min={new Date().toISOString().split('T')[0]}
                              className="bg-white border-gray-200 focus:border-purple-500 focus:ring-purple-100"
                            />
                            <Input 
                              type="time" 
                              value={form.preferred_time} 
                              onChange={(e) => setForm({ ...form, preferred_time: e.target.value })} 
                              className="bg-white border-gray-200 focus:border-purple-500 focus:ring-purple-100"
                            />
                          </div>
                        </div>
                      )}
                    </>
                  )}

                  {/* Submit Button */}
                  <Button 
                    type="submit" 
                    disabled={saving || (bookingFlow === 'instant' && !selectedHelper)}
                    className="w-full h-12 text-base bg-gradient-to-r from-purple-600 to-teal-600 hover:from-purple-700 hover:to-teal-700 font-bold shadow-lg shadow-purple-500/30"
                  >
                    {saving ? (
                      'Processing...'
                    ) : bookingFlow === 'instant' ? (
                      selectedHelper ? (
                        <>Proceed to Payment - ₹{selectedHelper.instant_booking_price}</>
                      ) : (
                        'Select a Helper First'
                      )
                    ) : (
                      'Post Request & Get Quotes'
                    )}
                  </Button>
                </form>
              )}

              {/* Trust Badges */}
              <div className="mt-6 pt-6 border-t border-slate-200 dark:border-slate-700 space-y-4">
                <PaymentProtectionBadge />
                <MoneyBackGuarantee />
              </div>
            </CardContent>
          </Card>

          {/* Right: Instant Helpers List (Only shown in instant mode) */}
          {bookingFlow === 'instant' && (
            <Card className="border-slate-200 dark:border-slate-700">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Zap className="h-5 w-5 text-teal-600" />
                  Available Helpers
                  {instantHelpers.length > 0 && (
                    <Badge className="ml-2 bg-teal-100 text-teal-700">
                      {instantHelpers.length} available
                    </Badge>
                  )}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {!form.category_id ? (
                  <div className="text-center py-8 text-gray-500">
                    <Clock className="h-12 w-12 mx-auto mb-3 text-gray-300" />
                    <p className="text-sm">Select a service category to see available helpers</p>
                  </div>
                ) : loadingHelpers ? (
                  <div className="text-center py-8">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-teal-600 mx-auto mb-3"></div>
                    <p className="text-sm text-gray-500">Finding available helpers...</p>
                  </div>
                ) : instantHelpers.length === 0 ? (
                  <div className="text-center py-8">
                    <Users className="h-12 w-12 mx-auto mb-3 text-gray-300" />
                    <p className="text-sm text-gray-600 font-medium mb-1">No instant helpers available</p>
                    <p className="text-xs text-gray-500">Try posting a request to get quotes instead</p>
                    <Button
                      type="button"
                      onClick={() => setBookingFlow('normal')}
                      variant="outline"
                      className="mt-4"
                    >
                      Switch to Get Quotes
                    </Button>
                  </div>
                ) : (
                  <div className="space-y-3 max-h-[calc(100vh-300px)] overflow-y-auto pr-2">
                    {instantHelpers.map((helper) => (
                      <InstantHelperCard
                        key={helper.id}
                        helper={helper}
                        selected={selectedHelper?.id === helper.id}
                        onSelect={setSelectedHelper}
                      />
                    ))}
                  </div>
                )}

                {instantHelpers.length > 0 && (
                  <div className="pt-4 border-t border-gray-200">
                    <div className="flex items-start gap-2 text-xs text-gray-600">
                      <CheckCircle2 className="h-4 w-4 text-green-500 flex-shrink-0 mt-0.5" />
                      <div>
                        <p className="font-medium mb-1">Instant Booking Benefits:</p>
                        <ul className="space-y-1 ml-1">
                          <li>• Fixed prices - no haggling needed</li>
                          <li>• Verified & experienced helpers</li>
                          <li>• Quick confirmation & service start</li>
                          <li>• Payment protection guarantee</li>
                        </ul>
                      </div>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  )
}
