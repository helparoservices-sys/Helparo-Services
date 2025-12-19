import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

export async function GET(request: Request) {
  const requestUrl = new URL(request.url)
  const code = requestUrl.searchParams.get('code')

  if (code) {
    const supabase = await createClient()
    await supabase.auth.exchangeCodeForSession(code)

    // After session exchange, get user info
    const { data: { user } } = await supabase.auth.getUser()
    if (user) {
      // Check if profile exists and has been properly set up
      const { data: profile } = await supabase
        .from('profiles')
        .select('id, role, full_name, phone, phone_verified, created_at')
        .eq('id', user.id)
        .maybeSingle()

      // Check if phone is verified - if not, go to complete-signup
      // complete-signup handles: role selection + terms acceptance + phone verification
      if (!profile?.phone || !profile?.phone_verified) {
        return NextResponse.redirect(new URL('/auth/complete-signup', requestUrl.origin))
      }

      // Role-based redirect - go straight to dashboard
      const role = profile?.role || 'customer'
      return NextResponse.redirect(new URL(`/${role}/dashboard`, requestUrl.origin))
    }
  }

  // URL to redirect to after sign in process completes
  return NextResponse.redirect(requestUrl.origin)
}
