'use server'
import { createClient } from '@/lib/supabase/server'

export async function registerDevice(token: string, platform: string) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: 'Not authenticated' };
  const { data, error } = await supabase.rpc('register_device_token', { p_device_token: token, p_platform: platform } as any)
  if (error) return { error: error.message }
  return { data }
}

export async function setNotificationPref(channel: string, enabled: boolean) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: 'Not authenticated' };
  const { data, error } = await supabase.rpc('set_notification_pref', { p_channel: channel, p_enabled: enabled } as any)
  if (error) return { error: error.message }
  return { data }
}

export async function markNotificationRead(id: string) {
  const supabase = await createClient();
  const { data, error } = await supabase.rpc('mark_notification_read', { p_notification_id: id } as any)
  if (error) return { error: error.message }
  return { data }
}
