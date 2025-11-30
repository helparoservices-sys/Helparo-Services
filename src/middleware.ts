import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { createServerClient, type CookieOptions } from '@supabase/ssr'
import { logger } from './lib/logger'
import { timingSafeEqual } from 'crypto'

// Generate CSRF token using Web Crypto API (Edge Runtime compatible)
function generateCSRFToken(): string {
  const array = new Uint8Array(32)
  crypto.getRandomValues(array)
  return Array.from(array, byte => byte.toString(16).padStart(2, '0')).join('')
}

// Verify CSRF token using timing-safe comparison
function verifyCSRFToken(token: string, headerToken: string | null): boolean {
  if (!token || !headerToken || token.length !== headerToken.length) {
    return false
  }
  
  try {
    const tokenBuffer = Buffer.from(token)
    const headerBuffer = Buffer.from(headerToken)
    return timingSafeEqual(tokenBuffer, headerBuffer)
  } catch {
    return false
  }
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
  response.headers.set('X-Permitted-Cross-Domain-Policies', 'none')
  response.headers.set('Cross-Origin-Embedder-Policy', 'require-corp')
  response.headers.set('Cross-Origin-Opener-Policy', 'same-origin')
  response.headers.set('Cross-Origin-Resource-Policy', 'same-origin')
  response.headers.set(
    'Permissions-Policy',
    'camera=(), microphone=(), geolocation=(self), payment=(self)'
  )
  
  // Content Security Policy
  response.headers.set(
    'Content-Security-Policy',
    "default-src 'self'; " +
    "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://opnjibjsddwyojrerbll.supabase.co; " +
    "style-src 'self' 'unsafe-inline'; " +
    "img-src 'self' data: https: blob:; " +
    "font-src 'self' data:; " +
    "connect-src 'self' https://opnjibjsddwyojrerbll.supabase.co wss://opnjibjsddwyojrerbll.supabase.co https://geocode.maps.co https://nominatim.openstreetmap.org; " +
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
  
  // Skip CSRF for Server Actions (they have built-in protection) and API routes
  const isServerAction = request.headers.get('content-type')?.includes('multipart/form-data') || 
                         request.headers.get('next-action') !== null
  const isApiRoute = request.nextUrl.pathname.startsWith('/api')
  
  if (isStateMutating && !isApiRoute && !isServerAction && !request.nextUrl.pathname.startsWith('/api/auth')) {
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

  // Protected routes
  const protectedRoutes = ['/customer', '/helper', '/admin']
  const isProtectedRoute = protectedRoutes.some(route => 
    request.nextUrl.pathname.startsWith(route)
  )

  // Only fetch auth state when necessary to reduce latency on public routes
  let user: any = null
  const needsAuthCheck = isProtectedRoute || request.nextUrl.pathname.startsWith('/auth/login')

  if (needsAuthCheck) {
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

    const { data: { user: fetchedUser } } = await supabase.auth.getUser()
    user = fetchedUser
  }

  // Redirect to login if accessing protected route without auth
  if (isProtectedRoute && !user) {
    const redirectUrl = new URL('/auth/login', request.url)
    return NextResponse.redirect(redirectUrl)
  }

  // Role-based access control - CRITICAL SECURITY
  if (isProtectedRoute && user) {
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          get(name: string) {
            return request.cookies.get(name)?.value
          },
          set(name: string, value: string, options: CookieOptions) {
            request.cookies.set({ name, value, ...options })
          },
          remove(name: string, options: CookieOptions) {
            request.cookies.set({ name, value: '', ...options })
          },
        },
      }
    )

    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single()

    const userRole = (profile as any)?.role || 'customer'
    const requestedPath = request.nextUrl.pathname

    // Check if user is trying to access a route that doesn't match their role
    if (requestedPath.startsWith('/admin') && userRole !== 'admin') {
      logger.warn('Unauthorized admin access attempt', { user_id: user.id, role: userRole, path: requestedPath })
      return NextResponse.redirect(new URL(`/${userRole}/dashboard`, request.url))
    }
    if (requestedPath.startsWith('/helper') && userRole !== 'helper') {
      logger.warn('Unauthorized helper access attempt', { user_id: user.id, role: userRole, path: requestedPath })
      return NextResponse.redirect(new URL(`/${userRole}/dashboard`, request.url))
    }
    if (requestedPath.startsWith('/customer') && userRole !== 'customer') {
      logger.warn('Unauthorized customer access attempt', { user_id: user.id, role: userRole, path: requestedPath })
      return NextResponse.redirect(new URL(`/${userRole}/dashboard`, request.url))
    }
  }

  // Redirect to dashboard if already logged in and trying to access auth pages
  if (user && request.nextUrl.pathname.startsWith('/auth/login')) {
    // Fetch profile role only when redirecting from login
    try {
      const supabase = createServerClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
        {
          cookies: {
            get(name: string) {
              return request.cookies.get(name)?.value
            },
            set(name: string, value: string, options: CookieOptions) {
              request.cookies.set({ name, value, ...options })
            },
            remove(name: string, options: CookieOptions) {
              request.cookies.set({ name, value: '', ...options })
            },
          },
        }
      )

      const { data: profile } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', user.id)
        .single()

      const role = (profile as any)?.role || 'customer'
      const redirectUrl = new URL(`/${role}/dashboard`, request.url)
      return NextResponse.redirect(redirectUrl)
    } catch {}
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
