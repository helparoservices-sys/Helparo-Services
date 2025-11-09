'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { LoadingSpinner } from '@/components/ui/loading'
import { createSupportTicket } from '@/app/actions/support'

export default function NewTicketPage() {
  const router = useRouter()
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')
  const [formData, setFormData] = useState({
    subject: '',
    category: 'general',
    priority: 'medium',
    description: ''
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!formData.subject.trim() || !formData.description.trim()) {
      setError('Please fill all required fields')
      return
    }

    setSubmitting(true)
    setError('')

    const data = new FormData()
    data.append('subject', formData.subject)
    data.append('category', formData.category)
    data.append('priority', formData.priority)
    data.append('description', formData.description)

    const result = await createSupportTicket(data)

    if ('error' in result && result.error) {
      setError(result.error)
      setSubmitting(false)
    } else if ('ticket' in result && result.ticket) {
      router.push(`/customer/support/${result.ticket.id}`)
    }
  }

  return (
    <div className="min-h-screen bg-primary-50 py-10 px-4">
      <div className="mx-auto max-w-2xl space-y-6">
        <div>
          <h1 className="text-3xl font-bold">Create Support Ticket</h1>
          <p className="text-muted-foreground">We're here to help you</p>
        </div>

        {error && (
          <div className="rounded-lg bg-red-50 border border-red-200 p-4">
            <p className="text-sm text-red-600">{error}</p>
          </div>
        )}

        <Card>
          <CardHeader>
            <CardTitle>Ticket Details</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Subject */}
              <div className="space-y-2">
                <label className="text-sm font-medium">Subject *</label>
                <Input
                  type="text"
                  value={formData.subject}
                  onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
                  placeholder="Brief description of your issue"
                  required
                />
              </div>

              {/* Category */}
              <div className="space-y-2">
                <label className="text-sm font-medium">Category *</label>
                <select
                  value={formData.category}
                  onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                  className="w-full h-10 rounded-md border border-input bg-background px-3 py-2 text-sm"
                  required
                >
                  <option value="general">General Inquiry</option>
                  <option value="booking">Booking Issue</option>
                  <option value="payment">Payment Issue</option>
                  <option value="service_quality">Service Quality</option>
                  <option value="refund">Refund Request</option>
                  <option value="account">Account Issue</option>
                  <option value="technical">Technical Problem</option>
                  <option value="other">Other</option>
                </select>
              </div>

              {/* Priority */}
              <div className="space-y-2">
                <label className="text-sm font-medium">Priority *</label>
                <div className="grid grid-cols-4 gap-2">
                  {['low', 'medium', 'high', 'urgent'].map(priority => (
                    <button
                      key={priority}
                      type="button"
                      onClick={() => setFormData({ ...formData, priority })}
                      className={`py-2 rounded-lg text-sm font-medium transition-colors ${
                        formData.priority === priority
                          ? 'bg-primary text-white'
                          : 'bg-white text-muted-foreground hover:bg-gray-50'
                      }`}
                    >
                      {priority === 'low' && '🔵'}
                      {priority === 'medium' && '🟡'}
                      {priority === 'high' && '🟠'}
                      {priority === 'urgent' && '🔴'}
                      {' '}{priority}
                    </button>
                  ))}
                </div>
              </div>

              {/* Description */}
              <div className="space-y-2">
                <label className="text-sm font-medium">Description *</label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Provide detailed information about your issue..."
                  rows={6}
                  className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm resize-none"
                  required
                />
                <p className="text-xs text-muted-foreground">
                  Provide as much detail as possible to help us resolve your issue quickly
                </p>
              </div>

              {/* Info Box */}
              <div className="rounded-lg bg-blue-50 border border-blue-200 p-4">
                <div className="flex gap-3">
                  <span className="text-2xl">💡</span>
                  <div className="text-sm space-y-1">
                    <p className="font-medium text-blue-900">Response Times (SLA)</p>
                    <p className="text-blue-700">
                      • Low: 24 hours<br />
                      • Medium: 12 hours<br />
                      • High: 4 hours<br />
                      • Urgent: 1 hour
                    </p>
                  </div>
                </div>
              </div>

              {/* Submit */}
              <div className="flex gap-3 pt-4">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => router.back()}
                  disabled={submitting}
                  className="flex-1"
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  disabled={submitting}
                  className="flex-1"
                >
                  {submitting ? (
                    <>
                      <LoadingSpinner size="sm" />
                      <span>Creating...</span>
                    </>
                  ) : (
                    'Create Ticket'
                  )}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
