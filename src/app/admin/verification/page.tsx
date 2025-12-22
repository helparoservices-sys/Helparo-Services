import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { VerificationPageClient } from '@/components/admin/verification-page-client'
import { redirect } from 'next/navigation'

export default async function AdminVerificationPage() {
  // First, verify user is admin using regular client
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  
  if (!user) {
    redirect('/auth/login')
  }
  
  // Check role from profiles
  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single()
  
  if (profile?.role !== 'admin') {
    redirect(`/${profile?.role || 'customer'}/dashboard`)
  }
  
  // Use admin client for data fetching (bypasses RLS)
  const adminClient = createAdminClient()

  // Fetch pending helpers with their profiles
  const { data: helpersData, error: helpersError } = await adminClient
    .from('helper_profiles')
    .select(`
      user_id,
      verification_status,
      created_at,
      profile:profiles!helper_profiles_user_id_fkey(full_name, email, avatar_url)
    `)
    .eq('verification_status', 'pending')
    .order('created_at', { ascending: true })

  // Fetch all documents for pending helpers
  const helperIds = (helpersData || []).map(h => h.user_id)
  const { data: docsData, error: docsError } = await adminClient
    .from('verification_documents')
    .select('id, helper_id, document_type, document_url, selfie_url, status, created_at')
    .in('helper_id', helperIds.length > 0 ? helperIds : ['00000000-0000-0000-0000-000000000000'])

  // Fetch complete helper profiles with onboarding data
  const { data: completeProfiles } = await adminClient
    .from('helper_profiles')
    .select(`
      user_id,
      service_categories,
      skills_specialization,
      experience_years,
      hourly_rate,
      address,
      pincode,
      service_areas,
      working_hours
    `)
    .in('user_id', helperIds.length > 0 ? helperIds : ['00000000-0000-0000-0000-000000000000'])

  // Fetch bank accounts
  const { data: bankAccounts } = await adminClient
    .from('helper_bank_accounts')
    .select('helper_id, account_holder_name, account_number, ifsc_code, bank_name, upi_id, status')
    .in('helper_id', helperIds.length > 0 ? helperIds : ['00000000-0000-0000-0000-000000000000'])
    .eq('is_primary', true)

  // Transform data
  const helpers = (helpersData || []).map((helper) => {
    const profileData = Array.isArray(helper.profile) ? helper.profile[0] : helper.profile
    let helperDocs = (docsData || []).filter(d => d.helper_id === helper.user_id)
    
    // Flatten documents - extract selfie from selfie_url field if present
    const flattenedDocs: typeof helperDocs = []
    helperDocs.forEach(doc => {
      // Add main document
      flattenedDocs.push(doc)
      // If this doc has selfie_url, add it as separate selfie document
      if (doc.selfie_url) {
        flattenedDocs.push({
          id: `${doc.id}_selfie`,
          helper_id: doc.helper_id,
          document_type: 'selfie',
          document_url: doc.selfie_url,
          selfie_url: null,
          status: doc.status,
          created_at: doc.created_at
        })
      }
    })
    helperDocs = flattenedDocs
    
    const fullProfile = (completeProfiles || []).find(p => p.user_id === helper.user_id)
    const bankAccount = (bankAccounts || []).find(b => b.helper_id === helper.user_id)
    
    // Extract storage path from document_url
    const getStoragePath = (url: string) => {
      if (!url) return ''
      // Extract path after /storage/v1/object/public/kyc/
      const match = url.match(/\/kyc\/(.+)$/)
      return match ? match[1] : url
    }
    
    return {
      user_id: helper.user_id,
      full_name: profileData?.full_name || 'Unknown',
      email: profileData?.email || 'N/A',
      avatar_url: profileData?.avatar_url || null,
      status: helper.verification_status,
      // Onboarding details
      service_categories: fullProfile?.service_categories || [],
      skills: fullProfile?.skills_specialization || [],
      experience_years: fullProfile?.experience_years,
      hourly_rate: fullProfile?.hourly_rate,
      address: fullProfile?.address,
      pincode: fullProfile?.pincode,
      service_areas: fullProfile?.service_areas || [],
      working_hours: fullProfile?.working_hours,
      bank_account: bankAccount ? {
        account_holder_name: bankAccount.account_holder_name,
        account_number: bankAccount.account_number,
        ifsc_code: bankAccount.ifsc_code,
        bank_name: bankAccount.bank_name,
        upi_id: bankAccount.upi_id,
        status: bankAccount.status
      } : null,
      documents: helperDocs.map(doc => ({
        id: doc.id,
        doc_type: doc.document_type,
        file_path: getStoragePath(doc.document_url),
        status: doc.status,
        created_at: doc.created_at
      }))
    }
  })

  // Calculate stats
  const totalDocuments = (docsData || []).length
  const avgDocsPerHelper = helpers.length > 0 ? Math.round(totalDocuments / helpers.length) : 0

  return (
    <VerificationPageClient
      helpers={helpers}
      stats={{
        pendingHelpers: helpers.length,
        totalDocuments,
        avgDocsPerHelper
      }}
      error={helpersError?.message || docsError?.message}
    />
  )
}
