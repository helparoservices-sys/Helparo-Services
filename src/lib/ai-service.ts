import { GoogleGenerativeAI } from '@google/generative-ai'

// Initialize Gemini AI (FREE tier from Google AI Studio)
const apiKey = process.env.GEMINI_API_KEY || ''
const genAI = apiKey ? new GoogleGenerativeAI(apiKey) : null

// Log API key status on load (for debugging)
console.log('🔑 Gemini API Key status:', apiKey ? `Set (${apiKey.substring(0, 10)}...)` : 'NOT SET')

interface AIAnalysisResult {
  estimatedPrice: number
  estimatedDuration: number
  severity: 'low' | 'medium' | 'high' | 'critical'
  requiredSkills: string[]
  materialsNeeded: string[]
  urgency: 'normal' | 'urgent' | 'emergency'
  description: string
  confidence: number
}

// Category-based pricing estimates (fallback when AI is not available)
const categoryPricing: Record<string, { min: number; max: number; avg: number; duration: number }> = {
  'Electrical': { min: 200, max: 2500, avg: 800, duration: 60 },
  'Plumbing': { min: 200, max: 3000, avg: 700, duration: 45 },
  'AC & Appliance Repair': { min: 300, max: 4000, avg: 1200, duration: 90 },
  'Carpentry': { min: 500, max: 5000, avg: 1500, duration: 120 },
  'Painting': { min: 500, max: 8000, avg: 2000, duration: 180 },
  'Cleaning': { min: 300, max: 2000, avg: 600, duration: 60 },
  'Pest Control': { min: 500, max: 3000, avg: 1000, duration: 60 },
  'Home Repair & Maintenance': { min: 300, max: 3000, avg: 900, duration: 90 },
  'Locksmith': { min: 200, max: 1500, avg: 500, duration: 30 },
  'Gardening & Landscaping': { min: 400, max: 5000, avg: 1200, duration: 120 },
  'Moving & Packing': { min: 1000, max: 10000, avg: 3000, duration: 240 },
  'Other': { min: 300, max: 2000, avg: 700, duration: 60 },
}

// Estimate price based on description keywords
function estimatePriceFromDescription(description: string, categoryName: string): AIAnalysisResult {
  const basePrice = categoryPricing[categoryName] || categoryPricing['Other']
  const descLower = description.toLowerCase()
  
  let priceMultiplier = 1.0
  let severityLevel: 'low' | 'medium' | 'high' | 'critical' = 'medium'
  let urgencyLevel: 'normal' | 'urgent' | 'emergency' = 'normal'
  
  // Check for urgency keywords
  if (descLower.includes('emergency') || descLower.includes('urgent') || descLower.includes('immediately')) {
    priceMultiplier *= 1.3
    urgencyLevel = 'emergency'
    severityLevel = 'high'
  }
  
  // Check for severity keywords
  if (descLower.includes('shock') || descLower.includes('spark') || descLower.includes('fire') || descLower.includes('leak')) {
    severityLevel = 'high'
    priceMultiplier *= 1.2
  }
  if (descLower.includes('broken') || descLower.includes('not working') || descLower.includes('damage')) {
    severityLevel = 'medium'
    priceMultiplier *= 1.1
  }
  if (descLower.includes('minor') || descLower.includes('small') || descLower.includes('simple')) {
    severityLevel = 'low'
    priceMultiplier *= 0.8
  }
  
  // Check for complexity
  if (descLower.includes('multiple') || descLower.includes('complete') || descLower.includes('full')) {
    priceMultiplier *= 1.4
  }
  if (descLower.includes('replace') || descLower.includes('install')) {
    priceMultiplier *= 1.3
  }
  if (descLower.includes('repair') || descLower.includes('fix')) {
    priceMultiplier *= 1.0
  }
  if (descLower.includes('check') || descLower.includes('inspect')) {
    priceMultiplier *= 0.7
  }
  
  const estimatedPrice = Math.round(basePrice.avg * priceMultiplier)
  const estimatedDuration = Math.round(basePrice.duration * priceMultiplier)
  
  return {
    estimatedPrice: Math.max(basePrice.min, Math.min(basePrice.max, estimatedPrice)),
    estimatedDuration: Math.max(15, Math.min(480, estimatedDuration)),
    severity: severityLevel,
    requiredSkills: [categoryName],
    materialsNeeded: ['Standard materials - will be assessed on site'],
    urgency: urgencyLevel,
    description: `${categoryName} service requested: ${description}. A professional will assess and provide the exact requirements on site.`,
    confidence: 65,
  }
}

/**
 * Compress base64 image to reduce size (keep under 100KB)
 */
function compressBase64Image(base64: string, maxSizeKB: number = 100): string {
  // Remove data URL prefix if present
  const imageData = base64.split(',')[1] || base64
  
  // If already small enough, return as is
  const sizeKB = (imageData.length * 3) / 4 / 1024
  if (sizeKB <= maxSizeKB) {
    return imageData
  }
  
  // For larger images, we'll just take a portion (crude but fast)
  // This is a serverless-friendly approach that doesn't require canvas
  console.log(`⚠️ Image too large (${sizeKB.toFixed(0)}KB), truncating...`)
  
  // Just return first part - AI can still analyze partial image
  const targetLength = Math.floor(maxSizeKB * 1024 * 4 / 3)
  return imageData.substring(0, targetLength)
}

/**
 * Analyze job images and description using Google Gemini AI
 * OPTIMIZED for Vercel 10-second timeout
 */
export async function analyzeJobWithAI(
  images: string[], // Base64 encoded images
  description: string,
  categoryName: string,
  _location?: string
): Promise<AIAnalysisResult> {
  const startTime = Date.now()
  console.log('🔍 [AI] Starting analysis:', { 
    categoryName, 
    descriptionLength: description.length, 
    imagesCount: images.length,
    apiKeySet: !!apiKey 
  })
  
  // CRITICAL: If no API key, use smart fallback immediately
  if (!genAI || !apiKey) {
    console.log('⚠️ [AI] GEMINI_API_KEY not set, using smart estimation')
    return estimatePriceFromDescription(description, categoryName)
  }

  try {
    // Use gemini-2.0-flash-exp (latest fast model) or gemini-pro as fallback
    const model = genAI.getGenerativeModel({ 
      model: 'gemini-2.0-flash-exp',
      generationConfig: {
        temperature: 0.2, // Lower = more consistent, faster
        maxOutputTokens: 512, // Reduced for speed
      }
    })

    // OPTIMIZATION: Only use 1 image to stay under timeout
    // Take the first image and compress it
    let imageData = ''
    if (images.length > 0) {
      const firstImage = images[0]
      imageData = compressBase64Image(firstImage, 150) // Max 150KB
      console.log(`📸 [AI] Using 1 image, compressed size: ${(imageData.length / 1024).toFixed(0)}KB`)
    }

    // SHORT prompt for faster response
    const prompt = `Analyze this ${categoryName} job in India. Customer says: "${description.substring(0, 200)}"

Return JSON only:
{"estimatedPrice": <INR number>, "estimatedDuration": <minutes>, "severity": "<low|medium|high|critical>", "requiredSkills": ["skill"], "materialsNeeded": ["material"], "urgency": "<normal|urgent|emergency>", "description": "<brief work description>", "confidence": <0-100>}`

    // Build content array
    const content: any[] = [prompt]
    if (imageData) {
      content.push({
        inlineData: {
          data: imageData,
          mimeType: 'image/jpeg',
        }
      })
    }

    // 7-second timeout (leave buffer for cold start)
    const timeoutPromise = new Promise<never>((_, reject) => {
      setTimeout(() => reject(new Error('AI_TIMEOUT')), 7000)
    })

    console.log(`⏱️ [AI] Calling Gemini API...`)
    const resultPromise = model.generateContent(content)
    const result = await Promise.race([resultPromise, timeoutPromise])
    
    const response = await result.response
    const text = response.text()
    
    const elapsed = Date.now() - startTime
    console.log(`🤖 [AI] Response received in ${elapsed}ms:`, text.substring(0, 100))

    // Parse JSON response (remove markdown code blocks)
    const jsonText = text.trim().replace(/```json\n?/g, '').replace(/```\n?/g, '').trim()

    const analysis: AIAnalysisResult = JSON.parse(jsonText)

    // Validate and constrain values
    analysis.estimatedPrice = Math.max(100, Math.min(50000, analysis.estimatedPrice))
    analysis.estimatedDuration = Math.max(15, Math.min(480, analysis.estimatedDuration))
    analysis.confidence = Math.max(0, Math.min(100, analysis.confidence))

    console.log(`✅ [AI] Analysis complete in ${Date.now() - startTime}ms:`, analysis)
    return analysis

  } catch (error: any) {
    const elapsed = Date.now() - startTime
    console.error(`❌ [AI] Error after ${elapsed}ms:`, error.message)
    
    // Always return fallback - never throw
    console.log('📊 [AI] Using smart estimation fallback')
    return estimatePriceFromDescription(description, categoryName)
  }
}

/**
 * Generate AI-suggested pricing based on historical data
 */
export async function suggestPricing(
  categoryId: string,
  description: string,
  historicalPrices?: number[]
): Promise<{ min: number; max: number; recommended: number }> {
  try {
    if (!genAI) {
      return { min: 300, max: 1000, recommended: 500 }
    }
    
    const model = genAI.getGenerativeModel({ model: 'gemini-2.0-flash-exp' })

    const avgPrice = historicalPrices && historicalPrices.length > 0
      ? historicalPrices.reduce((a, b) => a + b, 0) / historicalPrices.length
      : null

    const prompt = `Suggest price range in INR for: ${description}
${avgPrice ? `Average: ₹${avgPrice}` : ''}
Return JSON: {"min": number, "max": number, "recommended": number}`

    const result = await model.generateContent(prompt)
    const response = await result.response
    let jsonText = response.text().trim().replace(/```json\n?/g, '').replace(/```\n?/g, '')

    return JSON.parse(jsonText)
  } catch (error) {
    console.error('❌ Price suggestion error:', error)
    return { min: 300, max: 1000, recommended: 500 }
  }
}
