'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

export default function HelperVerificationPage() {
  const [status, setStatus] = useState<{ isApproved: boolean; verification_status: string | null }>({ isApproved: false, verification_status: null })
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [idFront, setIdFront] = useState<File | null>(null)
  const [idBack, setIdBack] = useState<File | null>(null)
  const [selfie, setSelfie] = useState<File | null>(null)

  useEffect(() => {
    const load = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { setError('Not authenticated'); setLoading(false); return }
      const { data: hp } = await supabase
        .from('helper_profiles')
        .select('is_approved, verification_status')
        .eq('user_id', user.id)
        .maybeSingle()
      const typed = hp as { is_approved: boolean; verification_status: string } | null
      if (typed) setStatus({ isApproved: typed.is_approved, verification_status: typed.verification_status })
      setLoading(false)
    }
    load()
  }, [])

  const uploadDoc = async (userId: string, file: File, docType: 'id_front' | 'id_back' | 'selfie') => {
    const path = `${userId}/${docType}-${Date.now()}-${file.name}`
    const { error: upErr } = await supabase.storage.from('kyc').upload(path, file, { cacheControl: '3600', upsert: false })
    if (upErr) throw upErr
    const { error: insErr } = await (supabase.from('verification_documents') as any).insert({
      user_id: userId,
      doc_type: docType,
      file_path: path,
    })
    if (insErr) throw insErr
  }

  const submit = async () => {
    setError(''); setSuccess(''); setSubmitting(true)
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('Not authenticated')
      if (!idFront || !selfie) throw new Error('Please upload ID front and a selfie')

      // Ensure helper_profile exists
      const { data: existing } = await supabase
        .from('helper_profiles')
        .select('id')
        .eq('user_id', user.id)
        .maybeSingle()
      if (!existing) {
        const { error: createHpErr } = await (supabase.from('helper_profiles') as any).insert({ user_id: user.id, is_approved: false, verification_status: 'pending' })
        if (createHpErr) throw createHpErr
      } else {
        const { error: updHpErr } = await (supabase.from('helper_profiles') as any)
          .update({ verification_status: 'pending', is_approved: false })
          .eq('user_id', user.id)
        if (updHpErr) throw updHpErr
      }

      await uploadDoc(user.id, idFront, 'id_front')
      if (idBack) await uploadDoc(user.id, idBack, 'id_back')
      await uploadDoc(user.id, selfie, 'selfie')

      setSuccess('Verification submitted. We will notify you after review.')
    } catch (e: any) {
      setError(e.message || 'Failed to submit verification')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="min-h-screen bg-primary-50 py-10 px-4">
      <div className="mx-auto max-w-2xl">
        <Card>
          <CardHeader>
            <CardTitle>Helper Verification</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {loading ? (
              <p className="text-sm text-muted-foreground">Loading...</p>
            ) : (
              <>
                {status.verification_status === 'approved' ? (
                  <div className="rounded-md border border-green-300 bg-green-50 p-3 text-sm text-green-700">You are verified.</div>
                ) : status.verification_status === 'pending' ? (
                  <div className="rounded-md border border-yellow-300 bg-yellow-50 p-3 text-sm text-yellow-700">Your verification is pending review.</div>
                ) : null}

                {error && <p className="text-sm text-red-500">{error}</p>}
                {success && <p className="text-sm text-green-600">{success}</p>}

                <div className="space-y-2">
                  <label className="text-sm font-medium">ID Front (required)</label>
                  <input type="file" accept="image/*,.pdf" onChange={(e) => setIdFront(e.target.files?.[0] || null)} />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">ID Back (optional)</label>
                  <input type="file" accept="image/*,.pdf" onChange={(e) => setIdBack(e.target.files?.[0] || null)} />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">Selfie (required)</label>
                  <input type="file" accept="image/*" onChange={(e) => setSelfie(e.target.files?.[0] || null)} />
                </div>
                <div>
                  <Button onClick={submit} disabled={submitting}>{submitting ? 'Submitting...' : 'Submit for Review'}</Button>
                </div>
              </>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
