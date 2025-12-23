import { NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'

export async function GET() {
  try {
    const supabase = createAdminClient()

    // Get total device tokens with user roles
    const { data: tokens, error } = await supabase
      .from('device_tokens')
      .select(`
        id,
        user_id,
        profiles!inner(role)
      `)
      .eq('is_active', true)

    if (error) {
      console.error('Stats query error:', error)
      return NextResponse.json({ total: 0, customers: 0, helpers: 0 })
    }

    const total = tokens?.length || 0
    const customers = tokens?.filter(t => (t.profiles as any)?.role === 'customer').length || 0
    const helpers = tokens?.filter(t => (t.profiles as any)?.role === 'helper').length || 0

    return NextResponse.json({ total, customers, helpers })
  } catch (error) {
    console.error('Stats error:', error)
    return NextResponse.json({ total: 0, customers: 0, helpers: 0 })
  }
}
