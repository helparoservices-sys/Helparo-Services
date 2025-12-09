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
      // Check if this is an OAuth user (Google, etc.)
      const isOAuthUser = user.app_metadata?.provider === 'google' || 
                          user.app_metadata?.providers?.includes('google')
      
      // Check if profile exists and has been properly set up
      const { data: profile } = await supabase
        .from('profiles')
        .select('id, role, full_name, phone, phone_verified, created_at')
        .eq('id', user.id)
        .maybeSingle()

      // For OAuth users, check if they need to complete signup
      // Redirect if: no profile, no full_name, OR user was just created (within last 30 seconds)
      // This ensures complete-signup can read localStorage for role selection
      const isNewUser = profile?.created_at && 
        (new Date().getTime() - new Date(profile.created_at).getTime()) < 30000
      
      if (isOAuthUser && (!profile || !profile.full_name || isNewUser)) {
        return NextResponse.redirect(new URL('/auth/complete-signup', requestUrl.origin))
      }

      // Fetch latest active versions for legal consent check
      const { data: terms } = await supabase
        .from('legal_documents')
        .select('*')
        .eq('type', 'terms')
        .eq('is_active', true)
        .order('version', { ascending: false })
        .limit(1)
        .maybeSingle()
      const { data: privacy } = await supabase
        .from('legal_documents')
        .select('*')
        .eq('type', 'privacy')
        .eq('is_active', true)
        .order('version', { ascending: false })
        .limit(1)
        .maybeSingle()

      let needsConsent = false
      if ((terms as any)?.version) {
        const { data: acceptedTerms } = await supabase
          .from('legal_acceptances')
          .select('id')
          .eq('user_id', user.id)
          .eq('document_type', 'terms')
          .eq('document_version', (terms as any).version)
          .maybeSingle()
        if (!acceptedTerms) needsConsent = true
      }
      if ((privacy as any)?.version) {
        const { data: acceptedPrivacy } = await supabase
          .from('legal_acceptances')
          .select('id')
          .eq('user_id', user.id)
          .eq('document_type', 'privacy')
          .eq('document_version', (privacy as any).version)
          .maybeSingle()
        if (!acceptedPrivacy) needsConsent = true
      }

      if (needsConsent) {
        return NextResponse.redirect(new URL('/legal/consent', requestUrl.origin))
      }

      // Check if phone is missing or not verified - redirect to complete profile
      if (!profile?.phone || !(profile as any)?.phone_verified) {
        return NextResponse.redirect(new URL('/auth/complete-profile', requestUrl.origin))
      }
      
      // Role-based redirect
      const role = (profile as any)?.role || 'customer'
      return NextResponse.redirect(new URL(`/${role}/dashboard`, requestUrl.origin))
    }
  }

  // URL to redirect to after sign in process completes
  return NextResponse.redirect(requestUrl.origin)
}
