import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

/**
 * Ultra-lightweight status check endpoint
 * Returns only status fields (~50 bytes response)
 * Used for polling when waiting for helper acceptance
 * 
 * Minimal Supabase egress: ~50 bytes per request
 * Polling every 5s for 5 min = 60 requests × 50 bytes = 3KB total
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const supabase = await createClient()
    
    // Minimal query - only status fields
    const { data, error } = await supabase
      .from('service_requests')
      .select('status, broadcast_status, assigned_helper_id')
      .eq('id', id)
      .single()
    
    if (error || !data) {
      return NextResponse.json({ error: 'Not found' }, { status: 404 })
    }
    
    return NextResponse.json({
      status: data.status,
      broadcast_status: data.broadcast_status,
      assigned_helper_id: data.assigned_helper_id
    })
  } catch (error) {
    return NextResponse.json({ error: 'Failed' }, { status: 500 })
  }
}
