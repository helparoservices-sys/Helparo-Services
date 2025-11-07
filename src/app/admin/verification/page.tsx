'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

interface PendingHelper {
  user_id: string
  full_name: string | null
  email: string
  status: string
}

export default function AdminVerificationPage() {
  const [helpers, setHelpers] = useState<PendingHelper[]>([])
  const [docs, setDocs] = useState<Record<string, { doc_type: string; file_path: string }[]>>({})
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [decision, setDecision] = useState<Record<string, 'approved' | 'rejected' | ''>>({})
  const [comment, setComment] = useState<Record<string, string>>({})

  useEffect(() => {
    const load = async () => {
      setLoading(true)
      setError('')
      // fetch pending helpers
      const { data, error: err } = await supabase
        .from('helper_profiles')
        .select('user_id, verification_status, profiles:profiles(full_name, email)')
        .eq('verification_status', 'pending' as any)
      if (err) { setError('Failed to load'); setLoading(false); return }
      const list = (data || []).map((row: any) => ({
        user_id: row.user_id,
        full_name: row.profiles?.full_name || null,
        email: row.profiles?.email || '',
        status: row.verification_status,
      }))
      setHelpers(list)

      // fetch docs for each
      for (const h of list) {
        const { data: d } = await supabase
          .from('verification_documents')
          .select('doc_type, file_path')
          .eq('user_id', h.user_id)
        setDocs(prev => ({ ...prev, [h.user_id]: d || [] }))
      }
      setLoading(false)
    }
    load()
  }, [])

  const viewDoc = async (path: string) => {
    const { data, error } = await supabase.storage.from('kyc').createSignedUrl(path, 60)
    if (!error && data?.signedUrl) {
      window.open(data.signedUrl, '_blank')
    }
  }

  const act = async (helperId: string, d: 'approved' | 'rejected') => {
    const c = comment[helperId] || ''
    // Update helper profile
    const { error: upErr } = await (supabase.from('helper_profiles') as any)
      .update({ is_approved: d === 'approved', verification_status: d })
      .eq('user_id', helperId)
    if (upErr) { setError(upErr.message); return }

    // Insert review row
    const { data: { user } } = await supabase.auth.getUser()
    if (user) {
      await (supabase.from('verification_reviews') as any).insert({
        helper_user_id: helperId,
        admin_user_id: user.id,
        decision: d,
        comment: c || null,
      })
    }

    // refresh list
    setHelpers(prev => prev.filter(h => h.user_id !== helperId))
  }

  return (
    <div className="min-h-screen bg-primary-50 py-10 px-4">
      <div className="mx-auto max-w-4xl space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>Pending Helper Verifications</CardTitle>
          </CardHeader>
          <CardContent>
            {loading && <p className="text-sm text-muted-foreground">Loading...</p>}
            {error && <p className="text-sm text-red-500">{error}</p>}
            {!loading && helpers.length === 0 && <p className="text-sm">No pending verifications.</p>}
            <div className="space-y-4">
              {helpers.map(h => (
                <div key={h.user_id} className="rounded-md border bg-white p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="font-medium">{h.full_name || 'Unnamed'}</div>
                      <div className="text-xs text-muted-foreground">{h.email}</div>
                    </div>
                  </div>
                  <div className="mt-3 space-y-2">
                    <div className="text-sm font-medium">Documents</div>
                    <div className="flex flex-wrap gap-2">
                      {(docs[h.user_id] || []).map((d, i) => (
                        <Button key={i} variant="outline" size="sm" onClick={() => viewDoc(d.file_path)}>
                          View {d.doc_type}
                        </Button>
                      ))}
                    </div>
                  </div>
                  <div className="mt-3 flex flex-col gap-2">
                    <textarea className="min-h-[80px] w-full rounded border px-2 py-2 text-sm" placeholder="Review comment (optional)" value={comment[h.user_id] || ''} onChange={(e) => setComment({ ...comment, [h.user_id]: e.target.value })} />
                    <div className="flex gap-2">
                      <Button onClick={() => act(h.user_id, 'approved')}>Approve</Button>
                      <Button variant="outline" onClick={() => act(h.user_id, 'rejected')}>Reject</Button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
