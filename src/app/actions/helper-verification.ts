'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import { requireAuth } from '@/lib/auth-middleware'
import { validateFile, ALLOWED_MIME_TYPES, FILE_SIZE_LIMITS } from '@/lib/file-validation'
import { rateLimit, RATE_LIMITS } from '@/lib/rate-limit'
import { UserRole } from '@/lib/constants'
import { logger } from '@/lib/logger'

export async function getVerificationStatus() {
  try {
    const { user } = await requireAuth(UserRole.HELPER)
    const supabase = await createClient()

    const { data: helperProfile } = await supabase
      .from('helper_profiles')
      .select('verification_status, is_approved')
      .eq('user_id', user.id)
      .maybeSingle()

    const { data: documents } = await supabase
      .from('verification_documents')
      .select('doc_type, status, created_at')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })

    return {
      data: {
        status: helperProfile?.verification_status || 'not_started',
        is_approved: helperProfile?.is_approved || false,
        documents: (documents || []).map(d => ({
          doc_type: d.doc_type,
          status: d.status,
          uploaded_at: d.created_at,
        })),
      },
    }
  } catch (error) {
    logger.error('Get verification status error', { error })
    return { error: 'An unexpected error occurred' }
  }
}

export async function uploadVerificationDocuments(formData: FormData) {
  try {
    const { user } = await requireAuth(UserRole.HELPER)
    await rateLimit('upload-verification', user.id, RATE_LIMITS.API_RELAXED)

    const supabase = await createClient()

    const idFront = formData.get('id_front') as File
    const idBack = formData.get('id_back') as File | null
    const selfie = formData.get('selfie') as File

    if (!idFront || !selfie) {
      return { error: 'ID front and selfie are required' }
    }

    // Validate files
    const validation1 = validateFile(idFront, ALLOWED_MIME_TYPES.VERIFICATION, FILE_SIZE_LIMITS.DOCUMENT)
    if (!validation1.valid) return { error: validation1.error }

    const validation2 = validateFile(selfie, ALLOWED_MIME_TYPES.VERIFICATION, FILE_SIZE_LIMITS.DOCUMENT)
    if (!validation2.valid) return { error: validation2.error }

    if (idBack) {
      const validation3 = validateFile(idBack, ALLOWED_MIME_TYPES.VERIFICATION, FILE_SIZE_LIMITS.DOCUMENT)
      if (!validation3.valid) return { error: validation3.error }
    }

    // Upload files to storage
    const uploadFile = async (file: File, docType: string, sanitizedName: string) => {
      const path = `${user.id}/${sanitizedName}`
      const { error: uploadError } = await supabase.storage
        .from('kyc')
        .upload(path, file, { cacheControl: '3600', upsert: false })

      if (uploadError) throw uploadError

      const { error: insertError } = await supabase
        .from('verification_documents')
        .insert({
          user_id: user.id,
          doc_type: docType,
          file_path: path,
          file_size: file.size,
          mime_type: file.type,
          original_filename: file.name,
          status: 'pending',
        })

      if (insertError) throw insertError
    }

    await uploadFile(idFront, 'id_front', validation1.sanitizedName!)
    if (idBack) await uploadFile(idBack, 'id_back', validateFile(idBack, ALLOWED_MIME_TYPES.VERIFICATION, FILE_SIZE_LIMITS.DOCUMENT).sanitizedName!)
    await uploadFile(selfie, 'selfie', validation2.sanitizedName!)

    // Update helper profile
    await supabase
      .from('helper_profiles')
      .upsert({
        user_id: user.id,
        verification_status: 'pending',
        is_approved: false,
      }, { onConflict: 'user_id' })

    logger.info('Verification documents uploaded', { user_id: user.id })
    revalidatePath('/helper/verification')

    return { success: true }
  } catch (error) {
    logger.error('Upload verification documents error', { error })
    return { error: 'Failed to upload documents' }
  }
}

// Onboarding document upload (maps onboarding doc keys to existing verification types)
// Accepts: id_proof (-> id_front), photo (-> selfie), professional_cert (-> certificate optional), address_proof (-> other optional)
export async function uploadOnboardingDocuments(formData: FormData) {
  try {
    const { user } = await requireAuth(UserRole.HELPER)
    await rateLimit('upload-verification', user.id, RATE_LIMITS.API_RELAXED)

    const supabase = await createClient()

    const idProof = formData.get('id_proof') as File | null
    const selfie = formData.get('photo') as File | null
    const cert = formData.get('professional_cert') as File | null
    const addrProof = formData.get('address_proof') as File | null

    if (!idProof || !selfie) {
      return { error: 'ID proof and profile photo are required' }
    }

    // Helper to validate & upload
    const processFile = async (file: File, mappedType: string) => {
      const validation = validateFile(file, ALLOWED_MIME_TYPES.VERIFICATION, FILE_SIZE_LIMITS.DOCUMENT)
      if (!validation.valid) throw new Error(validation.error || 'Invalid file')
      const path = `${user.id}/${validation.sanitizedName}`
      const { error: uploadError } = await supabase.storage
        .from('kyc')
        .upload(path, file, { cacheControl: '3600', upsert: false })
      if (uploadError) throw uploadError
      const { error: insertError } = await supabase
        .from('verification_documents')
        .insert({
          user_id: user.id,
          doc_type: mappedType,
          file_path: path,
        })
      if (insertError) throw insertError
    }

    await processFile(idProof, 'id_front')
    await processFile(selfie, 'selfie')
    if (cert) await processFile(cert, 'certificate')
    if (addrProof) await processFile(addrProof, 'other')

    // Update profile verification status (pending review)
    await supabase
      .from('helper_profiles')
      .upsert({
        user_id: user.id,
        verification_status: 'pending',
        is_approved: false,
      }, { onConflict: 'user_id' })

    logger.info('Onboarding documents uploaded', { user_id: user.id })
    revalidatePath('/helper/verification')
    return { success: true }
  } catch (error) {
    logger.error('Upload onboarding documents error', { error })
    return { error: 'Failed to upload onboarding documents' }
  }
}
