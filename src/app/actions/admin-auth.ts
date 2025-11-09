'use server'

import { createClient } from '@supabase/supabase-js'
import { cookies } from 'next/headers'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

/**
 * Create a new admin user - requires service role key
 * This bypasses email confirmation and RLS policies
 */
export async function createAdminUser(data: {
  email: string
  password: string
  full_name: string
  phone: string
  country_code: string
}) {
  try {
    // Validate that the current user is an admin
    const cookieStore = cookies()
    const supabase = createClient(
      supabaseUrl,
      supabaseServiceKey,
      {
        auth: {
          persistSession: false,
        },
      }
    )

    // Create the user with service role (bypasses email confirmation)
    const { data: authData, error: authError } = await supabase.auth.admin.createUser({
      email: data.email.trim().toLowerCase(),
      password: data.password,
      email_confirm: true, // Auto-confirm email
      user_metadata: {
        full_name: data.full_name,
        phone: data.phone,
        country_code: data.country_code,
        role: 'admin',
      },
    })

    if (authError) {
      console.error('Admin creation auth error:', authError)
      return { error: authError.message }
    }

    if (!authData.user) {
      return { error: 'Failed to create user' }
    }

    // Update the profile with admin role
    const { error: profileError } = await supabase
      .from('profiles')
      .update({
        full_name: data.full_name,
        phone: data.phone,
        country_code: data.country_code,
        role: 'admin',
        status: 'active',
      })
      .eq('id', authData.user.id)

    if (profileError) {
      console.error('Profile update error:', profileError)
      // Try to delete the auth user if profile update fails
      await supabase.auth.admin.deleteUser(authData.user.id)
      return { error: 'Failed to update profile: ' + profileError.message }
    }

    return { 
      success: true, 
      user: {
        id: authData.user.id,
        email: authData.user.email,
      }
    }
  } catch (error: any) {
    console.error('Create admin error:', error)
    return { error: error.message || 'Failed to create admin user' }
  }
}
