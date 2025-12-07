'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { LoadingSpinner } from '@/components/ui/loading'
import { scheduleVideoCall, createVideoCallSession } from '@/app/actions/video-calls'
import { createClient } from '@/lib/supabase/client'

interface ServiceRequest {
  id: string
  title: string
  status: string
  created_at: string
}

export default function CustomerScheduleVideoCallPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [loadingRequests, setLoadingRequests] = useState(true)
  const [error, setError] = useState('')
  const [serviceRequests, setServiceRequests] = useState<ServiceRequest[]>([])
  
  const [serviceRequestId, setServiceRequestId] = useState('')
  const [callType, setCallType] = useState('consultation')
  const [scheduledTime, setScheduledTime] = useState('')

  useEffect(() => {
    loadServiceRequests()
  }, [])

  const loadServiceRequests = async () => {
    setLoadingRequests(true)
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    
    if (!user) {
      setLoadingRequests(false)
      return
    }

    // Fetch active service requests for the customer
    const { data, error } = await supabase
      .from('service_requests')
      .select('id, title, status, created_at')
      .eq('customer_id', user.id)
      .in('status', ['open', 'assigned', 'in_progress', 'pending_payment'])
      .order('created_at', { ascending: false })

    if (!error && data) {
      setServiceRequests(data)
      // Auto-select first request if available
      if (data.length > 0) {
        setServiceRequestId(data[0].id)
      }
    }
    setLoadingRequests(false)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    const formData = new FormData()
    formData.append('service_request_id', serviceRequestId)
    formData.append('call_type', callType)
    formData.append('scheduled_for', scheduledTime)

    const result = await createVideoCallSession(formData)

    if ('error' in result && result.error) {
      setError(result.error)
      setLoading(false)
    } else if ('session' in result && result.session) {
      router.push(`/customer/video-calls/${result.session.id}`)
    }
  }

  const getMinDateTime = () => {
    const now = new Date()
    now.setMinutes(now.getMinutes() + 30) // Minimum 30 minutes from now
    return now.toISOString().slice(0, 16)
  }

  return (
    <div className="min-h-screen bg-primary-50 py-10 px-4">
      <div className="mx-auto max-w-2xl space-y-6">
        <div>
          <h1 className="text-3xl font-bold">Schedule Video Call</h1>
          <p className="text-muted-foreground">Book a video consultation with your helper</p>
        </div>

        {error && (
          <div className="rounded-lg bg-red-50 border border-red-200 p-4">
            <p className="text-sm text-red-600">{error}</p>
          </div>
        )}

        <Card>
          <CardHeader>
            <CardTitle>Call Details</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">Service Request *</label>
                {loadingRequests ? (
                  <div className="flex items-center gap-2 py-2">
                    <LoadingSpinner size="sm" />
                    <span className="text-sm text-muted-foreground">Loading your requests...</span>
                  </div>
                ) : serviceRequests.length === 0 ? (
                  <div className="p-4 bg-amber-50 border border-amber-200 rounded-lg">
                    <p className="text-sm text-amber-700">No active service requests found.</p>
                    <p className="text-xs text-amber-600 mt-1">Create a service request first to schedule a video call.</p>
                    <Button 
                      type="button" 
                      variant="outline" 
                      size="sm" 
                      className="mt-2"
                      onClick={() => router.push('/customer/requests/new')}
                    >
                      Create New Request
                    </Button>
                  </div>
                ) : (
                  <select
                    className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                    value={serviceRequestId}
                    onChange={(e) => setServiceRequestId(e.target.value)}
                    required
                  >
                    <option value="">Select a service request</option>
                    {serviceRequests.map((request) => (
                      <option key={request.id} value={request.id}>
                        {request.title} ({request.status.replace('_', ' ')}) - {new Date(request.created_at).toLocaleDateString()}
                      </option>
                    ))}
                  </select>
                )}
                <p className="text-xs text-muted-foreground">Select from your active service requests</p>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">Call Type *</label>
                <select
                  className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                  value={callType}
                  onChange={(e) => setCallType(e.target.value)}
                  required
                >
                  <option value="consultation">Consultation</option>
                  <option value="inspection">Inspection</option>
                  <option value="quote">Quote Discussion</option>
                  <option value="follow_up">Follow-up</option>
                  <option value="support">Support</option>
                </select>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">Scheduled Time *</label>
                <Input
                  type="datetime-local"
                  value={scheduledTime}
                  onChange={(e) => setScheduledTime(e.target.value)}
                  min={getMinDateTime()}
                  required
                />
              </div>

              <div className="p-4 bg-blue-50 border border-blue-200 rounded">
                <h4 className="font-medium text-sm mb-2">💡 Tips for a successful video call:</h4>
                <ul className="text-xs text-muted-foreground space-y-1">
                  <li>• Ensure you have a stable internet connection</li>
                  <li>• Test your camera and microphone before the call</li>
                  <li>• Join 5 minutes early to avoid technical issues</li>
                  <li>• Prepare questions or topics to discuss in advance</li>
                </ul>
              </div>

              <div className="flex gap-2 pt-4 border-t">
                <Button type="submit" disabled={loading} className="flex-1">
                  {loading ? (
                    <>
                      <LoadingSpinner size="sm" />
                      <span>Scheduling...</span>
                    </>
                  ) : (
                    '📅 Schedule Call'
                  )}
                </Button>
                <Button type="button" variant="outline" onClick={() => router.back()}>
                  Cancel
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Video Call Features</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid md:grid-cols-2 gap-4 text-sm">
              <div className="flex items-start gap-2">
                <span className="text-primary">✓</span>
                <div>
                  <div className="font-medium">HD Video Quality</div>
                  <div className="text-muted-foreground">Crystal clear video streaming</div>
                </div>
              </div>
              <div className="flex items-start gap-2">
                <span className="text-primary">✓</span>
                <div>
                  <div className="font-medium">Screen Sharing</div>
                  <div className="text-muted-foreground">Share documents and images</div>
                </div>
              </div>
              <div className="flex items-start gap-2">
                <span className="text-primary">✓</span>
                <div>
                  <div className="font-medium">Call Recording</div>
                  <div className="text-muted-foreground">Save for future reference</div>
                </div>
              </div>
              <div className="flex items-start gap-2">
                <span className="text-primary">✓</span>
                <div>
                  <div className="font-medium">Secure Connection</div>
                  <div className="text-muted-foreground">End-to-end encrypted</div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
