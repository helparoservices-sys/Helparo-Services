'use client'

import { useEffect, useState } from 'react'
import { getPlatformStats, getCommissionPercent } from '@/app/actions/payments'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

export default function AdminPaymentsPage() {
  const [stats, setStats] = useState<any>(null)
  const [commission, setCommission] = useState<number>(0)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    const load = async () => {
      setLoading(true)
      setError('')

      const [statsRes, commRes] = await Promise.all([
        getPlatformStats(),
        getCommissionPercent()
      ])

      if (statsRes.error) {
        setError(statsRes.error)
      } else {
        setStats(statsRes.data)
      }

      if (commRes.error) {
        setError(commRes.error)
      } else {
        setCommission(commRes.data || 12)
      }

      setLoading(false)
    }
    load()
  }, [])

  const formatAmount = (amount: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      minimumFractionDigits: 2,
    }).format(amount)
  }

  return (
    <div className="min-h-screen bg-primary-50 py-10 px-4">
      <div className="mx-auto max-w-5xl space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold">Platform Payments</h1>
        </div>

        {loading ? (
          <Card>
            <CardContent className="py-6">
              <p className="text-sm text-muted-foreground">Loading platform data...</p>
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
            {/* Commission Rate */}
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Commission Rate</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-blue-600">
                  {commission}%
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                  Platform commission on completed jobs
                </p>
              </CardContent>
            </Card>

            {/* Platform Revenue */}
            <div className="grid gap-4 md:grid-cols-3">
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Platform Earnings</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold text-green-600">
                    {formatAmount(stats?.platformWallet?.available_balance || 0)}
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">
                    Total commission earned
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Active Escrows</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold text-orange-600">
                    {stats?.fundedEscrowsCount || 0}
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">
                    Funds locked in escrow
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Completed Jobs</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold text-blue-600">
                    {stats?.releasedEscrowsCount || 0}
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">
                    Successfully released payments
                  </p>
                </CardContent>
              </Card>
            </div>

            {/* Platform Wallet Details */}
            <Card>
              <CardHeader>
                <CardTitle>Platform Wallet Details</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex items-center justify-between pb-3 border-b">
                    <div className="text-sm font-medium">Available Balance</div>
                    <div className="text-sm font-semibold text-green-600">
                      {formatAmount(stats?.platformWallet?.available_balance || 0)}
                    </div>
                  </div>
                  <div className="flex items-center justify-between pb-3 border-b">
                    <div className="text-sm font-medium">Escrow Balance</div>
                    <div className="text-sm font-semibold text-orange-600">
                      {formatAmount(stats?.platformWallet?.escrow_balance || 0)}
                    </div>
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="text-sm font-medium">Currency</div>
                    <div className="text-sm">{stats?.platformWallet?.currency || 'INR'}</div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Info Card */}
            <Card className="bg-blue-50 border-blue-200">
              <CardContent className="py-4">
                <div className="text-sm text-blue-900">
                  <strong>Payment Flow:</strong>
                  <ol className="list-decimal ml-5 mt-2 space-y-1">
                    <li>Customer funds escrow via Cashfree</li>
                    <li>Funds locked until job completion</li>
                    <li>On completion, {commission}% commission deducted</li>
                    <li>Remaining amount released to helper</li>
                    <li>Commission added to platform wallet</li>
                  </ol>
                </div>
              </CardContent>
            </Card>
          </>
        )}
      </div>
    </div>
  )
}
