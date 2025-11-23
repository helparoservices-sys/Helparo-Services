import { createClient } from '@/lib/supabase/server'
import { PromoPageClient } from '@/components/admin/promo-page-client'

export default async function AdminPromosPage() {
  const supabase = await createClient()

  // Fetch promo codes (schema-aligned)
  const { data: promos, error } = await supabase
    .from('promo_codes')
    .select('id, code, description, discount_type, discount_value, max_discount_rupees, start_date, end_date, usage_limit_total, usage_limit_per_user, min_order_amount_rupees, is_active, created_at, allowed_roles')
    .order('created_at', { ascending: false })
    .limit(100)

  // Collect usage counts for displayed promos
  const usageMap: Record<string, number> = {}
  if (promos && promos.length > 0) {
    const promoIds = promos.map(p => p.id)
    const { data: usages } = await supabase
      .from('promo_code_usages')
      .select('promo_id')
      .in('promo_id', promoIds)
    usages?.forEach(u => {
      usageMap[u.promo_id] = (usageMap[u.promo_id] || 0) + 1
    })
  }

  if (error) {
    return (
      <div className='space-y-6 animate-fade-in'>
        <div className='bg-red-50 dark:bg-red-900/20 backdrop-blur-xl rounded-lg border border-red-200 dark:border-red-800/50 p-6'>
          <h2 className='text-sm font-semibold text-red-700 dark:text-red-300'>Error loading promo codes</h2>
          <p className='text-xs mt-2 text-red-600 dark:text-red-400'>{error.message}</p>
        </div>
      </div>
    )
  }
  return <PromoPageClient promos={promos} usageMap={usageMap} />
}
