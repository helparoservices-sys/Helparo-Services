import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { analyzeJobWithAI } from '@/lib/ai-service'

// Increase timeout for AI analysis (Vercel Pro: 60s, Hobby: 10s)
export const maxDuration = 30 // 30 seconds max

export async function POST(request: NextRequest) {
  const startTime = Date.now()
  
  try {
    const supabase = await createClient()
    
    // Check authentication
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { images, description, categoryId, categoryName: providedCategoryName, location } = body

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

    // Use provided category name, or try to look up from database
    let categoryName = providedCategoryName
    if (!categoryName) {
      const { data: category } = await supabase
        .from('service_categories')
        .select('name')
        .eq('id', categoryId)
        .single()
      categoryName = category?.name || 'General Service'
    }

    console.log('🔍 Starting AI analysis for:', {
      categoryName,
      imagesCount: images.length,
      descriptionLength: description.length,
    })

    // Analyze with AI
    const analysis = await analyzeJobWithAI(
      images,
      description,
      categoryName,
      location
    )

    const duration = Date.now() - startTime
    console.log(`✅ AI Analysis completed in ${duration}ms:`, analysis)

    return NextResponse.json({
      success: true,
      analysis,
      duration,
    })
  } catch (error: any) {
    const duration = Date.now() - startTime
    console.error(`❌ AI Analysis API Error after ${duration}ms:`, error)
    
    // Return a more helpful error message
    let errorMessage = 'AI analysis failed'
    if (error.message?.includes('timeout')) {
      errorMessage = 'AI analysis took too long. Please try again.'
    } else if (error.message?.includes('quota') || error.message?.includes('rate')) {
      errorMessage = 'AI service is busy. Please try again in a moment.'
    }
    
    return NextResponse.json(
      { error: errorMessage, details: error.message },
      { status: 500 }
    )
  }
}
