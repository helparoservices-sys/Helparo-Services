'use server'
import { createClient } from '@/lib/supabase/server'
import Link from 'next/link'

export default async function AdminBookingsPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return <div className="p-6">Not authenticated</div>
  const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).single()
  if ((profile as any)?.role !== 'admin') return <div className="p-6">Unauthorized</div>

  const { data: bookings } = await supabase
    .from('service_requests')
    .select('id, title, status, estimated_price, created_at, profiles!customer_id(full_name, email)')
    .order('created_at', { ascending: false })
    .limit(100)

  return (
    <div className="min-h-screen bg-primary-50 py-10 px-4">
      <div className="mx-auto max-w-7xl space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">Bookings Management</h1>
            <p className="text-sm text-muted-foreground mt-1">Monitor all service requests & orders</p>
          </div>
          <div className="flex gap-2">
            <select className="px-3 py-2 border rounded-md text-sm">
              <option>All Status</option>
              <option>open</option>
              <option>assigned</option>
              <option>completed</option>
              <option>cancelled</option>
            </select>
          </div>
        </div>

        <div className="grid gap-4 md:grid-cols-4">
          <div className="bg-white p-4 rounded-lg border">
            <div className="text-xs text-gray-500">Total Bookings</div>
            <div className="text-2xl font-bold">{bookings?.length || 0}</div>
          </div>
          <div className="bg-white p-4 rounded-lg border">
            <div className="text-xs text-gray-500">Open</div>
            <div className="text-2xl font-bold">{bookings?.filter((b: any) => b.status === 'open').length || 0}</div>
          </div>
          <div className="bg-white p-4 rounded-lg border">
            <div className="text-xs text-gray-500">In Progress</div>
            <div className="text-2xl font-bold">{bookings?.filter((b: any) => b.status === 'assigned').length || 0}</div>
          </div>
          <div className="bg-white p-4 rounded-lg border">
            <div className="text-xs text-gray-500">Completed</div>
            <div className="text-2xl font-bold">{bookings?.filter((b: any) => b.status === 'completed').length || 0}</div>
          </div>
        </div>

        <div className="bg-white rounded-lg border shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Booking ID</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Service</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Customer</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Amount</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Date</th>
                  <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {(bookings || []).map((b: any) => (
                  <tr key={b.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3 text-xs font-mono">{b.id.slice(0, 8)}</td>
                    <td className="px-4 py-3">
                      <div className="font-medium text-sm">{b.title}</div>
                    </td>
                    <td className="px-4 py-3">
                      <div className="text-sm">{b.profiles?.full_name || '—'}</div>
                      <div className="text-xs text-gray-500">{b.profiles?.email}</div>
                    </td>
                    <td className="px-4 py-3">
                      <span className={`inline-flex px-2 py-1 text-xs rounded-full ${
                        b.status === 'completed' ? 'bg-green-100 text-green-700' :
                        b.status === 'assigned' ? 'bg-blue-100 text-blue-700' :
                        b.status === 'cancelled' ? 'bg-red-100 text-red-700' :
                        'bg-yellow-100 text-yellow-700'
                      }`}>
                        {b.status}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-sm">₹{b.estimated_price || '—'}</td>
                    <td className="px-4 py-3 text-sm text-gray-500">{new Date(b.created_at).toLocaleDateString()}</td>
                    <td className="px-4 py-3 text-right">
                      <Link href={`/admin/bookings/${b.id}`} className="text-primary hover:underline text-sm">Details</Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {(!bookings || bookings.length === 0) && (
              <div className="p-8 text-center text-gray-500">No bookings found</div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
