'use server'
import { createClient } from '@/lib/supabase/server'
import { Tag, Plus, Edit2, Trash2, CheckCircle, XCircle, Percent, DollarSign, Calendar, TrendingUp } from 'lucide-react'

export default async function AdminPromosPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return <div className='p-6 text-center'>Not authenticated</div>
  const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).single()
  if ((profile as any)?.role !== 'admin') return <div className='p-6 text-center'>Unauthorized</div>

  const { data: promos } = await supabase
    .from('promo_codes')
    .select('id, code, description, discount_type, discount_value, is_active, max_uses, min_order_amount, max_discount_amount, valid_from, valid_until')
    .order('created_at', { ascending: false })
    .limit(100)

  // Calculate stats
  const totalPromos = promos?.length || 0
  const activePromos = promos?.filter(p => p.is_active).length || 0
  const percentagePromos = promos?.filter(p => p.discount_type === 'percentage').length || 0
  const flatPromos = promos?.filter(p => p.discount_type === 'flat').length || 0

  return (
    <div className='space-y-6 animate-fade-in'>
      {/* Header */}
      <div className='flex items-center justify-between'>
        <div>
          <h1 className='text-3xl font-bold text-slate-900 dark:text-white'>Promocodes</h1>
          <p className='text-sm text-slate-500 dark:text-slate-400 mt-1'>Manage discount codes and promotional offers</p>
        </div>
        <button className='inline-flex items-center gap-2 px-4 py-2 bg-primary-600 hover:bg-primary-700 text-white rounded-lg text-sm font-medium transition-colors shadow-lg'>
          <Plus className='h-4 w-4' />
          Add Promocode
        </button>
      </div>

      {/* Stats Cards */}
      <div className='grid grid-cols-1 md:grid-cols-4 gap-6'>
        <div className='bg-white/80 dark:bg-slate-800/80 backdrop-blur-xl rounded-lg border border-white/20 dark:border-slate-700/50 shadow-lg p-6'>
          <div className='flex items-center justify-between'>
            <div>
              <p className='text-sm text-slate-600 dark:text-slate-400'>Total Promos</p>
              <p className='text-2xl font-bold text-slate-900 dark:text-white mt-1'>{totalPromos}</p>
            </div>
            <div className='w-12 h-12 rounded-lg bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center shadow-lg'>
              <Tag className='h-6 w-6 text-blue-600 dark:text-blue-400' />
            </div>
          </div>
        </div>

        <div className='bg-white/80 dark:bg-slate-800/80 backdrop-blur-xl rounded-lg border border-white/20 dark:border-slate-700/50 shadow-lg p-6'>
          <div className='flex items-center justify-between'>
            <div>
              <p className='text-sm text-slate-600 dark:text-slate-400'>Active Promos</p>
              <p className='text-2xl font-bold text-slate-900 dark:text-white mt-1'>{activePromos}</p>
            </div>
            <div className='w-12 h-12 rounded-lg bg-green-100 dark:bg-green-900/30 flex items-center justify-center shadow-lg'>
              <CheckCircle className='h-6 w-6 text-green-600 dark:text-green-400' />
            </div>
          </div>
        </div>

        <div className='bg-white/80 dark:bg-slate-800/80 backdrop-blur-xl rounded-lg border border-white/20 dark:border-slate-700/50 shadow-lg p-6'>
          <div className='flex items-center justify-between'>
            <div>
              <p className='text-sm text-slate-600 dark:text-slate-400'>Percentage Off</p>
              <p className='text-2xl font-bold text-slate-900 dark:text-white mt-1'>{percentagePromos}</p>
            </div>
            <div className='w-12 h-12 rounded-lg bg-purple-100 dark:bg-purple-900/30 flex items-center justify-center shadow-lg'>
              <Percent className='h-6 w-6 text-purple-600 dark:text-purple-400' />
            </div>
          </div>
        </div>

        <div className='bg-white/80 dark:bg-slate-800/80 backdrop-blur-xl rounded-lg border border-white/20 dark:border-slate-700/50 shadow-lg p-6'>
          <div className='flex items-center justify-between'>
            <div>
              <p className='text-sm text-slate-600 dark:text-slate-400'>Flat Discount</p>
              <p className='text-2xl font-bold text-slate-900 dark:text-white mt-1'>{flatPromos}</p>
            </div>
            <div className='w-12 h-12 rounded-lg bg-orange-100 dark:bg-orange-900/30 flex items-center justify-center shadow-lg'>
              <DollarSign className='h-6 w-6 text-orange-600 dark:text-orange-400' />
            </div>
          </div>
        </div>
      </div>

      {/* Promos Table */}
      <div className='bg-white/80 dark:bg-slate-800/80 backdrop-blur-xl rounded-lg border border-white/20 dark:border-slate-700/50 shadow-lg overflow-hidden'>
        <div className='overflow-x-auto'>
          <table className='w-full'>
            <thead className='bg-slate-50 dark:bg-slate-900/50'>
              <tr>
                <th className='px-6 py-4 text-left text-xs font-medium text-slate-700 dark:text-slate-300 uppercase tracking-wider'>Code</th>
                <th className='px-6 py-4 text-left text-xs font-medium text-slate-700 dark:text-slate-300 uppercase tracking-wider'>Discount</th>
                <th className='px-6 py-4 text-left text-xs font-medium text-slate-700 dark:text-slate-300 uppercase tracking-wider'>Constraints</th>
                <th className='px-6 py-4 text-left text-xs font-medium text-slate-700 dark:text-slate-300 uppercase tracking-wider'>Validity</th>
                <th className='px-6 py-4 text-left text-xs font-medium text-slate-700 dark:text-slate-300 uppercase tracking-wider'>Status</th>
                <th className='px-6 py-4 text-right text-xs font-medium text-slate-700 dark:text-slate-300 uppercase tracking-wider'>Actions</th>
              </tr>
            </thead>
            <tbody className='divide-y divide-slate-100 dark:divide-slate-700/50'>
              {(promos || []).map(p => {
                const isPercentage = p.discount_type === 'percentage'
                const discountLabel = isPercentage 
                  ? `${p.discount_value}% OFF`
                  : `₹${p.discount_value} OFF`
                const maxCap = isPercentage && p.max_discount_amount ? ` Max: ₹${p.max_discount_amount}` : ''
                
                return (
                  <tr key={p.id} className='hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors'>
                    <td className='px-6 py-4'>
                      <div className='flex items-center gap-3'>
                        <div className='w-8 h-8 rounded-lg bg-gradient-to-br from-primary-500 to-primary-600 flex items-center justify-center shadow-lg'>
                          <Tag className='h-4 w-4 text-white' />
                        </div>
                        <div>
                          <div className='font-mono font-semibold text-slate-900 dark:text-white'>{p.code}</div>
                          {p.description && <div className='text-xs text-slate-500 dark:text-slate-400 line-clamp-1'>{p.description}</div>}
                        </div>
                      </div>
                    </td>
                    <td className='px-6 py-4'>
                      <div className='flex items-center gap-2'>
                        {isPercentage ? (
                          <Percent className='h-4 w-4 text-green-600 dark:text-green-400' />
                        ) : (
                          <DollarSign className='h-4 w-4 text-blue-600 dark:text-blue-400' />
                        )}
                        <div>
                          <div className={`text-sm font-semibold ${isPercentage ? 'text-green-600 dark:text-green-400' : 'text-blue-600 dark:text-blue-400'}`}>
                            {discountLabel}
                          </div>
                          {maxCap && <div className='text-xs text-slate-500 dark:text-slate-400'>{maxCap}</div>}
                        </div>
                      </div>
                    </td>
                    <td className='px-6 py-4'>
                      <div className='text-sm text-slate-600 dark:text-slate-400'>
                        <div>Min: ₹{p.min_order_amount || 0}</div>
                        {p.max_uses && <div className='text-xs'>Max uses: {p.max_uses}</div>}
                      </div>
                    </td>
                    <td className='px-6 py-4'>
                      <div className='flex items-center gap-2'>
                        <Calendar className='h-4 w-4 text-slate-400' />
                        <div className='text-sm'>
                          <div className='text-slate-900 dark:text-white'>{p.valid_from ? new Date(p.valid_from).toLocaleDateString() : '—'}</div>
                          <div className='text-xs text-slate-500 dark:text-slate-400'>to {p.valid_until ? new Date(p.valid_until).toLocaleDateString() : '—'}</div>
                        </div>
                      </div>
                    </td>
                    <td className='px-6 py-4'>
                      {p.is_active ? (
                        <span className='inline-flex items-center gap-1 px-2 py-1 text-xs rounded-full bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400'>
                          <CheckCircle className='h-3 w-3' />
                          Active
                        </span>
                      ) : (
                        <span className='inline-flex items-center gap-1 px-2 py-1 text-xs rounded-full bg-slate-100 dark:bg-slate-900/30 text-slate-600 dark:text-slate-400'>
                          <XCircle className='h-3 w-3' />
                          Inactive
                        </span>
                      )}
                    </td>
                    <td className='px-6 py-4'>
                      <div className='flex items-center justify-end gap-2'>
                        <button className='p-2 text-primary-600 dark:text-primary-400 hover:bg-primary-50 dark:hover:bg-primary-900/30 rounded-lg transition-colors'>
                          <Edit2 className='h-4 w-4' />
                        </button>
                        <button className='p-2 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/30 rounded-lg transition-colors'>
                          <Trash2 className='h-4 w-4' />
                        </button>
                      </div>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
          {(!promos || promos.length === 0) && (
            <div className='p-12 text-center'>
              <Tag className='h-16 w-16 text-slate-400 dark:text-slate-600 mx-auto mb-4' />
              <h3 className='text-lg font-semibold text-slate-900 dark:text-white mb-2'>No Promocodes Yet</h3>
              <p className='text-sm text-slate-500 dark:text-slate-400 mb-4'>Create promotional codes to attract and reward customers</p>
              <button className='inline-flex items-center gap-2 px-4 py-2 bg-primary-600 hover:bg-primary-700 text-white rounded-lg text-sm font-medium transition-colors'>
                <Plus className='h-4 w-4' />
                Create First Promocode
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
