'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { LoadingSpinner } from '@/components/ui/loading'
import { scheduleVideoCall, createVideoCallSession } from '@/app/actions/video-calls'

export default function CustomerScheduleVideoCallPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  
  const [serviceRequestId, setServiceRequestId] = useState('')
  const [callType, setCallType] = useState('consultation')
  const [scheduledTime, setScheduledTime] = useState('')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    const formData = new FormData()
    formData.append('service_request_id', serviceRequestId)
    formData.append('call_type', callType)
    formData.append('scheduled_for', scheduledTime)

    const result = await createVideoCallSession(formData)

    if (result.error) {
      setError(result.error)
      setLoading(false)
    } else if (result.session) {
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
                <label className="text-sm font-medium">Service Request ID *</label>
                <Input
                  value={serviceRequestId}
                  onChange={(e) => setServiceRequestId(e.target.value)}
                  placeholder="Enter service request ID"
                  required
                />
                <p className="text-xs text-muted-foreground">Select from your active bookings</p>
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
