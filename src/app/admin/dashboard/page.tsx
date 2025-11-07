'use server'

import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'

export default async function AdminDashboard() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  
  if (!user) {
    redirect('/auth/login')
  }

  // Verify admin role
  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single()

  if ((profile as any)?.role !== 'admin') {
    redirect('/') // Redirect non-admins
  }

  return (
    <div className="min-h-screen bg-primary-50 py-12 px-4">
      <div className="mx-auto max-w-5xl space-y-6">
        <h1 className="text-3xl font-bold">Admin Dashboard</h1>
        <p className="text-muted-foreground">Platform management and monitoring</p>
        
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          <Link href="/admin/users" className="block p-6 bg-white rounded-lg border hover:border-primary transition-colors">
            <h3 className="font-semibold text-lg mb-2">� Users</h3>
            <p className="text-sm text-muted-foreground">Customer account management</p>
          </Link>

          <Link href="/admin/providers" className="block p-6 bg-white rounded-lg border hover:border-primary transition-colors">
            <h3 className="font-semibold text-lg mb-2">🏪 Providers</h3>
            <p className="text-sm text-muted-foreground">Helper verification & management</p>
          </Link>

          <Link href="/admin/services" className="block p-6 bg-white rounded-lg border hover:border-primary transition-colors">
            <h3 className="font-semibold text-lg mb-2">📦 Services</h3>
            <p className="text-sm text-muted-foreground">Service catalog & pricing</p>
          </Link>

          <Link href="/admin/bookings" className="block p-6 bg-white rounded-lg border hover:border-primary transition-colors">
            <h3 className="font-semibold text-lg mb-2">📅 Bookings</h3>
            <p className="text-sm text-muted-foreground">All service requests & orders</p>
          </Link>
          
          <Link href="/admin/payments" className="block p-6 bg-white rounded-lg border hover:border-primary transition-colors">
            <h3 className="font-semibold text-lg mb-2">💳 Payments</h3>
            <p className="text-sm text-muted-foreground">Revenue & transaction monitoring</p>
          </Link>

          <Link href="/admin/categories" className="block p-6 bg-white rounded-lg border hover:border-primary transition-colors">
            <h3 className="font-semibold text-lg mb-2">🏷️ Categories</h3>
            <p className="text-sm text-muted-foreground">Service category management</p>
          </Link>
          
          <Link href="/admin/promos" className="block p-6 bg-white rounded-lg border hover:border-primary transition-colors">
            <h3 className="font-semibold text-lg mb-2">🎫 Promocodes</h3>
            <p className="text-sm text-muted-foreground">Discount codes & campaigns</p>
          </Link>

          <Link href="/admin/support" className="block p-6 bg-white rounded-lg border hover:border-primary transition-colors">
            <h3 className="font-semibold text-lg mb-2">🎧 Support</h3>
            <p className="text-sm text-muted-foreground">Customer support tickets</p>
          </Link>

          <Link href="/admin/legal" className="block p-6 bg-white rounded-lg border hover:border-primary transition-colors">
            <h3 className="font-semibold text-lg mb-2">📄 Legal Documents</h3>
            <p className="text-sm text-muted-foreground">Terms, privacy & policies</p>
          </Link>

          <Link href="/admin/sos" className="block p-6 bg-white rounded-lg border hover:border-primary transition-colors">
            <h3 className="font-semibold text-lg mb-2">🚨 SOS Alerts</h3>
            <p className="text-sm text-muted-foreground">Emergency safety monitoring</p>
          </Link>

          <Link href="/admin/analytics" className="block p-6 bg-white rounded-lg border hover:border-primary transition-colors">
            <h3 className="font-semibold text-lg mb-2">📊 Analytics</h3>
            <p className="text-sm text-muted-foreground">Platform insights & reports</p>
          </Link>

          <Link href="/admin/settings" className="block p-6 bg-white rounded-lg border hover:border-primary transition-colors">
            <h3 className="font-semibold text-lg mb-2">⚙️ Settings</h3>
            <p className="text-sm text-muted-foreground">Platform configuration</p>
          </Link>
        </div>

        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <h3 className="font-semibold text-blue-900 mb-2">Quick Stats</h3>
          <p className="text-sm text-blue-700">View detailed statistics in the Payments section</p>
        </div>
      </div>
    </div>
  )
}
