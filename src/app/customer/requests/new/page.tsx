'use client'

import { useState, useRef, useEffect } from 'react'
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
  Users,
  CheckCircle2,
  Camera,
  Image as ImageIcon,
  Video,
  X,
  Loader2,
  Banknote,
  Smartphone,
  Zap,
  Award,
  BadgeCheck,
  ArrowRight,
  ChevronRight,
  Check,
  Headphones,
  TrendingUp
} from 'lucide-react'

const categories = [
  { id: 'cleaning', name: 'Cleaning', emoji: '🧹', icon: '✨', color: 'from-blue-400 to-cyan-400' },
  { id: 'plumbing', name: 'Plumbing', emoji: '🔧', icon: '🚿', color: 'from-sky-400 to-blue-500' },
  { id: 'electrical', name: 'Electrical', emoji: '⚡', icon: '💡', color: 'from-amber-400 to-yellow-500' },
  { id: 'automotive', name: 'Automotive', emoji: '🚗', icon: '🔧', color: 'from-slate-400 to-gray-500' },
  { id: 'tech', name: 'Tech', emoji: '💻', icon: '🖥️', color: 'from-purple-400 to-indigo-500' },
  { id: 'delivery', name: 'Delivery', emoji: '📦', icon: '🚚', color: 'from-orange-400 to-red-400' },
  { id: 'personal', name: 'Care', emoji: '💆', icon: '💅', color: 'from-pink-400 to-rose-400' },
  { id: 'other', name: 'Other', emoji: '✨', icon: '🌟', color: 'from-emerald-400 to-teal-500' },
]

const urgencyOptions = [
  { id: 'low', label: 'Flexible', description: '24-48 hrs', icon: '🌿', color: 'border-green-300 bg-green-50 text-green-700 hover:bg-green-100', selected: 'border-green-500 bg-gradient-to-r from-green-500 to-emerald-500 text-white shadow-lg shadow-green-500/30' },
  { id: 'medium', label: 'Normal', description: '4-12 hrs', icon: '☀️', color: 'border-amber-300 bg-amber-50 text-amber-700 hover:bg-amber-100', selected: 'border-amber-500 bg-gradient-to-r from-amber-500 to-yellow-500 text-white shadow-lg shadow-amber-500/30' },
  { id: 'high', label: 'Urgent', description: '1-4 hrs', icon: '🔥', color: 'border-orange-300 bg-orange-50 text-orange-700 hover:bg-orange-100', selected: 'border-orange-500 bg-gradient-to-r from-orange-500 to-red-500 text-white shadow-lg shadow-orange-500/30' },
  { id: 'emergency', label: 'ASAP', description: 'Under 1 hr', icon: '⚡', color: 'border-red-300 bg-red-50 text-red-700 hover:bg-red-100', selected: 'border-red-500 bg-gradient-to-r from-red-500 to-pink-500 text-white shadow-lg shadow-red-500/30' },
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
  const [currentStep, setCurrentStep] = useState(1)
  const [formData, setFormData] = useState({
    category: '',
    title: '',
    description: '',
    location: '',
    latitude: null as number | null,
    longitude: null as number | null,
    budget: '',
    urgency: 'medium',
    paymentMethod: 'cash',
  })

  const mapAiUrgencyToManual = (aiUrgency?: string) => {
    switch (aiUrgency) {
      case 'flexible':
        return 'low'
      case 'today':
        return 'medium'
      case 'urgent':
        return 'high'
      case 'emergency':
        return 'emergency'
      default:
        return 'medium'
    }
  }

  useEffect(() => {
    try {
      const raw = localStorage.getItem('aiFallbackRequest')
      if (!raw) return

      const data = JSON.parse(raw)

      setFormData(prev => ({
        ...prev,
        category: data.category || prev.category,
        description: data.description || prev.description,
        title: data.title || data.description || prev.title,
        location: data.location || prev.location,
        latitude: data.latitude ?? prev.latitude,
        longitude: data.longitude ?? prev.longitude,
        urgency: mapAiUrgencyToManual(data.urgency),
        budget: data.estimatedPrice ? String(data.estimatedPrice) : prev.budget,
      }))

      if (Array.isArray(data.images)) {
        setImages(data.images)
      }
      if (Array.isArray(data.videos)) {
        setVideos(data.videos)
      }
    } catch (error) {
      console.error('Failed to load AI fallback request', error)
    } finally {
      localStorage.removeItem('aiFallbackRequest')
    }
  }, [])

  // Calculate form progress
  const calculateProgress = () => {
    let progress = 0
    if (formData.category) progress += 25
    if (formData.title) progress += 25
    if (formData.location && formData.latitude) progress += 25
    if (formData.budget) progress += 25
    return progress
  }

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
      if (file.size > 50 * 1024 * 1024) {
        toast.error('Video too large (max 50MB)')
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
        setLoading(false)
        toast.error('Please sign in to post a request')
        router.push('/auth/signin')
        return
      }

      console.log('Submitting request...', formData)

      // Call broadcast API with timeout
      const controller = new AbortController()
      const timeoutId = setTimeout(() => controller.abort(), 30000) // 30 second timeout

      const broadcastResponse = await fetch('/api/requests/broadcast', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        signal: controller.signal,
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
          paymentMethod: formData.paymentMethod,
        })
      })
      
      clearTimeout(timeoutId)

      if (!broadcastResponse.ok) {
        const errorData = await broadcastResponse.json().catch(() => ({}))
        throw new Error(errorData.error || `Server error: ${broadcastResponse.status}`)
      }

      const broadcastData = await broadcastResponse.json()
      console.log('Broadcast result:', broadcastData)
      
      if (broadcastData.helpersNotified > 0) {
        toast.success(`🎉 Request posted! Notified ${broadcastData.helpersNotified} helpers nearby`)
      } else {
        toast.success('Request Posted! 🎉 Finding helpers...')
      }

      // Navigate to track page
      if (broadcastData.requestId) {
        router.push(`/customer/requests/${broadcastData.requestId}/track`)
      } else {
        // Fallback to requests page if no requestId
        router.push('/customer/requests')
      }
    } catch (error: any) {
      console.error('Submit error:', error)
      if (error.name === 'AbortError') {
        toast.error('Request timed out. Please try again.')
      } else {
        toast.error(error.message || 'Failed to create request. Please try again.')
      }
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-emerald-50/30">
      {/* Floating Background Elements */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-20 left-10 w-72 h-72 bg-emerald-300/20 rounded-full blur-3xl animate-pulse" />
        <div className="absolute top-40 right-10 w-96 h-96 bg-teal-300/20 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '1s' }} />
        <div className="absolute bottom-20 left-1/3 w-80 h-80 bg-cyan-300/15 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '2s' }} />
      </div>

      {/* Premium Header with Glassmorphism */}
      <div className="sticky top-0 z-50 bg-white/80 backdrop-blur-xl border-b border-gray-200/50 shadow-sm">
        <div className="max-w-3xl mx-auto px-4 py-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <button 
                onClick={() => router.back()}
                className="p-2.5 hover:bg-gray-100 rounded-xl transition-all duration-300 group"
              >
                <ArrowLeft className="w-5 h-5 text-gray-700 group-hover:-translate-x-0.5 transition-transform" />
              </button>
              <div>
                <h1 className="text-lg font-bold text-gray-900">Post a Request</h1>
                <p className="text-xs text-gray-500">Get help in minutes</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <div className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 bg-emerald-50 rounded-full">
                <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse" />
                <span className="text-xs font-medium text-emerald-700">{Math.floor(Math.random() * 50) + 80} helpers online</span>
              </div>
            </div>
          </div>
          
          {/* Progress Bar */}
          <div className="mt-3">
            <div className="flex items-center justify-between mb-1">
              <span className="text-xs font-medium text-gray-500">Progress</span>
              <span className="text-xs font-bold text-emerald-600">{calculateProgress()}%</span>
            </div>
            <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
              <div 
                className="h-full bg-gradient-to-r from-emerald-500 to-teal-500 rounded-full transition-all duration-500 ease-out"
                style={{ width: `${calculateProgress()}%` }}
              />
            </div>
          </div>
        </div>
      </div>

      {/* Main Form Content */}
      <div className="relative max-w-3xl mx-auto px-4 py-6 space-y-5">
        
        {/* Category Selection - Premium Card */}
        <div className="bg-white rounded-3xl p-5 shadow-xl shadow-gray-200/50 border border-gray-100 hover:shadow-2xl hover:shadow-emerald-100/50 transition-all duration-500">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-500 flex items-center justify-center shadow-lg shadow-emerald-500/30">
              <Zap className="w-5 h-5 text-white" />
            </div>
            <div>
              <label className="text-base font-bold text-gray-900 block">What do you need?</label>
              <p className="text-xs text-gray-500">Select a service category</p>
            </div>
          </div>
          <div className="grid grid-cols-4 gap-3">
            {categories.map((cat) => {
              const isSelected = formData.category === cat.id
              return (
                <button
                  key={cat.id}
                  onClick={() => setFormData(prev => ({ ...prev, category: cat.id }))}
                  className={`relative p-3 rounded-2xl border-2 transition-all duration-300 text-center group overflow-hidden ${
                    isSelected 
                      ? 'border-emerald-500 bg-gradient-to-br from-emerald-50 to-teal-50 shadow-lg shadow-emerald-100' 
                      : 'border-gray-100 bg-white hover:border-emerald-200 hover:bg-emerald-50/50 hover:scale-105'
                  }`}
                >
                  {isSelected && (
                    <div className="absolute top-1 right-1">
                      <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                    </div>
                  )}
                  <div className={`text-2xl mb-1 transform group-hover:scale-110 transition-transform duration-300`}>
                    {cat.emoji}
                  </div>
                  <div className={`text-xs font-semibold ${isSelected ? 'text-emerald-700' : 'text-gray-600'}`}>
                    {cat.name}
                  </div>
                </button>
              )
            })}
          </div>
        </div>

        {/* Title & Description - Enhanced */}
        <div className="bg-white rounded-3xl p-5 shadow-xl shadow-gray-200/50 border border-gray-100 hover:shadow-2xl hover:shadow-emerald-100/50 transition-all duration-500 space-y-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500 to-indigo-500 flex items-center justify-center shadow-lg shadow-blue-500/30">
              <Sparkles className="w-5 h-5 text-white" />
            </div>
            <div>
              <label className="text-base font-bold text-gray-900 block">Describe Your Problem</label>
              <p className="text-xs text-gray-500">Help us understand what you need</p>
            </div>
          </div>

          <div>
            <label className="text-sm font-semibold text-gray-700 mb-2 block flex items-center gap-2">
              What's the problem? <span className="text-red-500">*</span>
              <span className="ml-auto text-xs text-gray-400">{formData.title.length}/100</span>
            </label>
            <Input
              placeholder="e.g., Fix leaking kitchen tap, AC not cooling..."
              value={formData.title}
              onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value.slice(0, 100) }))}
              className="h-12 text-base border-gray-200 focus:border-emerald-500 focus:ring-emerald-500/20 rounded-xl bg-gray-50/50 hover:bg-white transition-colors"
            />
          </div>

          <div>
            <label className="text-sm font-semibold text-gray-700 mb-2 block flex items-center gap-2">
              Additional details 
              <span className="px-2 py-0.5 bg-gray-100 rounded-full text-xs text-gray-500 font-normal">Optional</span>
            </label>
            <Textarea
              placeholder="Any specific details that would help the helper understand better..."
              value={formData.description}
              onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
              rows={3}
              className="text-base border-gray-200 focus:border-emerald-500 focus:ring-emerald-500/20 rounded-xl resize-none bg-gray-50/50 hover:bg-white transition-colors"
            />
          </div>
        </div>

        {/* Photos & Videos - Modernized */}
        <div className="bg-white rounded-3xl p-5 shadow-xl shadow-gray-200/50 border border-gray-100 hover:shadow-2xl hover:shadow-emerald-100/50 transition-all duration-500">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center shadow-lg shadow-purple-500/30">
              <Camera className="w-5 h-5 text-white" />
            </div>
            <div className="flex-1">
              <label className="text-base font-bold text-gray-900 block">Add Photos/Videos</label>
              <p className="text-xs text-gray-500">Visuals help helpers understand better</p>
            </div>
            {(images.length > 0 || videos.length > 0) && (
              <span className="px-2 py-1 bg-emerald-100 text-emerald-700 rounded-full text-xs font-semibold">
                {images.length + videos.length} added
              </span>
            )}
          </div>
          
          {/* Upload Buttons - Redesigned */}
          <div className="grid grid-cols-3 gap-3 mb-4">
            <button
              onClick={() => cameraInputRef.current?.click()}
              disabled={uploading || images.length >= 5}
              className="group flex flex-col items-center justify-center gap-2 py-4 px-3 bg-gradient-to-br from-emerald-50 to-teal-50 text-emerald-700 rounded-2xl border-2 border-dashed border-emerald-200 hover:border-emerald-400 hover:shadow-lg hover:shadow-emerald-100 disabled:opacity-50 transition-all duration-300"
            >
              <div className="w-10 h-10 rounded-xl bg-emerald-500 flex items-center justify-center group-hover:scale-110 transition-transform">
                <Camera className="w-5 h-5 text-white" />
              </div>
              <span className="text-sm font-semibold">Camera</span>
            </button>
            <button
              onClick={() => fileInputRef.current?.click()}
              disabled={uploading || images.length >= 5}
              className="group flex flex-col items-center justify-center gap-2 py-4 px-3 bg-gradient-to-br from-blue-50 to-indigo-50 text-blue-700 rounded-2xl border-2 border-dashed border-blue-200 hover:border-blue-400 hover:shadow-lg hover:shadow-blue-100 disabled:opacity-50 transition-all duration-300"
            >
              <div className="w-10 h-10 rounded-xl bg-blue-500 flex items-center justify-center group-hover:scale-110 transition-transform">
                <ImageIcon className="w-5 h-5 text-white" />
              </div>
              <span className="text-sm font-semibold">Gallery</span>
            </button>
            <button
              onClick={() => videoInputRef.current?.click()}
              disabled={uploading || videos.length >= 2}
              className="group flex flex-col items-center justify-center gap-2 py-4 px-3 bg-gradient-to-br from-purple-50 to-pink-50 text-purple-700 rounded-2xl border-2 border-dashed border-purple-200 hover:border-purple-400 hover:shadow-lg hover:shadow-purple-100 disabled:opacity-50 transition-all duration-300"
            >
              <div className="w-10 h-10 rounded-xl bg-purple-500 flex items-center justify-center group-hover:scale-110 transition-transform">
                <Video className="w-5 h-5 text-white" />
              </div>
              <span className="text-sm font-semibold">Video</span>
            </button>
          </div>

          <div className="flex items-center gap-2 text-[11px] text-gray-500 mb-2">
            <Video className="w-3 h-3 text-purple-500" />
            <span>Max 50MB per video (up to 2)</span>
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
            <div className="flex items-center justify-center gap-2 text-sm text-gray-500 py-3 bg-gray-50 rounded-xl mb-3">
              <Loader2 className="w-4 h-4 animate-spin text-emerald-600" />
              <span>Uploading your media...</span>
            </div>
          )}

          {/* Preview Images - Enhanced Grid */}
          {images.length > 0 && (
            <div className="flex gap-3 flex-wrap">
              {images.map((url, idx) => (
                <div key={idx} className="relative w-20 h-20 rounded-xl overflow-hidden border-2 border-gray-200 shadow-md group hover:shadow-xl transition-all">
                  <img src={url} alt="" className="w-full h-full object-cover" />
                  <button
                    onClick={() => removeImage(idx)}
                    className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity"
                  >
                    <X className="w-5 h-5 text-white" />
                  </button>
                </div>
              ))}
            </div>
          )}

          {/* Preview Videos */}
          {videos.length > 0 && (
            <div className="flex gap-3 flex-wrap mt-3">
              {videos.map((url, idx) => (
                <div key={idx} className="relative w-28 h-20 rounded-xl overflow-hidden border-2 border-gray-200 bg-gray-900 shadow-md group hover:shadow-xl transition-all">
                  <video src={url} className="w-full h-full object-cover" />
                  <button
                    onClick={() => removeVideo(idx)}
                    className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity"
                  >
                    <X className="w-5 h-5 text-white" />
                  </button>
                  <div className="absolute bottom-1 left-1 px-2 py-0.5 bg-purple-600 rounded-full text-[10px] text-white font-medium">
                    Video
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Location - Premium Map Section */}
        <div className="bg-white rounded-3xl p-5 shadow-xl shadow-gray-200/50 border border-gray-100 hover:shadow-2xl hover:shadow-emerald-100/50 transition-all duration-500">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-rose-500 to-orange-500 flex items-center justify-center shadow-lg shadow-rose-500/30">
              <MapPin className="w-5 h-5 text-white" />
            </div>
            <div className="flex-1">
              <label className="text-base font-bold text-gray-900 block">Service Location</label>
              <p className="text-xs text-gray-500">Where do you need the service?</p>
            </div>
            {formData.latitude && (
              <span className="flex items-center gap-1 px-2 py-1 bg-green-100 text-green-700 rounded-full text-xs font-semibold">
                <Check className="w-3 h-3" />
                Located
              </span>
            )}
          </div>
          <div className="rounded-2xl overflow-hidden border-2 border-gray-100 shadow-inner">
            <AddressInteractiveMap
              value={formData.location}
              onChange={(value) => setFormData(prev => ({ ...prev, location: value }))}
              onAddressSelect={handleAddressSelect}
              showMap={true}
              mapHeight="200px"
            />
          </div>
        </div>

        {/* Budget & Urgency - Side by Side Premium Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Budget Card */}
          <div className="bg-white rounded-3xl p-5 shadow-xl shadow-gray-200/50 border border-gray-100 hover:shadow-2xl hover:shadow-emerald-100/50 transition-all duration-500">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-amber-500 to-yellow-500 flex items-center justify-center shadow-lg shadow-amber-500/30">
                <IndianRupee className="w-5 h-5 text-white" />
              </div>
              <div>
                <label className="text-base font-bold text-gray-900 block">Your Budget</label>
                <p className="text-xs text-gray-500">Set your price</p>
              </div>
            </div>
            <div className="relative">
              <span className="absolute left-4 top-1/2 -translate-y-1/2 text-2xl font-bold text-gray-400">₹</span>
              <Input
                type="number"
                placeholder="500"
                value={formData.budget}
                onChange={(e) => setFormData(prev => ({ ...prev, budget: e.target.value }))}
                className="h-14 text-2xl font-bold pl-10 border-gray-200 focus:border-amber-500 focus:ring-amber-500/20 rounded-xl bg-gradient-to-r from-amber-50/50 to-yellow-50/50"
              />
            </div>
            <p className="text-xs text-gray-500 mt-2 flex items-center gap-1">
              <TrendingUp className="w-3 h-3" />
              Avg. price: ₹300-800 for this category
            </p>
          </div>

          {/* Urgency Card */}
          <div className="bg-white rounded-3xl p-5 shadow-xl shadow-gray-200/50 border border-gray-100 hover:shadow-2xl hover:shadow-emerald-100/50 transition-all duration-500">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-cyan-500 to-blue-500 flex items-center justify-center shadow-lg shadow-cyan-500/30">
                <Clock className="w-5 h-5 text-white" />
              </div>
              <div>
                <label className="text-base font-bold text-gray-900 block">Urgency Level</label>
                <p className="text-xs text-gray-500">When do you need it?</p>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-2">
              {urgencyOptions.map((opt) => {
                const isSelected = formData.urgency === opt.id
                return (
                  <button
                    key={opt.id}
                    onClick={() => setFormData(prev => ({ ...prev, urgency: opt.id }))}
                    className={`py-2.5 px-3 rounded-xl border-2 text-center transition-all duration-300 ${
                      isSelected ? opt.selected : opt.color
                    }`}
                  >
                    <span className="text-sm mr-1">{opt.icon}</span>
                    <span className="text-xs font-bold">{opt.label}</span>
                    <div className={`text-[10px] mt-0.5 ${isSelected ? 'text-white/80' : 'text-gray-500'}`}>
                      {opt.description}
                    </div>
                  </button>
                )
              })}
            </div>
          </div>
        </div>

        {/* Payment Method - Premium Selection */}
        <div className="bg-white rounded-3xl p-5 shadow-xl shadow-gray-200/50 border border-gray-100 hover:shadow-2xl hover:shadow-emerald-100/50 transition-all duration-500">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-green-500 to-emerald-500 flex items-center justify-center shadow-lg shadow-green-500/30">
              <Banknote className="w-5 h-5 text-white" />
            </div>
            <div>
              <label className="text-base font-bold text-gray-900 block">Payment Method</label>
              <p className="text-xs text-gray-500">Choose how you want to pay</p>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <button
              onClick={() => setFormData(prev => ({ ...prev, paymentMethod: 'cash' }))}
              className={`relative p-4 rounded-2xl border-2 transition-all duration-300 flex items-center gap-4 overflow-hidden group ${
                formData.paymentMethod === 'cash'
                  ? 'border-amber-400 bg-gradient-to-br from-amber-50 to-yellow-50 shadow-lg shadow-amber-100'
                  : 'border-gray-200 hover:border-amber-300 hover:bg-amber-50/30'
              }`}
            >
              {formData.paymentMethod === 'cash' && (
                <div className="absolute top-2 right-2">
                  <CheckCircle2 className="w-5 h-5 text-amber-600" />
                </div>
              )}
              <div className={`w-12 h-12 rounded-xl flex items-center justify-center transition-all ${
                formData.paymentMethod === 'cash' 
                  ? 'bg-gradient-to-br from-amber-500 to-yellow-500 shadow-lg shadow-amber-500/30' 
                  : 'bg-gray-100 group-hover:bg-amber-100'
              }`}>
                <Banknote className={`w-6 h-6 ${formData.paymentMethod === 'cash' ? 'text-white' : 'text-gray-500 group-hover:text-amber-600'}`} />
              </div>
              <div className="text-left">
                <p className={`font-bold ${formData.paymentMethod === 'cash' ? 'text-amber-700' : 'text-gray-700'}`}>
                  Cash
                </p>
                <p className="text-xs text-gray-500">Pay after service</p>
              </div>
            </button>
            <button
              onClick={() => setFormData(prev => ({ ...prev, paymentMethod: 'upi' }))}
              className={`relative p-4 rounded-2xl border-2 transition-all duration-300 flex items-center gap-4 overflow-hidden group ${
                formData.paymentMethod === 'upi'
                  ? 'border-blue-400 bg-gradient-to-br from-blue-50 to-indigo-50 shadow-lg shadow-blue-100'
                  : 'border-gray-200 hover:border-blue-300 hover:bg-blue-50/30'
              }`}
            >
              {formData.paymentMethod === 'upi' && (
                <div className="absolute top-2 right-2">
                  <CheckCircle2 className="w-5 h-5 text-blue-600" />
                </div>
              )}
              <div className={`w-12 h-12 rounded-xl flex items-center justify-center transition-all ${
                formData.paymentMethod === 'upi' 
                  ? 'bg-gradient-to-br from-blue-500 to-indigo-500 shadow-lg shadow-blue-500/30' 
                  : 'bg-gray-100 group-hover:bg-blue-100'
              }`}>
                <Smartphone className={`w-6 h-6 ${formData.paymentMethod === 'upi' ? 'text-white' : 'text-gray-500 group-hover:text-blue-600'}`} />
              </div>
              <div className="text-left">
                <p className={`font-bold ${formData.paymentMethod === 'upi' ? 'text-blue-700' : 'text-gray-700'}`}>
                  UPI/Online
                </p>
                <p className="text-xs text-gray-500">Pay securely online</p>
              </div>
            </button>
          </div>
        </div>

        {/* Submit Button - Premium CTA */}
        <div className="space-y-4">
          <Button
            onClick={handleSubmit}
            disabled={loading || uploading || calculateProgress() < 100}
            className="w-full h-16 text-lg font-bold bg-gradient-to-r from-emerald-600 via-teal-600 to-cyan-600 hover:from-emerald-700 hover:via-teal-700 hover:to-cyan-700 rounded-2xl disabled:opacity-50 shadow-2xl shadow-emerald-500/30 hover:shadow-emerald-500/50 transition-all duration-300 hover:scale-[1.02] active:scale-[0.98]"
          >
            {loading ? (
              <div className="flex items-center gap-3">
                <Loader2 className="w-6 h-6 animate-spin" />
                <span>Finding Best Helpers...</span>
              </div>
            ) : (
              <div className="flex items-center gap-3">
                <Send className="w-6 h-6" />
                <span>Post Request</span>
                {formData.budget && (
                  <span className="ml-2 px-3 py-1 bg-white/20 rounded-full text-sm">₹{formData.budget}</span>
                )}
                <ArrowRight className="w-5 h-5 ml-2" />
              </div>
            )}
          </Button>
          
          {calculateProgress() < 100 && (
            <p className="text-center text-sm text-gray-500">
              Complete all required fields to post your request
            </p>
          )}
        </div>

        {/* Trust & Security Section */}
        <div className="bg-gradient-to-r from-gray-50 to-emerald-50/50 rounded-3xl p-5 border border-gray-100">
          <div className="grid grid-cols-4 gap-4">
            <div className="text-center group">
              <div className="w-12 h-12 mx-auto mb-2 rounded-xl bg-white shadow-md flex items-center justify-center group-hover:scale-110 transition-transform">
                <Shield className="w-6 h-6 text-emerald-600" />
              </div>
              <p className="text-xs font-semibold text-gray-700">Verified Helpers</p>
            </div>
            <div className="text-center group">
              <div className="w-12 h-12 mx-auto mb-2 rounded-xl bg-white shadow-md flex items-center justify-center group-hover:scale-110 transition-transform">
                <BadgeCheck className="w-6 h-6 text-blue-600" />
              </div>
              <p className="text-xs font-semibold text-gray-700">Background Check</p>
            </div>
            <div className="text-center group">
              <div className="w-12 h-12 mx-auto mb-2 rounded-xl bg-white shadow-md flex items-center justify-center group-hover:scale-110 transition-transform">
                <Award className="w-6 h-6 text-amber-500" />
              </div>
              <p className="text-xs font-semibold text-gray-700">Top Rated</p>
            </div>
            <div className="text-center group">
              <div className="w-12 h-12 mx-auto mb-2 rounded-xl bg-white shadow-md flex items-center justify-center group-hover:scale-110 transition-transform">
                <Headphones className="w-6 h-6 text-purple-600" />
              </div>
              <p className="text-xs font-semibold text-gray-700">24/7 Support</p>
            </div>
          </div>
        </div>

        {/* AI Smart Request - Premium Promo Banner */}
        <button
          onClick={() => router.push('/customer/requests/ai')}
          className="w-full relative overflow-hidden group"
        >
          <div className="absolute inset-0 bg-gradient-to-r from-purple-600 via-indigo-600 to-blue-600 rounded-3xl" />
          <div className="absolute inset-0 bg-gradient-to-br from-white/10 to-transparent rounded-3xl" />
          <div className="relative p-5 flex items-center gap-4">
            <div className="w-14 h-14 rounded-2xl bg-white/20 backdrop-blur-sm flex items-center justify-center group-hover:scale-110 transition-transform">
              <Sparkles className="w-7 h-7 text-white" />
            </div>
            <div className="text-left flex-1">
              <div className="flex items-center gap-2 mb-1">
                <span className="font-bold text-white text-lg">Try AI Smart Request</span>
                <span className="px-2 py-0.5 bg-white/20 rounded-full text-[10px] text-white font-bold">NEW</span>
              </div>
              <p className="text-sm text-white/80">AI detects issues from your photos automatically!</p>
            </div>
            <div className="w-10 h-10 rounded-xl bg-white/20 flex items-center justify-center group-hover:translate-x-1 transition-transform">
              <ChevronRight className="w-5 h-5 text-white" />
            </div>
          </div>
        </button>

        {/* Bottom Spacing for Mobile */}
        <div className="h-6" />
      </div>
    </div>
  )
}
