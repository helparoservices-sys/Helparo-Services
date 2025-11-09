'use client'

import { useEffect, useState } from 'react'
import { getPlatformStats, getCommissionPercent } from '@/app/actions/payments'
import { DollarSign, Wallet, Lock, CheckCircle, TrendingUp, CreditCard, AlertCircle, ArrowUpRight } from 'lucide-react'
import { PageLoader } from '@/components/admin/PageLoader'

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

      if ('error' in statsRes && statsRes.error) {
        setError(statsRes.error)
      } else if ('data' in statsRes) {
        setStats(statsRes.data)
      }

      if ('error' in commRes && commRes.error) {
        setError(commRes.error)
      } else if ('data' in commRes) {
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

  if (loading) {
    return <PageLoader text="Loading payment data..." />
  }

  if (error) {
    return (
      <div className="space-y-6 animate-fade-in">
        <div className="bg-red-50 dark:bg-red-900/20 backdrop-blur-xl rounded-lg border border-red-200 dark:border-red-800/50 p-6">
          <div className="flex items-center gap-3">
            <AlertCircle className="h-6 w-6 text-red-600 dark:text-red-400" />
            <div>
              <h3 className="font-semibold text-red-900 dark:text-red-200">Error Loading Data</h3>
              <p className="text-sm text-red-700 dark:text-red-300 mt-1">{error}</p>
            </div>
          </div>
        </div>
      </div>
    )
  }

  const platformEarnings = stats?.platformWallet?.available_balance || 0
  const escrowBalance = stats?.platformWallet?.escrow_balance || 0
  const activeEscrows = stats?.fundedEscrowsCount || 0
  const completedJobs = stats?.releasedEscrowsCount || 0
  const totalVolume = platformEarnings + escrowBalance

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-slate-900 dark:text-white">Platform Payments</h1>
        <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">Monitor platform revenue, escrow funds, and commission earnings</p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {/* Platform Earnings */}
        <div className="bg-white/80 dark:bg-slate-800/80 backdrop-blur-xl rounded-lg border border-white/20 dark:border-slate-700/50 shadow-lg p-6">
          <div className="flex items-center justify-between mb-4">
            <div>
              <p className="text-sm text-slate-600 dark:text-slate-400">Platform Earnings</p>
              <p className="text-2xl font-bold text-slate-900 dark:text-white mt-1">{formatAmount(platformEarnings)}</p>
            </div>
            <div className="w-12 h-12 rounded-lg bg-green-100 dark:bg-green-900/30 flex items-center justify-center shadow-lg">
              <DollarSign className="h-6 w-6 text-green-600 dark:text-green-400" />
            </div>
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400">Total commission earned</p>
        </div>

        {/* Escrow Balance */}
        <div className="bg-white/80 dark:bg-slate-800/80 backdrop-blur-xl rounded-lg border border-white/20 dark:border-slate-700/50 shadow-lg p-6">
          <div className="flex items-center justify-between mb-4">
            <div>
              <p className="text-sm text-slate-600 dark:text-slate-400">Escrow Balance</p>
              <p className="text-2xl font-bold text-slate-900 dark:text-white mt-1">{formatAmount(escrowBalance)}</p>
            </div>
            <div className="w-12 h-12 rounded-lg bg-orange-100 dark:bg-orange-900/30 flex items-center justify-center shadow-lg">
              <Lock className="h-6 w-6 text-orange-600 dark:text-orange-400" />
            </div>
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400">Funds locked in escrow</p>
        </div>

        {/* Active Escrows */}
        <div className="bg-white/80 dark:bg-slate-800/80 backdrop-blur-xl rounded-lg border border-white/20 dark:border-slate-700/50 shadow-lg p-6">
          <div className="flex items-center justify-between mb-4">
            <div>
              <p className="text-sm text-slate-600 dark:text-slate-400">Active Escrows</p>
              <p className="text-2xl font-bold text-slate-900 dark:text-white mt-1">{activeEscrows}</p>
            </div>
            <div className="w-12 h-12 rounded-lg bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center shadow-lg">
              <Wallet className="h-6 w-6 text-blue-600 dark:text-blue-400" />
            </div>
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400">Jobs in progress</p>
        </div>

        {/* Completed Jobs */}
        <div className="bg-white/80 dark:bg-slate-800/80 backdrop-blur-xl rounded-lg border border-white/20 dark:border-slate-700/50 shadow-lg p-6">
          <div className="flex items-center justify-between mb-4">
            <div>
              <p className="text-sm text-slate-600 dark:text-slate-400">Completed Jobs</p>
              <p className="text-2xl font-bold text-slate-900 dark:text-white mt-1">{completedJobs}</p>
            </div>
            <div className="w-12 h-12 rounded-lg bg-purple-100 dark:bg-purple-900/30 flex items-center justify-center shadow-lg">
              <CheckCircle className="h-6 w-6 text-purple-600 dark:text-purple-400" />
            </div>
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400">Successfully released</p>
        </div>
      </div>

      {/* Commission Rate & Total Volume */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Commission Rate Card */}
        <div className="bg-gradient-to-br from-primary-500 to-primary-600 text-white rounded-lg shadow-lg p-6">
          <div className="flex items-center justify-between mb-4">
            <div>
              <p className="text-sm text-white/80">Commission Rate</p>
              <p className="text-4xl font-bold mt-2">{commission}%</p>
            </div>
            <div className="w-14 h-14 rounded-lg bg-white/20 flex items-center justify-center shadow-lg">
              <TrendingUp className="h-8 w-8 text-white" />
            </div>
          </div>
          <p className="text-sm text-white/90">Platform commission on completed jobs</p>
        </div>

        {/* Total Volume Card */}
        <div className="bg-gradient-to-br from-green-500 to-green-600 text-white rounded-lg shadow-lg p-6">
          <div className="flex items-center justify-between mb-4">
            <div>
              <p className="text-sm text-white/80">Total Volume</p>
              <p className="text-4xl font-bold mt-2">{formatAmount(totalVolume)}</p>
            </div>
            <div className="w-14 h-14 rounded-lg bg-white/20 flex items-center justify-center shadow-lg">
              <CreditCard className="h-8 w-8 text-white" />
            </div>
          </div>
          <p className="text-sm text-white/90">Earnings + Escrow combined</p>
        </div>
      </div>

      {/* Platform Wallet Details */}
      <div className="bg-white/80 dark:bg-slate-800/80 backdrop-blur-xl rounded-lg border border-white/20 dark:border-slate-700/50 shadow-lg p-6">
        <h2 className="text-lg font-semibold text-slate-900 dark:text-white mb-4">Platform Wallet Details</h2>
        <div className="space-y-4">
          <div className="flex items-center justify-between pb-4 border-b border-slate-200 dark:border-slate-700">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-green-100 dark:bg-green-900/30 flex items-center justify-center">
                <DollarSign className="h-5 w-5 text-green-600 dark:text-green-400" />
              </div>
              <div>
                <p className="text-sm font-medium text-slate-900 dark:text-white">Available Balance</p>
                <p className="text-xs text-slate-500 dark:text-slate-400">Can be withdrawn</p>
              </div>
            </div>
            <div className="text-right">
              <p className="text-lg font-bold text-green-600 dark:text-green-400">{formatAmount(platformEarnings)}</p>
            </div>
          </div>

          <div className="flex items-center justify-between pb-4 border-b border-slate-200 dark:border-slate-700">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-orange-100 dark:bg-orange-900/30 flex items-center justify-center">
                <Lock className="h-5 w-5 text-orange-600 dark:text-orange-400" />
              </div>
              <div>
                <p className="text-sm font-medium text-slate-900 dark:text-white">Escrow Balance</p>
                <p className="text-xs text-slate-500 dark:text-slate-400">Locked for active jobs</p>
              </div>
            </div>
            <div className="text-right">
              <p className="text-lg font-bold text-orange-600 dark:text-orange-400">{formatAmount(escrowBalance)}</p>
            </div>
          </div>

          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center">
                <Wallet className="h-5 w-5 text-blue-600 dark:text-blue-400" />
              </div>
              <div>
                <p className="text-sm font-medium text-slate-900 dark:text-white">Currency</p>
                <p className="text-xs text-slate-500 dark:text-slate-400">Payment currency</p>
              </div>
            </div>
            <div className="text-right">
              <p className="text-lg font-bold text-slate-900 dark:text-white">{stats?.platformWallet?.currency || 'INR'}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Payment Flow Info */}
      <div className="bg-blue-50 dark:bg-blue-900/20 backdrop-blur-xl rounded-lg border border-blue-200 dark:border-blue-800/50 p-6">
        <div className="flex items-start gap-3">
          <div className="w-10 h-10 rounded-lg bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center flex-shrink-0">
            <ArrowUpRight className="h-5 w-5 text-blue-600 dark:text-blue-400" />
          </div>
          <div>
            <h3 className="font-semibold text-blue-900 dark:text-blue-200 mb-3">Payment Flow</h3>
            <ol className="list-decimal ml-5 space-y-2 text-sm text-blue-800 dark:text-blue-300">
              <li>Customer funds escrow via Cashfree payment gateway</li>
              <li>Funds remain locked in escrow until job completion</li>
              <li>On successful completion, {commission}% platform commission is deducted</li>
              <li>Remaining amount ({100 - commission}%) is released to helper's wallet</li>
              <li>Commission is added to platform available balance</li>
            </ol>
          </div>
        </div>
      </div>
    </div>
  )
}
