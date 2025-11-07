'use server'
import { createClient } from '@/lib/supabase/server'

function adminCheck(role: any) { return role === 'admin' }

export async function approveWithdrawal(id: string) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: 'Not authenticated' };
  const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).single();
  if (!adminCheck((profile as any)?.role)) return { error: 'Unauthorized' };
  const { data, error } = await supabase.rpc('approve_withdrawal', { p_withdrawal_id: id } as any)
  if (error) return { error: error.message }
  return { data }
}

export async function updateWithdrawalStatus(id: string, status: string, failureReason?: string) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: 'Not authenticated' };
  const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).single();
  if (!adminCheck((profile as any)?.role)) return { error: 'Unauthorized' };
  const { data, error } = await supabase.rpc('update_withdrawal_status', { p_withdrawal_id: id, p_new_status: status, p_failure_reason: failureReason || null } as any)
  if (error) return { error: error.message }
  return { data }
}

export async function createCategory(name: string, slug: string, description?: string, parentId?: string) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: 'Not authenticated' };
  const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).single();
  if (!adminCheck((profile as any)?.role)) return { error: 'Unauthorized' };
  const { error } = await supabase.from('service_categories').insert({ name, slug, description: description || null, parent_id: parentId || null })
  if (error) return { error: error.message }
  return { success: true }
}

export async function toggleCategoryActive(id: string, active: boolean) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: 'Not authenticated' };
  const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).single();
  if (!adminCheck((profile as any)?.role)) return { error: 'Unauthorized' };
  const { error } = await supabase.from('service_categories').update({ is_active: active }).eq('id', id)
  if (error) return { error: error.message }
  return { success: true }
}

export async function approveHelper(userId: string) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: 'Not authenticated' };
  const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).single();
  if (!adminCheck((profile as any)?.role)) return { error: 'Unauthorized' };
  const { error } = await supabase.from('helper_profiles').update({ verification_status: 'approved' as any, is_approved: true }).eq('user_id', userId)
  if (error) return { error: error.message }
  return { success: true }
}
