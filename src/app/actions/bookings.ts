"use server"

import { createClient } from '@/lib/supabase/server'

export async function assignHelper(requestId: string, helperId: string) {
  const supabase = await createClient()
  const { error } = await supabase
    .from('service_requests')
    .update({ assigned_helper_id: helperId, status: 'assigned', assigned_at: new Date().toISOString() })
    .eq('id', requestId)
  if (error) return { error: error.message }
  return { success: true }
}

export async function updateBookingStatus(requestId: string, status: 'open' | 'assigned' | 'completed' | 'cancelled') {
  const supabase = await createClient()
  const payload: any = { status }
  if (status === 'completed') payload.job_completed_at = new Date().toISOString()
  const { error } = await supabase
    .from('service_requests')
    .update(payload)
    .eq('id', requestId)
  if (error) return { error: error.message }
  return { success: true }
}
