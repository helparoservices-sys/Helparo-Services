'use server'
import { createClient } from '@/lib/supabase/server'

export default async function AdminReferralsPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return <div className='p-6'>Not authenticated</div>
  const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).single()
  if ((profile as any)?.role !== 'admin') return <div className='p-6'>Unauthorized</div>

  const { data: referrals } = await supabase.from('referrals').select('id, referrer_user_id, referred_user_id, status, reward_granted, created_at').order('created_at', { ascending: false }).limit(50)

  return (
    <div className='min-h-screen bg-primary-50 py-10 px-4'>
      <div className='mx-auto max-w-5xl space-y-6'>
        <h1 className='text-3xl font-bold'>Referrals</h1>
        <p className='text-sm text-muted-foreground'>Monitor referral conversions and rewards.</p>
        <div className='space-y-3'>
          {(referrals || []).map(r => (
            <div key={r.id} className='flex items-center justify-between rounded border bg-white p-3'>
              <div>
                <div className='font-medium'>Conversion: {r.status}</div>
                <div className='text-xs text-muted-foreground'>Reward granted: {String(r.reward_granted)}</div>
                <div className='text-[10px]'>{new Date(r.created_at).toLocaleString()}</div>
              </div>
            </div>
          ))}
          {(!referrals || referrals.length === 0) && <p className='text-sm text-muted-foreground'>No referrals yet.</p>}
        </div>
      </div>
    </div>
  )
}
