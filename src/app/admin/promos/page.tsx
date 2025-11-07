'use server'
import { createClient } from '@/lib/supabase/server'

export default async function AdminPromosPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return <div className='p-6'>Not authenticated</div>
  const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).single()
  if ((profile as any)?.role !== 'admin') return <div className='p-6'>Unauthorized</div>

  const { data: promos } = await supabase
    .from('promo_codes')
    .select('id, code, description, discount_type, discount_value, is_active, max_uses, min_order_amount, max_discount_amount, valid_from, valid_until')
    .order('created_at', { ascending: false })
    .limit(100)

  return (
    <div className='min-h-screen bg-primary-50 py-10 px-4'>
      <div className='mx-auto max-w-7xl space-y-6'>
        <div className='flex items-center justify-between'>
          <div>
            <h1 className='text-3xl font-bold'>Promocodes</h1>
            <p className='text-sm text-muted-foreground mt-1'>Manage discount codes and promotional offers</p>
          </div>
          <button className='px-4 py-2 bg-primary text-white rounded-md text-sm hover:bg-primary/90 flex items-center gap-2'>
            + Add Promocode
          </button>
        </div>

        <div className='bg-white rounded-lg border shadow-sm overflow-hidden'>
          <div className='overflow-x-auto'>
            <table className='w-full'>
              <thead className='bg-gray-50 border-b'>
                <tr>
                  <th className='px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase'>Code</th>
                  <th className='px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase'>Discount</th>
                  <th className='px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase'>Constraints</th>
                  <th className='px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase'>Usage</th>
                  <th className='px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase'>Validity</th>
                  <th className='px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase'>Status</th>
                  <th className='px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase'>Actions</th>
                </tr>
              </thead>
              <tbody className='divide-y divide-gray-200'>
                {(promos || []).map(p => {
                  const isPercentage = p.discount_type === 'percentage'
                  const discountLabel = isPercentage 
                    ? `% ${p.discount_value}% OFF`
                    : `₹${p.discount_value} OFF`
                  const maxCap = isPercentage && p.max_discount_amount ? ` Max: ₹${p.max_discount_amount}` : ''
                  
                  return (
                    <tr key={p.id} className='hover:bg-gray-50'>
                      <td className='px-4 py-3'>
                        <div className='flex items-center gap-2'>
                          <span className='text-xs text-gray-400'>🏷️</span>
                          <span className='font-mono font-medium'>{p.code}</span>
                        </div>
                      </td>
                      <td className='px-4 py-3'>
                        <div className={`text-sm font-semibold ${isPercentage ? 'text-green-600' : 'text-blue-600'}`}>
                          {discountLabel}
                        </div>
                        {maxCap && <div className='text-xs text-gray-500'>{maxCap}</div>}
                      </td>
                      <td className='px-4 py-3'>
                        <div className='text-sm'>Min order: ₹{p.min_order_amount || 0}</div>
                      </td>
                      <td className='px-4 py-3'>
                        <div className='text-sm'>0</div>
                      </td>
                      <td className='px-4 py-3'>
                        <div className='text-sm'>{p.valid_from ? new Date(p.valid_from).toLocaleDateString() : '—'}</div>
                        <div className='text-xs text-gray-500'>to {p.valid_until ? new Date(p.valid_until).toLocaleDateString() : '—'}</div>
                      </td>
                      <td className='px-4 py-3'>
                        <label className='relative inline-flex items-center cursor-pointer'>
                          <input type='checkbox' defaultChecked={p.is_active} className='sr-only peer' />
                          <div className='w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[""] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600'></div>
                        </label>
                      </td>
                      <td className='px-4 py-3 text-right'>
                        <div className='flex items-center justify-end gap-2'>
                          <button className='text-primary hover:text-primary/80'>
                            <svg className='w-4 h-4' fill='none' stroke='currentColor' viewBox='0 0 24 24'>
                              <path strokeLinecap='round' strokeLinejoin='round' strokeWidth={2} d='M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z' />
                            </svg>
                          </button>
                          <button className='text-red-500 hover:text-red-700'>
                            <svg className='w-4 h-4' fill='none' stroke='currentColor' viewBox='0 0 24 24'>
                              <path strokeLinecap='round' strokeLinejoin='round' strokeWidth={2} d='M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16' />
                            </svg>
                          </button>
                        </div>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
            {(!promos || promos.length === 0) && (
              <div className='p-8 text-center text-gray-500'>No promocodes found. Create your first promocode to attract customers!</div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
