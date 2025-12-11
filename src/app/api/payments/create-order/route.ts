import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { logger } from '@/lib/logger'
import crypto from 'crypto'

// Cashfree API configuration - support both old and new variable names
const CASHFREE_APP_ID = process.env.CASHFREE_APP_ID || process.env.NEXT_PUBLIC_PAYMENT_API_KEY!
const CASHFREE_SECRET_KEY = process.env.CASHFREE_SECRET_KEY || process.env.PAYMENT_SECRET_KEY!
const CASHFREE_ENV = process.env.CASHFREE_ENVIRONMENT || 'PRODUCTION' // TEST or PRODUCTION

const CASHFREE_API_URL = CASHFREE_ENV === 'PRODUCTION' 
  ? 'https://sandbox.cashfree.com/pg'
  : 'https://api.cashfree.com/pg'

interface CreateOrderRequest {
  request_id: string
  amount: number // In rupees
  customer_name: string
  customer_email: string
  customer_phone: string
  order_note?: string
}

// Create Supabase client for route handlers
async function createRouteClient() {
  const cookieStore = await cookies()
  
  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll()
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            )
          } catch {
            // Ignore errors in route handlers
          }
        },
      },
    }
  )
}

/**
 * Create a Cashfree payment order
 * POST /api/payments/create-order
 */
export async function POST(request: NextRequest) {
  try {
    // Verify authentication using route-specific client
    const supabase = await createRouteClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    
    if (authError || !user) {
      logger.error('Payment auth failed', { authError: authError?.message })
      return NextResponse.json(
        { error: 'Unauthorized - Please login again', details: authError?.message },
        { status: 401 }
      )
    }

    // Check if Cashfree credentials are configured
    if (!CASHFREE_APP_ID || !CASHFREE_SECRET_KEY) {
      logger.error('Cashfree credentials missing')
      return NextResponse.json(
        { error: 'Payment service not configured' },
        { status: 500 }
      )
    }

    // Parse request body
    const body: CreateOrderRequest = await request.json()
    const { request_id, amount, customer_name, customer_email, customer_phone, order_note } = body

    // Validate required fields
    if (!request_id || !amount || !customer_phone) {
      return NextResponse.json(
        { error: 'Missing required fields: request_id, amount, customer_phone' },
        { status: 400 }
      )
    }

    // Validate amount (minimum ₹1)
    if (amount < 1) {
      return NextResponse.json(
        { error: 'Minimum amount is ₹1' },
        { status: 400 }
      )
    }

    // Verify the service request belongs to this user
    const { data: serviceRequest, error: reqError } = await supabase
      .from('service_requests')
      .select('id, customer_id, title, status')
      .eq('id', request_id)
      .single()

    if (reqError || !serviceRequest) {
      return NextResponse.json(
        { error: 'Service request not found' },
        { status: 404 }
      )
    }

    if (serviceRequest.customer_id !== user.id) {
      return NextResponse.json(
        { error: 'You can only pay for your own requests' },
        { status: 403 }
      )
    }

    // Generate unique order ID
    const orderId = `HLP_${Date.now()}_${crypto.randomBytes(4).toString('hex')}`

    // Create Cashfree order
    const cashfreeOrderData = {
      order_id: orderId,
      order_amount: amount,
      order_currency: 'INR',
      customer_details: {
        customer_id: user.id.replace(/-/g, '').substring(0, 20), // Cashfree max 20 chars
        customer_name: customer_name || 'Customer',
        customer_email: customer_email || user.email || 'customer@helparo.in',
        customer_phone: customer_phone.replace(/\D/g, '').slice(-10), // Last 10 digits
      },
      order_meta: {
        return_url: `${process.env.NEXT_PUBLIC_APP_URL || 'https://helparo.in'}/customer/bookings?payment=success&order_id=${orderId}`,
        notify_url: `${process.env.NEXT_PUBLIC_APP_URL || 'https://helparo.in'}/api/payments/webhook`,
        payment_methods: null, // Allow all methods
      },
      order_note: order_note || `Payment for: ${serviceRequest.title || 'Service Request'}`,
    }

    logger.info('Creating Cashfree order', { 
      orderId, 
      amount, 
      requestId: request_id,
      userId: user.id,
      env: CASHFREE_ENV
    })

    // Call Cashfree Create Order API
    const cashfreeResponse = await fetch(`${CASHFREE_API_URL}/orders`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-version': '2023-08-01',
        'x-client-id': CASHFREE_APP_ID,
        'x-client-secret': CASHFREE_SECRET_KEY,
      },
      body: JSON.stringify(cashfreeOrderData),
    })

    const cashfreeResult = await cashfreeResponse.json()

    if (!cashfreeResponse.ok) {
      logger.error('Cashfree order creation failed', { 
        error: cashfreeResult,
        orderId,
        status: cashfreeResponse.status
      })
      return NextResponse.json(
        { error: cashfreeResult.message || 'Failed to create payment order' },
        { status: cashfreeResponse.status }
      )
    }

    // Store order in database
    const { error: dbError } = await supabase
      .from('payment_orders')
      .insert({
        order_id: orderId,
        cf_order_id: cashfreeResult.cf_order_id,
        request_id: request_id,
        customer_id: user.id,
        order_amount: Math.round(amount * 100), // Store in paise
        order_currency: 'INR',
        payment_status: 'pending',
        customer_name: customer_name,
        customer_email: customer_email || user.email,
        customer_phone: customer_phone,
        order_note: order_note,
        return_url: cashfreeOrderData.order_meta.return_url,
        notify_url: cashfreeOrderData.order_meta.notify_url,
      })

    if (dbError) {
      logger.error('Failed to store payment order in database', { 
        error: dbError, 
        orderId 
      })
      // Don't fail the request - the Cashfree order is already created
    }

    logger.info('Cashfree order created successfully', { 
      orderId,
      cfOrderId: cashfreeResult.cf_order_id,
      paymentSessionId: cashfreeResult.payment_session_id
    })

    // Return order details for frontend
    return NextResponse.json({
      success: true,
      order_id: orderId,
      cf_order_id: cashfreeResult.cf_order_id,
      payment_session_id: cashfreeResult.payment_session_id,
      order_amount: amount,
      order_currency: 'INR',
      // For Cashfree JS SDK
      environment: CASHFREE_ENV,
    })

  } catch (error: any) {
    logger.error('Create order error', { error: error.message })
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
