'use client'

import { useState, useRef, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { toast } from 'sonner'
import AddressInteractiveMap from '@/components/address-interactive-map'
import { compressAndUploadImage, uploadVideoToFirebase, uploadVideoThumbnail } from '@/lib/firebase-storage-client'
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
  Timer,
  Search
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
const getCategoryDetails = (serviceId: string, _description: string) => {
  const group = getGroupByServiceId(serviceId)
  const categoryKey = group?.id || 'other'

  const categoryInfo: Record<string, {
    basePrice: number;
    duration: number;
    materials: string[];
    helperBrings: string[];
    customerProvides: string[];
    workOverview: string;
    description: string;
  }> = {
    'home-services': {
      basePrice: 450,
      duration: 60,
      materials: ['Basic tools', 'Sealant tape', 'Common electricals', 'Nails & screws'],
      helperBrings: ['General repair toolkit', 'Drill set', 'Measuring tools', 'Protective gear'],
      customerProvides: ['Explain the exact issue', 'Clear access to work area', 'Show existing fixtures or parts if any'],
      workOverview: 'General home maintenance including plumbing, electrical, carpentry, painting touch-ups, AC checks, and appliance diagnosis. Helper inspects, confirms scope and parts needed, then executes safely.',
      description: 'Comprehensive home maintenance and repairs',
    },
    'cleaning-services': {
      basePrice: 500,
      duration: 60,
      materials: ['Cleaning solutions', 'Mops & brooms', 'Dusters', 'Garbage bags'],
      helperBrings: ['Professional cleaning equipment', 'Eco-friendly cleaning solutions', 'Microfiber cloths', 'Vacuum cleaner'],
      customerProvides: ['Access to water supply', 'Electricity for equipment', 'Point out specific areas to clean'],
      workOverview: 'Systematic cleaning for bathrooms, kitchen, sofas/carpets, and windows. Includes dusting, mopping, and sanitization. Deep cleaning typically takes 2-3 hours for a standard home.',
      description: 'Professional home and office cleaning',
    },
    'beauty-wellness': {
      basePrice: 700,
      duration: 75,
      materials: ['Beauty kits', 'Towels', 'Disposable sheets', 'Skin-safe products'],
      helperBrings: ['Salon-grade products', 'Sterilized tools', 'Massage oils/creams', 'Nail care kit'],
      customerProvides: ['Comfortable chair/space', 'Water access', 'Preferred styles or references'],
      workOverview: 'At-home salon and spa care: haircuts, styling, facials, massages, manicures/pedicures, makeup, waxing/threading. Service is set up hygienically in your space.',
      description: 'Salon, spa, and grooming at home',
    },
    'car-services': {
      basePrice: 600,
      duration: 60,
      materials: ['Engine oil', 'Filters', 'Brake fluid', 'Fuses'],
      helperBrings: ['Automotive toolkit', 'Diagnostic scanner', 'Jack & stands', 'Battery tester', 'Tyre repair kit'],
      customerProvides: ['Vehicle keys/documents', 'Park in accessible spot', 'Describe symptoms clearly'],
      workOverview: 'On-site car inspection, battery or tyre assistance, minor repairs, AC check, denting/painting assessment, and guided workshop visits for major jobs.',
      description: 'Car wash, repair, AC, tyre and battery help',
    },
    'pest-control': {
      basePrice: 700,
      duration: 60,
      materials: ['Pest control chemicals', 'Sprayers', 'Gel baits', 'Traps'],
      helperBrings: ['Professional pest control equipment', 'Government-approved chemicals', 'Safety gear', 'Bait stations'],
      customerProvides: ['Clear kitchen cabinets', 'Cover food items', 'Keep pets away for 2-3 hours', 'Point out problem areas'],
      workOverview: 'Inspection of entry points followed by targeted treatment for cockroaches, termites, bed bugs, mosquitos, rodents, or general pests. Follow-up visit may be advised.',
      description: 'Cockroach, termite, bed bug, and general pest control',
    },
    'moving-packing': {
      basePrice: 900,
      duration: 120,
      materials: ['Cartons', 'Bubble wrap', 'Packing tape', 'Shrink wrap'],
      helperBrings: ['Packing crew', 'Dollies/trolleys', 'Protective blankets', 'Labeling supplies'],
      customerProvides: ['List of items/rooms', 'Access to elevators/parking', 'Fragile item instructions'],
      workOverview: 'Packing, loading, and shifting for local or intercity moves. Includes furniture disassembly, office relocation, and vehicle transport coordination as needed.',
      description: 'Local shifting, intercity moves, and packing support',
    },
    'tutoring-training': {
      basePrice: 400,
      duration: 60,
      materials: ['Study material', 'Practice sheets', 'Learning plan'],
      helperBrings: ['Customized lesson plan', 'Exercises', 'Assessments'],
      customerProvides: ['Topic/subject focus', 'Current level details', 'Quiet study space'],
      workOverview: 'Academic tutoring, music or dance lessons, yoga/fitness coaching, language or cooking classes. Session tailored to the learner with practice assignments.',
      description: 'Academic and skill development sessions',
    },
    'event-services': {
      basePrice: 800,
      duration: 90,
      materials: ['Decor samples', 'Theme boards', 'Vendor options'],
      helperBrings: ['Event checklists', 'Decoration ideas', 'Catering and entertainment options'],
      customerProvides: ['Venue details', 'Guest count', 'Budget range', 'Theme preference'],
      workOverview: 'Planning and execution support for birthdays, weddings, catering, decoration, photography/videography, and entertainment. Includes on-site coordination if needed.',
      description: 'Birthday, wedding, catering, and event execution',
    },
    'gardening-landscaping': {
      basePrice: 550,
      duration: 75,
      materials: ['Fertilizers', 'Mulch', 'Plant support', 'Seeds/saplings'],
      helperBrings: ['Garden tools', 'Trimmers', 'Sprayers', 'Irrigation fittings'],
      customerProvides: ['Access to water', 'Sunlight constraints', 'Preferred plants or designs'],
      workOverview: 'Lawn mowing, plant care, garden design, irrigation setup, tree trimming, and garden pest control with eco-friendly methods.',
      description: 'Garden maintenance, design, and pest care',
    },
    'pet-care': {
      basePrice: 500,
      duration: 60,
      materials: ['Pet-safe shampoos', 'Grooming tools', 'Training aids'],
      helperBrings: ['Grooming kit', 'Leashes/harnesses', 'Treats (with consent)', 'Sanitizers'],
      customerProvides: ['Pet medical history', 'Behavior notes', 'Favorite treats/toys if allowed'],
      workOverview: 'Pet grooming, dog walking, basic training, pet sitting, taxi to vet, or vet tele-consult support handled safely and gently.',
      description: 'Grooming, walking, training, sitting, and vet support',
    },
    'computer-it-services': {
      basePrice: 450,
      duration: 60,
      materials: ['Cables', 'Thermal paste', 'Replacement parts checklist'],
      helperBrings: ['Laptop/desktop toolkit', 'USB installers', 'Diagnostic software', 'Cleaning kit'],
      customerProvides: ['Device passwords (if comfortable)', 'Issue description', 'Backup of important data'],
      workOverview: 'Troubleshooting laptops/desktops, data recovery, software installation, network setup, printer fixes, and virus cleanup with data safety guidance.',
      description: 'Laptop/desktop repair, software, and network setup',
    },
    'laundry-services': {
      basePrice: 350,
      duration: 60,
      materials: ['Detergents', 'Stain removers', 'Garment covers'],
      helperBrings: ['Sorting and wash plan', 'Steam press/iron kit', 'Fabric-safe chemicals'],
      customerProvides: ['Garment care preferences', 'Any delicate/hand-wash notes', 'Pickup/drop timing'],
      workOverview: 'Wash & iron, dry cleaning, steam press, shoe cleaning, and carpet/curtain cleaning with clear care instructions.',
      description: 'Wash, iron, dry clean, and fabric care',
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
  
  return categoryInfo[categoryKey] || categoryInfo['other']
}

const serviceGroups = [
  {
    id: 'home-services',
    name: 'Home Services',
    emoji: '🏠',
    services: [
      { id: 'plumbing', name: 'Plumbing' },
      { id: 'electrical-work', name: 'Electrical Work' },
      { id: 'carpentry', name: 'Carpentry' },
      { id: 'painting', name: 'Painting' },
      { id: 'ac-repair', name: 'AC Repair & Service' },
      { id: 'appliance-repair', name: 'Appliance Repair' }
    ]
  },
  {
    id: 'cleaning-services',
    name: 'Cleaning Services',
    emoji: '🧹',
    services: [
      { id: 'house-cleaning', name: 'House Cleaning' },
      { id: 'office-cleaning', name: 'Office Cleaning' },
      { id: 'bathroom-cleaning', name: 'Bathroom Cleaning' },
      { id: 'kitchen-cleaning', name: 'Kitchen Cleaning' },
      { id: 'sofa-carpet-cleaning', name: 'Sofa & Carpet Cleaning' },
      { id: 'window-cleaning', name: 'Window Cleaning' }
    ]
  },
  {
    id: 'beauty-wellness',
    name: 'Beauty & Wellness',
    emoji: '💆',
    services: [
      { id: 'haircut-styling', name: 'Haircut & Styling' },
      { id: 'facial', name: 'Facial Treatment' },
      { id: 'massage-therapy', name: 'Massage Therapy' },
      { id: 'manicure-pedicure', name: 'Manicure & Pedicure' },
      { id: 'makeup-artist', name: 'Makeup Artist' },
      { id: 'waxing-threading', name: 'Waxing & Threading' }
    ]
  },
  {
    id: 'car-services',
    name: 'Car Services',
    emoji: '🚗',
    services: [
      { id: 'car-wash', name: 'Car Wash' },
      { id: 'car-repair', name: 'Car Repair' },
      { id: 'tire-service', name: 'Tire Service' },
      { id: 'battery-service', name: 'Battery Service' },
      { id: 'denting-painting', name: 'Denting & Painting' },
      { id: 'car-ac-service', name: 'Car AC Service' }
    ]
  },
  {
    id: 'pest-control',
    name: 'Pest Control',
    emoji: '🐛',
    services: [
      { id: 'cockroach-control', name: 'Cockroach Control' },
      { id: 'termite-control', name: 'Termite Control' },
      { id: 'bed-bug-control', name: 'Bed Bug Control' },
      { id: 'mosquito-control', name: 'Mosquito Control' },
      { id: 'rodent-control', name: 'Rodent Control' },
      { id: 'pest-control', name: 'General Pest Control' }
    ]
  },
  {
    id: 'moving-packing',
    name: 'Moving & Packing',
    emoji: '📦',
    services: [
      { id: 'local-shifting', name: 'Local Shifting' },
      { id: 'intercity-moving', name: 'Intercity Moving' },
      { id: 'packing-services', name: 'Packing Services' },
      { id: 'furniture-moving', name: 'Furniture Moving' },
      { id: 'office-relocation', name: 'Office Relocation' },
      { id: 'vehicle-transport', name: 'Vehicle Transport' }
    ]
  },
  {
    id: 'tutoring-training',
    name: 'Tutoring & Training',
    emoji: '🎓',
    services: [
      { id: 'academic-tutoring', name: 'Academic Tutoring' },
      { id: 'music-lessons', name: 'Music Lessons' },
      { id: 'dance-classes', name: 'Dance Classes' },
      { id: 'yoga-fitness', name: 'Yoga & Fitness' },
      { id: 'language-classes', name: 'Language Classes' },
      { id: 'cooking-classes', name: 'Cooking Classes' }
    ]
  },
  {
    id: 'event-services',
    name: 'Event Services',
    emoji: '🎉',
    services: [
      { id: 'birthday-party-planning', name: 'Birthday Party Planning' },
      { id: 'wedding-planning', name: 'Wedding Planning' },
      { id: 'catering-service', name: 'Catering Service' },
      { id: 'decoration-service', name: 'Decoration Service' },
      { id: 'photography-videography', name: 'Photography & Videography' },
      { id: 'entertainment', name: 'Entertainment' }
    ]
  },
  {
    id: 'gardening-landscaping',
    name: 'Gardening & Landscaping',
    emoji: '🌱',
    services: [
      { id: 'lawn-mowing', name: 'Lawn Mowing' },
      { id: 'garden-design', name: 'Garden Design' },
      { id: 'plant-care', name: 'Plant Care' },
      { id: 'tree-trimming', name: 'Tree Trimming' },
      { id: 'irrigation-system', name: 'Irrigation System' },
      { id: 'garden-pest-control', name: 'Garden Pest Control' }
    ]
  },
  {
    id: 'pet-care',
    name: 'Pet Care',
    emoji: '🐶',
    services: [
      { id: 'pet-grooming', name: 'Pet Grooming' },
      { id: 'dog-walking', name: 'Dog Walking' },
      { id: 'pet-training', name: 'Pet Training' },
      { id: 'pet-sitting', name: 'Pet Sitting' },
      { id: 'vet-consultation', name: 'Vet Consultation' },
      { id: 'pet-taxi', name: 'Pet Taxi' }
    ]
  },
  {
    id: 'computer-it-services',
    name: 'Computer & IT Services',
    emoji: '💻',
    services: [
      { id: 'laptop-repair', name: 'Laptop Repair' },
      { id: 'desktop-repair', name: 'Desktop Repair' },
      { id: 'data-recovery', name: 'Data Recovery' },
      { id: 'software-installation', name: 'Software Installation' },
      { id: 'network-setup', name: 'Network Setup' },
      { id: 'printer-repair', name: 'Printer Repair' }
    ]
  },
  {
    id: 'laundry-services',
    name: 'Laundry Services',
    emoji: '🧺',
    services: [
      { id: 'wash-iron', name: 'Wash & Iron' },
      { id: 'dry-cleaning', name: 'Dry Cleaning' },
      { id: 'iron-only', name: 'Iron Only' },
      { id: 'steam-press', name: 'Steam Press' },
      { id: 'shoe-cleaning', name: 'Shoe Cleaning' },
      { id: 'carpet-curtain-cleaning', name: 'Carpet & Curtain Cleaning' }
    ]
  }
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

const findServiceById = (id?: string) => {
  if (!id) return null
  for (const group of serviceGroups) {
    const svc = group.services.find((s) => s.id === id)
    if (svc) return { ...svc, group }
  }
  return null
}

const getGroupByServiceId = (id?: string) => {
  if (!id) return null
  return serviceGroups.find((g) => g.services.some((s) => s.id === id)) || null
}

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
  const [openGroupId, setOpenGroupId] = useState<string | null>(null)
  const [showUrgencyDropdown, setShowUrgencyDropdown] = useState(false)
  const [showHowLongDropdown, setShowHowLongDropdown] = useState(false)
  const [serviceSearch, setServiceSearch] = useState('')
  
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

  // Handle hardware back button for multi-step navigation
  useEffect(() => {
    const handleCapacitorBack = (event: Event) => {
      if (step > 1) {
        // Prevent default router.back() and go to previous step instead
        event.preventDefault()
        setStep(step - 1)
        window.scrollTo({ top: 0, behavior: 'smooth' })
      }
      // If step === 1, let the event propagate and router.back() will be called
    }

    window.addEventListener('capacitor-back-button', handleCapacitorBack)
    return () => {
      window.removeEventListener('capacitor-back-button', handleCapacitorBack)
    }
  }, [step])

  // Pre-fill mobile number from profile if available
  useEffect(() => {
    const loadUserPhone = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (user) {
        const { data: profile } = await supabase
          .from('profiles')
          .select('phone')
          .eq('id', user.id)
          .maybeSingle()
        
        if (profile?.phone) {
          setFormData(prev => ({ ...prev, mobileNumber: profile.phone }))
        }
      }
    }
    loadUserPhone()
  }, [supabase])

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

  // Convert file to base64 (for small files only)
  const fileToDataUrl = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader()
      reader.onload = () => resolve(reader.result as string)
      reader.onerror = () => reject(new Error('Failed to read file'))
      reader.readAsDataURL(file)
    })
  }

  // Compress video to reduce size (extracts thumbnail only for now)
  const compressVideo = async (file: File): Promise<string> => {
    // For now, just store a placeholder or skip large videos
    // Videos are too large for base64 storage - would need dedicated video upload
    if (file.size > 10 * 1024 * 1024) {
      // For large videos, create a thumbnail from first frame
      return new Promise((resolve, reject) => {
        const video = document.createElement('video')
        video.preload = 'metadata'
        video.onloadeddata = () => {
          video.currentTime = 0.5 // Get frame at 0.5s
        }
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
    // Small videos can be stored as base64
    return fileToDataUrl(file)
  }

  // Compress image aggressively for mobile uploads (camera photos can be 5-12MB)
  const compressImage = async (file: File, maxWidth = 800): Promise<string> => {
    return new Promise((resolve, reject) => {
      const img = new window.Image()
      const objectUrl = URL.createObjectURL(file)
      
      img.onload = () => {
        try {
          const canvas = document.createElement('canvas')
          let { width, height } = img
          
          // Determine compression based on original file size
          const fileSizeMB = file.size / (1024 * 1024)
          let targetMaxWidth = maxWidth
          let quality = 0.7
          
          // More aggressive compression for larger files
          if (fileSizeMB > 5) {
            targetMaxWidth = 600
            quality = 0.5
          } else if (fileSizeMB > 2) {
            targetMaxWidth = 700
            quality = 0.6
          }
          
          // Resize if needed
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
          
          // Clean up object URL
          URL.revokeObjectURL(objectUrl)
          
          const result = canvas.toDataURL('image/jpeg', quality)
          
          // Verify result size is reasonable (< 500KB)
          const resultSizeKB = (result.length * 0.75) / 1024
          console.log(`📸 Compressed: ${fileSizeMB.toFixed(1)}MB → ${resultSizeKB.toFixed(0)}KB`)
          
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
        
        // Reject files over 15MB (usually indicates a problem)
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
          console.error('Upload failed for:', file.name, uploadErr)
          toast.error(`Could not upload ${file.name}`)
        }
      }
      
      if (successCount > 0) {
        toast.success(`${successCount} photo${successCount > 1 ? 's' : ''} uploaded!`)
      }
    } catch (err) {
      console.error('Image selection error:', err)
      toast.error('Failed to upload photos. Please try again.')
    } finally {
      setUploading(false)
      // Reset input to allow re-selecting same file
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

  const handleCustomPriceFlow = () => {
    if (!formData.category || !formData.description || !formData.location) {
      toast.error('Please fill category, description, and location first')
      return
    }

    const fallbackPayload = {
      category: formData.category,
      description: formData.description,
      title: formData.description?.slice(0, 80) || 'Service request',
      location: formData.location,
      latitude: formData.latitude,
      longitude: formData.longitude,
      images,
      videos,
      urgency: formData.urgency,
      estimatedPrice: aiResult?.estimatedPrice,
    }

    try {
      localStorage.setItem('aiFallbackRequest', JSON.stringify(fallbackPayload))
    } catch (error) {
      console.error('Failed to store fallback request', error)
    }

    router.push('/customer/requests/new')
  }

  // Simple category detection fallback
  const detectCategory = (text: string) => {
    const lower = text.toLowerCase()
    if (lower.match(/plumb|tap|leak|pipe|toilet/)) return { id: 'plumbing', name: 'Plumbing', basePrice: 450 }
    if (lower.match(/electric|wire|switch|fan|light|shock/)) return { id: 'electrical-work', name: 'Electrical Work', basePrice: 450 }
    if (lower.match(/carpenter|wood|door|furniture/)) return { id: 'carpentry', name: 'Carpentry', basePrice: 450 }
    if (lower.match(/paint|wall|color/)) return { id: 'painting', name: 'Painting', basePrice: 450 }
    if (lower.match(/\bac\b|air condition|cool/)) return { id: 'ac-repair', name: 'AC Repair & Service', basePrice: 450 }
    if (lower.match(/appliance|fridge|washing machine|microwave|oven/)) return { id: 'appliance-repair', name: 'Appliance Repair', basePrice: 450 }

    if (lower.match(/clean|wash|dust|mop|sofa|carpet/)) return { id: 'house-cleaning', name: 'House Cleaning', basePrice: 500 }
    if (lower.match(/office/)) return { id: 'office-cleaning', name: 'Office Cleaning', basePrice: 500 }
    if (lower.match(/bathroom|toilet/)) return { id: 'bathroom-cleaning', name: 'Bathroom Cleaning', basePrice: 500 }
    if (lower.match(/kitchen/)) return { id: 'kitchen-cleaning', name: 'Kitchen Cleaning', basePrice: 500 }
    if (lower.match(/window/)) return { id: 'window-cleaning', name: 'Window Cleaning', basePrice: 500 }

    if (lower.match(/salon|hair|facial|massage|wax|makeup|nail/)) return { id: 'haircut-styling', name: 'Haircut & Styling', basePrice: 700 }

    if (lower.match(/car |vehicle|tyre|tire|battery|engine/)) return { id: 'car-repair', name: 'Car Repair', basePrice: 600 }
    if (lower.match(/wash car/)) return { id: 'car-wash', name: 'Car Wash', basePrice: 600 }
    if (lower.match(/tire|tyre/)) return { id: 'tire-service', name: 'Tire Service', basePrice: 600 }
    if (lower.match(/battery/)) return { id: 'battery-service', name: 'Battery Service', basePrice: 600 }
    if (lower.match(/paint|dent/)) return { id: 'denting-painting', name: 'Denting & Painting', basePrice: 600 }
    if (lower.match(/car ac/)) return { id: 'car-ac-service', name: 'Car AC Service', basePrice: 600 }

    if (lower.match(/pest|cockroach|termite|bed bug|mosquito|rodent|rat|ant/)) return { id: 'pest-control', name: 'General Pest Control', basePrice: 700 }

    if (lower.match(/move|shift|pack|relocat|transport/)) return { id: 'local-shifting', name: 'Local Shifting', basePrice: 900 }

    if (lower.match(/tutor|class|lesson|coach|yoga|training|language|music|dance/)) return { id: 'academic-tutoring', name: 'Academic Tutoring', basePrice: 400 }

    if (lower.match(/event|wedding|birthday|party|catering|decor|photograph/)) return { id: 'birthday-party-planning', name: 'Birthday Party Planning', basePrice: 800 }

    if (lower.match(/garden|lawn|plant|tree|irrigation/)) return { id: 'lawn-mowing', name: 'Lawn Mowing', basePrice: 550 }

    if (lower.match(/pet|dog|cat|groom|vet/)) return { id: 'pet-grooming', name: 'Pet Grooming', basePrice: 500 }

    if (lower.match(/laptop|computer|desktop|printer|network|software|virus/)) return { id: 'laptop-repair', name: 'Laptop Repair', basePrice: 450 }

    if (lower.match(/laundry|dry clean|press|iron|steam|shoe|curtain/)) return { id: 'wash-iron', name: 'Wash & Iron', basePrice: 350 }

    return { id: 'plumbing', name: 'Plumbing', basePrice: 450 }
  }

  // AI Analysis
  const handleAnalyze = async () => {
    // Validation
    if (images.length < 3) {
      toast.error('Please upload at least 3 photos')
      return
    }
    if (!formData.category) {
      toast.error('Please select a specific service')
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
      const selected = findServiceById(formData.category)
      const categoryName = selected?.name || 'General'
      
      const response = await fetch('/api/ai/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          description: formData.description,
          categoryId: formData.category,
          categoryName: categoryName,
          images: images,
          location: formData.location,
          urgency: formData.urgency,
          timeWindow: formData.howLong,
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
        pricingSource: data.pricingSource || 'ai',
      })
      
      setStep(2) // Move to review step
      window.scrollTo({ top: 0, behavior: 'smooth' })
    } catch (err) {
      console.error('AI analysis error:', err)
      const category = detectCategory(formData.description)
      const categoryName = findServiceById(formData.category || category.id)?.name || category.name
      const categoryDetails = getCategoryDetails(formData.category || category.id, formData.description)
      
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
        pricingSource: 'fallback',
      })
      setStep(2)
      window.scrollTo({ top: 0, behavior: 'smooth' })
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

      // Add timeout to prevent infinite loading (30 seconds max)
      const controller = new AbortController()
      const timeoutId = setTimeout(() => controller.abort(), 30000)

      const broadcastResponse = await fetch('/api/requests/broadcast', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        signal: controller.signal,
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
      
      clearTimeout(timeoutId)
      
      const broadcastData = await broadcastResponse.json()
      
      if (!broadcastResponse.ok) {
        throw new Error(broadcastData.error || 'Failed to post request')
      }
      
      setStep(3) // Done step
      window.scrollTo({ top: 0, behavior: 'smooth' })
      
      setTimeout(() => {
        router.push(`/customer/requests/${broadcastData.requestId}/track`)
      }, 2000)
      
    } catch (err: any) {
      console.error('Submit error:', err)
      if (err.name === 'AbortError') {
        toast.error('Request timed out. Please try again.')
      } else {
        toast.error(err.message || 'Failed to create request')
      }
    } finally {
      setLoading(false)
    }
  }

  const selectedService = findServiceById(formData.category)
  const selectedUrgency = urgencyOptions.find(u => u.id === formData.urgency)
  const selectedHowLong = howLongOptions.find(h => h.id === formData.howLong)
  const normalizedServiceSearch = serviceSearch.trim().toLowerCase()
  const filteredServiceGroups = serviceGroups
    .map(group => {
      const filteredServices = normalizedServiceSearch
        ? group.services.filter(svc =>
            svc.name.toLowerCase().includes(normalizedServiceSearch) || svc.id.toLowerCase().includes(normalizedServiceSearch)
          )
        : group.services
      return { ...group, services: filteredServices }
    })
    .filter(group => (normalizedServiceSearch ? group.services.length > 0 : true))

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-emerald-50/30 dark:from-slate-950 dark:via-slate-950 dark:to-slate-900 text-slate-900 dark:text-slate-100 relative overflow-hidden">
      {/* Decorative Background Elements */}
      <div className="absolute top-0 right-0 w-96 h-96 bg-gradient-to-br from-emerald-400/10 to-teal-400/10 rounded-full blur-3xl -translate-y-48 translate-x-48 opacity-80 dark:opacity-40" />
      <div className="absolute bottom-0 left-0 w-80 h-80 bg-gradient-to-tr from-blue-400/10 to-purple-400/10 rounded-full blur-3xl translate-y-40 -translate-x-40 opacity-80 dark:opacity-40" />
      <div className="absolute top-1/2 left-1/2 w-64 h-64 bg-gradient-to-r from-amber-300/5 to-orange-300/5 rounded-full blur-2xl -translate-x-1/2 -translate-y-1/2 opacity-70 dark:opacity-30" />
      
      {/* Premium Header */}
      <div className="sticky top-0 z-50 backdrop-blur-xl bg-white/80 dark:bg-slate-950/85 border-b border-white/20 dark:border-slate-800 shadow-lg shadow-black/5 dark:shadow-black/10 pt-safe">
        <div className="max-w-2xl mx-auto px-4 py-4 flex items-center gap-4 min-h-[88px] sm:min-h-[96px]">
          <button 
            onClick={() => {
              if (step > 1) {
                setStep(step - 1)
                window.scrollTo({ top: 0, behavior: 'smooth' })
              } else {
                router.back()
              }
            }}
            className="p-2.5 hover:bg-gray-100 rounded-2xl transition-all duration-300 hover:scale-105 active:scale-95"
          >
            <ArrowLeft className="w-5 h-5 text-gray-700 dark:text-slate-200" />
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
              <h1 className="text-xl font-bold bg-gradient-to-r from-gray-900 via-gray-800 to-gray-900 dark:from-white dark:via-white/90 dark:to-white bg-clip-text text-transparent">AI Smart Request</h1>
              <p className="text-sm text-gray-500 dark:text-slate-400 flex items-center gap-1.5">
                <Zap className="w-3.5 h-3.5 text-amber-500" />
                Get instant AI-powered pricing
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Premium Progress Steps */}
      <div className="bg-gradient-to-r from-white/60 via-white/80 to-white/60 dark:from-slate-950/70 dark:via-slate-950/60 dark:to-slate-900/60 backdrop-blur-sm border-b border-gray-100/50 dark:border-slate-800/70">
        <div className="max-w-2xl mx-auto px-4 pt-6 pb-7">
          <div className="relative">
            {/* Progress Line sits behind icons; spacing keeps labels clear */}
            <div className="absolute left-3 right-3 sm:left-6 sm:right-6 top-9 pointer-events-none">
              <div className="h-1 bg-gray-200/80 dark:bg-slate-800/80 rounded-full" />
              <div
                className="absolute left-0 top-0 h-1 bg-gradient-to-r from-emerald-500 to-teal-500 rounded-full transition-all duration-500"
                style={{ width: `${((step - 1) / 2) * 100}%`, maxWidth: '100%' }}
              />
            </div>

            <div className="grid grid-cols-3 gap-4 sm:gap-6 text-center relative z-10">
              {[
                { num: 1, label: 'Upload', icon: Upload, desc: 'Add photos & details' },
                { num: 2, label: 'Review', icon: FileCheck, desc: 'Verify AI analysis' },
                { num: 3, label: 'Done', icon: PartyPopper, desc: 'Request posted!' },
              ].map((s) => {
                const Icon = s.icon
                const isActive = step === s.num
                const isDone = step > s.num
                return (
                  <div key={s.num} className="flex flex-col items-center gap-2 sm:gap-2.5 px-1">
                    <div
                      className={`w-14 h-14 rounded-2xl flex items-center justify-center transition-all duration-500 shadow-lg ${
                        isDone
                          ? 'bg-gradient-to-br from-emerald-500 to-teal-600 text-white shadow-emerald-500/30'
                          : isActive
                            ? 'bg-gradient-to-br from-emerald-500 to-teal-600 text-white shadow-emerald-500/40 scale-105 ring-4 ring-emerald-100 dark:ring-emerald-900/40'
                            : 'bg-white dark:bg-slate-900 text-gray-400 dark:text-slate-500 shadow-gray-200/50 dark:shadow-none border-2 border-gray-200 dark:border-slate-700'
                      }`}
                    >
                      {isDone ? <CheckCircle2 className="w-6 h-6" /> : <Icon className="w-6 h-6" />}
                    </div>
                    <div className="space-y-1 max-w-[110px] sm:max-w-none">
                      <p className={`text-sm font-semibold leading-tight ${step >= s.num ? 'text-gray-900 dark:text-slate-100' : 'text-gray-400 dark:text-slate-500'}`}>
                        {s.label}
                      </p>
                      <p className={`text-xs leading-snug ${step >= s.num ? 'text-gray-500 dark:text-slate-400' : 'text-gray-300 dark:text-slate-600'}`}>
                        {s.desc}
                      </p>
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        </div>
      </div>

      {/* Step 1: Upload Form */}
      {step === 1 && (
        <div className="max-w-2xl mx-auto px-3 sm:px-4 py-5 pb-28 space-y-4 relative">
          
          {/* Photos & Videos - Premium Card */}
          <div className="bg-white/90 dark:bg-slate-900 backdrop-blur-sm rounded-2xl p-4 shadow-md dark:shadow-none border border-slate-200 dark:border-slate-800 hover:shadow-lg dark:hover:shadow-[0_12px_30px_rgba(0,0,0,0.35)] transition-all duration-300">
            <div className="flex items-center justify-between mb-4">
              <label className="text-base font-bold text-gray-900 dark:text-slate-100 flex items-center gap-2.5">
                <div className="w-10 h-10 bg-gradient-to-br from-emerald-500 to-teal-600 rounded-xl flex items-center justify-center shadow-lg shadow-emerald-500/20">
                  <ImageIcon className="w-5 h-5 text-white" />
                </div>
                Photos & Videos
              </label>
              <span className="text-xs font-semibold text-orange-600 bg-orange-50 dark:bg-orange-900/30 px-3 py-1.5 rounded-full border border-orange-200 dark:border-orange-800/60">
                3-5 photos required
              </span>
            </div>
            
            {/* Upload Buttons - Compact Tiles */}
            <div className="grid grid-cols-3 gap-3 mb-3">
              <button
                onClick={() => cameraInputRef.current?.click()}
                disabled={uploading || images.length >= 5}
                className="h-28 w-full rounded-2xl border-2 border-dashed border-emerald-200 bg-emerald-50/60 dark:border-emerald-900/50 dark:bg-emerald-900/20 flex flex-col items-center justify-center gap-2 text-emerald-700 dark:text-emerald-200 hover:border-emerald-400 hover:bg-emerald-50 dark:hover:bg-emerald-900/30 disabled:opacity-50 transition-all"
              >
                <div className="w-12 h-12 rounded-xl bg-white shadow-sm flex items-center justify-center">
                  <Camera className="w-6 h-6" />
                </div>
                <span className="text-sm font-semibold">Camera</span>
              </button>
              <button
                onClick={() => fileInputRef.current?.click()}
                disabled={uploading || images.length >= 5}
                className="h-28 w-full rounded-2xl border-2 border-dashed border-blue-200 bg-blue-50/60 dark:border-blue-900/50 dark:bg-blue-900/20 flex flex-col items-center justify-center gap-2 text-blue-700 dark:text-blue-200 hover:border-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/30 disabled:opacity-50 transition-all"
              >
                <div className="w-12 h-12 rounded-xl bg-white shadow-sm flex items-center justify-center">
                  <ImageIcon className="w-6 h-6" />
                </div>
                <span className="text-sm font-semibold">Gallery</span>
              </button>
              <button
                onClick={() => videoInputRef.current?.click()}
                disabled={uploading || videos.length >= 2}
                className="h-28 w-full rounded-2xl border-2 border-dashed border-purple-200 bg-purple-50/60 dark:border-purple-900/50 dark:bg-purple-900/20 flex flex-col items-center justify-center gap-2 text-purple-700 dark:text-purple-200 hover:border-purple-400 hover:bg-purple-50 dark:hover:bg-purple-900/30 disabled:opacity-50 transition-all"
              >
                <div className="w-12 h-12 rounded-xl bg-white shadow-sm flex items-center justify-center">
                  <Video className="w-6 h-6" />
                </div>
                <span className="text-sm font-semibold">Video</span>
              </button>
            </div>

            <div className="flex items-center gap-2 text-[11px] text-gray-500 dark:text-slate-400 mt-2">
              <Video className="w-3 h-3 text-purple-500" />
              <span>Max 50MB per video (up to 2)</span>
            </div>

            {/* Counts - Compact Badges */}
            <div className="flex items-center gap-3 mt-3 flex-wrap">
              <div className="flex items-center gap-2 px-3 py-1.5 bg-emerald-50 dark:bg-emerald-900/20 rounded-lg border border-emerald-100 dark:border-emerald-800/60">
                <Camera className="w-4 h-4 text-emerald-600 dark:text-emerald-300" />
                <span className="text-xs font-semibold text-emerald-700 dark:text-emerald-200">{images.length}/5 photos</span>
              </div>
              <div className="flex items-center gap-2 px-3 py-1.5 bg-purple-50 dark:bg-purple-900/20 rounded-lg border border-purple-100 dark:border-purple-800/60">
                <Video className="w-4 h-4 text-purple-600 dark:text-purple-200" />
                <span className="text-xs font-semibold text-purple-700 dark:text-purple-200">{videos.length}/2 videos</span>
              </div>
            </div>

            {/* Preview Images - Enhanced Grid */}
            {images.length > 0 && (
              <div className="flex gap-3 flex-wrap mt-4">
                {images.map((url, idx) => (
                  <div key={idx} className="relative group">
                    <div className="w-20 h-20 rounded-2xl overflow-hidden border-2 border-white dark:border-slate-700 shadow-lg dark:shadow-none group-hover:shadow-xl group-hover:scale-105 transition-all duration-300">
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
                    <div className="w-24 h-16 rounded-2xl overflow-hidden border-2 border-white dark:border-slate-700 shadow-lg dark:shadow-none bg-gray-900 group-hover:shadow-xl group-hover:scale-105 transition-all duration-300">
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
            <div className="mt-4 p-4 bg-gradient-to-r from-amber-50 to-orange-50 dark:from-amber-900/10 dark:to-orange-900/10 rounded-2xl border border-amber-200/50 dark:border-amber-800/60">
              <p className="text-sm text-amber-800 dark:text-amber-100 flex items-start gap-3">
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

          {/* Service Category - Mobile-first accordion */}
          <div className="bg-white/90 dark:bg-slate-900 backdrop-blur-sm rounded-2xl p-4 shadow-md dark:shadow-none border border-slate-200 dark:border-slate-800 hover:shadow-lg dark:hover:shadow-[0_12px_30px_rgba(0,0,0,0.35)] transition-all duration-300">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <div className="w-9 h-9 bg-gradient-to-br from-violet-500 to-purple-600 rounded-lg flex items-center justify-center shadow-sm">
                  <Sparkles className="w-4 h-4 text-white" />
                </div>
                <div>
                  <p className="text-xs text-slate-500 dark:text-slate-400 font-semibold">Service</p>
                  <p className="text-base font-semibold text-slate-900 dark:text-slate-100">Choose exact service</p>
                </div>
              </div>
              <span className="text-[11px] font-semibold text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-full">Required</span>
            </div>

            <div className="relative mb-3">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 dark:text-slate-500" />
              <input
                type="text"
                value={serviceSearch}
                onChange={(e) => setServiceSearch(e.target.value)}
                placeholder="Search services (e.g., plumber, AC repair, sofa cleaning)"
                className="w-full pl-10 pr-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-sm text-slate-800 dark:text-slate-100 placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:ring-2 focus:ring-emerald-500 focus:border-transparent dark:focus:ring-emerald-600"
              />
            </div>

            <div className="space-y-2">
              {filteredServiceGroups.map((group) => {
                const isOpen = normalizedServiceSearch ? true : openGroupId === group.id
                return (
                  <div key={group.id} className="border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden bg-white dark:bg-slate-900">
                    <button
                      type="button"
                      onClick={() => !normalizedServiceSearch && setOpenGroupId(isOpen ? null : group.id)}
                      className="w-full px-3 py-2 flex items-center justify-between hover:bg-slate-50 dark:hover:bg-slate-800/70"
                    >
                      <div className="flex items-center gap-2 text-left">
                        <span className="text-xl">{group.emoji}</span>
                        <span className="text-sm font-semibold text-slate-900 dark:text-slate-100">{group.name}</span>
                      </div>
                      {!normalizedServiceSearch && (
                        <ChevronDown className={`w-4 h-4 text-slate-500 dark:text-slate-400 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
                      )}
                    </button>
                    {isOpen && (
                      <div className="border-t border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900 px-3 py-2 space-y-1">
                        {group.services.map((svc) => {
                          const isSelected = formData.category === svc.id
                          const isMatch = normalizedServiceSearch && svc.name.toLowerCase().includes(normalizedServiceSearch)
                          return (
                            <button
                              type="button"
                              key={svc.id}
                              onClick={() => setFormData((prev) => ({ ...prev, category: svc.id }))}
                              className={`w-full text-left px-3 py-2 rounded-lg flex items-center justify-between text-sm transition-colors ${
                                isSelected
                                  ? 'bg-emerald-50 dark:bg-emerald-900/20 text-emerald-700 dark:text-emerald-200 border border-emerald-200 dark:border-emerald-800'
                                  : 'bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800/60 border border-slate-200 dark:border-slate-800'
                              } ${isMatch ? 'ring-2 ring-emerald-200 dark:ring-emerald-700/60' : ''}`}
                            >
                              <span>{svc.name}</span>
                              {isSelected && <CheckCircle2 className="w-4 h-4 text-emerald-600" />}
                            </button>
                          )
                        })}
                      </div>
                    )}
                  </div>
                )
              })}
            </div>

            {selectedService && (
              <div className="mt-3 text-sm text-emerald-700 dark:text-emerald-200 bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-100 dark:border-emerald-800 rounded-lg px-3 py-2">
                Selected: <span className="font-semibold">{selectedService.group.emoji} {selectedService.group.name} → {selectedService.name}</span>
              </div>
            )}
          </div>

          {/* Service Location - Premium Card */}
          <div className="bg-white/90 dark:bg-slate-900 backdrop-blur-sm rounded-2xl p-4 shadow-md dark:shadow-none border border-slate-200 dark:border-slate-800 hover:shadow-lg dark:hover:shadow-[0_12px_30px_rgba(0,0,0,0.35)] transition-all duration-300">
            <label className="text-base font-bold text-gray-900 dark:text-slate-100 mb-4 flex items-center gap-2.5">
              <div className="w-10 h-10 bg-gradient-to-br from-rose-500 to-pink-600 rounded-xl flex items-center justify-center shadow-lg shadow-rose-500/20">
                <MapPin className="w-5 h-5 text-white" />
              </div>
              Service Location <span className="text-red-500 ml-1">*</span>
            </label>
            <div className="mt-3 rounded-2xl overflow-hidden border-2 border-gray-100 dark:border-slate-800">
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
          <div className="bg-white/80 dark:bg-slate-900 backdrop-blur-sm rounded-[28px] p-6 shadow-xl shadow-black/5 dark:shadow-none border border-white/60 dark:border-slate-800 hover:shadow-2xl hover:shadow-emerald-500/10 transition-all duration-500 space-y-4">
            <h3 className="text-base font-bold text-gray-900 dark:text-slate-100 flex items-center gap-2.5">
              <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-xl flex items-center justify-center shadow-lg shadow-blue-500/20">
                <MapPin className="w-5 h-5 text-white" />
              </div>
              Complete Address
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-semibold text-gray-700 dark:text-slate-300 mb-2 block">Flat/House No. <span className="text-red-500">*</span></label>
                <Input
                  placeholder="e.g., A-101"
                  value={formData.flatNo}
                  onChange={(e) => setFormData(prev => ({ ...prev, flatNo: e.target.value }))}
                  className="h-12 text-base rounded-xl border-2 border-gray-200 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100 dark:placeholder:text-slate-500 focus:border-emerald-400 focus:ring-emerald-100 dark:focus:ring-emerald-900/40 transition-all"
                />
              </div>
              <div>
                <label className="text-sm font-semibold text-gray-700 dark:text-slate-300 mb-2 block">Floor</label>
                <Input
                  placeholder="e.g., 2nd"
                  value={formData.floor}
                  onChange={(e) => setFormData(prev => ({ ...prev, floor: e.target.value }))}
                  className="h-12 text-base rounded-xl border-2 border-gray-200 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100 dark:placeholder:text-slate-500 focus:border-emerald-400 focus:ring-emerald-100 dark:focus:ring-emerald-900/40 transition-all"
                />
              </div>
            </div>
            <div>
              <label className="text-sm font-semibold text-gray-700 dark:text-slate-300 mb-2 block">Landmark (optional)</label>
              <Input
                placeholder="e.g., Near SBI Bank"
                value={formData.landmark}
                onChange={(e) => setFormData(prev => ({ ...prev, landmark: e.target.value }))}
                className="h-12 text-base rounded-xl border-2 border-gray-200 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100 dark:placeholder:text-slate-500 focus:border-emerald-400 focus:ring-emerald-100 dark:focus:ring-emerald-900/40 transition-all"
              />
            </div>
            <div>
              <label className="text-sm font-semibold text-gray-700 dark:text-slate-300 mb-2 block flex items-center gap-2">
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
                className="h-12 text-base rounded-xl border-2 border-gray-200 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100 dark:placeholder:text-slate-500 focus:border-emerald-400 focus:ring-emerald-100 dark:focus:ring-emerald-900/40 transition-all"
              />
              {formData.mobileNumber && formData.mobileNumber.length < 10 && (
                <p className="text-xs text-orange-600 dark:text-orange-300 mt-1">Enter 10 digit mobile number</p>
              )}
            </div>
          </div>

          {/* Describe the Problem - Premium Card */}
          <div className="bg-white/90 dark:bg-slate-800/90 backdrop-blur-sm rounded-2xl p-4 shadow-md border border-slate-200 dark:border-slate-700 hover:shadow-lg transition-all duration-300">
            <label className="text-base font-bold text-gray-900 dark:text-white mb-4 flex items-center gap-2.5">
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
              className="text-base border-2 border-gray-200 dark:border-slate-600 dark:bg-slate-900 dark:text-white dark:placeholder:text-slate-400 focus:border-emerald-400 focus:ring-emerald-100 dark:focus:ring-emerald-900/40 rounded-2xl resize-none mt-3 p-4"
            />
          </div>

          {/* Additional Details - Premium Card */}
          <div className="bg-white/90 dark:bg-slate-800/90 backdrop-blur-sm rounded-2xl p-4 shadow-md border border-slate-200 dark:border-slate-700 hover:shadow-lg transition-all duration-300 space-y-4 relative z-10">
            <h3 className="text-base font-bold text-gray-900 dark:text-white flex items-center gap-2.5">
              <div className="w-10 h-10 bg-gradient-to-br from-cyan-500 to-blue-600 rounded-xl flex items-center justify-center shadow-lg shadow-cyan-500/20">
                <Lightbulb className="w-5 h-5 text-white" />
              </div>
              Additional Details
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-semibold text-gray-700 dark:text-slate-300 mb-2 block">Error Code (if any)</label>
                <Input
                  placeholder="E.g., E1, F03, NA"
                  value={formData.errorCode}
                  onChange={(e) => setFormData(prev => ({ ...prev, errorCode: e.target.value }))}
                  className="h-12 text-base rounded-xl border-2 border-gray-200 dark:border-slate-600 dark:bg-slate-900 dark:text-white dark:placeholder:text-slate-400 focus:border-emerald-400 focus:ring-emerald-100 dark:focus:ring-emerald-900/40 transition-all"
                />
              </div>
              <div>
                <label className="text-sm font-semibold text-gray-700 dark:text-slate-300 mb-2 block">How long?</label>
                <div className="relative">
                  <button
                    onClick={() => setShowHowLongDropdown(!showHowLongDropdown)}
                    className="w-full h-12 px-4 bg-white dark:bg-slate-900 border-2 border-gray-200 dark:border-slate-600 rounded-xl text-left flex items-center justify-between hover:border-emerald-400 dark:hover:border-emerald-500 transition-all"
                  >
                    <span className={`font-medium ${selectedHowLong ? 'text-gray-900 dark:text-white' : 'text-gray-400 dark:text-slate-400'}`}>
                      {selectedHowLong?.label || 'Select...'}
                    </span>
                    <ChevronDown className={`w-5 h-5 text-gray-400 dark:text-slate-400 transition-transform ${showHowLongDropdown ? 'rotate-180' : ''}`} />
                  </button>
                  {showHowLongDropdown && (
                    <div className="absolute bottom-full left-0 right-0 mb-2 bg-white/95 dark:bg-slate-800/95 backdrop-blur-xl border-2 border-gray-100 dark:border-slate-600 rounded-xl shadow-xl z-[100]">
                      {howLongOptions.map((opt) => (
                        <button
                          key={opt.id}
                          onClick={() => {
                            setFormData(prev => ({ ...prev, howLong: opt.id }))
                            setShowHowLongDropdown(false)
                          }}
                          className={`w-full p-3 text-left text-sm font-medium text-gray-800 dark:text-white hover:bg-emerald-50 dark:hover:bg-emerald-900/40 transition-colors first:rounded-t-xl last:rounded-b-xl ${
                            formData.howLong === opt.id ? 'bg-emerald-50 dark:bg-emerald-900/50 text-emerald-700 dark:text-emerald-400' : ''
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
              <label className="text-sm font-semibold text-gray-700 dark:text-slate-300 mb-2 block">Tried fixing yourself?</label>
              <Textarea
                placeholder="What you've tried, or type 'NA'"
                value={formData.triedFixing}
                onChange={(e) => setFormData(prev => ({ ...prev, triedFixing: e.target.value }))}
                rows={2}
                className="text-base border-2 border-gray-200 dark:border-slate-600 dark:bg-slate-900 dark:text-white dark:placeholder:text-slate-400 focus:border-emerald-400 focus:ring-emerald-100 dark:focus:ring-emerald-900/40 rounded-xl resize-none p-3"
              />
            </div>
          </div>

          {/* Urgency - Premium Card */}
          <div className="bg-white/90 dark:bg-slate-800/90 backdrop-blur-sm rounded-2xl p-4 shadow-md border border-slate-200 dark:border-slate-700 hover:shadow-lg transition-all duration-300 relative z-10">
            <label className="text-base font-bold text-gray-900 dark:text-white mb-4 flex items-center gap-2.5">
              <div className="w-10 h-10 bg-gradient-to-br from-emerald-500 to-teal-600 rounded-xl flex items-center justify-center shadow-lg shadow-emerald-500/20">
                <Clock className="w-5 h-5 text-white" />
              </div>
              When do you need help?
            </label>
            <div className="relative mt-3">
              <button
                onClick={() => setShowUrgencyDropdown(!showUrgencyDropdown)}
                className="w-full p-4 bg-gradient-to-r from-gray-50 to-white dark:from-slate-800 dark:to-slate-900 border-2 border-gray-200 dark:border-slate-600 rounded-2xl text-left flex items-center justify-between hover:border-emerald-400 dark:hover:border-emerald-500 hover:shadow-lg transition-all duration-300 group"
              >
                <span className={`text-base font-medium ${selectedUrgency ? 'text-gray-900 dark:text-white' : 'text-gray-400 dark:text-slate-400'}`}>
                  {selectedUrgency?.label || 'Select urgency...'}
                </span>
                <div className={`w-8 h-8 rounded-xl bg-gray-100 dark:bg-slate-700 group-hover:bg-emerald-100 dark:group-hover:bg-emerald-900/50 flex items-center justify-center transition-all ${showUrgencyDropdown ? 'rotate-180 bg-emerald-100 dark:bg-emerald-900/50' : ''}`}>
                  <ChevronDown className="w-5 h-5 text-gray-500 dark:text-slate-400 group-hover:text-emerald-600 dark:group-hover:text-emerald-400" />
                </div>
              </button>
              {showUrgencyDropdown && (
                <div className="absolute bottom-full left-0 right-0 mb-2 bg-white/95 dark:bg-slate-800/95 backdrop-blur-xl border-2 border-gray-100 dark:border-slate-600 rounded-2xl shadow-2xl z-[100] overflow-hidden">
                  {urgencyOptions.map((opt) => (
                    <button
                      key={opt.id}
                      onClick={() => {
                        setFormData(prev => ({ ...prev, urgency: opt.id }))
                        setShowUrgencyDropdown(false)
                      }}
                      className={`w-full p-4 text-left hover:bg-gradient-to-r hover:from-emerald-50 hover:to-teal-50 dark:hover:from-emerald-900/40 dark:hover:to-teal-900/40 transition-all ${
                        formData.urgency === opt.id ? 'bg-gradient-to-r from-emerald-50 to-teal-50 dark:from-emerald-900/50 dark:to-teal-900/50 text-emerald-700 dark:text-emerald-400 border-l-4 border-emerald-500' : ''
                      }`}
                    >
                      <div className="font-semibold text-base text-gray-900 dark:text-white">{opt.label}</div>
                      <div className="text-sm text-gray-500 dark:text-slate-400 mt-0.5">{opt.description}</div>
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
            <div className="flex items-center justify-center gap-2 p-3 bg-orange-50 dark:bg-orange-900/30 rounded-2xl border border-orange-200 dark:border-orange-800">
              <Camera className="w-4 h-4 text-orange-600 dark:text-orange-400" />
              <p className="text-sm font-medium text-orange-700 dark:text-orange-300">
                Upload {3 - images.length} more photo(s) to continue
              </p>
            </div>
          )}
        </div>
      )}

      {/* Step 2: Review - Premium Design */}
      {step === 2 && aiResult && (
        <div className="max-w-3xl mx-auto px-4 pt-4 pb-[140px] space-y-4 sm:space-y-5 relative min-h-screen">
          {/* AI Result - Premium Gradient Card */}
          <div className="relative overflow-hidden bg-gradient-to-br from-emerald-500 via-teal-500 to-cyan-500 rounded-[28px] p-5 sm:p-6 shadow-2xl shadow-emerald-500/25">
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
              
              <div className="bg-white/12 backdrop-blur-sm rounded-2xl p-5 mb-4 border border-white/15">
                <div className="text-4xl sm:text-5xl font-black text-white mb-1">
                  ₹<AnimatedCounter end={aiResult.estimatedPrice} duration={1500} />
                </div>
                <div className="flex items-center gap-4 text-white/80 text-sm mt-2 flex-wrap">
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
              
              <div className="flex items-center gap-2.5 flex-wrap">
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
            <div className="bg-white dark:bg-slate-900/90 rounded-2xl p-5 sm:p-6 shadow-md border border-slate-100 dark:border-slate-800">
              <h3 className="font-bold text-gray-900 dark:text-gray-100 text-lg mb-4 flex items-center gap-2">
                <div className="w-10 h-10 bg-gradient-to-br from-violet-500 to-purple-600 rounded-xl flex items-center justify-center shadow-lg shadow-violet-500/20">
                  <ClipboardList className="w-5 h-5 text-white" />
                </div>
                What Will Happen
              </h3>
              <p className="text-gray-800 dark:text-gray-200 leading-relaxed bg-gradient-to-r from-violet-50 to-purple-50 dark:from-violet-900/30 dark:to-purple-900/30 p-4 rounded-xl border border-violet-100 dark:border-violet-800">
                {aiResult.workOverview}
              </p>
            </div>
          )}

          {/* Helper Brings & Customer Provides */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Helper Brings */}
            {aiResult.helperBrings && aiResult.helperBrings.length > 0 && (
              <div className="bg-white dark:bg-slate-900/90 rounded-2xl p-5 shadow-md border border-slate-100 dark:border-slate-800">
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
              <div className="bg-white dark:bg-slate-900/90 rounded-2xl p-5 shadow-md border border-slate-100 dark:border-slate-800">
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
            <div className="bg-white dark:bg-slate-900/90 rounded-2xl p-5 shadow-md border border-slate-100 dark:border-slate-800">
              <h4 className="font-bold text-gray-900 dark:text-gray-100 mb-3 flex items-center gap-2">
                <div className="w-8 h-8 bg-gradient-to-br from-amber-500 to-orange-600 rounded-lg flex items-center justify-center">
                  <Package className="w-4 h-4 text-white" />
                </div>
                Materials That May Be Needed
              </h4>
              <div className="flex flex-wrap gap-2">
                {aiResult.materialsNeeded.map((item, idx) => (
                  <span key={idx} className="px-3 py-1.5 bg-amber-50 dark:bg-amber-900/30 text-amber-700 dark:text-amber-200 rounded-full text-sm font-medium border border-amber-200 dark:border-amber-700">
                    {item}
                  </span>
                ))}
              </div>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-3">* Additional materials cost will be informed before purchase</p>
            </div>
          )}

          {/* Summary - Premium Card */}
          <div className="bg-white dark:bg-slate-900/90 rounded-2xl p-5 sm:p-6 shadow-md border border-slate-100 dark:border-slate-800">
            <h3 className="font-bold text-gray-900 text-lg mb-4 flex items-center gap-2">
              <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-xl flex items-center justify-center shadow-lg shadow-blue-500/20">
                <FileCheck className="w-5 h-5 text-white" />
              </div>
              Request Summary
            </h3>
            
            <div className="space-y-3">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-1.5 sm:gap-2 p-3 bg-gray-50 dark:bg-slate-800 rounded-xl border border-gray-100 dark:border-slate-700">
                <span className="text-gray-500 dark:text-gray-400 font-medium">Service</span>
                <span className="font-semibold text-gray-900 dark:text-gray-100 break-words sm:text-right">
                  {selectedService
                    ? `${selectedService.group.emoji} ${selectedService.group.name} → ${selectedService.name}`
                    : aiResult.categoryName}
                </span>
              </div>
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-1.5 sm:gap-2 p-3 bg-gray-50 dark:bg-slate-800 rounded-xl border border-gray-100 dark:border-slate-700">
                <span className="text-gray-500 dark:text-gray-400 font-medium">Location</span>
                <span className="font-semibold text-gray-900 dark:text-gray-100 break-words sm:text-right">{formData.flatNo}, {formData.location.split(',')[0]}</span>
              </div>
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-1.5 sm:gap-2 p-3 bg-gray-50 dark:bg-slate-800 rounded-xl border border-gray-100 dark:border-slate-700">
                <span className="text-gray-500 dark:text-gray-400 font-medium">Urgency</span>
                <span className={`font-semibold px-3 py-1 rounded-full text-sm ${
                  formData.urgency === 'emergency' ? 'bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-200' :
                  formData.urgency === 'urgent' ? 'bg-orange-100 text-orange-700 dark:bg-orange-900/40 dark:text-orange-200' :
                  'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-200'
                }`}>{selectedUrgency?.label}</span>
              </div>
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-1.5 sm:gap-2 p-3 bg-gray-50 dark:bg-slate-800 rounded-xl border border-gray-100 dark:border-slate-700">
                <span className="text-gray-500 dark:text-gray-400 font-medium">Mobile</span>
                <span className="font-semibold text-gray-900 dark:text-gray-100 flex items-center gap-2 sm:justify-end">
                  <Phone className="w-4 h-4 text-emerald-600" />
                  +91 {formData.mobileNumber}
                </span>
              </div>
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-1.5 sm:gap-2 p-3 bg-gray-50 dark:bg-slate-800 rounded-xl border border-gray-100 dark:border-slate-700">
                <span className="text-gray-500 dark:text-gray-400 font-medium">Media</span>
                <div className="flex gap-2 sm:justify-end">
                  <span className="font-semibold text-emerald-700 dark:text-emerald-200 bg-emerald-50 dark:bg-emerald-900/30 px-3 py-1 rounded-full text-sm flex items-center gap-1">
                    <Camera className="w-3.5 h-3.5" /> {images.length}
                  </span>
                  <span className="font-semibold text-purple-700 dark:text-purple-200 bg-purple-50 dark:bg-purple-900/30 px-3 py-1 rounded-full text-sm flex items-center gap-1">
                    <Video className="w-3.5 h-3.5" /> {videos.length}
                  </span>
                </div>
              </div>
            </div>

            <div className="mt-4 pt-4 border-t border-gray-100 dark:border-slate-800">
              <p className="text-sm font-semibold text-gray-500 dark:text-gray-400 mb-2">Problem Description</p>
              <p className="text-gray-800 dark:text-gray-200 bg-gradient-to-r from-gray-50 to-white dark:from-slate-800 dark:to-slate-900 p-4 rounded-xl border border-gray-100 dark:border-slate-800">{formData.description}</p>
            </div>
          </div>

          {/* Trust badges - Premium Style */}
          <div className="flex items-center justify-center gap-3 sm:gap-4 py-2 flex-wrap">
            <div className="flex items-center gap-2 px-4 py-2 bg-emerald-50 dark:bg-emerald-900/30 rounded-xl border border-emerald-200 dark:border-emerald-800">
              <Shield className="w-5 h-5 text-emerald-600 dark:text-emerald-300" />
              <span className="text-sm font-semibold text-emerald-700 dark:text-emerald-200">Verified Helpers</span>
            </div>
            <div className="flex items-center gap-2 px-4 py-2 bg-blue-50 dark:bg-blue-900/30 rounded-xl border border-blue-200 dark:border-blue-800">
              <CheckCircle2 className="w-5 h-5 text-blue-600 dark:text-blue-300" />
              <span className="text-sm font-semibold text-blue-700 dark:text-blue-200">Money-back Guarantee</span>
            </div>
          </div>

            {/* Spacer for sticky CTA */}
            <div className="h-6" />

            {/* Sticky bottom CTA */}
            <div className="fixed bottom-0 left-0 right-0 z-40 px-4 pb-[calc(12px+env(safe-area-inset-bottom))] pt-2.5 bg-white/95 dark:bg-slate-950/90 backdrop-blur-2xl border-t border-gray-200/80 dark:border-slate-800/80 shadow-[0_-8px_24px_-12px_rgba(0,0,0,0.25)]">
              <div className="max-w-3xl mx-auto space-y-2">
                <Button
                  onClick={handleSubmit}
                  disabled={loading}
                  className="w-full h-12 bg-gradient-to-r from-emerald-500 via-teal-500 to-cyan-500 hover:from-emerald-600 hover:via-teal-600 hover:to-cyan-600 text-white font-bold rounded-xl shadow-lg shadow-emerald-500/25 hover:shadow-xl hover:shadow-emerald-500/35 transition-all duration-300 disabled:opacity-70"
                >
                  {loading ? (
                    <>
                      <div className="w-5 h-5 mr-2 border-2 border-white/40 border-t-white rounded-full animate-spin" />
                      Posting...
                    </>
                  ) : (
                    <>
                      <Send className="w-4 h-4 mr-2" />
                      Confirm & Post – ₹{aiResult.estimatedPrice}
                    </>
                  )}
                </Button>
                <button
                  onClick={handleCustomPriceFlow}
                  className="w-full text-center text-sm font-medium text-emerald-700 dark:text-emerald-300 hover:text-emerald-800 dark:hover:text-emerald-200 py-1"
                >
                  Or decide your own price
                </button>
              </div>
            </div>
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
                <div className="text-sm text-gray-500">Service</div>
                <div className="text-xl font-bold text-gray-900">
                  {selectedService
                    ? `${selectedService.group.emoji} ${selectedService.name}`
                    : aiResult.categoryName}
                </div>
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
