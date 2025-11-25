'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import { requireAuth } from '@/lib/auth-middleware'
import { UserRole } from '@/lib/constants'
import { logger } from '@/lib/logger'

export async function getHelperNotifications() {
  try {
    const { user } = await requireAuth(UserRole.HELPER)
    const supabase = await createClient()

    const { data: notifications, error } = await supabase
      .from('notifications')
      .select('id, title, body, channel, status, created_at')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .limit(100)

    if (error) {
      logger.error('Failed to fetch notifications', { error })
      return { error: 'Failed to load notifications' }
    }

    return { data: { notifications: notifications || [] } }
  } catch (error) {
    logger.error('Get notifications error', { error })
    return { error: 'An unexpected error occurred' }
  }
}

export async function markNotificationRead(notificationId: string) {
  try {
    const { user } = await requireAuth(UserRole.HELPER)
    const supabase = await createClient()

    const { error } = await supabase.rpc('mark_notification_read', {
      p_notification_id: notificationId,
    } as any)

    if (error) {
      logger.error('Failed to mark notification as read', { error })
      return { error: 'Failed to update notification' }
    }

    revalidatePath('/helper/notifications')
    return { success: true }
  } catch (error) {
    logger.error('Mark notification read error', { error })
    return { error: 'An unexpected error occurred' }
  }
}

export async function markAllAsRead() {
  try {
    const { user } = await requireAuth(UserRole.HELPER)
    const supabase = await createClient()

    const { error } = await supabase
      .from('notifications')
      .update({ status: 'read' })
      .eq('user_id', user.id)
      .eq('status', 'unread')

    if (error) {
      logger.error('Failed to mark all as read', { error })
      return { error: 'Failed to update notifications' }
    }

    revalidatePath('/helper/notifications')
    return { success: true }
  } catch (error) {
    logger.error('Mark all as read error', { error })
    return { error: 'An unexpected error occurred' }
  }
}
