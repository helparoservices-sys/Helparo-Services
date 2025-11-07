'use client'

import { useEffect, useState, useRef } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { LoadingSpinner, PageLoader } from '@/components/ui/loading'
import { getTicketDetails, sendTicketMessage, getTicketMessages } from '@/app/actions/support'

interface Message {
  id: string
  message: string
  is_internal_note: boolean
  created_at: string
  sender: {
    email: string
  }
}

interface Ticket {
  id: string
  ticket_number: string
  subject: string
  category: string
  priority: string
  status: string
  description: string
  created_at: string
  sla_deadline: string | null
}

export default function TicketDetailsPage() {
  const params = useParams()
  const ticketId = params.id as string
  const router = useRouter()
  
  const [loading, setLoading] = useState(true)
  const [sending, setSending] = useState(false)
  const [ticket, setTicket] = useState<Ticket | null>(null)
  const [messages, setMessages] = useState<Message[]>([])
  const [newMessage, setNewMessage] = useState('')
  const [error, setError] = useState('')
  
  const messagesEndRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    loadTicketData()
    
    // Auto-refresh messages every 10 seconds
    const interval = setInterval(loadMessages, 10000)
    return () => clearInterval(interval)
  }, [ticketId])

  useEffect(() => {
    // Scroll to bottom when messages change
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  const loadTicketData = async () => {
    setLoading(true)
    setError('')

    const result = await getTicketDetails(ticketId)

    if (result.error) {
      setError(result.error)
    } else {
      setTicket(result.ticket)
      // Load messages separately
      const messagesResult = await getTicketMessages(ticketId)
      if (!messagesResult.error) {
        setMessages(messagesResult.messages || [])
      }
    }

    setLoading(false)
  }

  const loadMessages = async () => {
    const result = await getTicketMessages(ticketId)
    if (!result.error) {
      setMessages(result.messages || [])
    }
  }

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!newMessage.trim()) return

    setSending(true)
    setError('')

    const formData = new FormData()
    formData.append('ticket_id', ticketId)
    formData.append('message', newMessage)
    formData.append('is_internal_note', 'false')

    const result = await sendTicketMessage(formData)

    if (result.error) {
      setError(result.error)
    } else {
      setNewMessage('')
      await loadMessages()
    }

    setSending(false)
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

  if (loading) return <PageLoader />

  if (error && !ticket) {
    return (
      <div className="min-h-screen bg-primary-50 flex items-center justify-center p-4">
        <Card className="max-w-md w-full">
          <CardContent className="pt-6 text-center space-y-4">
            <p className="text-red-600">{error}</p>
            <Button onClick={() => router.back()}>Go Back</Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  if (!ticket) return null

  const slaBreach = ticket.sla_deadline && new Date(ticket.sla_deadline) < new Date()

  return (
    <div className="min-h-screen bg-primary-50 py-10 px-4">
      <div className="mx-auto max-w-4xl space-y-6">
        {/* Header */}
        <div>
          <button
            onClick={() => router.back()}
            className="text-sm text-muted-foreground hover:text-foreground mb-2"
          >
            ← Back to Tickets
          </button>
          <h1 className="text-3xl font-bold">{ticket.ticket_number}</h1>
          <p className="text-muted-foreground">{ticket.subject}</p>
        </div>

        {error && (
          <div className="rounded-lg bg-red-50 border border-red-200 p-4">
            <p className="text-sm text-red-600">{error}</p>
          </div>
        )}

        {/* Ticket Info */}
        <Card>
          <CardHeader>
            <CardTitle>Ticket Information</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div>
                <p className="text-xs text-muted-foreground">Status</p>
                <span className={`inline-block mt-1 text-xs px-2 py-1 rounded ${getStatusColor(ticket.status)}`}>
                  {ticket.status.replace('_', ' ')}
                </span>
              </div>
              
              <div>
                <p className="text-xs text-muted-foreground">Priority</p>
                <p className="mt-1 font-medium flex items-center gap-1">
                  {getPriorityIcon(ticket.priority)} {ticket.priority}
                </p>
              </div>
              
              <div>
                <p className="text-xs text-muted-foreground">Category</p>
                <p className="mt-1 font-medium capitalize">{ticket.category.replace('_', ' ')}</p>
              </div>
              
              <div>
                <p className="text-xs text-muted-foreground">Created</p>
                <p className="mt-1 font-medium">{new Date(ticket.created_at).toLocaleDateString()}</p>
              </div>
            </div>

            {ticket.sla_deadline && (
              <div className={`rounded-lg border p-3 ${slaBreach ? 'bg-red-50 border-red-200' : 'bg-blue-50 border-blue-200'}`}>
                <p className={`text-sm font-medium ${slaBreach ? 'text-red-900' : 'text-blue-900'}`}>
                  {slaBreach ? '⚠️ SLA Breached' : '⏰ SLA Deadline'}
                </p>
                <p className={`text-xs ${slaBreach ? 'text-red-700' : 'text-blue-700'}`}>
                  {new Date(ticket.sla_deadline).toLocaleString()}
                </p>
              </div>
            )}

            <div className="pt-4 border-t">
              <p className="text-xs text-muted-foreground mb-2">Original Description</p>
              <p className="text-sm whitespace-pre-wrap">{ticket.description}</p>
            </div>
          </CardContent>
        </Card>

        {/* Messages */}
        <Card>
          <CardHeader>
            <CardTitle>Conversation</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4 max-h-96 overflow-y-auto mb-4">
              {messages.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-8">
                  No messages yet. Start the conversation below.
                </p>
              ) : (
                messages.map(msg => (
                  <div
                    key={msg.id}
                    className={`flex ${msg.is_internal_note ? 'justify-start' : 'justify-end'}`}
                  >
                    <div className={`max-w-[80%] space-y-1 ${msg.is_internal_note ? '' : 'text-right'}`}>
                      <div className={`rounded-lg p-3 ${
                        msg.is_internal_note 
                          ? 'bg-gray-100 text-gray-900' 
                          : 'bg-primary text-white'
                      }`}>
                        <p className="text-sm whitespace-pre-wrap">{msg.message}</p>
                      </div>
                      <p className="text-xs text-muted-foreground">
                        {msg.sender.email.split('@')[0]} • {new Date(msg.created_at).toLocaleString()}
                      </p>
                    </div>
                  </div>
                ))
              )}
              <div ref={messagesEndRef} />
            </div>

            {/* Message Input */}
            {ticket.status !== 'closed' && (
              <form onSubmit={handleSendMessage} className="flex gap-2">
                <Input
                  type="text"
                  value={newMessage}
                  onChange={(e) => setNewMessage(e.target.value)}
                  placeholder="Type your message..."
                  disabled={sending}
                  className="flex-1"
                />
                <Button type="submit" disabled={sending || !newMessage.trim()}>
                  {sending ? <LoadingSpinner size="sm" /> : 'Send'}
                </Button>
              </form>
            )}

            {ticket.status === 'closed' && (
              <div className="text-center py-4 text-sm text-muted-foreground">
                This ticket is closed. Create a new ticket if you need further assistance.
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
