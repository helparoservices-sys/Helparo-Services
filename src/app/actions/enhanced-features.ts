'use server';

import { createClient } from '@/lib/supabase/server';
import { requireAuth } from '@/lib/auth-middleware';
import { UserRole } from '@/lib/constants';
import { handleServerActionError } from '@/lib/errors';
import { sanitizeText, sanitizeHTML } from '@/lib/sanitize';
import { rateLimit, RATE_LIMITS } from '@/lib/rate-limit';
import { logger } from '@/lib/logger';
import { revalidatePath } from 'next/cache';
import { validateFile, generateSafeFilename, ALLOWED_MIME_TYPES, FILE_SIZE_LIMITS } from '@/lib/file-validation';

// ============================================================================
// HELPER: Validate file by type category
// ============================================================================
function validateFileByType(file: File, type: keyof typeof ALLOWED_MIME_TYPES) {
  const validation = validateFile(file, ALLOWED_MIME_TYPES[type], FILE_SIZE_LIMITS[type] || FILE_SIZE_LIMITS.DOCUMENT);
  if (!validation.valid) {
    throw new Error(`File validation failed: ${validation.error}`);
  }
  return validation;
}

// ============================================================================
// REVIEWS & RATINGS
// ============================================================================

export async function submitReview(data: {
  requestId: string;
  rating: number;
  reviewText?: string;
  qualityRating?: number;
  timelinessRating?: number;
  professionalismRating?: number;
  valueRating?: number;
}) {
  try {
    const { user } = await requireAuth();
    await rateLimit('submit-review', user.id, RATE_LIMITS.CREATE_REVIEW);

    const safeReviewText = data.reviewText ? sanitizeHTML(data.reviewText) : undefined;
    const supabase = await createClient();

    const { data: result, error } = await supabase.rpc('submit_review', {
      p_request_id: data.requestId,
      p_rating: data.rating,
      p_review_text: safeReviewText,
      p_quality: data.qualityRating,
      p_timeliness: data.timelinessRating,
      p_professionalism: data.professionalismRating,
      p_value_rating: data.valueRating,
    } as any);

    if (error) throw error;

    revalidatePath('/customer/bookings');
    logger.info('Review submitted', { userId: user.id, requestId: data.requestId });
    return { reviewId: result };
  } catch (error: any) {
    logger.error('Submit review error', { error });
    return handleServerActionError(error);
  }
}

export async function respondToReview(reviewId: string, response: string) {
  try {
    const { user } = await requireAuth(UserRole.HELPER);
    await rateLimit('respond-review', user.id, RATE_LIMITS.API_MODERATE);

    const safeResponse = sanitizeHTML(response);
    const supabase = await createClient();

    const { data, error } = await supabase.rpc('respond_to_review', {
      p_review_id: reviewId,
      p_response: safeResponse,
    } as any);

    if (error) throw error;

    revalidatePath('/helper/reviews');
    logger.info('Review response added', { userId: user.id, reviewId });
    return { success: data };
  } catch (error: any) {
    logger.error('Respond to review error', { error });
    return handleServerActionError(error);
  }
}

export async function getHelperReviews(
  helperId: string,
  limit = 10,
  offset = 0
) {
  try {
    await rateLimit('get-helper-reviews', helperId, RATE_LIMITS.API_RELAXED);
    
    const supabase = await createClient();
    const { data, error } = await supabase.rpc('get_helper_reviews', {
      p_helper_id: helperId,
      p_limit: limit,
      p_offset: offset,
    } as any);

    if (error) throw error;
    return data;
  } catch (error: any) {
    logger.error('Get helper reviews error', { error, helperId });
    return handleServerActionError(error);
  }
}

export async function uploadReviewPhotos(reviewId: string, files: File[]) {
  try {
    const { user } = await requireAuth();
    await rateLimit('upload-review-photos', user.id, RATE_LIMITS.API_MODERATE);

    const supabase = await createClient();
    const photoUrls: string[] = [];

    for (const file of files) {
      // ✅ VALIDATE FILE
      validateFileByType(file, 'IMAGE');

      const safeFilename = generateSafeFilename(file.type);
      const fileName = `${reviewId}/${safeFilename}`;
      
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('review-photos')
        .upload(fileName, file);

      if (uploadError) throw uploadError;

      const { data: urlData } = supabase.storage
        .from('review-photos')
        .getPublicUrl(fileName);

      photoUrls.push(urlData.publicUrl);

      await supabase.from('review_photos').insert({
        review_id: reviewId,
        photo_url: urlData.publicUrl,
      });
    }

    logger.info('Review photos uploaded', { userId: user.id, reviewId, count: files.length });
    return photoUrls;
  } catch (error: any) {
    logger.error('Upload review photos error', { error });
    return handleServerActionError(error);
  }
}

// ============================================================================
// SMART MATCHING
// ============================================================================

export async function findBestHelpers(data: {
  latitude: number;
  longitude: number;
  serviceId: string;
  maxDistanceKm?: number;
  limit?: number;
}) {
  try {
    await rateLimit('find-helpers', 'anonymous', RATE_LIMITS.API_MODERATE);
    
    const supabase = await createClient();
    const { data: helpers, error } = await supabase.rpc('find_best_helpers', {
      p_latitude: data.latitude,
      p_longitude: data.longitude,
      p_service_id: data.serviceId,
      p_max_distance_km: data.maxDistanceKm || 10,
      p_limit: data.limit || 10,
    } as any);

    if (error) throw error;
    return helpers;
  } catch (error: any) {
    logger.error('Find best helpers error', { error });
    return handleServerActionError(error);
  }
}

export async function addHelperSpecialization(data: {
  serviceId: string;
  experienceYears?: number;
  certificationUrl?: string;
}) {
  try {
    const { user } = await requireAuth(UserRole.HELPER);
    await rateLimit('add-specialization', user.id, RATE_LIMITS.API_MODERATE);

    const supabase = await createClient();
    const { data: specialization, error } = await supabase
      .from('helper_specializations')
      .insert({
        helper_id: user.id,
        service_id: data.serviceId,
        experience_years: data.experienceYears || 0,
        certification_url: data.certificationUrl,
      })
      .select()
      .single();

    if (error) throw error;

    revalidatePath('/helper/profile');
    logger.info('Helper specialization added', { userId: user.id, serviceId: data.serviceId });
    return specialization;
  } catch (error: any) {
    logger.error('Add helper specialization error', { error });
    return handleServerActionError(error);
  }
}

// ============================================================================
// GAMIFICATION
// ============================================================================

export async function getUserGamificationSummary() {
  try {
    const { user } = await requireAuth();
    await rateLimit('get-gamification-summary', user.id, RATE_LIMITS.API_RELAXED);

    const supabase = await createClient();
    const { data, error } = await supabase.rpc(
      'get_user_gamification_summary',
      { p_user_id: user.id } as any
    );

    if (error) throw error;
    return data[0];
  } catch (error: any) {
    logger.error('Get gamification summary error', { error });
    return handleServerActionError(error);
  }
}

export async function getUserBadges(userId?: string) {
  try {
    const supabase = await createClient();
    let targetUserId = userId;
    
    if (!userId) {
      const { user } = await requireAuth();
      targetUserId = user.id;
    }

    await rateLimit('get-user-badges', targetUserId!, RATE_LIMITS.API_RELAXED);

    const { data, error } = await supabase
      .from('user_badges')
      .select('*, badge_definitions (*)')
      .eq('user_id', targetUserId)
      .order('earned_at', { ascending: false });

    if (error) throw error;
    return data;
  } catch (error: any) {
    logger.error('Get user badges error', { error });
    return handleServerActionError(error);
  }
}

export async function getUserAchievements(userId?: string) {
  try {
    const supabase = await createClient();
    let targetUserId = userId;
    
    if (!userId) {
      const { user } = await requireAuth();
      targetUserId = user.id;
    }

    await rateLimit('get-user-achievements', targetUserId!, RATE_LIMITS.API_RELAXED);

    const { data, error } = await supabase
      .from('user_achievements')
      .select('*, achievements (*)')
      .eq('user_id', targetUserId)
      .order('earned_at', { ascending: false });

    if (error) throw error;
    return data;
  } catch (error: any) {
    logger.error('Get user achievements error', { error });
    return handleServerActionError(error);
  }
}

export async function getLoyaltyPoints() {
  try {
    const { user } = await requireAuth();
    await rateLimit('get-loyalty-points', user.id, RATE_LIMITS.API_RELAXED);

    const supabase = await createClient();
    const { data, error } = await supabase
      .from('loyalty_points')
      .select('id, user_id, points_balance, tier_level, current_balance, lifetime_earned')
      .eq('user_id', user.id)
      .single();

    if (error && error.code !== 'PGRST116') throw error;
    return data || { points_balance: 0, tier_level: 'bronze' };
  } catch (error: any) {
    logger.error('Get loyalty points error', { error });
    return handleServerActionError(error);
  }
}

export async function redeemLoyaltyPoints(points: number, description: string) {
  try {
    const { user } = await requireAuth();
    await rateLimit('redeem-loyalty-points', user.id, RATE_LIMITS.PAYMENT_ACTION);

    const safeDescription = sanitizeText(description);
    const supabase = await createClient();

    const { data, error } = await supabase.rpc('redeem_loyalty_points', {
      p_user_id: user.id,
      p_points: points,
      p_description: safeDescription,
    } as any);

    if (error) throw error;

    revalidatePath('/customer/rewards');
    logger.info('Loyalty points redeemed', { userId: user.id, points });
    return { success: data };
  } catch (error: any) {
    logger.error('Redeem loyalty points error', { error });
    return handleServerActionError(error);
  }
}

export async function getHelperLeaderboard(limit = 50) {
  try {
    await rateLimit('get-leaderboard', 'anonymous', RATE_LIMITS.API_RELAXED);

    const supabase = await createClient();
    const { data, error } = await supabase.rpc('get_helper_leaderboard', {
      p_limit: limit,
    } as any);

    if (error) throw error;
    return data;
  } catch (error: any) {
    logger.error('Get helper leaderboard error', { error });
    return handleServerActionError(error);
  }
}

// ============================================================================
// BUNDLES & CAMPAIGNS
// ============================================================================

export async function getActiveBundles() {
  try {
    await rateLimit('get-active-bundles', 'anonymous', RATE_LIMITS.API_RELAXED);

    const supabase = await createClient();
    const { data, error } = await supabase.rpc('get_active_bundles' as any);

    if (error) throw error;
    return data;
  } catch (error: any) {
    logger.error('Get active bundles error', { error });
    return handleServerActionError(error);
  }
}

export async function getBundleDetails(bundleId: string) {
  try {
    await rateLimit('get-bundle-details', bundleId, RATE_LIMITS.API_RELAXED);

    const supabase = await createClient();
    const { data, error } = await supabase.rpc('get_bundle_details', {
      p_bundle_id: bundleId,
    } as any);

    if (error) throw error;
    return data;
  } catch (error: any) {
    logger.error('Get bundle details error', { error });
    return handleServerActionError(error);
  }
}

export async function purchaseBundle(bundleId: string, paymentId: string) {
  try {
    const { user } = await requireAuth();
    await rateLimit('purchase-bundle', user.id, RATE_LIMITS.PAYMENT_ACTION);

    const supabase = await createClient();
    const { data, error } = await supabase.rpc('purchase_bundle', {
      p_bundle_id: bundleId,
      p_payment_id: paymentId,
    } as any);

    if (error) throw error;

    revalidatePath('/customer/bundles');
    logger.info('Bundle purchased', { userId: user.id, bundleId });
    return { success: data };
  } catch (error: any) {
    logger.error('Purchase bundle error', { error });
    return handleServerActionError(error);
  }
}

export async function getActiveCampaigns(serviceId?: string) {
  try {
    await rateLimit('get-active-campaigns', serviceId || 'anonymous', RATE_LIMITS.API_RELAXED);

    const supabase = await createClient();
    const { data, error } = await supabase.rpc('get_active_campaigns', {
      p_service_id: serviceId || null,
    } as any);

    if (error) throw error;
    return data;
  } catch (error: any) {
    logger.error('Get active campaigns error', { error });
    return handleServerActionError(error);
  }
}

// ============================================================================
// BACKGROUND CHECKS & TRUST/SAFETY
// ============================================================================

export async function submitBackgroundCheck(checkType: string) {
  try {
    const { user } = await requireAuth(UserRole.HELPER);
    await rateLimit('submit-background-check', user.id, RATE_LIMITS.API_MODERATE);

    const safeCheckType = sanitizeText(checkType);
    const supabase = await createClient();

    const { data, error } = await supabase.rpc('submit_background_check', {
      p_helper_id: user.id,
      p_check_type: safeCheckType,
    } as any);

    if (error) throw error;

    logger.info('Background check submitted', { userId: user.id, checkType: safeCheckType });
    return { checkId: data };
  } catch (error: any) {
    logger.error('Submit background check error', { error });
    return handleServerActionError(error);
  }
}

export async function uploadVerificationDocument(data: {
  documentType: string;
  file: File;
  expiryDate?: string;
}) {
  try {
    const { user } = await requireAuth(UserRole.HELPER);
    await rateLimit('upload-verification-doc', user.id, RATE_LIMITS.API_MODERATE);

    // ✅ VALIDATE FILE
    validateFileByType(data.file, 'VERIFICATION');

    const safeDocumentType = sanitizeText(data.documentType);
    const supabase = await createClient();

    const safeFilename = generateSafeFilename(data.file.type);
    const fileName = `${user.id}/${safeFilename}`;
    
    const { data: uploadData, error: uploadError } = await supabase.storage
      .from('verification-documents')
      .upload(fileName, data.file);

    if (uploadError) throw uploadError;

    const { data: urlData } = supabase.storage
      .from('verification-documents')
      .getPublicUrl(fileName);

    const { data: insertData, error: insertError } = await supabase
      .from('verification_documents')
      .insert({
        helper_id: user.id,
        document_type: safeDocumentType,
        document_url: urlData.publicUrl,
        expiry_date: data.expiryDate || null,
        status: 'pending',
      })
      .select()
      .single();

    if (insertError) throw insertError;

    logger.info('Verification document uploaded', { userId: user.id, documentType: safeDocumentType });
    return insertData;
  } catch (error: any) {
    logger.error('Upload verification document error', { error });
    return handleServerActionError(error);
  }
}

export async function getHelperTrustScore(helperId: string) {
  try {
    await rateLimit('get-trust-score', helperId, RATE_LIMITS.API_RELAXED);

    const supabase = await createClient();
    const { data, error } = await supabase.rpc('get_helper_trust_score', {
      p_helper_id: helperId,
    } as any);

    if (error) throw error;
    return data;
  } catch (error: any) {
    logger.error('Get helper trust score error', { error });
    return handleServerActionError(error);
  }
}

export async function submitInsuranceClaim(data: {
  requestId: string;
  claimType: string;
  claimAmount: number;
  description: string;
  evidence: File[];
}) {
  try {
    const { user } = await requireAuth();
    await rateLimit('submit-insurance-claim', user.id, RATE_LIMITS.API_STRICT);

    const safeClaimType = sanitizeText(data.claimType);
    const safeDescription = sanitizeText(data.description);
    const supabase = await createClient();

    const evidenceUrls: string[] = [];
    for (const file of data.evidence) {
      // ✅ VALIDATE FILE
      validateFileByType(file, 'DOCUMENT');

      const safeFilename = generateSafeFilename(file.type);
      const fileName = `${data.requestId}/${safeFilename}`;
      
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('insurance-claims')
        .upload(fileName, file);

      if (uploadError) throw uploadError;

      const { data: urlData } = supabase.storage
        .from('insurance-claims')
        .getPublicUrl(fileName);

      evidenceUrls.push(urlData.publicUrl);
    }

    const { data: claimData, error } = await supabase.rpc('submit_insurance_claim', {
      p_request_id: data.requestId,
      p_claim_type: safeClaimType,
      p_claim_amount: data.claimAmount,
      p_description: safeDescription,
      p_evidence_urls: evidenceUrls,
    } as any);

    if (error) throw error;

    logger.info('Insurance claim submitted', { userId: user.id, requestId: data.requestId, claimAmount: data.claimAmount });
    return { claimId: claimData };
  } catch (error: any) {
    logger.error('Submit insurance claim error', { error });
    return handleServerActionError(error);
  }
}
