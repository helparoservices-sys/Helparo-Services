'use server'

import { requireAuth } from '@/lib/auth-middleware'
import { UserRole } from '@/lib/constants'
import { createClient } from '@/lib/supabase/server'
import { logger } from '@/lib/logger'

export async function getHelperVideoCalls() {
  try {
    const user = await requireAuth(UserRole.HELPER)
    const supabase = await createClient()

    // Get helper profile to find their service requests
    const { data: profile } = await supabase
      .from('helper_profiles')
      .select('id')
      .eq('user_id', user.id)
      .single()

    if (!profile) {
      return { error: 'Helper profile not found' }
    }

    // Mock video calls data (in production, this would come from video_calls table)
    const mockCalls = [
      {
        id: '1',
        customer_name: 'Rahul Sharma',
        customer_avatar: null,
        scheduled_at: new Date(Date.now() + 86400000).toISOString(), // Tomorrow
        started_at: null,
        ended_at: null,
        duration_minutes: 0,
        status: 'scheduled',
        call_quality: null,
        notes: 'Initial consultation for home cleaning',
      },
      {
        id: '2',
        customer_name: 'Priya Patel',
        customer_avatar: null,
        scheduled_at: new Date(Date.now() - 172800000).toISOString(), // 2 days ago
        started_at: new Date(Date.now() - 172800000).toISOString(),
        ended_at: new Date(Date.now() - 172800000 + 1800000).toISOString(),
        duration_minutes: 30,
        status: 'completed',
        call_quality: 4.5,
        notes: 'Discussed plumbing requirements',
      },
      {
        id: '3',
        customer_name: 'Amit Kumar',
        customer_avatar: null,
        scheduled_at: new Date(Date.now() - 259200000).toISOString(), // 3 days ago
        started_at: new Date(Date.now() - 259200000).toISOString(),
        ended_at: new Date(Date.now() - 259200000 + 2700000).toISOString(),
        duration_minutes: 45,
        status: 'completed',
        call_quality: 5.0,
        notes: 'Electrical work scope discussion',
      },
      {
        id: '4',
        customer_name: 'Sneha Reddy',
        customer_avatar: null,
        scheduled_at: new Date(Date.now() - 345600000).toISOString(), // 4 days ago
        started_at: null,
        ended_at: null,
        duration_minutes: 0,
        status: 'missed',
        call_quality: null,
        notes: null,
      },
    ]

    return { data: mockCalls }
  } catch (error) {
    logger.error('Error in getHelperVideoCalls', { error })
    return { error: 'An unexpected error occurred' }
  }
}

export async function getCallAnalytics() {
  try {
    const user = await requireAuth(UserRole.HELPER)

    // Mock analytics data
    const analytics = {
      total_calls: 15,
      total_duration: 450, // minutes
      average_duration: 30, // minutes
      average_quality: 4.7,
    }

    return { data: analytics }
  } catch (error) {
    logger.error('Error in getCallAnalytics', { error })
    return { error: 'Failed to load analytics' }
  }
}
