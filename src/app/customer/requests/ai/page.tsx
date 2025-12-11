'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
import AddressInteractiveMap from '@/components/address-interactive-map'
import { 
  IndianRupee, 
  Clock, 
  AlertTriangle, 
  Loader2,
  Sparkles,
  X,
  Image as ImageIcon,
  MapPin,
  Wallet,
  Banknote,
  CreditCard,
  ChevronRight,
  Percent,
  Camera,
  Video,
  Mic,
  Play,
  Pause
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
type PaymentMethod = 'cash' | 'upi' | 'wallet'

export default function AIRequestPage() {
  const router = useRouter()
  const [step, setStep] = useState<'upload' | 'analysis' | 'review'>('upload')
  const [images, setImages] = useState<string[]>([])
  const [videos, setVideos] = useState<{ url: string; name: string; type: string }[]>([])
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
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('cash')
  const [showPaymentOptions, setShowPaymentOptions] = useState(false)

  const [broadcasting, setBroadcasting] = useState(false)

  // Handle image upload from gallery
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

  // Handle camera capture
  const handleCameraCapture = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files
    if (!files || !files[0]) return

    if (images.length >= 5) {
      toast.error('Maximum 5 images allowed')
      return
    }

    const file = files[0]
    const reader = new FileReader()
    reader.onloadend = () => {
      setImages((prev) => [...prev, reader.result as string].slice(0, 5))
      toast.success('Photo captured!')
    }
    reader.readAsDataURL(file)
  }

  // Handle video upload
  const handleVideoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files
    if (!files || !files[0]) return

    if (videos.length >= 2) {
      toast.error('Maximum 2 videos allowed')
      return
    }

    const file = files[0]
    
    // Check file size (max 50MB)
    if (file.size > 50 * 1024 * 1024) {
      toast.error('Video must be under 50MB')
      return
    }

    const reader = new FileReader()
    reader.onloadend = () => {
      setVideos((prev) => [...prev, {
        url: reader.result as string,
        name: file.name,
        type: file.type
      }].slice(0, 2))
      toast.success('Video uploaded!')
    }
    reader.readAsDataURL(file)
  }

  // Handle video recording from camera
  const handleVideoCapture = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files
    if (!files || !files[0]) return

    if (videos.length >= 2) {
      toast.error('Maximum 2 videos allowed')
      return
    }

    const file = files[0]
    
    // Check file size (max 50MB)
    if (file.size > 50 * 1024 * 1024) {
      toast.error('Video must be under 50MB')
      return
    }

    const reader = new FileReader()
    reader.onloadend = () => {
      setVideos((prev) => [...prev, {
        url: reader.result as string,
        name: file.name || 'Recorded Video',
        type: file.type
      }].slice(0, 2))
      toast.success('Video recorded!')
    }
    reader.readAsDataURL(file)
  }

  const removeImage = (index: number) => {
    setImages((prev) => prev.filter((_, i) => i !== index))
    toast.success('Image removed')
  }

  const removeVideo = (index: number) => {
    setVideos((prev) => prev.filter((_, i) => i !== index))
    toast.success('Video removed')
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
          videos: videos.map(v => v.url), // Include video URLs
          aiAnalysis,
          selectedTier,
          estimatedPrice: getPriceForTier(aiAnalysis.estimatedPrice, selectedTier),
          urgency: aiAnalysis.urgency,
          problemDuration,
          errorCode,
          preferredTime,
          paymentMethod, // Added payment method
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

      // Redirect to job tracking page
      router.push(`/customer/requests/${data.requestId}/track`)

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
    <div className="max-w-2xl mx-auto py-6 px-4">
      {/* Header - Clean & Minimal */}
      <div className="mb-6">
        <div className="flex items-center gap-3 mb-2">
          <div className="h-10 w-10 bg-emerald-500 rounded-xl flex items-center justify-center">
            <Sparkles className="h-5 w-5 text-white" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-gray-900">AI Smart Request</h1>
            <p className="text-gray-500 text-sm">Get instant pricing from AI</p>
          </div>
        </div>
      </div>

      {/* Progress Steps - Clean */}
      <div className="bg-white rounded-xl p-4 mb-6 border border-gray-100">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className={`h-8 w-8 rounded-full flex items-center justify-center text-sm font-bold ${
              step === 'upload' ? 'bg-emerald-500 text-white' : 'bg-gray-100 text-gray-400'
            }`}>
              1
            </div>
            <span className={`text-sm font-medium ${step === 'upload' ? 'text-gray-900' : 'text-gray-400'}`}>Upload</span>
          </div>
          <div className={`flex-1 h-0.5 mx-3 ${step !== 'upload' ? 'bg-emerald-500' : 'bg-gray-200'}`} />
          <div className="flex items-center gap-2">
            <div className={`h-8 w-8 rounded-full flex items-center justify-center text-sm font-bold ${
              step === 'analysis' ? 'bg-emerald-500 text-white' : step === 'review' ? 'bg-emerald-500 text-white' : 'bg-gray-100 text-gray-400'
            }`}>
              2
            </div>
            <span className={`text-sm font-medium ${step === 'analysis' || step === 'review' ? 'text-gray-900' : 'text-gray-400'}`}>Review</span>
          </div>
          <div className={`flex-1 h-0.5 mx-3 ${step === 'review' ? 'bg-emerald-500' : 'bg-gray-200'}`} />
          <div className="flex items-center gap-2">
            <div className={`h-8 w-8 rounded-full flex items-center justify-center text-sm font-bold ${
              step === 'review' ? 'bg-emerald-500 text-white' : 'bg-gray-100 text-gray-400'
            }`}>
              3
            </div>
            <span className={`text-sm font-medium ${step === 'review' ? 'text-gray-900' : 'text-gray-400'}`}>Done</span>
          </div>
        </div>
      </div>

      {/* Step 1: Upload */}
      {step === 'upload' && (
        <Card className="border border-gray-100 shadow-sm bg-white">
          <CardContent className="space-y-5 pt-6">
            {/* Image Upload */}
            <div>
              <Label className="text-sm font-semibold text-gray-700 flex items-center gap-2 mb-3">
                <ImageIcon className="h-4 w-4 text-emerald-600" />
                Photos & Videos
                <span className="text-xs font-normal text-gray-400">3-5 photos required</span>
              </Label>
              
              {/* Upload Options - Gallery, Camera, Video */}
              <div className="grid grid-cols-3 gap-3 mb-4">
                {/* Gallery Upload */}
                <div className="relative">
                  <input
                    type="file"
                    accept="image/*"
                    multiple
                    onChange={handleImageUpload}
                    className="hidden"
                    id="gallery-upload"
                    disabled={images.length >= 5}
                  />
                  <label 
                    htmlFor="gallery-upload" 
                    className={`flex flex-col items-center justify-center p-4 border-2 border-dashed border-gray-200 rounded-xl cursor-pointer hover:border-emerald-400 hover:bg-emerald-50/30 transition-all ${images.length >= 5 ? 'opacity-50 cursor-not-allowed' : ''}`}
                  >
                    <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center mb-2">
                      <ImageIcon className="h-5 w-5 text-blue-600" />
                    </div>
                    <span className="text-xs font-medium text-gray-700">Gallery</span>
                  </label>
                </div>

                {/* Camera Capture */}
                <div className="relative">
                  <input
                    type="file"
                    accept="image/*"
                    capture="environment"
                    onChange={handleCameraCapture}
                    className="hidden"
                    id="camera-capture"
                    disabled={images.length >= 5}
                  />
                  <label 
                    htmlFor="camera-capture" 
                    className={`flex flex-col items-center justify-center p-4 border-2 border-dashed border-gray-200 rounded-xl cursor-pointer hover:border-emerald-400 hover:bg-emerald-50/30 transition-all ${images.length >= 5 ? 'opacity-50 cursor-not-allowed' : ''}`}
                  >
                    <div className="w-10 h-10 bg-emerald-100 rounded-full flex items-center justify-center mb-2">
                      <Camera className="h-5 w-5 text-emerald-600" />
                    </div>
                    <span className="text-xs font-medium text-gray-700">Camera</span>
                  </label>
                </div>

                {/* Video Upload/Record */}
                <div className="relative">
                  <input
                    type="file"
                    accept="video/*"
                    capture="environment"
                    onChange={handleVideoCapture}
                    className="hidden"
                    id="video-capture"
                    disabled={videos.length >= 2}
                  />
                  <label 
                    htmlFor="video-capture" 
                    className={`flex flex-col items-center justify-center p-4 border-2 border-dashed border-gray-200 rounded-xl cursor-pointer hover:border-emerald-400 hover:bg-emerald-50/30 transition-all ${videos.length >= 2 ? 'opacity-50 cursor-not-allowed' : ''}`}
                  >
                    <div className="w-10 h-10 bg-red-100 rounded-full flex items-center justify-center mb-2">
                      <Video className="h-5 w-5 text-red-600" />
                    </div>
                    <span className="text-xs font-medium text-gray-700">Video</span>
                  </label>
                </div>
              </div>

              {/* Upload from Gallery for Video */}
              <div className="mb-4">
                <input
                  type="file"
                  accept="video/*"
                  onChange={handleVideoUpload}
                  className="hidden"
                  id="video-gallery-upload"
                  disabled={videos.length >= 2}
                />
                <label 
                  htmlFor="video-gallery-upload"
                  className={`flex items-center justify-center gap-2 w-full p-3 border border-gray-200 rounded-xl cursor-pointer hover:bg-gray-50 transition-all text-sm text-gray-600 ${videos.length >= 2 ? 'opacity-50 cursor-not-allowed' : ''}`}
                >
                  <Video className="h-4 w-4" />
                  <span>Upload Video from Gallery (max 50MB)</span>
                </label>
              </div>

              {/* Status */}
              <div className="flex items-center gap-4 text-sm text-gray-500 mb-3">
                <span className={images.length >= 3 ? 'text-emerald-600 font-medium' : ''}>
                  📷 {images.length}/5 photos
                </span>
                <span className={videos.length > 0 ? 'text-emerald-600 font-medium' : ''}>
                  🎥 {videos.length}/2 videos
                </span>
              </div>

              {/* Image Preview */}
              {images.length > 0 && (
                <div className="mb-4">
                  <p className="text-xs text-gray-500 mb-2">Photos:</p>
                  <div className="flex gap-2 overflow-x-auto pb-2">
                    {images.map((img, idx) => (
                      <div key={idx} className="relative flex-shrink-0 group">
                        <img 
                          src={img} 
                          alt={`Upload ${idx + 1}`}
                          className="w-20 h-20 object-cover rounded-lg border border-gray-200"
                        />
                        <button
                          onClick={() => removeImage(idx)}
                          className="absolute -top-1.5 -right-1.5 bg-red-500 hover:bg-red-600 text-white rounded-full w-5 h-5 flex items-center justify-center shadow"
                          type="button"
                        >
                          <X className="h-3 w-3" />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Video Preview */}
              {videos.length > 0 && (
                <div>
                  <p className="text-xs text-gray-500 mb-2">Videos (with audio):</p>
                  <div className="flex flex-col gap-3">
                    {videos.map((video, idx) => (
                      <div key={idx} className="relative bg-gray-100 rounded-xl overflow-hidden">
                        <video 
                          src={video.url}
                          controls
                          className="w-full h-40 object-cover"
                        />
                        <button
                          onClick={() => removeVideo(idx)}
                          className="absolute top-2 right-2 bg-red-500 hover:bg-red-600 text-white rounded-full w-6 h-6 flex items-center justify-center shadow"
                          type="button"
                        >
                          <X className="h-4 w-4" />
                        </button>
                        <div className="absolute bottom-2 left-2 bg-black/60 text-white text-xs px-2 py-1 rounded-full flex items-center gap-1">
                          <Mic className="h-3 w-3" />
                          <span>With Audio</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Tip for better uploads */}
              <div className="mt-3 bg-amber-50 border border-amber-200 rounded-lg p-3">
                <p className="text-xs text-amber-800">
                  💡 <strong>Tip:</strong> Record a short video explaining the problem with your voice. 
                  This helps the helper understand the issue better before arriving.
                </p>
              </div>
            </div>

            {/* Service Category */}
            <div>
              <Label htmlFor="category" className="text-sm font-semibold text-gray-700 flex items-center gap-2 mb-2">
                <Sparkles className="h-4 w-4 text-emerald-600" />
                Service Category <span className="text-red-500">*</span>
              </Label>
              <select
                id="category"
                value={categoryId}
                onChange={(e) => setCategoryId(e.target.value)}
                className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 bg-white text-gray-800 font-medium"
                required
              >
                <option value="">Select a category...</option>
                <option value="electrical">⚡ Electrical</option>
                <option value="plumbing">🚰 Plumbing</option>
                <option value="ac_repair">❄️ AC & Appliance Repair</option>
                <option value="carpentry">🔨 Carpentry</option>
                <option value="painting">🎨 Painting</option>
                <option value="cleaning">🧹 Cleaning</option>
                <option value="pest_control">🐛 Pest Control</option>
                <option value="home_repair">🏠 Home Repair</option>
                <option value="locksmith">🔑 Locksmith</option>
                <option value="gardening">🌱 Gardening</option>
                <option value="moving">📦 Moving & Packing</option>
                <option value="other">🔧 Other</option>
              </select>
            </div>

            {/* Service Location */}
            <div>
              <Label className="text-sm font-semibold text-gray-700 flex items-center gap-2 mb-2">
                <MapPin className="h-4 w-4 text-emerald-600" />
                Service Location <span className="text-red-500">*</span>
              </Label>
              <AddressInteractiveMap
                value={address}
                onChange={(value) => setAddress(value)}
                onAddressSelect={(selected) => {
                  setAddress(selected.display_name)
                  setLocationLat(selected.lat)
                  setLocationLng(selected.lng)
                }}
                placeholder="Search your location..."
                required
                showMap={true}
                mapHeight="200px"
              />
            </div>

            {/* Address Details */}
            <div className="bg-gray-50 rounded-xl p-4">
              <h4 className="font-semibold text-gray-700 text-sm mb-3">Complete Address</h4>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label htmlFor="flatNumber" className="text-xs text-gray-600 mb-1 block">Flat/House No. *</Label>
                  <Input 
                    id="flatNumber" 
                    value={flatNumber} 
                    onChange={(e) => setFlatNumber(e.target.value)} 
                    placeholder="e.g., A-101"
                    className="bg-white border-gray-200 focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500"
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="floor" className="text-xs text-gray-600 mb-1 block">Floor</Label>
                  <Input 
                    id="floor" 
                    value={floor} 
                    onChange={(e) => setFloor(e.target.value)} 
                    placeholder="e.g., 2nd"
                    className="bg-white border-gray-200 focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500"
                  />
                </div>
              </div>
              <div className="mt-3">
                <Label htmlFor="landmark" className="text-xs text-gray-600 mb-1 block">Landmark (optional)</Label>
                <Input 
                  id="landmark" 
                  value={landmark} 
                  onChange={(e) => setLandmark(e.target.value)} 
                  placeholder="e.g., Near SBI Bank"
                  className="bg-white border-gray-200 focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500"
                />
              </div>
            </div>

            {/* Description */}
            <div>
              <Label htmlFor="description" className="text-sm font-semibold text-gray-700 flex items-center gap-2 mb-2">
                <AlertTriangle className="h-4 w-4 text-emerald-600" />
                Describe the Problem <span className="text-red-500">*</span>
              </Label>
              <Textarea
                id="description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Describe the issue in detail...&#10;&#10;E.g., AC not cooling, water leaking from pipe, switch giving shock"
                className="min-h-[100px] bg-white border-gray-200 focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500"
                required
              />
            </div>

            {/* Additional Info Row */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label htmlFor="errorCode" className="text-xs text-gray-600 mb-1 block">Error Code (if any)</Label>
                <Input
                  id="errorCode"
                  value={errorCode}
                  onChange={(e) => setErrorCode(e.target.value)}
                  placeholder="E.g., E1, F03, NA"
                  className="bg-white border-gray-200 focus:border-emerald-500"
                />
              </div>
              <div>
                <Label htmlFor="problemDuration" className="text-xs text-gray-600 mb-1 block">How long?</Label>
                <select
                  id="problemDuration"
                  value={problemDuration}
                  onChange={(e) => setProblemDuration(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:ring-1 focus:ring-emerald-500 focus:border-emerald-500 bg-white text-sm"
                >
                  <option value="">Select...</option>
                  <option value="just_now">Just started (today)</option>
                  <option value="few_days">Few days</option>
                  <option value="week">About a week</option>
                  <option value="weeks">Few weeks</option>
                  <option value="month_plus">More than a month</option>
                </select>
              </div>
            </div>

            {/* Previous Attempts */}
            <div>
              <Label htmlFor="previousAttempts" className="text-xs text-gray-600 mb-1 block">Tried fixing yourself?</Label>
              <Textarea
                id="previousAttempts"
                value={previousAttempts}
                onChange={(e) => setPreviousAttempts(e.target.value)}
                placeholder="What you've tried, or type 'NA'"
                className="bg-white border-gray-200 focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500"
                rows={2}
              />
            </div>

            {/* Urgency */}
            <div>
              <Label htmlFor="preferredTime" className="text-sm font-semibold text-gray-700 flex items-center gap-2 mb-2">
                <Clock className="h-4 w-4 text-emerald-600" />
                When do you need help?
              </Label>
              <select
                id="preferredTime"
                value={preferredTime}
                onChange={(e) => setPreferredTime(e.target.value)}
                className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 bg-white font-medium"
              >
                <option value="">Select urgency...</option>
                <option value="asap">🚨 EMERGENCY - ASAP</option>
                <option value="today">Today</option>
                <option value="tomorrow">Tomorrow</option>
                <option value="this_week">This week</option>
                <option value="flexible">Flexible</option>
              </select>
            </div>

            {/* Submit Button */}
            <Button
              onClick={analyzeWithAI}
              disabled={analyzing || images.length < 3 || !description.trim() || !categoryId || !address.trim()}
              className="w-full bg-emerald-500 hover:bg-emerald-600 text-white py-6 text-base font-bold rounded-xl shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {analyzing ? (
                <div className="flex items-center justify-center gap-2">
                  <Loader2 className="h-5 w-5 animate-spin" />
                  <span>Analyzing...</span>
                </div>
              ) : (
                <div className="flex items-center justify-center gap-2">
                  <Sparkles className="h-5 w-5" />
                  <span>Analyze with AI & Get Price</span>
                </div>
              )}
            </Button>

            {/* Validation Hints */}
            {(images.length < 3 || !description.trim() || !categoryId || !address.trim()) && (
              <p className="text-center text-sm text-gray-500">
                {images.length < 3 ? `Upload ${3 - images.length} more photo(s)` :
                 !categoryId ? 'Select a category' :
                 !description.trim() ? 'Add problem description' :
                 'Add your location'}
              </p>
            )}
          </CardContent>
        </Card>
      )}

      {/* Step 2: AI Analysis Results */}
      {step === 'analysis' && aiAnalysis && (
        <Card className="border border-gray-100 shadow-sm bg-white">
          <CardContent className="space-y-5 pt-6">
            {/* Price Card */}
            <div className="bg-emerald-50 rounded-xl p-5 border border-emerald-100">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium text-gray-600">AI Estimated Price</span>
                <Badge className="bg-emerald-100 text-emerald-700 text-xs">
                  {aiAnalysis.confidence}% Confidence
                </Badge>
              </div>
              <div className="flex items-center gap-1 text-3xl font-bold text-emerald-600">
                <IndianRupee className="h-7 w-7" />
                {aiAnalysis.estimatedPrice}
              </div>
              <p className="text-sm text-gray-500 mt-2 flex items-center gap-1">
                <Clock className="h-4 w-4" />
                ~{aiAnalysis.estimatedDuration} minutes
              </p>
            </div>

            {/* Pricing Tiers */}
            <div>
              <Label className="text-sm font-semibold text-gray-700 mb-3 block">Select Pricing</Label>
              <div className="grid grid-cols-3 gap-2">
                <button
                  onClick={() => setSelectedTier('budget')}
                  className={`p-3 rounded-xl border-2 transition-all text-center ${
                    selectedTier === 'budget'
                      ? 'border-emerald-500 bg-emerald-50'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  <div className="text-xs font-medium text-gray-500 mb-1">Budget</div>
                  <div className="text-lg font-bold text-gray-900 flex items-center justify-center">
                    ₹{getPriceForTier(aiAnalysis.estimatedPrice, 'budget')}
                  </div>
                  <div className="text-xs text-gray-400">-15%</div>
                </button>

                <button
                  onClick={() => setSelectedTier('standard')}
                  className={`p-3 rounded-xl border-2 transition-all text-center ${
                    selectedTier === 'standard'
                      ? 'border-emerald-500 bg-emerald-50'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  <div className="text-xs font-medium text-emerald-600 mb-1">Recommended</div>
                  <div className="text-lg font-bold text-gray-900 flex items-center justify-center">
                    ₹{getPriceForTier(aiAnalysis.estimatedPrice, 'standard')}
                  </div>
                  <div className="text-xs text-emerald-600">AI Price</div>
                </button>

                <button
                  onClick={() => setSelectedTier('priority')}
                  className={`p-3 rounded-xl border-2 transition-all text-center ${
                    selectedTier === 'priority'
                      ? 'border-emerald-500 bg-emerald-50'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  <div className="text-xs font-medium text-gray-500 mb-1">Priority</div>
                  <div className="text-lg font-bold text-gray-900 flex items-center justify-center">
                    ₹{getPriceForTier(aiAnalysis.estimatedPrice, 'priority')}
                  </div>
                  <div className="text-xs text-gray-400">+15%</div>
                </button>
              </div>
            </div>

            {/* Status Badges */}
            <div className="flex gap-2">
              <Badge className={`${getSeverityColor(aiAnalysis.severity)} text-xs`}>
                {aiAnalysis.severity.toUpperCase()}
              </Badge>
              <Badge className={`${getUrgencyColor(aiAnalysis.urgency)} text-xs`}>
                {aiAnalysis.urgency.toUpperCase()}
              </Badge>
            </div>

            {/* Assessment */}
            <div className="bg-gray-50 rounded-xl p-4">
              <Label className="text-xs text-gray-500 mb-1 block">AI Assessment</Label>
              <p className="text-sm text-gray-700">{aiAnalysis.description}</p>
            </div>

            {/* What's Included */}
            <div className="bg-emerald-50 rounded-xl p-4 border border-emerald-100">
              <h4 className="font-semibold text-emerald-800 text-sm mb-2">✓ What's Included</h4>
              <ul className="space-y-1 text-xs text-emerald-700">
                <li>• Professional labor by verified helper</li>
                <li>• Basic tools & equipment</li>
                <li>• Complete diagnosis</li>
                <li>• Service guarantee</li>
              </ul>
            </div>

            {/* Not Included */}
            <div className="bg-amber-50 rounded-xl p-4 border border-amber-100">
              <h4 className="font-semibold text-amber-800 text-sm mb-2">✗ Not Included</h4>
              <ul className="space-y-1 text-xs text-amber-700">
                <li>• Replacement parts (billed separately)</li>
                <li>• Special materials or consumables</li>
              </ul>
              <p className="text-xs text-amber-600 mt-2">Helper will inform you before any extra charges</p>
            </div>

            {/* Skills & Materials */}
            <div className="flex flex-wrap gap-2">
              {aiAnalysis.requiredSkills.slice(0, 3).map((skill, idx) => (
                <Badge key={idx} variant="outline" className="bg-gray-50 text-xs">
                  {skill}
                </Badge>
              ))}
            </div>

            {/* Payment Method Selection - Rapido Style */}
            <div className="border-t border-gray-100 pt-4">
              <button
                onClick={() => setShowPaymentOptions(!showPaymentOptions)}
                className="w-full flex items-center justify-between p-3 bg-gray-50 rounded-xl hover:bg-gray-100 transition-colors"
              >
                <div className="flex items-center gap-3">
                  {paymentMethod === 'cash' && <Banknote className="h-5 w-5 text-green-600" />}
                  {paymentMethod === 'upi' && <Wallet className="h-5 w-5 text-purple-600" />}
                  {paymentMethod === 'wallet' && <CreditCard className="h-5 w-5 text-blue-600" />}
                  <span className="font-medium text-gray-900">
                    {paymentMethod === 'cash' && 'Cash'}
                    {paymentMethod === 'upi' && 'UPI'}
                    {paymentMethod === 'wallet' && 'Helparo Wallet'}
                  </span>
                </div>
                <ChevronRight className={`h-5 w-5 text-gray-400 transition-transform ${showPaymentOptions ? 'rotate-90' : ''}`} />
              </button>

              {/* Payment Options Dropdown */}
              {showPaymentOptions && (
                <div className="mt-2 bg-white border border-gray-200 rounded-xl overflow-hidden shadow-lg">
                  <button
                    onClick={() => { setPaymentMethod('cash'); setShowPaymentOptions(false); }}
                    className={`w-full flex items-center gap-3 p-4 hover:bg-gray-50 transition-colors border-b border-gray-100 ${paymentMethod === 'cash' ? 'bg-emerald-50' : ''}`}
                  >
                    <div className="w-10 h-10 rounded-full bg-green-100 flex items-center justify-center">
                      <Banknote className="h-5 w-5 text-green-600" />
                    </div>
                    <div className="flex-1 text-left">
                      <p className="font-semibold text-gray-900">Cash</p>
                      <p className="text-xs text-gray-500">Pay directly to helper</p>
                    </div>
                    {paymentMethod === 'cash' && (
                      <div className="w-5 h-5 rounded-full bg-emerald-500 flex items-center justify-center">
                        <span className="text-white text-xs">✓</span>
                      </div>
                    )}
                  </button>

                  <button
                    onClick={() => { setPaymentMethod('upi'); setShowPaymentOptions(false); }}
                    className={`w-full flex items-center gap-3 p-4 hover:bg-gray-50 transition-colors border-b border-gray-100 ${paymentMethod === 'upi' ? 'bg-emerald-50' : ''}`}
                  >
                    <div className="w-10 h-10 rounded-full bg-purple-100 flex items-center justify-center">
                      <Wallet className="h-5 w-5 text-purple-600" />
                    </div>
                    <div className="flex-1 text-left">
                      <p className="font-semibold text-gray-900">UPI</p>
                      <p className="text-xs text-gray-500">Pay via UPI (1-2 days settlement)</p>
                    </div>
                    {paymentMethod === 'upi' && (
                      <div className="w-5 h-5 rounded-full bg-emerald-500 flex items-center justify-center">
                        <span className="text-white text-xs">✓</span>
                      </div>
                    )}
                  </button>

                  <button
                    onClick={() => { setPaymentMethod('wallet'); setShowPaymentOptions(false); }}
                    className={`w-full flex items-center gap-3 p-4 hover:bg-gray-50 transition-colors ${paymentMethod === 'wallet' ? 'bg-emerald-50' : ''}`}
                  >
                    <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center">
                      <CreditCard className="h-5 w-5 text-blue-600" />
                    </div>
                    <div className="flex-1 text-left">
                      <p className="font-semibold text-gray-900">Helparo Wallet</p>
                      <p className="text-xs text-gray-500">Use wallet balance</p>
                    </div>
                    {paymentMethod === 'wallet' && (
                      <div className="w-5 h-5 rounded-full bg-emerald-500 flex items-center justify-center">
                        <span className="text-white text-xs">✓</span>
                      </div>
                    )}
                  </button>
                </div>
              )}
            </div>

            {/* Offers Section - Like Rapido */}
            <button className="w-full flex items-center justify-between p-3 bg-orange-50 border border-orange-200 rounded-xl">
              <div className="flex items-center gap-2">
                <Percent className="h-5 w-5 text-orange-600" />
                <span className="font-medium text-orange-700">Offers</span>
              </div>
              <ChevronRight className="h-5 w-5 text-orange-400" />
            </button>

            {/* Action Buttons */}
            <div className="flex gap-3 pt-2">
              <Button
                variant="outline"
                onClick={() => setStep('upload')}
                className="flex-1"
                disabled={broadcasting}
              >
                Back
              </Button>
              <Button
                onClick={broadcastToHelpers}
                disabled={broadcasting}
                className="flex-[2] bg-emerald-500 hover:bg-emerald-600 text-white py-5 font-bold"
              >
                {broadcasting ? (
                  <>
                    <Loader2 className="h-5 w-5 mr-2 animate-spin" />
                    Notifying...
                  </>
                ) : (
                  <>
                    <Sparkles className="h-5 w-5 mr-2" />
                    Broadcast ₹{getPriceForTier(aiAnalysis.estimatedPrice, selectedTier)}
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
