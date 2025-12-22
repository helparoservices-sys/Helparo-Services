'use client'

import { createBrowserClient } from '@supabase/ssr'
import { App } from '@capacitor/app'

/**
 * Check if running inside Capacitor native app
 */
export function isCapacitor(): boolean {
  if (typeof window === 'undefined') return false
  return !!(window as any).Capacitor?.isNativePlatform?.()
}

/**
 * Mark body with Capacitor class for CSS targeting
 */
export function markCapacitorBody() {
  if (isCapacitor() && typeof document !== 'undefined') {
    document.body.classList.add('capacitor-app')
  }
}

/**
 * Handle OAuth sign in - uses Browser plugin for Capacitor
 * This opens an in-app browser that shares context and handles deep links properly
 */
export async function signInWithGoogle(role: 'customer' | 'helper') {
  // Store role for after OAuth callback
  localStorage.setItem('pendingSignupRole', role)
  localStorage.setItem('roleSelected', 'true')
  
  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )
  
  // For Capacitor, we use the app's custom URL scheme for direct callback
  // The key insight: we start OAuth from the WebView, so PKCE verifier is stored here
  const redirectUrl = isCapacitor() 
    ? 'helparoapp://auth/callback'  // Deep link back to app
    : `${window.location.origin}/auth/callback`
  
  console.log('🔐 Starting Google OAuth with redirect:', redirectUrl)
  
  // For Capacitor, we need to use skipBrowserRedirect and open manually
  if (isCapacitor()) {
    const { data, error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: redirectUrl,
        skipBrowserRedirect: true, // Don't auto-redirect, we'll handle it
        queryParams: {
          access_type: 'offline',
          prompt: 'consent',
        },
      },
    })
    
    if (error) {
      console.error('❌ Google OAuth error:', error)
      throw error
    }
    
    if (data?.url) {
      console.log('🌐 Opening OAuth URL in system browser...')
      // Open in system browser - it will redirect back via deep link
      const { Browser } = await import('@capacitor/browser')
      await Browser.open({ url: data.url })
    }
    
    return { data, error }
  }
  
  // Web: normal OAuth flow
  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: 'google',
    options: {
      redirectTo: redirectUrl,
      queryParams: {
        access_type: 'offline',
        prompt: 'consent',
      },
    },
  })
  
  if (error) {
    console.error('❌ Google OAuth error:', error)
    throw error
  }
  
  console.log('✅ OAuth initiated successfully')
  return { data, error }
}

/**
 * Initialize deep link listener for Capacitor
 * Call this once when the app starts
 * 
 * FLOW: OAuth now works as follows:
 * 1. App calls signInWithGoogle() with skipBrowserRedirect:true
 * 2. We get OAuth URL and open it in system browser via @capacitor/browser
 * 3. After Google auth, browser redirects to helparoapp://auth/callback?code=XXX
 * 4. Android intercepts deep link and opens app
 * 5. This handler exchanges code for session (PKCE verifier is in WebView localStorage)
 * 6. Navigate to dashboard
 */
export function initializeDeepLinkListener() {
  if (!isCapacitor()) {
    console.log('Not in Capacitor - skipping deep link listener')
    return
  }
  
  console.log('🔗 Initializing Capacitor deep link listener')
  
  // Mark body for CSS
  markCapacitorBody()
  
  App.addListener('appUrlOpen', async (event) => {
    console.log('📱 App URL opened:', event.url)
    
    // Close any open browser
    try {
      const { Browser } = await import('@capacitor/browser')
      await Browser.close()
    } catch (e) {
      // Browser might not be open
    }
    
    try {
      const url = new URL(event.url)
      
      // Handle OAuth callback with authorization code
      if (url.host === 'auth' && (url.pathname === '/callback' || url.pathname === '/')) {
        const code = url.searchParams.get('code')
        
        if (code) {
          console.log('✅ Authorization code received, exchanging for session...')
          
          const supabase = createBrowserClient(
            process.env.NEXT_PUBLIC_SUPABASE_URL!,
            process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
          )
          
          // Exchange code for session - PKCE verifier is in this WebView's localStorage
          const { data, error } = await supabase.auth.exchangeCodeForSession(code)
          
          if (error) {
            console.error('❌ Code exchange failed:', error)
            window.location.href = '/auth/login?error=oauth_exchange_failed'
            return
          }
          
          if (data.session) {
            console.log('✅ Session established!')
            
            // Get user profile to determine redirect
            const { data: profile } = await supabase
              .from('profiles')
              .select('role, phone, phone_verified')
              .eq('id', data.session.user.id)
              .maybeSingle()
            
            // Clear pending data
            localStorage.removeItem('pendingSignupRole')
            localStorage.removeItem('roleSelected')
            
            // Determine redirect
            let redirectPath = '/customer/dashboard'
            if (profile?.role === 'helper') {
              if (!profile.phone || !profile.phone_verified) {
                redirectPath = '/auth/complete-signup'
              } else {
                redirectPath = '/helper/dashboard'
              }
            } else if (!profile?.role) {
              redirectPath = '/auth/post-oauth'
            }
            
            console.log('🚀 Navigating to:', redirectPath)
            window.location.href = redirectPath
          } else {
            console.error('❌ No session returned')
            window.location.href = '/auth/login?error=no_session'
          }
          return
        }
        
        // Check for error in callback
        const errorParam = url.searchParams.get('error')
        if (errorParam) {
          console.error('❌ OAuth error:', errorParam)
          window.location.href = `/auth/login?error=${errorParam}`
          return
        }
      }
      
      // Handle explicit success (legacy)
      if (url.host === 'auth' && url.pathname === '/success') {
        const accessToken = url.searchParams.get('access_token')
        const refreshToken = url.searchParams.get('refresh_token')
        const redirectPath = url.searchParams.get('redirect') || '/customer/dashboard'
        
        if (accessToken && refreshToken) {
          const supabase = createBrowserClient(
            process.env.NEXT_PUBLIC_SUPABASE_URL!,
            process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
          )
          
          await supabase.auth.setSession({
            access_token: accessToken,
            refresh_token: refreshToken
          })
        }
        
        localStorage.removeItem('pendingSignupRole')
        localStorage.removeItem('roleSelected')
        window.location.href = redirectPath
        return
      }
      
      // Handle error
      if (url.host === 'auth' && url.pathname === '/error') {
        const errorMessage = url.searchParams.get('message') || 'unknown_error'
        console.error('❌ OAuth error:', errorMessage)
        window.location.href = `/auth/login?error=${errorMessage}`
        return
      }
      
      console.log('📱 Unhandled deep link:', event.url)
      
    } catch (error) {
      console.error('❌ Deep link handling error:', error)
      window.location.href = '/auth/login?error=deep_link_failed'
    }
  })
  
  console.log('✅ Deep link listener registered')
}

/**
 * Initialize app-level Capacitor features
 * Call this in the root layout
 */
export async function initializeCapacitor() {
  if (!isCapacitor()) return
  
  console.log('🚀 Initializing Capacitor app features')
  
  // Status bar will be dynamically configured by each page using useStatusBar hook
  console.log('✅ Capacitor initialized - status bar will adapt per page')
  
  // Set up deep link handling
  initializeDeepLinkListener()
  
  console.log('✅ Capacitor initialized')
}
