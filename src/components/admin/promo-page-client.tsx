"use client"
import React, { useState, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { Tag, Plus, CheckCircle, XCircle, Percent, DollarSign, Calendar, Edit } from 'lucide-react'
import { PromoRowActions } from '@/components/admin/promo-row-actions'
import { PromoModal } from '@/components/admin/promo-modal'

interface PromoCode {
  id: string
  code: string
  description: string | null
  discount_type: 'flat' | 'percent'
  discount_value: number
  max_discount_rupees: number | null
  start_date: string
  end_date: string
  usage_limit_total: number | null
  usage_limit_per_user: number | null
  min_order_amount_rupees: number | null
  is_active: boolean
  created_at: string
  allowed_roles: string[] | null
}

const formatRupees = (v: number | null | undefined) => {
  const n = Number(v || 0)
  return new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', minimumFractionDigits: 0 }).format(n)
}

export function PromoPageClient({ promos, usageMap }: { promos: PromoCode[] | null; usageMap: Record<string, number> }) {
  const router = useRouter()
  const [modalOpen, setModalOpen] = useState(false)
  const [editPromo, setEditPromo] = useState<PromoCode | null>(null)

  const totalPromos = promos?.length || 0
  const activePromos = promos?.filter(p => p.is_active).length || 0
  const percentPromos = promos?.filter(p => p.discount_type === 'percent').length || 0
  const flatPromos = promos?.filter(p => p.discount_type === 'flat').length || 0

  const handleRefresh = useCallback(() => router.refresh(), [router])

  const openCreate = useCallback(() => {
    setEditPromo(null)
    setModalOpen(true)
  }, [])

  const openEdit = useCallback((p: PromoCode) => {
    setEditPromo(p)
    setModalOpen(true)
  }, [])

  const closeModal = useCallback(() => {
    setModalOpen(false)
    setEditPromo(null)
  }, [])

  return (
    <div className='space-y-6 animate-fade-in'>
      <div className='flex items-center justify-between'>
        <div>
          <h1 className='text-3xl font-bold text-slate-900 dark:text-white'>Promo Codes</h1>
          <p className='text-sm text-slate-500 dark:text-slate-400 mt-1'>Manage discounts & usage constraints</p>
        </div>
        <button onClick={openCreate} className='inline-flex items-center gap-2 px-4 py-2 bg-primary-600 hover:bg-primary-700 text-white rounded-lg text-sm font-medium transition-colors shadow-lg'>
          <Plus className='h-4 w-4' />
          New Promo
        </button>
      </div>

      <div className='grid grid-cols-1 md:grid-cols-4 gap-6'>
        <StatCard label='Total Codes' value={totalPromos} icon={<Tag className='h-6 w-6 text-blue-600 dark:text-blue-400' />} />
        <StatCard label='Active' value={activePromos} icon={<CheckCircle className='h-6 w-6 text-green-600 dark:text-green-400' />} />
        <StatCard label='Percent Type' value={percentPromos} icon={<Percent className='h-6 w-6 text-purple-600 dark:text-purple-400' />} />
        <StatCard label='Flat Type' value={flatPromos} icon={<DollarSign className='h-6 w-6 text-orange-600 dark:text-orange-400' />} />
      </div>

      <div className='bg-white/80 dark:bg-slate-800/80 backdrop-blur-xl rounded-lg border border-white/20 dark:border-slate-700/50 shadow-lg overflow-hidden'>
        <div className='overflow-x-auto'>
          <table className='w-full'>
            <thead className='bg-slate-50 dark:bg-slate-900/50'>
              <tr>
                <Th>Code</Th>
                <Th>Discount</Th>
                <Th>Constraints</Th>
                <Th>Validity</Th>
                <Th>Usage</Th>
                <Th>Status</Th>
                <Th className='text-right'>Actions</Th>
              </tr>
            </thead>
            <tbody className='divide-y divide-slate-100 dark:divide-slate-700/50'>
              {(promos || []).map(p => {
                const isPercent = p.discount_type === 'percent'
                const discountLabel = isPercent ? `${p.discount_value}% OFF` : `${formatRupees(p.discount_value)}`
                const capLabel = isPercent && p.max_discount_rupees ? `Cap: ${formatRupees(p.max_discount_rupees)}` : ''
                const used = usageMap[p.id] || 0
                const totalLimit = p.usage_limit_total || null
                const remaining = totalLimit !== null ? Math.max(totalLimit - used, 0) : null
                return (
                  <tr key={p.id} className='hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors'>
                    <td className='px-6 py-4'>
                      <div className='flex items-center gap-3'>
                        <div className='w-8 h-8 rounded-lg bg-gradient-to-br from-primary-500 to-primary-600 flex items-center justify-center shadow-lg'>
                          <Tag className='h-4 w-4 text-white' />
                        </div>
                        <div>
                          <div className='font-mono font-semibold text-slate-900 dark:text-white'>{p.code}</div>
                          {p.description && <div className='text-xs text-slate-500 dark:text-slate-400 line-clamp-1'>{p.description}</div>}
                        </div>
                      </div>
                    </td>
                    <td className='px-6 py-4'>
                      <div className='flex items-center gap-2'>
                        {isPercent ? <Percent className='h-4 w-4 text-purple-600 dark:text-purple-400' /> : <DollarSign className='h-4 w-4 text-orange-600 dark:text-orange-400' />}
                        <div>
                          <div className={`text-sm font-semibold ${isPercent ? 'text-purple-600 dark:text-purple-400' : 'text-orange-600 dark:text-orange-400'}`}>{discountLabel}</div>
                          {capLabel && <div className='text-xs text-slate-500 dark:text-slate-400'>{capLabel}</div>}
                        </div>
                      </div>
                    </td>
                    <td className='px-6 py-4'>
                      <div className='text-xs text-slate-600 dark:text-slate-400 space-y-1'>
                        {p.min_order_amount_rupees && <div>Min Order: {formatRupees(p.min_order_amount_rupees)}</div>}
                        {p.usage_limit_total && <div>Total Limit: {p.usage_limit_total}</div>}
                        {p.usage_limit_per_user && <div>Per User: {p.usage_limit_per_user}</div>}
                      </div>
                    </td>
                    <td className='px-6 py-4'>
                      <div className='flex items-center gap-2'>
                        <Calendar className='h-4 w-4 text-slate-400' />
                        <div className='text-xs'>
                          <div className='text-slate-900 dark:text-white'>{new Date(p.start_date).toLocaleDateString()}</div>
                          <div className='text-slate-500 dark:text-slate-400'>to {new Date(p.end_date).toLocaleDateString()}</div>
                        </div>
                      </div>
                    </td>
                    <td className='px-6 py-4'>
                      <div className='text-xs text-slate-600 dark:text-slate-400'>
                        <div>Used: {used}</div>
                        {totalLimit !== null && <div>Remaining: {remaining}</div>}
                      </div>
                    </td>
                    <td className='px-6 py-4'>
                      {p.is_active ? (
                        <span className='inline-flex items-center gap-1 px-2 py-1 text-xs rounded-full bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400'>
                          <CheckCircle className='h-3 w-3' /> Active
                        </span>
                      ) : (
                        <span className='inline-flex items-center gap-1 px-2 py-1 text-xs rounded-full bg-slate-100 dark:bg-slate-900/30 text-slate-600 dark:text-slate-400'>
                          <XCircle className='h-3 w-3' /> Inactive
                        </span>
                      )}
                    </td>
                    <td className='px-6 py-4'>
                      <div className='flex items-center justify-end gap-1'>
                        <button onClick={() => openEdit(p)} title='Edit' className='p-2 text-primary-600 dark:text-primary-400 hover:bg-primary-50 dark:hover:bg-primary-900/30 rounded-lg transition-colors'>
                          <Edit className='h-4 w-4' />
                        </button>
                        <PromoRowActions promo={{ id: p.id, is_active: p.is_active }} onRefresh={handleRefresh} />
                      </div>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
          {(!promos || promos.length === 0) && (
            <div className='p-12 text-center'>
              <Tag className='h-16 w-16 text-slate-400 dark:text-slate-600 mx-auto mb-4' />
              <h3 className='text-lg font-semibold text-slate-900 dark:text-white mb-2'>No Promo Codes</h3>
              <p className='text-sm text-slate-500 dark:text-slate-400 mb-4'>Create a promo code to start offering discounts</p>
              <button onClick={openCreate} className='inline-flex items-center gap-2 px-4 py-2 bg-primary-600 hover:bg-primary-700 text-white rounded-lg text-sm font-medium transition-colors'>
                <Plus className='h-4 w-4' /> Create First Promo
              </button>
            </div>
          )}
        </div>
      </div>
      {modalOpen && <PromoModal open={modalOpen} onClose={closeModal} promo={editPromo || undefined} />}
    </div>
  )
}

function StatCard({ label, value, icon }: { label: string; value: number; icon: React.ReactNode }) {
  return (
    <div className='bg-white/80 dark:bg-slate-800/80 backdrop-blur-xl rounded-lg border border-white/20 dark:border-slate-700/50 shadow-lg p-6'>
      <div className='flex items-center justify-between'>
        <div>
          <p className='text-sm text-slate-600 dark:text-slate-400'>{label}</p>
          <p className='text-2xl font-bold text-slate-900 dark:text-white mt-1'>{value}</p>
        </div>
        <div className='w-12 h-12 rounded-lg bg-slate-100 dark:bg-slate-900/30 flex items-center justify-center shadow-lg'>
          {icon}
        </div>
      </div>
    </div>
  )
}

function Th({ children, className = '' }: { children: React.ReactNode; className?: string }) {
  return (
    <th className={`px-6 py-4 text-left text-xs font-medium text-slate-700 dark:text-slate-300 uppercase tracking-wider ${className}`}>{children}</th>
  )
}