'use client'

import { useEffect, useState } from 'react'
import { getWalletBalance, getTransactionHistory } from '@/app/actions/payments'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

interface Transaction {
  id: string
  balance_type: 'available' | 'escrow'
  delta: number
  balance_after: number
  created_at: string
  transaction: {
    id: string
    type: 'fund_escrow' | 'release_helper' | 'commission_fee' | 'refund' | 'adjustment'
    amount: number
    currency: string
    created_at: string
  }
}

export default function HelperWalletPage() {
  const [wallet, setWallet] = useState<any>(null)
  const [transactions, setTransactions] = useState<Transaction[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    const load = async () => {
      setLoading(true)
      setError('')

      const [walletRes, txRes] = await Promise.all([
        getWalletBalance(),
        getTransactionHistory(20)
      ])

      if ('error' in walletRes && walletRes.error) {
        setError(walletRes.error)
      } else if ('data' in walletRes) {
        setWallet(walletRes.data)
      }

      if ('error' in txRes && txRes.error) {
        setError(txRes.error)
      } else if ('data' in txRes) {
        setTransactions(txRes.data as any || [])
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

  const getTransactionLabel = (type: string) => {
    switch (type) {
      case 'fund_escrow': return 'Escrow Funded'
      case 'release_helper': return 'Payment Received'
      case 'commission_fee': return 'Platform Fee'
      case 'refund': return 'Refund'
      case 'adjustment': return 'Adjustment'
      default: return type
    }
  }

  return (
    <div className="min-h-screen bg-primary-50 py-10 px-4">
      <div className="mx-auto max-w-4xl space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold">My Wallet</h1>
        </div>

        {loading ? (
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
                    Funds you can withdraw
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

            {/* Transaction History */}
            <Card>
              <CardHeader>
                <CardTitle>Recent Transactions</CardTitle>
              </CardHeader>
              <CardContent>
                {transactions.length === 0 ? (
                  <p className="text-sm text-muted-foreground">No transactions yet.</p>
                ) : (
                  <div className="space-y-3">
                    {transactions.map((tx) => (
                      <div
                        key={tx.id}
                        className="flex items-center justify-between border-b pb-3 last:border-0"
                      >
                        <div className="flex-1">
                          <div className="text-sm font-medium">
                            {getTransactionLabel(tx.transaction.type)}
                          </div>
                          <div className="text-xs text-muted-foreground">
                            {new Date(tx.created_at).toLocaleString('en-IN')} • {tx.balance_type}
                          </div>
                        </div>
                        <div className="text-right">
                          <div
                            className={`text-sm font-semibold ${
                              tx.delta >= 0 ? 'text-green-600' : 'text-red-600'
                            }`}
                          >
                            {tx.delta >= 0 ? '+' : ''}
                            {formatAmount(tx.delta)}
                          </div>
                          <div className="text-xs text-muted-foreground">
                            Balance: {formatAmount(tx.balance_after)}
                          </div>
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
