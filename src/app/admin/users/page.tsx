'use server'

import { createClient } from '@/lib/supabase/server'
import Link from 'next/link'

export default async function AdminUsersPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return <div className="p-6">Not authenticated</div>
  const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).single()
  if ((profile as any)?.role !== 'admin') return <div className="p-6">Unauthorized</div>

  const { data: users } = await supabase
    .from('profiles')
    .select('id, full_name, email, role, created_at, last_login_at')
    .order('created_at', { ascending: false })
    .limit(50)

  return (
    <div className="min-h-screen bg-primary-50 py-10 px-4">
      <div className="mx-auto max-w-6xl space-y-6">
        <h1 className="text-3xl font-bold">User Management</h1>
        <p className="text-sm text-muted-foreground">Approve helpers, adjust roles, ban users (coming soon).</p>
        <div className="grid gap-3">
          {(users || []).map(u => (
            <div key={u.id} className="flex items-center justify-between rounded-md border bg-white p-4">
              <div>
                <div className="font-medium">{u.full_name || 'Unnamed'}</div>
                <div className="text-xs text-muted-foreground">{u.email}</div>
                <div className="text-xs">Role: {u.role}</div>
              </div>
              <div className="flex gap-2">
                <Link href={`/admin/users/${u.id}`} className="text-primary text-sm underline">View</Link>
              </div>
            </div>
          ))}
          {(!users || users.length === 0) && <p className="text-sm text-muted-foreground">No users found.</p>}
        </div>
      </div>
    </div>
  )
}
