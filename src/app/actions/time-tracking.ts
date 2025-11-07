'use server'
import { createClient } from '@/lib/supabase/server'

export async function startJob(requestId: string) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: 'Not authenticated' };
  const { data, error } = await supabase.rpc('start_job', { p_request_id: requestId } as any)
  if (error) return { error: error.message }
  return { data }
}

export async function recordArrival(requestId: string) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: 'Not authenticated' };
  const { data, error } = await supabase.rpc('record_arrival', { p_request_id: requestId } as any)
  if (error) return { error: error.message }
  return { data }
}

export async function completeJob(requestId: string) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: 'Not authenticated' };
  const { data, error } = await supabase.rpc('complete_job', { p_request_id: requestId } as any)
  if (error) return { error: error.message }
  return { data }
}

export async function getTimeline(requestId: string) {
  const supabase = await createClient();
  const { data, error } = await supabase.rpc('get_job_timeline', { p_request_id: requestId } as any)
  if (error) return { error: error.message }
  return { data }
}
