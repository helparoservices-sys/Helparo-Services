import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'

export const dynamic = 'force-dynamic'

export async function GET() {
  try {
    const supabase = await createClient()
    const { data: { user }, error } = await supabase.auth.getUser()
    
    if (!user) {
      return NextResponse.json({ error: 'Not authenticated', authError: error?.message })
    }

    const adminClient = createAdminClient()
    // EGRESS FIX: Select only needed columns for debug
    const { data: profile } = await adminClient
      .from('profiles')
      .select('id, full_name, role, phone, email, avatar_url')
      .eq('id', user.id)
      .single()

    return NextResponse.json({
      authUser: {
        id: user.id,
        email: user.email,
        phone: user.phone,
      },
      profile: profile || 'NO PROFILE FOUND',
      match: !!profile
    })
  } catch (error) {
    return NextResponse.json({ error: String(error) }, { status: 500 })
  }
}
