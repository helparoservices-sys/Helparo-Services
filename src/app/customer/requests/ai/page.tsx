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
  Sparkles
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

export default function AIRequestPage() {
  const router = useRouter()
  const [step, setStep] = useState<'upload' | 'analysis' | 'review'>('upload')
  const [images, setImages] = useState<string[]>([])
  const [description, setDescription] = useState('')
  const [categoryId, setCategoryId] = useState('')
  const [analyzing, setAnalyzing] = useState(false)
  const [aiAnalysis, setAiAnalysis] = useState<AIAnalysis | null>(null)
  const [adjustedPrice, setAdjustedPrice] = useState<number>(0)

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files
    if (!files) return

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

  const analyzeWithAI = async () => {
    if (images.length === 0) {
      toast.error('Please upload at least one image')
      return
    }
    if (!description.trim()) {
      toast.error('Please describe the problem')
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
          categoryId: '10000000-0000-0000-0000-000000000015', // AC Repair for now
          location: 'Visakhapatnam, Andhra Pradesh',
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'AI analysis failed')
      }

      setAiAnalysis(data.analysis)
      setAdjustedPrice(data.analysis.estimatedPrice)
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
      case 'low': return 'bg-green-100 text-green-700'
      case 'medium': return 'bg-yellow-100 text-yellow-700'
      case 'high': return 'bg-orange-100 text-orange-700'
      case 'critical': return 'bg-red-100 text-red-700'
      default: return 'bg-gray-100 text-gray-700'
    }
  }

  const getUrgencyColor = (urgency: string) => {
    switch (urgency) {
      case 'normal': return 'bg-blue-100 text-blue-700'
      case 'urgent': return 'bg-orange-100 text-orange-700'
      case 'emergency': return 'bg-red-100 text-red-700'
      default: return 'bg-gray-100 text-gray-700'
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
              Upload Problem Photos & Description
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Image Upload */}
            <div>
              <Label>Upload Photos (Max 5)</Label>
              <div className="mt-2 border-2 border-dashed border-gray-300 rounded-lg p-8 text-center hover:border-teal-500 transition-colors">
                <input
                  type="file"
                  accept="image/*"
                  multiple
                  onChange={handleImageUpload}
                  className="hidden"
                  id="image-upload"
                />
                <label htmlFor="image-upload" className="cursor-pointer">
                  <Upload className="h-12 w-12 mx-auto text-gray-400 mb-3" />
                  <p className="text-sm font-medium text-gray-700">Click to upload photos</p>
                  <p className="text-xs text-gray-500 mt-1">PNG, JPG up to 5 images</p>
                </label>
              </div>

              {/* Image Preview */}
              {images.length > 0 && (
                <div className="mt-4 grid grid-cols-5 gap-2">
                  {images.map((img, idx) => (
                    <div key={idx} className="relative">
                      <img 
                        src={img} 
                        alt={`Upload ${idx + 1}`}
                        className="w-full h-24 object-cover rounded-lg border-2 border-gray-200"
                      />
                      <button
                        onClick={() => setImages(images.filter((_, i) => i !== idx))}
                        className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full w-6 h-6 flex items-center justify-center text-xs"
                      >
                        ×
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Description */}
            <div>
              <Label htmlFor="description">Describe the Problem</Label>
              <Textarea
                id="description"
                placeholder="E.g., AC is not cooling properly, making loud noise, and water is leaking from the indoor unit..."
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={5}
                className="mt-2"
              />
              <p className="text-xs text-gray-500 mt-1">
                Be specific about the issue, when it started, and any symptoms
              </p>
            </div>

            {/* Analyze Button */}
            <Button
              onClick={analyzeWithAI}
              disabled={analyzing || images.length === 0 || !description.trim()}
              className="w-full bg-gradient-to-r from-purple-600 to-teal-600 hover:from-purple-700 hover:to-teal-700"
              size="lg"
            >
              {analyzing ? (
                <>
                  <Loader2 className="h-5 w-5 mr-2 animate-spin" />
                  Analyzing with AI...
                </>
              ) : (
                <>
                  <Sparkles className="h-5 w-5 mr-2" />
                  Analyze with AI
                </>
              )}
            </Button>
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

            {/* Adjust Price */}
            <div>
              <Label htmlFor="adjustedPrice">Adjust Your Budget (Optional)</Label>
              <div className="mt-2 flex items-center gap-4">
                <Input
                  id="adjustedPrice"
                  type="number"
                  value={adjustedPrice}
                  onChange={(e) => setAdjustedPrice(Number(e.target.value))}
                  className="w-48"
                />
                <span className="text-sm text-gray-500">
                  AI suggested: ₹{aiAnalysis.estimatedPrice}
                </span>
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
                className="flex-1 bg-gradient-to-r from-purple-600 to-teal-600 hover:from-purple-700 hover:to-teal-700"
              >
                <CheckCircle2 className="h-5 w-5 mr-2" />
                Broadcast to All Helpers
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
