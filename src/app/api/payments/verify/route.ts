import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { logger } from '@/lib/logger'

// Cashfree API configuration - support both variable names
const CASHFREE_APP_ID = process.env.CASHFREE_APP_ID || process.env.NEXT_PUBLIC_PAYMENT_API_KEY!
const CASHFREE_SECRET_KEY = process.env.CASHFREE_SECRET_KEY || process.env.PAYMENT_SECRET_KEY!
const CASHFREE_ENV = process.env.CASHFREE_ENVIRONMENT || 'PRODUCTION'

const CASHFREE_API_URL = CASHFREE_ENV === 'TEST' 
  ? 'https://sandbox.cashfree.com/pg'
  : 'https://api.cashfree.com/pg'

// Create Supabase client for route handlers
async function createRouteClient() {
  const cookieStore = await cookies()
  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() { return cookieStore.getAll() },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            )
          } catch { /* Ignore */ }
        },
      },
    }
  )
}

/**
 * Verify payment status with Cashfree
 * GET /api/payments/verify?order_id=xxx
 */
export async function GET(request: NextRequest) {
  try {
    // Verify authentication using route-specific client
    const supabase = await createRouteClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    
    if (authError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    // Get order_id from query
    const { searchParams } = new URL(request.url)
    const orderId = searchParams.get('order_id')

    if (!orderId) {
      return NextResponse.json(
        { error: 'order_id is required' },
        { status: 400 }
      )
    }

    // Get payment order from database
    const { data: paymentOrder, error: dbError } = await supabase
      .from('payment_orders')
      .select('*, service_requests(id, title, status, customer_id)')
      .eq('order_id', orderId)
      .single()

    if (dbError || !paymentOrder) {
      return NextResponse.json(
        { error: 'Payment order not found' },
        { status: 404 }
      )
    }

    // Verify user owns this payment
    if (paymentOrder.customer_id !== user.id) {
      return NextResponse.json(
        { error: 'You can only verify your own payments' },
        { status: 403 }
      )
    }

    // If already success/failed in DB, return that status
    if (['success', 'failed', 'refunded'].includes(paymentOrder.payment_status)) {
      return NextResponse.json({
        success: true,
        order_id: orderId,
        status: paymentOrder.payment_status,
        amount: paymentOrder.order_amount / 100, // Convert paise to rupees
        payment_method: paymentOrder.payment_method,
        payment_time: paymentOrder.payment_time,
        from_cache: true,
      })
    }

    // Call Cashfree to get latest status
    const cashfreeResponse = await fetch(
      `${CASHFREE_API_URL}/orders/${orderId}`,
      {
        method: 'GET',
        headers: {
          'x-api-version': '2023-08-01',
          'x-client-id': CASHFREE_APP_ID,
          'x-client-secret': CASHFREE_SECRET_KEY,
        },
      }
    )

    if (!cashfreeResponse.ok) {
      logger.error('Cashfree verify failed', { 
        status: cashfreeResponse.status,
        orderId 
      })
      
      // Return cached status if Cashfree call fails
      return NextResponse.json({
        success: true,
        order_id: orderId,
        status: paymentOrder.payment_status,
        amount: paymentOrder.order_amount / 100,
        from_cache: true,
        warning: 'Could not verify with payment gateway'
      })
    }

    const cashfreeData = await cashfreeResponse.json()

    // Map Cashfree status to our status
    let status = 'pending'
    if (cashfreeData.order_status === 'PAID') {
      status = 'success'
    } else if (cashfreeData.order_status === 'EXPIRED' || cashfreeData.order_status === 'TERMINATED') {
      status = 'failed'
    } else if (cashfreeData.order_status === 'ACTIVE') {
      status = 'pending'
    }

    // Update database if status changed
    if (status !== paymentOrder.payment_status) {
      await supabase
        .from('payment_orders')
        .update({
          payment_status: status,
          cf_order_id: cashfreeData.cf_order_id,
        })
        .eq('order_id', orderId)

      // If payment successful, update service request
      if (status === 'success' && paymentOrder.request_id) {
        await supabase
          .from('service_requests')
          .update({
            payment_status: 'paid',
            paid_amount: paymentOrder.order_amount / 100,
            paid_at: new Date().toISOString(),
          })
          .eq('id', paymentOrder.request_id)
      }
    }

    logger.info('Payment verified', { orderId, status })

    return NextResponse.json({
      success: true,
      order_id: orderId,
      cf_order_id: cashfreeData.cf_order_id,
      status: status,
      order_status: cashfreeData.order_status,
      amount: cashfreeData.order_amount,
      currency: cashfreeData.order_currency,
      from_cache: false,
    })

  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error'
    logger.error('Verify payment error', { error: errorMessage })
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
