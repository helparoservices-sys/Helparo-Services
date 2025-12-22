import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'
import { NextResponse } from 'next/server'

export async function POST() {
  try {
    const cookieStore = cookies()
    const supabase = createRouteHandlerClient({ cookies: () => cookieStore })
    
    // Sign out from Supabase (clears server-side session)
    await supabase.auth.signOut()
    
    // Create response
    const response = NextResponse.json({ success: true })
    
    // Clear all Supabase auth cookies explicitly
    const allCookies = cookieStore.getAll()
    for (const cookie of allCookies) {
      if (cookie.name.includes('supabase') || cookie.name.includes('sb-')) {
        response.cookies.delete(cookie.name)
      }
    }
    
    // Also clear common auth cookies
    response.cookies.delete('sb-access-token')
    response.cookies.delete('sb-refresh-token')
    
    return response
  } catch (error) {
    console.error('Logout API error:', error)
    // Still return success - we want the client to redirect regardless
    return NextResponse.json({ success: true })
  }
}

export async function GET() {
  // Redirect GET requests to login page after logout
  return NextResponse.redirect(new URL('/auth/login', process.env.NEXT_PUBLIC_APP_URL || 'https://helparo.in'))
}
