import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { logger } from '@/lib/logger'
import crypto from 'crypto'

// Cashfree API configuration
const CASHFREE_APP_ID = process.env.CASHFREE_APP_ID!
const CASHFREE_SECRET_KEY = process.env.CASHFREE_SECRET_KEY!
const CASHFREE_ENV = process.env.CASHFREE_ENVIRONMENT || 'PRODUCTION'

const CASHFREE_API_URL = CASHFREE_ENV === 'PRODUCTION' 
  ? 'https://api.cashfree.com/pg'
  : 'https://sandbox.cashfree.com/pg'

interface CreateOrderRequest {
  request_id: string
  amount: number
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
            cookiesToSet.forEach(({ name, value, options }) => {
              cookieStore.set(name, value, options)
            })
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
    // Verify authentication
    const supabase = await createRouteClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    
    if (authError || !user) {
      logger.warn('Payment auth failed', { error: authError?.message })
      return NextResponse.json(
        { error: 'Unauthorized - Please login again' },
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

    // Parse and validate request body
    const body: CreateOrderRequest = await request.json()
    const { request_id, amount, customer_name, customer_email, customer_phone, order_note } = body

    if (!request_id || !amount || !customer_phone) {
      return NextResponse.json(
        { error: 'Missing required fields: request_id, amount, customer_phone' },
        { status: 400 }
      )
    }

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

    // Get base URL - Cashfree requires HTTPS in production
    const baseUrl = CASHFREE_ENV === 'PRODUCTION'
      ? (process.env.NEXT_PUBLIC_APP_URL || 'https://helparo.in').replace(/^http:/, 'https:')
      : (process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000')

    // Create Cashfree order payload
    const cashfreeOrderData = {
      order_id: orderId,
      order_amount: amount,
      order_currency: 'INR',
      customer_details: {
        customer_id: user.id.replace(/-/g, '').substring(0, 20),
        customer_name: customer_name || 'Customer',
        customer_email: customer_email || user.email || 'customer@helparo.in',
        customer_phone: customer_phone.replace(/\D/g, '').slice(-10),
      },
      order_meta: {
        return_url: `${baseUrl}/customer/bookings?payment=success&order_id=${orderId}`,
        notify_url: `${baseUrl}/api/payments/webhook`,
        payment_methods: null,
      },
      order_note: order_note || `Payment for: ${serviceRequest.title || 'Service Request'}`,
    }

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
        error: cashfreeResult.message,
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
        order_amount: Math.round(amount * 100),
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
      logger.error('Failed to store payment order', { error: dbError.message, orderId })
    }

    logger.info('Payment order created', { orderId, amount, userId: user.id })

    return NextResponse.json({
      success: true,
      order_id: orderId,
      cf_order_id: cashfreeResult.cf_order_id,
      payment_session_id: cashfreeResult.payment_session_id,
      order_amount: amount,
      order_currency: 'INR',
      environment: CASHFREE_ENV,
    })

  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error'
    logger.error('Create order error', { error: errorMessage })
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
