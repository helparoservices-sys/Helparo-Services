'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { releaseEscrow } from '@/app/actions/payments'
import { PaymentSafetyInfo } from '@/components/trust-badges'

interface RequestRow { id: string; title: string; description: string; status: string; created_at: string }
interface ApplicationRow { id: string; helper_id: string; status: string; created_at: string }

export default function RequestDetailPage() {
  const params = useParams<{ id: string }>()
  const router = useRouter()
  const requestId = params.id

  const [request, setRequest] = useState<RequestRow | null>(null)
  const [applications, setApplications] = useState<ApplicationRow[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [reviewed, setReviewed] = useState(false)

  useEffect(() => {
    const load = async () => {
      setLoading(true)
      setError('')
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { setError('Not authenticated'); setLoading(false); return }

      const { data: r, error: rErr } = await supabase
        .from('service_requests')
        .select('id, title, description, status, assigned_helper_id, created_at')
        .eq('id', requestId)
        .maybeSingle()
      if (rErr || !r) { setError('Request not found'); setLoading(false); return }
      const rTyped = r as { id: string; title: string; description: string; status: string; created_at: string; assigned_helper_id: string | null }
      setRequest(rTyped as any)

      const { data: apps } = await supabase
        .from('request_applications')
        .select('id, helper_id, status, created_at')
        .eq('request_id', requestId)
        .order('created_at', { ascending: false })
      setApplications((apps || []) as any)

      // Check if customer already reviewed helper
      if (rTyped.assigned_helper_id) {
        const { data: me } = await supabase.auth.getUser()
        const reviewerId = me?.user?.id
        if (reviewerId) {
          const { data: rev } = await supabase
            .from('reviews')
            .select('id')
            .eq('request_id', requestId)
            .eq('reviewer_id', reviewerId)
            .eq('reviewee_id', rTyped.assigned_helper_id)
            .maybeSingle()
          if (rev) setReviewed(true)
        }
      }
      setLoading(false)
    }
    if (requestId) load()
  }, [requestId])

  const assign = async (applicationId: string) => {
    setError('')
  const { error: rpcErr } = await (supabase.rpc as any)('accept_application', { p_request_id: requestId, p_application_id: applicationId })
    if (rpcErr) { setError(rpcErr.message); return }
    router.refresh()
  }

  return (
    <div className="min-h-screen bg-primary-50 py-10 px-4">
      <div className="mx-auto max-w-3xl space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>Request Detail</CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? (
              <p className="text-sm text-muted-foreground">Loading...</p>
            ) : error ? (
              <p className="text-sm text-red-500">{error}</p>
            ) : request ? (
              <div className="space-y-3">
                <div className="text-xl font-semibold">{request.title}</div>
                <div className="whitespace-pre-wrap text-sm">{request.description}</div>
                <div className="text-xs text-muted-foreground">Status: {request.status} • {new Date(request.created_at).toLocaleString()}</div>
                <div className="mt-4">
                  <div className="text-sm font-medium mb-2">Applications</div>
                  <div className="space-y-2">
                    {applications.length === 0 && (
                      <div className="text-sm text-muted-foreground">No applications yet.</div>
                    )}
                    {applications.map(a => (
                      <div key={a.id} className="rounded-md border bg-white p-3 flex items-center justify-between">
                        <div>
                          <div className="text-sm">Helper: {a.helper_id}</div>
                          <div className="text-xs text-muted-foreground">Applied: {new Date(a.created_at).toLocaleString()} • Status: {a.status}</div>
                        </div>
                        <div>
                          {request.status === 'open' && a.status === 'applied' && (
                            <Button size="sm" onClick={() => assign(a.id)}>Assign</Button>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
                {request.status === 'assigned' && (
                  <div className="mt-6 space-y-3">
                    <div className="text-sm font-medium">This request is assigned.</div>
                    <Button size="sm" variant="outline" onClick={async () => {
                      setError('')
                      // Mark as completed
                      const { error: updErr } = await (supabase.from('service_requests') as any)
                        .update({ status: 'completed' })
                        .eq('id', request.id)
                      if (updErr) { setError(updErr.message); return }
                      
                      // Auto-release escrow
                      const formData = new FormData()
                      formData.append('requestId', request.id)
                      const releaseResult = await releaseEscrow(formData)
                      if ('error' in releaseResult && releaseResult.error) {
                        setError(`Request completed but escrow release failed: ${releaseResult.error}`)
                      }
                      
                      router.refresh()
                    }}>Mark Completed</Button>
                  </div>
                )}
                {request.status === 'completed' && !reviewed && (
                  <div className="mt-6">
                    <Button size="sm" onClick={() => router.push(`/customer/requests/${request.id}/review`)}>Leave a Review</Button>
                  </div>
                )}
              </div>
            ) : null}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
