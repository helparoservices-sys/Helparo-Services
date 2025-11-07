'use server'

import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { Database } from '@/lib/supabase/database.types'

type RequestSummary = Pick<Database['public']['Tables']['service_requests']['Row'], 'id' | 'title' | 'status' | 'application_count' | 'created_at'>

async function getMyRequests(): Promise<RequestSummary[]> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return []
  const { data, error } = await supabase
    .from('service_requests')
    .select('id, title, status, application_count, created_at')
    .eq('customer_id', user.id)
    .order('created_at', { ascending: false })
  if (error) throw error
  return (data as RequestSummary[]) || []
}

export default async function CustomerRequestsList() {
  const requests = await getMyRequests()
  return (
    <div className="min-h-screen bg-primary-50 py-12 px-4">
      <div className="mx-auto max-w-3xl space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-3xl font-bold">My Requests</h1>
          <Link href="/customer/requests/new" className="text-primary underline">New request</Link>
        </div>
        <div className="space-y-3">
          {requests.length === 0 && (
            <p className="text-sm text-muted-foreground">No requests yet.</p>
          )}
          {requests.map(r => (
            <Link key={r.id} href={`/customer/requests/${r.id}`} className="block rounded-md border bg-white p-4 hover:shadow-sm">
              <div className="flex items-center justify-between">
                <div>
                  <div className="font-medium">{r.title}</div>
                  <div className="text-xs text-muted-foreground">{new Date(r.created_at).toLocaleString()}</div>
                </div>
                <div className="text-right">
                  <div className="text-xs uppercase tracking-wide">{r.status}</div>
                  <div className="text-xs text-muted-foreground">Applications: {r.application_count}</div>
                </div>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </div>
  )
}
