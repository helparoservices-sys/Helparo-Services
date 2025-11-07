'use server'

import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { Database } from '@/lib/supabase/database.types'

type AssignedSummary = Pick<Database['public']['Tables']['service_requests']['Row'], 'id' | 'title' | 'created_at'>

async function getAssigned(): Promise<AssignedSummary[]> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return []
  const { data } = await supabase
    .from('service_requests')
    .select('id, title, created_at')
    .eq('assigned_helper_id', user.id)
    .eq('status', 'assigned')
    .order('created_at', { ascending: false })
  return (data as AssignedSummary[]) || []
}

export default async function HelperAssignedPage() {
  const items = await getAssigned()
  return (
    <div className="min-h-screen bg-primary-50 py-12 px-4">
      <div className="mx-auto max-w-3xl space-y-6">
        <h1 className="text-3xl font-bold">Assigned Jobs</h1>
        <div className="space-y-3">
          {items.length === 0 && <p className="text-sm text-muted-foreground">No assigned jobs.</p>}
          {items.map(i => (
            <div key={i.id} className="rounded-md border bg-white p-4 flex items-center justify-between">
              <div>
                <div className="font-medium">{i.title}</div>
                <div className="text-xs text-muted-foreground">{new Date(i.created_at).toLocaleString()}</div>
              </div>
              <div className="flex gap-2">
                <Link href={`/helper/requests/${i.id}/chat`} className="text-primary underline text-sm">Open chat</Link>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
