'use server'

import { createClient } from '@/lib/supabase/server'
import { requireAuth } from '@/lib/auth-middleware'
import { UserRole } from '@/lib/constants'
import { handleServerActionError } from '@/lib/errors'
import { sanitizeText } from '@/lib/sanitize'
import { rateLimit, RATE_LIMITS } from '@/lib/rate-limit'
import { logger } from '@/lib/logger'
import { revalidatePath } from 'next/cache'

/**
 * Server Actions for Trust & Safety (Migration 024)
 * Tables: background_check_results, verification_documents, service_insurance, insurance_claims, geofence_violations, helper_trust_scores
 */

// ============================================
// BACKGROUND CHECKS
// ============================================

export async function initiateBackgroundCheck(helperId: string, checkType: string) {
  const supabase = await createClient()

  try {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return { error: 'Unauthorized' }

    // Check admin role or helper themselves
    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single()

    if (profile?.role !== 'admin' && user.id !== helperId) {
      return { error: 'Unauthorized' }
    }

    const { data, error } = await supabase
      .from('background_check_results')
      .insert({
        helper_id: helperId,
        check_type: checkType,
        status: 'pending',
        initiated_by: user.id
      })
      .select()
      .single()

    if (error) throw error

    revalidatePath('/admin/verification')
    revalidatePath('/helper/verification')
    return { success: true, backgroundCheck: data }
  } catch (error: any) {
    logger.error('Initiate background check error:', { error })
    return handleServerActionError(error)
  }
}

export async function updateBackgroundCheckResult(formData: FormData) {
  const supabase = await createClient()
  
  const checkId = formData.get('check_id') as string
  const status = formData.get('status') as string
  const result = formData.get('result') as string
  const notes = formData.get('notes') as string

  try {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return { error: 'Unauthorized' }

    // Check admin role
    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single()

    if (profile?.role !== 'admin') {
      return { error: 'Unauthorized' }
    }

    const updateData: any = {
      status,
      result: JSON.parse(result),
      reviewed_by: user.id,
      reviewed_at: new Date().toISOString()
    }

    if (notes) updateData.notes = notes

    if (status === 'completed') {
      updateData.completed_at = new Date().toISOString()
    }

    const { data, error } = await supabase
      .from('background_check_results')
      .update(updateData)
      .eq('id', checkId)
      .select()
      .single()

    if (error) throw error

    // Update helper trust score
    const { data: check } = await supabase
      .from('background_check_results')
      .select('helper_id')
      .eq('id', checkId)
      .single()

    if (check) {
      await updateHelperTrustScore(check.helper_id)
    }

    revalidatePath('/admin/verification')
    revalidatePath('/helper/verification')
    return { success: true, backgroundCheck: data }
  } catch (error: any) {
    logger.error('Update background check result error:', { error })
    return handleServerActionError(error)
  }
}

export async function getHelperBackgroundChecks(helperId: string) {
  const supabase = await createClient()

  try {
    const { data, error } = await supabase
      .from('background_check_results')
      .select('*')
      .eq('helper_id', helperId)
      .order('created_at', { ascending: false })

    if (error) throw error

    return { success: true, checks: data }
  } catch (error: any) {
    logger.error('Get helper background checks error:', { error })
    return handleServerActionError(error)
  }
}

// ============================================
// SERVICE INSURANCE
// ============================================

export async function createInsurancePolicy(formData: FormData) {
  const supabase = await createClient()
  
  const helperId = formData.get('helper_id') as string
  const providerName = formData.get('provider_name') as string
  const policyNumber = formData.get('policy_number') as string
  const coverageAmount = parseFloat(formData.get('coverage_amount') as string)
  const coverageType = formData.get('coverage_type') as string
  const startDate = formData.get('start_date') as string
  const endDate = formData.get('end_date') as string
  const documentUrl = formData.get('document_url') as string

  try {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return { error: 'Unauthorized' }

    // Check admin role or helper themselves
    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single()

    if (profile?.role !== 'admin' && user.id !== helperId) {
      return { error: 'Unauthorized' }
    }

    const { data, error } = await supabase
      .from('service_insurance')
      .insert({
        helper_id: helperId,
        provider_name: providerName,
        policy_number: policyNumber,
        coverage_amount: coverageAmount,
        coverage_type: coverageType,
        start_date: startDate,
        end_date: endDate,
        policy_document_url: documentUrl,
        is_active: true
      })
      .select()
      .single()

    if (error) throw error

    revalidatePath('/admin/insurance')
    revalidatePath('/helper/insurance')
    return { success: true, insurance: data }
  } catch (error: any) {
    logger.error('Create insurance policy error:', { error })
    return handleServerActionError(error)
  }
}

export async function verifyInsurancePolicy(policyId: string, isVerified: boolean, notes?: string) {
  const supabase = await createClient()

  try {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return { error: 'Unauthorized' }

    // Check admin role
    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single()

    if (profile?.role !== 'admin') {
      return { error: 'Unauthorized' }
    }

    const updateData: any = {
      is_verified: isVerified,
      verified_by: user.id,
      verified_at: new Date().toISOString()
    }

    if (notes) updateData.verification_notes = notes

    const { data, error } = await supabase
      .from('service_insurance')
      .update(updateData)
      .eq('id', policyId)
      .select()
      .single()

    if (error) throw error

    // Update helper trust score
    const { data: policy } = await supabase
      .from('service_insurance')
      .select('helper_id')
      .eq('id', policyId)
      .single()

    if (policy) {
      await updateHelperTrustScore(policy.helper_id)
    }

    revalidatePath('/admin/insurance')
    revalidatePath('/helper/insurance')
    return { success: true, insurance: data }
  } catch (error: any) {
    logger.error('Verify insurance policy error:', { error })
    return handleServerActionError(error)
  }
}

export async function getHelperInsurance(helperId: string) {
  const supabase = await createClient()

  try {
    const { data, error } = await supabase
      .from('service_insurance')
      .select('*')
      .eq('helper_id', helperId)
      .order('created_at', { ascending: false })

    if (error) throw error

    return { success: true, policies: data }
  } catch (error: any) {
    logger.error('Get helper insurance error:', { error })
    return handleServerActionError(error)
  }
}

// ============================================
// INSURANCE CLAIMS
// ============================================

export async function fileInsuranceClaim(formData: FormData) {
  const supabase = await createClient()
  
  const serviceRequestId = formData.get('service_request_id') as string
  const policyId = formData.get('policy_id') as string
  const claimAmount = parseFloat(formData.get('claim_amount') as string)
  const incidentDescription = formData.get('incident_description') as string
  const incidentDate = formData.get('incident_date') as string
  const evidenceUrls = formData.get('evidence_urls') as string

  try {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return { error: 'Unauthorized' }

    const { data, error } = await supabase
      .from('insurance_claims')
      .insert({
        policy_id: policyId,
        service_request_id: serviceRequestId,
        claim_amount: claimAmount,
        incident_description: incidentDescription,
        incident_date: incidentDate,
        evidence_urls: evidenceUrls ? evidenceUrls.split(',') : [],
        filed_by: user.id,
        status: 'submitted'
      })
      .select()
      .single()

    if (error) throw error

    revalidatePath('/customer/claims')
    revalidatePath('/helper/claims')
    return { success: true, claim: data }
  } catch (error: any) {
    logger.error('File insurance claim error:', { error })
    return handleServerActionError(error)
  }
}

export async function updateClaimStatus(formData: FormData) {
  const supabase = await createClient()
  
  const claimId = formData.get('claim_id') as string
  const status = formData.get('status') as string
  const approvedAmount = formData.get('approved_amount') ? parseFloat(formData.get('approved_amount') as string) : null
  const rejectionReason = formData.get('rejection_reason') as string
  const adminNotes = formData.get('admin_notes') as string

  try {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return { error: 'Unauthorized' }

    // Check admin role
    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single()

    if (profile?.role !== 'admin') {
      return { error: 'Unauthorized' }
    }

    const updateData: any = {
      status,
      reviewed_by: user.id,
      reviewed_at: new Date().toISOString()
    }

    if (approvedAmount !== null) updateData.approved_amount = approvedAmount
    if (rejectionReason) updateData.rejection_reason = rejectionReason
    if (adminNotes) updateData.admin_notes = adminNotes

    if (status === 'settled') {
      updateData.settled_at = new Date().toISOString()
    }

    const { data, error } = await supabase
      .from('insurance_claims')
      .update(updateData)
      .eq('id', claimId)
      .select()
      .single()

    if (error) throw error

    revalidatePath('/admin/claims')
    revalidatePath('/customer/claims')
    revalidatePath('/helper/claims')
    return { success: true, claim: data }
  } catch (error: any) {
    logger.error('Update claim status error:', { error })
    return handleServerActionError(error)
  }
}

export async function getInsuranceClaims(filters?: { helperId?: string, customerId?: string, status?: string }) {
  const supabase = await createClient()

  try {
    let query = supabase
      .from('insurance_claims')
      .select(`
        *,
        policy:service_insurance(
          helper_id,
          provider_name,
          policy_number
        ),
        service_request:service_requests(
          title,
          status
        )
      `)

    if (filters?.status) {
      query = query.eq('status', filters.status)
    }

    const { data, error } = await query
      .order('created_at', { ascending: false })

    if (error) throw error

    return { success: true, claims: data }
  } catch (error: any) {
    logger.error('Get insurance claims error:', { error })
    return handleServerActionError(error)
  }
}

// ============================================
// GEOFENCE VIOLATIONS
// ============================================

export async function recordGeofenceViolation(formData: FormData) {
  const supabase = await createClient()
  
  const helperId = formData.get('helper_id') as string
  const serviceRequestId = formData.get('service_request_id') as string
  const expectedLatitude = parseFloat(formData.get('expected_latitude') as string)
  const expectedLongitude = parseFloat(formData.get('expected_longitude') as string)
  const actualLatitude = parseFloat(formData.get('actual_latitude') as string)
  const actualLongitude = parseFloat(formData.get('actual_longitude') as string)
  const distance = parseFloat(formData.get('distance') as string)

  try {
    const { data, error } = await supabase
      .from('geofence_violations')
      .insert({
        helper_id: helperId,
        service_request_id: serviceRequestId,
        expected_latitude: expectedLatitude,
        expected_longitude: expectedLongitude,
        actual_latitude: actualLatitude,
        actual_longitude: actualLongitude,
        distance_meters: distance,
        severity: distance > 1000 ? 'high' : distance > 500 ? 'medium' : 'low'
      })
      .select()
      .single()

    if (error) throw error

    // Update trust score
    await updateHelperTrustScore(helperId)

    revalidatePath('/admin/trust-safety')
    return { success: true, violation: data }
  } catch (error: any) {
    logger.error('Record geofence violation error:', { error })
    return handleServerActionError(error)
  }
}

export async function reviewGeofenceViolation(violationId: string, actionTaken: string, notes: string) {
  const supabase = await createClient()

  try {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return { error: 'Unauthorized' }

    // Check admin role
    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single()

    if (profile?.role !== 'admin') {
      return { error: 'Unauthorized' }
    }

    const { data, error } = await supabase
      .from('geofence_violations')
      .update({
        action_taken: actionTaken,
        admin_notes: notes,
        reviewed_by: user.id,
        reviewed_at: new Date().toISOString()
      })
      .eq('id', violationId)
      .select()
      .single()

    if (error) throw error

    revalidatePath('/admin/trust-safety')
    return { success: true, violation: data }
  } catch (error: any) {
    logger.error('Review geofence violation error:', { error })
    return handleServerActionError(error)
  }
}

export async function getHelperViolations(helperId: string) {
  const supabase = await createClient()

  try {
    const { data, error } = await supabase
      .from('geofence_violations')
      .select(`
        *,
        service_request:service_requests(
          title,
          status
        )
      `)
      .eq('helper_id', helperId)
      .order('created_at', { ascending: false })

    if (error) throw error

    return { success: true, violations: data }
  } catch (error: any) {
    logger.error('Get helper violations error:', { error })
    return handleServerActionError(error)
  }
}

// ============================================
// HELPER TRUST SCORES
// ============================================

export async function updateHelperTrustScore(helperId: string) {
  const supabase = await createClient()

  try {
    // Get background check status
    const { data: backgroundChecks } = await supabase
      .from('background_check_results')
      .select('status, check_type')
      .eq('helper_id', helperId)
      .eq('status', 'completed')

    const hasBackgroundCheck = backgroundChecks && backgroundChecks.length > 0
    const backgroundCheckScore = hasBackgroundCheck ? 20 : 0

    // Get insurance status
    const { data: insurance } = await supabase
      .from('service_insurance')
      .select('is_verified')
      .eq('helper_id', helperId)
      .eq('is_active', true)
      .eq('is_verified', true)
      .maybeSingle()

    const insuranceScore = insurance ? 15 : 0

    // Get verification documents
    const { count: verifiedDocsCount } = await supabase
      .from('verification_documents')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', helperId)
      .eq('verification_status', 'approved')

    const documentsScore = Math.min((verifiedDocsCount || 0) * 5, 15)

    // Get rating from helper_rating_summary
    const { data: ratingSummary } = await supabase
      .from('helper_rating_summary')
      .select('average_rating, total_reviews')
      .eq('helper_id', helperId)
      .maybeSingle()

    const ratingScore = ratingSummary ? (ratingSummary.average_rating * 4) : 0 // 0-20 points

    // Get violations (negative score)
    const { count: violationsCount } = await supabase
      .from('geofence_violations')
      .select('*', { count: 'exact', head: true })
      .eq('helper_id', helperId)

    const violationPenalty = Math.min((violationsCount || 0) * 5, 20)

    // Get completion rate from helper_statistics
    const { data: stats } = await supabase
      .from('helper_statistics')
      .select('completion_rate')
      .eq('helper_id', helperId)
      .maybeSingle()

    const completionScore = stats ? (stats.completion_rate * 0.2) : 0 // 0-20 points

    // Calculate total trust score (0-100)
    const totalScore = Math.min(
      Math.max(
        backgroundCheckScore +
        insuranceScore +
        documentsScore +
        ratingScore +
        completionScore -
        violationPenalty,
        0
      ),
      100
    )

    // Determine trust level
    let trustLevel: 'verified' | 'trusted' | 'standard' | 'new' | 'at_risk' = 'standard'
    if (totalScore >= 90) trustLevel = 'verified'
    else if (totalScore >= 70) trustLevel = 'trusted'
    else if (totalScore >= 50) trustLevel = 'standard'
    else if (totalScore >= 30) trustLevel = 'new'
    else trustLevel = 'at_risk'

    // Upsert trust score
    const { error } = await supabase
      .from('helper_trust_scores')
      .upsert({
        helper_id: helperId,
        trust_score: Math.round(totalScore * 100) / 100,
        trust_level: trustLevel,
        background_check_verified: hasBackgroundCheck,
        insurance_verified: !!insurance,
        documents_verified_count: verifiedDocsCount || 0,
        violation_count: violationsCount || 0
      }, {
        onConflict: 'helper_id'
      })

    if (error) throw error

    revalidatePath(`/helper/${helperId}`)
    revalidatePath('/admin/trust-safety')
    return { success: true, trustScore: totalScore, trustLevel }
  } catch (error: any) {
    logger.error('Update helper trust score error:', { error })
    return handleServerActionError(error)
  }
}

export async function getHelperTrustScore(helperId: string) {
  const supabase = await createClient()

  try {
    const { data, error } = await supabase
      .from('helper_trust_scores')
      .select('*')
      .eq('helper_id', helperId)
      .maybeSingle()

    if (error) throw error

    return { success: true, trustScore: data }
  } catch (error: any) {
    logger.error('Get helper trust score error:', { error })
    return handleServerActionError(error)
  }
}

export async function getAllTrustScores(filters?: { trustLevel?: string, minScore?: number }) {
  const supabase = await createClient()

  try {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return { error: 'Unauthorized' }

    // Check admin role
    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single()

    if (profile?.role !== 'admin') {
      return { error: 'Unauthorized' }
    }

    let query = supabase
      .from('helper_trust_scores')
      .select(`
        *,
        helper:profiles!helper_trust_scores_helper_id_fkey(
          full_name,
          email,
          phone
        )
      `)

    if (filters?.trustLevel) {
      query = query.eq('trust_level', filters.trustLevel)
    }

    if (filters?.minScore) {
      query = query.gte('trust_score', filters.minScore)
    }

    const { data, error } = await query
      .order('trust_score', { ascending: false })

    if (error) throw error

    return { success: true, trustScores: data }
  } catch (error: any) {
    logger.error('Get all trust scores error:', { error })
    return handleServerActionError(error)
  }
}
