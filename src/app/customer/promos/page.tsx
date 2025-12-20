'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Ticket, Tag, Calendar, TrendingUp, AlertCircle } from 'lucide-react'

interface PromoCode {
  id: string
  code: string
  description: string
  discount_type: string
  discount_value: number
  max_discount_rupees: number | null
  start_date: string
  end_date: string
  min_order_amount_rupees: number | null
  is_active: boolean
}

interface PromoUsage {
  id: string
  promo_id: string
  applied_amount_paise: number
  order_amount_paise: number
  created_at: string
  promo_codes: PromoCode
}

export default function CustomerPromosPage() {
  const supabase = createClient()
  const [availablePromos, setAvailablePromos] = useState<PromoCode[]>([])
  const [promoHistory, setPromoHistory] = useState<PromoUsage[]>([])
  const [loading, setLoading] = useState(true)
  const [applyCode, setApplyCode] = useState('')
  const [applyMessage, setApplyMessage] = useState('')

  useEffect(() => {
    loadPromos()
  }, [])

  const loadPromos = async () => {
    setLoading(true)

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      setLoading(false)
      return
    }

    // Load active promo codes
    const today = new Date().toISOString().split('T')[0]
    const { data: promos } = await supabase
      .from('promo_codes')
      .select('id, code, discount_type, discount_value, description, start_date, end_date, max_uses, current_uses') // 🟢 SAFE: Select only display fields for promo list
      .eq('is_active', true)
      .lte('start_date', today)
      .gte('end_date', today)
      .contains('allowed_roles', ['customer'])

    setAvailablePromos(promos || [])

    // Load usage history
    const { data: history } = await supabase
      .from('promo_code_usages')
      .select('*, promo_codes(*)')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .limit(20)

    setPromoHistory(history || [])

    setLoading(false)
  }

  const handleApplyPromo = () => {
    if (!applyCode.trim()) {
      setApplyMessage('Please enter a promo code')
      return
    }

    const promo = availablePromos.find(p => p.code.toLowerCase() === applyCode.toLowerCase())
    if (promo) {
      setApplyMessage(`✓ Valid promo code! ${promo.description}`)
    } else {
      setApplyMessage('Invalid or expired promo code')
    }

    setTimeout(() => setApplyMessage(''), 5000)
  }

  const formatAmount = (paise: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      minimumFractionDigits: 2,
    }).format(paise / 100)
  }

  const totalSaved = promoHistory.reduce((sum, usage) => sum + usage.applied_amount_paise, 0)

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-slate-600">Loading promo codes...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-slate-900 dark:text-white">Promo Codes</h1>
        <p className="text-slate-600 dark:text-slate-400">Save money with exclusive discount codes</p>
      </div>

      {/* Total Savings Card */}
      {totalSaved > 0 && (
        <div className="bg-gradient-to-r from-green-500 to-green-600 rounded-xl p-6 text-white shadow-lg">
          <div className="flex items-center gap-3 mb-2">
            <TrendingUp className="h-8 w-8" />
            <div>
              <p className="text-sm opacity-90">Total Savings</p>
              <p className="text-3xl font-bold">{formatAmount(totalSaved)}</p>
            </div>
          </div>
          <p className="text-sm opacity-75">You've saved with {promoHistory.length} promo codes</p>
        </div>
      )}

      {/* Apply Promo Code */}
      <div className="bg-white dark:bg-slate-800 rounded-xl p-6 shadow-sm border border-slate-200 dark:border-slate-700">
        <h2 className="text-xl font-bold text-slate-900 dark:text-white mb-4">Apply Promo Code</h2>
        <div className="flex gap-3">
          <input
            type="text"
            value={applyCode}
            onChange={(e) => setApplyCode(e.target.value.toUpperCase())}
            placeholder="Enter promo code"
            className="flex-1 px-4 py-3 border border-slate-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-slate-700 dark:text-white"
          />
          <button
            onClick={handleApplyPromo}
            className="px-6 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-lg hover:shadow-lg transition-all"
          >
            Apply
          </button>
        </div>
        {applyMessage && (
          <div className={`mt-3 p-3 rounded-lg ${
            applyMessage.startsWith('✓') 
              ? 'bg-green-50 border border-green-200 text-green-700'
              : 'bg-red-50 border border-red-200 text-red-700'
          }`}>
            <p className="text-sm">{applyMessage}</p>
          </div>
        )}
      </div>

      {/* Available Promo Codes */}
      <div className="bg-white dark:bg-slate-800 rounded-xl p-6 shadow-sm border border-slate-200 dark:border-slate-700">
        <h2 className="text-xl font-bold text-slate-900 dark:text-white mb-4">Available Offers</h2>

        {availablePromos.length === 0 ? (
          <div className="text-center py-8 text-slate-500 dark:text-slate-400">
            <Ticket className="h-12 w-12 mx-auto mb-3 opacity-50" />
            <p>No active promo codes at the moment</p>
            <p className="text-sm mt-1">Check back soon for exclusive offers!</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {availablePromos.map((promo) => (
              <div
                key={promo.id}
                className="border-2 border-dashed border-blue-300 dark:border-blue-700 rounded-lg p-4 hover:border-blue-500 transition-colors"
              >
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <Tag className="h-5 w-5 text-blue-600" />
                    <span className="font-mono font-bold text-lg text-blue-600">{promo.code}</span>
                  </div>
                  <span className="px-2 py-1 bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400 text-xs rounded-full">
                    {promo.discount_type === 'percent' 
                      ? `${promo.discount_value}% OFF` 
                      : `₹${promo.discount_value} OFF`}
                  </span>
                </div>

                <p className="text-sm text-slate-600 dark:text-slate-400 mb-3">
                  {promo.description}
                </p>

                <div className="space-y-1 text-xs text-slate-500 dark:text-slate-500">
                  {promo.min_order_amount_rupees && (
                    <p>• Min order: ₹{promo.min_order_amount_rupees}</p>
                  )}
                  {promo.max_discount_rupees && promo.discount_type === 'percent' && (
                    <p>• Max discount: ₹{promo.max_discount_rupees}</p>
                  )}
                  <p className="flex items-center gap-1">
                    <Calendar className="h-3 w-3" />
                    Valid till {new Date(promo.end_date).toLocaleDateString('en-IN')}
                  </p>
                </div>

                <button
                  onClick={() => {
                    setApplyCode(promo.code)
                    setApplyMessage(`✓ Valid promo code! ${promo.description}`)
                    setTimeout(() => setApplyMessage(''), 5000)
                  }}
                  className="mt-3 w-full px-4 py-2 bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 rounded-lg hover:bg-blue-100 dark:hover:bg-blue-900/30 transition-colors text-sm font-medium"
                >
                  Copy Code
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Usage History */}
      {promoHistory.length > 0 && (
        <div className="bg-white dark:bg-slate-800 rounded-xl p-6 shadow-sm border border-slate-200 dark:border-slate-700">
          <h2 className="text-xl font-bold text-slate-900 dark:text-white mb-4">Usage History</h2>
          <div className="space-y-3">
            {promoHistory.map((usage) => (
              <div
                key={usage.id}
                className="flex items-center justify-between p-4 bg-slate-50 dark:bg-slate-900/50 rounded-lg"
              >
                <div>
                  <p className="font-medium text-slate-900 dark:text-white font-mono">
                    {usage.promo_codes?.code || 'N/A'}
                  </p>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    {new Date(usage.created_at).toLocaleDateString('en-IN', {
                      day: 'numeric',
                      month: 'short',
                      year: 'numeric'
                    })}
                  </p>
                </div>
                <div className="text-right">
                  <p className="font-bold text-green-600">
                    -{formatAmount(usage.applied_amount_paise)}
                  </p>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    On {formatAmount(usage.order_amount_paise)}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Info Box */}
      <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-4 border border-blue-200 dark:border-blue-800">
        <div className="flex items-start gap-2">
          <AlertCircle className="h-5 w-5 text-blue-600 mt-0.5" />
          <div className="text-sm text-slate-700 dark:text-slate-300">
            <p className="font-semibold mb-1">Promo Code Tips</p>
            <ul className="space-y-1 text-xs text-slate-600 dark:text-slate-400">
              <li>• Promo codes are automatically applied at checkout</li>
              <li>• Only one promo code can be used per order</li>
              <li>• Some codes have minimum order requirements</li>
              <li>• Expired codes cannot be redeemed</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  )
}
