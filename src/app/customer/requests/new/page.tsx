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
  MapPin, 
  Clock, 
  IndianRupee,
  Sparkles,
  Send,
  Shield,
  Star,
  Users,
  CheckCircle2,
  Camera,
  Image as ImageIcon,
  Video,
  X,
  Loader2,
  Banknote,
  Smartphone
} from 'lucide-react'

const categories = [
  { id: 'cleaning', name: 'Cleaning', emoji: '🧹' },
  { id: 'plumbing', name: 'Plumbing', emoji: '🔧' },
  { id: 'electrical', name: 'Electrical', emoji: '⚡' },
  { id: 'automotive', name: 'Automotive', emoji: '🚗' },
  { id: 'tech', name: 'Tech', emoji: '💻' },
  { id: 'delivery', name: 'Delivery', emoji: '📦' },
  { id: 'personal', name: 'Care', emoji: '💆' },
  { id: 'other', name: 'Other', emoji: '✨' },
]

const urgencyOptions = [
  { id: 'low', label: 'Flexible', color: 'border-green-300 bg-green-50 text-green-700', selected: 'border-green-500 bg-green-500 text-white' },
  { id: 'medium', label: 'Normal', color: 'border-amber-300 bg-amber-50 text-amber-700', selected: 'border-amber-500 bg-amber-500 text-white' },
  { id: 'high', label: 'Urgent', color: 'border-orange-300 bg-orange-50 text-orange-700', selected: 'border-orange-500 bg-orange-500 text-white' },
  { id: 'emergency', label: 'ASAP', color: 'border-red-300 bg-red-50 text-red-700', selected: 'border-red-500 bg-red-500 text-white' },
]

export default function NewRequestPage() {
  const router = useRouter()
  const supabase = createClient()
  const fileInputRef = useRef<HTMLInputElement>(null)
  const cameraInputRef = useRef<HTMLInputElement>(null)
  const videoInputRef = useRef<HTMLInputElement>(null)
  
  const [loading, setLoading] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [images, setImages] = useState<string[]>([])
  const [videos, setVideos] = useState<string[]>([])
  const [formData, setFormData] = useState({
    category: '',
    title: '',
    description: '',
    location: '',
    latitude: null as number | null,
    longitude: null as number | null,
    budget: '',
    urgency: 'medium',
    paymentMethod: 'cash', // cash, upi
  })

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

  // Convert file to base64 data URL (works without storage buckets)
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
      const img = new Image()
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
        // Compress and convert to base64
        const dataUrl = await compressImage(file)
        setImages(prev => [...prev, dataUrl])
      }
      toast.success('Photos added!')
    } catch (error) {
      console.error('Image error:', error)
      toast.error('Failed to add photos')
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
      if (file.size > 20 * 1024 * 1024) {
        toast.error('Video too large (max 20MB)')
        return
      }
      // Convert to base64 data URL
      const dataUrl = await fileToDataUrl(file)
      setVideos(prev => [...prev, dataUrl])
      toast.success('Video added!')
    } catch (error) {
      console.error('Video error:', error)
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

  const handleSubmit = async () => {
    // Validation
    if (!formData.category) {
      toast.error('Please select a category')
      return
    }
    if (!formData.title.trim()) {
      toast.error('Please enter a title')
      return
    }
    if (!formData.budget || parseFloat(formData.budget) <= 0) {
      toast.error('Please enter your budget')
      return
    }
    if (!formData.location || !formData.latitude) {
      toast.error('Please select your location on the map')
      return
    }

    setLoading(true)
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        router.push('/auth/signin')
        return
      }

      // Call broadcast API - it creates the request AND notifies helpers
      const broadcastResponse = await fetch('/api/requests/broadcast', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          categoryId: formData.category,
          categoryName: categories.find(c => c.id === formData.category)?.name,
          description: formData.description || formData.title,
          address: formData.location,
          locationLat: formData.latitude,
          locationLng: formData.longitude,
          images: images,
          videos: videos,
          estimatedPrice: parseFloat(formData.budget),
          urgency: formData.urgency,
          paymentMethod: formData.paymentMethod, // Include payment method
        })
      })
      
      const broadcastData = await broadcastResponse.json()
      console.log('Broadcast result:', broadcastData)
      
      if (!broadcastResponse.ok) {
        throw new Error(broadcastData.error || 'Failed to post request')
      }
      
      if (broadcastData.helpersNotified > 0) {
        toast.success(`🎉 Request posted! Notified ${broadcastData.helpersNotified} helpers nearby`)
      } else {
        toast.success('Request Posted! 🎉 Finding helpers...')
      }

      router.push(`/customer/requests/${broadcastData.requestId}/track`)
    } catch (error: any) {
      console.error('Submit error:', error)
      toast.error(error.message || 'Failed to create request')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="sticky top-0 z-50 bg-white border-b border-gray-200 shadow-sm">
        <div className="max-w-2xl mx-auto px-4 py-3 flex items-center gap-3">
          <button 
            onClick={() => router.back()}
            className="p-2 hover:bg-gray-100 rounded-full transition-colors"
          >
            <ArrowLeft className="w-5 h-5 text-gray-700" />
          </button>
          <h1 className="text-lg font-semibold text-gray-900">Post a Request</h1>
        </div>
      </div>

      {/* Form Content */}
      <div className="max-w-2xl mx-auto px-4 py-5 space-y-4">
        
        {/* Category Selection */}
        <div className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100">
          <label className="text-sm font-semibold text-gray-800 mb-3 block">
            What do you need? <span className="text-red-500">*</span>
          </label>
          <div className="grid grid-cols-4 gap-2">
            {categories.map((cat) => {
              const isSelected = formData.category === cat.id
              return (
                <button
                  key={cat.id}
                  onClick={() => setFormData(prev => ({ ...prev, category: cat.id }))}
                  className={`p-2.5 rounded-xl border-2 transition-all text-center ${
                    isSelected 
                      ? 'border-emerald-500 bg-emerald-50' 
                      : 'border-gray-200 bg-white hover:border-gray-300'
                  }`}
                >
                  <div className="text-xl">{cat.emoji}</div>
                  <div className={`text-[10px] font-medium mt-0.5 ${isSelected ? 'text-emerald-700' : 'text-gray-600'}`}>
                    {cat.name}
                  </div>
                </button>
              )
            })}
          </div>
        </div>

        {/* Title & Description */}
        <div className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100 space-y-3">
          <div>
            <label className="text-sm font-semibold text-gray-800 mb-1.5 block">
              What's the problem? <span className="text-red-500">*</span>
            </label>
            <Input
              placeholder="e.g., Fix leaking kitchen tap"
              value={formData.title}
              onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
              className="h-11 text-base border-gray-200 focus:border-emerald-500 rounded-xl"
            />
          </div>

          <div>
            <label className="text-sm font-semibold text-gray-800 mb-1.5 block">
              More details <span className="text-gray-400 font-normal text-xs">(optional)</span>
            </label>
            <Textarea
              placeholder="Describe the issue..."
              value={formData.description}
              onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
              rows={2}
              className="text-base border-gray-200 focus:border-emerald-500 rounded-xl resize-none"
            />
          </div>
        </div>

        {/* Photos & Videos */}
        <div className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100">
          <label className="text-sm font-semibold text-gray-800 mb-3 block">
            Add Photos/Videos <span className="text-gray-400 font-normal text-xs">(helps helpers understand)</span>
          </label>
          
          {/* Upload Buttons */}
          <div className="flex gap-2 mb-3">
            <button
              onClick={() => cameraInputRef.current?.click()}
              disabled={uploading || images.length >= 5}
              className="flex-1 flex items-center justify-center gap-2 py-2.5 px-3 bg-emerald-50 text-emerald-700 rounded-xl border border-emerald-200 hover:bg-emerald-100 disabled:opacity-50 transition-colors"
            >
              <Camera className="w-4 h-4" />
              <span className="text-sm font-medium">Camera</span>
            </button>
            <button
              onClick={() => fileInputRef.current?.click()}
              disabled={uploading || images.length >= 5}
              className="flex-1 flex items-center justify-center gap-2 py-2.5 px-3 bg-blue-50 text-blue-700 rounded-xl border border-blue-200 hover:bg-blue-100 disabled:opacity-50 transition-colors"
            >
              <ImageIcon className="w-4 h-4" />
              <span className="text-sm font-medium">Gallery</span>
            </button>
            <button
              onClick={() => videoInputRef.current?.click()}
              disabled={uploading || videos.length >= 2}
              className="flex-1 flex items-center justify-center gap-2 py-2.5 px-3 bg-purple-50 text-purple-700 rounded-xl border border-purple-200 hover:bg-purple-100 disabled:opacity-50 transition-colors"
            >
              <Video className="w-4 h-4" />
              <span className="text-sm font-medium">Video</span>
            </button>
          </div>

          {/* Hidden Inputs */}
          <input
            ref={cameraInputRef}
            type="file"
            accept="image/*"
            capture="environment"
            onChange={handleImageSelect}
            className="hidden"
          />
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            multiple
            onChange={handleImageSelect}
            className="hidden"
          />
          <input
            ref={videoInputRef}
            type="file"
            accept="video/*"
            onChange={handleVideoSelect}
            className="hidden"
          />

          {/* Uploading indicator */}
          {uploading && (
            <div className="flex items-center gap-2 text-sm text-gray-500 mb-3">
              <Loader2 className="w-4 h-4 animate-spin" />
              Uploading...
            </div>
          )}

          {/* Preview Images */}
          {images.length > 0 && (
            <div className="flex gap-2 flex-wrap mb-2">
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
            <div className="flex gap-2 flex-wrap">
              {videos.map((url, idx) => (
                <div key={idx} className="relative w-24 h-16 rounded-lg overflow-hidden border border-gray-200 bg-gray-900">
                  <video src={url} className="w-full h-full object-cover" />
                  <button
                    onClick={() => removeVideo(idx)}
                    className="absolute top-0.5 right-0.5 p-0.5 bg-red-500 text-white rounded-full"
                  >
                    <X className="w-3 h-3" />
                  </button>
                  <div className="absolute bottom-0.5 left-0.5 px-1 py-0.5 bg-black/60 rounded text-[8px] text-white">
                    Video
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Location */}
        <div className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100">
          <label className="text-sm font-semibold text-gray-800 mb-2 flex items-center gap-2">
            <MapPin className="w-4 h-4 text-emerald-600" />
            Where? <span className="text-red-500">*</span>
          </label>
          <div className="rounded-xl overflow-hidden border border-gray-200">
            <AddressInteractiveMap
              value={formData.location}
              onChange={(value) => setFormData(prev => ({ ...prev, location: value }))}
              onAddressSelect={handleAddressSelect}
              showMap={true}
              mapHeight="180px"
            />
          </div>
        </div>

        {/* Budget & Urgency */}
        <div className="grid grid-cols-2 gap-3">
          <div className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100">
            <label className="text-sm font-semibold text-gray-800 mb-2 flex items-center gap-1">
              <IndianRupee className="w-4 h-4 text-emerald-600" />
              Your Price <span className="text-red-500">*</span>
            </label>
            <Input
              type="number"
              placeholder="₹ Amount"
              value={formData.budget}
              onChange={(e) => setFormData(prev => ({ ...prev, budget: e.target.value }))}
              className="h-11 text-lg font-semibold border-gray-200 focus:border-emerald-500 rounded-xl"
            />
          </div>

          <div className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100">
            <label className="text-sm font-semibold text-gray-800 mb-2 flex items-center gap-1">
              <Clock className="w-4 h-4 text-emerald-600" />
              When?
            </label>
            <div className="grid grid-cols-2 gap-1.5">
              {urgencyOptions.map((opt) => {
                const isSelected = formData.urgency === opt.id
                return (
                  <button
                    key={opt.id}
                    onClick={() => setFormData(prev => ({ ...prev, urgency: opt.id }))}
                    className={`py-1.5 px-2 rounded-lg border text-xs font-medium transition-all ${
                      isSelected ? opt.selected : opt.color
                    }`}
                  >
                    {opt.label}
                  </button>
                )
              })}
            </div>
          </div>
        </div>

        {/* Payment Method Selection */}
        <div className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100">
          <label className="text-sm font-semibold text-gray-800 mb-3 flex items-center gap-2">
            <IndianRupee className="w-4 h-4 text-emerald-600" />
            Payment Method
          </label>
          <div className="grid grid-cols-2 gap-3">
            <button
              onClick={() => setFormData(prev => ({ ...prev, paymentMethod: 'cash' }))}
              className={`p-3 rounded-xl border-2 transition-all flex items-center gap-3 ${
                formData.paymentMethod === 'cash'
                  ? 'border-amber-500 bg-amber-50'
                  : 'border-gray-200 hover:border-gray-300'
              }`}
            >
              <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                formData.paymentMethod === 'cash' ? 'bg-amber-500 text-white' : 'bg-gray-100 text-gray-500'
              }`}>
                <Banknote className="w-5 h-5" />
              </div>
              <div className="text-left">
                <p className={`font-semibold text-sm ${formData.paymentMethod === 'cash' ? 'text-amber-700' : 'text-gray-700'}`}>
                  Cash
                </p>
                <p className="text-xs text-gray-500">Pay after service</p>
              </div>
            </button>
            <button
              onClick={() => setFormData(prev => ({ ...prev, paymentMethod: 'upi' }))}
              className={`p-3 rounded-xl border-2 transition-all flex items-center gap-3 ${
                formData.paymentMethod === 'upi'
                  ? 'border-blue-500 bg-blue-50'
                  : 'border-gray-200 hover:border-gray-300'
              }`}
            >
              <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                formData.paymentMethod === 'upi' ? 'bg-blue-500 text-white' : 'bg-gray-100 text-gray-500'
              }`}>
                <Smartphone className="w-5 h-5" />
              </div>
              <div className="text-left">
                <p className={`font-semibold text-sm ${formData.paymentMethod === 'upi' ? 'text-blue-700' : 'text-gray-700'}`}>
                  UPI/Online
                </p>
                <p className="text-xs text-gray-500">Pay securely online</p>
              </div>
            </button>
          </div>
        </div>

        {/* Submit Button */}
        <Button
          onClick={handleSubmit}
          disabled={loading || uploading}
          className="w-full h-14 text-base font-semibold bg-emerald-600 hover:bg-emerald-700 rounded-xl disabled:opacity-50 shadow-lg shadow-emerald-200"
        >
          {loading ? (
            <div className="flex items-center gap-2">
              <Loader2 className="w-5 h-5 animate-spin" />
              Finding Helpers...
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <Send className="w-5 h-5" />
              Post Request - ₹{formData.budget || '0'}
            </div>
          )}
        </Button>

        {/* Trust Badges */}
        <div className="flex items-center justify-center gap-6 py-3">
          <div className="flex items-center gap-1.5 text-gray-500">
            <Shield className="w-4 h-4 text-emerald-600" />
            <span className="text-xs">Verified</span>
          </div>
          <div className="flex items-center gap-1.5 text-gray-500">
            <Star className="w-4 h-4 text-emerald-600" />
            <span className="text-xs">4.8★</span>
          </div>
          <div className="flex items-center gap-1.5 text-gray-500">
            <Users className="w-4 h-4 text-emerald-600" />
            <span className="text-xs">10K+</span>
          </div>
        </div>

        {/* AI Smart Request Promo */}
        <button
          onClick={() => router.push('/customer/requests/ai')}
          className="w-full p-3 bg-gradient-to-r from-purple-500 to-indigo-600 rounded-xl text-white shadow-lg"
        >
          <div className="flex items-center gap-3">
            <Sparkles className="w-5 h-5" />
            <div className="text-left flex-1">
              <div className="font-semibold text-sm">Try AI Smart Request</div>
              <div className="text-[10px] text-white/80">AI detects issue from photo!</div>
            </div>
            <ArrowLeft className="w-4 h-4 rotate-180" />
          </div>
        </button>
      </div>
    </div>
  )
}
