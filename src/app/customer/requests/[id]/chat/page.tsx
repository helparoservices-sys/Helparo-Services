'use client'

import { useEffect, useRef, useState } from 'react'
import { useParams } from 'next/navigation'
import { supabase } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { sendChatMessage } from '@/app/actions/messages'
import { AlertCircle } from 'lucide-react'

interface Msg { id: string; sender_id: string; content: string; created_at: string }

export default function CustomerChatPage() {
  const params = useParams<{ id: string }>()
  const requestId = params.id
  const [msgs, setMsgs] = useState<Msg[]>([])
  const [text, setText] = useState('')
  const [error, setError] = useState('')
  const bottomRef = useRef<HTMLDivElement | null>(null)

  useEffect(() => {
    const load = async () => {
      const { data, error } = await supabase
        .from('messages')
        .select('id, sender_id, content, created_at')
        .eq('request_id', requestId)
        .order('created_at', { ascending: true })
      if (error) setError(error.message)
      else setMsgs((data || []) as any)
      bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
    }
    if (requestId) load()

    const channel = supabase.channel(`msgs_req_${requestId}`)
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'messages', filter: `request_id=eq.${requestId}` }, (payload) => {
        setMsgs(prev => [...prev, payload.new as any])
        setTimeout(() => bottomRef.current?.scrollIntoView({ behavior: 'smooth' }), 0)
      })
      .subscribe()

    return () => { supabase.removeChannel(channel) }
  }, [requestId])

  const send = async () => {
    if (!text.trim()) return
    
    setError('')
    
    // Call secure server action (with validation + sanitization)
    const result = await sendChatMessage({
      request_id: requestId as string,
      content: text.trim(),
    })

    if ('error' in result && result.error) {
      setError(result.error)
    } else {
      setText('')
    }
  }

  return (
    <div className="min-h-screen bg-primary-50 py-10 px-4">
      <div className="mx-auto max-w-3xl">
        <Card>
          <CardHeader>
            <CardTitle>Chat</CardTitle>
            <p className="text-sm text-gray-600 mt-2">
              🔒 Messages are validated and sanitized for security
            </p>
          </CardHeader>
          <CardContent>
            {error && (
              <div className="mb-4 rounded-md border border-red-300 bg-red-50 p-3 flex gap-2">
                <AlertCircle className="h-5 w-5 text-red-600 flex-shrink-0" />
                <p className="text-sm text-red-700">{error}</p>
              </div>
            )}
            <div className="h-[50vh] overflow-y-auto rounded border bg-white p-3 space-y-2">
              {msgs.map(m => (
                <div key={m.id} className="text-sm">
                  <span className="text-xs text-muted-foreground mr-2">{new Date(m.created_at).toLocaleTimeString()}</span>
                  <span>{m.content}</span>
                </div>
              ))}
              <div ref={bottomRef} />
            </div>
            <div className="mt-3 flex gap-2">
              <input className="flex-1 h-10 rounded border px-2" value={text} onChange={(e) => setText(e.target.value)} placeholder="Type a message" />
              <Button onClick={send}>Send</Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
