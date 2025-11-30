'use server'

import { createClient } from '@/lib/supabase/server'
import { requireAuth } from '@/lib/auth-middleware'
import { UserRole } from '@/lib/constants'
import { logger } from '@/lib/logger'
import { checkRateLimit } from '@/lib/rate-limit'

/**
 * GET HELPER WALLET DATA
 * Returns balance, earnings, transactions, and withdrawal history
 */
export async function getHelperWallet() {
  try {
    const { user } = await requireAuth(UserRole.HELPER)

    const supabase = await createClient()

    // Get helper profile
    const { data: helperProfile } = await supabase
      .from('helper_profiles')
      .select('id')
      .eq('user_id', user.id)
      .maybeSingle()

    if (!helperProfile) {
      return { error: 'Helper profile not found' }
    }

    const helperId = helperProfile.id

    // Get actual wallet balance from wallet_accounts table
    const { data: walletAccount } = await supabase
      .from('wallet_accounts')
      .select('available_balance, escrow_balance')
      .eq('user_id', user.id)
      .maybeSingle()

    const availableBalance = walletAccount?.available_balance || 0
    const escrowBalance = walletAccount?.escrow_balance || 0

    // Calculate date ranges
    const today = new Date()
    today.setHours(0, 0, 0, 0)

    const weekAgo = new Date()
    weekAgo.setDate(weekAgo.getDate() - 7)

    const monthAgo = new Date()
    monthAgo.setMonth(monthAgo.getMonth() - 1)

    // Get wallet ledger entries (more reliable than transactions table)
    const { data: ledgerEntries } = await supabase
      .from('wallet_ledger')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .limit(50)

    // Calculate totals from ledger
    const totalEarned = ledgerEntries
      ?.filter(e => e.entry_type === 'credit' && (e.transaction_type === 'earning' || e.transaction_type === 'bonus'))
      ?.reduce((sum, e) => sum + e.amount, 0) || 0

    const totalWithdrawn = ledgerEntries
      ?.filter(e => e.entry_type === 'debit' && e.transaction_type === 'withdrawal')
      ?.reduce((sum, e) => sum + e.amount, 0) || 0

    // Calculate recent earnings
    const todayEarnings = ledgerEntries
      ?.filter(e => 
        e.entry_type === 'credit' && 
        e.transaction_type === 'earning' &&
        new Date(e.created_at) >= today
      )
      ?.reduce((sum, e) => sum + e.amount, 0) || 0

    const weekEarnings = ledgerEntries
      ?.filter(e => 
        e.entry_type === 'credit' && 
        e.transaction_type === 'earning' &&
        new Date(e.created_at) >= weekAgo
      )
      ?.reduce((sum, e) => sum + e.amount, 0) || 0

    const monthEarnings = ledgerEntries
      ?.filter(e => 
        e.entry_type === 'credit' && 
        e.transaction_type === 'earning' &&
        new Date(e.created_at) >= monthAgo
      )
      ?.reduce((sum, e) => sum + e.amount, 0) || 0

    // Get withdrawal requests
    const { data: withdrawals } = await supabase
      .from('withdrawal_requests')
      .select('*')
      .eq('helper_id', helperId)
      .order('requested_at', { ascending: false })
      .limit(20)

    return {
      data: {
        balance: {
          available: availableBalance,
          pending: escrowBalance,
          total_earned: totalEarned,
          total_withdrawn: totalWithdrawn,
        },
        earnings: {
          today: todayEarnings,
          this_week: weekEarnings,
          this_month: monthEarnings,
        },
        transactions: ledgerEntries?.map(e => ({
          id: e.id,
          type: e.transaction_type,
          amount: e.amount,
          status: 'completed',
          description: e.description || `${e.entry_type === 'credit' ? 'Credit' : 'Debit'} - ${e.transaction_type}`,
          created_at: e.created_at,
          job_title: null,
        })) || [],
        withdrawals: withdrawals?.map(w => ({
          id: w.id,
          amount: w.amount,
          status: w.status,
          requested_at: w.requested_at,
          processed_at: w.processed_at,
          bank_details: w.bank_details || 'Bank details on file',
        })) || [],
      },
    }
  } catch (error) {
    logger.error('Get helper wallet error', { error })
    return { error: 'An unexpected error occurred' }
  }
}

/**
 * REQUEST WITHDRAWAL
 * Submit a withdrawal request for available balance
 */
export async function requestWithdrawal(amount: number) {
  try {
    const { user } = await requireAuth(UserRole.HELPER)

    // Rate limiting: 5 withdrawal requests per day
    const rateLimitResult = await checkRateLimit(`withdrawal:${user.id}`, {
      maxRequests: 5,
      windowMs: 86400000, // 24 hours
    })
    if (!rateLimitResult.allowed) {
      return { error: 'Withdrawal request limit exceeded. Please try again tomorrow.' }
    }

    const supabase = await createClient()

    // Get helper profile
    const { data: helperProfile } = await supabase
      .from('helper_profiles')
      .select('id')
      .eq('user_id', user.id)
      .maybeSingle()

    if (!helperProfile) {
      return { error: 'Helper profile not found' }
    }

    // Validate amount
    if (!amount || amount <= 0) {
      return { error: 'Invalid withdrawal amount' }
    }

    if (amount < 100) {
      return { error: 'Minimum withdrawal amount is ₹100' }
    }

    // Calculate available balance (simple version - in production, use wallet balance)
    const { data: transactions } = await supabase
      .from('transactions')
      .select('transaction_type, amount, status')
      .eq('helper_id', helperProfile.id)

    const completedEarnings = transactions
      ?.filter(t => t.transaction_type === 'earning' && t.status === 'completed')
      ?.reduce((sum, t) => sum + (t.amount || 0), 0) || 0

    const totalWithdrawn = transactions
      ?.filter(t => t.transaction_type === 'withdrawal' && t.status === 'completed')
      ?.reduce((sum, t) => sum + (t.amount || 0), 0) || 0

    const availableBalance = completedEarnings - totalWithdrawn

    if (amount > availableBalance) {
      return { error: 'Insufficient balance' }
    }

    // Create withdrawal request
    const { error: insertError } = await supabase
      .from('withdrawal_requests')
      .insert({
        helper_id: helperProfile.id,
        amount,
        status: 'pending',
        requested_at: new Date().toISOString(),
        bank_details: 'Default bank account', // In production, fetch from helper profile
      })

    if (insertError) {
      logger.error('Failed to create withdrawal request', { error: insertError })
      return { error: 'Failed to submit withdrawal request' }
    }

    // Create transaction record
    await supabase.from('transactions').insert({
      helper_id: helperProfile.id,
      transaction_type: 'withdrawal',
      amount,
      status: 'pending',
      description: 'Withdrawal request',
      created_at: new Date().toISOString(),
    })

    logger.info('Withdrawal requested', {
      helper_id: helperProfile.id,
      amount,
    })

    return { success: true }
  } catch (error) {
    logger.error('Request withdrawal error', { error })
    return { error: 'An unexpected error occurred' }
  }
}
