'use server'
import { createClient } from '@/lib/supabase/server'
import Link from 'next/link'

export default async function AdminProvidersPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return <div className="p-6">Not authenticated</div>
  const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).single()
  if ((profile as any)?.role !== 'admin') return <div className="p-6">Unauthorized</div>

  const { data: helpers } = await supabase
    .from('helper_profiles')
    .select('id, user_id, verification_status, is_approved, profiles:profiles(full_name, email, phone_number), created_at')
    .order('created_at', { ascending: false })
    .limit(100)

  return (
    <div className="min-h-screen bg-primary-50 py-10 px-4">
      <div className="mx-auto max-w-7xl space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">Providers Management</h1>
            <p className="text-sm text-muted-foreground mt-1">Manage helper verification, approval & ratings</p>
          </div>
          <Link href="/admin/verification" className="px-4 py-2 bg-primary text-white rounded-md text-sm hover:bg-primary/90">Verification Queue</Link>
        </div>

        <div className="bg-white rounded-lg border shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Provider</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Contact</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Verification</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Joined</th>
                  <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {(helpers || []).map((h: any) => (
                  <tr key={h.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3">
                      <div className="font-medium">{h.profiles?.full_name || 'Unnamed'}</div>
                      <div className="text-xs text-gray-500">{h.profiles?.email}</div>
                    </td>
                    <td className="px-4 py-3 text-sm">{h.profiles?.phone_number || '—'}</td>
                    <td className="px-4 py-3">
                      <span className={`inline-flex px-2 py-1 text-xs rounded-full ${h.is_approved ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'}`}>
                        {h.is_approved ? 'Approved' : 'Pending'}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <span className={`inline-flex px-2 py-1 text-xs rounded-full ${h.verification_status === 'approved' ? 'bg-green-100 text-green-700' : h.verification_status === 'pending' ? 'bg-yellow-100 text-yellow-700' : 'bg-red-100 text-red-700'}`}>
                        {h.verification_status}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-500">{new Date(h.created_at).toLocaleDateString()}</td>
                    <td className="px-4 py-3 text-right">
                      <Link href={`/admin/providers/${h.user_id}`} className="text-primary hover:underline text-sm">View Details</Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {(!helpers || helpers.length === 0) && (
              <div className="p-8 text-center text-gray-500">No providers found</div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
