'use client'

import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { PaymentButton } from '@/components/payment-button'
import { 
  ArrowLeft, 
  IndianRupee, 
  CheckCircle,
  Shield,
  CreditCard,
  Smartphone,
  Building2,
  Loader2
} from 'lucide-react'
import { toast } from 'sonner'

interface JobDetails {
  id: string
  title: string
  description: string
  estimated_price: number
  payment_method: string
  status: string
  work_completed_at: string | null
  assigned_helper?: {
    id: string
    profile?: {
      full_name: string
      avatar_url: string | null
    }
  } | null
}

export default function PaymentPage() {
  const params = useParams()
  const router = useRouter()
  const requestId = params.id as string
  
  const [job, setJob] = useState<JobDetails | null>(null)
  const [loading, setLoading] = useState(true)
  const [userDetails, setUserDetails] = useState<{
    name: string
    email: string
    phone: string
  } | null>(null)

  useEffect(() => {
    loadJobAndUserDetails()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [requestId])

  async function loadJobAndUserDetails() {
    try {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      
      if (!user) {
        router.push('/auth/login')
        return
      }

      // Load job details
      const response = await fetch(`/api/requests/${requestId}`)
      if (!response.ok) {
        throw new Error('Failed to load job')
      }
      const data = await response.json()
      setJob(data)

      // Load user profile
      const { data: profile } = await supabase
        .from('profiles')
        .select('full_name, email, phone')
        .eq('id', user.id)
        .single()

      setUserDetails({
        name: profile?.full_name || 'Customer',
        email: profile?.email || user.email || '',
        phone: profile?.phone || '',
      })
    } catch (error) {
      console.error('Error loading:', error)
      toast.error('Failed to load payment details')
    } finally {
      setLoading(false)
    }
  }

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const handlePaymentSuccess = (_orderId: string) => {
    toast.success('Payment successful!')
    // Redirect to rate the helper
    router.push(`/customer/requests/${requestId}/rate?payment=success`)
  }

  const handlePaymentError = (error: string) => {
    toast.error(error || 'Payment failed')
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-emerald-600" />
      </div>
    )
  }

  if (!job) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <Card className="max-w-md w-full">
          <CardContent className="p-6 text-center">
            <p className="text-gray-600 mb-4">Job not found</p>
            <Link href="/customer/requests">
              <Button>Back to Requests</Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="sticky top-0 z-50 bg-white border-b border-gray-200 shadow-sm pt-safe">
        <div className="max-w-lg mx-auto px-4 py-3 flex items-center gap-3">
          <button 
            onClick={() => router.back()}
            className="p-2 hover:bg-gray-100 rounded-full transition-colors"
          >
            <ArrowLeft className="w-5 h-5 text-gray-700" />
          </button>
          <h1 className="text-lg font-semibold text-gray-900">Complete Payment</h1>
        </div>
      </div>

      <div className="max-w-lg mx-auto px-4 py-6 space-y-4">
        {/* Job Summary */}
        <Card className="bg-white shadow-sm">
          <CardContent className="p-5">
            <div className="flex items-start justify-between mb-4">
              <div>
                <h2 className="font-semibold text-gray-900">{job.title}</h2>
                <p className="text-sm text-gray-500 mt-1">Service completed</p>
              </div>
              <CheckCircle className="w-6 h-6 text-emerald-500" />
            </div>

            {job.assigned_helper?.profile && (
              <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-xl mb-4">
                <div className="w-10 h-10 bg-emerald-100 rounded-full flex items-center justify-center">
                  <span className="text-emerald-600 font-semibold">
                    {job.assigned_helper.profile.full_name?.charAt(0) || 'H'}
                  </span>
                </div>
                <div>
                  <p className="font-medium text-gray-800">
                    {job.assigned_helper.profile.full_name}
                  </p>
                  <p className="text-xs text-gray-500">Service Provider</p>
                </div>
              </div>
            )}

            {/* Amount */}
            <div className="text-center py-4 border-t border-gray-100">
              <p className="text-sm text-gray-500 mb-1">Total Amount</p>
              <div className="flex items-center justify-center gap-1 text-3xl font-bold text-gray-900">
                <IndianRupee className="w-7 h-7" />
                <span>{job.estimated_price}</span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Payment Methods Info */}
        <Card className="bg-white shadow-sm">
          <CardContent className="p-5">
            <h3 className="font-semibold text-gray-900 mb-4">Secure Payment Options</h3>
            <div className="space-y-3">
              <div className="flex items-center gap-3 text-sm text-gray-600">
                <Smartphone className="w-5 h-5 text-blue-500" />
                <span>UPI - GPay, PhonePe, Paytm</span>
              </div>
              <div className="flex items-center gap-3 text-sm text-gray-600">
                <CreditCard className="w-5 h-5 text-purple-500" />
                <span>Credit & Debit Cards</span>
              </div>
              <div className="flex items-center gap-3 text-sm text-gray-600">
                <Building2 className="w-5 h-5 text-green-500" />
                <span>Net Banking</span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Pay Button */}
        {userDetails && (
          <PaymentButton
            requestId={requestId}
            amount={job.estimated_price}
            description={job.title}
            customerName={userDetails.name}
            customerEmail={userDetails.email}
            customerPhone={userDetails.phone}
            orderNote={`Payment for: ${job.title}`}
            onSuccess={handlePaymentSuccess}
            onError={handlePaymentError}
            className="w-full h-14 text-lg font-semibold"
          />
        )}

        {/* Security Badge */}
        <div className="flex items-center justify-center gap-2 text-gray-500 text-sm">
          <Shield className="w-4 h-4" />
          <span>Secured by Cashfree</span>
        </div>

        {/* Skip Payment */}
        <button
          onClick={() => router.push(`/customer/requests/${requestId}/rate`)}
          className="w-full text-center text-gray-500 hover:text-gray-700 text-sm py-2"
        >
          Skip and pay later
        </button>
      </div>
    </div>
  )
}
