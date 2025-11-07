'use server'
import { createClient } from '@/lib/supabase/server'

export async function validatePromo(code: string, requestId?: string) {
  const supabase = await createClient();
  const { data, error } = await supabase.rpc('validate_promo_code', { p_code: code, p_request_id: requestId || null } as any)
  if (error) return { error: error.message }
  return { data }
}

export async function applyPromo(code: string, requestId?: string) {
  const supabase = await createClient();
  const { data, error } = await supabase.rpc('apply_promo_code', { p_code: code, p_request_id: requestId || null } as any)
  if (error) return { error: error.message }
  return { data }
}

export async function generateReferralCode() {
  const supabase = await createClient();
  const { data, error } = await supabase.rpc('generate_referral_code')
  if (error) return { error: error.message }
  return { data }
}

export async function convertReferral(code: string) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: 'Not authenticated' };
  const { data, error } = await supabase.rpc('convert_referral', { p_referral_code: code } as any)
  if (error) return { error: error.message }
  return { data }
}
