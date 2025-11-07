'use server'
import { createClient } from '@/lib/supabase/server'

export default async function HelperSubscriptionsPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return <div className='p-6'>Not authenticated</div>

  const { data: status } = await supabase.rpc('get_helper_subscription_status')
  const { data: plans } = await supabase.from('subscription_plans').select('id, name, description, price_cents, billing_interval').order('price_cents')

  return (
    <div className='min-h-screen bg-primary-50 py-10 px-4'>
      <div className='mx-auto max-w-5xl space-y-6'>
        <h1 className='text-3xl font-bold'>Subscriptions</h1>
        <p className='text-sm text-muted-foreground'>Manage your plan and benefits.</p>
        <div className='rounded border bg-white p-4'>
          <div className='text-sm'>Current Plan: <span className='font-medium'>{status?.plan_name || 'None'}</span></div>
          <div className='text-xs text-muted-foreground'>Status: {status?.status || 'inactive'}</div>
        </div>
        <div className='grid gap-4 md:grid-cols-2 lg:grid-cols-3'>
          {(plans || []).map(p => (
            <div key={p.id} className='rounded-lg border bg-white p-4'>
              <div className='font-semibold'>{p.name}</div>
              <div className='text-xs text-muted-foreground mb-2'>{p.description}</div>
              <div className='text-sm font-medium'>₹{(p.price_cents/100).toFixed(2)} / {p.billing_interval}</div>
              <form action={async () => { await supabase.rpc('subscribe_helper', { p_plan_id: p.id } as any) }}>
                <button className='mt-2 text-xs px-2 py-1 rounded bg-blue-100 hover:bg-blue-200'>Subscribe</button>
              </form>
            </div>
          ))}
          {(!plans || plans.length === 0) && <p className='text-sm text-muted-foreground'>No plans available.</p>}
        </div>
      </div>
    </div>
  )
}
