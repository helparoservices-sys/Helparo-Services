import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { createServerClient, type CookieOptions } from '@supabase/ssr'
import crypto from 'crypto'
import { logger } from './lib/logger'

// Generate CSRF token
function generateCSRFToken(): string {
  return crypto.randomBytes(32).toString('hex')
}

// Verify CSRF token
function verifyCSRFToken(token: string, headerToken: string | null): boolean {
  return token === headerToken
}

export async function middleware(request: NextRequest) {
  let response = NextResponse.next({
    request: {
      headers: request.headers,
    },
  })

  // Add security headers
  response.headers.set('X-Frame-Options', 'DENY')
  response.headers.set('X-Content-Type-Options', 'nosniff')
  response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin')
  response.headers.set('X-XSS-Protection', '1; mode=block')
  response.headers.set(
    'Permissions-Policy',
    'camera=(), microphone=(), geolocation=(self)'
  )
  
  // Content Security Policy
  response.headers.set(
    'Content-Security-Policy',
    "default-src 'self'; " +
    "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://opnjibjsddwyojrerbll.supabase.co; " +
    "style-src 'self' 'unsafe-inline'; " +
    "img-src 'self' data: https: blob:; " +
    "font-src 'self' data:; " +
    "connect-src 'self' https://opnjibjsddwyojrerbll.supabase.co wss://opnjibjsddwyojrerbll.supabase.co; " +
    "frame-ancestors 'none';"
  )
  
  // HSTS for production
  if (process.env.NODE_ENV === 'production') {
    response.headers.set(
      'Strict-Transport-Security',
      'max-age=31536000; includeSubDomains; preload'
    )
  }
  
  // CSRF Protection for state-changing requests
  const isStateMutating = ['POST', 'PUT', 'DELETE', 'PATCH'].includes(request.method)
  
  if (isStateMutating && !request.nextUrl.pathname.startsWith('/api/auth')) {
    const csrfCookie = request.cookies.get('csrf-token')?.value
    const csrfHeader = request.headers.get('x-csrf-token')
    
    if (!csrfCookie || !verifyCSRFToken(csrfCookie, csrfHeader)) {
      // Only enforce CSRF for non-auth routes to avoid breaking Supabase auth
      if (!request.nextUrl.pathname.includes('/auth/callback')) {
        logger.warn('CSRF validation failed', {
          path: request.nextUrl.pathname,
          hasCookie: !!csrfCookie,
          hasHeader: !!csrfHeader
        })
        
        // PRODUCTION: Block invalid CSRF tokens
        return NextResponse.json(
          { error: 'Invalid security token. Please refresh the page and try again.' },
          { status: 403 }
        )
      }
    }
  }
  
  // Set or refresh CSRF token
  let csrfToken = request.cookies.get('csrf-token')?.value
  if (!csrfToken) {
    csrfToken = generateCSRFToken()
    response.cookies.set('csrf-token', csrfToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      path: '/'
    })
  }

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          return request.cookies.get(name)?.value
        },
        set(name: string, value: string, options: CookieOptions) {
          request.cookies.set({
            name,
            value,
            ...options,
          })
          response = NextResponse.next({
            request: {
              headers: request.headers,
            },
          })
          response.cookies.set({
            name,
            value,
            ...options,
          })
        },
        remove(name: string, options: CookieOptions) {
          request.cookies.set({
            name,
            value: '',
            ...options,
          })
          response = NextResponse.next({
            request: {
              headers: request.headers,
            },
          })
          response.cookies.set({
            name,
            value: '',
            ...options,
          })
        },
      },
    }
  )

  const { data: { user } } = await supabase.auth.getUser()

  // Protected routes
  const protectedRoutes = ['/customer', '/helper', '/admin']
  const isProtectedRoute = protectedRoutes.some(route => 
    request.nextUrl.pathname.startsWith(route)
  )

  // Redirect to login if accessing protected route without auth
  if (isProtectedRoute && !user) {
    const redirectUrl = new URL('/auth/login', request.url)
    return NextResponse.redirect(redirectUrl)
  }

  // Redirect to dashboard if already logged in and trying to access auth pages
  if (user && request.nextUrl.pathname.startsWith('/auth/login')) {
    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single()

    const role = (profile as any)?.role || 'customer'
    const redirectUrl = new URL(`/${role}/dashboard`, request.url)
    return NextResponse.redirect(redirectUrl)
  }

  return response
}

export const config = {
  matcher: [
    '/customer/:path*',
    '/helper/:path*',
    '/admin/:path*',
    '/auth/:path*'
  ],
}
