import { NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const query = searchParams.get('q')?.trim()
    const fetchAll = searchParams.get('all') === 'true'

    const supabase = createAdminClient()

    // If fetching all users with device tokens
    if (fetchAll) {
      // Get all profiles
      const { data: profiles, error } = await supabase
        .from('profiles')
        .select('id, full_name, phone, role')
        .order('full_name')
        .limit(500)

      if (error) {
        console.error('User fetch error:', error)
        return NextResponse.json({ users: [] })
      }

      // Get all device tokens
      const { data: tokens } = await supabase
        .from('device_tokens')
        .select('user_id')
        .eq('is_active', true)

      const usersWithTokens = new Set(tokens?.map(t => t.user_id) || [])

      // Sort: users with tokens first
      const users = profiles?.map(p => ({
        id: p.id,
        full_name: p.full_name || 'Unknown',
        phone: p.phone || '-',
        role: p.role || 'customer',
        has_token: usersWithTokens.has(p.id)
      })).sort((a, b) => {
        // Users with tokens come first
        if (a.has_token && !b.has_token) return -1
        if (!a.has_token && b.has_token) return 1
        return a.full_name.localeCompare(b.full_name)
      }) || []

      return NextResponse.json({ users })
    }

    // Search mode
    if (!query || query.length < 2) {
      return NextResponse.json({ users: [] })
    }

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
