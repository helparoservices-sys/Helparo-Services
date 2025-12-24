import { createClient } from '@/lib/supabase/server'
import { IndianRupee, Wallet, Lock, CheckCircle, TrendingUp, CreditCard, AlertCircle, ArrowUpRight, RefreshCcw, FileText, Banknote } from 'lucide-react'
import Link from 'next/link'

interface PlatformWallet {
  available_balance: number
  escrow_balance: number
  currency: string
}

interface PaymentOrderRow {
  order_id: string
  payment_status: string
  order_amount: number
  created_at: string
}

interface EscrowRow {
  id: string
  request_id: string
  amount: number
  status: string
  funded_at: string
  released_at: string | null
}

interface TransactionRow {
  id: string
  type: string
  amount: number
  created_at: string
  request_id: string | null
}

interface WithdrawalCount {
  requested: number
  processing: number
  paid: number
}

function formatAmount(amount: number | null | undefined) {
  const v = Number(amount || 0)
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    minimumFractionDigits: 2,
  }).format(v)
}

export default async function AdminPaymentsPage() {
  // Server-side data loading (SSR) for performance & SEO
  const supabase = await createClient()
  const platformId = '00000000-0000-0000-0000-000000000000'
  let error: string | null = null

  // Platform wallet
  const { data: platformWallet, error: walletError } = await supabase
    .from('wallet_accounts')
    .select('id, user_id, balance, currency, created_at, updated_at')
    .eq('user_id', platformId)
    .maybeSingle()
  if (walletError) error = walletError.message

  // Commission percent via RPC
  const { data: commissionData, error: commissionError } = await supabase.rpc('get_commission_percent')
  const commission = commissionError ? 12 : commissionData || 12
  if (commissionError && !error) error = commissionError.message

  // Escrow counts
  const { count: fundedCount } = await supabase
    .from('escrows')
    .select('*', { head: true, count: 'exact' })
    .eq('status', 'funded')
  const { count: releasedCount } = await supabase
    .from('escrows')
    .select('*', { head: true, count: 'exact' })
    .eq('status', 'released')

  // Recent payment orders (latest 8)
  const { data: orders } = await supabase
    .from('payment_orders')
    .select('order_id, payment_status, order_amount, created_at')
    .order('created_at', { ascending: false })
    .limit(8)

  // Recent escrows (funded & not released yet) latest 5
  const { data: openEscrows } = await supabase
    .from('escrows')
    .select('id, request_id, amount, status, funded_at, released_at')
    .eq('status', 'funded')
    .order('funded_at', { ascending: false })
    .limit(5)

  // Recently released escrows latest 5
  const { data: releasedEscrows } = await supabase
    .from('escrows')
    .select('id, request_id, amount, status, funded_at, released_at')
    .eq('status', 'released')
    .order('released_at', { ascending: false })
    .limit(5)

  // Recent payment transactions (latest 10)
  const { data: transactions } = await supabase
    .from('payment_transactions')
    .select('id, type, amount, request_id, created_at')
    .order('created_at', { ascending: false })
    .limit(10)

  // Withdrawal counts (requested, processing, paid)
  async function countStatus(s: string) {
    const { count } = await supabase
      .from('withdrawal_requests')
      .select('*', { head: true, count: 'exact' })
      .eq('status', s)
    return count || 0
  }
  const withdrawalCounts: WithdrawalCount = {
    requested: await countStatus('requested'),
    processing: await countStatus('processing'),
    paid: await countStatus('paid')
  }

  if (error) {
    return (
      <div className="space-y-6 animate-fade-in">
        <div className="bg-red-50 dark:bg-red-900/20 backdrop-blur-xl rounded-lg border border-red-200 dark:border-red-800/50 p-6">
          <div className="flex items-center gap-3">
            <AlertCircle className="h-6 w-6 text-red-600 dark:text-red-400" />
            <div>
              <h3 className="font-semibold text-red-900 dark:text-red-200">Error Loading Payment Data</h3>
              <p className="text-sm text-red-700 dark:text-red-300 mt-1">{error}</p>
            </div>
          </div>
        </div>
      </div>
    )
  }

  const platformEarnings = (platformWallet as PlatformWallet)?.available_balance || 0
  const escrowBalance = (platformWallet as PlatformWallet)?.escrow_balance || 0
  const activeEscrows = fundedCount || 0
  const completedJobs = releasedCount || 0
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
              <IndianRupee className="h-6 w-6 text-green-600 dark:text-green-400" />
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
                <IndianRupee className="h-5 w-5 text-green-600 dark:text-green-400" />
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
              <p className="text-lg font-bold text-slate-900 dark:text-white">{(platformWallet as PlatformWallet)?.currency || 'INR'}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Aggregated Operational Panels */}
      <div className="grid xl:grid-cols-3 gap-6">
        {/* Recent Payment Orders */}
        <div className="bg-white/80 dark:bg-slate-800/80 backdrop-blur-xl rounded-lg border border-white/20 dark:border-slate-700/50 shadow-lg p-5 flex flex-col">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-semibold text-slate-800 dark:text-slate-100 flex items-center gap-2"><CreditCard className="h-4 w-4" /> Recent Payment Orders</h3>
            <span className="text-[11px] px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300">{orders?.length || 0}</span>
          </div>
          <div className="flex-1 overflow-y-auto">
            <table className="w-full text-xs">
              <thead className="text-[11px] uppercase text-slate-500 dark:text-slate-400">
                <tr>
                  <th className="text-left py-1 pr-2">Order</th>
                  <th className="text-right py-1 pr-2">Amount</th>
                  <th className="text-left py-1">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 dark:divide-slate-700">
                {(orders as PaymentOrderRow[] | null)?.map(o => (
                  <tr key={o.order_id} className="hover:bg-slate-50 dark:hover:bg-slate-700/40">
                    <td className="py-1 pr-2 font-mono text-[11px]">{o.order_id.slice(0,12)}</td>
                    <td className="py-1 pr-2 text-right">{formatAmount(o.order_amount/100)}</td>
                    <td className="py-1">
                      <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-medium ${o.payment_status === 'success' ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400' : o.payment_status === 'failed' ? 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400' : 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400'}`}>{o.payment_status}</span>
                    </td>
                  </tr>
                ))}
                {(!orders || orders.length === 0) && (
                  <tr><td colSpan={3} className="py-3 text-center text-slate-500 dark:text-slate-400">No orders</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Escrows (Active vs Released) */}
        <div className="space-y-6">
          <div className="bg-white/80 dark:bg-slate-800/80 backdrop-blur-xl rounded-lg border border-white/20 dark:border-slate-700/50 shadow-lg p-5">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-semibold flex items-center gap-2 text-slate-800 dark:text-slate-100"><Lock className="h-4 w-4" /> Active Escrows</h3>
              <span className="text-[11px] px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-700">{openEscrows?.length || 0}</span>
            </div>
            <ul className="space-y-2 max-h-48 overflow-y-auto text-xs">
              {(openEscrows as EscrowRow[] | null)?.map(e => (
                <li key={e.id} className="flex items-center justify-between py-1 px-2 rounded hover:bg-slate-50 dark:hover:bg-slate-700/40">
                  <span className="font-mono text-[11px]">{e.id.slice(0,8)}</span>
                  <span>{formatAmount(e.amount)}</span>
                  <span className="text-[10px] text-slate-500">{new Date(e.funded_at).toLocaleDateString()}</span>
                </li>
              ))}
              {(!openEscrows || openEscrows.length === 0) && <li className="text-center text-slate-500 dark:text-slate-400 py-2">No active escrows</li>}
            </ul>
          </div>
          <div className="bg-white/80 dark:bg-slate-800/80 backdrop-blur-xl rounded-lg border border-white/20 dark:border-slate-700/50 shadow-lg p-5">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-semibold flex items-center gap-2 text-slate-800 dark:text-slate-100"><CheckCircle className="h-4 w-4" /> Released Escrows</h3>
              <span className="text-[11px] px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-700">{releasedEscrows?.length || 0}</span>
            </div>
            <ul className="space-y-2 max-h-48 overflow-y-auto text-xs">
              {(releasedEscrows as EscrowRow[] | null)?.map(e => (
                <li key={e.id} className="flex items-center justify-between py-1 px-2 rounded hover:bg-slate-50 dark:hover:bg-slate-700/40">
                  <span className="font-mono text-[11px]">{e.id.slice(0,8)}</span>
                  <span>{formatAmount(e.amount)}</span>
                  <span className="text-[10px] text-slate-500">{e.released_at ? new Date(e.released_at).toLocaleDateString() : ''}</span>
                </li>
              ))}
              {(!releasedEscrows || releasedEscrows.length === 0) && <li className="text-center text-slate-500 dark:text-slate-400 py-2">No released escrows</li>}
            </ul>
          </div>
        </div>

        {/* Recent Transactions & Withdrawals */}
        <div className="bg-white/80 dark:bg-slate-800/80 backdrop-blur-xl rounded-lg border border-white/20 dark:border-slate-700/50 shadow-lg p-5 flex flex-col">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-semibold text-slate-800 dark:text-slate-100 flex items-center gap-2"><RefreshCcw className="h-4 w-4" /> Recent Transactions</h3>
            <span className="text-[11px] px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300">{transactions?.length || 0}</span>
          </div>
          <div className="flex-1 overflow-y-auto">
            <table className="w-full text-xs">
              <thead className="text-[11px] uppercase text-slate-500 dark:text-slate-400">
                <tr>
                  <th className="text-left py-1 pr-2">Type</th>
                  <th className="text-right py-1 pr-2">Amount</th>
                  <th className="text-left py-1">Date</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 dark:divide-slate-700">
                {(transactions as TransactionRow[] | null)?.map(t => (
                  <tr key={t.id} className="hover:bg-slate-50 dark:hover:bg-slate-700/40">
                    <td className="py-1 pr-2 font-mono text-[11px]">{t.type}</td>
                    <td className="py-1 pr-2 text-right">{formatAmount(t.amount)}</td>
                    <td className="py-1 text-[10px] text-slate-500">{new Date(t.created_at).toLocaleDateString()}</td>
                  </tr>
                ))}
                {(!transactions || transactions.length === 0) && (
                  <tr><td colSpan={3} className="py-3 text-center text-slate-500 dark:text-slate-400">No transactions</td></tr>
                )}
              </tbody>
            </table>
          </div>

          {/* Withdrawals summary */}
          <div className="mt-4 grid grid-cols-3 gap-2 text-center">
            <div className="rounded-md bg-yellow-50 dark:bg-yellow-900/30 p-2">
              <p className="text-[10px] text-yellow-700 dark:text-yellow-300">Requested</p>
              <p className="text-sm font-semibold">{withdrawalCounts.requested}</p>
            </div>
            <div className="rounded-md bg-blue-50 dark:bg-blue-900/30 p-2">
              <p className="text-[10px] text-blue-700 dark:text-blue-300">Processing</p>
              <p className="text-sm font-semibold">{withdrawalCounts.processing}</p>
            </div>
            <div className="rounded-md bg-green-50 dark:bg-green-900/30 p-2">
              <p className="text-[10px] text-green-700 dark:text-green-300">Paid</p>
              <p className="text-sm font-semibold">{withdrawalCounts.paid}</p>
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
              <li>Customer funds escrow via Cashfree payment gateway (payment_orders)</li>
              <li>Escrow created & locked (escrows + ledger_entries)</li>
              <li>On completion, commission ({commission}%) retained and helper payout released (payment_transactions)</li>
              <li>Helper earnings recorded (job_earnings) and can withdraw (withdrawal_requests)</li>
              <li>Platform revenue accumulates in wallet_accounts (available vs escrow)</li>
            </ol>
          </div>
        </div>
      </div>
    </div>
  )
}
