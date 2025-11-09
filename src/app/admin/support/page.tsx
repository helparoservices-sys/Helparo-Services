'use server'
import { createClient } from '@/lib/supabase/server'
import Link from 'next/link'
import { Headset, AlertCircle, Clock, CheckCircle, TrendingUp, Filter, Eye, MessageCircle } from 'lucide-react'

export default async function AdminSupportPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return <div className="p-6 text-center">Not authenticated</div>
  const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).single()
  if ((profile as any)?.role !== 'admin') return <div className="p-6 text-center">Unauthorized</div>

  // Fetch support tickets
  const { data: tickets } = await supabase
    .from('support_tickets')
    .select('id, ticket_number, subject, category, priority, status, created_at, profiles:user_id(full_name, email)')
    .order('created_at', { ascending: false })
    .limit(100)

  // Get statistics
  const { data: stats } = await supabase.rpc('get_support_statistics')

  const openCount = tickets?.filter((t: any) => ['open', 'assigned', 'in_progress'].includes(t.status)).length || 0
  const inProgressCount = tickets?.filter((t: any) => t.status === 'in_progress').length || 0
  const resolvedToday = tickets?.filter((t: any) => {
    const today = new Date().toDateString()
    return t.status === 'resolved' && new Date(t.created_at).toDateString() === today
  }).length || 0
  const totalResolved = tickets?.filter((t: any) => t.status === 'resolved').length || 0

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-slate-900 dark:text-white">Customer Support</h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">Manage support tickets & customer queries</p>
        </div>
        <div className="flex gap-2">
          <select className="px-3 py-2 border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white rounded-lg text-sm">
            <option>All Priorities</option>
            <option>Urgent</option>
            <option>High</option>
            <option>Medium</option>
            <option>Low</option>
          </select>
          <select className="px-3 py-2 border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white rounded-lg text-sm">
            <option>All Status</option>
            <option>Open</option>
            <option>Assigned</option>
            <option>In Progress</option>
            <option>Resolved</option>
          </select>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-white/80 dark:bg-slate-800/80 backdrop-blur-xl rounded-lg border border-white/20 dark:border-slate-700/50 shadow-lg p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-slate-600 dark:text-slate-400">Open Tickets</p>
              <p className="text-2xl font-bold text-slate-900 dark:text-white mt-1">{openCount}</p>
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
              <p className="text-2xl font-bold text-slate-900 dark:text-white mt-1">{inProgressCount}</p>
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
              <p className="text-2xl font-bold text-slate-900 dark:text-white mt-1">{resolvedToday}</p>
            </div>
            <div className="w-12 h-12 rounded-lg bg-green-100 dark:bg-green-900/30 flex items-center justify-center shadow-lg">
              <CheckCircle className="h-6 w-6 text-green-600 dark:text-green-400" />
            </div>
          </div>
        </div>

        <div className="bg-white/80 dark:bg-slate-800/80 backdrop-blur-xl rounded-lg border border-white/20 dark:border-slate-700/50 shadow-lg p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-slate-600 dark:text-slate-400">Avg Response</p>
              <p className="text-2xl font-bold text-slate-900 dark:text-white mt-1">
                {stats?.[0]?.avg_first_response_minutes ? `${Math.round(stats[0].avg_first_response_minutes / 60)}h` : '—'}
              </p>
            </div>
            <div className="w-12 h-12 rounded-lg bg-purple-100 dark:bg-purple-900/30 flex items-center justify-center shadow-lg">
              <TrendingUp className="h-6 w-6 text-purple-600 dark:text-purple-400" />
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
                <th className="px-6 py-4 text-left text-xs font-medium text-slate-700 dark:text-slate-300 uppercase tracking-wider">Created</th>
                <th className="px-6 py-4 text-right text-xs font-medium text-slate-700 dark:text-slate-300 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-700/50">
              {(tickets || []).map((ticket: any) => (
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
                    <div className="text-sm text-slate-900 dark:text-white">{ticket.profiles?.full_name || '—'}</div>
                    <div className="text-xs text-slate-500 dark:text-slate-400">{ticket.profiles?.email}</div>
                  </td>
                  <td className="px-6 py-4">
                    <span className="text-sm capitalize text-slate-600 dark:text-slate-400">{ticket.category.replace('_', ' ')}</span>
                  </td>
                  <td className="px-6 py-4">
                    <span className={`inline-flex items-center gap-1 px-2 py-1 text-xs rounded-full ${
                      ticket.priority === 'urgent' ? 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400' :
                      ticket.priority === 'high' ? 'bg-orange-100 dark:bg-orange-900/30 text-orange-700 dark:text-orange-400' :
                      ticket.priority === 'medium' ? 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-400' :
                      'bg-slate-100 dark:bg-slate-900/30 text-slate-700 dark:text-slate-400'
                    }`}>
                      {ticket.priority === 'urgent' && <AlertCircle className="h-3 w-3" />}
                      {ticket.priority}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <span className={`inline-flex items-center gap-1 px-2 py-1 text-xs rounded-full ${
                      ticket.status === 'resolved' ? 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400' :
                      ticket.status === 'in_progress' ? 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400' :
                      ticket.status === 'open' ? 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-400' :
                      'bg-slate-100 dark:bg-slate-900/30 text-slate-700 dark:text-slate-400'
                    }`}>
                      {ticket.status === 'resolved' && <CheckCircle className="h-3 w-3" />}
                      {ticket.status === 'in_progress' && <Clock className="h-3 w-3" />}
                      {ticket.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-sm text-slate-600 dark:text-slate-400">{new Date(ticket.created_at).toLocaleDateString()}</td>
                  <td className="px-6 py-4 text-right">
                    <Link 
                      href={`/admin/support/${ticket.id}`} 
                      className="inline-flex items-center gap-1 text-primary-600 dark:text-primary-400 hover:underline text-sm"
                    >
                      <Eye className="h-4 w-4" />
                      View
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {(!tickets || tickets.length === 0) && (
            <div className="p-12 text-center">
              <Headset className="h-16 w-16 text-slate-400 dark:text-slate-600 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-2">No Support Tickets</h3>
              <p className="text-sm text-slate-500 dark:text-slate-400">All caught up! No pending support tickets at the moment.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
