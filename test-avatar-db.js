// Quick test to check avatar_url in database
// Run this with: node test-avatar-db.js

const { createClient } = require('@supabase/supabase-js')

const supabaseUrl = 'https://opnjibjsddwyojrerbll.supabase.co'
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'your-anon-key-here'

const supabase = createClient(supabaseUrl, supabaseKey)

async function checkAvatars() {
  console.log('🔍 Checking helper profiles with avatars...\n')
  
  // Check profiles table
  const { data: profiles, error: profilesError } = await supabase
    .from('profiles')
    .select('id, full_name, avatar_url')
    .eq('id', 'dd66e790-86ae-4ef4-8be6-e6abda09c671')
    .single()
  
  console.log('📋 Profiles table:')
  console.log('User ID:', profiles?.id)
  console.log('Name:', profiles?.full_name)
  console.log('Avatar URL:', profiles?.avatar_url)
  console.log('Has Avatar:', !!profiles?.avatar_url)
  console.log()
  
  // Check helper_profiles table  
  const { data: helper, error: helperError } = await supabase
    .from('helper_profiles')
    .select(`
      id,
      user_id,
      profiles!helper_profiles_user_id_fkey (
        full_name,
        avatar_url
      )
    `)
    .eq('id', '5138e75b-3701-46e2-8738-178746a4109a')
    .single()
  
  console.log('👷 Helper Profiles table:')
  console.log('Helper ID:', helper?.id)
  console.log('User ID:', helper?.user_id)
  console.log('Profile Name:', helper?.profiles?.full_name)
  console.log('Profile Avatar:', helper?.profiles?.avatar_url)
  console.log('Has Avatar:', !!helper?.profiles?.avatar_url)
  
  if (profilesError) console.error('Profiles Error:', profilesError)
  if (helperError) console.error('Helper Error:', helperError)
}

checkAvatars()
