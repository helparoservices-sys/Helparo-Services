'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { 
  Wallet as WalletIcon, 
  Plus, 
  ArrowDownLeft, 
  ArrowUpRight, 
  Lock,
  TrendingUp,
  DollarSign,
  CreditCard,
  History
} from 'lucide-react'


interface Transaction {
  id: string
  type: string
  amount: number
  status: string
  created_at: string
  description: string
}

export default function CustomerWalletPage() {
  const supabase = createClient()
  const [wallet, setWallet] = useState<any>(null)
  const [transactions, setTransactions] = useState<Transaction[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [showAddFunds, setShowAddFunds] = useState(false)
  const [addAmount, setAddAmount] = useState('')
  const [isProcessing, setIsProcessing] = useState(false)

  useEffect(() => {
    loadWalletData()
  }, [])

  const loadWalletData = async () => {
    setLoading(true)
    setError('')

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      setError('Not authenticated')
      setLoading(false)
      return
    }

    // Load wallet balance
    const { data: walletData } = await supabase
      .from('wallet_accounts')
      .select('*')
      .eq('user_id', user.id)
      .single()

    setWallet(walletData)

    // Load recent transactions
    const { data: txData } = await supabase
      .from('payment_orders')
      .select('id, amount, status, created_at, order_type, payment_gateway_order_id')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .limit(10)

    if (txData) {
      setTransactions(txData.map((tx: any) => ({
        id: tx.id,
        type: tx.order_type || 'payment',
        amount: tx.amount,
        status: tx.status,
        created_at: tx.created_at,
        description: tx.payment_gateway_order_id || 'Transaction'
      })))
    }

    setLoading(false)
  }

  const handleAddFunds = async () => {
    const amount = parseFloat(addAmount)
    if (isNaN(amount) || amount < 100) {
      setError('Minimum amount is ₹100')
      return
    }

    if (amount > 100000) {
      setError('Maximum amount is ₹1,00,000')
      return
    }

    setIsProcessing(true)
    setError('')

    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('Not authenticated')

      // Create payment order
      const { data: order, error: orderError } = await supabase
        .from('payment_orders')
        .insert({
          user_id: user.id,
          amount: amount,
          order_type: 'wallet_recharge',
          status: 'created',
          payment_gateway_order_id: `WALLET_${Date.now()}`
        })
        .select()
        .single()

      if (orderError) throw orderError

      // In production: Redirect to Cashfree payment page
      // For now: Simulate successful payment
      const { error: updateError } = await supabase
        .from('payment_orders')
        .update({ status: 'completed' })
        .eq('id', order.id)

      if (!updateError) {
        // Update wallet balance
        const { error: walletError } = await supabase
          .from('wallet_accounts')
          .update({
            available_balance: (wallet?.available_balance || 0) + amount
          })
          .eq('user_id', user.id)

        if (!walletError) {
          setShowAddFunds(false)
          setAddAmount('')
          loadWalletData()
        }
      }
    } catch (err: any) {
      setError(err.message || 'Payment failed')
    } finally {
      setIsProcessing(false)
    }
  }

  const formatAmount = (amount: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      minimumFractionDigits: 2,
    }).format(amount)
  }

  if (loading && !wallet) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-slate-600">Loading wallet...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-slate-900 dark:text-white">Wallet</h1>
          <p className="text-slate-600 dark:text-slate-400">Manage your funds and transactions</p>
        </div>
        <button
          onClick={() => setShowAddFunds(true)}
          className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-lg hover:shadow-lg transition-all"
        >
          <Plus className="h-5 w-5" />
          Add Funds
        </button>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <p className="text-red-700 text-sm">{error}</p>
        </div>
      )}

      {/* Balance Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-gradient-to-br from-green-500 to-green-600 rounded-xl p-6 text-white shadow-lg">
          <div className="flex items-center gap-3 mb-3">
            <div className="p-2 bg-white/20 rounded-lg">
              <WalletIcon className="h-6 w-6" />
            </div>
            <span className="text-sm font-medium opacity-90">Available Balance</span>
          </div>
          <p className="text-4xl font-bold">{formatAmount(wallet?.available_balance || 0)}</p>
          <p className="text-sm opacity-75 mt-2">Ready to use</p>
        </div>

        <div className="bg-gradient-to-br from-orange-500 to-orange-600 rounded-xl p-6 text-white shadow-lg">
          <div className="flex items-center gap-3 mb-3">
            <div className="p-2 bg-white/20 rounded-lg">
              <Lock className="h-6 w-6" />
            </div>
            <span className="text-sm font-medium opacity-90">In Escrow</span>
          </div>
          <p className="text-4xl font-bold">{formatAmount(wallet?.escrow_balance || 0)}</p>
          <p className="text-sm opacity-75 mt-2">Locked for jobs</p>
        </div>

        <div className="bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl p-6 text-white shadow-lg">
          <div className="flex items-center gap-3 mb-3">
            <div className="p-2 bg-white/20 rounded-lg">
              <TrendingUp className="h-6 w-6" />
            </div>
            <span className="text-sm font-medium opacity-90">Total Balance</span>
          </div>
          <p className="text-4xl font-bold">
            {formatAmount((wallet?.available_balance || 0) + (wallet?.escrow_balance || 0))}
          </p>
          <p className="text-sm opacity-75 mt-2">All funds</p>
        </div>
      </div>

      {/* Add Funds Modal */}
      {showAddFunds && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-slate-800 rounded-xl max-w-md w-full p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-2xl font-bold text-slate-900 dark:text-white">Add Funds</h2>
              <button
                onClick={() => {
                  setShowAddFunds(false)
                  setAddAmount('')
                  setError('')
                }}
                className="text-slate-400 hover:text-slate-600"
              >
                ✕
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                  Amount (₹)
                </label>
                <input
                  type="number"
                  value={addAmount}
                  onChange={(e) => setAddAmount(e.target.value)}
                  placeholder="Enter amount"
                  className="w-full px-4 py-3 border border-slate-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-slate-700 dark:text-white"
                  disabled={isProcessing}
                  min="100"
                  max="100000"
                />
                <p className="text-xs text-slate-500 mt-1">Min: ₹100, Max: ₹1,00,000</p>
              </div>

              <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-4">
                <div className="flex items-start gap-2">
                  <CreditCard className="h-5 w-5 text-blue-600 mt-0.5" />
                  <div>
                    <p className="text-sm font-medium text-slate-900 dark:text-white">Cashfree Payment Gateway</p>
                    <p className="text-xs text-slate-600 dark:text-slate-400 mt-1">
                      Secure payments via UPI, Cards, Netbanking
                    </p>
                  </div>
                </div>
              </div>

              {error && (
                <div className="bg-red-50 border border-red-200 rounded-lg p-3">
                  <p className="text-red-700 text-sm">{error}</p>
                </div>
              )}

              <div className="flex gap-3">
                <button
                  onClick={() => {
                    setShowAddFunds(false)
                    setAddAmount('')
                    setError('')
                  }}
                  className="flex-1 px-4 py-3 border border-slate-300 dark:border-slate-600 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors"
                  disabled={isProcessing}
                >
                  Cancel
                </button>
                <button
                  onClick={handleAddFunds}
                  disabled={isProcessing || !addAmount}
                  className="flex-1 px-4 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-lg hover:shadow-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isProcessing ? 'Processing...' : 'Proceed to Pay'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Transaction History */}
      <div className="bg-white dark:bg-slate-800 rounded-xl p-6 shadow-sm border border-slate-200 dark:border-slate-700">
        <div className="flex items-center gap-3 mb-4">
          <History className="h-6 w-6 text-slate-600 dark:text-slate-400" />
          <h2 className="text-xl font-bold text-slate-900 dark:text-white">Transaction History</h2>
        </div>

        {transactions.length === 0 ? (
          <div className="text-center py-8 text-slate-500 dark:text-slate-400">
            <DollarSign className="h-12 w-12 mx-auto mb-3 opacity-50" />
            <p>No transactions yet</p>
          </div>
        ) : (
          <div className="space-y-3">
            {transactions.map((tx) => (
              <div
                key={tx.id}
                className="flex items-center justify-between p-4 bg-slate-50 dark:bg-slate-900/50 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-900 transition-colors"
              >
                <div className="flex items-center gap-3">
                  <div className={`p-2 rounded-lg ${
                    tx.type === 'wallet_recharge' 
                      ? 'bg-green-100 dark:bg-green-900/30' 
                      : 'bg-blue-100 dark:bg-blue-900/30'
                  }`}>
                    {tx.type === 'wallet_recharge' ? (
                      <ArrowDownLeft className="h-5 w-5 text-green-600" />
                    ) : (
                      <ArrowUpRight className="h-5 w-5 text-blue-600" />
                    )}
                  </div>
                  <div>
                    <p className="font-medium text-slate-900 dark:text-white">
                      {tx.type === 'wallet_recharge' ? 'Funds Added' : 'Payment'}
                    </p>
                    <p className="text-xs text-slate-500 dark:text-slate-400">
                      {new Date(tx.created_at).toLocaleDateString('en-IN', {
                        day: 'numeric',
                        month: 'short',
                        year: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit'
                      })}
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  <p className={`font-bold ${
                    tx.type === 'wallet_recharge' 
                      ? 'text-green-600' 
                      : 'text-blue-600'
                  }`}>
                    {tx.type === 'wallet_recharge' ? '+' : '-'}{formatAmount(tx.amount)}
                  </p>
                  <span className={`text-xs px-2 py-1 rounded-full ${
                    tx.status === 'completed' 
                      ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400' 
                      : tx.status === 'pending'
                      ? 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400'
                      : 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400'
                  }`}>
                    {tx.status}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Payment Info */}
      <div className="bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 rounded-xl p-6 border border-blue-200 dark:border-blue-800">
        <h3 className="font-semibold text-slate-900 dark:text-white mb-3">Payment Information</h3>
        <ul className="space-y-2 text-sm text-slate-600 dark:text-slate-400">
          <li>• Funds are held in escrow until job completion</li>
          <li>• Released to helpers after confirmation</li>
          <li>• Refunds processed within 5-7 business days</li>
          <li>• All transactions are secured by Cashfree</li>
        </ul>
      </div>
    </div>
  )
}
