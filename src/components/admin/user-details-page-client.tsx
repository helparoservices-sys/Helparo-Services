'use client'

import { useEffect, useMemo, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { AlertCircle, MapPin, RefreshCw, Shield, User, Users } from 'lucide-react'

import { DataTable } from '@/components/admin/DataTable'
import {
  getAllCustomers,
  getAllHelpers,
  getCustomerFullDetails,
  getHelperFullDetails,
  type CustomerFullDetails,
  type HelperFullDetails,
} from '@/app/actions/admin-user-details'

type View = 'customers' | 'helpers'

type ListCustomer = {
  id: string
  email: string
  full_name: string | null
  phone: string | null
  status: string
  is_banned: boolean
  created_at: string
  city: string | null
  state: string | null
}

type ListHelper = ListCustomer & {
  helper_profiles?: {
    is_approved?: boolean
    verification_status?: string | null
    service_categories?: string[] | null
    is_available_now?: boolean | null
  } | null
}

function fmtDate(value?: string | null) {
  if (!value) return '—'
  const d = new Date(value)
  if (Number.isNaN(d.getTime())) return String(value)
  return d.toLocaleString()
}

function valueOrDash(v: unknown) {
  if (v === null || v === undefined || v === '') return '—'
  return String(v)
}

function getErrorMessage(e: unknown) {
  if (e instanceof Error) return e.message
  if (typeof e === 'string') return e
  return 'Unknown error'
}

function asNumber(v: unknown): number | null {
  if (typeof v === 'number') return Number.isFinite(v) ? v : null
  if (typeof v === 'string' && v.trim() !== '') {
    const n = Number(v)
    return Number.isFinite(n) ? n : null
  }
  return null
}

function MapEmbed({ lat, lng, title }: { lat: number; lng: number; title?: string }) {
  const src = `https://www.google.com/maps?q=${encodeURIComponent(`${lat},${lng}`)}&z=15&output=embed`
  return (
    <div className="rounded-lg overflow-hidden border border-slate-200 dark:border-slate-700 bg-white/80 dark:bg-slate-800/80">
      <div className="px-4 py-2 border-b border-slate-200 dark:border-slate-700 flex items-center gap-2 text-sm text-slate-700 dark:text-slate-200">
        <MapPin className="w-4 h-4" />
        <span className="font-medium">{title || 'Map'}</span>
        <span className="ml-auto text-xs text-slate-500">{lat.toFixed(5)}, {lng.toFixed(5)}</span>
      </div>
      <iframe
        title={title || 'Location'}
        src={src}
        className="w-full h-[260px]"
        loading="lazy"
        referrerPolicy="no-referrer-when-downgrade"
      />
    </div>
  )
}

function Pill({ label }: { label: string }) {
  return (
    <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-primary-50 text-primary-700 dark:bg-slate-700 dark:text-slate-100 border border-primary-100 dark:border-slate-600">
      {label}
    </span>
  )
}

function Section({ title, icon, children }: { title: string; icon?: React.ReactNode; children: React.ReactNode }) {
  return (
    <div className="bg-white/80 dark:bg-slate-800/80 backdrop-blur-xl rounded-lg border border-white/20 dark:border-slate-700/50 shadow-lg overflow-hidden">
      <div className="px-5 py-3 border-b border-slate-200 dark:border-slate-700 flex items-center gap-2">
        {icon}
        <h3 className="text-sm font-semibold text-slate-900 dark:text-slate-100">{title}</h3>
      </div>
      <div className="p-5">{children}</div>
    </div>
  )
}

export function UserDetailsPageClient({
  initialView,
  initialUserId,
}: {
  initialView?: View
  initialUserId?: string
}) {
  const router = useRouter()
  const searchParams = useSearchParams()

  const [view, setView] = useState<View>(initialView || 'customers')
  const [statusFilter, setStatusFilter] = useState<string>('all')
  const [verificationFilter, setVerificationFilter] = useState<string>('all')

  const [loadingList, setLoadingList] = useState(false)
  const [listError, setListError] = useState<string | null>(null)
  const [customers, setCustomers] = useState<ListCustomer[]>([])
  const [helpers, setHelpers] = useState<ListHelper[]>([])

  const [selectedId, setSelectedId] = useState<string | null>(initialUserId || null)
  const [loadingDetails, setLoadingDetails] = useState(false)
  const [detailsError, setDetailsError] = useState<string | null>(null)
  const [details, setDetails] = useState<CustomerFullDetails | HelperFullDetails | null>(null)

  const selectedTypeParam = useMemo(() => (view === 'helpers' ? 'helper' : 'customer'), [view])

  async function refreshList() {
    setLoadingList(true)
    setListError(null)

    try {
      if (view === 'customers') {
        const res = await getAllCustomers({
          limit: 500,
          offset: 0,
          status: statusFilter,
          sortBy: 'created_at',
          sortOrder: 'desc',
        })
        if (res.error) throw new Error(res.error)
        setCustomers(res.data as ListCustomer[])
      } else {
        const res = await getAllHelpers({
          limit: 500,
          offset: 0,
          status: statusFilter,
          verification_status: verificationFilter,
          sortBy: 'created_at',
          sortOrder: 'desc',
        })
        if (res.error) throw new Error(res.error)
        setHelpers(res.data as ListHelper[])
      }
    } catch (e: unknown) {
      setListError(getErrorMessage(e) || 'Failed to load list')
    } finally {
      setLoadingList(false)
    }
  }

  async function refreshDetails(id: string) {
    setLoadingDetails(true)
    setDetailsError(null)

    try {
      if (view === 'customers') {
        const res = await getCustomerFullDetails(id)
        if (res.error) throw new Error(res.error)
        setDetails(res.data)
      } else {
        const res = await getHelperFullDetails(id)
        if (res.error) throw new Error(res.error)
        setDetails(res.data)
      }
    } catch (e: unknown) {
      setDetails(null)
      setDetailsError(getErrorMessage(e) || 'Failed to load user details')
    } finally {
      setLoadingDetails(false)
    }
  }

  // Keep selectedId in sync with URL (shareable deep link)
  useEffect(() => {
    const typeParam = searchParams.get('type')
    const idParam = searchParams.get('id')

    if (typeParam === 'customer') setView('customers')
    if (typeParam === 'helper') setView('helpers')

    if (idParam && idParam !== selectedId) setSelectedId(idParam)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchParams])

  // Load list when filters/view change
  useEffect(() => {
    refreshList()
    // When switching views, clear stale details unless URL has id
    const urlId = searchParams.get('id')
    if (!urlId) {
      setSelectedId(null)
      setDetails(null)
      setDetailsError(null)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [view, statusFilter, verificationFilter])

  // Load details when selectedId changes
  useEffect(() => {
    if (!selectedId) return
    refreshDetails(selectedId)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedId, view])

  const customerColumns = useMemo(
    () => [
      { key: 'email', label: 'Email', sortable: true },
      { key: 'full_name', label: 'Name', sortable: true },
      { key: 'phone', label: 'Phone', sortable: true },
      {
        key: 'city',
        label: 'Location',
        sortable: true,
        render: (u: ListCustomer) => {
          const city = u.city || ''
          const state = u.state || ''
          return city && state ? `${city}, ${state}` : city || state || '—'
        },
      },
      { key: 'status', label: 'Status', sortable: true },
      { key: 'created_at', label: 'Created', sortable: true, render: (u: ListCustomer) => fmtDate(u.created_at) },
    ],
    []
  )

  const helperColumns = useMemo(
    () => [
      { key: 'email', label: 'Email', sortable: true },
      { key: 'full_name', label: 'Name', sortable: true },
      { key: 'phone', label: 'Phone', sortable: true },
      {
        key: 'city',
        label: 'Location',
        sortable: true,
        render: (u: ListHelper) => {
          const city = u.city || ''
          const state = u.state || ''
          return city && state ? `${city}, ${state}` : city || state || '—'
        },
      },
      {
        key: 'verification_status',
        label: 'Verification',
        sortable: true,
        render: (u: ListHelper) => valueOrDash(u.helper_profiles?.verification_status),
      },
      {
        key: 'is_approved',
        label: 'Approved',
        sortable: true,
        render: (u: ListHelper) => (u.helper_profiles?.is_approved ? 'Yes' : 'No'),
      },
      { key: 'status', label: 'Status', sortable: true },
      { key: 'created_at', label: 'Created', sortable: true, render: (u: ListHelper) => fmtDate(u.created_at) },
    ],
    []
  )

  function onRowClick(item: ListCustomer | ListHelper) {
    const nextId = item.id
    setSelectedId(nextId)
    const url = `/admin/analytics/user-details?type=${selectedTypeParam}&id=${encodeURIComponent(nextId)}`
    router.push(url)
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white">User Details</h1>
          <p className="text-slate-600 dark:text-slate-400 text-sm">
            A-to-Z view: security, sessions, referrals, orders, payments, and location.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={() => setView('customers')}
            className={`px-3 py-2 rounded-lg text-sm font-medium border transition-colors ${
              view === 'customers'
                ? 'bg-primary-500 text-white border-primary-500'
                : 'bg-white/80 dark:bg-slate-800/80 text-slate-800 dark:text-slate-200 border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700'
            }`}
          >
            <span className="inline-flex items-center gap-2"><Users className="w-4 h-4" /> Customers</span>
          </button>
          <button
            onClick={() => setView('helpers')}
            className={`px-3 py-2 rounded-lg text-sm font-medium border transition-colors ${
              view === 'helpers'
                ? 'bg-primary-500 text-white border-primary-500'
                : 'bg-white/80 dark:bg-slate-800/80 text-slate-800 dark:text-slate-200 border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700'
            }`}
          >
            <span className="inline-flex items-center gap-2"><User className="w-4 h-4" /> Helpers</span>
          </button>

          <button
            onClick={refreshList}
            className="px-3 py-2 rounded-lg text-sm font-medium border bg-white/80 dark:bg-slate-800/80 text-slate-800 dark:text-slate-200 border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700 inline-flex items-center gap-2"
          >
            <RefreshCw className="w-4 h-4" /> Refresh
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-5 gap-6">
        <div className="xl:col-span-2 space-y-4">
          <Section title="Filters" icon={<Shield className="w-4 h-4 text-slate-500" />}>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1">Status</label>
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  className="w-full px-3 py-2 text-sm bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                >
                  <option value="all">All</option>
                  <option value="active">Active</option>
                  <option value="inactive">Inactive</option>
                  <option value="banned">Banned</option>
                </select>
              </div>

              {view === 'helpers' && (
                <div>
                  <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1">Verification</label>
                  <select
                    value={verificationFilter}
                    onChange={(e) => setVerificationFilter(e.target.value)}
                    className="w-full px-3 py-2 text-sm bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                  >
                    <option value="all">All</option>
                    <option value="pending">Pending</option>
                    <option value="verified">Verified</option>
                    <option value="rejected">Rejected</option>
                  </select>
                </div>
              )}
            </div>

            {listError && (
              <div className="mt-3 text-sm text-red-600 dark:text-red-400 flex items-center gap-2">
                <AlertCircle className="w-4 h-4" /> {listError}
              </div>
            )}
          </Section>

          <DataTable
            data={view === 'customers' ? customers : helpers}
            columns={view === 'customers' ? customerColumns : helperColumns}
            onRowClick={onRowClick}
            loading={loadingList}
            emptyMessage={view === 'customers' ? 'No customers found' : 'No helpers found'}
            itemsPerPage={20}
            pageSizeOptions={[10, 20, 50, 100, 200]}
          />
        </div>

        <div className="xl:col-span-3 space-y-4">
          {!selectedId ? (
            <Section title="User details" icon={<User className="w-4 h-4 text-slate-500" />}>
              <div className="text-sm text-slate-600 dark:text-slate-400">
                Select a {view === 'customers' ? 'customer' : 'helper'} from the list to see the full details.
              </div>
            </Section>
          ) : loadingDetails ? (
            <Section title="Loading" icon={<RefreshCw className="w-4 h-4 text-slate-500" />}>
              <div className="text-sm text-slate-600 dark:text-slate-400">Loading user details…</div>
            </Section>
          ) : detailsError ? (
            <Section title="Error" icon={<AlertCircle className="w-4 h-4 text-red-500" />}>
              <div className="text-sm text-red-600 dark:text-red-400">{detailsError}</div>
            </Section>
          ) : !details ? (
            <Section title="Not found" icon={<AlertCircle className="w-4 h-4 text-slate-500" />}>
              <div className="text-sm text-slate-600 dark:text-slate-400">No details available.</div>
            </Section>
          ) : (
            <>
              <Section title="Profile" icon={<User className="w-4 h-4 text-slate-500" />}>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <div className="text-sm"><span className="text-slate-500">Name:</span> <span className="font-medium">{valueOrDash(details.full_name)}</span></div>
                    <div className="text-sm"><span className="text-slate-500">Email:</span> <span className="font-medium">{valueOrDash(details.email)}</span></div>
                    <div className="text-sm"><span className="text-slate-500">Phone:</span> <span className="font-medium">{valueOrDash(details.phone)}</span></div>
                    <div className="text-sm"><span className="text-slate-500">Role:</span> <Pill label={details.role} /></div>
                  </div>
                  <div className="space-y-2">
                    <div className="text-sm"><span className="text-slate-500">Status:</span> <span className="font-medium">{valueOrDash(details.status)}</span></div>
                    <div className="text-sm"><span className="text-slate-500">Banned:</span> <span className="font-medium">{details.is_banned ? 'Yes' : 'No'}</span></div>
                    <div className="text-sm"><span className="text-slate-500">Created:</span> <span className="font-medium">{fmtDate(details.created_at)}</span></div>
                    <div className="text-sm"><span className="text-slate-500">Updated:</span> <span className="font-medium">{fmtDate(details.updated_at)}</span></div>
                  </div>
                </div>

                <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="rounded-lg border border-slate-200 dark:border-slate-700 p-3">
                    <div className="text-xs text-slate-500">User ID</div>
                    <div className="text-sm font-mono break-all text-slate-900 dark:text-slate-100">{details.id}</div>
                  </div>
                  <div className="rounded-lg border border-slate-200 dark:border-slate-700 p-3">
                    <div className="text-xs text-slate-500">Location</div>
                    <div className="text-sm text-slate-900 dark:text-slate-100">{[details.city, details.state].filter(Boolean).join(', ') || '—'}</div>
                    <div className="text-xs text-slate-500 mt-1">{valueOrDash(details.address)}</div>
                  </div>
                </div>
              </Section>

              {(details.location_lat != null && details.location_lng != null) && (
                <MapEmbed lat={details.location_lat} lng={details.location_lng} title="User profile location" />
              )}

              {'helper_profile_id' in details && (
                <Section title="Helper details" icon={<Users className="w-4 h-4 text-slate-500" />}>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <div className="text-sm"><span className="text-slate-500">Approved:</span> <span className="font-medium">{details.is_approved ? 'Yes' : 'No'}</span></div>
                      <div className="text-sm"><span className="text-slate-500">Verification:</span> <span className="font-medium">{valueOrDash(details.verification_status)}</span></div>
                      <div className="text-sm"><span className="text-slate-500">Online:</span> <span className="font-medium">{details.is_online ? 'Yes' : 'No'}</span></div>
                      <div className="text-sm"><span className="text-slate-500">Hourly rate:</span> <span className="font-medium">{details.hourly_rate != null ? `₹${details.hourly_rate}` : '—'}</span></div>
                    </div>
                    <div className="space-y-2">
                      <div className="text-sm"><span className="text-slate-500">Service radius:</span> <span className="font-medium">{details.service_radius != null ? `${details.service_radius} km` : '—'}</span></div>
                      <div className="text-sm"><span className="text-slate-500">Experience:</span> <span className="font-medium">{details.experience_years != null ? `${details.experience_years} yrs` : '—'}</span></div>
                      <div className="text-sm"><span className="text-slate-500">Avg rating:</span> <span className="font-medium">{details.average_rating}</span></div>
                      <div className="text-sm"><span className="text-slate-500">Total earnings:</span> <span className="font-medium">₹{details.total_earnings.toLocaleString()}</span></div>
                    </div>
                  </div>

                  <div className="mt-4 flex flex-wrap gap-2">
                    {(details.service_categories || []).slice(0, 20).map((c) => (
                      <Pill key={c} label={c} />
                    ))}
                    {(details.skills || []).slice(0, 20).map((s) => (
                      <Pill key={s} label={s} />
                    ))}
                  </div>
                </Section>
              )}

              <Section title="Security & sessions" icon={<Shield className="w-4 h-4 text-slate-500" />}>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div className="rounded-lg border border-slate-200 dark:border-slate-700 p-3">
                    <div className="text-xs text-slate-500">Last login</div>
                    <div className="text-sm font-medium">{fmtDate(details.last_login_at)}</div>
                    <div className="text-xs text-slate-500 mt-1">IP: {valueOrDash(details.last_login_ip)}</div>
                  </div>
                  <div className="rounded-lg border border-slate-200 dark:border-slate-700 p-3">
                    <div className="text-xs text-slate-500">Total sessions</div>
                    <div className="text-sm font-medium">{details.total_sessions}</div>
                    <div className="text-xs text-slate-500 mt-1">Failed attempts (recent): {details.failed_login_attempts}</div>
                  </div>
                  <div className="rounded-lg border border-slate-200 dark:border-slate-700 p-3">
                    <div className="text-xs text-slate-500">App tokens</div>
                    <div className="text-sm font-medium">{details.device_tokens?.length || 0}</div>
                    <div className="text-xs text-slate-500 mt-1">Installed: {details.has_app_installed ? 'Yes' : 'No'}</div>
                  </div>
                </div>

                <div className="mt-4 grid grid-cols-1 gap-4">
                  <div>
                    <div className="text-sm font-semibold text-slate-900 dark:text-slate-100 mb-2">Active sessions</div>
                    <DataTable
                      data={details.active_sessions}
                      searchable
                      itemsPerPage={10}
                      columns={[
                        { key: 'created_at', label: 'Created', sortable: true, render: (s: { created_at: string }) => fmtDate(s.created_at) },
                        { key: 'device_name', label: 'Device', sortable: true },
                        { key: 'browser', label: 'Browser', sortable: true, render: (s: { browser: unknown }) => valueOrDash(s.browser) },
                        { key: 'os', label: 'OS', sortable: true, render: (s: { os: unknown }) => valueOrDash(s.os) },
                        { key: 'ip_address', label: 'IP', sortable: true, render: (s: { ip_address: unknown }) => valueOrDash(s.ip_address) },
                        { key: 'location', label: 'Location', sortable: true, render: (s: { location: unknown }) => valueOrDash(s.location) },
                        { key: 'revoked', label: 'Revoked', sortable: true, render: (s: { revoked: boolean }) => (s.revoked ? 'Yes' : 'No') },
                      ]}
                      emptyMessage="No sessions"
                    />
                  </div>

                  <div>
                    <div className="text-sm font-semibold text-slate-900 dark:text-slate-100 mb-2">Login attempts</div>
                    <DataTable
                      data={details.login_history}
                      searchable
                      itemsPerPage={10}
                      columns={[
                        { key: 'created_at', label: 'When', sortable: true, render: (l: { created_at: string }) => fmtDate(l.created_at) },
                        { key: 'success', label: 'Success', sortable: true, render: (l: { success?: boolean }) => (l.success ? 'Yes' : 'No') },
                        { key: 'ip_address', label: 'IP', sortable: true, render: (l: { ip_address: unknown }) => valueOrDash(l.ip_address) },
                        { key: 'location', label: 'Location', sortable: true, render: (l: { location: unknown }) => valueOrDash(l.location) },
                        { key: 'failure_reason', label: 'Reason', sortable: true, render: (l: { failure_reason?: unknown }) => valueOrDash(l.failure_reason) },
                      ]}
                      emptyMessage="No login attempts"
                    />
                  </div>
                </div>
              </Section>

              <Section title="Orders & payments" icon={<Users className="w-4 h-4 text-slate-500" />}>
                <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
                  <div className="rounded-lg border border-slate-200 dark:border-slate-700 p-3">
                    <div className="text-xs text-slate-500">Total orders</div>
                    <div className="text-sm font-medium">{details.total_orders}</div>
                  </div>
                  <div className="rounded-lg border border-slate-200 dark:border-slate-700 p-3">
                    <div className="text-xs text-slate-500">Completed</div>
                    <div className="text-sm font-medium">{details.completed_orders}</div>
                  </div>
                  <div className="rounded-lg border border-slate-200 dark:border-slate-700 p-3">
                    <div className="text-xs text-slate-500">Pending</div>
                    <div className="text-sm font-medium">{details.pending_orders}</div>
                  </div>
                  <div className="rounded-lg border border-slate-200 dark:border-slate-700 p-3">
                    <div className="text-xs text-slate-500">Total spent/earned</div>
                    <div className="text-sm font-medium">₹{details.total_spent.toLocaleString()}</div>
                  </div>
                </div>

                <div className="mt-4">
                  <DataTable
                    data={details.orders}
                    searchable
                    itemsPerPage={10}
                    columns={[
                      { key: 'created_at', label: 'Created', sortable: true, render: (o: { created_at: string }) => fmtDate(o.created_at) },
                      { key: 'title', label: 'Title', sortable: true },
                      { key: 'status', label: 'Status', sortable: true },
                      { key: 'payment_status', label: 'Pay status', sortable: true, render: (o: { payment_status: unknown }) => valueOrDash(o.payment_status) },
                      { key: 'payment_method', label: 'Method', sortable: true, render: (o: { payment_method: unknown }) => valueOrDash(o.payment_method) },
                      {
                        key: 'final_price',
                        label: 'Amount',
                        sortable: true,
                        render: (o: { final_price: unknown }) => {
                          const n = asNumber(o.final_price)
                          return n == null ? '—' : `₹${n.toLocaleString()}`
                        },
                      },
                      { key: 'helper_name', label: 'Helper', sortable: true, render: (o: { helper_name: unknown }) => valueOrDash(o.helper_name) },
                    ]}
                    emptyMessage="No orders"
                  />
                </div>
              </Section>

              {'helper_profile_id' in details && (
                <>
                  {(details.current_location_lat != null && details.current_location_lng != null) && (
                    <>
                      <Section title="Helper current location" icon={<MapPin className="w-4 h-4 text-slate-500" />}>
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                          <div className="rounded-lg border border-slate-200 dark:border-slate-700 p-3">
                            <div className="text-xs text-slate-500">Lat</div>
                            <div className="text-sm font-medium">{valueOrDash(details.current_location_lat)}</div>
                          </div>
                          <div className="rounded-lg border border-slate-200 dark:border-slate-700 p-3">
                            <div className="text-xs text-slate-500">Lng</div>
                            <div className="text-sm font-medium">{valueOrDash(details.current_location_lng)}</div>
                          </div>
                          <div className="rounded-lg border border-slate-200 dark:border-slate-700 p-3">
                            <div className="text-xs text-slate-500">Updated</div>
                            <div className="text-sm font-medium">{fmtDate(details.current_location_updated_at)}</div>
                          </div>
                        </div>
                      </Section>
                      <MapEmbed
                        lat={details.current_location_lat}
                        lng={details.current_location_lng}
                        title="Current helper location"
                      />
                    </>
                  )}

                  <Section title="Helper roaming / location history" icon={<MapPin className="w-4 h-4 text-slate-500" />}>
                    <div className="text-sm text-slate-600 dark:text-slate-400 mb-3">
                      Showing last {(details.location_history || []).length} recorded points.
                    </div>
                    <DataTable
                      data={(details.location_history || []).map((p) => ({
                        ...p,
                        id: `${p.recorded_at}-${p.latitude}-${p.longitude}`
                      }))}
                      searchable
                      itemsPerPage={10}
                      columns={[
                        { key: 'recorded_at', label: 'When', sortable: true, render: (p: { recorded_at: string }) => fmtDate(p.recorded_at) },
                        { key: 'latitude', label: 'Lat', sortable: true, render: (p: { latitude: unknown }) => valueOrDash(p.latitude) },
                        { key: 'longitude', label: 'Lng', sortable: true, render: (p: { longitude: unknown }) => valueOrDash(p.longitude) },
                        { key: 'request_id', label: 'Request', sortable: true, render: (p: { request_id: unknown }) => valueOrDash(p.request_id) },
                      ]}
                      emptyMessage="No location history (or admin access not enabled)"
                    />
                  </Section>

                  {(() => {
                    const last = (details.location_history || [])[0]
                    if (!last?.latitude || !last?.longitude) return null
                    return <MapEmbed lat={last.latitude} lng={last.longitude} title="Last recorded helper location" />
                  })()}
                </>
              )}

              <Section title="Referrals" icon={<Users className="w-4 h-4 text-slate-500" />}>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div className="rounded-lg border border-slate-200 dark:border-slate-700 p-3">
                    <div className="text-xs text-slate-500">Total referrals</div>
                    <div className="text-sm font-medium">{details.total_referrals}</div>
                  </div>
                  <div className="rounded-lg border border-slate-200 dark:border-slate-700 p-3">
                    <div className="text-xs text-slate-500">Successful</div>
                    <div className="text-sm font-medium">{details.successful_referrals}</div>
                  </div>
                  <div className="rounded-lg border border-slate-200 dark:border-slate-700 p-3">
                    <div className="text-xs text-slate-500">Earnings</div>
                    <div className="text-sm font-medium">₹{details.referral_earnings.toLocaleString()}</div>
                    <div className="text-xs text-slate-500 mt-1">Referred by: {valueOrDash(details.referred_by)}</div>
                  </div>
                </div>

                <div className="mt-4">
                  <DataTable
                    data={details.referrals}
                    searchable
                    itemsPerPage={10}
                    columns={[
                      { key: 'created_at', label: 'Created', sortable: true, render: (r: { created_at: string }) => fmtDate(r.created_at) },
                      { key: 'referred_name', label: 'Name', sortable: true, render: (r: { referred_name: unknown }) => valueOrDash(r.referred_name) },
                      { key: 'referred_email', label: 'Email', sortable: true, render: (r: { referred_email: unknown }) => valueOrDash(r.referred_email) },
                      { key: 'referred_role', label: 'Role', sortable: true, render: (r: { referred_role: unknown }) => valueOrDash(r.referred_role) },
                      { key: 'status', label: 'Status', sortable: true },
                    ]}
                    emptyMessage="No referrals"
                  />
                </div>
              </Section>

              <Section title="Wallet & promo usage" icon={<Shield className="w-4 h-4 text-slate-500" />}>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div className="rounded-lg border border-slate-200 dark:border-slate-700 p-3">
                    <div className="text-xs text-slate-500">Wallet balance</div>
                    <div className="text-sm font-medium">₹{Number(details.wallet_balance || 0).toLocaleString()}</div>
                  </div>
                  <div className="rounded-lg border border-slate-200 dark:border-slate-700 p-3">
                    <div className="text-xs text-slate-500">Preferred payment</div>
                    <div className="text-sm font-medium">{valueOrDash(details.preferred_payment_method)}</div>
                  </div>
                  <div className="rounded-lg border border-slate-200 dark:border-slate-700 p-3">
                    <div className="text-xs text-slate-500">Promo uses</div>
                    <div className="text-sm font-medium">{details.promo_codes_used?.length || 0}</div>
                  </div>
                </div>

                <div className="mt-4">
                  <DataTable
                    data={(details.promo_codes_used || []).map((p) => ({
                      ...p,
                      id: `${p.code}-${p.used_at}`
                    }))}
                    searchable
                    itemsPerPage={10}
                    columns={[
                      { key: 'used_at', label: 'Used at', sortable: true, render: (p: { used_at: string }) => fmtDate(p.used_at) },
                      { key: 'code', label: 'Code', sortable: true },
                      {
                        key: 'discount_amount',
                        label: 'Discount',
                        sortable: true,
                        render: (p: { discount_amount: unknown }) => {
                          const n = asNumber(p.discount_amount) || 0
                          return `₹${n.toLocaleString()}`
                        },
                      },
                    ]}
                    emptyMessage="No promo usage"
                  />
                </div>
              </Section>
            </>
          )}
        </div>
      </div>
    </div>
  )
}
