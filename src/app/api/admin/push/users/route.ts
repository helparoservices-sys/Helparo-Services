import { NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const query = searchParams.get('q')?.trim()

    if (!query || query.length < 2) {
      return NextResponse.json({ users: [] })
    }

    const supabase = createAdminClient()

    // Search users by name or phone
    const { data: profiles, error } = await supabase
      .from('profiles')
      .select('id, full_name, phone, role')
      .or(`full_name.ilike.%${query}%,phone.ilike.%${query}%`)
      .limit(20)

    if (error) {
      console.error('User search error:', error)
      return NextResponse.json({ users: [] })
    }

    // Check which users have device tokens
    const userIds = profiles?.map(p => p.id) || []
    
    const { data: tokens } = await supabase
      .from('device_tokens')
      .select('user_id')
      .in('user_id', userIds)
      .eq('is_active', true)

    const usersWithTokens = new Set(tokens?.map(t => t.user_id) || [])

    const users = profiles?.map(p => ({
      id: p.id,
      full_name: p.full_name || 'Unknown',
      phone: p.phone || '-',
      role: p.role || 'customer',
      has_token: usersWithTokens.has(p.id)
    })) || []

    return NextResponse.json({ users })
  } catch (error) {
    console.error('User search error:', error)
    return NextResponse.json({ users: [] })
  }
}
