'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { 
  MessageSquare, 
  Plus, 
  AlertCircle, 
  Clock, 
  CheckCircle, 
  XCircle,
  Search,
  HelpCircle,
  Headphones,
  ArrowRight,
  Sparkles,
  ChevronRight,
  Send,
  X
} from 'lucide-react'
import { useToast } from '@/components/ui/toast-notification'

interface Ticket {
  id: string
  ticket_number: string
  subject: string
  category: string
  priority: string
  status: string
  created_at: string
  updated_at: string
}

export default function CustomerSupportPage() {
  const supabase = createClient()
  const { showError, showSuccess } = useToast()
  const [loading, setLoading] = useState(true)
  const [tickets, setTickets] = useState<Ticket[]>([])
  const [filterStatus, setFilterStatus] = useState<string>('all')
  const [searchQuery, setSearchQuery] = useState('')
  const [showNewTicket, setShowNewTicket] = useState(false)
  const [newTicket, setNewTicket] = useState({
    category: 'technical_issue',
    priority: 'medium',
    subject: '',
    description: ''
  })
  const [isSubmitting, setIsSubmitting] = useState(false)

  useEffect(() => {
    loadTickets()
  }, [])

  const loadTickets = async () => {
    setLoading(true)

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      setLoading(false)
      return
    }

    const { data } = await supabase
      .from('support_tickets')
      .select('id, user_id, subject, description, status, priority, category, created_at, updated_at')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })

    setTickets(data || [])
    setLoading(false)
  }

  const handleCreateTicket = async () => {
    if (!newTicket.subject.trim() || !newTicket.description.trim()) {
      showError('Required Fields', 'Please fill in all required fields')
      return
    }

    setIsSubmitting(true)

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      setIsSubmitting(false)
      return
    }

    const { error } = await supabase
      .from('support_tickets')
      .insert({
        user_id: user.id,
        category: newTicket.category,
        priority: newTicket.priority,
        subject: newTicket.subject,
        description: newTicket.description
      })

    if (!error) {
      showSuccess('Ticket Created', 'Your support ticket has been submitted')
      setShowNewTicket(false)
      setNewTicket({
        category: 'technical_issue',
        priority: 'medium',
        subject: '',
        description: ''
      })
      loadTickets()
    }

    setIsSubmitting(false)
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'open': return <Clock className="h-5 w-5 text-amber-500" />
      case 'assigned': return <AlertCircle className="h-5 w-5 text-blue-500" />
      case 'in_progress': return <AlertCircle className="h-5 w-5 text-orange-500" />
      case 'resolved': return <CheckCircle className="h-5 w-5 text-emerald-500" />
      case 'closed': return <XCircle className="h-5 w-5 text-gray-500" />
      default: return <HelpCircle className="h-5 w-5 text-gray-500" />
    }
  }

  const getPriorityColor = (priority: string) => {
    const colors = {
      low: 'bg-emerald-100 text-emerald-700',
      medium: 'bg-amber-100 text-amber-700',
      high: 'bg-orange-100 text-orange-700',
      urgent: 'bg-red-100 text-red-700'
    }
    return colors[priority as keyof typeof colors] || colors.medium
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'open': return 'bg-amber-100 text-amber-700'
      case 'in_progress': return 'bg-blue-100 text-blue-700'
      case 'resolved': return 'bg-emerald-100 text-emerald-700'
      case 'closed': return 'bg-gray-100 text-gray-700'
      default: return 'bg-gray-100 text-gray-700'
    }
  }

  const filteredTickets = tickets
    .filter(t => filterStatus === 'all' || t.status === filterStatus)
    .filter(t => searchQuery === '' || 
      t.subject.toLowerCase().includes(searchQuery.toLowerCase()) ||
      t.ticket_number.toLowerCase().includes(searchQuery.toLowerCase())
    )

  const openCount = tickets.filter(t => ['open', 'assigned', 'in_progress'].includes(t.status)).length
  const resolvedCount = tickets.filter(t => t.status === 'resolved' || t.status === 'closed').length

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-gradient-to-br from-emerald-500 to-teal-500 flex items-center justify-center animate-pulse">
            <Headphones className="w-8 h-8 text-white" />
          </div>
          <p className="text-gray-600">Loading support center...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      {/* Hero Header */}
      <div className="relative overflow-hidden bg-gradient-to-br from-emerald-600 via-teal-600 to-cyan-600 rounded-3xl p-8 text-white">
        <div className="absolute inset-0 bg-gradient-to-br from-white/10 to-transparent" />
        <div className="absolute top-0 right-0 w-64 h-64 bg-white/5 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2" />
        <div className="absolute bottom-0 left-0 w-48 h-48 bg-teal-400/10 rounded-full blur-2xl translate-y-1/2 -translate-x-1/2" />
        
        <div className="relative flex items-center justify-between">
          <div>
            <div className="flex items-center gap-3 mb-3">
              <div className="w-12 h-12 rounded-2xl bg-white/20 backdrop-blur-sm flex items-center justify-center">
                <Headphones className="w-6 h-6" />
              </div>
              <div className="px-3 py-1 bg-white/20 backdrop-blur-sm rounded-full text-xs font-semibold">
                24/7 Support
              </div>
            </div>
            <h1 className="text-3xl md:text-4xl font-black mb-2">Support Center</h1>
            <p className="text-emerald-100 max-w-md">
              We're here to help! Create a ticket and our team will assist you promptly.
            </p>
          </div>
          
          <button
            onClick={() => setShowNewTicket(true)}
            className="hidden md:flex items-center gap-2 px-6 py-3 bg-white text-emerald-600 rounded-2xl font-semibold hover:bg-emerald-50 transition-all hover:scale-105 shadow-xl"
          >
            <Plus className="h-5 w-5" />
            New Ticket
          </button>
        </div>
      </div>

      {/* Mobile New Ticket Button */}
      <button
        onClick={() => setShowNewTicket(true)}
        className="md:hidden w-full flex items-center justify-center gap-2 px-6 py-4 bg-gradient-to-r from-emerald-500 to-teal-500 text-white rounded-2xl font-semibold shadow-lg"
      >
        <Plus className="h-5 w-5" />
        Create New Ticket
      </button>

      {/* Stats Cards */}
      <div className="grid grid-cols-3 gap-4">
        <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100 hover:shadow-md transition-all">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-100 flex items-center justify-center">
              <MessageSquare className="h-5 w-5 text-emerald-600" />
            </div>
          </div>
          <p className="text-2xl font-bold text-gray-900">{tickets.length}</p>
          <p className="text-sm text-gray-500">Total Tickets</p>
        </div>

        <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100 hover:shadow-md transition-all">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-10 h-10 rounded-xl bg-amber-100 flex items-center justify-center">
              <Clock className="h-5 w-5 text-amber-600" />
            </div>
          </div>
          <p className="text-2xl font-bold text-gray-900">{openCount}</p>
          <p className="text-sm text-gray-500">Open</p>
        </div>

        <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100 hover:shadow-md transition-all">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-100 flex items-center justify-center">
              <CheckCircle className="h-5 w-5 text-emerald-600" />
            </div>
          </div>
          <p className="text-2xl font-bold text-gray-900">{resolvedCount}</p>
          <p className="text-sm text-gray-500">Resolved</p>
        </div>
      </div>

      {/* Search & Filter */}
      <div className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100">
        <div className="flex flex-col md:flex-row gap-4">
          <div className="flex-1 relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search tickets..."
              className="w-full pl-12 pr-4 py-3 bg-gray-50 border-0 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:bg-white transition-all"
            />
          </div>

          <div className="flex gap-2 overflow-x-auto pb-2 md:pb-0">
            {['all', 'open', 'in_progress', 'resolved', 'closed'].map(status => (
              <button
                key={status}
                onClick={() => setFilterStatus(status)}
                className={`px-4 py-2.5 rounded-xl text-sm font-medium whitespace-nowrap transition-all ${
                  filterStatus === status
                    ? 'bg-emerald-500 text-white shadow-md'
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
              >
                {status === 'all' ? 'All' : status.replace('_', ' ')}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Tickets List */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        {filteredTickets.length === 0 ? (
          <div className="text-center py-16 px-4">
            <div className="w-20 h-20 mx-auto mb-6 rounded-3xl bg-gray-100 flex items-center justify-center">
              <MessageSquare className="h-10 w-10 text-gray-400" />
            </div>
            <h3 className="text-xl font-semibold text-gray-900 mb-2">No tickets found</h3>
            <p className="text-gray-500 mb-6">
              {searchQuery ? 'Try adjusting your search' : 'Create your first support ticket to get help'}
            </p>
            {!searchQuery && (
              <button
                onClick={() => setShowNewTicket(true)}
                className="inline-flex items-center gap-2 px-6 py-3 bg-emerald-500 text-white rounded-xl font-medium hover:bg-emerald-600 transition-colors"
              >
                <Plus className="h-5 w-5" />
                Create Ticket
              </button>
            )}
          </div>
        ) : (
          <div className="divide-y divide-gray-100">
            {filteredTickets.map((ticket) => (
              <Link
                key={ticket.id}
                href={`/customer/support/${ticket.id}`}
                className="block p-5 hover:bg-gray-50 transition-colors group"
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="flex items-start gap-4 flex-1 min-w-0">
                    <div className="mt-0.5">
                      {getStatusIcon(ticket.status)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1.5 flex-wrap">
                        <span className="font-mono text-sm font-semibold text-emerald-600">
                          #{ticket.ticket_number}
                        </span>
                        <span className={`px-2.5 py-0.5 text-xs font-semibold rounded-full ${getPriorityColor(ticket.priority)}`}>
                          {ticket.priority}
                        </span>
                      </div>
                      <h3 className="font-semibold text-gray-900 mb-1 truncate group-hover:text-emerald-600 transition-colors">
                        {ticket.subject}
                      </h3>
                      <div className="flex items-center gap-3 text-sm text-gray-500">
                        <span className="capitalize">{ticket.category.replace(/_/g, ' ')}</span>
                        <span>•</span>
                        <span>{new Date(ticket.created_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}</span>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className={`px-3 py-1.5 text-xs font-semibold rounded-full ${getStatusColor(ticket.status)}`}>
                      {ticket.status.replace('_', ' ')}
                    </span>
                    <ChevronRight className="w-5 h-5 text-gray-400 group-hover:text-emerald-500 transition-colors" />
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>

      {/* New Ticket Modal */}
      {showNewTicket && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-3xl max-w-2xl w-full max-h-[90vh] overflow-hidden shadow-2xl">
            {/* Modal Header */}
            <div className="relative bg-gradient-to-r from-emerald-500 to-teal-500 p-6 text-white">
              <button
                onClick={() => setShowNewTicket(false)}
                className="absolute top-4 right-4 w-10 h-10 rounded-xl bg-white/20 hover:bg-white/30 flex items-center justify-center transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-2xl bg-white/20 flex items-center justify-center">
                  <Sparkles className="w-6 h-6" />
                </div>
                <div>
                  <h2 className="text-2xl font-bold">Create Support Ticket</h2>
                  <p className="text-emerald-100 text-sm">We'll get back to you within 24 hours</p>
                </div>
              </div>
            </div>

            {/* Modal Body */}
            <div className="p-6 space-y-5 overflow-y-auto max-h-[60vh]">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Category
                  </label>
                  <select
                    value={newTicket.category}
                    onChange={(e) => setNewTicket({ ...newTicket, category: e.target.value })}
                    className="w-full px-4 py-3 bg-gray-50 border-0 rounded-xl focus:ring-2 focus:ring-emerald-500 transition-all"
                  >
                    <option value="booking_issue">Booking Issue</option>
                    <option value="payment_issue">Payment Issue</option>
                    <option value="helper_complaint">Helper Complaint</option>
                    <option value="technical_issue">Technical Issue</option>
                    <option value="account_issue">Account Issue</option>
                    <option value="refund_request">Refund Request</option>
                    <option value="other">Other</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Priority
                  </label>
                  <select
                    value={newTicket.priority}
                    onChange={(e) => setNewTicket({ ...newTicket, priority: e.target.value })}
                    className="w-full px-4 py-3 bg-gray-50 border-0 rounded-xl focus:ring-2 focus:ring-emerald-500 transition-all"
                  >
                    <option value="low">Low</option>
                    <option value="medium">Medium</option>
                    <option value="high">High</option>
                    <option value="urgent">Urgent</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Subject
                </label>
                <input
                  type="text"
                  value={newTicket.subject}
                  onChange={(e) => setNewTicket({ ...newTicket, subject: e.target.value })}
                  placeholder="Brief description of your issue"
                  className="w-full px-4 py-3 bg-gray-50 border-0 rounded-xl focus:ring-2 focus:ring-emerald-500 transition-all"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Description
                </label>
                <textarea
                  value={newTicket.description}
                  onChange={(e) => setNewTicket({ ...newTicket, description: e.target.value })}
                  placeholder="Please provide as much detail as possible about your issue..."
                  rows={5}
                  className="w-full px-4 py-3 bg-gray-50 border-0 rounded-xl focus:ring-2 focus:ring-emerald-500 transition-all resize-none"
                />
              </div>
            </div>

            {/* Modal Footer */}
            <div className="p-6 bg-gray-50 border-t border-gray-100 flex gap-3">
              <button
                onClick={() => setShowNewTicket(false)}
                className="flex-1 px-6 py-3.5 bg-white border border-gray-200 rounded-xl font-semibold text-gray-700 hover:bg-gray-100 transition-colors"
                disabled={isSubmitting}
              >
                Cancel
              </button>
              <button
                onClick={handleCreateTicket}
                disabled={isSubmitting || !newTicket.subject.trim() || !newTicket.description.trim()}
                className="flex-1 flex items-center justify-center gap-2 px-6 py-3.5 bg-gradient-to-r from-emerald-500 to-teal-500 text-white rounded-xl font-semibold hover:shadow-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isSubmitting ? (
                  <>
                    <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    Creating...
                  </>
                ) : (
                  <>
                    <Send className="w-5 h-5" />
                    Submit Ticket
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
