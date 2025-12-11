'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { 
  CreditCard, 
  Loader2, 
  CheckCircle2, 
  XCircle, 
  AlertCircle,
  Smartphone,
  Building2,
  Wallet
} from 'lucide-react'
import { toast } from 'sonner'

// Cashfree SDK types
declare global {
  interface Window {
    Cashfree: any
  }
}

interface PaymentButtonProps {
  requestId: string
  amount: number
  description?: string
  customerName?: string
  customerEmail?: string
  customerPhone?: string
  orderNote?: string
  onSuccess?: (orderId: string) => void
  onError?: (error: string) => void
  onFailure?: (error: string) => void // alias for onError
  disabled?: boolean
  className?: string
}

type PaymentStatus = 'idle' | 'creating' | 'processing' | 'success' | 'failed'

export function PaymentButton({
  requestId,
  amount,
  description,
  customerName,
  customerEmail,
  customerPhone,
  orderNote,
  onSuccess,
  onError,
  onFailure,
  disabled = false,
  className = '',
}: PaymentButtonProps) {
  const [status, setStatus] = useState<PaymentStatus>('idle')
  const [error, setError] = useState<string>('')
  const [sdkLoaded, setSdkLoaded] = useState(false)
  const [userDetails, setUserDetails] = useState<{
    name: string
    email: string
    phone: string
  } | null>(null)

  // Load user details if not provided
  useEffect(() => {
    async function loadUserDetails() {
      if (customerName && customerEmail && customerPhone) {
        setUserDetails({
          name: customerName,
          email: customerEmail,
          phone: customerPhone,
        })
        return
      }

      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      
      if (user) {
        // Get profile for full name and phone
        const { data: profile } = await supabase
          .from('profiles')
          .select('full_name, phone')
          .eq('id', user.id)
          .single()
        
        setUserDetails({
          name: profile?.full_name || customerName || user.email?.split('@')[0] || 'Customer',
          email: customerEmail || user.email || '',
          phone: profile?.phone || customerPhone || '9999999999',
        })
      }
    }
    
    loadUserDetails()
  }, [customerName, customerEmail, customerPhone])

  // Load Cashfree SDK
  useEffect(() => {
    if (typeof window !== 'undefined' && !window.Cashfree) {
      const script = document.createElement('script')
      script.src = 'https://sdk.cashfree.com/js/v3/cashfree.js'
      script.async = true
      script.onload = () => {
        setSdkLoaded(true)
      }
      script.onerror = () => {
        console.error('Failed to load Cashfree SDK')
        setError('Payment service unavailable')
      }
      document.body.appendChild(script)
    } else if (window.Cashfree) {
      setSdkLoaded(true)
    }
  }, [])

  const initiatePayment = async () => {
    if (!sdkLoaded) {
      toast.error('Payment service is loading. Please try again.')
      return
    }

    if (!userDetails) {
      toast.error('Loading user details. Please try again.')
      return
    }

    setStatus('creating')
    setError('')

    // Combined error handler
    const handleError = (errorMsg: string) => {
      onError?.(errorMsg)
      onFailure?.(errorMsg)
    }

    try {
      // Check if user is authenticated
      const supabase = createClient()
      const { data: { session }, error: sessionError } = await supabase.auth.getSession()
      
      if (sessionError || !session) {
        toast.error('Session expired. Please login again.')
        setStatus('failed')
        setError('Session expired')
        handleError('Session expired - please login again')
        setTimeout(() => {
          window.location.href = '/auth/login?redirect=' + encodeURIComponent(window.location.pathname)
        }, 2000)
        return
      }

      // 1. Create order on backend
      const response = await fetch('/api/payments/create-order', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          request_id: requestId,
          amount: amount,
          customer_name: userDetails.name,
          customer_email: userDetails.email,
          customer_phone: userDetails.phone,
          order_note: orderNote || description,
        }),
      })

      const orderData = await response.json()

      if (!response.ok) {
        // Handle auth errors specifically
        if (response.status === 401) {
          toast.error('Session expired. Redirecting to login...')
          setTimeout(() => {
            window.location.href = '/auth/login?redirect=' + encodeURIComponent(window.location.pathname)
          }, 1500)
          throw new Error('Session expired - please login again')
        }
        throw new Error(orderData.error || 'Failed to create payment order')
      }

      // 2. Initialize Cashfree checkout
      setStatus('processing')

      const cashfree = window.Cashfree({
        mode: orderData.environment === 'TEST' ? 'sandbox' : 'production',
      })

      const checkoutOptions = {
        paymentSessionId: orderData.payment_session_id,
        redirectTarget: '_modal',
      }

      // 3. Open payment modal
      const result = await cashfree.checkout(checkoutOptions)

      if (result.error) {
        setStatus('failed')
        setError(result.error.message || 'Payment failed')
        handleError(result.error.message)
        return
      }

      if (result.redirect) {
        // Payment is being processed (redirect happened)
        // The webhook will update the status
        toast.info('Processing payment...')
      }

      if (result.paymentDetails) {
        // Payment completed in modal
        const paymentStatus = result.paymentDetails.paymentMessage

        if (result.paymentDetails.paymentStatus === 'SUCCESS') {
          setStatus('success')
          toast.success('Payment successful!')
          onSuccess?.(orderData.order_id)
        } else {
          setStatus('failed')
          setError(paymentStatus || 'Payment failed')
          handleError(paymentStatus)
        }
      }

      // 4. Verify payment status
      setTimeout(async () => {
        try {
          const verifyResponse = await fetch(`/api/payments/verify?order_id=${orderData.order_id}`, {
            credentials: 'include',
          })
          const verifyData = await verifyResponse.json()

          if (verifyData.status === 'success') {
            setStatus('success')
            toast.success('Payment verified!')
            onSuccess?.(orderData.order_id)
          } else if (verifyData.status === 'failed') {
            setStatus('failed')
            setError('Payment failed')
            handleError('Payment failed')
          }
        } catch (e) {
          console.error('Verify error:', e)
        }
      }, 2000)

    } catch (err: any) {
      console.error('Payment error:', err)
      setStatus('failed')
      setError(err.message || 'Payment failed')
      toast.error(err.message || 'Payment failed')
      handleError(err.message)
    }
  }

  const getButtonContent = () => {
    switch (status) {
      case 'creating':
        return (
          <>
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            Creating Order...
          </>
        )
      case 'processing':
        return (
          <>
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            Processing Payment...
          </>
        )
      case 'success':
        return (
          <>
            <CheckCircle2 className="mr-2 h-4 w-4" />
            Payment Successful
          </>
        )
      case 'failed':
        return (
          <>
            <XCircle className="mr-2 h-4 w-4" />
            Payment Failed
          </>
        )
      default:
        return (
          <>
            <CreditCard className="mr-2 h-4 w-4" />
            Pay ₹{amount.toLocaleString('en-IN')}
          </>
        )
    }
  }

  const getButtonVariant = () => {
    switch (status) {
      case 'success':
        return 'default' // Green handled by className
      case 'failed':
        return 'destructive'
      default:
        return 'default'
    }
  }

  return (
    <div className={className}>
      <Button
        onClick={initiatePayment}
        disabled={disabled || status === 'creating' || status === 'processing' || status === 'success' || !sdkLoaded || !userDetails}
        variant={getButtonVariant()}
        className={`w-full h-12 text-base font-semibold ${
          status === 'success' ? 'bg-green-600 hover:bg-green-700' : ''
        }`}
      >
        {!userDetails ? (
          <>
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            Loading...
          </>
        ) : getButtonContent()}
      </Button>

      {error && status === 'failed' && (
        <div className="mt-2 p-3 bg-red-50 border border-red-200 rounded-lg flex items-start gap-2">
          <AlertCircle className="h-4 w-4 text-red-500 flex-shrink-0 mt-0.5" />
          <div className="text-sm text-red-700">
            <p className="font-medium">Payment Failed</p>
            <p className="text-red-600">{error}</p>
            <button 
              onClick={() => { setStatus('idle'); setError(''); }}
              className="mt-1 text-red-700 underline hover:no-underline"
            >
              Try again
            </button>
          </div>
        </div>
      )}

      {!sdkLoaded && (
        <p className="mt-2 text-xs text-gray-500 flex items-center gap-1">
          <Loader2 className="h-3 w-3 animate-spin" />
          Loading payment service...
        </p>
      )}
    </div>
  )
}

/**
 * Payment card with full payment details
 */
interface PaymentCardProps {
  requestId: string
  requestTitle: string
  amount: number
  customerName: string
  customerEmail: string
  customerPhone: string
  helperName?: string
  onSuccess?: (orderId: string) => void
  onCancel?: () => void
}

export function PaymentCard({
  requestId,
  requestTitle,
  amount,
  customerName,
  customerEmail,
  customerPhone,
  helperName,
  onSuccess,
  onCancel,
}: PaymentCardProps) {
  const platformFee = Math.round(amount * 0.02) // 2% platform fee display (actual 12% for helper)
  const totalAmount = amount

  return (
    <Card className="max-w-md mx-auto border-2 border-emerald-100">
      <CardHeader className="bg-gradient-to-r from-emerald-500 to-teal-500 text-white rounded-t-lg">
        <CardTitle className="flex items-center gap-2">
          <CreditCard className="h-5 w-5" />
          Complete Payment
        </CardTitle>
        <CardDescription className="text-emerald-100">
          Secure payment powered by Cashfree
        </CardDescription>
      </CardHeader>

      <CardContent className="p-6 space-y-4">
        {/* Order Summary */}
        <div className="bg-gray-50 rounded-lg p-4 space-y-2">
          <h3 className="font-semibold text-gray-900">Order Summary</h3>
          <p className="text-sm text-gray-600 truncate">{requestTitle}</p>
          {helperName && (
            <p className="text-sm text-gray-500">Helper: {helperName}</p>
          )}
        </div>

        {/* Price Breakdown */}
        <div className="space-y-2 py-3 border-y">
          <div className="flex justify-between text-sm">
            <span className="text-gray-600">Service Amount</span>
            <span className="font-medium">₹{amount.toLocaleString('en-IN')}</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-gray-600">Platform Fee</span>
            <span className="text-green-600">Included</span>
          </div>
          <div className="flex justify-between text-base font-bold pt-2 border-t">
            <span>Total</span>
            <span className="text-emerald-600">₹{totalAmount.toLocaleString('en-IN')}</span>
          </div>
        </div>

        {/* Payment Methods */}
        <div className="space-y-2">
          <p className="text-xs text-gray-500 font-medium">ACCEPTED PAYMENT METHODS</p>
          <div className="flex gap-3">
            <Badge variant="outline" className="flex items-center gap-1">
              <Smartphone className="h-3 w-3" />
              UPI
            </Badge>
            <Badge variant="outline" className="flex items-center gap-1">
              <CreditCard className="h-3 w-3" />
              Cards
            </Badge>
            <Badge variant="outline" className="flex items-center gap-1">
              <Building2 className="h-3 w-3" />
              NetBanking
            </Badge>
            <Badge variant="outline" className="flex items-center gap-1">
              <Wallet className="h-3 w-3" />
              Wallet
            </Badge>
          </div>
        </div>

        {/* Pay Button */}
        <PaymentButton
          requestId={requestId}
          amount={totalAmount}
          customerName={customerName}
          customerEmail={customerEmail}
          customerPhone={customerPhone}
          orderNote={`Payment for: ${requestTitle}`}
          onSuccess={onSuccess}
          className="pt-2"
        />

        {/* Cancel */}
        {onCancel && (
          <button
            onClick={onCancel}
            className="w-full text-center text-sm text-gray-500 hover:text-gray-700"
          >
            Cancel
          </button>
        )}

        {/* Security Note */}
        <p className="text-xs text-center text-gray-400 pt-2">
          🔒 Secured by Cashfree Payment Gateway
        </p>
      </CardContent>
    </Card>
  )
}

export default PaymentButton
