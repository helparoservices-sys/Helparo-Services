'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

/**
 * Server Actions for Support Tickets (Migration 025)
 * Tables: support_tickets, ticket_messages, sla_configurations, ticket_activity_log
 */

// ============================================
// SUPPORT TICKETS
// ============================================

export async function createSupportTicket(formData: FormData) {
  const supabase = await createClient()
  
  const subject = formData.get('subject') as string
  const description = formData.get('description') as string
  const category = formData.get('category') as string
  const priority = formData.get('priority') as string
  const attachments = formData.get('attachments') as string

  try {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return { error: 'Unauthorized' }

    // Get user profile for ticket number generation
    const { count: existingCount } = await supabase
      .from('support_tickets')
      .select('*', { count: 'exact', head: true })

    const ticketNumber = `TICK-${String(existingCount! + 1).padStart(6, '0')}`

    // Get SLA configuration for this category
    const { data: slaConfig } = await supabase
      .from('sla_configurations')
      .select('response_time_hours, resolution_time_hours')
      .eq('category', category)
      .eq('priority', priority)
      .eq('is_active', true)
      .maybeSingle()

    let responseDeadline = null
    let resolutionDeadline = null

    if (slaConfig) {
      const now = new Date()
      responseDeadline = new Date(now.getTime() + slaConfig.response_time_hours * 60 * 60 * 1000).toISOString()
      resolutionDeadline = new Date(now.getTime() + slaConfig.resolution_time_hours * 60 * 60 * 1000).toISOString()
    }

    const { data: ticket, error } = await supabase
      .from('support_tickets')
      .insert({
        ticket_number: ticketNumber,
        customer_id: user.id,
        subject,
        description,
        category,
        priority,
        status: 'open',
        attachments: attachments ? attachments.split(',') : [],
        sla_response_deadline: responseDeadline,
        sla_resolution_deadline: resolutionDeadline
      })
      .select()
      .single()

    if (error) throw error

    // Log activity
    await logTicketActivity(ticket.id, user.id, 'created', 'Ticket created')

    revalidatePath('/customer/support')
    revalidatePath('/admin/support')
    return { success: true, ticket }
  } catch (error: any) {
    console.error('Create support ticket error:', error)
    return { error: error.message }
  }
}

export async function updateTicketStatus(ticketId: string, status: string, notes?: string) {
  const supabase = await createClient()

  try {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return { error: 'Unauthorized' }

    const updateData: any = { status }

    if (status === 'in_progress' && !updateData.first_response_at) {
      updateData.first_response_at = new Date().toISOString()
    }

    if (status === 'resolved') {
      updateData.resolved_at = new Date().toISOString()
      updateData.resolved_by = user.id
    }

    if (status === 'closed') {
      updateData.closed_at = new Date().toISOString()
      updateData.closed_by = user.id
    }

    const { data: ticket, error } = await supabase
      .from('support_tickets')
      .update(updateData)
      .eq('id', ticketId)
      .select()
      .single()

    if (error) throw error

    // Log activity
    await logTicketActivity(ticketId, user.id, 'status_changed', `Status changed to ${status}${notes ? `: ${notes}` : ''}`)

    revalidatePath('/customer/support')
    revalidatePath('/admin/support')
    return { success: true, ticket }
  } catch (error: any) {
    console.error('Update ticket status error:', error)
    return { error: error.message }
  }
}

export async function assignTicketToAgent(ticketId: string, agentId: string) {
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

    const { data: ticket, error } = await supabase
      .from('support_tickets')
      .update({
        assigned_to: agentId,
        status: 'in_progress'
      })
      .eq('id', ticketId)
      .select()
      .single()

    if (error) throw error

    // Get agent name
    const { data: agent } = await supabase
      .from('profiles')
      .select('full_name')
      .eq('id', agentId)
      .single()

    // Log activity
    await logTicketActivity(ticketId, user.id, 'assigned', `Assigned to ${agent?.full_name || 'agent'}`)

    revalidatePath('/admin/support')
    return { success: true, ticket }
  } catch (error: any) {
    console.error('Assign ticket to agent error:', error)
    return { error: error.message }
  }
}

export async function getMyTickets(status?: string) {
  const supabase = await createClient()

  try {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return { error: 'Unauthorized' }

    let query = supabase
      .from('support_tickets')
      .select(`
        *,
        assigned_agent:profiles!support_tickets_assigned_to_fkey(
          full_name,
          avatar_url
        )
      `)
      .eq('customer_id', user.id)

    if (status) {
      query = query.eq('status', status)
    }

    const { data, error } = await query
      .order('created_at', { ascending: false })

    if (error) throw error

    return { success: true, tickets: data }
  } catch (error: any) {
    console.error('Get my tickets error:', error)
    return { error: error.message }
  }
}

export async function getAllTickets(filters?: { status?: string, priority?: string, category?: string, assignedTo?: string }) {
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
      .select(`
        *,
        customer:profiles!support_tickets_customer_id_fkey(
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
    console.error('Get all tickets error:', error)
    return { error: error.message }
  }
}

export async function getTicketDetails(ticketId: string) {
  const supabase = await createClient()

  try {
    const { data, error } = await supabase
      .from('support_tickets')
      .select(`
        *,
        customer:profiles!support_tickets_customer_id_fkey(
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
          user:profiles(full_name)
        )
      `)
      .eq('id', ticketId)
      .single()

    if (error) throw error

    return { success: true, ticket: data }
  } catch (error: any) {
    console.error('Get ticket details error:', error)
    return { error: error.message }
  }
}

// ============================================
// TICKET MESSAGES
// ============================================

export async function sendTicketMessage(formData: FormData) {
  const supabase = await createClient()
  
  const ticketId = formData.get('ticket_id') as string
  const message = formData.get('message') as string
  const attachments = formData.get('attachments') as string

  try {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return { error: 'Unauthorized' }

    // Check if user is customer or assigned agent
    const { data: ticket } = await supabase
      .from('support_tickets')
      .select('customer_id, assigned_to')
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

    if (ticket.customer_id !== user.id && ticket.assigned_to !== user.id && profile?.role !== 'admin') {
      return { error: 'Unauthorized' }
    }

    const isInternal = profile?.role === 'admin' && ticket.customer_id !== user.id

    const { data: ticketMessage, error } = await supabase
      .from('ticket_messages')
      .insert({
        ticket_id: ticketId,
        sender_id: user.id,
        message,
        attachments: attachments ? attachments.split(',') : [],
        is_internal: isInternal
      })
      .select()
      .single()

    if (error) throw error

    // Update ticket's last_message_at
    await supabase
      .from('support_tickets')
      .update({ last_message_at: new Date().toISOString() })
      .eq('id', ticketId)

    // Log activity
    await logTicketActivity(ticketId, user.id, 'message_added', isInternal ? 'Internal note added' : 'Message sent')

    revalidatePath('/customer/support')
    revalidatePath('/admin/support')
    return { success: true, message: ticketMessage }
  } catch (error: any) {
    console.error('Send ticket message error:', error)
    return { error: error.message }
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
    console.error('Get ticket messages error:', error)
    return { error: error.message }
  }
}

// ============================================
// SLA CONFIGURATIONS
// ============================================

export async function createSLAConfiguration(formData: FormData) {
  const supabase = await createClient()
  
  const category = formData.get('category') as string
  const priority = formData.get('priority') as string
  const responseTime = parseInt(formData.get('response_time_hours') as string)
  const resolutionTime = parseInt(formData.get('resolution_time_hours') as string)

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

    const { data, error } = await supabase
      .from('sla_configurations')
      .insert({
        category,
        priority,
        response_time_hours: responseTime,
        resolution_time_hours: resolutionTime,
        is_active: true
      })
      .select()
      .single()

    if (error) throw error

    revalidatePath('/admin/support/sla')
    return { success: true, slaConfig: data }
  } catch (error: any) {
    console.error('Create SLA configuration error:', error)
    return { error: error.message }
  }
}

export async function updateSLAConfiguration(configId: string, formData: FormData) {
  const supabase = await createClient()
  
  const responseTime = parseInt(formData.get('response_time_hours') as string)
  const resolutionTime = parseInt(formData.get('resolution_time_hours') as string)
  const isActive = formData.get('is_active') === 'true'

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

    const { data, error } = await supabase
      .from('sla_configurations')
      .update({
        response_time_hours: responseTime,
        resolution_time_hours: resolutionTime,
        is_active: isActive
      })
      .eq('id', configId)
      .select()
      .single()

    if (error) throw error

    revalidatePath('/admin/support/sla')
    return { success: true, slaConfig: data }
  } catch (error: any) {
    console.error('Update SLA configuration error:', error)
    return { error: error.message }
  }
}

export async function getSLAConfigurations() {
  const supabase = await createClient()

  try {
    const { data, error } = await supabase
      .from('sla_configurations')
      .select('*')
      .order('category')
      .order('priority')

    if (error) throw error

    return { success: true, configs: data }
  } catch (error: any) {
    console.error('Get SLA configurations error:', error)
    return { error: error.message }
  }
}

export async function getTicketSLAStatus(ticketId: string) {
  const supabase = await createClient()

  try {
    const { data: ticket } = await supabase
      .from('support_tickets')
      .select('sla_response_deadline, sla_resolution_deadline, first_response_at, resolved_at, status')
      .eq('id', ticketId)
      .single()

    if (!ticket) {
      return { error: 'Ticket not found' }
    }

    const now = new Date()
    let responseStatus: 'met' | 'breached' | 'pending' = 'pending'
    let resolutionStatus: 'met' | 'breached' | 'pending' = 'pending'

    // Check response SLA
    if (ticket.first_response_at) {
      const responseDeadline = new Date(ticket.sla_response_deadline!)
      const responseTime = new Date(ticket.first_response_at)
      responseStatus = responseTime <= responseDeadline ? 'met' : 'breached'
    } else if (ticket.sla_response_deadline && now > new Date(ticket.sla_response_deadline)) {
      responseStatus = 'breached'
    }

    // Check resolution SLA
    if (ticket.resolved_at) {
      const resolutionDeadline = new Date(ticket.sla_resolution_deadline!)
      const resolutionTime = new Date(ticket.resolved_at)
      resolutionStatus = resolutionTime <= resolutionDeadline ? 'met' : 'breached'
    } else if (ticket.sla_resolution_deadline && now > new Date(ticket.sla_resolution_deadline)) {
      resolutionStatus = 'breached'
    }

    return {
      success: true,
      slaStatus: {
        responseStatus,
        resolutionStatus,
        responseDeadline: ticket.sla_response_deadline,
        resolutionDeadline: ticket.sla_resolution_deadline
      }
    }
  } catch (error: any) {
    console.error('Get ticket SLA status error:', error)
    return { error: error.message }
  }
}

// ============================================
// TICKET ACTIVITY LOG
// ============================================

export async function logTicketActivity(ticketId: string, userId: string, activityType: string, description: string) {
  const supabase = await createClient()

  try {
    const { error } = await supabase
      .from('ticket_activity_log')
      .insert({
        ticket_id: ticketId,
        user_id: userId,
        activity_type: activityType,
        description
      })

    if (error) throw error

    return { success: true }
  } catch (error: any) {
    console.error('Log ticket activity error:', error)
    return { error: error.message }
  }
}

export async function getTicketActivityLog(ticketId: string) {
  const supabase = await createClient()

  try {
    const { data, error } = await supabase
      .from('ticket_activity_log')
      .select(`
        *,
        user:profiles(
          full_name,
          avatar_url
        )
      `)
      .eq('ticket_id', ticketId)
      .order('created_at', { ascending: true })

    if (error) throw error

    return { success: true, activities: data }
  } catch (error: any) {
    console.error('Get ticket activity log error:', error)
    return { error: error.message }
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
      .select('*')

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
    console.error('Get ticket analytics error:', error)
    return { error: error.message }
  }
}
