'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
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
  Image as ImageIcon
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
  const [analyzing, setAnalyzing] = useState(false)
  const [aiAnalysis, setAiAnalysis] = useState<AIAnalysis | null>(null)
  const [selectedTier, setSelectedTier] = useState<PriceTier>('standard')

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
    if (images.length < 3) {
      toast.error('Please upload at least 3 images (minimum required)')
      return
    }
    if (!description.trim()) {
      toast.error('Please describe the problem in detail')
      return
    }

    setAnalyzing(true)
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
          categoryId: '10000000-0000-0000-0000-000000000015', // AC Repair for now
          location: 'Visakhapatnam, Andhra Pradesh',
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'AI analysis failed')
      }

      setAiAnalysis(data.analysis)
      setStep('analysis')
      toast.success('AI analysis completed!')
    } catch (error: any) {
      console.error('AI analysis error:', error)
      toast.error(error.message || 'Failed to analyze images')
    } finally {
      setAnalyzing(false)
    }
  }

  const broadcastToHelpers = async () => {
    // This will notify all helpers who match the required skills
    toast.success('Request broadcast to all qualified helpers!')
    
    // Here you would create the service request with AI analysis
    // and send notifications to all matching helpers
    
    setTimeout(() => {
      router.push('/customer/requests')
    }, 2000)
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
        <div className="p-3 bg-gradient-to-br from-purple-500 to-teal-500 rounded-lg">
          <Brain className="h-6 w-6 text-white" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">AI-Powered Service Request</h1>
          <p className="text-gray-600">Upload photos, get instant pricing, notify all helpers</p>
        </div>
      </div>

      {/* Progress Steps */}
      <div className="flex items-center justify-center gap-4">
        <div className={`flex items-center gap-2 ${step === 'upload' ? 'text-teal-600' : 'text-gray-400'}`}>
          <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
            step === 'upload' ? 'bg-teal-600 text-white' : 'bg-gray-200'
          }`}>1</div>
          <span className="font-medium">Upload</span>
        </div>
        <div className="w-16 h-1 bg-gray-200" />
        <div className={`flex items-center gap-2 ${step === 'analysis' ? 'text-teal-600' : 'text-gray-400'}`}>
          <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
            step === 'analysis' ? 'bg-teal-600 text-white' : 'bg-gray-200'
          }`}>2</div>
          <span className="font-medium">AI Analysis</span>
        </div>
        <div className="w-16 h-1 bg-gray-200" />
        <div className={`flex items-center gap-2 ${step === 'review' ? 'text-teal-600' : 'text-gray-400'}`}>
          <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
            step === 'review' ? 'bg-teal-600 text-white' : 'bg-gray-200'
          }`}>3</div>
          <span className="font-medium">Broadcast</span>
        </div>
      </div>

      {/* Step 1: Upload */}
      {step === 'upload' && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Upload className="h-5 w-5" />
              Upload Problem Details
            </CardTitle>
            <p className="text-sm text-gray-600 mt-2">
              Provide detailed information for accurate AI pricing
            </p>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Image Upload */}
            <div>
              <Label className="text-base font-semibold">
                Photos * <span className="text-sm font-normal text-gray-500">(3-5 images required)</span>
              </Label>
              <div className="mt-2 border-2 border-dashed border-gray-300 rounded-lg p-8 text-center hover:border-teal-500 transition-colors">
                <input
                  type="file"
                  accept="image/*"
                  multiple
                  onChange={handleImageUpload}
                  className="hidden"
                  id="image-upload"
                  disabled={images.length >= 5}
                />
                <label htmlFor="image-upload" className={`cursor-pointer ${images.length >= 5 ? 'opacity-50 cursor-not-allowed' : ''}`}>
                  <ImageIcon className="h-12 w-12 mx-auto text-gray-400 mb-3" />
                  <p className="text-sm font-medium text-gray-700">
                    {images.length === 0 ? 'Click to upload photos' : `${images.length}/5 photos uploaded`}
                  </p>
                  <p className="text-xs text-gray-500 mt-1">
                    Clear photos help AI provide accurate pricing
                  </p>
                </label>
              </div>

              {/* Image Preview */}
              {images.length > 0 && (
                <div className="mt-4 grid grid-cols-5 gap-2">
                  {images.map((img, idx) => (
                    <div key={idx} className="relative group">
                      <img 
                        src={img} 
                        alt={`Upload ${idx + 1}`}
                        className="w-full h-24 object-cover rounded-lg border-2 border-gray-200"
                      />
                      <button
                        onClick={() => removeImage(idx)}
                        className="absolute -top-2 -right-2 bg-red-500 hover:bg-red-600 text-white rounded-full w-6 h-6 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                        type="button"
                      >
                        <X className="h-4 w-4" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Description */}
            <div>
              <Label htmlFor="description" className="text-base font-semibold">
                Problem Description *
              </Label>
              <Textarea
                id="description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Describe the issue in detail... (e.g., AC not cooling, water leaking, strange noise)"
                className="mt-2 min-h-[120px]"
                required
              />
              <p className="text-xs text-gray-500 mt-1">
                Be specific about symptoms, when it started, and what you've noticed
              </p>
            </div>

            {/* Error Code */}
            <div>
              <Label htmlFor="errorCode" className="text-base font-semibold">
                Error Code (if any)
              </Label>
              <Input
                id="errorCode"
                value={errorCode}
                onChange={(e) => setErrorCode(e.target.value)}
                placeholder="E.g., E1, F03, or type 'N/A' if none"
                className="mt-2"
              />
              <p className="text-xs text-gray-500 mt-1">
                Check your device display for error codes
              </p>
            </div>

            {/* Problem Duration */}
            <div>
              <Label htmlFor="problemDuration" className="text-base font-semibold">
                How long has this problem existed?
              </Label>
              <select
                id="problemDuration"
                value={problemDuration}
                onChange={(e) => setProblemDuration(e.target.value)}
                className="mt-2 w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent"
              >
                <option value="">Select duration</option>
                <option value="just_now">Just started (today)</option>
                <option value="few_days">Few days ago</option>
                <option value="week">About a week</option>
                <option value="weeks">Few weeks</option>
                <option value="month_plus">More than a month</option>
              </select>
            </div>

            {/* Previous Attempts */}
            <div>
              <Label htmlFor="previousAttempts" className="text-base font-semibold">
                Have you tried fixing it yourself?
              </Label>
              <Textarea
                id="previousAttempts"
                value={previousAttempts}
                onChange={(e) => setPreviousAttempts(e.target.value)}
                placeholder="Describe what you've tried (e.g., restarted device, checked connections, cleaned filters) or type 'N/A'"
                className="mt-2"
                rows={3}
              />
            </div>

            {/* Preferred Time */}
            <div>
              <Label htmlFor="preferredTime" className="text-base font-semibold">
                When do you need help?
              </Label>
              <select
                id="preferredTime"
                value={preferredTime}
                onChange={(e) => setPreferredTime(e.target.value)}
                className="mt-2 w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent"
              >
                <option value="">Select urgency</option>
                <option value="asap">As soon as possible (Emergency)</option>
                <option value="today">Within today</option>
                <option value="tomorrow">Tomorrow</option>
                <option value="this_week">This week</option>
                <option value="flexible">Flexible timing</option>
              </select>
            </div>

            <Button
              onClick={analyzeWithAI}
              disabled={analyzing || images.length < 3 || !description.trim()}
              className="w-full bg-gradient-to-r from-purple-600 to-teal-600 hover:from-purple-700 hover:to-teal-700 text-white py-6 text-lg"
            >
              {analyzing ? (
                <>
                  <Loader2 className="h-5 w-5 mr-2 animate-spin" />
                  AI is analyzing...
                </>
              ) : (
                <>
                  <Sparkles className="h-5 w-5 mr-2" />
                  Analyze with AI
                </>
              )}
            </Button>

            {images.length < 3 && (
              <p className="text-center text-sm text-amber-600">
                ⚠️ Please upload at least 3 photos for accurate AI analysis
              </p>
            )}
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
              >
                Back to Edit
              </Button>
              <Button
                onClick={broadcastToHelpers}
                className="flex-1 bg-gradient-to-r from-purple-600 to-teal-600 hover:from-purple-700 hover:to-teal-700 text-lg py-6"
              >
                <Sparkles className="h-5 w-5 mr-2" />
                Broadcast to All Helpers (₹{getPriceForTier(aiAnalysis.estimatedPrice, selectedTier)})
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
