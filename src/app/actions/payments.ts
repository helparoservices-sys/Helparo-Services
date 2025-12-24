'use server'

import { createClient } from '@/lib/supabase/server'
import type { Database } from '@/lib/supabase/database.types'
import { revalidatePath } from 'next/cache'
import { requireAuth } from '@/lib/auth-middleware'
import { validateFormData, fundEscrowSchema, uuidSchema } from '@/lib/validation'
import { handleServerActionError } from '@/lib/errors'
import { rateLimit, RATE_LIMITS } from '@/lib/rate-limit'
import { UserRole } from '@/lib/constants'
import { logger } from '@/lib/logger'

/**
 * Get wallet balance for current user
 */
export async function getWalletBalance() {
  try {
    const { user } = await requireAuth()

    const supabase = await createClient()
    const { data, error } = await supabase
      .from('wallet_accounts')
      .select('id, user_id, balance, currency, created_at, updated_at')
      .eq('user_id', user.id)
      .maybeSingle()

    if (error) {
      logger.error('Error fetching wallet', { error, userId: user.id })
      throw error
    }

    return { success: true, data }
  } catch (error: any) {
    return handleServerActionError(error)
  }
}

/**
 * Get transaction history for current user
 */
export async function getTransactionHistory(limit = 50) {
  try {
    const { user } = await requireAuth()

    // Validate limit
    const validLimit = Math.min(Math.max(1, limit), 100) // Between 1 and 100

    const supabase = await createClient()
    const { data: entries, error: entriesError } = await supabase
      .from('ledger_entries')
      .select(`
        *,
        transaction:payment_transactions(*)
      `)
      .eq('account_user_id', user.id)
      .order('created_at', { ascending: false })
      .limit(validLimit)

    if (entriesError) {
      logger.error('Error fetching transactions', { error: entriesError, userId: user.id })
      throw entriesError
    }

    return { success: true, data: entries }
  } catch (error: any) {
    return handleServerActionError(error)
  }
}

/**
 * Fund escrow for a service request
 * Note: In production, call this AFTER successful Cashfree payment
 */
export async function fundEscrow(formData: FormData) {
  try {
    const { user } = await requireAuth()

    // Validate input
    const validation = validateFormData(formData, fundEscrowSchema)
    if (!validation.success) {
      return { error: validation.error }
    }

    const { service_request_id, amount } = validation.data

    // Rate limit payment actions
    await rateLimit('fund-escrow', user.id, RATE_LIMITS.PAYMENT_ACTION)

    const cashfreeOrderId = formData.get('cashfree_order_id') as string | null
    const cashfreePaymentId = formData.get('cashfree_payment_id') as string | null

    const supabase = await createClient()
    const { data, error } = await supabase.rpc('fund_escrow', {
      p_request_id: service_request_id,
      p_amount: amount,
      p_cashfree_order_id: cashfreeOrderId,
      p_cashfree_payment_id: cashfreePaymentId,
    } as any)

    if (error) {
      logger.error('Error funding escrow', { error, userId: user.id, requestId: service_request_id })
      throw error
    }

    // Revalidate relevant paths
    revalidatePath('/customer/requests')
    revalidatePath(`/customer/requests/${service_request_id}`)
    revalidatePath('/customer/dashboard')

    logger.info('Escrow funded', { userId: user.id, requestId: service_request_id, amount })
    return { success: true, data }
  } catch (error: any) {
    return handleServerActionError(error)
  }
}

/**
 * Release escrow after request completion
 * System function - called automatically or by admin
 */
export async function releaseEscrow(formData: FormData) {
  try {
    const { user } = await requireAuth(UserRole.ADMIN)

    const requestId = formData.get('service_request_id') as string
    if (!requestId) {
      return { error: 'Service request ID is required' }
    }

    const supabase = await createClient()
    const { data, error } = await supabase.rpc('release_escrow', {
      p_request_id: requestId,
    } as any)

    if (error) {
      logger.error('Error releasing escrow', { error, userId: user.id, requestId })
      throw error
    }

    // Revalidate relevant paths
    revalidatePath('/customer/requests')
    revalidatePath(`/customer/requests/${requestId}`)
    revalidatePath('/helper/assigned')
    revalidatePath('/helper/dashboard')
    revalidatePath('/customer/dashboard')

    logger.info('Escrow released', { userId: user.id, requestId })
    return { success: true, data }
  } catch (error: any) {
    return handleServerActionError(error)
  }
}

/**
 * Refund escrow (if request cancelled)
 */
export async function refundEscrow(formData: FormData) {
  try {
    const { user } = await requireAuth()

    const requestId = formData.get('service_request_id') as string
    if (!requestId) {
      return { error: 'Service request ID is required' }
    }

    const supabase = await createClient()
    const { data, error } = await supabase.rpc('refund_escrow', {
      p_request_id: requestId,
    } as any)

    if (error) {
      logger.error('Error refunding escrow', { error, userId: user.id, requestId })
      throw error
    }

    // Revalidate relevant paths
    revalidatePath('/customer/requests')
    revalidatePath(`/customer/requests/${requestId}`)
    revalidatePath('/customer/dashboard')

    logger.info('Escrow refunded', { userId: user.id, requestId })
    return { success: true, data }
  } catch (error: any) {
    return handleServerActionError(error)
  }
}

/**
 * Get escrow details for a request
 */
export async function getEscrowDetails(requestId: string) {
  try {
    const { user } = await requireAuth()

    const supabase = await createClient()
    const { data, error } = await supabase
      .from('escrows')
      .select('id, request_id, amount, status, funded_at, released_at, created_at')
      .eq('request_id', requestId)
      .maybeSingle()

    if (error) {
      logger.error('Error fetching escrow', { error, userId: user.id, requestId })
      throw error
    }

    return { success: true, data }
  } catch (error: any) {
    return handleServerActionError(error)
  }
}

/**
 * Get platform statistics (admin only)
 */
export async function getPlatformStats() {
  try {
    const { user } = await requireAuth(UserRole.ADMIN)

    const supabase = await createClient()
    const platformId = '00000000-0000-0000-0000-000000000000'
    
    const { data: platformWallet, error: walletError } = await supabase
      .from('wallet_accounts')
      .select('id, user_id, balance, currency, created_at, updated_at')
      .eq('user_id', platformId)
      .maybeSingle()

    if (walletError) {
      logger.error('Error fetching platform wallet', { error: walletError, userId: user.id })
      throw walletError
    }

    // Get funded escrows count
    const { count: fundedCount } = await supabase
      .from('escrows')
      .select('*', { count: 'exact', head: true })
      .eq('status', 'funded')

    // Get released escrows count
    const { count: releasedCount } = await supabase
      .from('escrows')
      .select('*', { count: 'exact', head: true })
      .eq('status', 'released')

    return {
      success: true,
      data: {
        platformWallet,
        fundedEscrowsCount: fundedCount || 0,
        releasedEscrowsCount: releasedCount || 0,
      }
    }
  } catch (error: any) {
    return handleServerActionError(error)
  }
}

/**
 * Get current commission percentage
 */
export async function getCommissionPercent() {
  try {
    const supabase = await createClient()
    const { data, error } = await supabase.rpc('get_commission_percent')

    if (error) {
      logger.error('Error fetching commission', { error })
      throw error
    }

    return { success: true, data }
  } catch (error: any) {
    return handleServerActionError(error)
  }
}
