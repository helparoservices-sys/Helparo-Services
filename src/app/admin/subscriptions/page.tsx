'use server'

import { createClient } from '@/lib/supabase/server'
import Link from 'next/link'

export default async function AdminSubscriptionsPage() {
  const supabase = await createClient()

  // Auth handled by middleware
  const { data: plans } = await supabase.from('subscription_plans').select('*').order('price_cents')

  return (
    <div className="min-h-screen bg-primary-50 py-10 px-4">
      <div className="mx-auto max-w-6xl space-y-6">
        <h1 className="text-3xl font-bold">Subscription Plans</h1>
        <p className="text-sm text-muted-foreground">Manage helper subscription tiers and benefits.</p>
        <Link href="/admin/subscriptions/new" className="text-primary underline text-sm">New Plan</Link>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {(plans || []).map(p => (
            <div key={p.id} className="rounded-lg border bg-white p-4">
              <h2 className="font-semibold">{p.name}</h2>
              <div className="text-xs text-muted-foreground mb-2">{p.description}</div>
              <div className="text-sm font-medium">Price: ₹{(p.price_cents / 100).toFixed(2)} / {p.billing_interval}</div>
              <Link href={`/admin/subscriptions/${p.id}`} className="text-primary text-xs underline mt-2 inline-block">Edit</Link>
            </div>
          ))}
          {(!plans || plans.length === 0) && <p className="text-sm text-muted-foreground">No plans configured.</p>}
        </div>
      </div>
    </div>
  )
}
