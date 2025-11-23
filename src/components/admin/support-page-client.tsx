'use client'

import { useState, useCallback, useMemo, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { Headset, AlertCircle, Clock, CheckCircle, MessageCircle, Eye, X, Send, User, Calendar, Tag } from 'lucide-react'
import { assignTicketToAgent, updateTicketStatus, sendTicketMessage } from '@/app/actions/support'

interface Profile {
  id: string
  full_name: string
  email?: string
}

interface Ticket {
  id: string
  ticket_number: string
  user_id: string
  subject: string
  description: string
  category: string
  priority: string
  status: string
  created_at: string
  updated_at: string
  assigned_to?: string
  assigned_at?: string
  resolved_at?: string
  closed_at?: string
  resolution_notes?: string
  request_id?: string
  attachments?: any
  first_response_at?: string
  satisfaction_rating?: number
  satisfaction_feedback?: string
  customer?: Profile
  assigned_agent?: Profile
}

interface TicketMessage {
  id: string
  ticket_id: string
  sender_id: string
  message: string
  is_internal: boolean
  created_at: string
  sender?: Profile
}

interface ActivityLog {
  id: string
  ticket_id: string
  actor_id: string
  action: string
  old_value?: string
  new_value?: string
  notes?: string
  created_at: string
  actor?: Profile
}

interface Props {
  tickets: Ticket[]
  agents: Profile[]
}

export default function SupportPageClient({ tickets, agents }: Props) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()

  // Filters
  const [priorityFilter, setPriorityFilter] = useState<string>('all')
  const [statusFilter, setStatusFilter] = useState<string>('all')
  const [categoryFilter, setCategoryFilter] = useState<string>('all')

  // Detail Modal
  const [selectedTicket, setSelectedTicket] = useState<Ticket | null>(null)
  const [messages, setMessages] = useState<TicketMessage[]>([])
  const [activityLogs, setActivityLogs] = useState<ActivityLog[]>([])
  const [newMessage, setNewMessage] = useState('')
  const [isInternal, setIsInternal] = useState(false)

  // Stats calculation
  const stats = useMemo(() => {
    const open = tickets.filter(t => ['open', 'assigned', 'in_progress'].includes(t.status)).length
    const inProgress = tickets.filter(t => t.status === 'in_progress').length
    const today = new Date().toISOString().split('T')[0]
    const resolvedToday = tickets.filter(t => 
      t.status === 'resolved' && t.created_at.split('T')[0] === today
    ).length
    return { open, inProgress, resolvedToday }
  }, [tickets])

  // Filtered tickets
  const filteredTickets = useMemo(() => {
    return tickets.filter(ticket => {
      if (priorityFilter !== 'all' && ticket.priority !== priorityFilter) return false
      if (statusFilter !== 'all' && ticket.status !== statusFilter) return false
      if (categoryFilter !== 'all' && ticket.category !== categoryFilter) return false
      return true
    })
  }, [tickets, priorityFilter, statusFilter, categoryFilter])

  // Categories from tickets
  const categories = useMemo(() => {
    const cats = new Set(tickets.map(t => t.category))
    return Array.from(cats).sort()
  }, [tickets])

  const openDetailModal = useCallback(async (ticket: Ticket) => {
    setSelectedTicket(ticket)
    setMessages([])
    setActivityLogs([])
    
    // Fetch both in parallel
    Promise.all([
      fetch(`/api/support/tickets/${ticket.id}/messages`),
      fetch(`/api/support/tickets/${ticket.id}/activity`)
    ]).then(async ([messagesRes, logsRes]) => {
      if (messagesRes.ok) {
        const data = await messagesRes.json()
        setMessages(data.messages || [])
      }
      if (logsRes.ok) {
        const data = await logsRes.json()
        setActivityLogs(data.logs || [])
      }
    }).catch(err => console.error('Failed to load ticket details:', err))
  }, [])

  const closeDetailModal = useCallback(() => {
    setSelectedTicket(null)
    setMessages([])
    setActivityLogs([])
    setNewMessage('')
    setIsInternal(false)
  }, [])

  const handleAssignAgent = useCallback(async (ticketId: string, agentId: string) => {
    startTransition(async () => {
      const result = await assignTicketToAgent(ticketId, agentId)
      if ('success' in result && result.success) {
        closeDetailModal()
        router.refresh()
      } else if ('error' in result) {
        alert(result.error || 'Failed to assign agent')
      }
    })
  }, [router, closeDetailModal])

  const handleStatusChange = useCallback(async (ticketId: string, status: string) => {
    startTransition(async () => {
      const result = await updateTicketStatus(ticketId, status)
      if ('success' in result && result.success) {
        closeDetailModal()
        router.refresh()
      } else if ('error' in result) {
        alert(result.error || 'Failed to update status')
      }
    })
  }, [router, closeDetailModal])

  const handleSendMessage = useCallback(async (e: React.FormEvent) => {
    e.preventDefault()
    if (!selectedTicket || !newMessage.trim()) return

    const ticketId = selectedTicket.id
    startTransition(async () => {
      const formData = new FormData()
      formData.append('ticketId', ticketId)
      formData.append('message', newMessage)
      formData.append('isInternal', String(isInternal))
      
      const result = await sendTicketMessage(formData)
      if ('success' in result && result.success) {
        setNewMessage('')
        setIsInternal(false)
        // Refresh messages only
        fetch(`/api/support/tickets/${ticketId}/messages`)
          .then(res => res.json())
          .then(data => setMessages(data.messages || []))
          .catch(err => console.error(err))
      } else if ('error' in result) {
        alert(result.error || 'Failed to send message')
      }
    })
  }, [selectedTicket, newMessage, isInternal])

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'urgent': return 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400'
      case 'high': return 'bg-orange-100 dark:bg-orange-900/30 text-orange-700 dark:text-orange-400'
      case 'medium': return 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-400'
      default: return 'bg-slate-100 dark:bg-slate-900/30 text-slate-700 dark:text-slate-400'
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'resolved': return 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400'
      case 'closed': return 'bg-slate-100 dark:bg-slate-900/30 text-slate-700 dark:text-slate-400'
      case 'in_progress': return 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400'
      case 'assigned': return 'bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-400'
      default: return 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-400'
    }
  }

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-slate-900 dark:text-white">Customer Support</h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">Manage support tickets & customer queries</p>
        </div>
        <div className="flex gap-2">
          <select 
            value={priorityFilter}
            onChange={(e) => setPriorityFilter(e.target.value)}
            className="px-3 py-2 border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white rounded-lg text-sm"
          >
            <option value="all">All Priorities</option>
            <option value="urgent">Urgent</option>
            <option value="high">High</option>
            <option value="medium">Medium</option>
            <option value="low">Low</option>
          </select>
          <select 
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-3 py-2 border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white rounded-lg text-sm"
          >
            <option value="all">All Status</option>
            <option value="open">Open</option>
            <option value="assigned">Assigned</option>
            <option value="in_progress">In Progress</option>
            <option value="waiting_response">Waiting Response</option>
            <option value="resolved">Resolved</option>
            <option value="closed">Closed</option>
          </select>
          <select 
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
            className="px-3 py-2 border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white rounded-lg text-sm"
          >
            <option value="all">All Categories</option>
            {categories.map(cat => (
              <option key={cat} value={cat}>{cat.replace('_', ' ')}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-white/80 dark:bg-slate-800/80 backdrop-blur-xl rounded-lg border border-white/20 dark:border-slate-700/50 shadow-lg p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-slate-600 dark:text-slate-400">Open Tickets</p>
              <p className="text-2xl font-bold text-slate-900 dark:text-white mt-1">{stats.open}</p>
            </div>
            <div className="w-12 h-12 rounded-lg bg-orange-100 dark:bg-orange-900/30 flex items-center justify-center shadow-lg">
              <AlertCircle className="h-6 w-6 text-orange-600 dark:text-orange-400" />
            </div>
          </div>
        </div>

        <div className="bg-white/80 dark:bg-slate-800/80 backdrop-blur-xl rounded-lg border border-white/20 dark:border-slate-700/50 shadow-lg p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-slate-600 dark:text-slate-400">In Progress</p>
              <p className="text-2xl font-bold text-slate-900 dark:text-white mt-1">{stats.inProgress}</p>
            </div>
            <div className="w-12 h-12 rounded-lg bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center shadow-lg">
              <Clock className="h-6 w-6 text-blue-600 dark:text-blue-400" />
            </div>
          </div>
        </div>

        <div className="bg-white/80 dark:bg-slate-800/80 backdrop-blur-xl rounded-lg border border-white/20 dark:border-slate-700/50 shadow-lg p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-slate-600 dark:text-slate-400">Resolved Today</p>
              <p className="text-2xl font-bold text-slate-900 dark:text-white mt-1">{stats.resolvedToday}</p>
            </div>
            <div className="w-12 h-12 rounded-lg bg-green-100 dark:bg-green-900/30 flex items-center justify-center shadow-lg">
              <CheckCircle className="h-6 w-6 text-green-600 dark:text-green-400" />
            </div>
          </div>
        </div>

        <div className="bg-white/80 dark:bg-slate-800/80 backdrop-blur-xl rounded-lg border border-white/20 dark:border-slate-700/50 shadow-lg p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-slate-600 dark:text-slate-400">Total Tickets</p>
              <p className="text-2xl font-bold text-slate-900 dark:text-white mt-1">{tickets.length}</p>
            </div>
            <div className="w-12 h-12 rounded-lg bg-purple-100 dark:bg-purple-900/30 flex items-center justify-center shadow-lg">
              <Headset className="h-6 w-6 text-purple-600 dark:text-purple-400" />
            </div>
          </div>
        </div>
      </div>

      {/* Tickets Table */}
      <div className="bg-white/80 dark:bg-slate-800/80 backdrop-blur-xl rounded-lg border border-white/20 dark:border-slate-700/50 shadow-lg overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-slate-50 dark:bg-slate-900/50">
              <tr>
                <th className="px-6 py-4 text-left text-xs font-medium text-slate-700 dark:text-slate-300 uppercase tracking-wider">Ticket #</th>
                <th className="px-6 py-4 text-left text-xs font-medium text-slate-700 dark:text-slate-300 uppercase tracking-wider">Subject</th>
                <th className="px-6 py-4 text-left text-xs font-medium text-slate-700 dark:text-slate-300 uppercase tracking-wider">Customer</th>
                <th className="px-6 py-4 text-left text-xs font-medium text-slate-700 dark:text-slate-300 uppercase tracking-wider">Category</th>
                <th className="px-6 py-4 text-left text-xs font-medium text-slate-700 dark:text-slate-300 uppercase tracking-wider">Priority</th>
                <th className="px-6 py-4 text-left text-xs font-medium text-slate-700 dark:text-slate-300 uppercase tracking-wider">Status</th>
                <th className="px-6 py-4 text-left text-xs font-medium text-slate-700 dark:text-slate-300 uppercase tracking-wider">Assigned To</th>
                <th className="px-6 py-4 text-left text-xs font-medium text-slate-700 dark:text-slate-300 uppercase tracking-wider">Created</th>
                <th className="px-6 py-4 text-right text-xs font-medium text-slate-700 dark:text-slate-300 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-700/50">
              {filteredTickets.map((ticket) => (
                <tr key={ticket.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-2">
                      <MessageCircle className="h-4 w-4 text-slate-400" />
                      <span className="text-xs font-mono text-slate-900 dark:text-white">{ticket.ticket_number}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="font-medium text-sm text-slate-900 dark:text-white">{ticket.subject}</div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="text-sm text-slate-900 dark:text-white">{ticket.customer?.full_name || '—'}</div>
                    <div className="text-xs text-slate-500 dark:text-slate-400">{ticket.customer?.email}</div>
                  </td>
                  <td className="px-6 py-4">
                    <span className="text-sm capitalize text-slate-600 dark:text-slate-400">{ticket.category.replace(/_/g, ' ')}</span>
                  </td>
                  <td className="px-6 py-4">
                    <span className={`inline-flex items-center gap-1 px-2 py-1 text-xs rounded-full capitalize ${getPriorityColor(ticket.priority)}`}>
                      {ticket.priority === 'urgent' && <AlertCircle className="h-3 w-3" />}
                      {ticket.priority}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <span className={`inline-flex items-center gap-1 px-2 py-1 text-xs rounded-full ${getStatusColor(ticket.status)}`}>
                      {ticket.status === 'resolved' && <CheckCircle className="h-3 w-3" />}
                      {ticket.status === 'in_progress' && <Clock className="h-3 w-3" />}
                      {ticket.status.replace(/_/g, ' ')}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-sm text-slate-600 dark:text-slate-400">
                    {ticket.assigned_agent?.full_name || '—'}
                  </td>
                  <td className="px-6 py-4 text-sm text-slate-600 dark:text-slate-400">
                    {ticket.created_at.split('T')[0]}
                  </td>
                  <td className="px-6 py-4 text-right">
                    <button
                      onClick={() => openDetailModal(ticket)}
                      className="inline-flex items-center gap-1 text-primary-600 dark:text-primary-400 hover:underline text-sm"
                    >
                      <Eye className="h-4 w-4" />
                      View
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {filteredTickets.length === 0 && (
            <div className="p-12 text-center">
              <Headset className="h-16 w-16 text-slate-400 dark:text-slate-600 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-2">No Tickets Found</h3>
              <p className="text-sm text-slate-500 dark:text-slate-400">
                {priorityFilter !== 'all' || statusFilter !== 'all' || categoryFilter !== 'all' 
                  ? 'Try adjusting your filters'
                  : 'All caught up! No pending support tickets at the moment.'}
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Detail Modal */}
      {selectedTicket && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-slate-800 rounded-lg shadow-2xl w-full max-w-4xl max-h-[90vh] flex flex-col">
            {/* Modal Header */}
            <div className="flex items-center justify-between p-6 border-b border-slate-200 dark:border-slate-700">
              <div>
                <h2 className="text-xl font-bold text-slate-900 dark:text-white">{selectedTicket.subject}</h2>
                <p className="text-sm text-slate-500 dark:text-slate-400 font-mono">{selectedTicket.ticket_number}</p>
              </div>
              <button
                onClick={closeDetailModal}
                className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-300"
              >
                <X className="h-6 w-6" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="flex-1 overflow-y-auto p-6 space-y-6">
              {/* Full Ticket Description */}
              <div className="bg-slate-50 dark:bg-slate-900/50 rounded-lg p-4 border border-slate-200 dark:border-slate-700">
                <h3 className="text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">Description</h3>
                <p className="text-sm text-slate-900 dark:text-white whitespace-pre-wrap leading-relaxed">
                  {(selectedTicket as any).description || 'No description provided'}
                </p>
              </div>

              {/* Comprehensive Ticket Info Grid */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {/* Customer Details */}
                <div className="bg-white dark:bg-slate-800 rounded-lg p-4 border border-slate-200 dark:border-slate-700">
                  <p className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase mb-2 flex items-center gap-1">
                    <User className="h-3 w-3" /> Customer Details
                  </p>
                  <p className="text-sm font-medium text-slate-900 dark:text-white mb-1">
                    {selectedTicket.customer?.full_name || 'Unknown'}
                  </p>
                  <p className="text-xs text-slate-500 dark:text-slate-400 break-all">
                    {selectedTicket.customer?.email || 'No email'}
                  </p>
                  <p className="text-xs text-slate-600 dark:text-slate-400 mt-2">
                    User ID: <span className="font-mono text-[10px]">{selectedTicket.user_id.slice(0, 8)}...</span>
                  </p>
                </div>

                {/* Ticket Status */}
                <div className="bg-white dark:bg-slate-800 rounded-lg p-4 border border-slate-200 dark:border-slate-700">
                  <p className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase mb-2">Status & Priority</p>
                  <div className="space-y-2">
                    <div>
                      <p className="text-xs text-slate-500 dark:text-slate-400 mb-1">Status</p>
                      <span className={`inline-flex items-center px-2 py-1 text-xs rounded-full ${getStatusColor(selectedTicket.status)}`}>
                        {selectedTicket.status.replace(/_/g, ' ')}
                      </span>
                    </div>
                    <div>
                      <p className="text-xs text-slate-500 dark:text-slate-400 mb-1">Priority</p>
                      <span className={`inline-flex items-center px-2 py-1 text-xs rounded-full capitalize ${getPriorityColor(selectedTicket.priority)}`}>
                        {selectedTicket.priority === 'urgent' && <AlertCircle className="h-3 w-3 mr-1" />}
                        {selectedTicket.priority}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Assignment & Dates */}
                <div className="bg-white dark:bg-slate-800 rounded-lg p-4 border border-slate-200 dark:border-slate-700">
                  <p className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase mb-2">Assignment</p>
                  <div className="space-y-2">
                    <div>
                      <p className="text-xs text-slate-500 dark:text-slate-400">Assigned To</p>
                      <p className="text-sm font-medium text-slate-900 dark:text-white">
                        {selectedTicket.assigned_agent?.full_name || 'Unassigned'}
                      </p>
                    </div>
                    {(selectedTicket as any).assigned_at && (
                      <div>
                        <p className="text-xs text-slate-500 dark:text-slate-400">Assigned At</p>
                        <p className="text-xs text-slate-700 dark:text-slate-300">
                          {new Date((selectedTicket as any).assigned_at).toLocaleString()}
                        </p>
                      </div>
                    )}
                  </div>
                </div>

                {/* Category & Dates */}
                <div className="bg-white dark:bg-slate-800 rounded-lg p-4 border border-slate-200 dark:border-slate-700">
                  <p className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase mb-2 flex items-center gap-1">
                    <Tag className="h-3 w-3" /> Category
                  </p>
                  <p className="text-sm font-medium text-slate-900 dark:text-white capitalize mb-3">
                    {selectedTicket.category.replace(/_/g, ' ')}
                  </p>
                  <div className="space-y-1">
                    <p className="text-xs text-slate-500 dark:text-slate-400">Created</p>
                    <p className="text-xs text-slate-700 dark:text-slate-300">
                      {new Date(selectedTicket.created_at).toLocaleString()}
                    </p>
                  </div>
                </div>

                {/* Resolution Details */}
                {((selectedTicket as any).resolved_at || (selectedTicket as any).resolution_notes) && (
                  <div className="bg-green-50 dark:bg-green-900/20 rounded-lg p-4 border border-green-200 dark:border-green-800">
                    <p className="text-xs font-semibold text-green-700 dark:text-green-400 uppercase mb-2 flex items-center gap-1">
                      <CheckCircle className="h-3 w-3" /> Resolution
                    </p>
                    {(selectedTicket as any).resolved_at && (
                      <div className="mb-2">
                        <p className="text-xs text-green-600 dark:text-green-400">Resolved At</p>
                        <p className="text-xs text-green-700 dark:text-green-300">
                          {new Date((selectedTicket as any).resolved_at).toLocaleString()}
                        </p>
                      </div>
                    )}
                    {(selectedTicket as any).resolution_notes && (
                      <div>
                        <p className="text-xs text-green-600 dark:text-green-400 mb-1">Notes</p>
                        <p className="text-xs text-green-700 dark:text-green-300">
                          {(selectedTicket as any).resolution_notes}
                        </p>
                      </div>
                    )}
                  </div>
                )}

                {/* Related Request */}
                {(selectedTicket as any).request_id && (
                  <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-4 border border-blue-200 dark:border-blue-800">
                    <p className="text-xs font-semibold text-blue-700 dark:text-blue-400 uppercase mb-2">Related Service Request</p>
                    <p className="text-xs font-mono text-blue-600 dark:text-blue-300 break-all">
                      {(selectedTicket as any).request_id}
                    </p>
                  </div>
                )}
              </div>

              {/* Actions */}
              <div className="flex gap-3">
                <select
                  value={selectedTicket.assigned_to || ''}
                  onChange={(e) => handleAssignAgent(selectedTicket.id, e.target.value)}
                  disabled={isPending}
                  className="flex-1 px-3 py-2 border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white rounded-lg text-sm"
                >
                  <option value="">Assign to agent...</option>
                  {agents.map(agent => (
                    <option key={agent.id} value={agent.id}>{agent.full_name}</option>
                  ))}
                </select>
                <select
                  value={selectedTicket.status}
                  onChange={(e) => handleStatusChange(selectedTicket.id, e.target.value)}
                  disabled={isPending}
                  className="flex-1 px-3 py-2 border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white rounded-lg text-sm"
                >
                  <option value="open">Open</option>
                  <option value="assigned">Assigned</option>
                  <option value="in_progress">In Progress</option>
                  <option value="waiting_response">Waiting Response</option>
                  <option value="resolved">Resolved</option>
                  <option value="closed">Closed</option>
                </select>
              </div>

              {/* Messages */}
              <div className="space-y-3">
                <h3 className="font-semibold text-slate-900 dark:text-white">Messages</h3>
                <div className="space-y-3 max-h-60 overflow-y-auto">
                  {messages.map(msg => (
                    <div key={msg.id} className={`p-3 rounded-lg ${msg.is_internal ? 'bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800' : 'bg-slate-50 dark:bg-slate-900/50'}`}>
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-sm font-medium text-slate-900 dark:text-white">
                          {msg.sender?.full_name || 'Unknown'}
                        </span>
                        <div className="flex items-center gap-2">
                          {msg.is_internal && (
                            <span className="text-xs px-2 py-0.5 bg-amber-200 dark:bg-amber-800 text-amber-900 dark:text-amber-100 rounded">
                              Internal
                            </span>
                          )}
                          <span className="text-xs text-slate-500 dark:text-slate-400">
                            {new Date(msg.created_at).toLocaleString()}
                          </span>
                        </div>
                      </div>
                      <p className="text-sm text-slate-700 dark:text-slate-300">{msg.message}</p>
                    </div>
                  ))}
                  {messages.length === 0 && (
                    <p className="text-sm text-slate-500 dark:text-slate-400 text-center py-4">No messages yet</p>
                  )}
                </div>
              </div>

              {/* Reply Form */}
              <form onSubmit={handleSendMessage} className="space-y-3">
                <textarea
                  value={newMessage}
                  onChange={(e) => setNewMessage(e.target.value)}
                  placeholder="Type your message..."
                  rows={3}
                  className="w-full px-3 py-2 border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white rounded-lg text-sm resize-none focus:ring-2 focus:ring-primary-500"
                />
                <div className="flex items-center justify-between">
                  <label className="flex items-center gap-2 text-sm text-slate-700 dark:text-slate-300">
                    <input
                      type="checkbox"
                      checked={isInternal}
                      onChange={(e) => setIsInternal(e.target.checked)}
                      className="rounded border-slate-300 dark:border-slate-600"
                    />
                    Internal note (not visible to customer)
                  </label>
                  <button
                    type="submit"
                    disabled={isPending || !newMessage.trim()}
                    className="inline-flex items-center gap-2 px-4 py-2 bg-primary-600 hover:bg-primary-700 disabled:bg-slate-300 dark:disabled:bg-slate-700 text-white rounded-lg text-sm font-medium transition-colors"
                  >
                    <Send className="h-4 w-4" />
                    Send
                  </button>
                </div>
              </form>

              {/* Activity Log */}
              <div className="space-y-3">
                <h3 className="font-semibold text-slate-900 dark:text-white">Activity Log</h3>
                <div className="space-y-2 max-h-40 overflow-y-auto">
                  {activityLogs.map(log => (
                    <div key={log.id} className="flex items-start gap-2 text-xs">
                      <span className="text-slate-500 dark:text-slate-400">
                        {new Date(log.created_at).toLocaleString()}
                      </span>
                      <span className="text-slate-700 dark:text-slate-300">
                        {log.actor?.full_name} {log.action.replace(/_/g, ' ')}
                        {log.old_value && log.new_value && ` from ${log.old_value} to ${log.new_value}`}
                        {log.notes && ` - ${log.notes}`}
                      </span>
                    </div>
                  ))}
                  {activityLogs.length === 0 && (
                    <p className="text-sm text-slate-500 dark:text-slate-400 text-center py-2">No activity yet</p>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
