'use server'
import { createClient } from '@/lib/supabase/server'

export async function subscribeHelper(planId: string) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: 'Not authenticated' };
  const { data, error } = await supabase.rpc('subscribe_helper', { p_plan_id: planId } as any)
  if (error) return { error: error.message }
  return { data }
}

export async function cancelSubscription() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: 'Not authenticated' };
  const { data, error } = await supabase.rpc('cancel_subscription')
  if (error) return { error: error.message }
  return { data }
}

export async function getSubscriptionStatus() {
  const supabase = await createClient();
  const { data, error } = await supabase.rpc('get_helper_subscription_status')
  if (error) return { error: error.message }
  return { data }
}
