'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { getWalletBalance, getTransactionHistory, fundEscrow } from '@/app/actions/payments'
import { supabase } from '@/lib/supabase/client'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'

interface ServiceRequest {
  id: string
  title: string
  status: string
  budget_max: number | null
}

export default function CustomerWalletPage() {
  const router = useRouter()
  const [wallet, setWallet] = useState<any>(null)
  const [requests, setRequests] = useState<ServiceRequest[]>([])
  const [escrows, setEscrows] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [fundingRequest, setFundingRequest] = useState<string | null>(null)
  const [fundAmount, setFundAmount] = useState('')

  useEffect(() => {
    const load = async () => {
      setLoading(true)
      setError('')

      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        setError('Not authenticated')
        setLoading(false)
        return
      }

      // Load wallet
      const walletRes = await getWalletBalance()
      if ('error' in walletRes && walletRes.error) {
        setError(walletRes.error)
      } else if ('data' in walletRes) {
        setWallet(walletRes.data)
      }

      // Load open/assigned requests
      const { data: reqs } = await supabase
        .from('service_requests')
        .select('id, title, status, budget_max')
        .eq('customer_id', user.id)
        .in('status', ['open', 'assigned'])
        .order('created_at', { ascending: false })

      setRequests((reqs || []) as ServiceRequest[])

      // Load escrows
      const { data: esc } = await supabase
        .from('escrows')
        .select('*')
        .eq('customer_id', user.id)
        .order('created_at', { ascending: false })

      setEscrows(esc || [])

      setLoading(false)
    }
    load()
  }, [])

  const handleFundEscrow = async (requestId: string) => {
    const amount = parseFloat(fundAmount)
    if (isNaN(amount) || amount <= 0) {
      setError('Please enter a valid amount')
      return
    }

    setError('')
    setLoading(true)

    // In production: integrate with Cashfree payment gateway here
    // For now, simulate successful payment
    const formData = new FormData()
    formData.append('service_request_id', requestId)
    formData.append('amount', amount.toString())
    formData.append('cashfree_order_id', `CF_ORDER_${Date.now()}`)
    formData.append('cashfree_payment_id', `CF_PAY_${Date.now()}`)
    
    const result = await fundEscrow(formData)

    if ('error' in result && result.error) {
      setError(result.error)
    } else {
      setFundingRequest(null)
      setFundAmount('')
      // Reload data
      router.refresh()
      window.location.reload()
    }

    setLoading(false)
  }

  const formatAmount = (amount: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      minimumFractionDigits: 2,
    }).format(amount)
  }

  return (
    <div className="min-h-screen bg-primary-50 py-10 px-4">
      <div className="mx-auto max-w-4xl space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold">My Wallet</h1>
        </div>

        {loading && !wallet ? (
          <Card>
            <CardContent className="py-6">
              <p className="text-sm text-muted-foreground">Loading wallet...</p>
            </CardContent>
          </Card>
        ) : error ? (
          <Card>
            <CardContent className="py-6">
              <p className="text-sm text-red-500">{error}</p>
            </CardContent>
          </Card>
        ) : (
          <>
            {/* Balance Cards */}
            <div className="grid gap-4 md:grid-cols-2">
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Available Balance</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold text-green-600">
                    {formatAmount(wallet?.available_balance || 0)}
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">
                    Funds available for use
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="text-base">In Escrow</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold text-orange-600">
                    {formatAmount(wallet?.escrow_balance || 0)}
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">
                    Locked funds for ongoing work
                  </p>
                </CardContent>
              </Card>
            </div>

            {/* Requests Needing Funding */}
            <Card>
              <CardHeader>
                <CardTitle>Fund Your Requests</CardTitle>
              </CardHeader>
              <CardContent>
                {requests.length === 0 ? (
                  <p className="text-sm text-muted-foreground">
                    No requests needing funding.
                  </p>
                ) : (
                  <div className="space-y-3">
                    {requests.map((req) => {
                      const hasEscrow = escrows.some(e => e.request_id === req.id)
                      return (
                        <div
                          key={req.id}
                          className="flex items-center justify-between border rounded-lg p-4 bg-white"
                        >
                          <div className="flex-1">
                            <div className="text-sm font-medium">{req.title}</div>
                            <div className="text-xs text-muted-foreground">
                              Status: {req.status}
                              {req.budget_max && ` • Budget: ${formatAmount(req.budget_max)}`}
                            </div>
                          </div>
                          <div>
                            {hasEscrow ? (
                              <span className="text-xs text-green-600 font-medium">✓ Funded</span>
                            ) : fundingRequest === req.id ? (
                              <div className="flex items-center gap-2">
                                <Input
                                  type="number"
                                  placeholder="Amount"
                                  value={fundAmount}
                                  onChange={(e) => setFundAmount(e.target.value)}
                                  className="w-32"
                                  disabled={loading}
                                />
                                <Button
                                  size="sm"
                                  onClick={() => handleFundEscrow(req.id)}
                                  disabled={loading}
                                >
                                  Confirm
                                </Button>
                                <Button
                                  size="sm"
                                  variant="ghost"
                                  onClick={() => setFundingRequest(null)}
                                  disabled={loading}
                                >
                                  Cancel
                                </Button>
                              </div>
                            ) : (
                              <Button
                                size="sm"
                                onClick={() => {
                                  setFundingRequest(req.id)
                                  setFundAmount(req.budget_max?.toString() || '')
                                }}
                              >
                                Fund Escrow
                              </Button>
                            )}
                          </div>
                        </div>
                      )
                    })}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Active Escrows */}
            <Card>
              <CardHeader>
                <CardTitle>Active Escrows</CardTitle>
              </CardHeader>
              <CardContent>
                {escrows.length === 0 ? (
                  <p className="text-sm text-muted-foreground">No active escrows.</p>
                ) : (
                  <div className="space-y-3">
                    {escrows.map((esc) => (
                      <div
                        key={esc.id}
                        className="flex items-center justify-between border-b pb-3 last:border-0"
                      >
                        <div className="flex-1">
                          <div className="text-sm font-medium">Request: {esc.request_id.slice(0, 8)}...</div>
                          <div className="text-xs text-muted-foreground">
                            {new Date(esc.funded_at).toLocaleString('en-IN')} • Status: {esc.status}
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="text-sm font-semibold text-orange-600">
                            {formatAmount(esc.amount)}
                          </div>
                          {esc.status === 'released' && (
                            <div className="text-xs text-green-600">Released</div>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </>
        )}
      </div>
    </div>
  )
}
