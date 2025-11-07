'use server'
import { createClient } from '@/lib/supabase/server'

export default async function CustomerPromosPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return <div className='p-6'>Not authenticated</div>

  const { data: promoUses } = await supabase
    .from('promo_code_usages')
    .select('id, promo_code_id, created_at')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false })
    .limit(50)

  // Show referral code if any
  const { data: profile } = await supabase.from('profiles').select('referral_code').eq('id', user.id).single()
  let referralCode = (profile as any)?.referral_code
  if (!referralCode) {
    const { data: gen } = await supabase.rpc('generate_referral_code')
    referralCode = gen?.referral_code || '—'
  }

  return (
    <div className='min-h-screen bg-primary-50 py-10 px-4'>
      <div className='mx-auto max-w-5xl space-y-6'>
        <h1 className='text-3xl font-bold'>Promos & Referrals</h1>
        <div className='rounded border bg-white p-4'>
          <div className='text-sm'>Your Referral Code:</div>
          <div className='text-lg font-semibold'>{referralCode}</div>
        </div>
        <div className='space-y-3'>
          <h2 className='font-semibold text-sm'>Promo Code Usage</h2>
          {(promoUses || []).map(p => (
            <div key={p.id} className='rounded border p-2 bg-white text-xs flex justify-between'>
              <span>Promo #{p.promo_code_id?.slice(0,8)}</span>
              <span>{new Date(p.created_at).toLocaleDateString()}</span>
            </div>
          ))}
          {(!promoUses || promoUses.length === 0) && <p className='text-xs text-muted-foreground'>No promo code usage.</p>}
        </div>
      </div>
    </div>
  )
}
