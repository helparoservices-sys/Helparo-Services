import { createServerClient, type CookieOptions } from '@supabase/ssr'
import { cookies } from 'next/headers'
import type { Database } from './database.types.ts'
export async function createClient() {
  const cookieStore = await cookies()

  return createServerClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          return cookieStore.get(name)?.value
        },
        set(name: string, value: string, options: CookieOptions) {
          try {
            // Ensure secure cookie settings for production
            const cookieOptions = {
              ...options,
              secure: process.env.NODE_ENV === 'production',
              sameSite: 'lax' as const,
              path: options.path || '/',
            }
            cookieStore.set({ name, value, ...cookieOptions })
          } catch {
            // The `set` method was called from a Server Component.
            // This can be ignored if you have middleware refreshing
            // user sessions.
          }
        },
        remove(name: string, options: CookieOptions) {
          try {
            const cookieOptions = {
              ...options,
              secure: process.env.NODE_ENV === 'production',
              sameSite: 'lax' as const,
              path: options.path || '/',
            }
            cookieStore.set({ name, value: '', ...cookieOptions })
          } catch {
            // The `delete` method was called from a Server Component.
            // This can be ignored if you have middleware refreshing
            // user sessions.
          }
        },
      },
    }
  )
}
