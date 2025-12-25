'use client'

import { useState, useRef, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { toast } from 'sonner'
import AddressInteractiveMap from '@/components/address-interactive-map'
import { compressAndUploadImage, uploadVideoToFirebase } from '@/lib/firebase-storage-client'
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
  TrendingUp,
  Search,
  ChevronDown
} from 'lucide-react'

const serviceCategories = [
  {
    id: 'home-services',
    name: 'Home Services',
    emoji: '🏠',
    description: 'All home maintenance and repair services',
    services: ['Plumbing', 'Electrical Work', 'Carpentry', 'Painting', 'AC Repair & Service', 'Appliance Repair']
  },
  {
    id: 'cleaning-services',
    name: 'Cleaning Services',
    emoji: '🧹',
    description: 'Professional cleaning for homes and offices',
    services: ['Bathroom Cleaning', 'House Cleaning', 'Kitchen Cleaning', 'Office Cleaning', 'Sofa & Carpet Cleaning', 'Window Cleaning']
  },
  {
    id: 'beauty-wellness',
    name: 'Beauty & Wellness',
    emoji: '💆',
    description: 'Personal care and beauty services at home',
    services: ['Facial Treatment', 'Haircut & Styling', 'Makeup Artist', 'Manicure & Pedicure', 'Massage Therapy', 'Waxing & Threading']
  },
  {
    id: 'car-services',
    name: 'Car Services',
    emoji: '🚗',
    description: 'Vehicle maintenance and repair services',
    services: ['Battery Service', 'Car AC Service', 'Car Repair', 'Car Wash', 'Denting & Painting', 'Tire Service']
  },
  {
    id: 'pest-control',
    name: 'Pest Control',
    emoji: '🐛',
    description: 'Professional pest and insect control services',
    services: ['Bed Bug Control', 'Cockroach Control', 'General Pest Control', 'Mosquito Control', 'Rodent Control', 'Termite Control']
  },
  {
    id: 'moving-packing',
    name: 'Moving & Packing',
    emoji: '📦',
    description: 'Relocation and packing services',
    services: ['Furniture Moving', 'Intercity Moving', 'Local Shifting', 'Office Relocation', 'Packing Services', 'Vehicle Transport']
  },
  {
    id: 'tutoring-training',
    name: 'Tutoring & Training',
    emoji: '🎓',
    description: 'Educational and skill development services',
    services: ['Academic Tutoring', 'Cooking Classes', 'Dance Classes', 'Language Classes', 'Music Lessons', 'Yoga & Fitness']
  },
  {
    id: 'event-services',
    name: 'Event Services',
    emoji: '🎉',
    description: 'Party planning and event management',
    services: ['Birthday Party Planning', 'Catering Service', 'Decoration Service', 'Entertainment', 'Photography & Videography', 'Wedding Planning']
  },
  {
    id: 'gardening-landscaping',
    name: 'Gardening & Landscaping',
    emoji: '🌱',
    description: 'Garden maintenance and outdoor services',
    services: ['Garden Design', 'Garden Pest Control', 'Irrigation System', 'Lawn Mowing', 'Plant Care', 'Tree Trimming']
  },
  {
    id: 'pet-care',
    name: 'Pet Care',
    emoji: '🐶',
    description: 'Pet grooming, training, and care services',
    services: ['Dog Walking', 'Pet Grooming', 'Pet Sitting', 'Pet Taxi', 'Pet Training', 'Vet Consultation']
  },
  {
    id: 'computer-it-services',
    name: 'Computer & IT Services',
    emoji: '💻',
    description: 'Technology repair and IT support',
    services: ['Data Recovery', 'Desktop Repair', 'Laptop Repair', 'Network Setup', 'Printer Repair', 'Software Installation']
  },
  {
    id: 'laundry-services',
    name: 'Laundry Services',
    emoji: '🧺',
    description: 'Washing, ironing, and dry cleaning',
    services: ['Carpet & Curtain Cleaning', 'Dry Cleaning', 'Iron Only', 'Shoe Cleaning', 'Steam Press', 'Wash & Iron']
  }
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
  const [serviceSearch, setServiceSearch] = useState('')
  const [expandedCategory, setExpandedCategory] = useState<string | null>(null)
  const [formData, setFormData] = useState({
    category: '',
    service: '',
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
        service: data.service || prev.service,
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
    if (formData.category) progress += 20
    if (formData.service) progress += 20
    if (formData.title) progress += 20
    if (formData.location && formData.latitude) progress += 20
    if (formData.budget) progress += 20
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

  // Convert file to base64 data URL (for small files only)
  const fileToDataUrl = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader()
      reader.onload = () => resolve(reader.result as string)
      reader.onerror = () => reject(new Error('Failed to read file'))
      reader.readAsDataURL(file)
    })
  }

  // Compress video to thumbnail for large files
  const compressVideo = async (file: File): Promise<string> => {
    if (file.size > 10 * 1024 * 1024) {
      return new Promise((resolve, reject) => {
        const video = document.createElement('video')
        video.preload = 'metadata'
        video.onloadeddata = () => { video.currentTime = 0.5 }
        video.onseeked = () => {
          const canvas = document.createElement('canvas')
          canvas.width = Math.min(video.videoWidth, 400)
          canvas.height = (video.videoHeight / video.videoWidth) * canvas.width
          const ctx = canvas.getContext('2d')
          ctx?.drawImage(video, 0, 0, canvas.width, canvas.height)
          URL.revokeObjectURL(video.src)
          resolve(canvas.toDataURL('image/jpeg', 0.7))
        }
        video.onerror = () => {
          URL.revokeObjectURL(video.src)
          reject(new Error('Failed to process video'))
        }
        video.src = URL.createObjectURL(file)
      })
    }
    return fileToDataUrl(file)
  }

  // Compress image aggressively for mobile camera photos
  const compressImage = async (file: File, maxWidth = 800): Promise<string> => {
    return new Promise((resolve, reject) => {
      const img = new Image()
      const objectUrl = URL.createObjectURL(file)
      
      img.onload = () => {
        try {
          const canvas = document.createElement('canvas')
          let { width, height } = img
          
          // Adaptive compression based on file size
          const fileSizeMB = file.size / (1024 * 1024)
          let targetMaxWidth = maxWidth
          let quality = 0.7
          
          if (fileSizeMB > 5) {
            targetMaxWidth = 600
            quality = 0.5
          } else if (fileSizeMB > 2) {
            targetMaxWidth = 700
            quality = 0.6
          }
          
          if (width > targetMaxWidth) {
            height = (height * targetMaxWidth) / width
            width = targetMaxWidth
          }
          
          canvas.width = width
          canvas.height = height
          
          const ctx = canvas.getContext('2d')
          if (!ctx) {
            URL.revokeObjectURL(objectUrl)
            reject(new Error('Canvas context not available'))
            return
          }
          
          ctx.drawImage(img, 0, 0, width, height)
          URL.revokeObjectURL(objectUrl)
          
          const result = canvas.toDataURL('image/jpeg', quality)
          console.log(`📸 Compressed: ${fileSizeMB.toFixed(1)}MB → ${((result.length * 0.75) / 1024).toFixed(0)}KB`)
          resolve(result)
        } catch (err) {
          URL.revokeObjectURL(objectUrl)
          reject(err)
        }
      }
      
      img.onerror = () => {
        URL.revokeObjectURL(objectUrl)
        reject(new Error('Failed to load image'))
      }
      
      img.src = objectUrl
    })
  }

  // Handle image selection - uploads directly to Firebase Storage
  const handleImageSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files
    if (!files || files.length === 0) return

    if (images.length + files.length > 5) {
      toast.error('Maximum 5 photos allowed')
      return
    }

    // Get user ID for upload path
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      toast.error('Please sign in to upload photos')
      return
    }

    setUploading(true)
    let successCount = 0
    
    try {
      for (let i = 0; i < files.length; i++) {
        const file = files[i]
        const fileSizeMB = file.size / (1024 * 1024)
        console.log(`📷 Processing image: ${file.name}, ${fileSizeMB.toFixed(1)}MB`)
        
        // Reject files over 15MB
        if (fileSizeMB > 15) {
          toast.error(`Photo too large (${fileSizeMB.toFixed(0)}MB). Max 15MB.`)
          continue
        }
        
        try {
          // Compress and upload directly to Firebase Storage
          const firebaseUrl = await compressAndUploadImage(file, user.id, images.length + i)
          setImages(prev => [...prev, firebaseUrl])
          successCount++
        } catch (uploadErr) {
          console.error('Upload failed:', uploadErr)
          toast.error(`Could not upload photo`)
        }
      }
      
      if (successCount > 0) {
        toast.success(`${successCount} photo${successCount > 1 ? 's' : ''} uploaded!`)
      }
    } catch (error) {
      console.error('Image selection error:', error)
      toast.error('Failed to upload photos')
    } finally {
      setUploading(false)
      if (e.target) e.target.value = ''
    }
  }

  // Handle video selection - uploads actual video to Firebase Storage
  const handleVideoSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files
    if (!files || files.length === 0) return

    if (videos.length >= 2) {
      toast.error('Maximum 2 videos allowed')
      return
    }

    // Get user ID for upload path
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      toast.error('Please sign in to upload videos')
      return
    }

    setUploading(true)
    try {
      const file = files[0]
      const fileSizeMB = file.size / (1024 * 1024)
      
      // Size limits
      if (fileSizeMB > 25) {
        toast.error(`Video too large (${fileSizeMB.toFixed(1)}MB). Max 25MB allowed.`)
        return
      }
      
      console.log(`📹 Uploading video: ${fileSizeMB.toFixed(1)}MB`)
      toast.info('Uploading video...')
      
      // Upload actual video to Firebase Storage
      const videoUrl = await uploadVideoToFirebase(file, user.id, videos.length)
      setVideos(prev => [...prev, videoUrl])
      toast.success('Video uploaded!')
    } catch (err: any) {
      console.error('Video error:', err)
      toast.error(err.message || 'Failed to upload video. Try a smaller file.')
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

  useEffect(() => {
    if (formData.category) {
      setExpandedCategory(formData.category)
    }
  }, [formData.category])

  const serviceQuery = serviceSearch.trim().toLowerCase()
  const filteredCategories = serviceCategories
    .map(cat => {
      const visibleServices = serviceQuery
        ? cat.services.filter(service => service.toLowerCase().includes(serviceQuery))
        : cat.services
      const matchesCat = cat.name.toLowerCase().includes(serviceQuery) || cat.description.toLowerCase().includes(serviceQuery)
      return { ...cat, visibleServices, matchesCat }
    })
    .filter(cat => {
      if (!serviceQuery) return true
      return cat.matchesCat || cat.visibleServices.length > 0
    })

  const handleSubmit = async () => {
    // Validation
    if (!formData.category) {
      toast.error('Please select a category')
      return
    }
    if (!formData.service) {
      toast.error('Please choose a service')
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

      // Call broadcast API with timeout
      const controller = new AbortController()
      const timeoutId = setTimeout(() => controller.abort(), 30000) // 30 second timeout

      const broadcastResponse = await fetch('/api/requests/broadcast', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        signal: controller.signal,
        body: JSON.stringify({ 
          categoryId: formData.category,
          categoryName: serviceCategories.find(c => c.id === formData.category)?.name,
          serviceName: formData.service,
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
      <div className="sticky top-0 z-50 bg-white/80 backdrop-blur-xl border-b border-gray-200/50 shadow-sm pt-safe">
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
        
        {/* Service Selection - Searchable accordion */}
        <div className="bg-white rounded-3xl p-5 shadow-xl shadow-gray-200/50 border border-gray-100 hover:shadow-2xl hover:shadow-emerald-100/50 transition-all duration-500">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-500 flex items-center justify-center shadow-lg shadow-emerald-500/30">
              <Zap className="w-5 h-5 text-white" />
            </div>
            <div className="flex-1">
              <label className="text-base font-bold text-gray-900 block">Choose exact service</label>
              <p className="text-xs text-gray-500">Search and pick a service to continue</p>
            </div>
            <span className="px-2 py-1 rounded-full text-[11px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-100">
              Required
            </span>
          </div>

          <div className="relative mb-4">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <Input
              placeholder="Search services (e.g., plumber, cleaning)"
              value={serviceSearch}
              onChange={(e) => setServiceSearch(e.target.value)}
              className="pl-9 h-11 text-sm border-gray-200 focus:border-emerald-500 focus:ring-emerald-500/20 rounded-xl bg-gray-50/70"
            />
          </div>

          <div className="space-y-3">
            {filteredCategories.length === 0 && (
              <div className="text-sm text-gray-500 bg-gray-50 border border-dashed border-gray-200 rounded-2xl p-4 text-center">
                No services found. Try another keyword.
              </div>
            )}

            {filteredCategories.map((cat) => {
              const isExpanded = expandedCategory === cat.id
              const isCategorySelected = formData.category === cat.id
              return (
                <div
                  key={cat.id}
                  className="rounded-2xl border border-gray-100 bg-gray-50/60 shadow-sm hover:shadow-md transition-all duration-300"
                >
                  <button
                    type="button"
                    onClick={() => setExpandedCategory(prev => prev === cat.id ? null : cat.id)}
                    className="w-full flex items-center gap-3 px-4 py-3"
                  >
                    <div className="text-2xl">{cat.emoji}</div>
                    <div className="flex-1 text-left">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-bold text-gray-900">{cat.name}</span>
                        {isCategorySelected && (
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-100 text-emerald-700 border border-emerald-200">
                            Selected
                          </span>
                        )}
                      </div>
                      <p className="text-[11px] text-gray-500 line-clamp-1">{cat.description}</p>
                    </div>
                    <ChevronDown className={`w-4 h-4 text-gray-500 transition-transform ${isExpanded ? 'rotate-180' : ''}`} />
                  </button>

                  {isExpanded && (
                    <div className="px-4 pb-4 pt-1 space-y-2">
                      {cat.visibleServices.map((service) => {
                        const isSelected = formData.service === service
                        return (
                          <button
                            key={service}
                            onClick={() => setFormData(prev => ({ 
                              ...prev, 
                              category: cat.id,
                              service,
                              title: prev.title ? prev.title : service
                            }))}
                            className={`w-full flex items-center justify-between px-3 py-2 rounded-xl border text-left text-sm transition-all duration-200 ${
                              isSelected
                                ? 'border-emerald-500 bg-emerald-50 text-emerald-800 shadow-sm'
                                : 'border-gray-200 bg-white hover:border-emerald-200 hover:bg-emerald-50/50'
                            }`}
                          >
                            <span>{service}</span>
                            {isSelected ? (
                              <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                            ) : (
                              <ChevronRight className="w-4 h-4 text-gray-400" />
                            )}
                          </button>
                        )
                      })}
                    </div>
                  )}
                </div>
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
