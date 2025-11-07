'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

export default function CustomerReviewPage() {
  const params = useParams<{ id: string }>()
  const requestId = params.id
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [rating, setRating] = useState(5)
  const [comment, setComment] = useState('')
  const [alreadyReviewed, setAlreadyReviewed] = useState(false)

  useEffect(() => {
    const load = async () => {
      setLoading(true)
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { setError('Not authenticated'); setLoading(false); return }

      // Fetch request to validate state and get helper
      const { data: req, error: reqErr } = await supabase
        .from('service_requests')
        .select('id, customer_id, assigned_helper_id, status')
        .eq('id', requestId)
        .maybeSingle()
      if (reqErr || !req) { setError('Request not found'); setLoading(false); return }
      const reqTyped = req as { id: string; customer_id: string; assigned_helper_id: string | null; status: string }
      if (reqTyped.customer_id !== user.id) { setError('Not authorized'); setLoading(false); return }
      if (reqTyped.status !== 'completed') { setError('Request not completed yet'); setLoading(false); return }
      if (!reqTyped.assigned_helper_id) { setError('No helper assigned'); setLoading(false); return }

      // Check if already reviewed
      const { data: existing } = await supabase
        .from('reviews')
        .select('id')
        .eq('request_id', requestId)
        .eq('reviewer_id', user.id)
  .eq('reviewee_id', reqTyped.assigned_helper_id)
        .maybeSingle()
      if (existing) setAlreadyReviewed(true)

      setLoading(false)
    }
    if (requestId) load()
  }, [requestId])

  const submit = async () => {
    setError('')
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return

    const { data: req } = await supabase
      .from('service_requests')
      .select('assigned_helper_id')
      .eq('id', requestId)
      .maybeSingle()
    const helperId = (req as any)?.assigned_helper_id
    if (!helperId) { setError('Missing helper'); return }

    const payload = {
      request_id: requestId as string,
      reviewer_id: user.id,
      reviewee_id: helperId,
      rating,
      comment: comment.trim() || null,
    }
    const { error: insErr } = await (supabase.from('reviews') as any).insert(payload)
    if (insErr) { setError(insErr.message); return }
    router.push(`/customer/requests/${requestId}`)
  }

  return (
    <div className="min-h-screen bg-primary-50 py-10 px-4">
      <div className="mx-auto max-w-xl">
        <Card>
          <CardHeader>
            <CardTitle>Leave a Review</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {loading ? (
              <p className="text-sm text-muted-foreground">Loading...</p>
            ) : error ? (
              <p className="text-sm text-red-500">{error}</p>
            ) : alreadyReviewed ? (
              <p className="text-sm text-green-600">You already left a review.</p>
            ) : (
              <>
                <div className="space-y-2">
                  <label className="text-sm font-medium">Rating (1-5)</label>
                  <input type="number" min={1} max={5} value={rating} onChange={(e) => setRating(Number(e.target.value))} className="h-10 w-24 rounded border px-2" />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">Comment (optional)</label>
                  <textarea className="min-h-[120px] w-full rounded border px-2 py-2 text-sm" value={comment} onChange={(e) => setComment(e.target.value)} />
                </div>
                <Button onClick={submit}>Submit Review</Button>
              </>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
