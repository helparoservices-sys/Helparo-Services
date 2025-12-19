'use client'

import { createBrowserClient } from '@supabase/ssr'

/**
 * Check if running inside Capacitor native app
 */
export function isCapacitor(): boolean {
  if (typeof window === 'undefined') return false
  return !!(window as any).Capacitor?.isNativePlatform?.()
}

/**
 * Handle OAuth sign in - uses in-app browser for Capacitor
 */
export async function signInWithGoogle(role: 'customer' | 'helper') {
  // Store role for after OAuth callback
  localStorage.setItem('pendingSignupRole', role)
  localStorage.setItem('roleSelected', 'true')
  
  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )
  
  // Get the OAuth URL without auto-redirect
  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: 'google',
    options: {
      redirectTo: `${window.location.origin}/auth/callback`,
      queryParams: {
        access_type: 'offline',
        prompt: 'consent',
      },
      skipBrowserRedirect: isCapacitor(), // Skip auto redirect if in Capacitor
    },
  })
  
  if (error) {
    throw error
  }
  
  // If in Capacitor, open the OAuth URL in in-app browser
  if (isCapacitor() && data?.url) {
    try {
      const { Browser } = await import('@capacitor/browser')
      
      // Listen for the callback URL
      Browser.addListener('browserFinished', () => {
        // Browser closed, check if we got authenticated
        window.location.reload()
      })
      
      // Open OAuth in in-app browser
      await Browser.open({ 
        url: data.url,
        presentationStyle: 'popover',
        windowName: '_self'
      })
    } catch (e) {
      // Fallback to regular redirect if Browser plugin fails
      window.location.href = data.url
    }
  }
  
  return { data, error }
}
