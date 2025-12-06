import { GoogleGenerativeAI } from '@google/generative-ai'

// Initialize Gemini AI
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || '')

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

/**
 * Analyze job images and description using Google Gemini AI
 */
export async function analyzeJobWithAI(
  images: string[], // Base64 encoded images
  description: string,
  categoryName: string,
  location?: string
): Promise<AIAnalysisResult> {
  try {
    const model = genAI.getGenerativeModel({ model: 'gemini-2.0-flash-exp' })

    // Prepare image parts for Gemini
    const imageParts = images.map((base64Image) => ({
      inlineData: {
        data: base64Image.split(',')[1] || base64Image, // Remove data:image/jpeg;base64, prefix if present
        mimeType: 'image/jpeg',
      },
    }))

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

    // Generate content with images
    const result = await model.generateContent([prompt, ...imageParts])
    const response = await result.response
    const text = response.text()

    console.log('🤖 AI Raw Response:', text)

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
  } catch (error) {
    console.error('❌ AI Analysis Error:', error)
    
    // Fallback to basic estimation
    return {
      estimatedPrice: 500,
      estimatedDuration: 60,
      severity: 'medium',
      requiredSkills: [categoryName],
      materialsNeeded: ['Standard materials'],
      urgency: 'normal',
      description: description || 'Service request requires professional assessment',
      confidence: 50,
    }
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
