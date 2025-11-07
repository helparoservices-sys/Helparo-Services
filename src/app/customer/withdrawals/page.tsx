'use server'
import { createClient } from '@/lib/supabase/server'

export default async function CustomerWithdrawalsPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return <div className='p-6'>Not authenticated</div>

  // helper side if the user is both customer & helper
  const { data: withdrawals } = await supabase
    .from('withdrawal_requests')
    .select('id, amount_paise, status, requested_at')
    .eq('helper_id', user.id)
    .order('requested_at', { ascending: false })
    .limit(30)

  return (
    <div className='min-h-screen bg-primary-50 py-10 px-4'>
      <div className='mx-auto max-w-5xl space-y-6'>
        <h1 className='text-3xl font-bold'>Withdrawals</h1>
        <p className='text-sm text-muted-foreground'>If you act as a helper, your payout requests will appear here.</p>
        <div className='space-y-3'>
          {(withdrawals || []).map(w => (
            <div key={w.id} className='rounded border bg-white p-3 flex items-center justify-between'>
              <div>
                <div className='font-medium'>₹{(w.amount_paise/100).toFixed(2)}</div>
                <div className='text-xs text-muted-foreground'>{new Date(w.requested_at).toLocaleString()}</div>
              </div>
              <div className='text-xs'>{w.status}</div>
            </div>
          ))}
          {(!withdrawals || withdrawals.length === 0) && <p className='text-sm text-muted-foreground'>No withdrawal requests.</p>}
        </div>
      </div>
    </div>
  )
}
