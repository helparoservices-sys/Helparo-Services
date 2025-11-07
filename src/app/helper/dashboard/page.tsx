'use server'

import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { Database } from '@/lib/supabase/database.types'

export default async function HelperDashboard() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  let status: { isApproved: boolean; verificationStatus: string | null } = { isApproved: false, verificationStatus: null }
  if (user) {
    const { data: helperProfile } = await supabase
      .from('helper_profiles')
      .select('is_approved, verification_status')
      .eq('user_id', user.id)
      .maybeSingle()
    type HelperProfile = Pick<Database['public']['Tables']['helper_profiles']['Row'], 'is_approved' | 'verification_status'>
    if (helperProfile) {
      const h = helperProfile as HelperProfile
      status = { isApproved: !!h.is_approved, verificationStatus: h.verification_status }
    }
  }

  const needsVerification = !status.isApproved || status.verificationStatus !== 'approved'

  return (
    <div className="min-h-screen bg-primary-50 py-12 px-4">
      <div className="mx-auto max-w-3xl space-y-6">
        <h1 className="text-3xl font-bold">Helper Dashboard</h1>
        {needsVerification && (
          <div className="rounded-md border border-yellow-300 bg-yellow-50 p-4 space-y-2">
            <p className="text-sm font-medium text-yellow-800">Verification Required</p>
            <p className="text-xs text-yellow-700">You must submit verification documents before appearing in customer searches or viewing open requests.</p>
            <Link href="/helper/verification" className="inline-block text-xs font-medium text-primary underline">Go to Verification</Link>
          </div>
        )}
        {!needsVerification && (
          <div className="rounded-md border border-green-300 bg-green-50 p-4 space-y-1">
            <p className="text-sm font-medium text-green-800">Verified</p>
            <p className="text-xs text-green-700">Your profile is verified and approved. You can browse open service requests.</p>
          </div>
        )}
        <div className="grid gap-4 md:grid-cols-2">
          <Link href="/helper/services" className="block p-6 bg-white rounded-lg border hover:border-primary transition-colors">
            <h3 className="font-semibold text-lg mb-2">My Services</h3>
            <p className="text-sm text-muted-foreground">Manage service categories and rates</p>
          </Link>
          
          <Link href="/helper/requests" className="block p-6 bg-white rounded-lg border hover:border-primary transition-colors">
            <h3 className="font-semibold text-lg mb-2">Open Requests</h3>
            <p className="text-sm text-muted-foreground">Browse and apply to customer requests</p>
          </Link>
          
          <Link href="/helper/assigned" className="block p-6 bg-white rounded-lg border hover:border-primary transition-colors">
            <h3 className="font-semibold text-lg mb-2">Assigned Jobs</h3>
            <p className="text-sm text-muted-foreground">View jobs assigned to you</p>
          </Link>
          
          <Link href="/helper/wallet" className="block p-6 bg-white rounded-lg border hover:border-primary transition-colors">
            <h3 className="font-semibold text-lg mb-2">💰 My Wallet</h3>
            <p className="text-sm text-muted-foreground">View earnings and transaction history</p>
          </Link>
          
          <Link href="/helper/verification" className="block p-6 bg-white rounded-lg border hover:border-primary transition-colors">
            <h3 className="font-semibold text-lg mb-2">Verification</h3>
            <p className="text-sm text-muted-foreground">Upload KYC documents</p>
          </Link>
        </div>
      </div>
    </div>
  )
}
