import { GoogleGenerativeAI } from '@google/generative-ai'

// Initialize Gemini AI
const apiKey = process.env.GEMINI_API_KEY || ''
const genAI = apiKey ? new GoogleGenerativeAI(apiKey) : null

// Track API calls for rate limiting
let lastApiCall = 0
const MIN_API_INTERVAL = 1000 // 1 second between calls

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
 * Analyze job images and description using Google Gemini AI
 */
export async function analyzeJobWithAI(
  images: string[], // Base64 encoded images
  description: string,
  categoryName: string,
  location?: string
): Promise<AIAnalysisResult> {
  console.log('🔍 analyzeJobWithAI called with:', { categoryName, descriptionLength: description.length, imagesCount: images.length })
  
  // If no API key, use smart fallback estimation
  if (!genAI || !apiKey) {
    console.log('⚠️ GEMINI_API_KEY not set, using smart estimation')
    return estimatePriceFromDescription(description, categoryName)
  }

  // Rate limiting check
  const now = Date.now()
  const timeSinceLastCall = now - lastApiCall
  if (timeSinceLastCall < MIN_API_INTERVAL) {
    console.log(`⏳ Rate limiting: waiting ${MIN_API_INTERVAL - timeSinceLastCall}ms`)
    await new Promise(resolve => setTimeout(resolve, MIN_API_INTERVAL - timeSinceLastCall))
  }
  lastApiCall = Date.now()

  // Retry logic
  const maxRetries = 2
  let lastError: Error | null = null

  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      if (attempt > 0) {
        console.log(`🔄 Retry attempt ${attempt}/${maxRetries}`)
        await new Promise(resolve => setTimeout(resolve, 1000 * attempt)) // Exponential backoff
      }

      const model = genAI.getGenerativeModel({ 
        model: 'gemini-1.5-flash', // More stable than gemini-2.0-flash-exp
        generationConfig: {
          temperature: 0.3, // Lower temperature for more consistent results
          maxOutputTokens: 1024,
        }
      })

      // Limit to first 2 images to reduce payload size
      const limitedImages = images.slice(0, 2)
      
      // Prepare image parts for Gemini with size check
      const imageParts = limitedImages.map((base64Image) => {
        let imageData = base64Image.split(',')[1] || base64Image
        
        // If image is too large (> 1MB base64 ~ 750KB actual), skip it
        if (imageData.length > 1000000) {
          console.log('⚠️ Image too large, skipping')
          return null
        }
        
        return {
          inlineData: {
            data: imageData,
            mimeType: 'image/jpeg',
          },
        }
      }).filter(Boolean)

      // If no valid images, use fallback
      if (imageParts.length === 0) {
        console.log('⚠️ No valid images for AI, using smart estimation')
        return estimatePriceFromDescription(description, categoryName)
      }

      // Create comprehensive prompt for job analysis
      const prompt = `You are an expert in home services and repair estimation. Analyze the following job request:

**Service Category:** ${categoryName}
**Customer Description:** ${description}
**Location:** ${location || 'Not specified'}

Based on the images and description provided, analyze and provide:

1. **Estimated Price (in INR):** Provide a fair market price considering:
   - Labor costs in India
   - Material costs
   - Complexity of work
   - Time required
   
2. **Estimated Duration (in minutes):** How long will this job take?

3. **Severity Level:** Rate as low/medium/high/critical

4. **Required Skills:** List specific skills needed (e.g., "AC servicing", "electrical wiring", "plumbing")

5. **Materials Needed:** List materials/parts required

6. **Urgency:** Classify as normal/urgent/emergency

7. **Detailed Description:** Professional description of the work needed

8. **Confidence Level:** Your confidence in this estimate (0-100%)

**IMPORTANT:** 
- Prices should be realistic for Indian market
- Consider both urban and semi-urban pricing
- Include buffer for materials if not clearly visible
- Be conservative with estimates

**Response Format (JSON only):**
{
  "estimatedPrice": <number in INR>,
  "estimatedDuration": <number in minutes>,
  "severity": "<low|medium|high|critical>",
  "requiredSkills": ["skill1", "skill2"],
  "materialsNeeded": ["material1", "material2"],
  "urgency": "<normal|urgent|emergency>",
  "description": "<detailed professional description>",
  "confidence": <0-100>
}

Respond with ONLY valid JSON, no additional text.`

      // Generate content with images - add timeout
      const timeoutPromise = new Promise<never>((_, reject) => {
        setTimeout(() => reject(new Error('AI request timeout')), 25000) // 25 second timeout
      })

      const resultPromise = model.generateContent([prompt, ...imageParts])
      const result = await Promise.race([resultPromise, timeoutPromise])
      
      const response = await result.response
      const text = response.text()

      console.log('🤖 AI Raw Response:', text.substring(0, 200) + '...')

      // Parse JSON response
      let jsonText = text.trim()
      
      // Remove markdown code blocks if present
      if (jsonText.startsWith('```json')) {
        jsonText = jsonText.replace(/```json\n?/g, '').replace(/```\n?/g, '')
      } else if (jsonText.startsWith('```')) {
        jsonText = jsonText.replace(/```\n?/g, '')
      }

      const analysis: AIAnalysisResult = JSON.parse(jsonText)

      // Validate and apply constraints
      analysis.estimatedPrice = Math.max(100, Math.min(50000, analysis.estimatedPrice)) // Min ₹100, Max ₹50,000
      analysis.estimatedDuration = Math.max(15, Math.min(480, analysis.estimatedDuration)) // Min 15min, Max 8hrs
      analysis.confidence = Math.max(0, Math.min(100, analysis.confidence))

      console.log('✅ AI Analysis Result:', analysis)

      return analysis
    } catch (error: any) {
      lastError = error
      console.error(`❌ AI Analysis Error (attempt ${attempt + 1}):`, error.message || error)
      
      // Don't retry on certain errors
      if (error.message?.includes('quota') || error.message?.includes('rate limit')) {
        console.log('🚫 Rate limit hit, using fallback immediately')
        break
      }
    }
  }

  // All retries failed, use fallback
  console.log('📊 All retries failed, using smart estimation fallback')
  return estimatePriceFromDescription(description, categoryName)
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
    const model = genAI.getGenerativeModel({ model: 'gemini-pro' })

    const avgPrice = historicalPrices && historicalPrices.length > 0
      ? historicalPrices.reduce((a, b) => a + b, 0) / historicalPrices.length
      : null

    const prompt = `As a pricing expert for home services in India, suggest a fair price range for:

**Service:** ${description}
${avgPrice ? `**Historical Average Price:** ₹${avgPrice.toFixed(2)}` : ''}

Provide price range considering:
- Market rates in India
- Urban/semi-urban variations
- Skill level required
- Materials cost

Response Format (JSON only):
{
  "min": <minimum price in INR>,
  "max": <maximum price in INR>,
  "recommended": <recommended price in INR>
}

Respond with ONLY valid JSON.`

    const result = await model.generateContent(prompt)
    const response = await result.response
    let jsonText = response.text().trim()

    // Clean markdown
    if (jsonText.startsWith('```')) {
      jsonText = jsonText.replace(/```json\n?/g, '').replace(/```\n?/g, '')
    }

    return JSON.parse(jsonText)
  } catch (error) {
    console.error('❌ Price suggestion error:', error)
    return { min: 300, max: 1000, recommended: 500 }
  }
}
