import { NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'

export async function GET() {
  try {
    const supabase = createAdminClient()

    // Get all active device tokens
    const { data: tokens, error: tokensError } = await supabase
      .from('device_tokens')
      .select('user_id')
      .eq('is_active', true)

    if (tokensError) {
      console.error('Tokens query error:', tokensError)
      return NextResponse.json({ total: 0, customers: 0, helpers: 0 })
    }

    const total = tokens?.length || 0
    
    if (total === 0) {
      return NextResponse.json({ total: 0, customers: 0, helpers: 0 })
    }

    // Get unique user IDs
    const userIds = [...new Set(tokens.map(t => t.user_id))]

    // Get profiles for these users
    const { data: profiles, error: profilesError } = await supabase
      .from('profiles')
      .select('id, role')
      .in('id', userIds)

    if (profilesError) {
      console.error('Profiles query error:', profilesError)
      return NextResponse.json({ total, customers: 0, helpers: 0 })
    }

    // Create a map of user_id to role
    const roleMap = new Map(profiles?.map(p => [p.id, p.role]) || [])

    // Count by role
    let customers = 0
    let helpers = 0
    
    tokens.forEach(t => {
      const role = roleMap.get(t.user_id)
      if (role === 'customer') customers++
      else if (role === 'helper') helpers++
    })

    return NextResponse.json({ total, customers, helpers })
  } catch (error) {
    console.error('Stats error:', error)
    return NextResponse.json({ total: 0, customers: 0, helpers: 0 })
  }
}
