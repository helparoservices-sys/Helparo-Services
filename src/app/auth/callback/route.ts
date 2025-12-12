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

      // For existing users who have verified phone, check if terms need updating
      const { data: terms } = await supabase
        .from('legal_documents')
        .select('version')
        .eq('type', 'terms')
        .eq('is_active', true)
        .order('version', { ascending: false })
        .limit(1)
        .maybeSingle()
      const { data: privacy } = await supabase
        .from('legal_documents')
        .select('version')
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

      // Only show /legal/consent for EXISTING users who need to accept updated terms
      if (needsConsent) {
        return NextResponse.redirect(new URL('/legal/consent', requestUrl.origin))
      }
      
      // Role-based redirect
      const role = profile?.role || 'customer'
      return NextResponse.redirect(new URL(`/${role}/dashboard`, requestUrl.origin))
    }
  }

  // URL to redirect to after sign in process completes
  return NextResponse.redirect(requestUrl.origin)
}
