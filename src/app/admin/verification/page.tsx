import { createClient } from '@/lib/supabase/server'
import { VerificationPageClient } from '@/components/admin/verification-page-client'

export default async function AdminVerificationPage() {
  const supabase = await createClient()

  // Fetch pending helpers with their profiles
  const { data: helpersData, error: helpersError } = await supabase
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
  const { data: docsData, error: docsError } = await supabase
    .from('verification_documents')
    .select('id, helper_id, document_type, document_url, status, created_at')
    .in('helper_id', helperIds.length > 0 ? helperIds : ['00000000-0000-0000-0000-000000000000'])

  // Transform data
  const helpers = (helpersData || []).map((helper) => {
    const profileData = Array.isArray(helper.profile) ? helper.profile[0] : helper.profile
    const helperDocs = (docsData || []).filter(d => d.helper_id === helper.user_id)
    
    return {
      user_id: helper.user_id,
      full_name: profileData?.full_name || 'Unknown',
      email: profileData?.email || 'N/A',
      avatar_url: profileData?.avatar_url || null,
      status: helper.verification_status,
      documents: helperDocs.map(doc => ({
        id: doc.id,
        doc_type: doc.document_type,
        file_path: doc.document_url,
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
