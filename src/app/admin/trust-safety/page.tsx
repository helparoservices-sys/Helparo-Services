import { createClient } from '@/lib/supabase/server'
import { TrustSafetyPageClient } from '@/components/admin/trust-safety-page-client'

export default async function AdminTrustSafetyPage() {
  const supabase = await createClient()

  // Fetch background checks - limited to most recent
  const { data: checksData, error: checksError } = await supabase
    .from('background_check_results')
    .select(`
      id,
      helper_id,
      check_type,
      status,
      verification_score,
      verified_at,
      expires_at,
      created_at,
      helper:profiles!background_check_results_helper_id_fkey(full_name, email)
    `)
    .order('created_at', { ascending: false })
    .limit(100)

  // Fetch trust scores - limited
  const { data: scoresData, error: scoresError } = await supabase
    .from('helper_trust_scores')
    .select(`
      helper_id,
      overall_score,
      updated_at,
      helper:profiles!helper_trust_scores_helper_id_fkey(full_name, email)
    `)
    .order('overall_score', { ascending: false })
    .limit(100)

  // Transform checks data
  const checks = (checksData || []).map((check) => {
    const helperData = Array.isArray(check.helper) ? check.helper[0] : check.helper
    return {
      ...check,
      result: (check.verification_score as number) > 70 ? 'passed' : 'pending',
      helper: {
        name: helperData?.full_name || 'Unknown',
        email: helperData?.email || 'N/A'
      }
    }
  })

  // Transform scores data
  const trustScores = (scoresData || []).map((score) => {
    const helperData = Array.isArray(score.helper) ? score.helper[0] : score.helper
    const overallScore = score.overall_score as number || 0
    return {
      ...score,
      score: overallScore,
      trust_score: overallScore,
      status: overallScore >= 80 ? 'active' : overallScore >= 60 ? 'active' : overallScore >= 40 ? 'flagged' : 'suspended',
      verification_level: overallScore >= 90 ? 'gold' : overallScore >= 75 ? 'silver' : overallScore >= 50 ? 'bronze' : 'basic',
      last_updated: score.updated_at as string,
      helper: {
        name: helperData?.full_name || 'Unknown',
        email: helperData?.email || 'N/A'
      }
    }
  })

  // Calculate stats
  const pendingChecks = checks.filter(c => c.status === 'pending').length
  const verifiedChecks = checks.filter(c => c.status === 'verified').length
  const expiredChecks = checks.filter(c => c.status === 'expired').length

  return (
    <TrustSafetyPageClient
      checks={checks}
      trustScores={trustScores}
      stats={{
        totalChecks: checks.length,
        pendingChecks,
        verifiedChecks,
        expiredChecks,
        totalScores: trustScores.length,
      }}
      error={checksError?.message || scoresError?.message}
    />
  )
}
