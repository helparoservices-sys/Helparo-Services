'use server'

import { createClient } from '@/lib/supabase/server'
import type { Database } from '@/lib/supabase/database.types'
import { revalidatePath } from 'next/cache'

/**
 * Get wallet balance for current user
 */
export async function getWalletBalance() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  
  if (!user) {
    return { error: 'Not authenticated' }
  }

  const { data, error } = await supabase
    .from('wallet_accounts')
    .select('*')
    .eq('user_id', user.id)
    .maybeSingle()

  if (error) {
    console.error('Error fetching wallet:', error)
    return { error: error.message }
  }

  return { data }
}

/**
 * Get transaction history for current user
 */
export async function getTransactionHistory(limit = 50) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  
  if (!user) {
    return { error: 'Not authenticated' }
  }

  // Get transactions via ledger entries
  const { data: entries, error: entriesError } = await supabase
    .from('ledger_entries')
    .select(`
      *,
      transaction:payment_transactions(*)
    `)
    .eq('account_user_id', user.id)
    .order('created_at', { ascending: false })
    .limit(limit)

  if (entriesError) {
    console.error('Error fetching transactions:', entriesError)
    return { error: entriesError.message }
  }

  return { data: entries }
}

/**
 * Fund escrow for a service request
 * Note: In production, call this AFTER successful Cashfree payment
 */
export async function fundEscrow(
  requestId: string,
  amount: number,
  cashfreeOrderId?: string,
  cashfreePaymentId?: string
) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  
  if (!user) {
    return { error: 'Not authenticated' }
  }

  // Call the database function
  const { data, error } = await supabase.rpc('fund_escrow', {
    p_request_id: requestId,
    p_amount: amount,
    p_cashfree_order_id: cashfreeOrderId || null,
    p_cashfree_payment_id: cashfreePaymentId || null,
  } as any)

  if (error) {
    console.error('Error funding escrow:', error)
    return { error: error.message }
  }

  // Revalidate relevant paths
  revalidatePath('/customer/requests')
  revalidatePath(`/customer/requests/${requestId}`)
  revalidatePath('/customer/dashboard')

  return { data, success: true }
}

/**
 * Release escrow after request completion
 * System function - called automatically or by admin
 */
export async function releaseEscrow(requestId: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  
  if (!user) {
    return { error: 'Not authenticated' }
  }

  // Call the database function
  const { data, error } = await supabase.rpc('release_escrow', {
    p_request_id: requestId,
  } as any)

  if (error) {
    console.error('Error releasing escrow:', error)
    return { error: error.message }
  }

  // Revalidate relevant paths
  revalidatePath('/customer/requests')
  revalidatePath(`/customer/requests/${requestId}`)
  revalidatePath('/helper/assigned')
  revalidatePath('/helper/dashboard')
  revalidatePath('/customer/dashboard')

  return { data, success: true }
}

/**
 * Refund escrow (if request cancelled)
 */
export async function refundEscrow(requestId: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  
  if (!user) {
    return { error: 'Not authenticated' }
  }

  // Call the database function
  const { data, error } = await supabase.rpc('refund_escrow', {
    p_request_id: requestId,
  } as any)

  if (error) {
    console.error('Error refunding escrow:', error)
    return { error: error.message }
  }

  // Revalidate relevant paths
  revalidatePath('/customer/requests')
  revalidatePath(`/customer/requests/${requestId}`)
  revalidatePath('/customer/dashboard')

  return { data, success: true }
}

/**
 * Get escrow details for a request
 */
export async function getEscrowDetails(requestId: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  
  if (!user) {
    return { error: 'Not authenticated' }
  }

  const { data, error } = await supabase
    .from('escrows')
    .select('*')
    .eq('request_id', requestId)
    .maybeSingle()

  if (error) {
    console.error('Error fetching escrow:', error)
    return { error: error.message }
  }

  return { data }
}

/**
 * Get platform statistics (admin only)
 */
export async function getPlatformStats() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  
  if (!user) {
    return { error: 'Not authenticated' }
  }

  // Verify admin
  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single()

  if ((profile as any)?.role !== 'admin') {
    return { error: 'Unauthorized' }
  }

  // Get platform wallet (00000000-0000-0000-0000-000000000000)
  const platformId = '00000000-0000-0000-0000-000000000000'
  
  const { data: platformWallet, error: walletError } = await supabase
    .from('wallet_accounts')
    .select('*')
    .eq('user_id', platformId)
    .maybeSingle()

  if (walletError) {
    console.error('Error fetching platform wallet:', walletError)
    return { error: walletError.message }
  }

  // Get funded escrows count
  const { count: fundedCount, error: fundedError } = await supabase
    .from('escrows')
    .select('*', { count: 'exact', head: true })
    .eq('status', 'funded')

  // Get released escrows count
  const { count: releasedCount, error: releasedError } = await supabase
    .from('escrows')
    .select('*', { count: 'exact', head: true })
    .eq('status', 'released')

  return {
    data: {
      platformWallet,
      fundedEscrowsCount: fundedCount || 0,
      releasedEscrowsCount: releasedCount || 0,
    }
  }
}

/**
 * Get current commission percentage
 */
export async function getCommissionPercent() {
  const supabase = await createClient()
  
  const { data, error } = await supabase.rpc('get_commission_percent')

  if (error) {
    console.error('Error fetching commission:', error)
    return { error: error.message }
  }

  return { data }
}
