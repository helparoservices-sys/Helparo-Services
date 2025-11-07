'use server'
import { createClient } from '@/lib/supabase/server'

export async function createSOS(alertType: string, lat: number, lng: number, description: string) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: 'Not authenticated' };
  const { data, error } = await supabase.rpc('create_sos_alert', { p_alert_type: alertType, p_latitude: lat, p_longitude: lng, p_description: description } as any)
  if (error) return { error: error.message }
  return { data }
}

export async function acknowledgeSOS(alertId: string) {
  const supabase = await createClient();
  const { data, error } = await supabase.rpc('acknowledge_sos_alert', { p_alert_id: alertId } as any)
  if (error) return { error: error.message }
  return { data }
}

export async function resolveSOS(alertId: string, resolutionNote?: string, falseAlarm?: boolean) {
  const supabase = await createClient();
  const { data, error } = await supabase.rpc('resolve_sos_alert', { p_alert_id: alertId, p_resolution_note: resolutionNote || null, p_is_false_alarm: !!falseAlarm } as any)
  if (error) return { error: error.message }
  return { data }
}

export async function cancelSOS(alertId: string, reason?: string) {
  const supabase = await createClient();
  const { data, error } = await supabase.rpc('cancel_sos_alert', { p_alert_id: alertId, p_reason: reason || null } as any)
  if (error) return { error: error.message }
  return { data }
}
