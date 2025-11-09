'use server'
import { createClient } from '@/lib/supabase/server'
import { Settings, DollarSign, MapPin, CreditCard, Star, Trophy, Save, X } from 'lucide-react'

export default async function AdminSettingsPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return <div className="p-6 text-center">Not authenticated</div>
  const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).single()
  if ((profile as any)?.role !== 'admin') return <div className="p-6 text-center">Unauthorized</div>

  // Get current commission percentage
  const { data: commissionData } = await supabase.rpc('get_commission_percent')
  const commission = commissionData || 12

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-slate-900 dark:text-white">Platform Settings</h1>
        <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">Configure platform behavior & policies</p>
      </div>

      <div className="space-y-6">
        {/* Commission Settings */}
        <div className="bg-white/80 dark:bg-slate-800/80 backdrop-blur-xl rounded-lg border border-white/20 dark:border-slate-700/50 shadow-lg p-6">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 rounded-lg bg-green-100 dark:bg-green-900/30 flex items-center justify-center">
              <DollarSign className="h-5 w-5 text-green-600 dark:text-green-400" />
            </div>
            <h3 className="font-semibold text-lg text-slate-900 dark:text-white">Commission & Pricing</h3>
          </div>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">Platform Commission (%)</label>
              <input 
                type="number" 
                defaultValue={commission} 
                step="0.1" 
                min="0" 
                max="100" 
                className="w-32 px-3 py-2 border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white rounded-lg" 
              />
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">Commission charged on each completed job</p>
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">Surge Pricing Multiplier</label>
              <input 
                type="number" 
                defaultValue={1.5} 
                step="0.1" 
                min="1" 
                max="5" 
                className="w-32 px-3 py-2 border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white rounded-lg" 
              />
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">Price multiplier during peak hours/emergency</p>
            </div>
          </div>
        </div>

        {/* Service Area Settings */}
        <div className="bg-white/80 dark:bg-slate-800/80 backdrop-blur-xl rounded-lg border border-white/20 dark:border-slate-700/50 shadow-lg p-6">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 rounded-lg bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center">
              <MapPin className="h-5 w-5 text-blue-600 dark:text-blue-400" />
            </div>
            <h3 className="font-semibold text-lg text-slate-900 dark:text-white">Service Area</h3>
          </div>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">Default Service Radius (km)</label>
              <input 
                type="number" 
                defaultValue={10} 
                min="1" 
                max="100" 
                className="w-32 px-3 py-2 border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white rounded-lg" 
              />
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">Maximum distance for helper matching</p>
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">Emergency Service Radius (km)</label>
              <input 
                type="number" 
                defaultValue={20} 
                min="1" 
                max="100" 
                className="w-32 px-3 py-2 border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white rounded-lg" 
              />
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">Extended radius for SOS/emergency services</p>
            </div>
          </div>
        </div>

        {/* Payment Settings */}
        <div className="bg-white/80 dark:bg-slate-800/80 backdrop-blur-xl rounded-lg border border-white/20 dark:border-slate-700/50 shadow-lg p-6">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 rounded-lg bg-purple-100 dark:bg-purple-900/30 flex items-center justify-center">
              <CreditCard className="h-5 w-5 text-purple-600 dark:text-purple-400" />
            </div>
            <h3 className="font-semibold text-lg text-slate-900 dark:text-white">Payment Configuration</h3>
          </div>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">Minimum Withdrawal Amount (₹)</label>
              <input 
                type="number" 
                defaultValue={100} 
                min="1" 
                className="w-32 px-3 py-2 border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white rounded-lg" 
              />
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">Minimum amount helpers can withdraw</p>
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">Auto-payout Threshold (₹)</label>
              <input 
                type="number" 
                defaultValue={1000} 
                min="100" 
                className="w-32 px-3 py-2 border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white rounded-lg" 
              />
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">Automatic payout when balance reaches this amount</p>
            </div>
          </div>
        </div>

        {/* Subscription Plans */}
        <div className="bg-white/80 dark:bg-slate-800/80 backdrop-blur-xl rounded-lg border border-white/20 dark:border-slate-700/50 shadow-lg p-6">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 rounded-lg bg-yellow-100 dark:bg-yellow-900/30 flex items-center justify-center">
              <Star className="h-5 w-5 text-yellow-600 dark:text-yellow-400" />
            </div>
            <h3 className="font-semibold text-lg text-slate-900 dark:text-white">Subscription Tiers</h3>
          </div>
          <div className="space-y-3">
            <div className="flex items-center justify-between p-4 border border-slate-200 dark:border-slate-700 rounded-lg bg-slate-50 dark:bg-slate-900/50">
              <div>
                <div className="font-medium text-slate-900 dark:text-white">Helper Pro</div>
                <div className="text-xs text-slate-500 dark:text-slate-400">Reduced commission: 10% instead of 12%</div>
              </div>
              <div className="text-sm font-semibold text-slate-900 dark:text-white">₹299/month</div>
            </div>
            <div className="flex items-center justify-between p-4 border border-slate-200 dark:border-slate-700 rounded-lg bg-slate-50 dark:bg-slate-900/50">
              <div>
                <div className="font-medium text-slate-900 dark:text-white">Customer Premium</div>
                <div className="text-xs text-slate-500 dark:text-slate-400">Priority booking & 10% discount</div>
              </div>
              <div className="text-sm font-semibold text-slate-900 dark:text-white">₹199/month</div>
            </div>
          </div>
        </div>

        {/* Gamification Settings */}
        <div className="bg-white/80 dark:bg-slate-800/80 backdrop-blur-xl rounded-lg border border-white/20 dark:border-slate-700/50 shadow-lg p-6">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 rounded-lg bg-orange-100 dark:bg-orange-900/30 flex items-center justify-center">
              <Trophy className="h-5 w-5 text-orange-600 dark:text-orange-400" />
            </div>
            <h3 className="font-semibold text-lg text-slate-900 dark:text-white">Gamification</h3>
          </div>
          <div className="space-y-4">
            <label className="flex items-center gap-3 cursor-pointer group">
              <input type="checkbox" defaultChecked className="w-4 h-4 rounded border-slate-300 dark:border-slate-600" />
              <span className="text-sm text-slate-700 dark:text-slate-300 group-hover:text-slate-900 dark:group-hover:text-white transition-colors">Enable helper badges & achievements</span>
            </label>
            <label className="flex items-center gap-3 cursor-pointer group">
              <input type="checkbox" defaultChecked className="w-4 h-4 rounded border-slate-300 dark:border-slate-600" />
              <span className="text-sm text-slate-700 dark:text-slate-300 group-hover:text-slate-900 dark:group-hover:text-white transition-colors">Enable customer loyalty points</span>
            </label>
            <label className="flex items-center gap-3 cursor-pointer group">
              <input type="checkbox" defaultChecked className="w-4 h-4 rounded border-slate-300 dark:border-slate-600" />
              <span className="text-sm text-slate-700 dark:text-slate-300 group-hover:text-slate-900 dark:group-hover:text-white transition-colors">Show helper leaderboard</span>
            </label>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex justify-end gap-3">
          <button className="inline-flex items-center gap-2 px-4 py-2 border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 rounded-lg text-sm font-medium hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors">
            <X className="h-4 w-4" />
            Cancel
          </button>
          <button className="inline-flex items-center gap-2 px-4 py-2 bg-primary-600 hover:bg-primary-700 text-white rounded-lg text-sm font-medium transition-colors shadow-lg">
            <Save className="h-4 w-4" />
            Save Changes
          </button>
        </div>
      </div>
    </div>
  )
}
