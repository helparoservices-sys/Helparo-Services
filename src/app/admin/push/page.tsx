'use client'

import { useState, useEffect } from 'react'
import { Bell, Send, Users, UserCheck, Search, CheckCircle, AlertCircle, Loader2, RefreshCw } from 'lucide-react'

type TargetAudience = 'all' | 'customers' | 'helpers' | 'specific'

interface User {
  id: string
  full_name: string
  phone: string
  role: string
  has_token: boolean
}

export default function AdminPushNotificationsPage() {
  const [title, setTitle] = useState('')
  const [body, setBody] = useState('')
  const [targetAudience, setTargetAudience] = useState<TargetAudience>('all')
  const [searchQuery, setSearchQuery] = useState('')
  const [allUsers, setAllUsers] = useState<User[]>([])
  const [filteredUsers, setFilteredUsers] = useState<User[]>([])
  const [selectedUsers, setSelectedUsers] = useState<string[]>([])
  const [loading, setLoading] = useState(false)
  const [usersLoading, setUsersLoading] = useState(true)
  const [result, setResult] = useState<{ success: boolean; message: string } | null>(null)
  const [stats, setStats] = useState({ total: 0, customers: 0, helpers: 0 })
  const [roleFilter, setRoleFilter] = useState<'all' | 'customer' | 'helper'>('all')

  // Load stats and users on mount
  useEffect(() => {
    loadStats()
    loadAllUsers()
  }, [])

  // Filter users based on search and role
  useEffect(() => {
    let filtered = allUsers
    
    // Filter by role
    if (roleFilter !== 'all') {
      filtered = filtered.filter(u => u.role === roleFilter)
    }
    
    // Filter by search
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase()
      filtered = filtered.filter(u => 
        u.full_name.toLowerCase().includes(query) || 
        u.phone.toLowerCase().includes(query)
      )
    }
    
    setFilteredUsers(filtered)
  }, [allUsers, searchQuery, roleFilter])

  const loadStats = async () => {
    try {
      const res = await fetch('/api/admin/push/stats')
      if (res.ok) {
        const data = await res.json()
        setStats(data)
      }
    } catch (error) {
      console.error('Failed to load stats:', error)
    }
  }

  const loadAllUsers = async () => {
    setUsersLoading(true)
    try {
      const res = await fetch('/api/admin/push/users?all=true')
      if (res.ok) {
        const data = await res.json()
        setAllUsers(data.users || [])
      }
    } catch (error) {
      console.error('Failed to load users:', error)
    } finally {
      setUsersLoading(false)
    }
  }

  const toggleUser = (userId: string) => {
    setSelectedUsers(prev => 
      prev.includes(userId) 
        ? prev.filter(id => id !== userId)
        : [...prev, userId]
    )
  }

  const selectAll = () => {
    const usersWithTokens = filteredUsers.filter(u => u.has_token)
    if (selectedUsers.length === usersWithTokens.length) {
      setSelectedUsers([])
    } else {
      setSelectedUsers(usersWithTokens.map(u => u.id))
    }
  }

  const sendNotification = async () => {
    if (!title.trim()) {
      setResult({ success: false, message: 'Title is required' })
      return
    }

    if (targetAudience === 'specific' && selectedUsers.length === 0) {
      setResult({ success: false, message: 'Please select at least one user' })
      return
    }

    setLoading(true)
    setResult(null)

    try {
      const res = await fetch('/api/admin/push/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title,
          body,
          targetAudience,
          userIds: targetAudience === 'specific' ? selectedUsers : undefined
        })
      })

      const data = await res.json()

      if (res.ok) {
        setResult({ 
          success: true, 
          message: `Successfully sent to ${data.sent} device(s)${data.failed > 0 ? `, ${data.failed} failed` : ''}` 
        })
        // Reset form
        setTitle('')
        setBody('')
        setSelectedUsers([])
        // Refresh stats
        loadStats()
        loadAllUsers()
      } else {
        setResult({ success: false, message: data.error || 'Failed to send notifications' })
      }
    } catch (error) {
      setResult({ success: false, message: 'Network error. Please try again.' })
    } finally {
      setLoading(false)
    }
  }

  const usersWithTokens = filteredUsers.filter(u => u.has_token)

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <Bell className="h-7 w-7 text-primary-500" />
            Push Notifications
          </h1>
          <p className="text-slate-600 dark:text-slate-400 mt-1">
            Send push notifications to customers and helpers
          </p>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white/80 dark:bg-slate-800/80 backdrop-blur-xl rounded-xl border border-white/20 dark:border-slate-700/50 shadow-lg p-5">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-slate-600 dark:text-slate-400">Total Devices</p>
              <p className="text-2xl font-bold text-slate-900 dark:text-white mt-1">{stats.total}</p>
            </div>
            <div className="w-12 h-12 rounded-lg bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center">
              <Bell className="h-6 w-6 text-blue-600 dark:text-blue-400" />
            </div>
          </div>
        </div>

        <div className="bg-white/80 dark:bg-slate-800/80 backdrop-blur-xl rounded-xl border border-white/20 dark:border-slate-700/50 shadow-lg p-5">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-slate-600 dark:text-slate-400">Customers</p>
              <p className="text-2xl font-bold text-slate-900 dark:text-white mt-1">{stats.customers}</p>
            </div>
            <div className="w-12 h-12 rounded-lg bg-green-100 dark:bg-green-900/30 flex items-center justify-center">
              <Users className="h-6 w-6 text-green-600 dark:text-green-400" />
            </div>
          </div>
        </div>

        <div className="bg-white/80 dark:bg-slate-800/80 backdrop-blur-xl rounded-xl border border-white/20 dark:border-slate-700/50 shadow-lg p-5">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-slate-600 dark:text-slate-400">Helpers</p>
              <p className="text-2xl font-bold text-slate-900 dark:text-white mt-1">{stats.helpers}</p>
            </div>
            <div className="w-12 h-12 rounded-lg bg-purple-100 dark:bg-purple-900/30 flex items-center justify-center">
              <UserCheck className="h-6 w-6 text-purple-600 dark:text-purple-400" />
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Left Column - Compose Form */}
        <div className="space-y-6">
          {/* Main Form */}
          <div className="bg-white/80 dark:bg-slate-800/80 backdrop-blur-xl rounded-xl border border-white/20 dark:border-slate-700/50 shadow-lg p-6">
            <h2 className="text-lg font-semibold text-slate-900 dark:text-white mb-4">
              Compose Notification
            </h2>

            <div className="space-y-4">
              {/* Title */}
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                  Title <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="e.g., Special Offer! 🎉"
                  className="w-full px-4 py-2.5 rounded-lg border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-900 dark:text-white focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                  maxLength={100}
                />
                <p className="text-xs text-slate-500 mt-1">{title.length}/100 characters</p>
              </div>

              {/* Body */}
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                  Message Body
                </label>
                <textarea
                  value={body}
                  onChange={(e) => setBody(e.target.value)}
                  placeholder="Enter your notification message..."
                  rows={3}
                  className="w-full px-4 py-2.5 rounded-lg border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-900 dark:text-white focus:ring-2 focus:ring-primary-500 focus:border-transparent resize-none"
                  maxLength={500}
                />
                <p className="text-xs text-slate-500 mt-1">{body.length}/500 characters</p>
              </div>

              {/* Target Audience */}
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                  Target Audience
                </label>
                <div className="grid grid-cols-2 gap-3">
                  {[
                    { value: 'all', label: 'All Users', icon: Users, count: stats.total },
                    { value: 'customers', label: 'Customers', icon: Users, count: stats.customers },
                    { value: 'helpers', label: 'Helpers', icon: UserCheck, count: stats.helpers },
                    { value: 'specific', label: 'Select Users', icon: CheckCircle, count: selectedUsers.length },
                  ].map((option) => {
                    const Icon = option.icon
                    const isSelected = targetAudience === option.value
                    return (
                      <button
                        key={option.value}
                        type="button"
                        onClick={() => setTargetAudience(option.value as TargetAudience)}
                        className={`flex items-center gap-3 p-3 rounded-xl border-2 transition-all ${
                          isSelected
                            ? 'border-primary-500 bg-primary-50 dark:bg-primary-900/20'
                            : 'border-slate-200 dark:border-slate-600 hover:border-slate-300 dark:hover:border-slate-500'
                        }`}
                      >
                        <Icon className={`h-5 w-5 ${isSelected ? 'text-primary-500' : 'text-slate-400'}`} />
                        <div className="text-left">
                          <span className={`text-sm font-medium block ${isSelected ? 'text-primary-600 dark:text-primary-400' : 'text-slate-600 dark:text-slate-400'}`}>
                            {option.label}
                          </span>
                          <span className="text-xs text-slate-500">{option.count} devices</span>
                        </div>
                      </button>
                    )
                  })}
                </div>
              </div>

              {/* Result Message */}
              {result && (
                <div className={`flex items-center gap-2 p-4 rounded-lg ${
                  result.success 
                    ? 'bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-400' 
                    : 'bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-400'
                }`}>
                  {result.success ? <CheckCircle className="h-5 w-5" /> : <AlertCircle className="h-5 w-5" />}
                  <span>{result.message}</span>
                </div>
              )}

              {/* Send Button */}
              <button
                onClick={sendNotification}
                disabled={loading || !title.trim()}
                className="w-full flex items-center justify-center gap-2 px-6 py-3 bg-primary-500 text-white rounded-xl font-medium hover:bg-primary-600 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-lg shadow-primary-500/25"
              >
                {loading ? (
                  <>
                    <Loader2 className="h-5 w-5 animate-spin" />
                    Sending...
                  </>
                ) : (
                  <>
                    <Send className="h-5 w-5" />
                    Send Notification
                  </>
                )}
              </button>
            </div>
          </div>

          {/* Preview Card */}
          <div className="bg-white/80 dark:bg-slate-800/80 backdrop-blur-xl rounded-xl border border-white/20 dark:border-slate-700/50 shadow-lg p-6">
            <h2 className="text-lg font-semibold text-slate-900 dark:text-white mb-4">
              Preview
            </h2>
            <div className="bg-slate-100 dark:bg-slate-900 rounded-xl p-4 max-w-sm">
              <div className="flex items-start gap-3">
                <div className="w-10 h-10 rounded-lg bg-primary-500 flex items-center justify-center flex-shrink-0">
                  <span className="text-white font-bold">H</span>
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between">
                    <p className="font-medium text-slate-900 dark:text-white text-sm">Helparo</p>
                    <p className="text-xs text-slate-500">now</p>
                  </div>
                  <p className="font-semibold text-slate-900 dark:text-white mt-1">
                    {title || 'Notification Title'}
                  </p>
                  <p className="text-sm text-slate-600 dark:text-slate-400 mt-0.5 line-clamp-2">
                    {body || 'Your notification message will appear here...'}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Right Column - Users List */}
        <div className="bg-white/80 dark:bg-slate-800/80 backdrop-blur-xl rounded-xl border border-white/20 dark:border-slate-700/50 shadow-lg p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-slate-900 dark:text-white">
              Users with Push Enabled
            </h2>
            <button
              onClick={loadAllUsers}
              disabled={usersLoading}
              className="p-2 text-slate-500 hover:text-primary-500 transition-colors"
              title="Refresh"
            >
              <RefreshCw className={`h-5 w-5 ${usersLoading ? 'animate-spin' : ''}`} />
            </button>
          </div>

          {/* Search & Filter */}
          <div className="flex gap-2 mb-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search by name or phone..."
                className="w-full pl-10 pr-4 py-2 rounded-lg border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-900 dark:text-white text-sm focus:ring-2 focus:ring-primary-500"
              />
            </div>
            <select
              value={roleFilter}
              onChange={(e) => setRoleFilter(e.target.value as 'all' | 'customer' | 'helper')}
              className="px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-900 dark:text-white text-sm focus:ring-2 focus:ring-primary-500"
            >
              <option value="all">All Roles</option>
              <option value="customer">Customers</option>
              <option value="helper">Helpers</option>
            </select>
          </div>

          {/* Select All */}
          {targetAudience === 'specific' && usersWithTokens.length > 0 && (
            <div className="flex items-center justify-between mb-3 pb-3 border-b border-slate-200 dark:border-slate-700">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={selectedUsers.length === usersWithTokens.length && usersWithTokens.length > 0}
                  onChange={selectAll}
                  className="w-4 h-4 rounded border-slate-300 text-primary-500 focus:ring-primary-500"
                />
                <span className="text-sm font-medium text-slate-700 dark:text-slate-300">
                  Select All ({usersWithTokens.length})
                </span>
              </label>
              {selectedUsers.length > 0 && (
                <span className="text-sm text-primary-600 dark:text-primary-400 font-medium">
                  {selectedUsers.length} selected
                </span>
              )}
            </div>
          )}

          {/* Users List */}
          <div className="max-h-[500px] overflow-y-auto space-y-2">
            {usersLoading ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="h-8 w-8 animate-spin text-primary-500" />
              </div>
            ) : filteredUsers.length === 0 ? (
              <div className="text-center py-12 text-slate-500">
                <Users className="h-12 w-12 mx-auto mb-3 opacity-50" />
                <p>No users found</p>
              </div>
            ) : (
              filteredUsers.map((user) => (
                <div
                  key={user.id}
                  onClick={() => user.has_token && targetAudience === 'specific' && toggleUser(user.id)}
                  className={`flex items-center gap-3 p-3 rounded-lg border transition-all ${
                    selectedUsers.includes(user.id)
                      ? 'border-primary-500 bg-primary-50 dark:bg-primary-900/20'
                      : user.has_token
                      ? 'border-slate-200 dark:border-slate-600 hover:border-slate-300 dark:hover:border-slate-500'
                      : 'border-slate-200 dark:border-slate-600 opacity-50'
                  } ${user.has_token && targetAudience === 'specific' ? 'cursor-pointer' : ''}`}
                >
                  {/* Checkbox */}
                  {targetAudience === 'specific' && (
                    <input
                      type="checkbox"
                      checked={selectedUsers.includes(user.id)}
                      onChange={() => user.has_token && toggleUser(user.id)}
                      disabled={!user.has_token}
                      className="w-4 h-4 rounded border-slate-300 text-primary-500 focus:ring-primary-500 disabled:opacity-50"
                      onClick={(e) => e.stopPropagation()}
                    />
                  )}
                  
                  {/* Avatar */}
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center text-white font-medium ${
                    user.role === 'helper' ? 'bg-purple-500' : 'bg-green-500'
                  }`}>
                    {user.full_name.charAt(0).toUpperCase()}
                  </div>
                  
                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-slate-900 dark:text-white truncate">
                      {user.full_name}
                    </p>
                    <p className="text-sm text-slate-500 truncate">{user.phone}</p>
                  </div>
                  
                  {/* Role Badge & Status */}
                  <div className="flex items-center gap-2">
                    <span className={`px-2 py-0.5 text-xs font-medium rounded-full ${
                      user.role === 'helper' 
                        ? 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400' 
                        : 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400'
                    }`}>
                      {user.role}
                    </span>
                    {user.has_token ? (
                      <Bell className="h-4 w-4 text-green-500" />
                    ) : (
                      <Bell className="h-4 w-4 text-slate-300" />
                    )}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
