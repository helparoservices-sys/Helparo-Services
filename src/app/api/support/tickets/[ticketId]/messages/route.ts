import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function GET(
  req: NextRequest,
  { params }: { params: { ticketId: string } }
) {
  try {
    const supabase = await createClient()
    const { data: messages, error } = await supabase
      .from('ticket_messages')
      .select(`
        *,
        sender:profiles!ticket_messages_sender_id_fkey(id, full_name)
      `)
      .eq('ticket_id', params.ticketId)
      .order('created_at', { ascending: true })

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ messages })
  } catch (error) {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
