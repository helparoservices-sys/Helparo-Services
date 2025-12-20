import { createBrowserClient } from '@supabase/ssr'
import type { Database } from './database.types'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

// PRODUCTION OPTIMIZATION: Singleton instance
// This prevents creating multiple clients across the app
let _supabaseInstance: ReturnType<typeof createBrowserClient<Database>> | null = null

function getSupabaseSingleton() {
  if (!_supabaseInstance) {
    _supabaseInstance = createBrowserClient<Database>(supabaseUrl, supabaseAnonKey, {
      auth: {
        flowType: 'pkce',
        detectSessionInUrl: true,
        persistSession: true,
      }
    })
  }
  return _supabaseInstance
}

// Export singleton for direct use (recommended)
export const supabase = getSupabaseSingleton()

// Legacy function - kept for backward compatibility but returns singleton
export function createClient() {
  return getSupabaseSingleton()
}
