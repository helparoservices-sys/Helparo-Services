'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import { requireAuth } from '@/lib/auth-middleware'
import { handleServerActionError } from '@/lib/errors'
import { sanitizeText, sanitizeHTML } from '@/lib/sanitize'
import { rateLimit, RATE_LIMITS } from '@/lib/rate-limit'
import { UserRole } from '@/lib/constants'
import { logger } from '@/lib/logger'

/**
 * Server Actions for Support Tickets (Migration 025)
 * Tables: support_tickets, ticket_messages, sla_configurations, ticket_activity_log
 */

// ============================================
// SUPPORT TICKETS
// ============================================

export async function createSupportTicket(formData: FormData) {
  try {
    const { user } = await requireAuth()
    await rateLimit('create-support-ticket', user.id, RATE_LIMITS.API_MODERATE)

    const subject = sanitizeText(formData.get('subject') as string)
    const description = sanitizeHTML(formData.get('description') as string)
    const category = sanitizeText(formData.get('category') as string)
    const priority = sanitizeText(formData.get('priority') as string || 'medium')
    const requestId = formData.get('request_id') as string | null

    if (!subject || !description || !category) {
      return { error: 'Missing required fields' }
    }

    const supabase = await createClient()

    // Use RPC function from migration
    const { data: ticketId, error } = await supabase.rpc('create_support_ticket', {
      p_user_id: user.id,
      p_category: category,
      p_priority: priority,
      p_subject: subject,
      p_description: description,
      p_request_id: requestId,
      p_attachments: null
    })

    if (error) throw error

    revalidatePath('/customer/support')
    revalidatePath('/admin/support')
    logger.info('Support ticket created', { userId: user.id, ticketId })
    return { success: true, ticketId }
  } catch (error: any) {
    logger.error('Create support ticket error', { error })
    return handleServerActionError(error)
  }
}

export async function updateTicketStatus(ticketId: string, status: string, notes?: string) {
  try {
    const { user } = await requireAuth()
    await rateLimit('update-ticket-status', user.id, RATE_LIMITS.API_MODERATE)

    const supabase = await createClient()

    // Use RPC function from migration
    const { data, error } = await supabase.rpc('update_ticket_status', {
      p_ticket_id: ticketId,
      p_status: status,
      p_resolution_notes: notes || null
    })

    if (error) throw error

    revalidatePath('/customer/support')
    revalidatePath('/admin/support')
    logger.info('Ticket status updated', { userId: user.id, ticketId, status })
    return { success: true }
  } catch (error: any) {
    logger.error('Update ticket status error', { error })
    return handleServerActionError(error)
  }
}

export async function assignTicketToAgent(ticketId: string, agentId: string) {
  try {
    const { user } = await requireAuth(UserRole.ADMIN)
    await rateLimit('assign-ticket', user.id, RATE_LIMITS.ADMIN_APPROVE)

    const supabase = await createClient()

    // Use RPC function from migration
    const { data, error } = await supabase.rpc('assign_ticket', {
      p_ticket_id: ticketId,
      p_agent_id: agentId
    })

    if (error) throw error

    revalidatePath('/admin/support')
    logger.info('Ticket assigned to agent', { adminId: user.id, ticketId, agentId })
    return { success: true }
  } catch (error: any) {
    logger.error('Assign ticket to agent error', { error })
    return handleServerActionError(error)
  }
}

export async function getMyTickets(status?: string) {
  try {
    const { user } = await requireAuth()
    await rateLimit('get-my-tickets', user.id, RATE_LIMITS.API_MODERATE)

    const supabase = await createClient()

    let query = supabase
      .from('support_tickets')
      .select(`
        *,
        assigned_agent:profiles!support_tickets_assigned_to_fkey(
          full_name,
          avatar_url
        )
      `)
      .eq('user_id', user.id)

    if (status) {
      query = query.eq('status', status)
    }

    const { data, error } = await query
      .order('created_at', { ascending: false })

    if (error) throw error

    return { success: true, tickets: data }
  } catch (error: any) {
    logger.error('Get my tickets error', { error })
    return handleServerActionError(error)
  }
}

export async function getAllTickets(filters?: { status?: string, priority?: string, category?: string, assignedTo?: string }) {
  try {
    const { user } = await requireAuth(UserRole.ADMIN)
    await rateLimit('get-all-tickets', user.id, RATE_LIMITS.ADMIN_APPROVE)

    const supabase = await createClient()

    let query = supabase
      .from('support_tickets')
      .select(`
        *,
        customer:profiles!support_tickets_user_id_fkey(
          full_name,
          email,
          phone
        ),
        assigned_agent:profiles!support_tickets_assigned_to_fkey(
          full_name,
          avatar_url
        )
      `)

    if (filters?.status) {
      query = query.eq('status', filters.status)
    }

    if (filters?.priority) {
      query = query.eq('priority', filters.priority)
    }

    if (filters?.category) {
      query = query.eq('category', filters.category)
    }

    if (filters?.assignedTo) {
      query = query.eq('assigned_to', filters.assignedTo)
    }

    const { data, error } = await query
      .order('created_at', { ascending: false })

    if (error) throw error

    return { success: true, tickets: data }
  } catch (error: any) {
    logger.error('Get all tickets error', { error })
    return handleServerActionError(error)
  }
}

export async function getTicketDetails(ticketId: string) {
  try {
    await rateLimit('get-ticket-details', ticketId, RATE_LIMITS.API_MODERATE)

    const supabase = await createClient()

    const { data, error } = await supabase
      .from('support_tickets')
      .select(`
        *,
        customer:profiles!support_tickets_user_id_fkey(
          full_name,
          email,
          phone,
          avatar_url
        ),
        assigned_agent:profiles!support_tickets_assigned_to_fkey(
          full_name,
          email,
          avatar_url
        ),
        messages:ticket_messages(
          *,
          sender:profiles(full_name, avatar_url)
        ),
        activity_log:ticket_activity_log(
          *,
          actor:profiles(full_name)
        )
      `)
      .eq('id', ticketId)
      .single()

    if (error) throw error

    return { success: true, ticket: data }
  } catch (error: any) {
    logger.error('Get ticket details error', { error })
    return handleServerActionError(error)
  }
}

// ============================================
// TICKET MESSAGES
// ============================================

export async function sendTicketMessage(formData: FormData) {
  try {
    const { user } = await requireAuth()
    await rateLimit('send-ticket-message', user.id, RATE_LIMITS.SEND_MESSAGE)

    const ticketId = sanitizeText(formData.get('ticket_id') as string)
    const message = sanitizeHTML(formData.get('message') as string)
    const attachments = formData.get('attachments') as string

    if (!ticketId || !message) {
      return { error: 'Missing required fields' }
    }

    const supabase = await createClient()

    // Check if user is customer or assigned agent
    const { data: ticket } = await supabase
      .from('support_tickets')
      .select('user_id, assigned_to')
      .eq('id', ticketId)
      .single()

    if (!ticket) {
      return { error: 'Ticket not found' }
    }

    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single()

    if (ticket.user_id !== user.id && ticket.assigned_to !== user.id && profile?.role !== 'admin') {
      return { error: 'Unauthorized' }
    }

    const isInternal = profile?.role === 'admin' && ticket.user_id !== user.id

    const { data: ticketMessage, error } = await supabase
      .from('ticket_messages')
      .insert({
        ticket_id: ticketId,
        sender_id: user.id,
        message,
        attachments: attachments ? JSON.parse(attachments) : null,
        is_internal: isInternal
      })
      .select('id, ticket_id, sender_id, message, is_internal, created_at')
      .single()

    if (error) throw error

    revalidatePath('/customer/support')
    revalidatePath('/admin/support')
    logger.info('Ticket message sent', { userId: user.id, ticketId, isInternal })
    return { success: true, message: ticketMessage }
  } catch (error: any) {
    logger.error('Send ticket message error', { error })
    return handleServerActionError(error)
  }
}

export async function getTicketMessages(ticketId: string, includeInternal = false) {
  const supabase = await createClient()

  try {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return { error: 'Unauthorized' }

    let query = supabase
      .from('ticket_messages')
      .select(`
        *,
        sender:profiles(
          full_name,
          avatar_url,
          role
        )
      `)
      .eq('ticket_id', ticketId)

    // Only show internal messages to admins
    if (!includeInternal) {
      query = query.eq('is_internal', false)
    }

    const { data, error } = await query
      .order('created_at', { ascending: true })

    if (error) throw error

    return { success: true, messages: data }
  } catch (error: any) {
    logger.error('Get ticket messages error:', error)
    return handleServerActionError(error)
  }
}

// ============================================
// SLA CONFIGURATIONS
// ============================================

export async function getSLAConfigurations() {
  const supabase = await createClient()

  try {
    const { data, error } = await supabase
      .from('sla_configurations')
      .select('id, priority, response_time_hours, resolution_time_hours, escalation_threshold_hours, is_active')
      .order('priority')

    if (error) throw error

    return { success: true, configs: data }
  } catch (error: any) {
    logger.error('Get SLA configurations error:', error)
    return handleServerActionError(error)
  }
}

export async function getTicketSLAStatus(ticketId: string) {
  const supabase = await createClient()

  try {
    // Use RPC function from migration
    const { data, error } = await supabase.rpc('get_ticket_sla_status', {
      p_ticket_id: ticketId
    })

    if (error) throw error

    return { success: true, slaStatus: data?.[0] }
  } catch (error: any) {
    logger.error('Get ticket SLA status error:', error)
    return handleServerActionError(error)
  }
}

// ============================================
// TICKET ACTIVITY LOG
// ============================================

export async function logTicketActivity(ticketId: string, actorId: string, action: string, notes?: string, oldValue?: string, newValue?: string) {
  const supabase = await createClient()

  try {
    const { error } = await supabase
      .from('ticket_activity_log')
      .insert({
        ticket_id: ticketId,
        actor_id: actorId,
        action,
        old_value: oldValue,
        new_value: newValue,
        notes
      })

    if (error) throw error

    return { success: true }
  } catch (error: any) {
    logger.error('Log ticket activity error:', error)
    return handleServerActionError(error)
  }
}

export async function getTicketActivityLog(ticketId: string) {
  const supabase = await createClient()

  try {
    const { data, error } = await supabase
      .from('ticket_activity_log')
      .select(`
        *,
        actor:profiles(
          full_name,
          avatar_url
        )
      `)
      .eq('ticket_id', ticketId)
      .order('created_at', { ascending: true })

    if (error) throw error

    return { success: true, activities: data }
  } catch (error: any) {
    logger.error('Get ticket activity log error:', error)
    return handleServerActionError(error)
  }
}

// ============================================
// TICKET ANALYTICS
// ============================================

export async function getTicketAnalytics(startDate?: string, endDate?: string) {
  const supabase = await createClient()

  try {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return { error: 'Unauthorized' }

    // Check admin role
    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single()

    if (profile?.role !== 'admin') {
      return { error: 'Unauthorized' }
    }

    let query = supabase
      .from('support_tickets')
      .select('id, status, priority, created_at, first_response_at, resolved_at')

    if (startDate) {
      query = query.gte('created_at', startDate)
    }

    if (endDate) {
      query = query.lte('created_at', endDate)
    }

    const { data: tickets, error } = await query

    if (error) throw error

    // Calculate analytics
    const totalTickets = tickets?.length || 0
    const openTickets = tickets?.filter(t => t.status === 'open').length || 0
    const inProgressTickets = tickets?.filter(t => t.status === 'in_progress').length || 0
    const resolvedTickets = tickets?.filter(t => t.status === 'resolved' || t.status === 'closed').length || 0
    
    const avgResponseTime = tickets
      ?.filter(t => t.first_response_at)
      .reduce((sum, t) => {
        const created = new Date(t.created_at).getTime()
        const responded = new Date(t.first_response_at!).getTime()
        return sum + (responded - created) / (1000 * 60 * 60) // hours
      }, 0) / (tickets?.filter(t => t.first_response_at).length || 1)

    const avgResolutionTime = tickets
      ?.filter(t => t.resolved_at)
      .reduce((sum, t) => {
        const created = new Date(t.created_at).getTime()
        const resolved = new Date(t.resolved_at!).getTime()
        return sum + (resolved - created) / (1000 * 60 * 60) // hours
      }, 0) / (tickets?.filter(t => t.resolved_at).length || 1)

    const categoryBreakdown = tickets?.reduce((acc: any, t) => {
      acc[t.category] = (acc[t.category] || 0) + 1
      return acc
    }, {})

    const priorityBreakdown = tickets?.reduce((acc: any, t) => {
      acc[t.priority] = (acc[t.priority] || 0) + 1
      return acc
    }, {})

    return {
      success: true,
      analytics: {
        totalTickets,
        openTickets,
        inProgressTickets,
        resolvedTickets,
        avgResponseTime: Math.round(avgResponseTime * 100) / 100,
        avgResolutionTime: Math.round(avgResolutionTime * 100) / 100,
        categoryBreakdown,
        priorityBreakdown
      }
    }
  } catch (error: any) {
    logger.error('Get ticket analytics error:', error)
    return handleServerActionError(error)
  }
}
