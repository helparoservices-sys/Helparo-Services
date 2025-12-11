import { createBrowserClient } from '@supabase/ssr'
import type { Database } from './database.types'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

export const supabase = createBrowserClient<Database>(supabaseUrl, supabaseAnonKey, {
  auth: {
    flowType: 'pkce',
    detectSessionInUrl: true,
    persistSession: true,
    storage: typeof window !== 'undefined' ? window.localStorage : undefined,
    storageKey: 'sb-auth-token',
  },
  cookieOptions: {
    name: 'sb-auth-token',
    lifetime: 60 * 60 * 24 * 7, // 7 days
    domain: typeof window !== 'undefined' ? window.location.hostname : undefined,
    path: '/',
    sameSite: 'lax', // Changed from 'strict' to 'lax' to allow cross-site redirects
  }
})

export function createClient() {
  return createBrowserClient<Database>(supabaseUrl, supabaseAnonKey, {
    auth: {
      flowType: 'pkce',
      detectSessionInUrl: true,
      persistSession: true,
      storage: typeof window !== 'undefined' ? window.localStorage : undefined,
      storageKey: 'sb-auth-token',
    },
    cookieOptions: {
      name: 'sb-auth-token',
      lifetime: 60 * 60 * 24 * 7, // 7 days
      domain: typeof window !== 'undefined' ? window.location.hostname : undefined,
      path: '/',
      sameSite: 'lax', // Changed from 'strict' to 'lax' to allow cross-site redirects
    }
  })
}
