'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { 
  IndianRupee, Clock, CheckCircle2, XCircle, 
  AlertCircle, Loader2, Wallet, TrendingUp 
} from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

interface Withdrawal {
  id: string
  amount_paise: number
  status: string
  requested_at: string
  approved_at: string | null
  rejected_at: string | null
  admin_note: string | null
}

export default function CustomerWithdrawalsPage() {
  const [withdrawals, setWithdrawals] = useState<Withdrawal[]>([])
  const [loading, setLoading] = useState(true)
  const [isHelper, setIsHelper] = useState(false)

  useEffect(() => {
    loadData()
  }, [])

  async function loadData() {
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return

    // Check if user is a helper
    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single()

    setIsHelper(profile?.role === 'helper')

    // Load withdrawal requests
    // EGRESS FIX: Select only needed columns
    const { data, error } = await supabase
      .from('withdrawal_requests')
      .select('id, amount_paise, status, requested_at, approved_at, rejected_at, admin_note')
      .eq('helper_id', user.id)
      .order('requested_at', { ascending: false })
      .limit(50) // 🟢 SAFE: Most recent 50 withdrawals sufficient for UI

    if (!error && data) {
      setWithdrawals(data as Withdrawal[])
    }
    setLoading(false)
  }

  const statusConfig = {
    pending: { label: 'Pending', color: 'bg-yellow-500', icon: Clock },
    approved: { label: 'Approved', color: 'bg-green-500', icon: CheckCircle2 },
    rejected: { label: 'Rejected', color: 'bg-red-500', icon: XCircle },
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800">
        <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
      </div>
    )
  }

  if (!isHelper) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800 py-8 px-4">
        <div className="mx-auto max-w-3xl">
          <Card>
            <CardContent className="pt-12 pb-12 text-center">
              <Wallet className="h-16 w-16 text-slate-400 mx-auto mb-4" />
              <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-2">
                Withdrawals for Helpers Only
              </h2>
              <p className="text-slate-600 dark:text-slate-400">
                This section is only available for helpers who have earned payments. As a customer, you make payments but don't receive withdrawals.
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800 py-8 px-4">
      <div className="mx-auto max-w-7xl">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
            Withdrawal Requests
          </h1>
          <p className="mt-2 text-slate-600 dark:text-slate-400">
            Track your payout requests and withdrawal history
          </p>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-slate-600 dark:text-slate-400">
                Total Withdrawn
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600 dark:text-green-400">
                ₹{withdrawals
                  .filter(w => w.status === 'approved')
                  .reduce((sum, w) => sum + w.amount_paise, 0) / 100}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-slate-600 dark:text-slate-400">
                Pending Requests
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-yellow-600 dark:text-yellow-400">
                {withdrawals.filter(w => w.status === 'pending').length}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-slate-600 dark:text-slate-400">
                Pending Amount
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">
                ₹{withdrawals
                  .filter(w => w.status === 'pending')
                  .reduce((sum, w) => sum + w.amount_paise, 0) / 100}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Withdrawals List */}
        {withdrawals.length === 0 ? (
          <Card>
            <CardContent className="pt-12 pb-12 text-center">
              <TrendingUp className="h-12 w-12 text-slate-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-slate-900 dark:text-white mb-2">
                No withdrawal requests yet
              </h3>
              <p className="text-slate-600 dark:text-slate-400">
                Complete services to earn money and request withdrawals
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-4">
            {withdrawals.map((withdrawal) => {
              const StatusIcon = statusConfig[withdrawal.status as keyof typeof statusConfig]?.icon || Clock
              const statusColor = statusConfig[withdrawal.status as keyof typeof statusConfig]?.color || 'bg-gray-500'
              
              return (
                <Card key={withdrawal.id} className="border-slate-200 dark:border-slate-700">
                  <CardContent className="p-6">
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <div className="text-2xl font-bold text-slate-900 dark:text-white">
                            ₹{(withdrawal.amount_paise / 100).toLocaleString()}
                          </div>
                          <span className={`flex items-center gap-1 px-3 py-1 rounded-full text-xs font-medium text-white ${statusColor}`}>
                            <StatusIcon className="h-3 w-3" />
                            {statusConfig[withdrawal.status as keyof typeof statusConfig]?.label || withdrawal.status}
                          </span>
                        </div>

                        <div className="space-y-1 text-sm text-slate-600 dark:text-slate-400">
                          <div className="flex items-center gap-2">
                            <Clock className="h-4 w-4" />
                            Requested: {new Date(withdrawal.requested_at).toLocaleString()}
                          </div>
                          {withdrawal.approved_at && (
                            <div className="flex items-center gap-2 text-green-600 dark:text-green-400">
                              <CheckCircle2 className="h-4 w-4" />
                              Approved: {new Date(withdrawal.approved_at).toLocaleString()}
                            </div>
                          )}
                          {withdrawal.rejected_at && (
                            <div className="flex items-center gap-2 text-red-600 dark:text-red-400">
                              <XCircle className="h-4 w-4" />
                              Rejected: {new Date(withdrawal.rejected_at).toLocaleString()}
                            </div>
                          )}
                          {withdrawal.admin_note && (
                            <div className="mt-2 p-3 bg-slate-50 dark:bg-slate-900 rounded-lg">
                              <div className="text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                                Admin Note:
                              </div>
                              <div className="text-xs text-slate-600 dark:text-slate-400">
                                {withdrawal.admin_note}
                              </div>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}
