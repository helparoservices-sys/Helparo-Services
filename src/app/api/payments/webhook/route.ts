import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { logger } from '@/lib/logger'
import crypto from 'crypto'

// Use service role for webhook (no user context)
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

const CASHFREE_SECRET_KEY = process.env.CASHFREE_SECRET_KEY!

/**
 * Verify Cashfree webhook signature
 */
function verifyWebhookSignature(
  rawBody: string,
  timestamp: string,
  signature: string
): boolean {
  try {
    // Cashfree signature format: timestamp + rawBody
    const signatureData = timestamp + rawBody
    const expectedSignature = crypto
      .createHmac('sha256', CASHFREE_SECRET_KEY)
      .update(signatureData)
      .digest('base64')
    
    return signature === expectedSignature
  } catch (error) {
    logger.error('Signature verification error', { error })
    return false
  }
}

/**
 * Handle Cashfree payment webhooks
 * POST /api/payments/webhook
 */
export async function POST(request: NextRequest) {
  try {
    // Get raw body for signature verification
    const rawBody = await request.text()
    
    // Get Cashfree headers
    const timestamp = request.headers.get('x-webhook-timestamp') || ''
    const signature = request.headers.get('x-webhook-signature') || ''

    logger.info('Webhook received', { 
      hasTimestamp: !!timestamp, 
      hasSignature: !!signature,
      bodyLength: rawBody.length
    })

    // Verify signature (skip in development if no signature)
    const isSignatureValid = verifyWebhookSignature(rawBody, timestamp, signature)
    
    if (!isSignatureValid && process.env.NODE_ENV === 'production') {
      logger.error('Invalid webhook signature', { timestamp, signature })
      return NextResponse.json(
        { error: 'Invalid signature' },
        { status: 401 }
      )
    }

    // Parse webhook data
    const webhookData = JSON.parse(rawBody)
    const { type, data } = webhookData

    logger.info('Webhook parsed', { 
      type,
      orderId: data?.order?.order_id,
      paymentStatus: data?.payment?.payment_status
    })

    // Initialize Supabase with service role
    const supabase = createClient(supabaseUrl, supabaseServiceKey)

    // Log webhook to database
    await supabase.from('payment_webhooks').insert({
      order_id: data?.order?.order_id,
      event_type: type,
      event_time: new Date().toISOString(),
      webhook_data: webhookData,
      signature: signature,
      signature_verified: isSignatureValid,
      processed: false,
    })

    // Handle different webhook events
    switch (type) {
      case 'PAYMENT_SUCCESS_WEBHOOK':
        await handlePaymentSuccess(supabase, data)
        break
      
      case 'PAYMENT_FAILED_WEBHOOK':
        await handlePaymentFailed(supabase, data)
        break
      
      case 'PAYMENT_USER_DROPPED_WEBHOOK':
        await handlePaymentDropped(supabase, data)
        break

      case 'REFUND_STATUS_WEBHOOK':
        await handleRefundStatus(supabase, data)
        break

      default:
        logger.info('Unhandled webhook type', { type })
    }

    // Mark webhook as processed
    if (data?.order?.order_id) {
      await supabase
        .from('payment_webhooks')
        .update({ 
          processed: true, 
          processed_at: new Date().toISOString() 
        })
        .eq('order_id', data.order.order_id)
        .eq('event_type', type)
    }

    return NextResponse.json({ success: true })

  } catch (error: any) {
    logger.error('Webhook processing error', { error: error.message })
    return NextResponse.json(
      { error: 'Webhook processing failed' },
      { status: 500 }
    )
  }
}

/**
 * Handle successful payment
 */
async function handlePaymentSuccess(supabase: any, data: any) {
  const order = data.order
  const payment = data.payment

  logger.info('Processing payment success', {
    orderId: order.order_id,
    cfOrderId: order.order_id,
    paymentId: payment.cf_payment_id,
    amount: order.order_amount
  })

  // Update payment order status
  const { error: updateError } = await supabase
    .from('payment_orders')
    .update({
      cf_order_id: order.cf_order_id,
      cf_payment_id: payment.cf_payment_id,
      payment_status: 'success',
      payment_method: payment.payment_group?.toLowerCase() || 'upi',
      payment_time: payment.payment_time || new Date().toISOString(),
      bank_reference: payment.bank_reference,
      payment_message: payment.payment_message,
    })
    .eq('order_id', order.order_id)

  if (updateError) {
    logger.error('Failed to update payment order', { error: updateError })
    throw updateError
  }

  // Get the request_id from payment order
  const { data: paymentOrder } = await supabase
    .from('payment_orders')
    .select('request_id, customer_id, order_amount')
    .eq('order_id', order.order_id)
    .single()

  if (paymentOrder?.request_id) {
    // Update service request payment status
    await supabase
      .from('service_requests')
      .update({
        payment_status: 'paid',
        paid_amount: paymentOrder.order_amount / 100, // Convert paise to rupees
        paid_at: new Date().toISOString(),
      })
      .eq('id', paymentOrder.request_id)

    // Create notification for customer
    await supabase.from('notifications').insert({
      user_id: paymentOrder.customer_id,
      type: 'payment_received',
      title: 'Payment Successful',
      message: `Your payment of ₹${order.order_amount} has been received.`,
      data: { order_id: order.order_id, request_id: paymentOrder.request_id },
    })

    logger.info('Payment processed successfully', {
      orderId: order.order_id,
      requestId: paymentOrder.request_id
    })
  }
}

/**
 * Handle failed payment
 */
async function handlePaymentFailed(supabase: any, data: any) {
  const order = data.order
  const payment = data.payment

  logger.info('Processing payment failure', {
    orderId: order.order_id,
    errorCode: payment?.error_details?.error_code
  })

  await supabase
    .from('payment_orders')
    .update({
      payment_status: 'failed',
      failure_reason: payment?.error_details?.error_reason || 'Payment failed',
      error_code: payment?.error_details?.error_code,
      payment_message: payment?.error_details?.error_description,
    })
    .eq('order_id', order.order_id)
}

/**
 * Handle user dropped (abandoned payment)
 */
async function handlePaymentDropped(supabase: any, data: any) {
  const order = data.order

  logger.info('Processing payment dropped', { orderId: order.order_id })

  await supabase
    .from('payment_orders')
    .update({
      payment_status: 'cancelled',
      failure_reason: 'User abandoned payment',
    })
    .eq('order_id', order.order_id)
}

/**
 * Handle refund status update
 */
async function handleRefundStatus(supabase: any, data: any) {
  const refund = data.refund

  logger.info('Processing refund status', {
    refundId: refund.refund_id,
    status: refund.refund_status
  })

  await supabase
    .from('refund_requests')
    .update({
      cf_refund_id: refund.cf_refund_id,
      refund_status: refund.refund_status === 'SUCCESS' ? 'refunded' : refund.refund_status.toLowerCase(),
      refund_arn: refund.refund_arn,
      refund_processed_at: refund.processed_at,
    })
    .eq('refund_id', refund.refund_id)
}

// Allow GET for webhook health check
export async function GET() {
  return NextResponse.json({ 
    status: 'ok', 
    message: 'Cashfree webhook endpoint active',
    timestamp: new Date().toISOString()
  })
}
