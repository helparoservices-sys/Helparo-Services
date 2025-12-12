'use client'

import { useState, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { toast } from 'sonner'
import AddressInteractiveMap from '@/components/address-interactive-map'
import { 
  ArrowLeft, 
  Sparkles,
  Send,
  Shield,
  Camera,
  Image as ImageIcon,
  Video,
  X,
  Loader2,
  MapPin,
  Clock,
  AlertTriangle,
  Lightbulb,
  CheckCircle2,
  ChevronDown
} from 'lucide-react'

const categories = [
  { id: 'cleaning', name: 'Cleaning', emoji: '🧹' },
  { id: 'plumbing', name: 'Plumbing', emoji: '🔧' },
  { id: 'electrical', name: 'Electrical', emoji: '⚡' },
  { id: 'ac-repair', name: 'AC Repair', emoji: '❄️' },
  { id: 'automotive', name: 'Automotive', emoji: '🚗' },
  { id: 'tech', name: 'Tech Support', emoji: '💻' },
  { id: 'carpentry', name: 'Carpentry', emoji: '🪚' },
  { id: 'painting', name: 'Painting', emoji: '🎨' },
  { id: 'appliance', name: 'Appliance Repair', emoji: '🔌' },
  { id: 'pest-control', name: 'Pest Control', emoji: '🐜' },
  { id: 'other', name: 'Other', emoji: '✨' },
]

const urgencyOptions = [
  { id: 'flexible', label: 'Flexible (1-2 days)', description: 'No rush' },
  { id: 'today', label: 'Today', description: 'Within today' },
  { id: 'urgent', label: 'Urgent (2-4 hrs)', description: 'Need ASAP' },
  { id: 'emergency', label: 'Emergency (1 hr)', description: 'Right now!' },
]

const howLongOptions = [
  { id: 'just-now', label: 'Just now' },
  { id: 'few-hours', label: 'Few hours' },
  { id: 'today', label: 'Today' },
  { id: 'few-days', label: 'Few days' },
  { id: 'week', label: 'More than a week' },
]

export default function AIRequestPage() {
  const router = useRouter()
  const supabase = createClient()
  const fileInputRef = useRef<HTMLInputElement>(null)
  const cameraInputRef = useRef<HTMLInputElement>(null)
  const videoInputRef = useRef<HTMLInputElement>(null)
  
  const [step, setStep] = useState(1) // 1: Upload, 2: Review, 3: Done
  const [loading, setLoading] = useState(false)
  const [analyzing, setAnalyzing] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [images, setImages] = useState<string[]>([])
  const [videos, setVideos] = useState<string[]>([])
  const [showCategoryDropdown, setShowCategoryDropdown] = useState(false)
  const [showUrgencyDropdown, setShowUrgencyDropdown] = useState(false)
  const [showHowLongDropdown, setShowHowLongDropdown] = useState(false)
  
  const [formData, setFormData] = useState({
    category: '',
    location: '',
    latitude: null as number | null,
    longitude: null as number | null,
    flatNo: '',
    floor: '',
    landmark: '',
    description: '',
    errorCode: '',
    howLong: '',
    triedFixing: '',
    urgency: '',
  })

  const [aiResult, setAiResult] = useState<{
    category: string;
    categoryName: string;
    estimatedPrice: number;
    confidence: number;
  } | null>(null)

  const handleAddressSelect = (addressData: { 
    display_name: string; 
    city: string;
    state: string;
    pincode: string;
    lat: number; 
    lng: number 
  }) => {
    setFormData(prev => ({
      ...prev,
      location: addressData.display_name,
      latitude: addressData.lat,
      longitude: addressData.lng,
    }))
  }

  // Convert file to base64
  const fileToDataUrl = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader()
      reader.onload = () => resolve(reader.result as string)
      reader.onerror = reject
      reader.readAsDataURL(file)
    })
  }

  // Compress image before storing
  const compressImage = async (file: File, maxWidth = 800): Promise<string> => {
    return new Promise((resolve, reject) => {
      const img = new window.Image()
      img.onload = () => {
        const canvas = document.createElement('canvas')
        let { width, height } = img
        
        if (width > maxWidth) {
          height = (height * maxWidth) / width
          width = maxWidth
        }
        
        canvas.width = width
        canvas.height = height
        
        const ctx = canvas.getContext('2d')
        ctx?.drawImage(img, 0, 0, width, height)
        
        resolve(canvas.toDataURL('image/jpeg', 0.7))
      }
      img.onerror = reject
      img.src = URL.createObjectURL(file)
    })
  }

  // Handle image selection
  const handleImageSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files
    if (!files || files.length === 0) return

    if (images.length + files.length > 5) {
      toast.error('Maximum 5 photos allowed')
      return
    }

    setUploading(true)
    try {
      for (const file of Array.from(files)) {
        if (file.size > 10 * 1024 * 1024) {
          toast.error('Image too large (max 10MB)')
          continue
        }
        const dataUrl = await compressImage(file)
        setImages(prev => [...prev, dataUrl])
      }
      toast.success('Photo added!')
    } catch (err) {
      console.error('Image error:', err)
      toast.error('Failed to add photo')
    } finally {
      setUploading(false)
      e.target.value = ''
    }
  }

  // Handle video selection
  const handleVideoSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files
    if (!files || files.length === 0) return

    if (videos.length >= 2) {
      toast.error('Maximum 2 videos allowed')
      return
    }

    setUploading(true)
    try {
      const file = files[0]
      if (file.size > 50 * 1024 * 1024) {
        toast.error('Video too large (max 50MB)')
        return
      }
      const dataUrl = await fileToDataUrl(file)
      setVideos(prev => [...prev, dataUrl])
      toast.success('Video added!')
    } catch (err) {
      console.error('Video error:', err)
      toast.error('Failed to add video')
    } finally {
      setUploading(false)
      e.target.value = ''
    }
  }

  const removeImage = (index: number) => {
    setImages(prev => prev.filter((_, i) => i !== index))
  }

  const removeVideo = (index: number) => {
    setVideos(prev => prev.filter((_, i) => i !== index))
  }

  // Simple category detection fallback
  const detectCategory = (text: string) => {
    const lower = text.toLowerCase()
    if (lower.includes('plumb') || lower.includes('tap') || lower.includes('leak') || lower.includes('pipe') || lower.includes('toilet')) {
      return { id: 'plumbing', name: 'Plumbing', basePrice: 300 }
    }
    if (lower.includes('electric') || lower.includes('wire') || lower.includes('switch') || lower.includes('fan') || lower.includes('light')) {
      return { id: 'electrical', name: 'Electrical', basePrice: 250 }
    }
    if (lower.includes('clean') || lower.includes('wash') || lower.includes('dust') || lower.includes('mop')) {
      return { id: 'cleaning', name: 'Cleaning', basePrice: 500 }
    }
    if (lower.includes('ac') || lower.includes('air condition') || lower.includes('cool')) {
      return { id: 'ac-repair', name: 'AC Repair', basePrice: 400 }
    }
    if (lower.includes('paint') || lower.includes('wall') || lower.includes('color')) {
      return { id: 'painting', name: 'Painting', basePrice: 1000 }
    }
    if (lower.includes('car') || lower.includes('bike') || lower.includes('vehicle')) {
      return { id: 'automotive', name: 'Automotive', basePrice: 500 }
    }
    if (lower.includes('pest') || lower.includes('cockroach') || lower.includes('rat') || lower.includes('ant')) {
      return { id: 'pest-control', name: 'Pest Control', basePrice: 600 }
    }
    if (lower.includes('wood') || lower.includes('door') || lower.includes('furniture') || lower.includes('cabinet')) {
      return { id: 'carpentry', name: 'Carpentry', basePrice: 500 }
    }
    return { id: 'other', name: 'General', basePrice: 300 }
  }

  // AI Analysis
  const handleAnalyze = async () => {
    // Validation
    if (images.length < 3) {
      toast.error('Please upload at least 3 photos')
      return
    }
    if (!formData.category) {
      toast.error('Please select a service category')
      return
    }
    if (!formData.location || !formData.latitude) {
      toast.error('Please select your location')
      return
    }
    if (!formData.description.trim()) {
      toast.error('Please describe the problem')
      return
    }
    if (!formData.urgency) {
      toast.error('Please select when you need help')
      return
    }

    setAnalyzing(true)
    try {
      const response = await fetch('/api/ai/analyze-request', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          description: formData.description,
          category: formData.category,
          images: images,
          errorCode: formData.errorCode,
          howLong: formData.howLong,
          urgency: formData.urgency,
        })
      })

      if (!response.ok) {
        const category = detectCategory(formData.description)
        setAiResult({
          category: formData.category || category.id,
          categoryName: categories.find(c => c.id === formData.category)?.name || category.name,
          estimatedPrice: category.basePrice,
          confidence: 85,
        })
      } else {
        const data = await response.json()
        setAiResult(data)
      }
      
      setStep(2) // Move to review step
    } catch (err) {
      const category = detectCategory(formData.description)
      setAiResult({
        category: formData.category || category.id,
        categoryName: categories.find(c => c.id === formData.category)?.name || category.name,
        estimatedPrice: category.basePrice,
        confidence: 85,
      })
      setStep(2)
    } finally {
      setAnalyzing(false)
    }
  }

  const handleSubmit = async () => {
    if (!aiResult) return

    setLoading(true)
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        router.push('/auth/login')
        return
      }

      const fullAddress = [
        formData.flatNo && `Flat ${formData.flatNo}`,
        formData.floor && `Floor ${formData.floor}`,
        formData.location,
        formData.landmark && `Near ${formData.landmark}`,
      ].filter(Boolean).join(', ')

      const broadcastResponse = await fetch('/api/requests/broadcast', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          categoryId: aiResult.category,
          categoryName: aiResult.categoryName,
          description: formData.description,
          address: fullAddress,
          locationLat: formData.latitude,
          locationLng: formData.longitude,
          images: images,
          videos: videos,
          estimatedPrice: aiResult.estimatedPrice,
          urgency: formData.urgency,
          paymentMethod: 'cash',
          isAiRequest: true,
          additionalInfo: {
            errorCode: formData.errorCode,
            howLong: formData.howLong,
            triedFixing: formData.triedFixing,
            flatNo: formData.flatNo,
            floor: formData.floor,
            landmark: formData.landmark,
          }
        })
      })
      
      const broadcastData = await broadcastResponse.json()
      
      if (!broadcastResponse.ok) {
        throw new Error(broadcastData.error || 'Failed to post request')
      }
      
      setStep(3) // Done step
      
      setTimeout(() => {
        router.push(`/customer/requests/${broadcastData.requestId}/track`)
      }, 2000)
      
    } catch (err) {
      console.error('Submit error:', err)
      toast.error('Failed to create request')
    } finally {
      setLoading(false)
    }
  }

  const selectedCategory = categories.find(c => c.id === formData.category)
  const selectedUrgency = urgencyOptions.find(u => u.id === formData.urgency)
  const selectedHowLong = howLongOptions.find(h => h.id === formData.howLong)

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="sticky top-0 z-50 bg-white border-b border-gray-200 shadow-sm">
        <div className="max-w-2xl mx-auto px-4 py-3 flex items-center gap-3">
          <button 
            onClick={() => step > 1 ? setStep(step - 1) : router.back()}
            className="p-2 hover:bg-gray-100 rounded-full transition-colors"
          >
            <ArrowLeft className="w-5 h-5 text-gray-700" />
          </button>
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-gradient-to-br from-emerald-500 to-teal-600 rounded-full flex items-center justify-center">
              <Sparkles className="w-4 h-4 text-white" />
            </div>
            <div>
              <h1 className="text-lg font-semibold text-gray-900">AI Smart Request</h1>
              <p className="text-xs text-gray-500">Get instant pricing from AI</p>
            </div>
          </div>
        </div>
      </div>

      {/* Progress Steps */}
      <div className="bg-white border-b border-gray-100">
        <div className="max-w-2xl mx-auto px-4 py-3">
          <div className="flex items-center justify-between">
            {[
              { num: 1, label: 'Upload' },
              { num: 2, label: 'Review' },
              { num: 3, label: 'Done' },
            ].map((s, i) => (
              <div key={s.num} className="flex items-center">
                <div className={`flex items-center gap-2 ${step >= s.num ? 'text-emerald-600' : 'text-gray-400'}`}>
                  <div className={`w-7 h-7 rounded-full flex items-center justify-center text-sm font-semibold ${
                    step > s.num ? 'bg-emerald-500 text-white' :
                    step === s.num ? 'bg-emerald-500 text-white' : 'bg-gray-200 text-gray-500'
                  }`}>
                    {step > s.num ? <CheckCircle2 className="w-4 h-4" /> : s.num}
                  </div>
                  <span className={`text-sm font-medium ${step >= s.num ? 'text-gray-900' : 'text-gray-400'}`}>{s.label}</span>
                </div>
                {i < 2 && <div className={`w-16 h-0.5 mx-3 ${step > s.num ? 'bg-emerald-500' : 'bg-gray-200'}`} />}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Step 1: Upload Form */}
      {step === 1 && (
        <div className="max-w-2xl mx-auto px-4 py-5 space-y-4">
          
          {/* Photos & Videos */}
          <div className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100">
            <div className="flex items-center justify-between mb-3">
              <label className="text-sm font-semibold text-gray-800 flex items-center gap-2">
                <ImageIcon className="w-4 h-4 text-emerald-600" />
                Photos & Videos
              </label>
              <span className="text-xs text-orange-600 font-medium">3-5 photos required</span>
            </div>
            
            {/* Upload Buttons */}
            <div className="flex gap-2 mb-3">
              <button
                onClick={() => fileInputRef.current?.click()}
                disabled={uploading || images.length >= 5}
                className="flex-1 flex flex-col items-center justify-center gap-1 py-4 px-3 bg-gray-50 text-gray-600 rounded-xl border-2 border-dashed border-gray-200 hover:border-emerald-300 hover:bg-emerald-50 disabled:opacity-50 transition-all"
              >
                <ImageIcon className="w-6 h-6" />
                <span className="text-xs font-medium">Gallery</span>
              </button>
              <button
                onClick={() => cameraInputRef.current?.click()}
                disabled={uploading || images.length >= 5}
                className="flex-1 flex flex-col items-center justify-center gap-1 py-4 px-3 bg-emerald-50 text-emerald-700 rounded-xl border-2 border-dashed border-emerald-200 hover:bg-emerald-100 disabled:opacity-50 transition-all"
              >
                <Camera className="w-6 h-6" />
                <span className="text-xs font-medium">Camera</span>
              </button>
              <button
                onClick={() => videoInputRef.current?.click()}
                disabled={uploading || videos.length >= 2}
                className="flex-1 flex flex-col items-center justify-center gap-1 py-4 px-3 bg-gray-50 text-gray-600 rounded-xl border-2 border-dashed border-gray-200 hover:border-purple-300 hover:bg-purple-50 disabled:opacity-50 transition-all"
              >
                <Video className="w-6 h-6" />
                <span className="text-xs font-medium">Video</span>
              </button>
            </div>

            {/* Video from gallery */}
            <button
              onClick={() => videoInputRef.current?.click()}
              disabled={uploading || videos.length >= 2}
              className="w-full py-2.5 text-sm text-gray-600 bg-gray-50 rounded-xl border border-gray-200 hover:bg-gray-100 disabled:opacity-50 flex items-center justify-center gap-2"
            >
              <Video className="w-4 h-4" />
              Upload Video from Gallery (max 50MB)
            </button>

            {/* Counts */}
            <div className="flex items-center gap-4 mt-3 text-xs text-gray-500">
              <span>📷 {images.length}/5 photos</span>
              <span>🎥 {videos.length}/2 videos</span>
            </div>

            {/* Preview Images */}
            {images.length > 0 && (
              <div className="flex gap-2 flex-wrap mt-3">
                {images.map((url, idx) => (
                  <div key={idx} className="relative w-16 h-16 rounded-lg overflow-hidden border border-gray-200">
                    <img src={url} alt="" className="w-full h-full object-cover" />
                    <button
                      onClick={() => removeImage(idx)}
                      className="absolute top-0.5 right-0.5 p-0.5 bg-red-500 text-white rounded-full"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </div>
                ))}
              </div>
            )}

            {/* Preview Videos */}
            {videos.length > 0 && (
              <div className="flex gap-2 flex-wrap mt-2">
                {videos.map((url, idx) => (
                  <div key={idx} className="relative w-20 h-14 rounded-lg overflow-hidden border border-gray-200 bg-gray-900">
                    <video src={url} className="w-full h-full object-cover" />
                    <button
                      onClick={() => removeVideo(idx)}
                      className="absolute top-0.5 right-0.5 p-0.5 bg-red-500 text-white rounded-full"
                    >
                      <X className="w-3 h-3" />
                    </button>
                    <div className="absolute bottom-0.5 left-0.5 px-1 py-0.5 bg-black/60 rounded text-[8px] text-white">Video</div>
                  </div>
                ))}
              </div>
            )}

            {/* Tip */}
            <div className="mt-3 p-2.5 bg-amber-50 rounded-xl border border-amber-100">
              <p className="text-xs text-amber-800 flex items-start gap-2">
                <Lightbulb className="w-4 h-4 flex-shrink-0 mt-0.5" />
                <span><strong>Tip:</strong> Record a short video explaining the problem with your voice. This helps the helper understand the issue better before arriving.</span>
              </p>
            </div>

            {/* Hidden Inputs */}
            <input ref={fileInputRef} type="file" accept="image/*" multiple onChange={handleImageSelect} className="hidden" />
            <input ref={cameraInputRef} type="file" accept="image/*" capture="environment" onChange={handleImageSelect} className="hidden" />
            <input ref={videoInputRef} type="file" accept="video/*" onChange={handleVideoSelect} className="hidden" />
          </div>

          {/* Service Category */}
          <div className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100">
            <label className="text-sm font-semibold text-gray-800 mb-2 flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-emerald-600" />
              Service Category <span className="text-red-500">*</span>
            </label>
            <div className="relative">
              <button
                onClick={() => setShowCategoryDropdown(!showCategoryDropdown)}
                className="w-full p-3 border border-gray-200 rounded-xl text-left flex items-center justify-between hover:border-emerald-300 transition-colors"
              >
                <span className={selectedCategory ? 'text-gray-900' : 'text-gray-400'}>
                  {selectedCategory ? `${selectedCategory.emoji} ${selectedCategory.name}` : 'Select a category...'}
                </span>
                <ChevronDown className={`w-5 h-5 text-gray-400 transition-transform ${showCategoryDropdown ? 'rotate-180' : ''}`} />
              </button>
              {showCategoryDropdown && (
                <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-gray-200 rounded-xl shadow-lg z-10 max-h-60 overflow-y-auto">
                  {categories.map((cat) => (
                    <button
                      key={cat.id}
                      onClick={() => {
                        setFormData(prev => ({ ...prev, category: cat.id }))
                        setShowCategoryDropdown(false)
                      }}
                      className={`w-full p-3 text-left hover:bg-emerald-50 flex items-center gap-2 ${
                        formData.category === cat.id ? 'bg-emerald-50 text-emerald-700' : ''
                      }`}
                    >
                      <span>{cat.emoji}</span>
                      <span>{cat.name}</span>
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Service Location */}
          <div className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100">
            <label className="text-sm font-semibold text-gray-800 mb-2 flex items-center gap-2">
              <MapPin className="w-4 h-4 text-emerald-600" />
              Service Location <span className="text-red-500">*</span>
            </label>
            <AddressInteractiveMap
              value={formData.location}
              onChange={(value) => setFormData(prev => ({ ...prev, location: value }))}
              onAddressSelect={handleAddressSelect}
              showMap={true}
              mapHeight="180px"
            />
          </div>

          {/* Complete Address */}
          <div className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100 space-y-3">
            <h3 className="text-sm font-semibold text-gray-800">Complete Address</h3>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs text-gray-600 mb-1 block">Flat/House No. <span className="text-red-500">*</span></label>
                <Input
                  placeholder="e.g., A-101"
                  value={formData.flatNo}
                  onChange={(e) => setFormData(prev => ({ ...prev, flatNo: e.target.value }))}
                  className="h-10 text-sm"
                />
              </div>
              <div>
                <label className="text-xs text-gray-600 mb-1 block">Floor</label>
                <Input
                  placeholder="e.g., 2nd"
                  value={formData.floor}
                  onChange={(e) => setFormData(prev => ({ ...prev, floor: e.target.value }))}
                  className="h-10 text-sm"
                />
              </div>
            </div>
            <div>
              <label className="text-xs text-gray-600 mb-1 block">Landmark (optional)</label>
              <Input
                placeholder="e.g., Near SBI Bank"
                value={formData.landmark}
                onChange={(e) => setFormData(prev => ({ ...prev, landmark: e.target.value }))}
                className="h-10 text-sm"
              />
            </div>
          </div>

          {/* Describe the Problem */}
          <div className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100">
            <label className="text-sm font-semibold text-gray-800 mb-2 flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-orange-500" />
              Describe the Problem <span className="text-red-500">*</span>
            </label>
            <Textarea
              placeholder="Describe the issue in detail... E.g., AC not cooling, water leaking from pipe, switch giving shock"
              value={formData.description}
              onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
              rows={3}
              className="text-sm border-gray-200 focus:border-emerald-500 rounded-xl resize-none"
            />
          </div>

          {/* Additional Details */}
          <div className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100 space-y-3">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs text-gray-600 mb-1 block">Error Code (if any)</label>
                <Input
                  placeholder="E.g., E1, F03, NA"
                  value={formData.errorCode}
                  onChange={(e) => setFormData(prev => ({ ...prev, errorCode: e.target.value }))}
                  className="h-10 text-sm"
                />
              </div>
              <div>
                <label className="text-xs text-gray-600 mb-1 block">How long?</label>
                <div className="relative">
                  <button
                    onClick={() => setShowHowLongDropdown(!showHowLongDropdown)}
                    className="w-full h-10 px-3 border border-gray-200 rounded-lg text-left flex items-center justify-between text-sm hover:border-emerald-300"
                  >
                    <span className={selectedHowLong ? 'text-gray-900' : 'text-gray-400'}>
                      {selectedHowLong?.label || 'Select...'}
                    </span>
                    <ChevronDown className="w-4 h-4 text-gray-400" />
                  </button>
                  {showHowLongDropdown && (
                    <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-gray-200 rounded-lg shadow-lg z-10">
                      {howLongOptions.map((opt) => (
                        <button
                          key={opt.id}
                          onClick={() => {
                            setFormData(prev => ({ ...prev, howLong: opt.id }))
                            setShowHowLongDropdown(false)
                          }}
                          className="w-full p-2.5 text-left text-sm hover:bg-emerald-50"
                        >
                          {opt.label}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>
            <div>
              <label className="text-xs text-gray-600 mb-1 block">Tried fixing yourself?</label>
              <Textarea
                placeholder="What you've tried, or type 'NA'"
                value={formData.triedFixing}
                onChange={(e) => setFormData(prev => ({ ...prev, triedFixing: e.target.value }))}
                rows={2}
                className="text-sm"
              />
            </div>
          </div>

          {/* Urgency */}
          <div className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100">
            <label className="text-sm font-semibold text-gray-800 mb-2 flex items-center gap-2">
              <Clock className="w-4 h-4 text-emerald-600" />
              When do you need help?
            </label>
            <div className="relative">
              <button
                onClick={() => setShowUrgencyDropdown(!showUrgencyDropdown)}
                className="w-full p-3 border border-gray-200 rounded-xl text-left flex items-center justify-between hover:border-emerald-300"
              >
                <span className={selectedUrgency ? 'text-gray-900' : 'text-gray-400'}>
                  {selectedUrgency?.label || 'Select urgency...'}
                </span>
                <ChevronDown className={`w-5 h-5 text-gray-400 transition-transform ${showUrgencyDropdown ? 'rotate-180' : ''}`} />
              </button>
              {showUrgencyDropdown && (
                <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-gray-200 rounded-xl shadow-lg z-10">
                  {urgencyOptions.map((opt) => (
                    <button
                      key={opt.id}
                      onClick={() => {
                        setFormData(prev => ({ ...prev, urgency: opt.id }))
                        setShowUrgencyDropdown(false)
                      }}
                      className={`w-full p-3 text-left hover:bg-emerald-50 ${
                        formData.urgency === opt.id ? 'bg-emerald-50 text-emerald-700' : ''
                      }`}
                    >
                      <div className="font-medium text-sm">{opt.label}</div>
                      <div className="text-xs text-gray-500">{opt.description}</div>
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Analyze Button */}
          <Button
            onClick={handleAnalyze}
            disabled={analyzing || uploading}
            className="w-full h-14 bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 text-white font-bold text-base rounded-xl shadow-lg"
          >
            {analyzing ? (
              <>
                <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                AI is analyzing...
              </>
            ) : (
              <>
                <Sparkles className="w-5 h-5 mr-2" />
                Analyze with AI & Get Price
              </>
            )}
          </Button>

          {/* Photos reminder */}
          {images.length < 3 && (
            <p className="text-center text-sm text-orange-600">
              Upload {3 - images.length} more photo(s)
            </p>
          )}
        </div>
      )}

      {/* Step 2: Review */}
      {step === 2 && aiResult && (
        <div className="max-w-2xl mx-auto px-4 py-5 space-y-4">
          {/* AI Result */}
          <div className="bg-gradient-to-br from-emerald-500 to-teal-600 rounded-2xl p-5 text-white">
            <div className="flex items-center gap-2 mb-3">
              <Sparkles className="w-5 h-5" />
              <span className="font-semibold">AI Estimated Price</span>
              <span className="ml-auto text-xs bg-white/20 px-2 py-0.5 rounded-full">{aiResult.confidence}% confident</span>
            </div>
            <div className="text-4xl font-black mb-1">₹{aiResult.estimatedPrice}</div>
            <p className="text-emerald-100 text-sm">{aiResult.categoryName} • Final price may vary</p>
          </div>

          {/* Summary */}
          <div className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100 space-y-3">
            <h3 className="font-semibold text-gray-900">Request Summary</h3>
            
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-500">Category</span>
                <span className="font-medium">{selectedCategory?.emoji} {aiResult.categoryName}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">Location</span>
                <span className="font-medium text-right max-w-[60%] truncate">{formData.flatNo}, {formData.location.split(',')[0]}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">Urgency</span>
                <span className="font-medium">{selectedUrgency?.label}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">Photos/Videos</span>
                <span className="font-medium">{images.length} photos, {videos.length} videos</span>
              </div>
            </div>

            <div className="pt-3 border-t border-gray-100">
              <p className="text-xs text-gray-500 mb-1">Problem</p>
              <p className="text-sm text-gray-800">{formData.description}</p>
            </div>
          </div>

          {/* Trust badges */}
          <div className="flex items-center justify-center gap-6 py-2 text-sm text-gray-500">
            <span className="flex items-center gap-1.5">
              <Shield className="w-4 h-4 text-emerald-500" />
              Verified helpers
            </span>
            <span className="flex items-center gap-1.5">
              <CheckCircle2 className="w-4 h-4 text-blue-500" />
              Money-back guarantee
            </span>
          </div>

          {/* Submit Button */}
          <Button
            onClick={handleSubmit}
            disabled={loading}
            className="w-full h-14 bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 text-white font-bold text-base rounded-xl shadow-lg"
          >
            {loading ? (
              <>
                <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                Posting request...
              </>
            ) : (
              <>
                <Send className="w-5 h-5 mr-2" />
                Confirm & Post Request
              </>
            )}
          </Button>
        </div>
      )}

      {/* Step 3: Done */}
      {step === 3 && (
        <div className="max-w-2xl mx-auto px-4 py-20 text-center">
          <div className="w-20 h-20 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <CheckCircle2 className="w-10 h-10 text-emerald-600" />
          </div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Request Posted! 🎉</h2>
          <p className="text-gray-600 mb-4">Helpers nearby are being notified...</p>
          <div className="flex items-center justify-center gap-2 text-sm text-gray-500">
            <Loader2 className="w-4 h-4 animate-spin" />
            Redirecting to tracking page...
          </div>
        </div>
      )}
    </div>
  )
}
