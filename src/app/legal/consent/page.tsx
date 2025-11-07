'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase/client'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import { Button } from '@/components/ui/button'
import type { Database } from '@/lib/supabase/database.types'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'

interface LegalDoc {
  id: string
  type: 'terms' | 'privacy'
  version: number
  title: string
  content_md: string
}

type AcceptanceInsert = import('@/lib/supabase/database.types').Database['public']['Tables']['legal_acceptances']['Insert']

export default function ConsentGate() {
  const [docs, setDocs] = useState<LegalDoc[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [accepting, setAccepting] = useState(false)
  const [accepted, setAccepted] = useState(false)

  useEffect(() => {
    const load = async () => {
      setLoading(true)
      const { data: terms, error: termsErr } = await supabase
        .from('legal_documents')
        .select('*')
        .eq('type', 'terms')
        .eq('is_active', true)
        .order('version', { ascending: false })
        .limit(1)
      const { data: priv, error: privErr } = await supabase
        .from('legal_documents')
        .select('*')
        .eq('type', 'privacy')
        .eq('is_active', true)
        .order('version', { ascending: false })
        .limit(1)
      if (termsErr || privErr) {
        setError('Failed to load legal documents.')
      } else {
        setDocs([...(terms || []), ...(priv || [])])
      }
      setLoading(false)
    }
    load()
  }, [])

  const handleAccept = async () => {
    setError('')
    setAccepting(true)
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('Not authenticated')
      const ua = navigator.userAgent
      const ip = null // could call an IP service later
      for (const doc of docs) {
        const payload: AcceptanceInsert = {
          user_id: user.id,
          document_type: doc.type,
          document_version: doc.version,
          user_agent: ua,
          ip: ip as any,
        }
  const { error: insertErr } = await (supabase.from('legal_acceptances') as any).insert(payload)
        if (insertErr && insertErr.code !== '23505') { // unique violation means already accepted
          throw insertErr
        }
      }
      setAccepted(true)
      // After acceptance redirect user
      window.location.href = '/'
    } catch (e: any) {
      setError(e.message || 'Failed to record acceptance')
    } finally {
      setAccepting(false)
    }
  }

  return (
    <div className="min-h-screen bg-primary-50 py-10 px-4">
      <div className="mx-auto max-w-4xl space-y-8">
        <Card>
          <CardHeader>
            <CardTitle>Review & Accept Updated Terms</CardTitle>
            <CardDescription>
              You must accept the latest Terms & Conditions and Privacy Policy to continue using Helparo.
            </CardDescription>
          </CardHeader>
          <CardContent>
            {loading && <p className="text-sm text-muted-foreground">Loading...</p>}
            {error && <p className="text-sm text-red-500">{error}</p>}
            {!loading && !error && (
              <div className="space-y-10">
                {docs.map(doc => (
                  <div key={doc.id} className="space-y-4">
                    <h2 className="text-xl font-semibold">{doc.title} (v{doc.version})</h2>
                    <article className="prose prose-sm max-w-none bg-white p-4 rounded-md border">
                      <ReactMarkdown remarkPlugins={[remarkGfm]}>{doc.content_md}</ReactMarkdown>
                    </article>
                  </div>
                ))}
                <div className="flex flex-col gap-3">
                  <Button onClick={handleAccept} disabled={accepting || docs.length === 0} size="lg">
                    {accepting ? 'Recording Acceptance...' : 'I Accept'}
                  </Button>
                  {accepted && <p className="text-green-600 text-sm">Acceptance recorded. Redirecting...</p>}
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
