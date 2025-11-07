'use server'
import { createClient } from '@/lib/supabase/server'

export async function counterOffer(applicationId: string, newAmount: number, note?: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Not authenticated' }
  const { data, error } = await supabase.rpc('counter_offer_bid', { p_application_id: applicationId, p_new_amount: newAmount, p_note: note || null } as any)
  if (error) return { error: error.message }
  return { data }
}

export async function acceptBid(applicationId: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Not authenticated' }
  const { data, error } = await supabase.rpc('accept_bid', { p_application_id: applicationId } as any)
  if (error) return { error: error.message }
  return { data }
}

export async function rejectBid(applicationId: string, reason?: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Not authenticated' }
  const { data, error } = await supabase.rpc('reject_bid', { p_application_id: applicationId, p_reason: reason || null } as any)
  if (error) return { error: error.message }
  return { data }
}

export async function withdrawBid(applicationId: string, reason?: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Not authenticated' }
  const { data, error } = await supabase.rpc('withdraw_bid', { p_application_id: applicationId, p_reason: reason || null } as any)
  if (error) return { error: error.message }
  return { data }
}

export async function getBidStats(requestId: string) {
  const supabase = await createClient()
  const { data: stats, error } = await supabase.rpc('get_bid_statistics', { p_request_id: requestId } as any)
  if (error) return { error: error.message }
  return { data: stats }
}
