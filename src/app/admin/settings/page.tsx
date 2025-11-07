'use server'
import { createClient } from '@/lib/supabase/server'

export default async function AdminSettingsPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return <div className="p-6">Not authenticated</div>
  const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).single()
  if ((profile as any)?.role !== 'admin') return <div className="p-6">Unauthorized</div>

  // Get current commission percentage
  const { data: commissionData } = await supabase.rpc('get_commission_percent')
  const commission = commissionData || 12

  return (
    <div className="min-h-screen bg-primary-50 py-10 px-4">
      <div className="mx-auto max-w-5xl space-y-6">
        <div>
          <h1 className="text-3xl font-bold">Platform Settings</h1>
          <p className="text-sm text-muted-foreground mt-1">Configure platform behavior & policies</p>
        </div>

        <div className="space-y-4">
          {/* Commission Settings */}
          <div className="bg-white rounded-lg border p-6">
            <h3 className="font-semibold text-lg mb-4">💰 Commission & Pricing</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-2">Platform Commission (%)</label>
                <input type="number" defaultValue={commission} step="0.1" min="0" max="100" className="w-32 px-3 py-2 border rounded-md" />
                <p className="text-xs text-gray-500 mt-1">Commission charged on each completed job</p>
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">Surge Pricing Multiplier</label>
                <input type="number" defaultValue={1.5} step="0.1" min="1" max="5" className="w-32 px-3 py-2 border rounded-md" />
                <p className="text-xs text-gray-500 mt-1">Price multiplier during peak hours/emergency</p>
              </div>
            </div>
          </div>

          {/* Service Area Settings */}
          <div className="bg-white rounded-lg border p-6">
            <h3 className="font-semibold text-lg mb-4">📍 Service Area</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-2">Default Service Radius (km)</label>
                <input type="number" defaultValue={10} min="1" max="100" className="w-32 px-3 py-2 border rounded-md" />
                <p className="text-xs text-gray-500 mt-1">Maximum distance for helper matching</p>
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">Emergency Service Radius (km)</label>
                <input type="number" defaultValue={20} min="1" max="100" className="w-32 px-3 py-2 border rounded-md" />
                <p className="text-xs text-gray-500 mt-1">Extended radius for SOS/emergency services</p>
              </div>
            </div>
          </div>

          {/* Payment Settings */}
          <div className="bg-white rounded-lg border p-6">
            <h3 className="font-semibold text-lg mb-4">💳 Payment Configuration</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-2">Minimum Withdrawal Amount (₹)</label>
                <input type="number" defaultValue={100} min="1" className="w-32 px-3 py-2 border rounded-md" />
                <p className="text-xs text-gray-500 mt-1">Minimum amount helpers can withdraw</p>
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">Auto-payout Threshold (₹)</label>
                <input type="number" defaultValue={1000} min="100" className="w-32 px-3 py-2 border rounded-md" />
                <p className="text-xs text-gray-500 mt-1">Automatic payout when balance reaches this amount</p>
              </div>
            </div>
          </div>

          {/* Subscription Plans */}
          <div className="bg-white rounded-lg border p-6">
            <h3 className="font-semibold text-lg mb-4">⭐ Subscription Tiers</h3>
            <div className="space-y-3">
              <div className="flex items-center justify-between p-3 border rounded">
                <div>
                  <div className="font-medium">Helper Pro</div>
                  <div className="text-xs text-gray-500">Reduced commission: 10% instead of 12%</div>
                </div>
                <div className="text-sm font-semibold">₹299/month</div>
              </div>
              <div className="flex items-center justify-between p-3 border rounded">
                <div>
                  <div className="font-medium">Customer Premium</div>
                  <div className="text-xs text-gray-500">Priority booking & 10% discount</div>
                </div>
                <div className="text-sm font-semibold">₹199/month</div>
              </div>
            </div>
          </div>

          {/* Gamification Settings */}
          <div className="bg-white rounded-lg border p-6">
            <h3 className="font-semibold text-lg mb-4">🏆 Gamification</h3>
            <div className="space-y-4">
              <label className="flex items-center gap-2">
                <input type="checkbox" defaultChecked className="rounded" />
                <span className="text-sm">Enable helper badges & achievements</span>
              </label>
              <label className="flex items-center gap-2">
                <input type="checkbox" defaultChecked className="rounded" />
                <span className="text-sm">Enable customer loyalty points</span>
              </label>
              <label className="flex items-center gap-2">
                <input type="checkbox" defaultChecked className="rounded" />
                <span className="text-sm">Show helper leaderboard</span>
              </label>
            </div>
          </div>

          <div className="flex justify-end gap-3">
            <button className="px-4 py-2 border rounded-md text-sm hover:bg-gray-50">Cancel</button>
            <button className="px-4 py-2 bg-primary text-white rounded-md text-sm hover:bg-primary/90">Save Changes</button>
          </div>
        </div>
      </div>
    </div>
  )
}
