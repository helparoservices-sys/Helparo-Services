import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

/**
 * DEBUG ONLY - Reset all helpers' is_on_job status
 * GET: Check status of all helpers
 * POST: Reset all is_on_job to false
 */
export async function GET() {
  try {
    const supabase = await createClient()
    
    const { data: helpers, error } = await supabase
      .from('helper_profiles')
      .select(`
        id,
        user_id,
        is_on_job,
        is_online,
        is_available_now,
        is_approved,
        profiles:user_id(full_name)
      `)
      .eq('is_approved', true)
    
    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }
    
    return NextResponse.json({
      helpers: helpers?.map(h => ({
        id: h.id,
        name: (h.profiles as any)?.full_name || 'Unknown',
        is_on_job: h.is_on_job,
        is_online: h.is_online,
        is_available_now: h.is_available_now
      }))
    })
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

export async function POST() {
  try {
    const supabase = await createClient()
    
    // Reset all helpers' is_on_job to false
    const { data, error } = await supabase
      .from('helper_profiles')
      .update({ is_on_job: false })
      .eq('is_on_job', true)
      .select('id')
    
    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }
    
    return NextResponse.json({
      success: true,
      message: `Reset ${data?.length || 0} helpers' is_on_job status to false`
    })
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
