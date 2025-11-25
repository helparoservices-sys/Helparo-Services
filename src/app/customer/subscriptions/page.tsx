'use server'
import { createClient } from '@/lib/supabase/server'
import { Button } from '@/components/ui/button'
import { COMMISSION } from '@/lib/constants'

export default async function CustomerSubscriptionsPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return <div className='p-6'>Not authenticated</div>

  // Show helper subscription status if they also act as helper / or general info
  const { data: status } = await supabase.rpc('get_helper_subscription_status')
  const { data: plans } = await supabase
    .from('subscription_plans')
    .select('id, code, name, description, price_rupees, interval, included_features, commission_discount_percent, extra_radius_km, priority_level, trial_days')
    .eq('is_active', true)
    .order('price_rupees')

  return (
    <div className='min-h-screen bg-primary-50 py-10 px-4'>
      <div className='mx-auto max-w-5xl space-y-6'>
        <h1 className='text-3xl font-bold'>Helper Plans</h1>
        <p className='text-sm text-muted-foreground'>If you plan to offer services, choose a subscription plan.</p>
        <div className='rounded border bg-white p-4'>
          <div className='text-sm'>Current Plan: <span className='font-medium'>{status?.plan_name || 'None'}</span></div>
          <div className='text-xs text-muted-foreground'>Status: {status?.status || 'inactive'}</div>
        </div>
        <div className='bg-primary-50 border border-primary-100 rounded p-4 text-xs text-slate-700'>
          Base platform commission is {COMMISSION.PLATFORM_PERCENTAGE}%. Plans with "commission discount" reduce this. For example, a {COMMISSION.PLATFORM_PERCENTAGE}% base with a 5% discount becomes {(COMMISSION.PLATFORM_PERCENTAGE - 5)}% effective.
        </div>
        <div className='grid gap-4 md:grid-cols-2 lg:grid-cols-3'>
          {(plans || []).map((p: any) => (
            <div key={p.id} className='rounded-lg border bg-white p-4 space-y-3'>
              <div className='font-semibold'>{p.name}</div>
              <div className='text-xs text-muted-foreground'>{p.description}</div>
              <div className='text-sm font-medium'>₹{Number(p.price_rupees).toFixed(2)} / {p.interval}</div>
              <ul className='text-xs list-disc pl-5 space-y-1'>
                {p.commission_discount_percent && <li>Commission discount: {p.commission_discount_percent}%</li>}
                {p.extra_radius_km && <li>Extra radius: {p.extra_radius_km} km</li>}
                {p.priority_level ? <li>Priority level: {p.priority_level}</li> : null}
                {Array.isArray(p.included_features) && p.included_features.length > 0 && (
                  <li>Features: {p.included_features.join(', ').replaceAll('_',' ')}</li>
                )}
                {p.trial_days ? <li>Trial: {p.trial_days} days</li> : null}
              </ul>
              <form action={async () => { await supabase.rpc('subscribe_helper', { p_plan_code: p.code }) }}>
                <Button type='submit' className='w-full'>Subscribe</Button>
              </form>
            </div>
          ))}
          {(!plans || plans.length === 0) && <p className='text-sm text-muted-foreground'>No plans available.</p>}
        </div>
      </div>
    </div>
  )
}
