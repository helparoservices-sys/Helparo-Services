'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
import AddressInteractiveMap from '@/components/address-interactive-map'
import { 
  Upload, 
  Brain, 
  IndianRupee, 
  Clock, 
  AlertTriangle, 
  CheckCircle2,
  Loader2,
  Sparkles,
  X,
  Image as ImageIcon,
  MapPin
} from 'lucide-react'
import { toast } from 'sonner'

interface AIAnalysis {
  estimatedPrice: number
  estimatedDuration: number
  severity: 'low' | 'medium' | 'high' | 'critical'
  requiredSkills: string[]
  materialsNeeded: string[]
  urgency: 'normal' | 'urgent' | 'emergency'
  description: string
  confidence: number
}

type PriceTier = 'budget' | 'standard' | 'priority'

export default function AIRequestPage() {
  const router = useRouter()
  const [step, setStep] = useState<'upload' | 'analysis' | 'review'>('upload')
  const [images, setImages] = useState<string[]>([])
  const [description, setDescription] = useState('')
  const [errorCode, setErrorCode] = useState('')
  const [problemDuration, setProblemDuration] = useState('')
  const [previousAttempts, setPreviousAttempts] = useState('')
  const [preferredTime, setPreferredTime] = useState('')
  const [categoryId, setCategoryId] = useState('')
  const [address, setAddress] = useState('')
  const [flatNumber, setFlatNumber] = useState('')
  const [floor, setFloor] = useState('')
  const [landmark, setLandmark] = useState('')
  const [locationLat, setLocationLat] = useState<number | null>(null)
  const [locationLng, setLocationLng] = useState<number | null>(null)
  const [analyzing, setAnalyzing] = useState(false)
  const [aiAnalysis, setAiAnalysis] = useState<AIAnalysis | null>(null)
  const [selectedTier, setSelectedTier] = useState<PriceTier>('standard')

  const [broadcasting, setBroadcasting] = useState(false)

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files
    if (!files) return

    if (images.length >= 5) {
      toast.error('Maximum 5 images allowed')
      return
    }

    const readers: Promise<string>[] = []
    
    Array.from(files).forEach((file) => {
      const reader = new FileReader()
      const promise = new Promise<string>((resolve) => {
        reader.onloadend = () => {
          resolve(reader.result as string)
        }
        reader.readAsDataURL(file)
      })
      readers.push(promise)
    })

    Promise.all(readers).then((results) => {
      setImages((prev) => [...prev, ...results].slice(0, 5)) // Max 5 images
      toast.success(`${results.length} image(s) uploaded`)
    })
  }

  const removeImage = (index: number) => {
    setImages((prev) => prev.filter((_, i) => i !== index))
    toast.success('Image removed')
  }

  const getPriceForTier = (basePrice: number, tier: PriceTier): number => {
    switch (tier) {
      case 'budget':
        return Math.round(basePrice * 0.85); // -15%
      case 'standard':
        return basePrice;
      case 'priority':
        return Math.round(basePrice * 1.15); // +15%
      default:
        return basePrice;
    }
  }

  const analyzeWithAI = async () => {
    console.log('🔍 Analyze button clicked!')
    console.log('Images:', images.length)
    console.log('Description:', description)
    console.log('CategoryId:', categoryId)
    console.log('Address:', address)
    
    if (images.length < 3) {
      toast.error('Please upload at least 3 images (minimum required)')
      return
    }
    if (!description.trim()) {
      toast.error('Please describe the problem in detail')
      return
    }
    if (!categoryId) {
      toast.error('Please select a service category')
      return
    }

    setAnalyzing(true)
    console.log('✅ Starting AI analysis...')
    try {
      const response = await fetch('/api/ai/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          images,
          description,
          errorCode: errorCode || 'N/A',
          problemDuration,
          previousAttempts,
          preferredTime,
          categoryId: categoryId,
          categoryName: getCategoryName(categoryId),
          location: 'Visakhapatnam, Andhra Pradesh',
        }),
      })

      console.log('📡 API Response status:', response.status)
      const data = await response.json()
      console.log('📦 API Response data:', data)

      if (!response.ok) {
        console.error('❌ API Error:', data.error)
        throw new Error(data.error || 'AI analysis failed')
      }

      console.log('✅ AI Analysis successful!')
      setAiAnalysis(data.analysis)
      setStep('analysis')
      toast.success('AI analysis completed!')
    } catch (error: any) {
      console.error('❌ AI analysis error:', error)
      console.error('Error message:', error.message)
      toast.error(error.message || 'Failed to analyze images')
    } finally {
      setAnalyzing(false)
      console.log('🏁 Analysis complete, analyzing set to false')
    }
  }

  const getCategoryName = (id: string): string => {
    const categories: Record<string, string> = {
      'electrical': 'Electrical',
      'plumbing': 'Plumbing',
      'ac_repair': 'AC & Appliance Repair',
      'carpentry': 'Carpentry',
      'painting': 'Painting',
      'cleaning': 'Cleaning',
      'pest_control': 'Pest Control',
      'home_repair': 'Home Repair & Maintenance',
      'locksmith': 'Locksmith',
      'gardening': 'Gardening & Landscaping',
      'moving': 'Moving & Packing',
      'other': 'Other'
    }
    return categories[id] || 'General Service'
  }

  const broadcastToHelpers = async () => {
    if (!aiAnalysis) {
      toast.error('Please complete AI analysis first')
      return
    }

    setBroadcasting(true)
    
    try {
      const response = await fetch('/api/requests/broadcast', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          categoryId,
          categoryName: getCategoryName(categoryId),
          description,
          address,
          flatNumber,
          floor,
          landmark,
          locationLat,
          locationLng,
          images,
          aiAnalysis,
          selectedTier,
          estimatedPrice: getPriceForTier(aiAnalysis.estimatedPrice, selectedTier),
          urgency: aiAnalysis.urgency,
          problemDuration,
          errorCode,
          preferredTime
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Failed to broadcast request')
      }

      // Show success with number of helpers notified
      toast.success(
        <div className="flex flex-col gap-1">
          <span className="font-bold">🎉 Request Broadcasted!</span>
          <span>Notified {data.helpersNotified} qualified {getCategoryName(categoryId)} helpers</span>
          {data.helpersNotified > 0 && (
            <span className="text-xs text-gray-600">They will respond soon!</span>
          )}
        </div>,
        { duration: 5000 }
      )

      setStep('review')
      
      // Redirect after showing success
      setTimeout(() => {
        router.push('/customer/requests')
      }, 3000)

    } catch (error: any) {
      console.error('Broadcast error:', error)
      toast.error(error.message || 'Failed to broadcast request')
    } finally {
      setBroadcasting(false)
    }
  }

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'low': return 'bg-green-100 text-green-700';
      case 'medium': return 'bg-yellow-100 text-yellow-700';
      case 'high': return 'bg-orange-100 text-orange-700';
      case 'critical': return 'bg-red-100 text-red-700';
      default: return 'bg-gray-100 text-gray-700';
    }
  }

  const getUrgencyColor = (urgency: string) => {
    switch (urgency) {
      case 'normal': return 'bg-blue-100 text-blue-700';
      case 'urgent': return 'bg-orange-100 text-orange-700';
      case 'emergency': return 'bg-red-100 text-red-700';
      default: return 'bg-gray-100 text-gray-700';
    }
  }

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="p-3 bg-gradient-to-br from-purple-500 via-pink-500 to-teal-500 rounded-2xl shadow-lg animate-pulse">
          <Brain className="h-8 w-8 text-white" />
        </div>
        <div>
          <h1 className="text-3xl font-bold bg-gradient-to-r from-purple-600 via-pink-600 to-teal-600 bg-clip-text text-transparent">AI-Powered Service Request</h1>
          <p className="text-gray-600 flex items-center gap-2">
            <Sparkles className="h-4 w-4 text-yellow-500" />
            Upload photos, get instant pricing, notify all helpers
          </p>
        </div>
      </div>

      {/* Progress Steps - Enhanced */}
      <div className="bg-gradient-to-r from-purple-50 via-white to-teal-50 rounded-2xl p-6 shadow-md border border-purple-100">
        <div className="flex items-center justify-center gap-4">
          <div className={`flex items-center gap-2 ${step === 'upload' ? 'text-purple-600' : 'text-gray-400'}`}>
            <div className={`w-12 h-12 rounded-full flex items-center justify-center font-bold text-lg transition-all duration-300 ${
              step === 'upload' ? 'bg-gradient-to-br from-purple-500 to-pink-500 text-white shadow-lg scale-110' : 'bg-gray-200'
            }`}>
              {step === 'upload' ? <Upload className="h-5 w-5" /> : '1'}
            </div>
            <span className="font-semibold hidden sm:inline">Upload</span>
          </div>
          <div className={`w-20 h-1.5 rounded-full ${step !== 'upload' ? 'bg-gradient-to-r from-purple-400 to-teal-400' : 'bg-gray-200'}`} />
          <div className={`flex items-center gap-2 ${step === 'analysis' ? 'text-teal-600' : 'text-gray-400'}`}>
            <div className={`w-12 h-12 rounded-full flex items-center justify-center font-bold text-lg transition-all duration-300 ${
              step === 'analysis' ? 'bg-gradient-to-br from-teal-500 to-cyan-500 text-white shadow-lg scale-110' : 'bg-gray-200'
            }`}>
              {step === 'analysis' ? <Brain className="h-5 w-5" /> : '2'}
            </div>
            <span className="font-semibold hidden sm:inline">AI Analysis</span>
          </div>
          <div className={`w-20 h-1.5 rounded-full ${step === 'review' ? 'bg-gradient-to-r from-teal-400 to-green-400' : 'bg-gray-200'}`} />
          <div className={`flex items-center gap-2 ${step === 'review' ? 'text-green-600' : 'text-gray-400'}`}>
            <div className={`w-12 h-12 rounded-full flex items-center justify-center font-bold text-lg transition-all duration-300 ${
              step === 'review' ? 'bg-gradient-to-br from-green-500 to-emerald-500 text-white shadow-lg scale-110' : 'bg-gray-200'
            }`}>
              {step === 'review' ? <CheckCircle2 className="h-5 w-5" /> : '3'}
            </div>
            <span className="font-semibold hidden sm:inline">Broadcast</span>
          </div>
        </div>
      </div>

      {/* Step 1: Upload */}
      {step === 'upload' && (
        <Card className="border-0 shadow-xl bg-gradient-to-br from-white via-purple-50/30 to-teal-50/30">
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-3 text-xl">
              <div className="p-2 bg-gradient-to-br from-purple-500 to-pink-500 rounded-xl shadow-md">
                <Upload className="h-5 w-5 text-white" />
              </div>
              <span className="bg-gradient-to-r from-purple-700 to-pink-600 bg-clip-text text-transparent font-bold">
                Upload Problem Details
              </span>
            </CardTitle>
            <p className="text-sm text-gray-600 mt-1 ml-12">
              ✨ Provide detailed information for accurate AI-powered pricing
            </p>
          </CardHeader>
          <CardContent className="space-y-8 pt-4">
            {/* Image Upload - Enhanced */}
            <div className="bg-gradient-to-br from-violet-50 to-purple-50 rounded-2xl p-6 border-2 border-purple-200">
              <Label className="text-lg font-bold flex items-center gap-3 mb-4">
                <div className="p-2 bg-gradient-to-br from-violet-500 to-purple-600 rounded-xl shadow-md">
                  <ImageIcon className="h-5 w-5 text-white" />
                </div>
                <span className="text-gray-800">Photos</span>
                <span className="text-sm font-normal text-purple-600 bg-purple-100 px-3 py-1 rounded-full">3-5 images required</span>
              </Label>
              <div className="border-3 border-dashed border-purple-300 rounded-2xl p-8 text-center hover:border-purple-500 hover:bg-purple-100/50 transition-all cursor-pointer group bg-white/80">
                <input
                  type="file"
                  accept="image/*"
                  multiple
                  onChange={handleImageUpload}
                  className="hidden"
                  id="image-upload"
                  disabled={images.length >= 5}
                />
                <label htmlFor="image-upload" className={`cursor-pointer block ${images.length >= 5 ? 'opacity-50 cursor-not-allowed' : ''}`}>
                  <div className="w-24 h-24 mx-auto mb-4 bg-gradient-to-br from-purple-500 to-pink-500 rounded-2xl flex items-center justify-center shadow-xl group-hover:scale-110 transition-transform">
                    <ImageIcon className="h-12 w-12 text-white" />
                  </div>
                  <p className="text-xl font-bold text-gray-800 mb-2">
                    {images.length === 0 ? '📸 Click to Upload Photos' : `📸 ${images.length}/5 Photos Uploaded`}
                  </p>
                  <p className="text-gray-600">
                    Drag & drop or click to select multiple images
                  </p>
                  <div className="mt-4 flex items-center justify-center gap-2 text-sm text-purple-600">
                    <Sparkles className="h-4 w-4" />
                    <span>Clear photos = Better AI analysis = Accurate pricing!</span>
                  </div>
                </label>
              </div>

              {/* Image Preview - Enhanced */}
              {images.length > 0 && (
                <div className="mt-6 grid grid-cols-5 gap-3">
                  {images.map((img, idx) => (
                    <div key={idx} className="relative group">
                      <img 
                        src={img} 
                        alt={`Upload ${idx + 1}`}
                        className="w-full h-28 object-cover rounded-xl border-3 border-purple-200 shadow-md group-hover:border-purple-400 transition-all"
                      />
                      <button
                        onClick={() => removeImage(idx)}
                        className="absolute -top-2 -right-2 bg-red-500 hover:bg-red-600 text-white rounded-full w-7 h-7 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all shadow-lg"
                        type="button"
                      >
                        <X className="h-4 w-4" />
                      </button>
                      <div className="absolute bottom-1 left-1 bg-black/60 text-white text-xs px-2 py-0.5 rounded-full">
                        {idx + 1}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Service Category - Enhanced */}
            <div className="bg-gradient-to-br from-orange-50 to-amber-50 rounded-2xl p-6 border-2 border-orange-200">
              <Label htmlFor="category" className="text-lg font-bold flex items-center gap-3 mb-4">
                <div className="p-2 bg-gradient-to-br from-orange-500 to-pink-500 rounded-xl shadow-md">
                  <Sparkles className="h-5 w-5 text-white" />
                </div>
                <span className="text-gray-800">Service Category</span>
                <span className="text-red-500">*</span>
              </Label>
              <select
                id="category"
                value={categoryId}
                onChange={(e) => setCategoryId(e.target.value)}
                className="w-full px-5 py-4 border-2 border-orange-200 rounded-xl shadow-sm focus:outline-none focus:ring-4 focus:ring-orange-200 focus:border-orange-400 bg-white text-gray-800 font-semibold text-lg transition-all"
                required
              >
                <option value="">🔍 Select a category...</option>
                <option value="electrical">⚡ Electrical</option>
                <option value="plumbing">🚰 Plumbing</option>
                <option value="ac_repair">❄️ AC & Appliance Repair</option>
                <option value="carpentry">🔨 Carpentry</option>
                <option value="painting">🎨 Painting</option>
                <option value="cleaning">🧹 Cleaning</option>
                <option value="pest_control">🐛 Pest Control</option>
                <option value="home_repair">🏠 Home Repair & Maintenance</option>
                <option value="locksmith">🔑 Locksmith</option>
                <option value="gardening">🌱 Gardening & Landscaping</option>
                <option value="moving">📦 Moving & Packing</option>
                <option value="other">🔧 Other</option>
              </select>
              <p className="text-sm text-orange-600 mt-2 flex items-center gap-1">
                <span>💡</span> Helps AI match you with the right professional
              </p>
            </div>

            {/* Service Location - Enhanced */}
            <div className="bg-gradient-to-br from-teal-50 to-cyan-50 rounded-2xl p-6 border-2 border-teal-200">
              <Label className="text-lg font-bold flex items-center gap-3 mb-4">
                <div className="p-2 bg-gradient-to-br from-teal-500 to-cyan-500 rounded-xl shadow-md">
                  <MapPin className="h-5 w-5 text-white" />
                </div>
                <span className="text-gray-800">Service Location</span>
                <span className="text-red-500">*</span>
              </Label>
              <AddressInteractiveMap
                value={address}
                onChange={(value) => setAddress(value)}
                onAddressSelect={(selected) => {
                  setAddress(selected.display_name)
                  setLocationLat(selected.lat)
                  setLocationLng(selected.lng)
                }}
                placeholder="🔍 Search your location (area, city, landmark)"
                required
                showMap={true}
                mapHeight="350px"
              />
            </div>

            {/* Detailed Address - Enhanced */}
            <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-2xl p-6 border-2 border-blue-200">
              <div className="flex items-center gap-3 mb-4">
                <div className="p-2 bg-gradient-to-br from-blue-500 to-indigo-500 rounded-xl shadow-md">
                  <MapPin className="h-5 w-5 text-white" />
                </div>
                <h4 className="font-bold text-lg text-gray-800">Complete Address Details</h4>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="flatNumber" className="font-semibold text-gray-700 flex items-center gap-1">
                    🏠 Flat/House No. <span className="text-red-500">*</span>
                  </Label>
                  <Input 
                    id="flatNumber" 
                    value={flatNumber} 
                    onChange={(e) => setFlatNumber(e.target.value)} 
                    placeholder="e.g., A-101, 2nd Floor"
                    className="bg-white border-2 border-blue-200 focus:border-blue-500 focus:ring-4 focus:ring-blue-100 py-3 text-base"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="floor" className="font-semibold text-gray-700">
                    🏢 Floor
                  </Label>
                  <Input 
                    id="floor" 
                    value={floor} 
                    onChange={(e) => setFloor(e.target.value)} 
                    placeholder="e.g., Ground, 1st, 2nd"
                    className="bg-white border-2 border-blue-200 focus:border-blue-500 focus:ring-4 focus:ring-blue-100 py-3 text-base"
                  />
                </div>
              </div>
              
              <div className="space-y-2 mt-4">
                <Label htmlFor="landmark" className="font-semibold text-gray-700">
                  📍 Nearby Landmark <span className="text-gray-400 font-normal">(Optional but helpful)</span>
                </Label>
                <Input 
                  id="landmark" 
                  value={landmark} 
                  onChange={(e) => setLandmark(e.target.value)} 
                  placeholder="e.g., Near Apollo Pharmacy, Opposite SBI Bank"
                  className="bg-white border-2 border-blue-200 focus:border-blue-500 focus:ring-4 focus:ring-blue-100 py-3 text-base"
                />
              </div>
              
              <p className="text-sm text-blue-600 mt-4 bg-blue-100 p-3 rounded-xl flex items-start gap-2">
                <span className="text-lg">💡</span>
                <span><strong>Pro Tip:</strong> Accurate address details help the helper reach you faster without confusion!</span>
              </p>
            </div>

            {/* Description - Enhanced */}
            <div className="bg-gradient-to-br from-green-50 to-emerald-50 rounded-2xl p-6 border-2 border-green-200">
              <Label htmlFor="description" className="text-lg font-bold flex items-center gap-3 mb-4">
                <div className="p-2 bg-gradient-to-br from-green-500 to-emerald-500 rounded-xl shadow-md">
                  <AlertTriangle className="h-5 w-5 text-white" />
                </div>
                <span className="text-gray-800">Problem Description</span>
                <span className="text-red-500">*</span>
              </Label>
              <Textarea
                id="description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="📝 Describe the issue in detail...&#10;&#10;Examples:&#10;• AC not cooling properly, making noise&#10;• Water leaking from pipe under sink&#10;• Switch giving electric shock"
                className="min-h-[150px] bg-white border-2 border-green-200 focus:border-green-500 focus:ring-4 focus:ring-green-100 text-base"
                required
              />
              <p className="text-sm text-green-600 mt-2 flex items-center gap-1">
                <span>✨</span> More details = More accurate AI pricing!
              </p>
            </div>

            {/* Additional Info Grid - Enhanced */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Error Code */}
              <div className="bg-gray-50 rounded-xl p-4 border border-gray-200">
                <Label htmlFor="errorCode" className="font-semibold text-gray-700 flex items-center gap-2">
                  🔢 Error Code <span className="text-gray-400 font-normal">(if any)</span>
                </Label>
                <Input
                  id="errorCode"
                  value={errorCode}
                  onChange={(e) => setErrorCode(e.target.value)}
                  placeholder="E.g., E1, F03, or 'N/A'"
                  className="mt-2 bg-white border-2 border-gray-200 focus:border-purple-400 py-3"
                />
              </div>

              {/* Problem Duration */}
              <div className="bg-gray-50 rounded-xl p-4 border border-gray-200">
                <Label htmlFor="problemDuration" className="font-semibold text-gray-700 flex items-center gap-2">
                  ⏰ How long has this existed?
                </Label>
                <select
                  id="problemDuration"
                  value={problemDuration}
                  onChange={(e) => setProblemDuration(e.target.value)}
                  className="mt-2 w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:ring-4 focus:ring-purple-100 focus:border-purple-400 bg-white font-medium"
                >
                  <option value="">Select duration</option>
                  <option value="just_now">🆕 Just started (today)</option>
                  <option value="few_days">📅 Few days ago</option>
                  <option value="week">📆 About a week</option>
                  <option value="weeks">🗓️ Few weeks</option>
                  <option value="month_plus">📆 More than a month</option>
                </select>
              </div>
            </div>

            {/* Previous Attempts */}
            <div className="bg-gray-50 rounded-xl p-4 border border-gray-200">
              <Label htmlFor="previousAttempts" className="font-semibold text-gray-700 flex items-center gap-2">
                🔧 Have you tried fixing it yourself?
              </Label>
              <Textarea
                id="previousAttempts"
                value={previousAttempts}
                onChange={(e) => setPreviousAttempts(e.target.value)}
                placeholder="What you've tried: restarted, checked connections, cleaned, etc. Type 'N/A' if nothing"
                className="mt-2 bg-white border-2 border-gray-200 focus:border-purple-400"
                rows={2}
              />
            </div>

            {/* Urgency - Enhanced */}
            <div className="bg-gradient-to-br from-red-50 to-orange-50 rounded-2xl p-6 border-2 border-red-200">
              <Label htmlFor="preferredTime" className="text-lg font-bold flex items-center gap-3 mb-4">
                <div className="p-2 bg-gradient-to-br from-red-500 to-orange-500 rounded-xl shadow-md">
                  <Clock className="h-5 w-5 text-white" />
                </div>
                <span className="text-gray-800">When do you need help?</span>
              </Label>
              <select
                id="preferredTime"
                value={preferredTime}
                onChange={(e) => setPreferredTime(e.target.value)}
                className="w-full px-5 py-4 border-2 border-red-200 rounded-xl focus:ring-4 focus:ring-red-100 focus:border-red-400 bg-white font-semibold text-lg"
              >
                <option value="">⏰ Select urgency level</option>
                <option value="asap">🚨 EMERGENCY - As soon as possible</option>
                <option value="today">☀️ Within today</option>
                <option value="tomorrow">📅 Tomorrow</option>
                <option value="this_week">📆 This week</option>
                <option value="flexible">🙂 Flexible timing</option>
              </select>
            </div>

            {/* Submit Button - Super Enhanced */}
            <div className="pt-4">
              <Button
                onClick={analyzeWithAI}
                disabled={analyzing || images.length < 3 || !description.trim() || !categoryId || !address.trim()}
                className="w-full bg-gradient-to-r from-purple-600 via-pink-600 to-teal-600 hover:from-purple-700 hover:via-pink-700 hover:to-teal-700 text-white py-8 text-xl font-bold rounded-2xl shadow-2xl hover:shadow-3xl transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {analyzing ? (
                  <div className="flex items-center justify-center gap-3">
                    <Loader2 className="h-7 w-7 animate-spin" />
                    <span>🤖 AI is analyzing your request...</span>
                  </div>
                ) : (
                  <div className="flex items-center justify-center gap-3">
                    <Sparkles className="h-7 w-7" />
                    <span>✨ Analyze with AI & Get Instant Price</span>
                    <Brain className="h-7 w-7" />
                  </div>
                )}
              </Button>
            </div>

            {/* Validation Messages - Enhanced */}
            <div className="space-y-2">
              {images.length < 3 && (
                <div className="text-center text-sm bg-amber-100 text-amber-700 p-3 rounded-xl border border-amber-200 flex items-center justify-center gap-2">
                  <ImageIcon className="h-4 w-4" />
                  <span>📸 Please upload at least <strong>3 photos</strong> for accurate AI analysis</span>
                </div>
              )}
              {!description.trim() && images.length >= 3 && (
                <div className="text-center text-sm bg-amber-100 text-amber-700 p-3 rounded-xl border border-amber-200">
                  📝 Please describe the problem in the <strong>"Problem Description"</strong> field
                </div>
              )}
              {!categoryId && images.length >= 3 && description.trim() && (
                <div className="text-center text-sm bg-amber-100 text-amber-700 p-3 rounded-xl border border-amber-200">
                  🔍 Please select a <strong>service category</strong>
                </div>
              )}
              {!address.trim() && images.length >= 3 && description.trim() && categoryId && (
                <div className="text-center text-sm bg-amber-100 text-amber-700 p-3 rounded-xl border border-amber-200">
                  📍 Please enter your <strong>service location</strong>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Step 2: AI Analysis Results */}
      {step === 'analysis' && aiAnalysis && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Brain className="h-5 w-5 text-teal-600" />
              AI Analysis Results
              <Badge variant="outline" className="ml-auto">
                {aiAnalysis.confidence}% Confidence
              </Badge>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Pricing */}
            <div className="bg-gradient-to-r from-purple-50 to-teal-50 rounded-lg p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-gray-900">AI Estimated Price</h3>
                <div className="flex items-center gap-2 text-3xl font-bold text-teal-600">
                  <IndianRupee className="h-8 w-8" />
                  {aiAnalysis.estimatedPrice}
                </div>
              </div>
              <div className="flex items-center gap-2 text-sm text-gray-600">
                <Clock className="h-4 w-4" />
                Estimated Duration: {aiAnalysis.estimatedDuration} minutes
              </div>
            </div>

            {/* Tiered Pricing Selection */}
            <div>
              <Label className="text-base font-semibold mb-3 block">Choose Your Pricing Tier</Label>
              <div className="grid grid-cols-3 gap-4">
                {/* Budget Tier */}
                <button
                  onClick={() => setSelectedTier('budget')}
                  className={`p-4 rounded-lg border-2 transition-all ${
                    selectedTier === 'budget'
                      ? 'border-blue-600 bg-blue-50'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  <div className="text-center">
                    <div className="text-xs font-semibold text-blue-600 mb-2">BUDGET</div>
                    <div className="text-2xl font-bold text-gray-900 flex items-center justify-center">
                      <IndianRupee className="h-5 w-5" />
                      {getPriceForTier(aiAnalysis.estimatedPrice, 'budget')}
                    </div>
                    <div className="text-xs text-gray-500 mt-2">-15%</div>
                    <div className="text-xs text-gray-600 mt-3">
                      Fewer helpers may respond
                    </div>
                  </div>
                </button>

                {/* Standard Tier */}
                <button
                  onClick={() => setSelectedTier('standard')}
                  className={`p-4 rounded-lg border-2 transition-all ${
                    selectedTier === 'standard'
                      ? 'border-teal-600 bg-teal-50'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  <div className="text-center">
                    <div className="text-xs font-semibold text-teal-600 mb-2 flex items-center justify-center gap-1">
                      STANDARD <CheckCircle2 className="h-3 w-3" />
                    </div>
                    <div className="text-2xl font-bold text-gray-900 flex items-center justify-center">
                      <IndianRupee className="h-5 w-5" />
                      {getPriceForTier(aiAnalysis.estimatedPrice, 'standard')}
                    </div>
                    <div className="text-xs text-teal-600 font-semibold mt-2">AI Price</div>
                    <div className="text-xs text-gray-600 mt-3">
                      Recommended pricing
                    </div>
                  </div>
                </button>

                {/* Priority Tier */}
                <button
                  onClick={() => setSelectedTier('priority')}
                  className={`p-4 rounded-lg border-2 transition-all ${
                    selectedTier === 'priority'
                      ? 'border-purple-600 bg-purple-50'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  <div className="text-center">
                    <div className="text-xs font-semibold text-purple-600 mb-2 flex items-center justify-center gap-1">
                      PRIORITY <Sparkles className="h-3 w-3" />
                    </div>
                    <div className="text-2xl font-bold text-gray-900 flex items-center justify-center">
                      <IndianRupee className="h-5 w-5" />
                      {getPriceForTier(aiAnalysis.estimatedPrice, 'priority')}
                    </div>
                    <div className="text-xs text-gray-500 mt-2">+15%</div>
                    <div className="text-xs text-gray-600 mt-3">
                      Faster response guaranteed
                    </div>
                  </div>
                </button>
              </div>
              <p className="text-xs text-gray-500 mt-3 text-center">
                💡 Tip: Priority pricing attracts more helpers for urgent jobs
              </p>
            </div>

            {/* Severity & Urgency */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label className="text-sm text-gray-600">Severity</Label>
                <Badge className={`${getSeverityColor(aiAnalysis.severity)} mt-2 text-sm px-3 py-1`}>
                  <AlertTriangle className="h-4 w-4 mr-1" />
                  {aiAnalysis.severity.toUpperCase()}
                </Badge>
              </div>
              <div>
                <Label className="text-sm text-gray-600">Urgency</Label>
                <Badge className={`${getUrgencyColor(aiAnalysis.urgency)} mt-2 text-sm px-3 py-1`}>
                  <Clock className="h-4 w-4 mr-1" />
                  {aiAnalysis.urgency.toUpperCase()}
                </Badge>
              </div>
            </div>

            {/* AI Description */}
            <div>
              <Label>Professional Assessment</Label>
              <p className="mt-2 text-sm text-gray-700 bg-gray-50 p-4 rounded-lg">
                {aiAnalysis.description}
              </p>
            </div>

            {/* What's Included Section */}
            <div className="bg-gradient-to-br from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20 rounded-xl p-5 border-2 border-green-200 dark:border-green-700">
              <div className="flex items-center gap-2 mb-3">
                <div className="p-2 bg-green-600 rounded-lg">
                  <svg className="h-5 w-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <h3 className="font-bold text-green-900 dark:text-green-100 text-lg">What's Included in the Price</h3>
              </div>
              <ul className="space-y-2 text-sm text-green-800 dark:text-green-200">
                <li className="flex items-start gap-2">
                  <span className="text-green-600 mt-0.5">✓</span>
                  <span><strong>Professional Labor:</strong> Expert service by verified helper</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-green-600 mt-0.5">✓</span>
                  <span><strong>Basic Tools:</strong> Helper brings standard tools needed for the job</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-green-600 mt-0.5">✓</span>
                  <span><strong>Professional Inspection:</strong> Complete diagnosis and assessment</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-green-600 mt-0.5">✓</span>
                  <span><strong>Service Guarantee:</strong> Quality workmanship assured</span>
                </li>
              </ul>
            </div>

            {/* Not Included Section */}
            <div className="bg-gradient-to-br from-orange-50 to-amber-50 dark:from-orange-900/20 dark:to-amber-900/20 rounded-xl p-5 border-2 border-orange-200 dark:border-orange-700">
              <div className="flex items-center gap-2 mb-3">
                <div className="p-2 bg-orange-600 rounded-lg">
                  <svg className="h-5 w-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                  </svg>
                </div>
                <h3 className="font-bold text-orange-900 dark:text-orange-100 text-lg">Not Included (Billed Separately)</h3>
              </div>
              <ul className="space-y-2 text-sm text-orange-800 dark:text-orange-200">
                <li className="flex items-start gap-2">
                  <span className="text-orange-600 mt-0.5">✗</span>
                  <span><strong>Replacement Parts:</strong> Filters, cartridges, valves, or components</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-orange-600 mt-0.5">✗</span>
                  <span><strong>Materials & Consumables:</strong> Spare parts, adhesives, sealants</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-orange-600 mt-0.5">✗</span>
                  <span><strong>Specialized Equipment:</strong> Heavy machinery or special tools if needed</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-orange-600 mt-0.5">✗</span>
                  <span><strong>Transportation:</strong> Parts delivery or emergency call-out fees (if any)</span>
                </li>
              </ul>
            </div>

            {/* Additional Costs Disclaimer */}
            <div className="bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 rounded-xl p-5 border-2 border-blue-200 dark:border-blue-700">
              <div className="flex items-start gap-3">
                <div className="p-2 bg-blue-600 rounded-lg flex-shrink-0">
                  <svg className="h-5 w-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <div className="flex-1">
                  <h3 className="font-bold text-blue-900 dark:text-blue-100 text-base mb-2">💰 Additional Costs Policy</h3>
                  <p className="text-sm text-blue-800 dark:text-blue-200 leading-relaxed">
                    The estimated price covers <strong>labor and standard tools only</strong>. If replacement parts or special materials are needed, 
                    the helper will inform you before proceeding. You can either:
                  </p>
                  <ul className="mt-2 space-y-1 text-sm text-blue-700 dark:text-blue-300">
                    <li className="flex items-start gap-2">
                      <span className="mt-0.5">•</span>
                      <span>Provide the parts yourself (helper will install)</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="mt-0.5">•</span>
                      <span>Ask the helper to source parts (you'll be charged separately at cost + convenience fee)</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="mt-0.5">•</span>
                      <span>Review and approve any additional costs before work begins</span>
                    </li>
                  </ul>
                  <p className="mt-3 text-xs text-blue-600 dark:text-blue-400 font-medium bg-blue-100 dark:bg-blue-900/40 px-3 py-2 rounded-lg">
                    ⚡ No surprises! All additional costs require your approval before proceeding.
                  </p>
                </div>
              </div>
            </div>

            {/* Required Skills */}
            <div>
              <Label>Required Skills</Label>
              <div className="mt-2 flex flex-wrap gap-2">
                {aiAnalysis.requiredSkills.map((skill, idx) => (
                  <Badge key={idx} variant="outline" className="bg-blue-50">
                    {skill}
                  </Badge>
                ))}
              </div>
            </div>

            {/* Materials Needed */}
            <div>
              <Label>Materials Needed</Label>
              <div className="mt-2 flex flex-wrap gap-2">
                {aiAnalysis.materialsNeeded.map((material, idx) => (
                  <Badge key={idx} variant="outline" className="bg-green-50">
                    {material}
                  </Badge>
                ))}
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex gap-3">
              <Button
                variant="outline"
                onClick={() => setStep('upload')}
                className="flex-1"
                disabled={broadcasting}
              >
                Back to Edit
              </Button>
              <Button
                onClick={broadcastToHelpers}
                disabled={broadcasting}
                className="flex-1 bg-gradient-to-r from-purple-600 to-teal-600 hover:from-purple-700 hover:to-teal-700 text-lg py-6 disabled:opacity-50"
              >
                {broadcasting ? (
                  <>
                    <Loader2 className="h-5 w-5 mr-2 animate-spin" />
                    Notifying Helpers...
                  </>
                ) : (
                  <>
                    <Sparkles className="h-5 w-5 mr-2" />
                    Broadcast to All Helpers (₹{getPriceForTier(aiAnalysis.estimatedPrice, selectedTier)})
                  </>
                )}
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
