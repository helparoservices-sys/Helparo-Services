'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Package, Tag, Calendar, TrendingUp, Gift, Check } from 'lucide-react'

interface Bundle {
  id: string
  name: string
  description: string
  bundle_type: string
  total_original_price: number
  bundle_price: number
  discount_percentage: number
  validity_days: number | null
  max_redemptions: number | null
  is_active: boolean
  icon_url: string | null
  banner_url: string | null
}

export default function CustomerBundlesPage() {
  const supabase = createClient()
  const [loading, setLoading] = useState(true)
  const [bundles, setBundles] = useState<Bundle[]>([])
  const [selectedBundle, setSelectedBundle] = useState<Bundle | null>(null)
  const [isPurchasing, setIsPurchasing] = useState(false)

  useEffect(() => {
    loadBundles()
  }, [])

  const loadBundles = async () => {
    setLoading(true)

    const { data } = await supabase
      .from('service_bundles')
      .select('*')
      .eq('is_active', true)
      .order('bundle_price', { ascending: true })

    setBundles(data || [])
    setLoading(false)
  }

  const handlePurchase = async () => {
    if (!selectedBundle) return

    setIsPurchasing(true)

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      setIsPurchasing(false)
      return
    }

    // Get bundle services count
    const { count } = await supabase
      .from('bundle_services')
      .select('*', { count: 'exact', head: true })
      .eq('bundle_id', selectedBundle.id)

    // Create bundle purchase
    const { error } = await supabase
      .from('bundle_purchases')
      .insert({
        bundle_id: selectedBundle.id,
        customer_id: user.id,
        purchase_price: selectedBundle.bundle_price,
        services_total: count || 0,
        valid_until: selectedBundle.validity_days 
          ? new Date(Date.now() + selectedBundle.validity_days * 24 * 60 * 60 * 1000).toISOString()
          : null
      })

    if (!error) {
      setSelectedBundle(null)
      loadBundles()
    }

    setIsPurchasing(false)
  }

  const formatAmount = (amount: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      minimumFractionDigits: 0,
    }).format(amount)
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-slate-600">Loading bundles...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-slate-900 dark:text-white">Service Bundles</h1>
        <p className="text-slate-600 dark:text-slate-400">Save big with our combo packages</p>
      </div>

      {/* Info Banner */}
      <div className="bg-gradient-to-r from-purple-500 to-indigo-500 rounded-xl p-6 text-white">
        <div className="flex items-center gap-3 mb-2">
          <Gift className="h-8 w-8" />
          <h2 className="text-2xl font-bold">Save up to 40% with Bundles!</h2>
        </div>
        <p className="text-purple-100">Get multiple services at discounted rates with our special packages</p>
      </div>

      {/* Bundles Grid */}
      {bundles.length === 0 ? (
        <div className="bg-white dark:bg-slate-800 rounded-xl p-12 text-center shadow-sm border border-slate-200 dark:border-slate-700">
          <Package className="h-16 w-16 mx-auto mb-4 text-slate-400" />
          <p className="text-slate-600 dark:text-slate-400">No bundles available at the moment</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {bundles.map((bundle) => (
            <div
              key={bundle.id}
              className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 hover:shadow-lg transition-all overflow-hidden"
            >
              {/* Bundle Type Badge */}
              <div className="bg-gradient-to-r from-blue-600 to-indigo-600 p-4">
                <div className="flex items-center justify-between">
                  <span className="text-white font-semibold capitalize">{bundle.bundle_type}</span>
                  {bundle.discount_percentage && (
                    <span className="bg-white/20 backdrop-blur-sm text-white px-3 py-1 rounded-full text-sm font-bold">
                      {bundle.discount_percentage.toFixed(0)}% OFF
                    </span>
                  )}
                </div>
              </div>

              <div className="p-6 space-y-4">
                {/* Bundle Name */}
                <div>
                  <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-2">{bundle.name}</h3>
                  <p className="text-sm text-slate-600 dark:text-slate-400 line-clamp-2">{bundle.description}</p>
                </div>

                {/* Pricing */}
                <div className="flex items-baseline gap-2">
                  <span className="text-3xl font-bold text-blue-600">{formatAmount(bundle.bundle_price)}</span>
                  {bundle.total_original_price > bundle.bundle_price && (
                    <span className="text-lg text-slate-400 line-through">{formatAmount(bundle.total_original_price)}</span>
                  )}
                </div>

                {/* Features */}
                <div className="space-y-2">
                  {bundle.validity_days && (
                    <div className="flex items-center gap-2 text-sm text-slate-600 dark:text-slate-400">
                      <Calendar className="h-4 w-4 text-blue-600" />
                      <span>Valid for {bundle.validity_days} days</span>
                    </div>
                  )}
                  {bundle.max_redemptions && (
                    <div className="flex items-center gap-2 text-sm text-slate-600 dark:text-slate-400">
                      <Package className="h-4 w-4 text-blue-600" />
                      <span>{bundle.max_redemptions} services included</span>
                    </div>
                  )}
                  <div className="flex items-center gap-2 text-sm text-green-600 dark:text-green-400">
                    <Check className="h-4 w-4" />
                    <span>Save {formatAmount(bundle.total_original_price - bundle.bundle_price)}</span>
                  </div>
                </div>

                {/* Purchase Button */}
                <button
                  onClick={() => setSelectedBundle(bundle)}
                  className="w-full px-4 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-lg hover:shadow-lg transition-all font-semibold"
                >
                  Purchase Bundle
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Purchase Modal */}
      {selectedBundle && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-slate-800 rounded-xl max-w-md w-full p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-2xl font-bold text-slate-900 dark:text-white">Confirm Purchase</h2>
              <button
                onClick={() => setSelectedBundle(null)}
                className="text-slate-400 hover:text-slate-600"
              >
                ✕
              </button>
            </div>

            <div className="space-y-4">
              <div className="bg-slate-50 dark:bg-slate-900/50 rounded-lg p-4">
                <h3 className="font-bold text-slate-900 dark:text-white mb-2">{selectedBundle.name}</h3>
                <p className="text-sm text-slate-600 dark:text-slate-400 mb-4">{selectedBundle.description}</p>
                
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-slate-600 dark:text-slate-400">Original Price:</span>
                    <span className="line-through text-slate-400">{formatAmount(selectedBundle.total_original_price)}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-slate-600 dark:text-slate-400">Discount:</span>
                    <span className="text-green-600 dark:text-green-400">
                      -{formatAmount(selectedBundle.total_original_price - selectedBundle.bundle_price)}
                    </span>
                  </div>
                  <div className="flex justify-between font-bold text-lg pt-2 border-t">
                    <span className="text-slate-900 dark:text-white">Total:</span>
                    <span className="text-blue-600">{formatAmount(selectedBundle.bundle_price)}</span>
                  </div>
                </div>
              </div>

              <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-3">
                <p className="text-xs text-slate-700 dark:text-slate-300">
                  <strong>Note:</strong> Bundle will be activated immediately upon purchase
                  {selectedBundle.validity_days && ` and valid for ${selectedBundle.validity_days} days`}.
                </p>
              </div>

              <div className="flex gap-3">
                <button
                  onClick={() => setSelectedBundle(null)}
                  className="flex-1 px-4 py-3 border border-slate-300 dark:border-slate-600 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors"
                  disabled={isPurchasing}
                >
                  Cancel
                </button>
                <button
                  onClick={handlePurchase}
                  disabled={isPurchasing}
                  className="flex-1 px-4 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-lg hover:shadow-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isPurchasing ? 'Processing...' : 'Confirm Purchase'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
