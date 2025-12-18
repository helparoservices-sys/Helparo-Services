import { NextRequest, NextResponse } from 'next/server'

import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'

function toNumber(value: unknown): number | null {
  if (value === null || value === undefined) return null
  if (typeof value === 'number' && Number.isFinite(value)) return value
  if (typeof value === 'string' && value.trim() !== '') {
    const parsed = Number(value)
    return Number.isFinite(parsed) ? parsed : null
  }
  return null
}

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const supabase = await createClient()

    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const requestId = params.id
    const body = await request.json().catch(() => ({}))

    const latitude = toNumber(body?.latitude)
    const longitude = toNumber(body?.longitude)

    if (!requestId) {
      return NextResponse.json({ error: 'Request ID is required' }, { status: 400 })
    }

    if (latitude === null || longitude === null) {
      return NextResponse.json({ error: 'Valid latitude/longitude required' }, { status: 400 })
    }

    // Verify this user is the assigned helper for the request
    const { data: sr, error: srError } = await supabase
      .from('service_requests')
      .select('id, assigned_helper_id, status, broadcast_status')
      .eq('id', requestId)
      .single()

    if (srError || !sr) {
      return NextResponse.json({ error: 'Request not found' }, { status: 404 })
    }

    if (sr.assigned_helper_id !== user.id) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    if (sr.status === 'cancelled' || sr.broadcast_status === 'cancelled') {
      return NextResponse.json({ error: 'Request cancelled' }, { status: 409 })
    }

    const admin = createAdminClient()

    const { error: updateError } = await admin
      .from('service_requests')
      .update({
        helper_location_lat: latitude,
        helper_location_lng: longitude,
        helper_location_updated_at: new Date().toISOString(),
      })
      .eq('id', requestId)

    if (updateError) {
      return NextResponse.json({ error: updateError.message }, { status: 500 })
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Internal server error' },
      { status: 500 }
    )
  }
}
