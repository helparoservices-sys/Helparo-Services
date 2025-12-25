import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

/**
 * Debug endpoint to test broadcast API components
 * GET /api/debug/broadcast-test
 */
export async function GET(request: NextRequest) {
  const results: Record<string, any> = {
    timestamp: new Date().toISOString(),
    steps: []
  }

  try {
    // Step 1: Create Supabase client
    results.steps.push({ step: 1, name: 'Create Supabase client', status: 'starting' })
    const startClient = Date.now()
    const supabase = await createClient()
    results.steps[0].status = 'success'
    results.steps[0].duration = Date.now() - startClient

    // Step 2: Check auth
    results.steps.push({ step: 2, name: 'Check auth', status: 'starting' })
    const startAuth = Date.now()
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    results.steps[1].status = authError ? 'error' : (user ? 'authenticated' : 'not_authenticated')
    results.steps[1].duration = Date.now() - startAuth
    results.steps[1].userId = user?.id?.substring(0, 8) + '...'
    if (authError) results.steps[1].error = authError.message

    // Step 3: Test profiles table
    results.steps.push({ step: 3, name: 'Query profiles', status: 'starting' })
    const startProfiles = Date.now()
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('id')
      .limit(1)
      .single()
    results.steps[2].status = profileError ? 'error' : 'success'
    results.steps[2].duration = Date.now() - startProfiles
    if (profileError) results.steps[2].error = profileError.message

    // Step 4: Test service_categories table
    results.steps.push({ step: 4, name: 'Query service_categories', status: 'starting' })
    const startCategories = Date.now()
    const { data: categories, error: catError } = await supabase
      .from('service_categories')
      .select('id, name')
      .limit(3)
    results.steps[3].status = catError ? 'error' : 'success'
    results.steps[3].duration = Date.now() - startCategories
    results.steps[3].count = categories?.length || 0
    if (catError) results.steps[3].error = catError.message

    // Step 5: Test helper_profiles table
    results.steps.push({ step: 5, name: 'Query helper_profiles', status: 'starting' })
    const startHelpers = Date.now()
    const { count, error: helpersError } = await supabase
      .from('helper_profiles')
      .select('id', { count: 'exact', head: true })
      .eq('is_approved', true)
    results.steps[4].status = helpersError ? 'error' : 'success'
    results.steps[4].duration = Date.now() - startHelpers
    results.steps[4].count = count || 0
    if (helpersError) results.steps[4].error = helpersError.message

    results.totalDuration = results.steps.reduce((sum: number, s: any) => sum + (s.duration || 0), 0)
    results.success = results.steps.every((s: any) => s.status !== 'error')

    return NextResponse.json(results)
  } catch (error: any) {
    results.error = error.message
    return NextResponse.json(results, { status: 500 })
  }
}
