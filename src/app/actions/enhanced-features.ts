'use server';

import { createClient } from '@/lib/supabase/server';
import { revalidatePath } from 'next/cache';

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
  const supabase = await createClient();

  const { data: result, error } = await supabase.rpc('submit_review', {
    p_request_id: data.requestId,
    p_rating: data.rating,
    p_review_text: data.reviewText,
    p_quality: data.qualityRating,
    p_timeliness: data.timelinessRating,
    p_professionalism: data.professionalismRating,
    p_value_rating: data.valueRating,
  } as any);

  if (error) throw new Error(error.message);

  revalidatePath('/customer/bookings');
  return { reviewId: result };
}

export async function respondToReview(reviewId: string, response: string) {
  const supabase = await createClient();

  const { data, error } = await supabase.rpc('respond_to_review', {
    p_review_id: reviewId,
    p_response: response,
  } as any);

  if (error) throw new Error(error.message);

  revalidatePath('/helper/reviews');
  return { success: data };
}

export async function getHelperReviews(
  helperId: string,
  limit = 10,
  offset = 0
) {
  const supabase = await createClient();

  const { data, error } = await supabase.rpc('get_helper_reviews', {
    p_helper_id: helperId,
    p_limit: limit,
    p_offset: offset,
  } as any);

  if (error) throw new Error(error.message);
  return data;
}

export async function uploadReviewPhotos(reviewId: string, files: File[]) {
  const supabase = await createClient();

  const photoUrls: string[] = [];

  for (const file of files) {
    const fileName = `${reviewId}/${Date.now()}-${file.name}`;
    const { data: uploadData, error: uploadError } = await supabase.storage
      .from('review-photos')
      .upload(fileName, file);

    if (uploadError) throw new Error(uploadError.message);

    const { data: urlData } = supabase.storage
      .from('review-photos')
      .getPublicUrl(fileName);

    photoUrls.push(urlData.publicUrl);

    // Insert photo record
    await supabase.from('review_photos').insert({
      review_id: reviewId,
      photo_url: urlData.publicUrl,
    });
  }

  return photoUrls;
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
  const supabase = await createClient();

  const { data: helpers, error } = await supabase.rpc('find_best_helpers', {
    p_latitude: data.latitude,
    p_longitude: data.longitude,
    p_service_id: data.serviceId,
    p_max_distance_km: data.maxDistanceKm || 10,
    p_limit: data.limit || 10,
  } as any);

  if (error) throw new Error(error.message);
  return helpers;
}

export async function addHelperSpecialization(data: {
  serviceId: string;
  experienceYears?: number;
  certificationUrl?: string;
}) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) throw new Error('Not authenticated');

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

  if (error) throw new Error(error.message);

  revalidatePath('/helper/profile');
  return specialization;
}

// ============================================================================
// GAMIFICATION
// ============================================================================

export async function getUserGamificationSummary() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) throw new Error('Not authenticated');

  const { data, error } = await supabase.rpc(
    'get_user_gamification_summary',
    {
      p_user_id: user.id,
    } as any
  );

  if (error) throw new Error(error.message);
  return data[0];
}

export async function getUserBadges(userId?: string) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const targetUserId = userId || user?.id;

  const { data, error } = await supabase
    .from('user_badges')
    .select(
      `
      *,
      badge_definitions (*)
    `
    )
    .eq('user_id', targetUserId)
    .order('earned_at', { ascending: false });

  if (error) throw new Error(error.message);
  return data;
}

export async function getUserAchievements(userId?: string) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const targetUserId = userId || user?.id;

  const { data, error } = await supabase
    .from('user_achievements')
    .select(
      `
      *,
      achievements (*)
    `
    )
    .eq('user_id', targetUserId)
    .order('earned_at', { ascending: false });

  if (error) throw new Error(error.message);
  return data;
}

export async function getLoyaltyPoints() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) throw new Error('Not authenticated');

  const { data, error } = await supabase
    .from('loyalty_points')
    .select('*')
    .eq('user_id', user.id)
    .single();

  if (error && error.code !== 'PGRST116') throw new Error(error.message);
  return data || { points_balance: 0, tier_level: 'bronze' };
}

export async function redeemLoyaltyPoints(points: number, description: string) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) throw new Error('Not authenticated');

  const { data, error } = await supabase.rpc('redeem_loyalty_points', {
    p_user_id: user.id,
    p_points: points,
    p_description: description,
  } as any);

  if (error) throw new Error(error.message);

  revalidatePath('/customer/rewards');
  return { success: data };
}

export async function getHelperLeaderboard(limit = 50) {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from('helper_leaderboard')
    .select('*')
    .limit(limit);

  if (error) throw new Error(error.message);
  return data;
}

// ============================================================================
// BUNDLES & CAMPAIGNS
// ============================================================================

export async function getActiveBundles() {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from('service_bundles')
    .select('*')
    .eq('is_active', true)
    .order('created_at', { ascending: false });

  if (error) throw new Error(error.message);
  return data;
}

export async function getBundleDetails(bundleId: string) {
  const supabase = await createClient();

  const { data, error } = await supabase.rpc('get_bundle_details', {
    p_bundle_id: bundleId,
  } as any);

  if (error) throw new Error(error.message);
  return data;
}

export async function purchaseBundle(bundleId: string, paymentId: string) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) throw new Error('Not authenticated');

  const { data, error } = await supabase.rpc('purchase_bundle', {
    p_bundle_id: bundleId,
    p_customer_id: user.id,
    p_payment_id: paymentId,
  } as any);

  if (error) throw new Error(error.message);

  revalidatePath('/customer/bundles');
  return { purchaseId: data };
}

export async function getActiveCampaigns(serviceId?: string) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (serviceId) {
    const { data, error } = await supabase.rpc(
      'get_active_campaigns_for_service',
      {
        p_service_id: serviceId,
        p_user_id: user?.id,
      } as any
    );

    if (error) throw new Error(error.message);
    return data;
  }

  const now = new Date().toISOString();
  const { data, error } = await supabase
    .from('seasonal_campaigns')
    .select('*')
    .eq('is_active', true)
    .lte('start_date', now)
    .gte('end_date', now)
    .order('discount_value', { ascending: false });

  if (error) throw new Error(error.message);
  return data;
}

// ============================================================================
// BACKGROUND CHECKS & TRUST/SAFETY
// ============================================================================

export async function submitBackgroundCheck(checkType: string) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) throw new Error('Not authenticated');

  const { data, error } = await supabase.rpc('submit_background_check', {
    p_helper_id: user.id,
    p_check_type: checkType,
  } as any);

  if (error) throw new Error(error.message);

  revalidatePath('/helper/verification');
  return { checkId: data };
}

export async function uploadVerificationDocument(data: {
  documentType: string;
  documentNumber: string;
  frontFile: File;
  backFile?: File;
  selfieFile?: File;
}) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) throw new Error('Not authenticated');

  // Upload front document
  const frontFileName = `${user.id}/${data.documentType}/${Date.now()}-front.jpg`;
  const { data: frontUpload, error: frontError } = await supabase.storage
    .from('verification-documents')
    .upload(frontFileName, data.frontFile);

  if (frontError) throw new Error(frontError.message);

  const { data: frontUrl } = supabase.storage
    .from('verification-documents')
    .getPublicUrl(frontFileName);

  let backUrl = null;
  if (data.backFile) {
    const backFileName = `${user.id}/${data.documentType}/${Date.now()}-back.jpg`;
    const { error: backError } = await supabase.storage
      .from('verification-documents')
      .upload(backFileName, data.backFile);

    if (backError) throw new Error(backError.message);

    const { data: backUrlData } = supabase.storage
      .from('verification-documents')
      .getPublicUrl(backFileName);
    backUrl = backUrlData.publicUrl;
  }

  let selfieUrl = null;
  if (data.selfieFile) {
    const selfieFileName = `${user.id}/${data.documentType}/${Date.now()}-selfie.jpg`;
    const { error: selfieError } = await supabase.storage
      .from('verification-documents')
      .upload(selfieFileName, data.selfieFile);

    if (selfieError) throw new Error(selfieError.message);

    const { data: selfieUrlData } = supabase.storage
      .from('verification-documents')
      .getPublicUrl(selfieFileName);
    selfieUrl = selfieUrlData.publicUrl;
  }

  // Insert document record
  const { data: document, error: insertError } = await supabase
    .from('verification_documents')
    .insert({
      helper_id: user.id,
      document_type: data.documentType,
      document_number: data.documentNumber,
      document_url: frontUrl.publicUrl,
      back_side_url: backUrl,
      selfie_url: selfieUrl,
      status: 'pending',
    })
    .select()
    .single();

  if (insertError) throw new Error(insertError.message);

  revalidatePath('/helper/verification');
  return document;
}

export async function getHelperTrustScore(helperId: string) {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from('helper_trust_scores')
    .select('*')
    .eq('helper_id', helperId)
    .single();

  if (error && error.code !== 'PGRST116') throw new Error(error.message);
  return data || { overall_score: 0 };
}

export async function submitInsuranceClaim(data: {
  insuranceId: string;
  claimType: string;
  claimAmount: number;
  description: string;
  evidenceFiles: File[];
}) {
  const supabase = await createClient();

  // Upload evidence files
  const evidenceUrls: string[] = [];
  for (const file of data.evidenceFiles) {
    const fileName = `claims/${data.insuranceId}/${Date.now()}-${file.name}`;
    const { error: uploadError } = await supabase.storage
      .from('insurance-evidence')
      .upload(fileName, file);

    if (uploadError) throw new Error(uploadError.message);

    const { data: urlData } = supabase.storage
      .from('insurance-evidence')
      .getPublicUrl(fileName);

    evidenceUrls.push(urlData.publicUrl);
  }

  // Insert claim
  const { data: claim, error } = await supabase
    .from('insurance_claims')
    .insert({
      insurance_id: data.insuranceId,
      claim_type: data.claimType,
      claim_amount: data.claimAmount,
      description: data.description,
      evidence_urls: evidenceUrls,
      status: 'submitted',
    })
    .select()
    .single();

  if (error) throw new Error(error.message);

  revalidatePath('/customer/insurance');
  return claim;
}
