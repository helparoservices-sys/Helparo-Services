'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { LoadingSpinner, SkeletonCard } from '@/components/ui/loading'
import { updateUserRole, banUser, unbanUser, approveHelper } from '@/app/actions/admin'

interface User {
  id: string
  full_name: string
  email: string
  phone: string
  role: string
  is_banned: boolean
  ban_reason: string | null
  created_at: string
  last_login_at: string | null
  helper_profiles: Array<{
    is_approved: boolean
    service_category: string
  }> | null
}

export default function AdminUsersPage() {
  const [loading, setLoading] = useState(true)
  const [users, setUsers] = useState<User[]>([])
  const [error, setError] = useState('')
  const [searchQuery, setSearchQuery] = useState('')
  const [roleFilter, setRoleFilter] = useState('all')
  const [actionLoading, setActionLoading] = useState<string | null>(null)
  const [showBanModal, setShowBanModal] = useState<string | null>(null)
  const [banReason, setBanReason] = useState('')
  const [banDuration, setBanDuration] = useState('7')

  useEffect(() => {
    loadUsers()
  }, [roleFilter])

  const loadUsers = async () => {
    setLoading(true)
    setError('')

    const { supabase } = await import('@/lib/supabase/client')
    const { data: { user } } = await supabase.auth.getUser()
    
    if (!user) {
      setError('Not authenticated')
      setLoading(false)
      return
    }

    let query = supabase
      .from('profiles')
      .select(`
        id, 
        full_name, 
        email, 
        phone, 
        role, 
        is_banned,
        ban_reason,
        created_at, 
        last_login_at,
        helper_profiles (
          is_approved,
          service_category
        )
      `)

    if (roleFilter !== 'all') {
      query = query.eq('role', roleFilter)
    }

    const { data, error: fetchError } = await query
      .order('created_at', { ascending: false })
      .limit(100)

    if (fetchError) {
      setError(fetchError.message)
    } else {
      setUsers((data as User[]) || [])
    }

    setLoading(false)
  }

  const handleRoleChange = async (userId: string, newRole: string) => {
    setActionLoading(userId)
    setError('')

    const result = await updateUserRole(userId, newRole)

    if (result.error) {
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

    const result = await banUser(userId, banReason, banDuration)

    if (result.error) {
      setError(result.error)
    } else {
      setShowBanModal(null)
      setBanReason('')
      setBanDuration('7')
      await loadUsers()
    }

    setActionLoading(null)
  }

  const handleUnban = async (userId: string) => {
    setActionLoading(userId)
    setError('')

    const result = await unbanUser(userId)

    if (result.error) {
      setError(result.error)
    } else {
      await loadUsers()
    }

    setActionLoading(null)
  }

  const handleApproveHelper = async (userId: string) => {
    setActionLoading(userId)
    setError('')

    const result = await approveHelper(userId)

    if (result.error) {
      setError(result.error)
    } else {
      await loadUsers()
    }

    setActionLoading(null)
  }

  const filteredUsers = users.filter(user => {
    if (!searchQuery) return true
    const query = searchQuery.toLowerCase()
    return (
      user.full_name?.toLowerCase().includes(query) ||
      user.email?.toLowerCase().includes(query) ||
      user.phone?.includes(query)
    )
  })

  return (
    <div className="min-h-screen bg-primary-50 py-10 px-4">
      <div className="mx-auto max-w-7xl space-y-6">
        <div>
          <h1 className="text-3xl font-bold">User Management</h1>
          <p className="text-muted-foreground">Manage user roles, approve helpers, and moderate accounts</p>
        </div>

        {error && (
          <div className="rounded-lg bg-red-50 border border-red-200 p-4">
            <p className="text-sm text-red-600">{error}</p>
          </div>
        )}

        {/* Filters */}
        <Card>
          <CardContent className="pt-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">Search Users</label>
                <Input
                  type="text"
                  placeholder="Search by name, email, or phone..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Filter by Role</label>
                <select
                  value={roleFilter}
                  onChange={(e) => setRoleFilter(e.target.value)}
                  className="w-full h-10 px-3 border rounded-md"
                >
                  <option value="all">All Roles</option>
                  <option value="customer">Customers</option>
                  <option value="helper">Helpers</option>
                  <option value="admin">Admins</option>
                </select>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Stats */}
        {!loading && (
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <Card>
              <CardContent className="pt-6 text-center">
                <div className="text-3xl font-bold text-primary">{users.length}</div>
                <div className="text-sm text-muted-foreground">Total Users</div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6 text-center">
                <div className="text-3xl font-bold text-blue-600">
                  {users.filter(u => u.role === 'customer').length}
                </div>
                <div className="text-sm text-muted-foreground">Customers</div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6 text-center">
                <div className="text-3xl font-bold text-green-600">
                  {users.filter(u => u.role === 'helper').length}
                </div>
                <div className="text-sm text-muted-foreground">Helpers</div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6 text-center">
                <div className="text-3xl font-bold text-red-600">
                  {users.filter(u => u.is_banned).length}
                </div>
                <div className="text-sm text-muted-foreground">Banned</div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Users List */}
        {loading ? (
          <div className="space-y-3">
            <SkeletonCard />
            <SkeletonCard />
            <SkeletonCard />
          </div>
        ) : filteredUsers.length === 0 ? (
          <Card>
            <CardContent className="py-12 text-center">
              <p className="text-muted-foreground">No users found</p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-3">
            {filteredUsers.map(user => (
              <Card key={user.id} className={user.is_banned ? 'border-red-200 bg-red-50' : ''}>
                <CardContent className="py-4">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1 space-y-1">
                      <div className="flex items-center gap-2">
                        <div className="font-semibold">{user.full_name || 'Unnamed User'}</div>
                        {user.is_banned && (
                          <span className="text-xs bg-red-100 text-red-700 px-2 py-0.5 rounded">
                            BANNED
                          </span>
                        )}
                        {user.role === 'helper' && user.helper_profiles && user.helper_profiles[0]?.is_approved && (
                          <span className="text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded">
                            ✓ APPROVED
                          </span>
                        )}
                        {user.role === 'helper' && user.helper_profiles && !user.helper_profiles[0]?.is_approved && (
                          <span className="text-xs bg-yellow-100 text-yellow-700 px-2 py-0.5 rounded">
                            PENDING
                          </span>
                        )}
                      </div>
                      
                      <div className="text-sm text-muted-foreground">
                        {user.email} {user.phone && `• ${user.phone}`}
                      </div>
                      
                      <div className="flex items-center gap-4 text-xs text-muted-foreground">
                        <span>Role: <span className="font-medium capitalize">{user.role}</span></span>
                        {user.helper_profiles && user.helper_profiles[0]?.service_category && (
                          <span>Category: <span className="font-medium">{user.helper_profiles[0].service_category}</span></span>
                        )}
                        <span>Joined: {new Date(user.created_at).toLocaleDateString()}</span>
                      </div>

                      {user.is_banned && user.ban_reason && (
                        <div className="text-xs text-red-600 mt-1">
                          Ban Reason: {user.ban_reason}
                        </div>
                      )}
                    </div>

                    <div className="flex items-center gap-2">
                      {user.role === 'helper' && user.helper_profiles && !user.helper_profiles[0]?.is_approved && (
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleApproveHelper(user.id)}
                          disabled={actionLoading === user.id}
                        >
                          {actionLoading === user.id ? (
                            <LoadingSpinner size="sm" />
                          ) : (
                            'Approve Helper'
                          )}
                        </Button>
                      )}

                      <select
                        value={user.role}
                        onChange={(e) => handleRoleChange(user.id, e.target.value)}
                        disabled={actionLoading === user.id}
                        className="h-9 px-3 border rounded-md text-sm"
                      >
                        <option value="customer">Customer</option>
                        <option value="helper">Helper</option>
                        <option value="admin">Admin</option>
                      </select>

                      {user.is_banned ? (
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleUnban(user.id)}
                          disabled={actionLoading === user.id}
                          className="text-green-600 border-green-600"
                        >
                          {actionLoading === user.id ? (
                            <LoadingSpinner size="sm" />
                          ) : (
                            'Unban'
                          )}
                        </Button>
                      ) : (
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => setShowBanModal(user.id)}
                          disabled={actionLoading === user.id}
                          className="text-red-600 border-red-600"
                        >
                          Ban
                        </Button>
                      )}

                      <Link href={`/admin/users/${user.id}`}>
                        <Button size="sm" variant="ghost">
                          View Details
                        </Button>
                      </Link>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {/* Ban Modal */}
        {showBanModal && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <Card className="w-full max-w-md">
              <CardHeader>
                <CardTitle>Ban User</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium">Reason for Ban</label>
                  <textarea
                    value={banReason}
                    onChange={(e) => setBanReason(e.target.value)}
                    placeholder="Enter reason..."
                    className="w-full min-h-[100px] p-3 border rounded-md"
                    required
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium">Duration</label>
                  <select
                    value={banDuration}
                    onChange={(e) => setBanDuration(e.target.value)}
                    className="w-full h-10 px-3 border rounded-md"
                  >
                    <option value="7">7 Days</option>
                    <option value="14">14 Days</option>
                    <option value="30">30 Days</option>
                    <option value="90">90 Days</option>
                    <option value="permanent">Permanent</option>
                  </select>
                </div>

                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    onClick={() => {
                      setShowBanModal(null)
                      setBanReason('')
                      setBanDuration('7')
                    }}
                    className="flex-1"
                    disabled={actionLoading === showBanModal}
                  >
                    Cancel
                  </Button>
                  <Button
                    onClick={() => handleBan(showBanModal)}
                    className="flex-1 bg-red-600 hover:bg-red-700"
                    disabled={actionLoading === showBanModal || !banReason.trim()}
                  >
                    {actionLoading === showBanModal ? (
                      <>
                        <LoadingSpinner size="sm" />
                        <span>Banning...</span>
                      </>
                    ) : (
                      'Confirm Ban'
                    )}
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        )}
      </div>
    </div>
  )
}
