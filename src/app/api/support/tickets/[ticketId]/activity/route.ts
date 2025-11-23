import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function GET(
  req: NextRequest,
  { params }: { params: { ticketId: string } }
) {
  try {
    const supabase = await createClient()
    const { data: logs, error } = await supabase
      .from('ticket_activity_log')
      .select(`
        *,
        actor:profiles!ticket_activity_log_actor_id_fkey(id, full_name)
      `)
      .eq('ticket_id', params.ticketId)
      .order('created_at', { ascending: false })

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ logs })
  } catch (error) {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
