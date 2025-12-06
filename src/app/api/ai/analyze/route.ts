import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { analyzeJobWithAI } from '@/lib/ai-service'

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    
    // Check authentication
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { images, description, categoryId, location } = body

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

    // Get category name
    const { data: category } = await supabase
      .from('service_categories')
      .select('name')
      .eq('id', categoryId)
      .single()

    const categoryName = category?.name || 'General Service'

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

    console.log('✅ AI Analysis completed:', analysis)

    return NextResponse.json({
      success: true,
      analysis,
    })
  } catch (error: any) {
    console.error('❌ AI Analysis API Error:', error)
    return NextResponse.json(
      { error: error.message || 'AI analysis failed' },
      { status: 500 }
    )
  }
}
