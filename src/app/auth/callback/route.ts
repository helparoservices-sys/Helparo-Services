import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

export async function GET(request: Request) {
  const requestUrl = new URL(request.url)
  const code = requestUrl.searchParams.get('code')
  const fromMobile = requestUrl.searchParams.get('from') === 'mobile'

  if (code) {
    const supabase = await createClient()
    const { data: sessionData, error: exchangeError } = await supabase.auth.exchangeCodeForSession(code)
    
    if (exchangeError) {
      console.error('❌ Code exchange failed:', exchangeError)
      const errorUrl = fromMobile 
        ? 'helparoapp://auth/error?message=oauth_failed'
        : new URL('/auth/login?error=oauth_failed', requestUrl.origin).toString()
      return NextResponse.redirect(errorUrl)
    }

    // After session exchange, get user info
    const { data: { user } } = await supabase.auth.getUser()
    if (user && sessionData.session) {
      // Check if profile exists and has been properly set up
      const { data: profile } = await supabase
        .from('profiles')
        .select('id, role, full_name, phone, phone_verified, created_at')
        .eq('id', user.id)
        .maybeSingle()

      // Determine redirect destination based on profile
      let destination = '/'
      
      if (profile?.role) {
        if (profile.role === 'helper') {
          // Helpers must have verified phone
          if (!profile.phone || !profile.phone_verified) {
            destination = '/auth/complete-signup'
          } else {
            destination = '/helper/dashboard'
          }
        } else {
          // Customer with role set - go straight to dashboard
          destination = '/customer/dashboard'
        }
      } else {
        // No role set - go to post-oauth handler
        destination = '/auth/post-oauth'
      }

      // For mobile apps, redirect back to the app via deep link with tokens
      // The WebView doesn't share cookies with Chrome, so we pass tokens directly
      if (fromMobile) {
        const { access_token, refresh_token } = sessionData.session
        // Use deep link with tokens to establish session in the app's WebView
        const mobileRedirect = `helparoapp://auth/success?` + 
          `access_token=${encodeURIComponent(access_token)}` +
          `&refresh_token=${encodeURIComponent(refresh_token)}` +
          `&redirect=${encodeURIComponent(destination)}`
        console.log('📱 Mobile OAuth complete, redirecting to app with tokens')
        return NextResponse.redirect(mobileRedirect)
      }
      
      // Web redirect
      return NextResponse.redirect(new URL(destination, requestUrl.origin))
    }
  }

  // URL to redirect to after sign in process completes
  const fallbackUrl = fromMobile 
    ? 'helparoapp://auth/error?message=no_session'
    : requestUrl.origin
  return NextResponse.redirect(fallbackUrl)
}
