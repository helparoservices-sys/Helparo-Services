'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { SkeletonTable } from '@/components/ui/loading'
import { getMyTickets } from '@/app/actions/support'

interface Ticket {
  id: string
  ticket_number: string
  subject: string
  category: string
  priority: string
  status: string
  created_at: string
  sla_deadline: string | null
}

export default function CustomerSupportPage() {
  const [loading, setLoading] = useState(true)
  const [tickets, setTickets] = useState<Ticket[]>([])
  const [error, setError] = useState('')
  const [filterStatus, setFilterStatus] = useState<string>('all')

  useEffect(() => {
    loadTickets()
  }, [])

  const loadTickets = async () => {
    setLoading(true)
    setError('')

    const result = await getMyTickets()

    if (result.error) {
      setError(result.error)
    } else {
      setTickets(result.tickets || [])
    }

    setLoading(false)
  }

  const getStatusColor = (status: string) => {
    const colors: Record<string, string> = {
      open: 'bg-blue-100 text-blue-700',
      in_progress: 'bg-yellow-100 text-yellow-700',
      waiting_customer: 'bg-orange-100 text-orange-700',
      resolved: 'bg-green-100 text-green-700',
      closed: 'bg-gray-100 text-gray-700'
    }
    return colors[status] || 'bg-gray-100 text-gray-700'
  }

  const getPriorityIcon = (priority: string) => {
    const icons: Record<string, string> = {
      low: '🔵',
      medium: '🟡',
      high: '🟠',
      urgent: '🔴'
    }
    return icons[priority] || '⚪'
  }

  const isSLABreach = (deadline: string | null) => {
    if (!deadline) return false
    return new Date(deadline) < new Date()
  }

  const filteredTickets = filterStatus === 'all' 
    ? tickets 
    : tickets.filter(t => t.status === filterStatus)

  return (
    <div className="min-h-screen bg-primary-50 py-10 px-4">
      <div className="mx-auto max-w-6xl space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">Support Tickets</h1>
            <p className="text-muted-foreground">Get help with your issues</p>
          </div>
          <Link href="/customer/support/new">
            <button className="bg-primary text-white px-4 py-2 rounded-lg hover:bg-primary/90 transition-colors">
              + New Ticket
            </button>
          </Link>
        </div>

        {error && (
          <div className="rounded-lg bg-red-50 border border-red-200 p-4">
            <p className="text-sm text-red-600">{error}</p>
          </div>
        )}

        {/* Filter */}
        <div className="flex gap-2 overflow-x-auto pb-2">
          {['all', 'open', 'in_progress', 'waiting_customer', 'resolved', 'closed'].map(status => (
            <button
              key={status}
              onClick={() => setFilterStatus(status)}
              className={`px-4 py-2 rounded-lg text-sm font-medium whitespace-nowrap transition-colors ${
                filterStatus === status
                  ? 'bg-primary text-white'
                  : 'bg-white text-muted-foreground hover:bg-gray-50'
              }`}
            >
              {status === 'all' ? 'All' : status.replace('_', ' ')}
              {status !== 'all' && ` (${tickets.filter(t => t.status === status).length})`}
            </button>
          ))}
        </div>

        {loading ? (
          <SkeletonTable />
        ) : filteredTickets.length === 0 ? (
          <Card>
            <CardContent className="pt-6">
              <div className="text-center space-y-4">
                <p className="text-sm text-muted-foreground">
                  {filterStatus === 'all' ? 'No support tickets yet' : `No ${filterStatus.replace('_', ' ')} tickets`}
                </p>
                <Link href="/customer/support/new">
                  <button className="bg-primary text-white px-4 py-2 rounded-lg hover:bg-primary/90">
                    Create Your First Ticket
                  </button>
                </Link>
              </div>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-3">
            {filteredTickets.map(ticket => {
              const slaBreach = isSLABreach(ticket.sla_deadline)
              
              return (
                <Link key={ticket.id} href={`/customer/support/${ticket.id}`}>
                  <Card className={`hover:shadow-md transition-shadow cursor-pointer ${slaBreach ? 'border-red-300' : ''}`}>
                    <CardContent className="pt-6">
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex-1 space-y-2">
                          <div className="flex items-center gap-3">
                            <span className="text-2xl">{getPriorityIcon(ticket.priority)}</span>
                            <div>
                              <div className="flex items-center gap-2">
                                <h3 className="font-semibold">{ticket.ticket_number}</h3>
                                <span className={`text-xs px-2 py-1 rounded ${getStatusColor(ticket.status)}`}>
                                  {ticket.status.replace('_', ' ')}
                                </span>
                              </div>
                              <p className="text-sm text-muted-foreground">{ticket.subject}</p>
                            </div>
                          </div>
                          
                          <div className="flex items-center gap-4 text-xs text-muted-foreground">
                            <span>Category: {ticket.category}</span>
                            <span>•</span>
                            <span>Created: {new Date(ticket.created_at).toLocaleDateString()}</span>
                            {ticket.sla_deadline && (
                              <>
                                <span>•</span>
                                <span className={slaBreach ? 'text-red-600 font-medium' : ''}>
                                  {slaBreach ? '⚠️ SLA Breached' : `SLA: ${new Date(ticket.sla_deadline).toLocaleString()}`}
                                </span>
                              </>
                            )}
                          </div>
                        </div>
                        
                        <div className="text-right">
                          <span className="text-xs text-muted-foreground capitalize">{ticket.priority} priority</span>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </Link>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}
