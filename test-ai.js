/**
 * Simple test to verify Google Gemini AI integration
 * Run: node test-ai.js
 */

require('dotenv').config({ path: '.env.local' })
const { GoogleGenerativeAI } = require('@google/generative-ai')

async function testAI() {
  console.log('🧪 Testing Google Gemini AI...\n')

  const apiKey = process.env.GEMINI_API_KEY
  
  if (!apiKey) {
    console.error('❌ Error: GEMINI_API_KEY not found in .env.local')
    return
  }

  console.log('✅ API Key found:', apiKey.substring(0, 10) + '...')

  try {
    const genAI = new GoogleGenerativeAI(apiKey)
    const model = genAI.getGenerativeModel({ model: 'gemini-2.0-flash-exp' })

    console.log('📤 Sending test prompt...')

    const result = await model.generateContent(`
      You are a home service pricing expert in India.
      Estimate the price for: "AC not cooling, needs gas refill and cleaning"
      
      Respond in JSON format:
      {
        "price": <number in INR>,
        "duration": <number in minutes>,
        "description": "<short description>"
      }
    `)

    const response = await result.response
    const text = response.text()

    console.log('\n📥 AI Response:')
    console.log(text)
    console.log('\n✅ AI Integration Working!')
    
  } catch (error) {
    console.error('\n❌ AI Test Failed:', error.message)
  }
}

testAI()
