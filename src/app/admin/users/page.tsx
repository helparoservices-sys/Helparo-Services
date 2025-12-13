'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { useSearchParams } from 'next/navigation'
import { Users as UsersIcon, UserCheck, Shield, Ban, CheckCircle, AlertCircle, MoreVertical, UserPlus, XCircle } from 'lucide-react'
import { DataTable } from '@/components/admin/DataTable'
import { Modal, ConfirmDialog } from '@/components/admin/Modal'
import { PageLoader } from '@/components/ui/loading'
import { useToast } from '@/components/ui/toast-notification'
import { updateUserRole, banUser, unbanUser, approveHelper } from '@/app/actions/admin'
import { createAdminUser } from '@/app/actions/admin-auth'
import { supabase } from '@/lib/supabase/client'

interface User {
  id: string
  full_name: string
  email: string
  phone: string
  role: string
  status: string
  is_banned: boolean
  ban_reason: string | null
  created_at: string
  helper_profiles: Array<{
    is_approved: boolean
    service_categories: string[]
  }> | null
}

export default function AdminUsersPage() {
  const searchParams = useSearchParams()
  const { showSuccess, showError } = useToast()
  const [loading, setLoading] = useState(true)
  const [users, setUsers] = useState<User[]>([])
  const [error, setError] = useState('')
  const [searchQuery, setSearchQuery] = useState('')
  const [roleFilter, setRoleFilter] = useState(searchParams.get('role') || 'all')
  const [statusFilter, setStatusFilter] = useState(searchParams.get('status') || 'all')
  const [actionLoading, setActionLoading] = useState<string | null>(null)
  const [showBanModal, setShowBanModal] = useState(false)
  const [showCreateAdminModal, setShowCreateAdminModal] = useState(false)
  const [selectedUser, setSelectedUser] = useState<User | null>(null)
  const [banReason, setBanReason] = useState('')
  const [banDuration, setBanDuration] = useState('7')
  
  // Create Admin form state
  const [adminForm, setAdminForm] = useState({
    full_name: '',
    email: '',
    phone: '',
    password: '',
    country_code: '+91' // Default to India
  })

  // Update filters when URL params change
  useEffect(() => {
    const roleParam = searchParams.get('role')
    const statusParam = searchParams.get('status')
    if (roleParam) setRoleFilter(roleParam)
    if (statusParam) setStatusFilter(statusParam)
  }, [searchParams])

  useEffect(() => {
    loadUsers()
  }, [roleFilter, statusFilter])

  const loadUsers = async () => {
    setLoading(true)
    setError('')

    try {
      // Optimized query with better caching
      let query = supabase
        .from('profiles')
        .select(`
          id, 
          full_name, 
          email, 
          phone,
          role,
          status,
          is_banned,
          ban_reason,
          created_at,
          helper_profiles!left (
            is_approved,
            service_categories
          )
        `, { count: 'exact' })

      if (roleFilter !== 'all') {
        query = query.eq('role', roleFilter)
      }

      // Apply status filter from URL
      if (statusFilter === 'active') {
        query = query.eq('status', 'active').eq('is_banned', false)
      } else if (statusFilter === 'suspended') {
        query = query.eq('status', 'suspended')
      } else if (statusFilter === 'banned') {
        query = query.eq('is_banned', true)
      }

      const { data, error: fetchError, count } = await query
        .order('created_at', { ascending: false })
        .limit(100)

      if (fetchError) {
        console.error('Supabase error:', fetchError)
        setError(fetchError.message)
      } else {
        setUsers((data as User[]) || [])
      }
    } catch (err: any) {
      console.error('Load users error:', err)
      setError(err.message || 'Failed to load users')
    } finally {
      setLoading(false)
    }
  }

  const handleRoleChange = async (userId: string, newRole: string) => {
    setActionLoading(userId)
    setError('')

    const result = await updateUserRole(userId, newRole)

    if ('error' in result && result.error) {
      setError(result.error)
    } else {
      await loadUsers()
    }

    setActionLoading(null)
  }

  const handleBan = async (userId: string) => {
    if (!banReason.trim()) {
      setError('Ban reason is required')
      return
    }

    setActionLoading(userId)
    setError('')

    try {
      // Calculate ban expiry date based on duration
      let banExpiresAt: string | null = null
      if (banDuration !== 'permanent') {
        const days = parseInt(banDuration)
        const expiryDate = new Date()
        expiryDate.setDate(expiryDate.getDate() + days)
        banExpiresAt = expiryDate.toISOString()
      }

      const { error } = await supabase
        .from('profiles')
        .update({
          is_banned: true,
          ban_reason: banReason.trim(),
          banned_at: new Date().toISOString(),
          ban_expires_at: banExpiresAt,
          status: 'banned' // Set status to banned
        })
        .eq('id', userId)

      if (error) throw error

      setShowBanModal(false)
      setSelectedUser(null)
      setBanReason('')
      setBanDuration('7')
      await loadUsers()
    } catch (err: any) {
      console.error('Ban user error:', err)
      setError(err.message || 'Failed to ban user')
    } finally {
      setActionLoading(null)
    }
  }

  const handleUnban = async (userId: string) => {
    setActionLoading(userId)
    setError('')

    try {
      const { error } = await supabase
        .from('profiles')
        .update({
          is_banned: false,
          ban_reason: null,
          banned_at: null,
          banned_by: null,
          ban_expires_at: null,
          status: 'active' // Activate when unbanning
        })
        .eq('id', userId)

      if (error) throw error

      await loadUsers()
    } catch (err: any) {
      console.error('Unban user error:', err)
      setError(err.message || 'Failed to unban user')
    } finally {
      setActionLoading(null)
    }
  }

  const handleSuspend = async (userId: string) => {
    setActionLoading(userId)
    setError('')

    try {
      const { data, error } = await supabase
        .from('profiles')
        .update({ status: 'suspended' })
        .eq('id', userId)
        .select()

      if (error) {
        console.error('Suspend error:', error)
        setError(error.message)
      } else {
        console.log('Suspend success:', data)
        await loadUsers()
      }
    } catch (err: any) {
      console.error('Suspend exception:', err)
      setError(err.message || 'Failed to suspend user')
    } finally {
      setActionLoading(null)
    }
  }

  const handleActivate = async (userId: string) => {
    setActionLoading(userId)
    setError('')

    try {
      const { data, error } = await supabase
        .from('profiles')
        .update({ status: 'active' })
        .eq('id', userId)
        .select()

      if (error) {
        console.error('Activate error:', error)
        setError(error.message)
        showError('Activation Failed', error.message)
      } else {
        console.log('Activate success:', data)
        showSuccess('User Activated', 'User account has been activated successfully')
        await loadUsers()
      }
    } catch (err: any) {
      console.error('Activate exception:', err)
      setError(err.message || 'Failed to activate user')
      showError('Activation Failed', err.message || 'Failed to activate user')
    } finally {
      setActionLoading(null)
    }
  }

  const handleDeactivate = async (userId: string) => {
    setActionLoading(userId)
    setError('')

    try {
      const { data, error } = await supabase
        .from('profiles')
        .update({ status: 'inactive' })
        .eq('id', userId)
        .select()

      if (error) {
        console.error('Deactivate error:', error)
        setError(error.message)
        showError('Deactivation Failed', error.message)
      } else {
        console.log('Deactivate success:', data)
        showSuccess('User Deactivated', 'User account has been deactivated successfully')
        await loadUsers()
      }
    } catch (err: any) {
      console.error('Deactivate exception:', err)
      setError(err.message || 'Failed to deactivate user')
      showError('Deactivation Failed', err.message || 'Failed to deactivate user')
    } finally {
      setActionLoading(null)
    }
  }

  const handleCreateAdmin = async () => {
    if (!adminForm.full_name || !adminForm.email || !adminForm.phone || !adminForm.password) {
      setError('All fields are required')
      return
    }

    if (adminForm.password.length < 6) {
      setError('Password must be at least 6 characters')
      return
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(adminForm.email.trim())) {
      setError('Please enter a valid email address')
      return
    }

    setActionLoading('create-admin')
    setError('')

    try {
      // Use server action to create admin (bypasses email confirmation)
      const result = await createAdminUser({
        email: adminForm.email,
        password: adminForm.password,
        full_name: adminForm.full_name,
        phone: adminForm.phone,
        country_code: adminForm.country_code,
      })

      if ('error' in result && result.error) {
        throw new Error(result.error)
      }

      // Reset form and close modal
      setAdminForm({ full_name: '', email: '', phone: '', password: '', country_code: '+91' })
      setShowCreateAdminModal(false)
      
      // Reload users
      await loadUsers()
      
      setError('')
      showSuccess('Admin Created', 'Admin account created successfully!')
    } catch (err: any) {
      console.error('Create admin error:', err)
      showError('Creation Failed', err.message || 'Failed to create admin account')
      setError(err.message || 'Failed to create admin account')
    } finally {
      setActionLoading(null)
    }
  }

  const handleApproveHelper = async (userId: string) => {
    setActionLoading(userId)
    setError('')

    try {
      // Update helper_profiles table
      const { error: helperError } = await supabase
        .from('helper_profiles')
        .update({
          is_approved: true,
          verification_status: 'verified',
          updated_at: new Date().toISOString()
        })
        .eq('user_id', userId)

      if (helperError) throw helperError

      // Also update the profiles table status to active
      const { error: profileError } = await supabase
        .from('profiles')
        .update({
          status: 'active'
        })
        .eq('id', userId)

      if (profileError) throw profileError

      await loadUsers()
    } catch (err: any) {
      console.error('Approve helper error:', err)
      setError(err.message || 'Failed to approve helper')
    } finally {
      setActionLoading(null)
    }
  }

  const filteredUsers = users.filter(user => {
    // Search filter
    if (searchQuery) {
      const query = searchQuery.toLowerCase()
      const matchesSearch = (
        user.full_name?.toLowerCase().includes(query) ||
        user.email?.toLowerCase().includes(query) ||
        user.phone?.includes(query)
      )
      if (!matchesSearch) return false
    }

    // Status filter
    if (statusFilter !== 'all') {
      if (statusFilter === 'banned' && !user.is_banned) return false
      if (statusFilter !== 'banned' && user.status !== statusFilter) return false
    }

    return true
  })

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="flex flex-col items-center gap-4">
          <div className="w-8 h-8 border-4 border-primary-600 border-t-transparent rounded-full animate-spin" />
          <p className="text-slate-700 dark:text-slate-300 font-medium">Loading users...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-slate-900 dark:text-white">User Management</h1>
          <p className="text-slate-600 dark:text-slate-400 mt-1">Manage user roles, approve helpers, and moderate accounts</p>
        </div>
        <button
          onClick={() => setShowCreateAdminModal(true)}
          className="flex items-center gap-2 px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg transition-colors font-medium"
        >
          <UserPlus className="h-5 w-5" />
          Create Admin
        </button>
      </div>

      {error && (
        <div className="rounded-lg bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 p-4">
          <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
        </div>
      )}

      {/* Stats Cards */}
      <div className="grid gap-6 md:grid-cols-6">
        <div className="bg-white/80 dark:bg-slate-800/80 backdrop-blur-xl rounded-lg p-6 border border-white/20 dark:border-slate-700/50 shadow-lg">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-slate-600 dark:text-slate-400">Total Users</p>
              <p className="text-3xl font-bold text-slate-900 dark:text-white mt-2">{users.length}</p>
            </div>
            <div className="w-12 h-12 rounded-lg bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center">
              <UsersIcon className="h-6 w-6 text-blue-600 dark:text-blue-400" />
            </div>
          </div>
        </div>

        <div className="bg-white/80 dark:bg-slate-800/80 backdrop-blur-xl rounded-lg p-6 border border-white/20 dark:border-slate-700/50 shadow-lg">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-slate-600 dark:text-slate-400">Customers</p>
              <p className="text-3xl font-bold text-slate-900 dark:text-white mt-2">{users.filter(u => u.role === 'customer').length}</p>
            </div>
            <div className="w-12 h-12 rounded-lg bg-green-100 dark:bg-green-900/30 flex items-center justify-center">
              <UserCheck className="h-6 w-6 text-green-600 dark:text-green-400" />
            </div>
          </div>
        </div>

        <div className="bg-white/80 dark:bg-slate-800/80 backdrop-blur-xl rounded-lg p-6 border border-white/20 dark:border-slate-700/50 shadow-lg">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-slate-600 dark:text-slate-400">Helpers</p>
              <p className="text-3xl font-bold text-slate-900 dark:text-white mt-2">{users.filter(u => u.role === 'helper').length}</p>
            </div>
            <div className="w-12 h-12 rounded-lg bg-purple-100 dark:bg-purple-900/30 flex items-center justify-center">
              <Shield className="h-6 w-6 text-purple-600 dark:text-purple-400" />
            </div>
          </div>
        </div>

        <div className="bg-white/80 dark:bg-slate-800/80 backdrop-blur-xl rounded-lg p-6 border border-white/20 dark:border-slate-700/50 shadow-lg">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-slate-600 dark:text-slate-400">Inactive</p>
              <p className="text-3xl font-bold text-slate-900 dark:text-white mt-2">{users.filter(u => u.status === 'inactive').length}</p>
            </div>
            <div className="w-12 h-12 rounded-lg bg-gray-100 dark:bg-gray-900/30 flex items-center justify-center">
              <XCircle className="h-6 w-6 text-gray-600 dark:text-gray-400" />
            </div>
          </div>
        </div>

        <div className="bg-white/80 dark:bg-slate-800/80 backdrop-blur-xl rounded-lg p-6 border border-white/20 dark:border-slate-700/50 shadow-lg">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-slate-600 dark:text-slate-400">Suspended</p>
              <p className="text-3xl font-bold text-slate-900 dark:text-white mt-2">{users.filter(u => u.status === 'suspended').length}</p>
            </div>
            <div className="w-12 h-12 rounded-lg bg-orange-100 dark:bg-orange-900/30 flex items-center justify-center">
              <AlertCircle className="h-6 w-6 text-orange-600 dark:text-orange-400" />
            </div>
          </div>
        </div>

        <div className="bg-white/80 dark:bg-slate-800/80 backdrop-blur-xl rounded-lg p-6 border border-white/20 dark:border-slate-700/50 shadow-lg">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-slate-600 dark:text-slate-400">Banned</p>
              <p className="text-3xl font-bold text-slate-900 dark:text-white mt-2">{users.filter(u => u.is_banned).length}</p>
            </div>
            <div className="w-12 h-12 rounded-lg bg-red-100 dark:bg-red-900/30 flex items-center justify-center">
              <Ban className="h-6 w-6 text-red-600 dark:text-red-400" />
            </div>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white/80 dark:bg-slate-800/80 backdrop-blur-xl rounded-lg p-6 border border-white/20 dark:border-slate-700/50 shadow-lg">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <label className="text-sm font-medium text-slate-700 dark:text-slate-300">Filter by Role</label>
            <select
              value={roleFilter}
              onChange={(e) => setRoleFilter(e.target.value)}
              className="w-full px-4 py-2 bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 text-sm"
            >
              <option value="all">All Roles</option>
              <option value="customer">Customers</option>
              <option value="helper">Helpers</option>
              <option value="admin">Admins</option>
            </select>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium text-slate-700 dark:text-slate-300">Filter by Status</label>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="w-full px-4 py-2 bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 text-sm"
            >
              <option value="all">All Status</option>
              <option value="active">Active</option>
              <option value="suspended">Suspended</option>
              <option value="inactive">Inactive</option>
              <option value="banned">Banned</option>
            </select>
          </div>
        </div>
      </div>

      {/* Users Table */}
      <DataTable
        data={filteredUsers}
        searchPlaceholder="Search by name, email, or phone..."
        columns={[
          {
            key: 'full_name',
            label: 'Name',
            sortable: true,
            render: (user) => (
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-primary-500 to-primary-600 flex items-center justify-center text-white font-semibold">
                  {user.full_name?.charAt(0).toUpperCase() || 'U'}
                </div>
                <div>
                  <div className="font-medium text-slate-900 dark:text-white flex items-center gap-2">
                    {user.full_name || 'Unnamed User'}
                    {user.is_banned && (
                      <Ban className="h-4 w-4 text-red-600" />
                    )}
                  </div>
                  <div className="text-sm text-slate-600 dark:text-slate-400">{user.email}</div>
                </div>
              </div>
            )
          },
          {
            key: 'phone',
            label: 'Phone',
            render: (user) => user.phone || '-'
          },
          {
            key: 'role',
            label: 'Role',
            sortable: true,
            render: (user) => (
              <span className={`inline-flex px-3 py-1 rounded-full text-xs font-medium ${
                user.role === 'admin' ? 'bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-400' :
                user.role === 'helper' ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400' :
                'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400'
              }`}>
                {user.role}
              </span>
            )
          },
          {
            key: 'status',
            label: 'Status',
            render: (user) => {
              // Check if helper has incomplete onboarding (no helper_profile record)
              const hasIncompleteOnboarding = user.role === 'helper' && (!user.helper_profiles || user.helper_profiles.length === 0)

              return (
                <div className="flex flex-wrap items-center gap-2">
                  {/* Incomplete Onboarding Badge - Show FIRST for helpers with no profile */}
                  {hasIncompleteOnboarding && (
                    <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-400 whitespace-nowrap">
                      <AlertCircle className="h-3 w-3" />
                      Incomplete Onboarding
                    </span>
                  )}

                  {/* Account Status Badge - Always show */}
                  <span className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-medium whitespace-nowrap ${
                    user.status === 'active' ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400' :
                    user.status === 'suspended' ? 'bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-400' :
                    user.status === 'banned' ? 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400' :
                    'bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-400'
                  }`}>
                    {user.status === 'active' && <CheckCircle className="h-3 w-3" />}
                    {user.status === 'suspended' && <AlertCircle className="h-3 w-3" />}
                    {user.status === 'banned' && <Ban className="h-3 w-3" />}
                    {user.status.charAt(0).toUpperCase() + user.status.slice(1)}
                  </span>

                  {/* Banned Badge - Only if user is banned */}
                  {user.is_banned && (
                    <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400 whitespace-nowrap">
                      <Ban className="h-3 w-3" />
                      Banned
                    </span>
                  )}

                  {/* Helper Approval Badge - Only for helpers who are NOT approved yet */}
                  {user.role === 'helper' && user.helper_profiles && user.helper_profiles.length > 0 && !user.helper_profiles[0]?.is_approved && (
                    <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400 whitespace-nowrap">
                      <AlertCircle className="h-3 w-3" />
                      Pending Approval
                    </span>
                  )}
                </div>
              )
            }
          },
          {
            key: 'created_at',
            label: 'Joined',
            sortable: true,
            render: (user) => new Date(user.created_at).toLocaleDateString()
          }
        ]}
        actions={(user) => {
          // Check if helper has incomplete onboarding (no helper_profile record)
          const hasIncompleteOnboarding = user.role === 'helper' && (!user.helper_profiles || user.helper_profiles.length === 0)

          // If user has incomplete onboarding, show nothing or a message
          if (hasIncompleteOnboarding) {
            return (
              <span className="text-xs text-slate-500 dark:text-slate-400 italic">No actions available</span>
            )
          }

          return (
            <div className="flex items-center gap-2">
              {/* Show Approve button ONLY for helpers who have NOT been approved yet */}
              {user.role === 'helper' && user.helper_profiles && user.helper_profiles.length > 0 && !user.helper_profiles[0]?.is_approved && (
                <button
                  onClick={() => handleApproveHelper(user.id)}
                  disabled={actionLoading === user.id}
                  className="px-3 py-1.5 text-xs font-medium text-green-700 bg-green-100 dark:bg-green-900/30 dark:text-green-400 rounded-lg hover:bg-green-200 dark:hover:bg-green-900/50 transition-colors disabled:opacity-50 whitespace-nowrap"
                >
                  Approve
                </button>
              )}
              
              {/* Suspend/Activate/Deactivate Buttons - Only show if not banned */}
              {!user.is_banned && (
                <>
                  {user.status === 'suspended' || user.status === 'inactive' ? (
                    <button
                      onClick={() => handleActivate(user.id)}
                      disabled={actionLoading === user.id}
                      className="px-3 py-1.5 text-xs font-medium text-green-700 bg-green-100 dark:bg-green-900/30 dark:text-green-400 rounded-lg hover:bg-green-200 dark:hover:bg-green-900/50 transition-colors disabled:opacity-50 whitespace-nowrap"
                    >
                      Activate
                    </button>
                  ) : user.status === 'active' && (
                    <>
                      <button
                        onClick={() => handleSuspend(user.id)}
                        disabled={actionLoading === user.id}
                        className="px-3 py-1.5 text-xs font-medium text-orange-700 bg-orange-100 dark:bg-orange-900/30 dark:text-orange-400 rounded-lg hover:bg-orange-200 dark:hover:bg-orange-900/50 transition-colors disabled:opacity-50 whitespace-nowrap"
                      >
                        Suspend
                      </button>
                      <button
                        onClick={() => handleDeactivate(user.id)}
                        disabled={actionLoading === user.id}
                        className="px-3 py-1.5 text-xs font-medium text-slate-700 bg-slate-100 dark:bg-slate-900/30 dark:text-slate-400 rounded-lg hover:bg-slate-200 dark:hover:bg-slate-900/50 transition-colors disabled:opacity-50 whitespace-nowrap"
                      >
                        Deactivate
                      </button>
                    </>
                  )}
                </>
              )}

              {/* Ban/Unban Button */}
              {user.is_banned ? (
                <button
                  onClick={() => handleUnban(user.id)}
                  disabled={actionLoading === user.id}
                  className="px-3 py-1.5 text-xs font-medium text-green-700 bg-green-100 dark:bg-green-900/30 dark:text-green-400 rounded-lg hover:bg-green-200 dark:hover:bg-green-900/50 transition-colors disabled:opacity-50 whitespace-nowrap"
                >
                  Unban
                </button>
              ) : (
                <button
                  onClick={() => {
                    setSelectedUser(user)
                    setShowBanModal(true)
                  }}
                  disabled={actionLoading === user.id}
                  className="px-3 py-1.5 text-xs font-medium text-red-700 bg-red-100 dark:bg-red-900/30 dark:text-red-400 rounded-lg hover:bg-red-200 dark:hover:bg-red-900/50 transition-colors disabled:opacity-50 whitespace-nowrap"
                >
                  Ban
                </button>
              )}

              <Link
                href={`/admin/users/${user.id}`}
                className="px-3 py-1.5 text-xs font-medium text-slate-700 dark:text-slate-300 bg-slate-100 dark:bg-slate-700 rounded-lg hover:bg-slate-200 dark:hover:bg-slate-600 transition-colors whitespace-nowrap"
              >
                View
              </Link>
            </div>
          )
        }}
        emptyMessage="No users found"
        emptyIcon={<UsersIcon className="h-12 w-12 text-slate-300 dark:text-slate-600" />}
        itemsPerPage={5}
      />

      {/* Ban Modal */}
      <Modal
        isOpen={showBanModal}
        onClose={() => {
          setShowBanModal(false)
          setSelectedUser(null)
          setBanReason('')
          setBanDuration('7')
        }}
        title="Ban User"
        size="md"
        footer={
          <>
            <button
              onClick={() => {
                setShowBanModal(false)
                setSelectedUser(null)
                setBanReason('')
                setBanDuration('7')
              }}
              disabled={actionLoading === selectedUser?.id}
              className="px-4 py-2 text-sm font-medium text-slate-700 dark:text-slate-300 bg-slate-100 dark:bg-slate-700 rounded-lg hover:bg-slate-200 dark:hover:bg-slate-600 transition-colors disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              onClick={() => selectedUser && handleBan(selectedUser.id)}
              disabled={actionLoading === selectedUser?.id || !banReason.trim()}
              className="px-4 py-2 text-sm font-medium text-white bg-red-600 rounded-lg hover:bg-red-700 transition-colors disabled:opacity-50 flex items-center gap-2"
            >
              Confirm Ban
            </button>
          </>
        }
      >
        {selectedUser && (
          <div className="space-y-4">
            <div className="p-4 bg-slate-50 dark:bg-slate-900/50 rounded-lg">
              <p className="text-sm font-medium text-slate-900 dark:text-white">{selectedUser.full_name}</p>
              <p className="text-xs text-slate-600 dark:text-slate-400">{selectedUser.email}</p>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-slate-700 dark:text-slate-300">Reason for Ban</label>
              <textarea
                value={banReason}
                onChange={(e) => setBanReason(e.target.value)}
                placeholder="Enter reason for banning this user..."
                className="w-full min-h-[100px] p-3 bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500 text-sm"
                required
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-slate-700 dark:text-slate-300">Duration</label>
              <select
                value={banDuration}
                onChange={(e) => setBanDuration(e.target.value)}
                className="w-full px-4 py-2 bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 text-sm"
              >
                <option value="7">7 Days</option>
                <option value="14">14 Days</option>
                <option value="30">30 Days</option>
                <option value="90">90 Days</option>
                <option value="permanent">Permanent</option>
              </select>
            </div>
          </div>
        )}
      </Modal>

      {/* Create Admin Modal */}
      <Modal
        isOpen={showCreateAdminModal}
        onClose={() => {
          setShowCreateAdminModal(false)
          setAdminForm({ full_name: '', email: '', phone: '', password: '', country_code: '+91' })
          setError('')
        }}
        title="Create New Admin Account"
        size="md"
        footer={
          <>
            <button
              onClick={() => {
                setShowCreateAdminModal(false)
                setAdminForm({ full_name: '', email: '', phone: '', password: '', country_code: '+91' })
                setError('')
              }}
              disabled={actionLoading === 'create-admin'}
              className="px-4 py-2 text-sm font-medium text-slate-700 dark:text-slate-300 bg-slate-100 dark:bg-slate-700 rounded-lg hover:bg-slate-200 dark:hover:bg-slate-600 transition-colors disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              onClick={handleCreateAdmin}
              disabled={actionLoading === 'create-admin'}
              className="px-4 py-2 text-sm font-medium text-white bg-purple-600 rounded-lg hover:bg-purple-700 transition-colors disabled:opacity-50 flex items-center gap-2"
            >
              {actionLoading === 'create-admin' ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  Creating...
                </>
              ) : (
                <>
                  <UserPlus className="h-4 w-4" />
                  Create Admin
                </>
              )}
            </button>
          </>
        }
      >
        <div className="space-y-4">
          <div className="space-y-2">
            <label className="text-sm font-medium text-slate-700 dark:text-slate-300">Full Name *</label>
            <input
              type="text"
              value={adminForm.full_name}
              onChange={(e) => setAdminForm({ ...adminForm, full_name: e.target.value })}
              placeholder="Enter full name"
              className="w-full px-4 py-2 bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 text-sm"
              required
            />
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium text-slate-700 dark:text-slate-300">Email *</label>
            <input
              type="email"
              value={adminForm.email}
              onChange={(e) => setAdminForm({ ...adminForm, email: e.target.value })}
              placeholder="admin@example.com"
              className="w-full px-4 py-2 bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 text-sm"
              required
            />
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium text-slate-700 dark:text-slate-300">Phone Number *</label>
            <div className="flex gap-2">
              <select
                value={adminForm.country_code}
                onChange={(e) => setAdminForm({ ...adminForm, country_code: e.target.value })}
                className="w-24 px-3 py-2 bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 text-sm"
              >
                <option value="+91">+91</option>
                <option value="+1">+1</option>
                <option value="+44">+44</option>
                <option value="+61">+61</option>
                <option value="+971">+971</option>
              </select>
              <input
                type="tel"
                value={adminForm.phone}
                onChange={(e) => setAdminForm({ ...adminForm, phone: e.target.value })}
                placeholder="1234567890"
                className="flex-1 px-4 py-2 bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 text-sm"
                required
              />
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium text-slate-700 dark:text-slate-300">Password *</label>
            <input
              type="password"
              value={adminForm.password}
              onChange={(e) => setAdminForm({ ...adminForm, password: e.target.value })}
              placeholder="Minimum 6 characters"
              className="w-full px-4 py-2 bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 text-sm"
              required
              minLength={6}
            />
            <p className="text-xs text-slate-500 dark:text-slate-400">Password must be at least 6 characters long</p>
          </div>
        </div>
      </Modal>
    </div>
  )
}
