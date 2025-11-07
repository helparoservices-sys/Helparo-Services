'use server'
import { createClient } from '@/lib/supabase/server'

export default async function CustomerBidsPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return <div className='p-6'>Not authenticated</div>

  // Show applications with bids for user's open requests
  const { data: bids } = await supabase
    .from('request_applications')
    .select('id, request_id, helper_id, bid_amount, status, created_at')
    .order('created_at', { ascending: false })
    .limit(50)

  return (
    <div className='min-h-screen bg-primary-50 py-10 px-4'>
      <div className='mx-auto max-w-5xl space-y-6'>
        <h1 className='text-3xl font-bold'>Incoming Bids</h1>
        <div className='space-y-3'>
          {(bids || []).map(b => (
            <div key={b.id} className='rounded border bg-white p-3 flex flex-col gap-2'>
              <div className='flex items-center justify-between'>
                <span className='text-xs'>Req #{b.request_id?.slice(0,8)}</span>
                <span className='text-xs'>Helper: {b.helper_id?.slice(0,8)}</span>
              </div>
              <div className='text-sm font-medium'>Bid: ₹{b.bid_amount || '—'}</div>
              <div className='text-[10px] text-muted-foreground'>{b.status}</div>
              <div className='flex gap-2'>
                {b.status === 'applied' && (
                  <>
                    <form action={async () => { await supabase.rpc('accept_bid', { p_application_id: b.id } as any) }}>
                      <button className='text-xs px-2 py-1 rounded bg-green-100 hover:bg-green-200'>Accept</button>
                    </form>
                    <form action={async () => { await supabase.rpc('reject_bid', { p_application_id: b.id } as any) }}>
                      <button className='text-xs px-2 py-1 rounded bg-red-100 hover:bg-red-200'>Reject</button>
                    </form>
                  </>
                )}
              </div>
            </div>
          ))}
          {(!bids || bids.length === 0) && <p className='text-sm text-muted-foreground'>No bids yet.</p>}
        </div>
      </div>
    </div>
  )
}
