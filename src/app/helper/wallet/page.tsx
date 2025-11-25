'use client'

import { useEffect, useState } from 'react'
import { 
  DollarSign, 
  TrendingUp, 
  TrendingDown,
  ArrowUpRight,
  ArrowDownRight,
  Clock,
  CheckCircle,
  XCircle,
  AlertCircle,
  Download,
  Filter,
  Calendar,
  Wallet as WalletIcon,
  CreditCard
} from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { LoadingSpinner } from '@/components/ui/loading'
import { Input } from '@/components/ui/input'
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from '@/components/ui/select'
import { toast } from 'sonner'
import { getHelperWallet, requestWithdrawal } from '@/app/actions/wallet'

interface WalletData {
  balance: {
    available: number
    pending: number
    total_earned: number
    total_withdrawn: number
  }
  earnings: {
    today: number
    this_week: number
    this_month: number
  }
  transactions: Array<{
    id: string
    type: string
    amount: number
    status: string
    description: string
    created_at: string
    job_title?: string
  }>
  withdrawals: Array<{
    id: string
    amount: number
    status: string
    requested_at: string
    processed_at: string | null
    bank_details: string
  }>
}

export default function HelperWalletPage() {
  const [walletData, setWalletData] = useState<WalletData | null>(null)
  const [loading, setLoading] = useState(true)
  const [withdrawAmount, setWithdrawAmount] = useState('')
  const [withdrawing, setWithdrawing] = useState(false)
  const [filterType, setFilterType] = useState('all')
  const [filterStatus, setFilterStatus] = useState('all')

  useEffect(() => {
    loadWallet()
  }, [])

  const loadWallet = async () => {
    setLoading(true)
    const result = await getHelperWallet()
    
    if ('error' in result) {
      toast.error(result.error || 'Failed to load wallet')
    } else if ('data' in result) {
      setWalletData(result.data)
    }
    
    setLoading(false)
  }

  const handleWithdrawal = async () => {
    const amount = parseFloat(withdrawAmount)
    
    if (!amount || amount <= 0) {
      toast.error('Please enter a valid amount')
      return
    }

    if (walletData && amount > walletData.balance.available) {
      toast.error('Insufficient balance')
      return
    }

    if (amount < 100) {
      toast.error('Minimum withdrawal amount is ₹100')
      return
    }

    setWithdrawing(true)
    
    const result = await requestWithdrawal(amount)
    
    if ('error' in result) {
      toast.error(result.error || 'Failed to request withdrawal')
    } else {
      toast.success('Withdrawal request submitted!')
      setWithdrawAmount('')
      loadWallet()
    }
    
    setWithdrawing(false)
  }

  const getTransactionIcon = (type: string) => {
    switch (type) {
      case 'earning':
        return <ArrowUpRight className="h-4 w-4 text-green-600" />
      case 'withdrawal':
        return <ArrowDownRight className="h-4 w-4 text-red-600" />
      case 'commission':
        return <TrendingDown className="h-4 w-4 text-orange-600" />
      default:
        return <DollarSign className="h-4 w-4 text-blue-600" />
    }
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'completed':
        return <Badge className="bg-green-500"><CheckCircle className="h-3 w-3 mr-1" />Completed</Badge>
      case 'pending':
        return <Badge variant="secondary"><Clock className="h-3 w-3 mr-1" />Pending</Badge>
      case 'failed':
        return <Badge variant="destructive"><XCircle className="h-3 w-3 mr-1" />Failed</Badge>
      case 'processing':
        return <Badge className="bg-blue-500"><Clock className="h-3 w-3 mr-1" />Processing</Badge>
      default:
        return <Badge variant="outline">{status}</Badge>
    }
  }

  const filteredTransactions = walletData?.transactions.filter(tx => {
    if (filterType !== 'all' && tx.type !== filterType) return false
    if (filterStatus !== 'all' && tx.status !== filterStatus) return false
    return true
  }) || []

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 dark:from-slate-900 dark:via-blue-950 dark:to-indigo-950 flex items-center justify-center">
        <LoadingSpinner size="lg" />
      </div>
    )
  }

  if (!walletData) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 dark:from-slate-900 dark:via-blue-950 dark:to-indigo-950 p-6">
        <div className="max-w-7xl mx-auto">
          <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-6">
            <p className="text-red-600 dark:text-red-400">Failed to load wallet data</p>
            <Button onClick={loadWallet} className="mt-4">Retry</Button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 dark:from-slate-900 dark:via-blue-950 dark:to-indigo-950 py-6 px-4">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between flex-wrap gap-4">
          <div>
            <h1 className="text-3xl font-bold text-slate-900 dark:text-white flex items-center gap-3">
              <WalletIcon className="h-8 w-8" />
              My Wallet
            </h1>
            <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
              Manage your earnings and withdrawals
            </p>
          </div>
        </div>

        {/* Balance Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <Card className="shadow-lg hover:shadow-xl transition-shadow">
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between">
                <CardTitle className="text-sm font-medium text-slate-600 dark:text-slate-400">
                  Available Balance
                </CardTitle>
                <DollarSign className="h-5 w-5 text-green-500" />
              </div>
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-bold text-green-600 dark:text-green-400">
                ₹{walletData.balance.available.toLocaleString()}
              </p>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                Ready to withdraw
              </p>
            </CardContent>
          </Card>

          <Card className="shadow-lg hover:shadow-xl transition-shadow">
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between">
                <CardTitle className="text-sm font-medium text-slate-600 dark:text-slate-400">
                  Pending
                </CardTitle>
                <Clock className="h-5 w-5 text-yellow-500" />
              </div>
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-bold text-yellow-600 dark:text-yellow-400">
                ₹{walletData.balance.pending.toLocaleString()}
              </p>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                Awaiting completion
              </p>
            </CardContent>
          </Card>

          <Card className="shadow-lg hover:shadow-xl transition-shadow">
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between">
                <CardTitle className="text-sm font-medium text-slate-600 dark:text-slate-400">
                  Total Earned
                </CardTitle>
                <TrendingUp className="h-5 w-5 text-blue-500" />
              </div>
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-bold text-blue-600 dark:text-blue-400">
                ₹{walletData.balance.total_earned.toLocaleString()}
              </p>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                Lifetime earnings
              </p>
            </CardContent>
          </Card>

          <Card className="shadow-lg hover:shadow-xl transition-shadow">
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between">
                <CardTitle className="text-sm font-medium text-slate-600 dark:text-slate-400">
                  Total Withdrawn
                </CardTitle>
                <ArrowDownRight className="h-5 w-5 text-purple-500" />
              </div>
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-bold text-purple-600 dark:text-purple-400">
                ₹{walletData.balance.total_withdrawn.toLocaleString()}
              </p>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                Total payouts
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Earnings Overview */}
        <Card className="shadow-lg">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5 text-primary" />
              Recent Earnings
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="space-y-1">
                <p className="text-sm text-slate-500 dark:text-slate-400">Today</p>
                <p className="text-2xl font-bold text-slate-900 dark:text-white">
                  ₹{walletData.earnings.today.toLocaleString()}
                </p>
              </div>
              <div className="space-y-1">
                <p className="text-sm text-slate-500 dark:text-slate-400">This Week</p>
                <p className="text-2xl font-bold text-slate-900 dark:text-white">
                  ₹{walletData.earnings.this_week.toLocaleString()}
                </p>
              </div>
              <div className="space-y-1">
                <p className="text-sm text-slate-500 dark:text-slate-400">This Month</p>
                <p className="text-2xl font-bold text-slate-900 dark:text-white">
                  ₹{walletData.earnings.this_month.toLocaleString()}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Withdrawal Request */}
          <Card className="shadow-lg lg:col-span-1">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Download className="h-5 w-5 text-primary" />
                Request Withdrawal
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <label className="text-sm font-medium mb-2 block">Amount (₹)</label>
                <Input
                  type="number"
                  placeholder="Enter amount"
                  value={withdrawAmount}
                  onChange={(e) => setWithdrawAmount(e.target.value)}
                  min={100}
                  max={walletData.balance.available}
                />
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-2">
                  Available: ₹{walletData.balance.available.toLocaleString()}
                </p>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Minimum: ₹100
                </p>
              </div>
              <Button
                onClick={handleWithdrawal}
                disabled={withdrawing || !withdrawAmount}
                className="w-full"
              >
                {withdrawing ? 'Processing...' : 'Request Withdrawal'}
              </Button>
            </CardContent>
          </Card>

          {/* Withdrawal History */}
          <Card className="shadow-lg lg:col-span-2">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <CreditCard className="h-5 w-5 text-primary" />
                Withdrawal History
              </CardTitle>
            </CardHeader>
            <CardContent>
              {walletData.withdrawals.length === 0 ? (
                <p className="text-sm text-slate-500 dark:text-slate-400 text-center py-8">
                  No withdrawal requests yet
                </p>
              ) : (
                <div className="space-y-3 max-h-80 overflow-y-auto">
                  {walletData.withdrawals.map((withdrawal) => (
                    <div key={withdrawal.id} className="flex items-center justify-between p-3 rounded-lg border">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <p className="font-medium text-lg">₹{withdrawal.amount.toLocaleString()}</p>
                          {getStatusBadge(withdrawal.status)}
                        </div>
                        <p className="text-xs text-slate-500 dark:text-slate-400">
                          Requested: {new Date(withdrawal.requested_at).toLocaleString()}
                        </p>
                        {withdrawal.processed_at && (
                          <p className="text-xs text-slate-500 dark:text-slate-400">
                            Processed: {new Date(withdrawal.processed_at).toLocaleString()}
                          </p>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Transaction History */}
        <Card className="shadow-lg">
          <CardHeader>
            <div className="flex items-center justify-between flex-wrap gap-4">
              <CardTitle className="flex items-center gap-2">
                <Calendar className="h-5 w-5 text-primary" />
                Transaction History
              </CardTitle>
              <div className="flex gap-2">
                <Select value={filterType} onValueChange={setFilterType}>
                  <SelectTrigger className="w-36">
                    <Filter className="h-4 w-4 mr-2" />
                    <SelectValue placeholder="Type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Types</SelectItem>
                    <SelectItem value="earning">Earnings</SelectItem>
                    <SelectItem value="withdrawal">Withdrawals</SelectItem>
                    <SelectItem value="commission">Commission</SelectItem>
                  </SelectContent>
                </Select>
                <Select value={filterStatus} onValueChange={setFilterStatus}>
                  <SelectTrigger className="w-36">
                    <SelectValue placeholder="Status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Status</SelectItem>
                    <SelectItem value="completed">Completed</SelectItem>
                    <SelectItem value="pending">Pending</SelectItem>
                    <SelectItem value="processing">Processing</SelectItem>
                    <SelectItem value="failed">Failed</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            {filteredTransactions.length === 0 ? (
              <p className="text-sm text-slate-500 dark:text-slate-400 text-center py-8">
                No transactions found
              </p>
            ) : (
              <div className="space-y-3">
                {filteredTransactions.map((transaction) => (
                  <div
                    key={transaction.id}
                    className="flex items-center justify-between p-3 rounded-lg border hover:border-primary transition-colors"
                  >
                    <div className="flex items-start gap-3 flex-1">
                      <div className="mt-1">{getTransactionIcon(transaction.type)}</div>
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-sm">{transaction.description}</p>
                        {transaction.job_title && (
                          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                            Job: {transaction.job_title}
                          </p>
                        )}
                        <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                          {new Date(transaction.created_at).toLocaleString()}
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className={`text-lg font-bold ${
                        transaction.type === 'earning' 
                          ? 'text-green-600 dark:text-green-400' 
                          : 'text-red-600 dark:text-red-400'
                      }`}>
                        {transaction.type === 'earning' ? '+' : '-'}₹{transaction.amount.toLocaleString()}
                      </p>
                      {getStatusBadge(transaction.status)}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
