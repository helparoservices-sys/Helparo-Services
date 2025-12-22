import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { analyzeJobWithAI } from '@/lib/ai-service'

// Vercel Hobby: 10s max, Pro: 60s max
// We set 60 but Hobby will cap at 10
export const maxDuration = 60

export async function POST(request: NextRequest) {
  const startTime = Date.now()
  console.log('🚀 [API] AI Analyze request received')
  
  try {
    // Quick auth check
    const supabase = await createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    
    if (authError || !user) {
      console.log('❌ [API] Unauthorized')
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    console.log(`✅ [API] Auth OK in ${Date.now() - startTime}ms`)

    const body = await request.json()
    const { images, description, categoryId, categoryName: providedCategoryName, location, urgency, timeWindow } = body

    // Validation
    if (!images || images.length === 0) {
      return NextResponse.json(
        { error: 'At least one image is required for AI analysis' },
        { status: 400 }
      )
    }

    if (!description || !categoryId) {
      return NextResponse.json(
        { error: 'Description and category are required' },
        { status: 400 }
      )
    }

    const categoryName = providedCategoryName || 'General Service'

    console.log(`🔍 [API] Starting AI analysis: category=${categoryName}, images=${images.length}`)

    // Call AI service (it handles its own timeout and fallback)
    const analysisEnvelope = await analyzeJobWithAI(
      images,
      description,
      categoryName,
      location,
      { urgency, timeWindow, requestId: body?.requestId }
    )

    const duration = Date.now() - startTime
    console.log(`✅ [API] Complete in ${duration}ms`)

    return NextResponse.json({
      success: true,
      analysis: analysisEnvelope.analysis,
      pricingSource: analysisEnvelope.source,
      usedModel: analysisEnvelope.usedModel,
      diagnostics: {
        ...analysisEnvelope.diagnostics,
        apiDurationMs: duration
      },
      duration,
    })
  } catch (error: any) {
    const duration = Date.now() - startTime
    console.error(`❌ [API] Error after ${duration}ms:`, error.message)
    
    return NextResponse.json(
      { 
        error: 'AI analysis failed. Please try again.',
        details: error.message 
      },
      { status: 500 }
    )
  }
}
