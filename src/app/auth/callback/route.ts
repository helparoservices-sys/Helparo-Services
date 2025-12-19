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

      // If role already set, redirect based on role
      if (profile?.role) {
        if (profile.role === 'helper') {
          // Helpers must have verified phone
          if (!profile.phone || !profile.phone_verified) {
            return NextResponse.redirect(new URL('/auth/complete-signup', requestUrl.origin))
          }
          return NextResponse.redirect(new URL('/helper/dashboard', requestUrl.origin))
        }
        // Customer with role set - go straight to dashboard
        return NextResponse.redirect(new URL('/customer/dashboard', requestUrl.origin))
      }

      // No role set - go to post-oauth handler (client-side) to read localStorage role
      return NextResponse.redirect(new URL('/auth/post-oauth', requestUrl.origin))
    }
  }

  // URL to redirect to after sign in process completes
  return NextResponse.redirect(requestUrl.origin)
}
