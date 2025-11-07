'use server'
import { createClient } from '@/lib/supabase/server'
import Link from 'next/link'

export default async function AdminSupportPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return <div className="p-6">Not authenticated</div>
  const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).single()
  if ((profile as any)?.role !== 'admin') return <div className="p-6">Unauthorized</div>

  // Fetch support tickets
  const { data: tickets } = await supabase
    .from('support_tickets')
    .select('id, ticket_number, subject, category, priority, status, created_at, profiles:user_id(full_name, email)')
    .order('created_at', { ascending: false })
    .limit(100)

  // Get statistics
  const { data: stats } = await supabase.rpc('get_support_statistics')

  const openCount = tickets?.filter((t: any) => ['open', 'assigned', 'in_progress'].includes(t.status)).length || 0
  const resolvedToday = tickets?.filter((t: any) => {
    const today = new Date().toDateString()
    return t.status === 'resolved' && new Date(t.created_at).toDateString() === today
  }).length || 0

  return (
    <div className="min-h-screen bg-primary-50 py-10 px-4">
      <div className="mx-auto max-w-7xl space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">Customer Support</h1>
            <p className="text-sm text-muted-foreground mt-1">Manage support tickets & customer queries</p>
          </div>
          <div className="flex gap-2">
            <select className="px-3 py-2 border rounded-md text-sm">
              <option>All Priorities</option>
              <option>Urgent</option>
              <option>High</option>
              <option>Medium</option>
              <option>Low</option>
            </select>
            <select className="px-3 py-2 border rounded-md text-sm">
              <option>All Status</option>
              <option>Open</option>
              <option>Assigned</option>
              <option>In Progress</option>
              <option>Resolved</option>
            </select>
          </div>
        </div>

        <div className="grid gap-4 md:grid-cols-4">
          <div className="bg-white p-4 rounded-lg border">
            <div className="text-xs text-gray-500">Open Tickets</div>
            <div className="text-2xl font-bold">{openCount}</div>
          </div>
          <div className="bg-white p-4 rounded-lg border">
            <div className="text-xs text-gray-500">In Progress</div>
            <div className="text-2xl font-bold">{tickets?.filter((t: any) => t.status === 'in_progress').length || 0}</div>
          </div>
          <div className="bg-white p-4 rounded-lg border">
            <div className="text-xs text-gray-500">Resolved Today</div>
            <div className="text-2xl font-bold">{resolvedToday}</div>
          </div>
          <div className="bg-white p-4 rounded-lg border">
            <div className="text-xs text-gray-500">Avg Response Time</div>
            <div className="text-2xl font-bold">{stats?.[0]?.avg_first_response_minutes ? `${Math.round(stats[0].avg_first_response_minutes / 60)}h` : '—'}</div>
          </div>
        </div>

        <div className="bg-white rounded-lg border shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Ticket #</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Subject</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Customer</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Category</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Priority</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Created</th>
                  <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {(tickets || []).map((ticket: any) => (
                  <tr key={ticket.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3 text-xs font-mono">{ticket.ticket_number}</td>
                    <td className="px-4 py-3">
                      <div className="font-medium text-sm">{ticket.subject}</div>
                    </td>
                    <td className="px-4 py-3">
                      <div className="text-sm">{ticket.profiles?.full_name || '—'}</div>
                      <div className="text-xs text-gray-500">{ticket.profiles?.email}</div>
                    </td>
                    <td className="px-4 py-3 text-sm capitalize">{ticket.category.replace('_', ' ')}</td>
                    <td className="px-4 py-3">
                      <span className={`inline-flex px-2 py-1 text-xs rounded-full ${
                        ticket.priority === 'urgent' ? 'bg-red-100 text-red-700' :
                        ticket.priority === 'high' ? 'bg-orange-100 text-orange-700' :
                        ticket.priority === 'medium' ? 'bg-yellow-100 text-yellow-700' :
                        'bg-gray-100 text-gray-700'
                      }`}>
                        {ticket.priority}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <span className={`inline-flex px-2 py-1 text-xs rounded-full ${
                        ticket.status === 'resolved' ? 'bg-green-100 text-green-700' :
                        ticket.status === 'in_progress' ? 'bg-blue-100 text-blue-700' :
                        ticket.status === 'open' ? 'bg-yellow-100 text-yellow-700' :
                        'bg-gray-100 text-gray-700'
                      }`}>
                        {ticket.status}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-500">{new Date(ticket.created_at).toLocaleDateString()}</td>
                    <td className="px-4 py-3 text-right">
                      <Link href={`/admin/support/${ticket.id}`} className="text-primary hover:underline text-sm">View</Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {(!tickets || tickets.length === 0) && (
              <div className="p-8 text-center text-gray-500">No support tickets found</div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
