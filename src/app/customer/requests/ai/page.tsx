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
  ChevronDown,
  Zap,
  Star,
  Brain,
  Upload,
  FileCheck,
  PartyPopper,
  Phone,
  Wrench,
  Package,
  User,
  ClipboardList,
  Timer
} from 'lucide-react'

// Animated counter component - counts DOWN from high to target
function AnimatedCounter({ end, duration = 1500, prefix = '', suffix = '' }: { end: number; duration?: number; prefix?: string; suffix?: string }) {
  const [count, setCount] = useState(end * 1.5) // Start higher
  
  useEffect(() => {
    let startTime: number
    let animationFrame: number
    const startValue = end * 1.5 // Start 50% higher
    
    const animate = (timestamp: number) => {
      if (!startTime) startTime = timestamp
      const progress = Math.min((timestamp - startTime) / duration, 1)
      // Ease out - starts fast, slows down at end
      const easeOut = 1 - Math.pow(1 - progress, 3)
      setCount(Math.round(startValue - (startValue - end) * easeOut))
      
      if (progress < 1) {
        animationFrame = requestAnimationFrame(animate)
      }
    }
    
    animationFrame = requestAnimationFrame(animate)
    return () => cancelAnimationFrame(animationFrame)
  }, [end, duration])
  
  return <>{prefix}{count.toLocaleString()}{suffix}</>
}

// Category details for helper information
const getCategoryDetails = (categoryId: string, _description: string) => {
  
  const categoryInfo: Record<string, {
    basePrice: number;
    duration: number;
    materials: string[];
    helperBrings: string[];
    customerProvides: string[];
    workOverview: string;
    description: string;
  }> = {
    'cleaning': {
      basePrice: 500,
      duration: 60,
      materials: ['Cleaning solutions', 'Mops & brooms', 'Dusters', 'Garbage bags'],
      helperBrings: ['Professional cleaning equipment', 'Eco-friendly cleaning solutions', 'Microfiber cloths', 'Vacuum cleaner'],
      customerProvides: ['Access to water supply', 'Electricity for equipment', 'Point out specific areas to clean'],
      workOverview: 'Helper will arrive with all necessary cleaning supplies. They will systematically clean all specified areas, dust surfaces, mop floors, and sanitize bathrooms/kitchen. Deep cleaning takes 2-3 hours for standard home.',
      description: 'Professional home cleaning service',
    },
    'plumbing': {
      basePrice: 400,
      duration: 45,
      materials: ['Pipe fittings', 'Sealant tape', 'Washers', 'Basic plumbing tools'],
      helperBrings: ['Plumbing toolkit', 'Pipe wrenches', 'Plunger', 'Drain snake', 'Common spare parts'],
      customerProvides: ['Access to water main shutoff', 'Clear area around problem', 'Describe issue history'],
      workOverview: 'Plumber will inspect the issue, diagnose the problem, and fix leaks, blockages, or damaged pipes. For major repairs, they may need to visit a hardware store for specific parts.',
      description: 'Expert plumbing repair and installation',
    },
    'electrical': {
      basePrice: 350,
      duration: 45,
      materials: ['Wires', 'Switches', 'Sockets', 'Electrical tape', 'MCBs'],
      helperBrings: ['Electrical toolkit', 'Multimeter', 'Wire strippers', 'Common switches & sockets', 'Safety gear'],
      customerProvides: ['Access to main switchboard', 'Turn off relevant MCB if needed', 'Keep children/pets away'],
      workOverview: 'Electrician will safely inspect electrical issues, check wiring, replace faulty switches/sockets, fix short circuits. Safety is priority - they will ensure all work meets standards.',
      description: 'Safe electrical repairs and installations',
    },
    'ac-repair': {
      basePrice: 500,
      duration: 60,
      materials: ['Refrigerant gas', 'Filters', 'Capacitors', 'Cleaning chemicals'],
      helperBrings: ['AC servicing kit', 'Gas pressure gauge', 'Cleaning equipment', 'Common spare parts', 'Ladder'],
      customerProvides: ['Clear space around AC unit', 'AC remote', 'Information about AC model & issue'],
      workOverview: 'Technician will inspect your AC, clean filters and coils, check gas pressure, test cooling efficiency. If parts need replacement, they will inform you of additional costs first.',
      description: 'AC repair, servicing and gas refilling',
    },
    'automotive': {
      basePrice: 600,
      duration: 60,
      materials: ['Engine oil', 'Filters', 'Brake fluid', 'Basic auto parts'],
      helperBrings: ['Automotive toolkit', 'Jack & stands', 'Diagnostic scanner', 'Common fluids & filters'],
      customerProvides: ['Vehicle documents', 'Keys', 'Describe symptoms clearly', 'Park in accessible location'],
      workOverview: 'Mechanic will diagnose vehicle issues, check engine, brakes, and electrical systems. Basic repairs done on-spot, major repairs may require workshop visit.',
      description: 'Vehicle repair and maintenance',
    },
    'tech': {
      basePrice: 400,
      duration: 45,
      materials: ['Cables', 'Thermal paste', 'Cleaning supplies'],
      helperBrings: ['Laptop toolkit', 'USB drives with software', 'Ethernet cables', 'Cleaning kit'],
      customerProvides: ['Device passwords if needed', 'Backup important data', 'List of issues/requirements'],
      workOverview: 'Tech expert will troubleshoot your device, remove viruses, optimize performance, setup software/wifi, and fix hardware issues if possible.',
      description: 'Computer and device technical support',
    },
    'carpentry': {
      basePrice: 600,
      duration: 90,
      materials: ['Wood pieces', 'Nails & screws', 'Wood glue', 'Polish/paint'],
      helperBrings: ['Carpentry tools', 'Measuring tape', 'Saw', 'Drill', 'Sandpaper', 'Wood samples'],
      customerProvides: ['Clear work area', 'Explain exact requirements', 'Reference images if any'],
      workOverview: 'Carpenter will assess the work, measure dimensions, repair/build furniture, fix doors/windows, and finish with polish or paint as needed.',
      description: 'Wood work, furniture repair and installation',
    },
    'painting': {
      basePrice: 800,
      duration: 120,
      materials: ['Paint', 'Primer', 'Brushes', 'Rollers', 'Masking tape', 'Drop cloths'],
      helperBrings: ['Painting equipment', 'Color samples', 'Ladders', 'Surface preparation tools'],
      customerProvides: ['Move furniture away from walls', 'Choose paint colors', 'Cover items you want protected'],
      workOverview: 'Painter will prep surfaces, fill cracks, apply primer, then 2 coats of paint. Includes cleanup. Large areas may need multiple visits.',
      description: 'Interior and exterior painting',
    },
    'appliance': {
      basePrice: 450,
      duration: 60,
      materials: ['Common spare parts', 'Fuses', 'Belts', 'Motors'],
      helperBrings: ['Appliance repair toolkit', 'Multimeter', 'Common replacement parts', 'Cleaning supplies'],
      customerProvides: ['Model number of appliance', 'Warranty documents if available', 'Describe when issue started'],
      workOverview: 'Technician will diagnose appliance issue, repair or replace faulty components. For warranty items, may guide you to authorized service.',
      description: 'Repair of washing machines, refrigerators, etc.',
    },
    'pest-control': {
      basePrice: 700,
      duration: 60,
      materials: ['Pest control chemicals', 'Sprayers', 'Gel baits', 'Traps'],
      helperBrings: ['Professional pest control equipment', 'EPA-approved chemicals', 'Safety gear', 'Bait stations'],
      customerProvides: ['Clear kitchen cabinets', 'Cover food items', 'Keep pets away for 2-3 hours', 'Point out problem areas'],
      workOverview: 'Expert will inspect for pest entry points, apply targeted treatment, set up bait stations. May need follow-up visit in 15 days for complete elimination.',
      description: 'Cockroach, ant, rat, and general pest control',
    },
    'other': {
      basePrice: 400,
      duration: 60,
      materials: ['Will be assessed based on job'],
      helperBrings: ['Basic toolkit', 'Will bring specific items based on job requirement'],
      customerProvides: ['Clear description of work needed', 'Access to work area', 'Any specific materials you have'],
      workOverview: 'Helper will assess your requirement on arrival and provide the best solution. Final price will be confirmed after inspection.',
      description: 'General home services and repairs',
    },
  }
  
  return categoryInfo[categoryId] || categoryInfo['other']
}

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
    mobileNumber: '',
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
    estimatedDuration?: number;
    severity?: string;
    materialsNeeded?: string[];
    requiredSkills?: string[];
    description?: string;
    helperBrings?: string[];
    customerProvides?: string[];
    workOverview?: string;
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
    if (!formData.mobileNumber || formData.mobileNumber.length < 10) {
      toast.error('Please enter a valid mobile number')
      return
    }
    if (!formData.urgency) {
      toast.error('Please select when you need help')
      return
    }

    setAnalyzing(true)
    try {
      const categoryName = categories.find(c => c.id === formData.category)?.name || 'General'
      
      const response = await fetch('/api/ai/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          description: formData.description,
          categoryId: formData.category,
          categoryName: categoryName,
          images: images,
          location: formData.location,
        })
      })

      if (!response.ok) {
        throw new Error('API failed')
      }
      
      const data = await response.json()
      const analysis = data.analysis || data
      
      // Get detailed info based on category
      const categoryDetails = getCategoryDetails(formData.category, formData.description)
      
      setAiResult({
        category: formData.category,
        categoryName: categoryName,
        estimatedPrice: analysis.estimatedPrice || categoryDetails.basePrice,
        confidence: analysis.confidence || 85,
        estimatedDuration: analysis.estimatedDuration || categoryDetails.duration,
        severity: analysis.severity || 'medium',
        materialsNeeded: analysis.materialsNeeded || categoryDetails.materials,
        requiredSkills: analysis.requiredSkills || [categoryName],
        description: analysis.description || categoryDetails.description,
        helperBrings: categoryDetails.helperBrings,
        customerProvides: categoryDetails.customerProvides,
        workOverview: categoryDetails.workOverview,
      })
      
      setStep(2) // Move to review step
    } catch (err) {
      console.error('AI analysis error:', err)
      const category = detectCategory(formData.description)
      const categoryName = categories.find(c => c.id === formData.category)?.name || category.name
      const categoryDetails = getCategoryDetails(formData.category, formData.description)
      
      setAiResult({
        category: formData.category || category.id,
        categoryName: categoryName,
        estimatedPrice: category.basePrice,
        confidence: 75,
        estimatedDuration: categoryDetails.duration,
        materialsNeeded: categoryDetails.materials,
        helperBrings: categoryDetails.helperBrings,
        customerProvides: categoryDetails.customerProvides,
        workOverview: categoryDetails.workOverview,
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
          estimatedDuration: aiResult.estimatedDuration,
          confidence: aiResult.confidence,
          urgency: formData.urgency,
          paymentMethod: 'cash',
          isAiRequest: true,
          // AI estimation details for helper
          helperBrings: aiResult.helperBrings,
          customerProvides: aiResult.customerProvides,
          workOverview: aiResult.workOverview,
          materialsNeeded: aiResult.materialsNeeded,
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
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-emerald-50/30 relative overflow-hidden">
      {/* Decorative Background Elements */}
      <div className="absolute top-0 right-0 w-96 h-96 bg-gradient-to-br from-emerald-400/10 to-teal-400/10 rounded-full blur-3xl -translate-y-48 translate-x-48" />
      <div className="absolute bottom-0 left-0 w-80 h-80 bg-gradient-to-tr from-blue-400/10 to-purple-400/10 rounded-full blur-3xl translate-y-40 -translate-x-40" />
      <div className="absolute top-1/2 left-1/2 w-64 h-64 bg-gradient-to-r from-amber-300/5 to-orange-300/5 rounded-full blur-2xl -translate-x-1/2 -translate-y-1/2" />
      
      {/* Premium Header */}
      <div className="sticky top-0 z-50 backdrop-blur-xl bg-white/80 border-b border-white/20 shadow-lg shadow-black/5">
        <div className="max-w-2xl mx-auto px-4 py-4 flex items-center gap-4">
          <button 
            onClick={() => step > 1 ? setStep(step - 1) : router.back()}
            className="p-2.5 hover:bg-gray-100 rounded-2xl transition-all duration-300 hover:scale-105 active:scale-95"
          >
            <ArrowLeft className="w-5 h-5 text-gray-700" />
          </button>
          <div className="flex items-center gap-3 flex-1">
            <div className="relative">
              <div className="w-12 h-12 bg-gradient-to-br from-emerald-500 via-teal-500 to-cyan-500 rounded-2xl flex items-center justify-center shadow-lg shadow-emerald-500/30">
                <Brain className="w-6 h-6 text-white" />
              </div>
              <div className="absolute -top-1 -right-1 w-4 h-4 bg-gradient-to-r from-amber-400 to-orange-400 rounded-full flex items-center justify-center">
                <Sparkles className="w-2.5 h-2.5 text-white" />
              </div>
            </div>
            <div>
              <h1 className="text-xl font-bold bg-gradient-to-r from-gray-900 via-gray-800 to-gray-900 bg-clip-text text-transparent">AI Smart Request</h1>
              <p className="text-sm text-gray-500 flex items-center gap-1.5">
                <Zap className="w-3.5 h-3.5 text-amber-500" />
                Get instant AI-powered pricing
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Premium Progress Steps */}
      <div className="bg-gradient-to-r from-white/60 via-white/80 to-white/60 backdrop-blur-sm border-b border-gray-100/50">
        <div className="max-w-2xl mx-auto px-4 py-5">
          <div className="flex items-center justify-between relative">
            {/* Progress Line Background */}
            <div className="absolute left-0 right-0 top-1/2 -translate-y-1/2 h-1 bg-gray-200 rounded-full mx-12" />
            <div 
              className="absolute left-0 top-1/2 -translate-y-1/2 h-1 bg-gradient-to-r from-emerald-500 to-teal-500 rounded-full mx-12 transition-all duration-500"
              style={{ width: `${((step - 1) / 2) * (100 - 24)}%` }}
            />
            
            {[
              { num: 1, label: 'Upload', icon: Upload, desc: 'Add photos & details' },
              { num: 2, label: 'Review', icon: FileCheck, desc: 'Verify AI analysis' },
              { num: 3, label: 'Done', icon: PartyPopper, desc: 'Request posted!' },
            ].map((s) => {
              const Icon = s.icon
              return (
                <div key={s.num} className="flex flex-col items-center relative z-10">
                  <div className={`w-14 h-14 rounded-2xl flex items-center justify-center transition-all duration-500 shadow-lg ${
                    step > s.num 
                      ? 'bg-gradient-to-br from-emerald-500 to-teal-600 text-white shadow-emerald-500/30 scale-100' 
                      : step === s.num 
                        ? 'bg-gradient-to-br from-emerald-500 to-teal-600 text-white shadow-emerald-500/40 scale-110 ring-4 ring-emerald-100' 
                        : 'bg-white text-gray-400 shadow-gray-200/50 border-2 border-gray-200'
                  }`}>
                    {step > s.num ? <CheckCircle2 className="w-6 h-6" /> : <Icon className="w-6 h-6" />}
                  </div>
                  <span className={`mt-2 text-sm font-semibold transition-colors ${step >= s.num ? 'text-gray-900' : 'text-gray-400'}`}>
                    {s.label}
                  </span>
                  <span className={`text-xs transition-colors ${step >= s.num ? 'text-gray-500' : 'text-gray-300'}`}>
                    {s.desc}
                  </span>
                </div>
              )
            })}
          </div>
        </div>
      </div>

      {/* Step 1: Upload Form */}
      {step === 1 && (
        <div className="max-w-2xl mx-auto px-4 py-6 pb-40 space-y-5 relative">
          
          {/* Photos & Videos - Premium Card */}
          <div className="bg-white/80 backdrop-blur-sm rounded-[28px] p-6 shadow-xl shadow-black/5 border border-white/60 hover:shadow-2xl hover:shadow-emerald-500/10 transition-all duration-500">
            <div className="flex items-center justify-between mb-4">
              <label className="text-base font-bold text-gray-900 flex items-center gap-2.5">
                <div className="w-10 h-10 bg-gradient-to-br from-emerald-500 to-teal-600 rounded-xl flex items-center justify-center shadow-lg shadow-emerald-500/20">
                  <ImageIcon className="w-5 h-5 text-white" />
                </div>
                Photos & Videos
              </label>
              <span className="text-xs font-semibold text-orange-600 bg-orange-50 px-3 py-1.5 rounded-full border border-orange-200">
                3-5 photos required
              </span>
            </div>
            
            {/* Upload Buttons - Premium Style */}
            <div className="flex gap-3 mb-4">
              <button
                onClick={() => fileInputRef.current?.click()}
                disabled={uploading || images.length >= 5}
                className="flex-1 flex flex-col items-center justify-center gap-2 py-5 px-4 bg-gradient-to-br from-gray-50 to-gray-100 text-gray-600 rounded-2xl border-2 border-dashed border-gray-200 hover:border-emerald-400 hover:from-emerald-50 hover:to-teal-50 hover:text-emerald-700 disabled:opacity-50 transition-all duration-300 hover:scale-[1.02] hover:shadow-lg group"
              >
                <div className="w-12 h-12 rounded-xl bg-white shadow-md flex items-center justify-center group-hover:shadow-emerald-200 transition-all">
                  <ImageIcon className="w-6 h-6" />
                </div>
                <span className="text-sm font-semibold">Gallery</span>
              </button>
              <button
                onClick={() => cameraInputRef.current?.click()}
                disabled={uploading || images.length >= 5}
                className="flex-1 flex flex-col items-center justify-center gap-2 py-5 px-4 bg-gradient-to-br from-emerald-50 to-teal-50 text-emerald-700 rounded-2xl border-2 border-dashed border-emerald-300 hover:border-emerald-500 hover:from-emerald-100 hover:to-teal-100 disabled:opacity-50 transition-all duration-300 hover:scale-[1.02] hover:shadow-lg hover:shadow-emerald-100 group"
              >
                <div className="w-12 h-12 rounded-xl bg-white shadow-md flex items-center justify-center group-hover:shadow-emerald-200 transition-all">
                  <Camera className="w-6 h-6" />
                </div>
                <span className="text-sm font-semibold">Camera</span>
              </button>
              <button
                onClick={() => videoInputRef.current?.click()}
                disabled={uploading || videos.length >= 2}
                className="flex-1 flex flex-col items-center justify-center gap-2 py-5 px-4 bg-gradient-to-br from-purple-50 to-pink-50 text-purple-700 rounded-2xl border-2 border-dashed border-purple-200 hover:border-purple-400 hover:from-purple-100 hover:to-pink-100 disabled:opacity-50 transition-all duration-300 hover:scale-[1.02] hover:shadow-lg hover:shadow-purple-100 group"
              >
                <div className="w-12 h-12 rounded-xl bg-white shadow-md flex items-center justify-center group-hover:shadow-purple-200 transition-all">
                  <Video className="w-6 h-6" />
                </div>
                <span className="text-sm font-semibold">Video</span>
              </button>
            </div>

            {/* Video from gallery */}
            <button
              onClick={() => videoInputRef.current?.click()}
              disabled={uploading || videos.length >= 2}
              className="w-full py-3 text-sm font-medium text-gray-600 bg-gradient-to-r from-gray-50 to-gray-100 rounded-xl border border-gray-200 hover:from-purple-50 hover:to-pink-50 hover:border-purple-300 hover:text-purple-700 disabled:opacity-50 flex items-center justify-center gap-2 transition-all duration-300"
            >
              <Video className="w-4 h-4" />
              Upload Video from Gallery (max 50MB)
            </button>

            {/* Counts - Premium Badge Style */}
            <div className="flex items-center gap-4 mt-4">
              <div className="flex items-center gap-2 px-3 py-2 bg-emerald-50 rounded-xl border border-emerald-100">
                <Camera className="w-4 h-4 text-emerald-600" />
                <span className="text-sm font-semibold text-emerald-700">{images.length}/5 photos</span>
              </div>
              <div className="flex items-center gap-2 px-3 py-2 bg-purple-50 rounded-xl border border-purple-100">
                <Video className="w-4 h-4 text-purple-600" />
                <span className="text-sm font-semibold text-purple-700">{videos.length}/2 videos</span>
              </div>
            </div>

            {/* Preview Images - Enhanced Grid */}
            {images.length > 0 && (
              <div className="flex gap-3 flex-wrap mt-4">
                {images.map((url, idx) => (
                  <div key={idx} className="relative group">
                    <div className="w-20 h-20 rounded-2xl overflow-hidden border-2 border-white shadow-lg group-hover:shadow-xl group-hover:scale-105 transition-all duration-300">
                      <img src={url} alt="" className="w-full h-full object-cover" />
                    </div>
                    <button
                      onClick={() => removeImage(idx)}
                      className="absolute -top-2 -right-2 w-6 h-6 bg-gradient-to-br from-red-500 to-rose-600 text-white rounded-full flex items-center justify-center shadow-lg opacity-0 group-hover:opacity-100 transition-all hover:scale-110"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ))}
              </div>
            )}

            {/* Preview Videos - Enhanced */}
            {videos.length > 0 && (
              <div className="flex gap-3 flex-wrap mt-3">
                {videos.map((url, idx) => (
                  <div key={idx} className="relative group">
                    <div className="w-24 h-16 rounded-2xl overflow-hidden border-2 border-white shadow-lg bg-gray-900 group-hover:shadow-xl group-hover:scale-105 transition-all duration-300">
                      <video src={url} className="w-full h-full object-cover opacity-80" />
                      <div className="absolute inset-0 flex items-center justify-center">
                        <div className="w-8 h-8 rounded-full bg-white/30 backdrop-blur-sm flex items-center justify-center">
                          <Video className="w-4 h-4 text-white" />
                        </div>
                      </div>
                    </div>
                    <button
                      onClick={() => removeVideo(idx)}
                      className="absolute -top-2 -right-2 w-6 h-6 bg-gradient-to-br from-red-500 to-rose-600 text-white rounded-full flex items-center justify-center shadow-lg opacity-0 group-hover:opacity-100 transition-all hover:scale-110"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ))}
              </div>
            )}

            {/* Tip - Premium Style */}
            <div className="mt-4 p-4 bg-gradient-to-r from-amber-50 to-orange-50 rounded-2xl border border-amber-200/50">
              <p className="text-sm text-amber-800 flex items-start gap-3">
                <div className="w-8 h-8 bg-gradient-to-br from-amber-400 to-orange-500 rounded-xl flex items-center justify-center flex-shrink-0 shadow-lg shadow-amber-200">
                  <Lightbulb className="w-4 h-4 text-white" />
                </div>
                <span className="pt-1"><strong className="text-amber-900">Pro Tip:</strong> Record a short video explaining the problem with your voice. This helps the helper understand the issue better before arriving.</span>
              </p>
            </div>

            {/* Hidden Inputs */}
            <input ref={fileInputRef} type="file" accept="image/*" multiple onChange={handleImageSelect} className="hidden" />
            <input ref={cameraInputRef} type="file" accept="image/*" capture="environment" onChange={handleImageSelect} className="hidden" />
            <input ref={videoInputRef} type="file" accept="video/*" onChange={handleVideoSelect} className="hidden" />
          </div>

          {/* Service Category - Premium Card */}
          <div className="bg-white/80 backdrop-blur-sm rounded-[28px] p-6 shadow-xl shadow-black/5 border border-white/60 hover:shadow-2xl hover:shadow-emerald-500/10 transition-all duration-500 relative z-50">
            <label className="text-base font-bold text-gray-900 mb-4 flex items-center gap-2.5">
              <div className="w-10 h-10 bg-gradient-to-br from-violet-500 to-purple-600 rounded-xl flex items-center justify-center shadow-lg shadow-violet-500/20">
                <Sparkles className="w-5 h-5 text-white" />
              </div>
              Service Category <span className="text-red-500 ml-1">*</span>
            </label>
            <div className="relative mt-3">
              <button
                onClick={() => setShowCategoryDropdown(!showCategoryDropdown)}
                className="w-full p-4 bg-gradient-to-r from-gray-50 to-white border-2 border-gray-200 rounded-2xl text-left flex items-center justify-between hover:border-emerald-400 hover:shadow-lg transition-all duration-300 group"
              >
                <span className={`text-base font-medium ${selectedCategory ? 'text-gray-900' : 'text-gray-400'}`}>
                  {selectedCategory ? `${selectedCategory.emoji} ${selectedCategory.name}` : 'Select a category...'}
                </span>
                <div className={`w-8 h-8 rounded-xl bg-gray-100 group-hover:bg-emerald-100 flex items-center justify-center transition-all ${showCategoryDropdown ? 'rotate-180 bg-emerald-100' : ''}`}>
                  <ChevronDown className="w-5 h-5 text-gray-500 group-hover:text-emerald-600" />
                </div>
              </button>
              {showCategoryDropdown && (
                <div className="absolute top-full left-0 right-0 mt-2 bg-white/95 backdrop-blur-xl border-2 border-gray-100 rounded-2xl shadow-2xl z-[100] max-h-72 overflow-y-auto">
                  {categories.map((cat) => (
                    <button
                      key={cat.id}
                      onClick={() => {
                        setFormData(prev => ({ ...prev, category: cat.id }))
                        setShowCategoryDropdown(false)
                      }}
                      className={`w-full p-4 text-left hover:bg-gradient-to-r hover:from-emerald-50 hover:to-teal-50 flex items-center gap-3 transition-all first:rounded-t-xl last:rounded-b-xl ${
                        formData.category === cat.id ? 'bg-gradient-to-r from-emerald-50 to-teal-50 text-emerald-700 border-l-4 border-emerald-500' : ''
                      }`}
                    >
                      <span className="text-2xl">{cat.emoji}</span>
                      <span className="font-medium">{cat.name}</span>
                      {formData.category === cat.id && (
                        <CheckCircle2 className="w-5 h-5 text-emerald-500 ml-auto" />
                      )}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Service Location - Premium Card */}
          <div className="bg-white/80 backdrop-blur-sm rounded-[28px] p-6 shadow-xl shadow-black/5 border border-white/60 hover:shadow-2xl hover:shadow-emerald-500/10 transition-all duration-500">
            <label className="text-base font-bold text-gray-900 mb-4 flex items-center gap-2.5">
              <div className="w-10 h-10 bg-gradient-to-br from-rose-500 to-pink-600 rounded-xl flex items-center justify-center shadow-lg shadow-rose-500/20">
                <MapPin className="w-5 h-5 text-white" />
              </div>
              Service Location <span className="text-red-500 ml-1">*</span>
            </label>
            <div className="mt-3 rounded-2xl overflow-hidden border-2 border-gray-100">
              <AddressInteractiveMap
                value={formData.location}
                onChange={(value) => setFormData(prev => ({ ...prev, location: value }))}
                onAddressSelect={handleAddressSelect}
                showMap={true}
                mapHeight="200px"
              />
            </div>
          </div>

          {/* Complete Address - Premium Card */}
          <div className="bg-white/80 backdrop-blur-sm rounded-[28px] p-6 shadow-xl shadow-black/5 border border-white/60 hover:shadow-2xl hover:shadow-emerald-500/10 transition-all duration-500 space-y-4">
            <h3 className="text-base font-bold text-gray-900 flex items-center gap-2.5">
              <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-xl flex items-center justify-center shadow-lg shadow-blue-500/20">
                <MapPin className="w-5 h-5 text-white" />
              </div>
              Complete Address
            </h3>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-semibold text-gray-700 mb-2 block">Flat/House No. <span className="text-red-500">*</span></label>
                <Input
                  placeholder="e.g., A-101"
                  value={formData.flatNo}
                  onChange={(e) => setFormData(prev => ({ ...prev, flatNo: e.target.value }))}
                  className="h-12 text-base rounded-xl border-2 border-gray-200 focus:border-emerald-400 focus:ring-emerald-100 transition-all"
                />
              </div>
              <div>
                <label className="text-sm font-semibold text-gray-700 mb-2 block">Floor</label>
                <Input
                  placeholder="e.g., 2nd"
                  value={formData.floor}
                  onChange={(e) => setFormData(prev => ({ ...prev, floor: e.target.value }))}
                  className="h-12 text-base rounded-xl border-2 border-gray-200 focus:border-emerald-400 focus:ring-emerald-100 transition-all"
                />
              </div>
            </div>
            <div>
              <label className="text-sm font-semibold text-gray-700 mb-2 block">Landmark (optional)</label>
              <Input
                placeholder="e.g., Near SBI Bank"
                value={formData.landmark}
                onChange={(e) => setFormData(prev => ({ ...prev, landmark: e.target.value }))}
                className="h-12 text-base rounded-xl border-2 border-gray-200 focus:border-emerald-400 focus:ring-emerald-100 transition-all"
              />
            </div>
            <div>
              <label className="text-sm font-semibold text-gray-700 mb-2 block flex items-center gap-2">
                <Phone className="w-4 h-4 text-emerald-600" />
                Mobile Number <span className="text-red-500">*</span>
              </label>
              <Input
                type="tel"
                placeholder="e.g., 9876543210"
                value={formData.mobileNumber}
                onChange={(e) => {
                  const value = e.target.value.replace(/\D/g, '').slice(0, 10)
                  setFormData(prev => ({ ...prev, mobileNumber: value }))
                }}
                className="h-12 text-base rounded-xl border-2 border-gray-200 focus:border-emerald-400 focus:ring-emerald-100 transition-all"
              />
              {formData.mobileNumber && formData.mobileNumber.length < 10 && (
                <p className="text-xs text-orange-600 mt-1">Enter 10 digit mobile number</p>
              )}
            </div>
          </div>

          {/* Describe the Problem - Premium Card */}
          <div className="bg-white/80 backdrop-blur-sm rounded-[28px] p-6 shadow-xl shadow-black/5 border border-white/60 hover:shadow-2xl hover:shadow-emerald-500/10 transition-all duration-500">
            <label className="text-base font-bold text-gray-900 mb-4 flex items-center gap-2.5">
              <div className="w-10 h-10 bg-gradient-to-br from-orange-500 to-amber-600 rounded-xl flex items-center justify-center shadow-lg shadow-orange-500/20">
                <AlertTriangle className="w-5 h-5 text-white" />
              </div>
              Describe the Problem <span className="text-red-500 ml-1">*</span>
            </label>
            <Textarea
              placeholder="Describe the issue in detail... E.g., AC not cooling, water leaking from pipe, switch giving shock"
              value={formData.description}
              onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
              rows={4}
              className="text-base border-2 border-gray-200 focus:border-emerald-400 focus:ring-emerald-100 rounded-2xl resize-none mt-3 p-4"
            />
          </div>

          {/* Additional Details - Premium Card */}
          <div className="bg-white/80 backdrop-blur-sm rounded-[28px] p-6 shadow-xl shadow-black/5 border border-white/60 hover:shadow-2xl hover:shadow-emerald-500/10 transition-all duration-500 space-y-4 relative z-40">
            <h3 className="text-base font-bold text-gray-900 flex items-center gap-2.5">
              <div className="w-10 h-10 bg-gradient-to-br from-cyan-500 to-blue-600 rounded-xl flex items-center justify-center shadow-lg shadow-cyan-500/20">
                <Lightbulb className="w-5 h-5 text-white" />
              </div>
              Additional Details
            </h3>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-semibold text-gray-700 mb-2 block">Error Code (if any)</label>
                <Input
                  placeholder="E.g., E1, F03, NA"
                  value={formData.errorCode}
                  onChange={(e) => setFormData(prev => ({ ...prev, errorCode: e.target.value }))}
                  className="h-12 text-base rounded-xl border-2 border-gray-200 focus:border-emerald-400 focus:ring-emerald-100 transition-all"
                />
              </div>
              <div>
                <label className="text-sm font-semibold text-gray-700 mb-2 block">How long?</label>
                <div className="relative">
                  <button
                    onClick={() => setShowHowLongDropdown(!showHowLongDropdown)}
                    className="w-full h-12 px-4 bg-white border-2 border-gray-200 rounded-xl text-left flex items-center justify-between hover:border-emerald-400 transition-all"
                  >
                    <span className={`font-medium ${selectedHowLong ? 'text-gray-900' : 'text-gray-400'}`}>
                      {selectedHowLong?.label || 'Select...'}
                    </span>
                    <ChevronDown className={`w-5 h-5 text-gray-400 transition-transform ${showHowLongDropdown ? 'rotate-180' : ''}`} />
                  </button>
                  {showHowLongDropdown && (
                    <div className="absolute bottom-full left-0 right-0 mb-2 bg-white/95 backdrop-blur-xl border-2 border-gray-100 rounded-xl shadow-xl z-[100]">
                      {howLongOptions.map((opt) => (
                        <button
                          key={opt.id}
                          onClick={() => {
                            setFormData(prev => ({ ...prev, howLong: opt.id }))
                            setShowHowLongDropdown(false)
                          }}
                          className={`w-full p-3 text-left text-sm font-medium hover:bg-emerald-50 transition-colors first:rounded-t-xl last:rounded-b-xl ${
                            formData.howLong === opt.id ? 'bg-emerald-50 text-emerald-700' : ''
                          }`}
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
              <label className="text-sm font-semibold text-gray-700 mb-2 block">Tried fixing yourself?</label>
              <Textarea
                placeholder="What you've tried, or type 'NA'"
                value={formData.triedFixing}
                onChange={(e) => setFormData(prev => ({ ...prev, triedFixing: e.target.value }))}
                rows={2}
                className="text-base border-2 border-gray-200 focus:border-emerald-400 focus:ring-emerald-100 rounded-xl resize-none p-3"
              />
            </div>
          </div>

          {/* Urgency - Premium Card */}
          <div className="bg-white/80 backdrop-blur-sm rounded-[28px] p-6 shadow-xl shadow-black/5 border border-white/60 hover:shadow-2xl hover:shadow-emerald-500/10 transition-all duration-500 relative z-50">
            <label className="text-base font-bold text-gray-900 mb-4 flex items-center gap-2.5">
              <div className="w-10 h-10 bg-gradient-to-br from-emerald-500 to-teal-600 rounded-xl flex items-center justify-center shadow-lg shadow-emerald-500/20">
                <Clock className="w-5 h-5 text-white" />
              </div>
              When do you need help?
            </label>
            <div className="relative mt-3">
              <button
                onClick={() => setShowUrgencyDropdown(!showUrgencyDropdown)}
                className="w-full p-4 bg-gradient-to-r from-gray-50 to-white border-2 border-gray-200 rounded-2xl text-left flex items-center justify-between hover:border-emerald-400 hover:shadow-lg transition-all duration-300 group"
              >
                <span className={`text-base font-medium ${selectedUrgency ? 'text-gray-900' : 'text-gray-400'}`}>
                  {selectedUrgency?.label || 'Select urgency...'}
                </span>
                <div className={`w-8 h-8 rounded-xl bg-gray-100 group-hover:bg-emerald-100 flex items-center justify-center transition-all ${showUrgencyDropdown ? 'rotate-180 bg-emerald-100' : ''}`}>
                  <ChevronDown className="w-5 h-5 text-gray-500 group-hover:text-emerald-600" />
                </div>
              </button>
              {showUrgencyDropdown && (
                <div className="absolute bottom-full left-0 right-0 mb-2 bg-white/95 backdrop-blur-xl border-2 border-gray-100 rounded-2xl shadow-2xl z-[100] overflow-hidden">
                  {urgencyOptions.map((opt) => (
                    <button
                      key={opt.id}
                      onClick={() => {
                        setFormData(prev => ({ ...prev, urgency: opt.id }))
                        setShowUrgencyDropdown(false)
                      }}
                      className={`w-full p-4 text-left hover:bg-gradient-to-r hover:from-emerald-50 hover:to-teal-50 transition-all ${
                        formData.urgency === opt.id ? 'bg-gradient-to-r from-emerald-50 to-teal-50 text-emerald-700 border-l-4 border-emerald-500' : ''
                      }`}
                    >
                      <div className="font-semibold text-base">{opt.label}</div>
                      <div className="text-sm text-gray-500 mt-0.5">{opt.description}</div>
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Analyze Button - Premium Style */}
          <Button
            onClick={handleAnalyze}
            disabled={analyzing || uploading}
            className="w-full h-16 bg-gradient-to-r from-emerald-500 via-teal-500 to-cyan-500 hover:from-emerald-600 hover:via-teal-600 hover:to-cyan-600 text-white font-bold text-lg rounded-2xl shadow-xl shadow-emerald-500/30 hover:shadow-2xl hover:shadow-emerald-500/40 transition-all duration-300 hover:scale-[1.02] active:scale-[0.98] disabled:opacity-70 disabled:hover:scale-100"
          >
            {analyzing ? (
              <>
                <div className="w-6 h-6 mr-3 border-3 border-white/30 border-t-white rounded-full animate-spin" />
                AI is analyzing your request...
              </>
            ) : (
              <>
                <div className="w-10 h-10 rounded-xl bg-white/20 flex items-center justify-center mr-3">
                  <Brain className="w-5 h-5" />
                </div>
                Analyze with AI & Get Price
              </>
            )}
          </Button>

          {/* Photos reminder - Premium Style */}
          {images.length < 3 && (
            <div className="flex items-center justify-center gap-2 p-3 bg-orange-50 rounded-2xl border border-orange-200">
              <Camera className="w-4 h-4 text-orange-600" />
              <p className="text-sm font-medium text-orange-700">
                Upload {3 - images.length} more photo(s) to continue
              </p>
            </div>
          )}
        </div>
      )}

      {/* Step 2: Review - Premium Design */}
      {step === 2 && aiResult && (
        <div className="max-w-2xl mx-auto px-4 py-6 pb-32 space-y-5 relative">
          {/* AI Result - Premium Gradient Card */}
          <div className="relative overflow-hidden bg-gradient-to-br from-emerald-500 via-teal-500 to-cyan-500 rounded-[32px] p-6 shadow-2xl shadow-emerald-500/30">
            {/* Decorative Elements */}
            <div className="absolute top-0 right-0 w-40 h-40 bg-white/10 rounded-full blur-2xl -translate-y-20 translate-x-20" />
            <div className="absolute bottom-0 left-0 w-32 h-32 bg-white/10 rounded-full blur-xl translate-y-16 -translate-x-16" />
            
            <div className="relative z-10">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-12 h-12 bg-white/20 backdrop-blur-sm rounded-2xl flex items-center justify-center">
                  <Brain className="w-6 h-6 text-white" />
                </div>
                <div className="flex-1">
                  <span className="font-bold text-white text-lg">AI Estimated Price</span>
                  <p className="text-white/70 text-sm">Powered by smart analysis</p>
                </div>
                <div className="px-4 py-2 bg-white/20 backdrop-blur-sm rounded-xl">
                  <span className="text-white font-bold text-sm">{aiResult.confidence}% confident</span>
                </div>
              </div>
              
              <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-5 mb-4">
                <div className="text-5xl font-black text-white mb-1">
                  ₹<AnimatedCounter end={aiResult.estimatedPrice} duration={1500} />
                </div>
                <div className="flex items-center gap-4 text-white/80 text-sm mt-2">
                  <span className="flex items-center gap-1">
                    <Star className="w-4 h-4 text-amber-300" />
                    {aiResult.categoryName}
                  </span>
                  {aiResult.estimatedDuration && (
                    <span className="flex items-center gap-1">
                      <Timer className="w-4 h-4" />
                      ~{aiResult.estimatedDuration} mins
                    </span>
                  )}
                </div>
                <p className="text-white/60 text-xs mt-2">Final price may vary based on actual work</p>
              </div>
              
              <div className="flex items-center gap-3 flex-wrap">
                <div className="flex items-center gap-2 px-3 py-2 bg-white/20 rounded-xl">
                  <Shield className="w-4 h-4 text-white" />
                  <span className="text-white text-sm font-medium">Price Protection</span>
                </div>
                <div className="flex items-center gap-2 px-3 py-2 bg-white/20 rounded-xl">
                  <CheckCircle2 className="w-4 h-4 text-white" />
                  <span className="text-white text-sm font-medium">No Hidden Fees</span>
                </div>
              </div>
            </div>
          </div>

          {/* Work Overview Card */}
          {aiResult.workOverview && (
            <div className="bg-white/80 backdrop-blur-sm rounded-[28px] p-6 shadow-xl shadow-black/5 border border-white/60">
              <h3 className="font-bold text-gray-900 text-lg mb-4 flex items-center gap-2">
                <div className="w-10 h-10 bg-gradient-to-br from-violet-500 to-purple-600 rounded-xl flex items-center justify-center shadow-lg shadow-violet-500/20">
                  <ClipboardList className="w-5 h-5 text-white" />
                </div>
                What Will Happen
              </h3>
              <p className="text-gray-700 leading-relaxed bg-gradient-to-r from-violet-50 to-purple-50 p-4 rounded-xl border border-violet-100">
                {aiResult.workOverview}
              </p>
            </div>
          )}

          {/* Helper Brings & Customer Provides */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Helper Brings */}
            {aiResult.helperBrings && aiResult.helperBrings.length > 0 && (
              <div className="bg-white/80 backdrop-blur-sm rounded-[28px] p-5 shadow-xl shadow-black/5 border border-white/60">
                <h4 className="font-bold text-gray-900 mb-3 flex items-center gap-2">
                  <div className="w-8 h-8 bg-gradient-to-br from-emerald-500 to-teal-600 rounded-lg flex items-center justify-center">
                    <Wrench className="w-4 h-4 text-white" />
                  </div>
                  Helper Will Bring
                </h4>
                <ul className="space-y-2">
                  {aiResult.helperBrings.map((item, idx) => (
                    <li key={idx} className="flex items-start gap-2 text-sm text-gray-700">
                      <CheckCircle2 className="w-4 h-4 text-emerald-500 flex-shrink-0 mt-0.5" />
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* Customer Provides */}
            {aiResult.customerProvides && aiResult.customerProvides.length > 0 && (
              <div className="bg-white/80 backdrop-blur-sm rounded-[28px] p-5 shadow-xl shadow-black/5 border border-white/60">
                <h4 className="font-bold text-gray-900 mb-3 flex items-center gap-2">
                  <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-lg flex items-center justify-center">
                    <User className="w-4 h-4 text-white" />
                  </div>
                  You Should Provide
                </h4>
                <ul className="space-y-2">
                  {aiResult.customerProvides.map((item, idx) => (
                    <li key={idx} className="flex items-start gap-2 text-sm text-gray-700">
                      <CheckCircle2 className="w-4 h-4 text-blue-500 flex-shrink-0 mt-0.5" />
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>

          {/* Materials Needed */}
          {aiResult.materialsNeeded && aiResult.materialsNeeded.length > 0 && (
            <div className="bg-white/80 backdrop-blur-sm rounded-[28px] p-5 shadow-xl shadow-black/5 border border-white/60">
              <h4 className="font-bold text-gray-900 mb-3 flex items-center gap-2">
                <div className="w-8 h-8 bg-gradient-to-br from-amber-500 to-orange-600 rounded-lg flex items-center justify-center">
                  <Package className="w-4 h-4 text-white" />
                </div>
                Materials That May Be Needed
              </h4>
              <div className="flex flex-wrap gap-2">
                {aiResult.materialsNeeded.map((item, idx) => (
                  <span key={idx} className="px-3 py-1.5 bg-amber-50 text-amber-700 rounded-full text-sm font-medium border border-amber-200">
                    {item}
                  </span>
                ))}
              </div>
              <p className="text-xs text-gray-500 mt-3">* Additional materials cost will be informed before purchase</p>
            </div>
          )}

          {/* Summary - Premium Card */}
          <div className="bg-white/80 backdrop-blur-sm rounded-[28px] p-6 shadow-xl shadow-black/5 border border-white/60">
            <h3 className="font-bold text-gray-900 text-lg mb-4 flex items-center gap-2">
              <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-xl flex items-center justify-center shadow-lg shadow-blue-500/20">
                <FileCheck className="w-5 h-5 text-white" />
              </div>
              Request Summary
            </h3>
            
            <div className="space-y-3">
              <div className="flex justify-between items-center p-3 bg-gray-50 rounded-xl">
                <span className="text-gray-500 font-medium">Category</span>
                <span className="font-semibold text-gray-900">{selectedCategory?.emoji} {aiResult.categoryName}</span>
              </div>
              <div className="flex justify-between items-center p-3 bg-gray-50 rounded-xl">
                <span className="text-gray-500 font-medium">Location</span>
                <span className="font-semibold text-gray-900 text-right max-w-[60%] truncate">{formData.flatNo}, {formData.location.split(',')[0]}</span>
              </div>
              <div className="flex justify-between items-center p-3 bg-gray-50 rounded-xl">
                <span className="text-gray-500 font-medium">Urgency</span>
                <span className={`font-semibold px-3 py-1 rounded-full text-sm ${
                  formData.urgency === 'emergency' ? 'bg-red-100 text-red-700' :
                  formData.urgency === 'urgent' ? 'bg-orange-100 text-orange-700' :
                  'bg-emerald-100 text-emerald-700'
                }`}>{selectedUrgency?.label}</span>
              </div>
              <div className="flex justify-between items-center p-3 bg-gray-50 rounded-xl">
                <span className="text-gray-500 font-medium">Mobile</span>
                <span className="font-semibold text-gray-900 flex items-center gap-2">
                  <Phone className="w-4 h-4 text-emerald-600" />
                  +91 {formData.mobileNumber}
                </span>
              </div>
              <div className="flex justify-between items-center p-3 bg-gray-50 rounded-xl">
                <span className="text-gray-500 font-medium">Media</span>
                <div className="flex gap-2">
                  <span className="font-semibold text-emerald-700 bg-emerald-50 px-3 py-1 rounded-full text-sm flex items-center gap-1">
                    <Camera className="w-3.5 h-3.5" /> {images.length}
                  </span>
                  <span className="font-semibold text-purple-700 bg-purple-50 px-3 py-1 rounded-full text-sm flex items-center gap-1">
                    <Video className="w-3.5 h-3.5" /> {videos.length}
                  </span>
                </div>
              </div>
            </div>

            <div className="mt-4 pt-4 border-t border-gray-100">
              <p className="text-sm font-semibold text-gray-500 mb-2">Problem Description</p>
              <p className="text-gray-800 bg-gradient-to-r from-gray-50 to-white p-4 rounded-xl border border-gray-100">{formData.description}</p>
            </div>
          </div>

          {/* Trust badges - Premium Style */}
          <div className="flex items-center justify-center gap-4 py-3 flex-wrap">
            <div className="flex items-center gap-2 px-4 py-2.5 bg-emerald-50 rounded-xl border border-emerald-200">
              <Shield className="w-5 h-5 text-emerald-600" />
              <span className="text-sm font-semibold text-emerald-700">Verified Helpers</span>
            </div>
            <div className="flex items-center gap-2 px-4 py-2.5 bg-blue-50 rounded-xl border border-blue-200">
              <CheckCircle2 className="w-5 h-5 text-blue-600" />
              <span className="text-sm font-semibold text-blue-700">Money-back Guarantee</span>
            </div>
          </div>

          {/* Submit Button - Premium Style */}
          <Button
            onClick={handleSubmit}
            disabled={loading}
            className="w-full h-16 bg-gradient-to-r from-emerald-500 via-teal-500 to-cyan-500 hover:from-emerald-600 hover:via-teal-600 hover:to-cyan-600 text-white font-bold text-lg rounded-2xl shadow-xl shadow-emerald-500/30 hover:shadow-2xl hover:shadow-emerald-500/40 transition-all duration-300 hover:scale-[1.02] active:scale-[0.98] disabled:opacity-70 disabled:hover:scale-100"
          >
            {loading ? (
              <>
                <div className="w-6 h-6 mr-3 border-3 border-white/30 border-t-white rounded-full animate-spin" />
                Posting your request...
              </>
            ) : (
              <>
                <div className="w-10 h-10 rounded-xl bg-white/20 flex items-center justify-center mr-3">
                  <Send className="w-5 h-5" />
                </div>
                Confirm & Post Request
              </>
            )}
          </Button>
        </div>
      )}

      {/* Step 3: Done - Premium Celebration */}
      {step === 3 && (
        <div className="max-w-2xl mx-auto px-4 py-16 text-center relative">
          {/* Celebration Background */}
          <div className="absolute inset-0 overflow-hidden">
            <div className="absolute top-1/4 left-1/4 w-2 h-2 bg-emerald-400 rounded-full animate-bounce" style={{ animationDelay: '0s' }} />
            <div className="absolute top-1/3 right-1/4 w-3 h-3 bg-teal-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }} />
            <div className="absolute top-1/2 left-1/3 w-2 h-2 bg-cyan-400 rounded-full animate-bounce" style={{ animationDelay: '0.4s' }} />
            <div className="absolute bottom-1/3 right-1/3 w-2 h-2 bg-amber-400 rounded-full animate-bounce" style={{ animationDelay: '0.6s' }} />
          </div>
          
          <div className="relative z-10">
            <div className="w-28 h-28 bg-gradient-to-br from-emerald-400 via-teal-500 to-cyan-500 rounded-[32px] flex items-center justify-center mx-auto mb-6 shadow-2xl shadow-emerald-500/40 animate-pulse">
              <CheckCircle2 className="w-14 h-14 text-white" />
            </div>
            
            <h2 className="text-3xl font-black bg-gradient-to-r from-emerald-600 via-teal-600 to-cyan-600 bg-clip-text text-transparent mb-3">
              Request Posted! 🎉
            </h2>
            
            <p className="text-gray-600 text-lg mb-6">
              Nearby verified helpers are being notified now
            </p>
            
            <div className="inline-flex items-center justify-center gap-3 px-6 py-3 bg-gradient-to-r from-emerald-50 to-teal-50 rounded-2xl border border-emerald-200">
              <div className="w-5 h-5 border-2 border-emerald-500/30 border-t-emerald-500 rounded-full animate-spin" />
              <span className="text-emerald-700 font-semibold">Redirecting to tracking page...</span>
            </div>
            
            <div className="mt-8 flex justify-center gap-4">
              <div className="px-4 py-2 bg-white rounded-xl shadow-lg border border-gray-100">
                <div className="text-sm text-gray-500">Estimated</div>
                <div className="text-xl font-bold text-emerald-600">₹{aiResult?.estimatedPrice || 0}</div>
              </div>
              <div className="px-4 py-2 bg-white rounded-xl shadow-lg border border-gray-100">
                <div className="text-sm text-gray-500">Category</div>
                <div className="text-xl font-bold text-gray-900">{selectedCategory?.emoji}</div>
              </div>
              <div className="px-4 py-2 bg-white rounded-xl shadow-lg border border-gray-100">
                <div className="text-sm text-gray-500">Urgency</div>
                <div className={`text-xl font-bold ${
                  formData.urgency === 'emergency' ? 'text-red-600' :
                  formData.urgency === 'urgent' ? 'text-orange-600' : 'text-emerald-600'
                }`}>{selectedUrgency?.label?.split(' ')[0]}</div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
