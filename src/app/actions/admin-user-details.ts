'use server'

/* eslint-disable @typescript-eslint/no-explicit-any */
// This file aggregates across many optional tables/joins. Supabase responses are loosely typed
// without generated DB types, so we keep the module resilient and pragmatic.

import { createClient } from '@/lib/supabase/server'

export interface UserSecurityInfo {
  id: string
  ip_address: string | null
  browser: string | null
  device_type: string | null
  os: string | null
  user_agent: string | null
  location: string | null
  created_at: string
  success?: boolean
  failure_reason?: string | null
}

export interface UserSession {
  id: string
  device_name: string
  browser: string | null
  os: string | null
  ip_address: string | null
  location: string | null
  is_current: boolean
  created_at: string
  last_active_at: string
  revoked: boolean
}

export interface UserOrder {
  id: string
  title: string
  description: string | null
  status: string
  category_name: string | null
  estimated_price: number | null
  final_price: number | null
  created_at: string
  completed_at: string | null
  helper_name: string | null
  helper_id: string | null
  payment_method: string | null
  payment_status: string | null
  address: string | null
  latitude: number | null
  longitude: number | null
}

export interface UserReferral {
  id: string
  referred_name: string | null
  referred_email: string | null
  referred_role: string | null
  status: string
  reward_amount: number | null
  created_at: string
}

export interface CustomerFullDetails {
  // Basic Info
  id: string
  email: string
  full_name: string | null
  phone: string | null
  country_code: string | null
  avatar_url: string | null
  role: string
  status: string
  is_verified: boolean
  is_banned: boolean
  ban_reason: string | null
  banned_at: string | null
  ban_expires_at: string | null
  created_at: string
  updated_at: string
  
  // Location Info
  address: string | null
  city: string | null
  state: string | null
  pincode: string | null
  location_lat: number | null
  location_lng: number | null
  location_updated_at: string | null
  
  // Phone Verification
  phone_verified: boolean
  phone_verified_at: string | null
  
  // Security & Sessions
  login_history: UserSecurityInfo[]
  active_sessions: UserSession[]
  total_sessions: number
  failed_login_attempts: number
  last_login_ip: string | null
  last_login_browser: string | null
  last_login_device: string | null
  last_login_os: string | null
  last_login_at: string | null
  
  // Orders & Payments
  orders: UserOrder[]
  total_orders: number
  completed_orders: number
  cancelled_orders: number
  pending_orders: number
  total_spent: number
  preferred_payment_method: string | null
  
  // Referrals
  referrals: UserReferral[]
  total_referrals: number
  successful_referrals: number
  referral_earnings: number
  referred_by: string | null
  
  // App Usage
  device_tokens: Array<{
    id: string
    device_type: string | null
    provider: string
    is_active: boolean
    last_seen_at: string | null
    created_at: string
  }>
  has_app_installed: boolean
  last_app_activity: string | null
  
  // Notification Preferences
  notification_prefs: {
    push_enabled: boolean
    in_app_enabled: boolean
    email_enabled: boolean
    sms_enabled: boolean
  } | null
  
  // Loyalty & Rewards
  loyalty_points: number
  loyalty_tier: string | null
  
  // Reviews Given
  reviews_given: Array<{
    id: string
    rating: number
    comment: string | null
    helper_name: string | null
    created_at: string
  }>
  
  // Support Tickets
  support_tickets: Array<{
    id: string
    subject: string
    status: string
    priority: string
    created_at: string
  }>
  
  // Legal Acceptances
  legal_acceptances: Array<{
    document_type: string
    accepted_at: string
    ip: string | null
  }>

  // Wallet
  wallet_balance: number
  
  // Promo Usage
  promo_codes_used: Array<{
    code: string
    discount_amount: number
    used_at: string
  }>
}

export interface HelperFullDetails extends CustomerFullDetails {
  // Helper Specific
  helper_profile_id: string | null
  service_categories: string[]
  skills: string[]
  experience_years: number | null
  hourly_rate: number | null
  service_radius: number | null
  is_approved: boolean
  verification_status: string | null
  bio: string | null
  
  // Helper Stats
  total_jobs_completed: number
  total_jobs_assigned: number
  pending_jobs: number
  in_progress_jobs: number
  cancelled_jobs: number
  total_earnings: number
  average_rating: number
  total_reviews: number
  response_rate: number | null
  acceptance_rate: number | null
  completion_rate: number | null
  
  // Current Location (for tracking)
  current_location_lat: number | null
  current_location_lng: number | null
  current_location_updated_at: string | null
  is_online: boolean
  
  // Helper Location History
  location_history: Array<{
    latitude: number
    longitude: number
    recorded_at: string
    request_id: string | null
  }>
  
  // Documents & Verification
  documents: Array<{
    id: string
    document_type: string
    document_url: string | null
    status: string
    verified_at: string | null
    expires_at: string | null
  }>
  
  // Background Checks
  background_checks: Array<{
    id: string
    check_type: string
    status: string
    verification_score: number | null
    verified_at: string | null
    expires_at: string | null
  }>
  
  // Trust Score
  trust_score: number | null
  trust_score_breakdown: {
    verification_score: number
    rating_score: number
    completion_score: number
    response_score: number
  } | null
  
  // Badges
  badges: Array<{
    name: string
    description: string | null
    icon_url: string | null
    earned_at: string
  }>
  
  // Availability
  availability: Array<{
    day_of_week: number
    start_time: string
    end_time: string
    is_available: boolean
  }>
  
  // Earnings History
  earnings_history: Array<{
    amount: number
    type: string
    description: string | null
    created_at: string
    request_id: string | null
  }>
  
  // Subscription
  subscription: {
    plan_name: string
    status: string
    started_at: string
    expires_at: string | null
  } | null
  
  // Service Areas
  service_areas: Array<{
    area_name: string
    pincode: string | null
  }>

  // Extra (optional) helper finance info
  bank_accounts?: Array<Record<string, unknown>>
}

type AnyRecord = Record<string, any>

function safeSingle<T>(res: { data: T | null; error: any }) {
  // Treat missing row (or RLS blocked) as "no data" instead of hard-failing.
  if (res?.error) return null
  return res.data
}

function safeArray<T>(res: { data: T[] | null; error: any }) {
  if (res?.error) return []
  return res.data || []
}

/**
 * Get all customers with basic info for list view
 */
export async function getAllCustomers(filters?: {
  search?: string
  status?: string
  sortBy?: string
  sortOrder?: 'asc' | 'desc'
  limit?: number
  offset?: number
}) {
  try {
    const supabase = await createClient()
    
    let query = supabase
      .from('profiles')
      .select(`
        id,
        email,
        full_name,
        phone,
        status,
        is_banned,
        created_at,
        address,
        city,
        state,
        location_lat,
        location_lng
      `)
      .eq('role', 'customer')
    
    // Apply search filter
    if (filters?.search) {
      query = query.or(`email.ilike.%${filters.search}%,full_name.ilike.%${filters.search}%,phone.ilike.%${filters.search}%`)
    }
    
    // Apply status filter
    if (filters?.status && filters.status !== 'all') {
      if (filters.status === 'banned') {
        query = query.eq('is_banned', true)
      } else {
        query = query.eq('status', filters.status)
      }
    }
    
    // Apply sorting
    const sortBy = filters?.sortBy || 'created_at'
    const sortOrder = filters?.sortOrder === 'asc' ? true : false
    query = query.order(sortBy, { ascending: sortOrder })
    
    // Apply pagination
    const limit = filters?.limit || 50
    const offset = filters?.offset || 0
    query = query.range(offset, offset + limit - 1)
    
    const { data, error, count } = await query
    
    if (error) throw error
    
    return { data: data || [], count, error: null }
  } catch (error: any) {
    console.error('Error fetching customers:', error)
    return { data: [], count: 0, error: error.message }
  }
}

/**
 * Get all helpers with basic info for list view
 */
export async function getAllHelpers(filters?: {
  search?: string
  status?: string
  verification_status?: string
  sortBy?: string
  sortOrder?: 'asc' | 'desc'
  limit?: number
  offset?: number
}) {
  try {
    const supabase = await createClient()
    
    let query = supabase
      .from('profiles')
      .select(`
        id,
        email,
        full_name,
        phone,
        status,
        is_banned,
        created_at,
        address,
        city,
        state,
        location_lat,
        location_lng,
        helper_profiles!left (
          id,
          is_approved,
          verification_status,
          service_categories,
          latitude,
          longitude,
          updated_at,
          is_available_now
        )
      `)
      .eq('role', 'helper')
    
    // Apply search filter
    if (filters?.search) {
      query = query.or(`email.ilike.%${filters.search}%,full_name.ilike.%${filters.search}%,phone.ilike.%${filters.search}%`)
    }
    
    // Apply status filter
    if (filters?.status && filters.status !== 'all') {
      if (filters.status === 'banned') {
        query = query.eq('is_banned', true)
      } else {
        query = query.eq('status', filters.status)
      }
    }
    
    // Apply sorting
    const sortBy = filters?.sortBy || 'created_at'
    const sortOrder = filters?.sortOrder === 'asc' ? true : false
    query = query.order(sortBy, { ascending: sortOrder })
    
    // Apply pagination
    const limit = filters?.limit || 50
    const offset = filters?.offset || 0
    query = query.range(offset, offset + limit - 1)
    
    const { data, error, count } = await query
    
    if (error) throw error
    
    return { data: data || [], count, error: null }
  } catch (error: any) {
    console.error('Error fetching helpers:', error)
    return { data: [], count: 0, error: error.message }
  }
}

/**
 * Get complete customer details
 */
export async function getCustomerFullDetails(userId: string): Promise<{ data: CustomerFullDetails | null, error: string | null }> {
  try {
    const supabase = await createClient()
    
    // Fetch all data in parallel
    const results = await Promise.allSettled([
      // 0: Basic Profile
      supabase.from('profiles').select('*').eq('id', userId).single(),

      // 1: Login History
      supabase.from('login_attempts').select('*').eq('user_id', userId).order('created_at', { ascending: false }).limit(50),

      // 2: Active Sessions
      supabase.from('user_sessions').select('*').eq('user_id', userId).order('created_at', { ascending: false }).limit(50),

      // 3: Service Requests
      supabase
        .from('service_requests')
        .select(`
          id,
          title,
          description,
          status,
          estimated_price,
          created_at,
          job_completed_at,
          assigned_helper_id,
          service_address,
          service_city,
          service_state,
          service_pincode,
          service_location_lat,
          service_location_lng,
          images,
          service_categories!left(name),
          helper:profiles!service_requests_assigned_helper_id_fkey(full_name)
        `)
        .eq('customer_id', userId)
        .order('created_at', { ascending: false }),

      // 4: Payment Orders (Cashfree)
      supabase
        .from('payment_orders')
        .select('request_id, order_amount, payment_status, payment_method, payment_time, created_at, cf_payment_id')
        .eq('customer_id', userId)
        .order('created_at', { ascending: false })
        .limit(200),

      // 5: Referrals made by this user
      supabase
        .from('referrals')
        .select(`
          id,
          status,
          created_at,
          referred:profiles!referrals_referred_user_id_fkey(full_name, email, role)
        `)
        .eq('referrer_id', userId)
        .order('created_at', { ascending: false })
        .limit(200),

      // 6: Referral rewards for this user (wallet credits etc)
      supabase
        .from('referral_rewards')
        .select('id, referral_id, status, amount_paise, created_at')
        .eq('referrer_id', userId)
        .order('created_at', { ascending: false })
        .limit(200),

      // 7: Device Tokens
      supabase.from('device_tokens').select('*').eq('user_id', userId).order('created_at', { ascending: false }),

      // 8: Notification Preferences
      supabase.from('user_notification_prefs').select('*').eq('user_id', userId).single(),

      // 9: Loyalty Points
      supabase.from('loyalty_points').select('*').eq('user_id', userId).single(),

      // 10: Reviews Given
      supabase
        .from('reviews')
        .select(`
          id,
          rating,
          comment,
          created_at,
          helper:profiles!reviews_helper_id_fkey(full_name)
        `)
        .eq('customer_id', userId)
        .order('created_at', { ascending: false })
        .limit(200),

      // 11: Support Tickets
      supabase.from('support_tickets').select('id, subject, status, priority, created_at').eq('user_id', userId).order('created_at', { ascending: false }).limit(200),

      // 12: Legal Acceptances
      supabase.from('legal_acceptances').select('document_type, accepted_at, ip').eq('user_id', userId).order('accepted_at', { ascending: false }).limit(50),

      // 13: Wallet Balance
      supabase.from('wallet_accounts').select('available_balance, escrow_balance, updated_at').eq('user_id', userId).single(),

      // 14: Promo Codes Used
      supabase
        .from('promo_code_usages')
        .select('applied_amount_paise, created_at, promo_codes!inner(code)')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
        .limit(200),

      // 15: Who referred this user (if any)
      supabase
        .from('referrals')
        .select('referrer:profiles!referrals_referrer_id_fkey(full_name)')
        .eq('referred_user_id', userId)
        .single()
    ])
    
    const profileResult = results[0].status === 'fulfilled' ? results[0].value : null
    const profile = profileResult?.data as AnyRecord | null
    if (!profile) {
      return { data: null, error: 'User not found or not accessible' }
    }

    const loginHistory = (results[1].status === 'fulfilled' ? safeArray(results[1].value as any) : []) as AnyRecord[]
    const sessions = (results[2].status === 'fulfilled' ? safeArray(results[2].value as any) : []) as AnyRecord[]
    const requests = (results[3].status === 'fulfilled' ? safeArray(results[3].value as any) : []) as AnyRecord[]
    const paymentOrders = (results[4].status === 'fulfilled' ? safeArray(results[4].value as any) : []) as AnyRecord[]
    const referrals = (results[5].status === 'fulfilled' ? safeArray(results[5].value as any) : []) as AnyRecord[]
    const referralRewards = (results[6].status === 'fulfilled' ? safeArray(results[6].value as any) : []) as AnyRecord[]
    const deviceTokens = (results[7].status === 'fulfilled' ? safeArray(results[7].value as any) : []) as AnyRecord[]
    const notificationPrefs = results[8].status === 'fulfilled' ? safeSingle(results[8].value as any) as AnyRecord | null : null
    const loyalty = results[9].status === 'fulfilled' ? safeSingle(results[9].value as any) as AnyRecord | null : null
    const reviews = (results[10].status === 'fulfilled' ? safeArray(results[10].value as any) : []) as AnyRecord[]
    const supportTickets = (results[11].status === 'fulfilled' ? safeArray(results[11].value as any) : []) as AnyRecord[]
    const legalAcceptances = (results[12].status === 'fulfilled' ? safeArray(results[12].value as any) : []) as AnyRecord[]
    const wallet = results[13].status === 'fulfilled' ? safeSingle(results[13].value as any) as AnyRecord | null : null
    const promoUsage = (results[14].status === 'fulfilled' ? safeArray(results[14].value as any) : []) as AnyRecord[]
    const referredBy = results[15].status === 'fulfilled' ? safeSingle(results[15].value as any) as AnyRecord | null : null

    // Map payment info by request
    const paymentByRequest: Record<string, AnyRecord> = {}
    for (const po of paymentOrders) {
      if (!po?.request_id) continue
      if (!paymentByRequest[po.request_id]) paymentByRequest[po.request_id] = po
    }
    
    // Calculate order stats
    const completedOrders = requests.filter(o => o.status === 'completed')
    const cancelledOrders = requests.filter(o => o.status === 'cancelled')
    const pendingOrders = requests.filter(o => ['open', 'assigned', 'in_progress', 'draft'].includes(o.status))
    const totalSpent = paymentOrders
      .filter(po => ['paid', 'success', 'completed'].includes(String(po.payment_status || '').toLowerCase()))
      .reduce((sum, po) => sum + (Number(po.order_amount) || 0) / 100, 0)
    
    // Get last login info
    const lastSuccessfulLogin = loginHistory.find(l => l.success)
    
    // Calculate failed login attempts (last 24 hours)
    const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000)
    const recentFailedAttempts = loginHistory.filter(l => 
      !l.success && new Date(l.created_at) > oneDayAgo
    ).length
    
    // Calculate referral stats
    const successfulReferrals = referrals.filter(r => ['converted', 'rewarded'].includes(String(r.status || '').toLowerCase()))
    const referralEarnings = referralRewards
      .filter(rr => ['granted'].includes(String(rr.status || '').toLowerCase()))
      .reduce((sum, rr) => sum + (Number(rr.amount_paise) || 0) / 100, 0)
    
    // Determine preferred payment method
    const paymentMethods = paymentOrders.map(po => po.payment_method).filter(Boolean)
    const paymentMethodCounts: Record<string, number> = {}
    paymentMethods.forEach(m => {
      if (m) paymentMethodCounts[m] = (paymentMethodCounts[m] || 0) + 1
    })
    const preferredPaymentMethod = Object.entries(paymentMethodCounts)
      .sort((a, b) => b[1] - a[1])[0]?.[0] || null
    
    const customerDetails: CustomerFullDetails = {
      // Basic Info
      id: profile.id,
      email: profile.email,
      full_name: profile.full_name,
      phone: profile.phone,
      country_code: profile.country_code,
      avatar_url: profile.avatar_url,
      role: profile.role,
      status: profile.status || 'active',
      is_verified: profile.is_verified || false,
      is_banned: profile.is_banned || false,
      ban_reason: profile.ban_reason,
      banned_at: profile.banned_at,
      ban_expires_at: profile.ban_expires_at,
      created_at: profile.created_at,
      updated_at: profile.updated_at,
      
      // Location Info
      address: profile.address,
      city: profile.city,
      state: profile.state,
      pincode: profile.pincode,
      location_lat: profile.location_lat,
      location_lng: profile.location_lng,
      location_updated_at: profile.location_updated_at,
      
      // Phone Verification
      phone_verified: profile.phone_verified || false,
      phone_verified_at: profile.phone_verified_at,
      
      // Security & Sessions
      login_history: loginHistory.map(l => ({
        id: l.id,
        ip_address: l.ip_address,
        browser: null,
        device_type: null,
        os: null,
        user_agent: l.user_agent,
        location: l.location,
        created_at: l.created_at,
        success: l.success,
        failure_reason: l.failure_reason
      })),
      active_sessions: sessions.map(s => ({
        id: s.id,
        device_name: s.device_name,
        browser: s.browser,
        os: s.os,
        ip_address: s.ip_address,
        location: s.location,
        is_current: s.is_current,
        created_at: s.created_at,
        last_active_at: s.last_active_at,
        revoked: s.revoked
      })),
      total_sessions: sessions.length,
      failed_login_attempts: recentFailedAttempts,
      last_login_ip: lastSuccessfulLogin?.ip_address || null,
      last_login_browser: null,
      last_login_device: null,
      last_login_os: null,
      last_login_at: lastSuccessfulLogin?.created_at || null,
      
      // Orders & Payments
      orders: requests.map(o => {
        const pay = paymentByRequest[o.id]
        const orderAmountRupees = pay?.order_amount != null ? Number(pay.order_amount) / 100 : null
        return {
        id: o.id,
        title: o.title,
        description: o.description,
        status: o.status,
        category_name: (o.service_categories as any)?.name || null,
        estimated_price: o.estimated_price,
        final_price: orderAmountRupees,
        created_at: o.created_at,
        completed_at: o.job_completed_at,
        helper_name: (o.helper as any)?.full_name || null,
        helper_id: o.assigned_helper_id,
        payment_method: pay?.payment_method || null,
        payment_status: pay?.payment_status || null,
        address: o.service_address || null,
        latitude: o.service_location_lat || null,
        longitude: o.service_location_lng || null
      }
      }),
      total_orders: requests.length,
      completed_orders: completedOrders.length,
      cancelled_orders: cancelledOrders.length,
      pending_orders: pendingOrders.length,
      total_spent: totalSpent,
      preferred_payment_method: preferredPaymentMethod,
      
      // Referrals
      referrals: referrals.map(r => ({
        id: r.id,
        referred_name: (r.referred as any)?.full_name || null,
        referred_email: (r.referred as any)?.email || null,
        referred_role: (r.referred as any)?.role || null,
        status: r.status,
        reward_amount: null,
        created_at: r.created_at
      })),
      total_referrals: referrals.length,
      successful_referrals: successfulReferrals.length,
      referral_earnings: referralEarnings,
      referred_by: (referredBy?.referrer as any)?.full_name || null,
      
      // App Usage
      device_tokens: deviceTokens.map(t => ({
        id: t.id,
        device_type: t.device_type,
        provider: t.provider,
        is_active: t.is_active,
        last_seen_at: t.last_seen_at,
        created_at: t.created_at
      })),
      has_app_installed: deviceTokens.some(t => t.is_active),
      last_app_activity: deviceTokens[0]?.last_seen_at || null,
      
      // Notification Preferences
      notification_prefs: notificationPrefs ? {
        push_enabled: notificationPrefs.push_enabled,
        in_app_enabled: notificationPrefs.in_app_enabled,
        email_enabled: notificationPrefs.email_enabled,
        sms_enabled: notificationPrefs.sms_enabled
      } : null,
      
      // Loyalty & Rewards
      loyalty_points: Number(loyalty?.points_balance ?? loyalty?.points_balance ?? 0) || 0,
      loyalty_tier: (loyalty?.tier as string) || null,
      
      // Reviews Given
      reviews_given: reviews.map(r => ({
        id: r.id,
        rating: r.rating,
        comment: r.comment,
        helper_name: (r.helper as any)?.full_name || null,
        created_at: r.created_at
      })),
      
      // Support Tickets
      support_tickets: (supportTickets || []).map((t: any) => ({
        id: t.id,
        subject: t.subject,
        status: t.status,
        priority: t.priority,
        created_at: t.created_at
      })),
      
      // Legal Acceptances
      legal_acceptances: legalAcceptances.map(l => ({
        document_type: l.document_type,
        accepted_at: l.accepted_at,
        ip: l.ip
      })),
      
      // Wallet
      wallet_balance: Number(wallet?.available_balance ?? 0) || 0,
      
      // Promo Usage
      promo_codes_used: promoUsage.map(p => ({
        code: (p.promo_codes as any)?.code || '',
        discount_amount: p.applied_amount_paise / 100,
        used_at: p.created_at
      }))
    }
    
    return { data: customerDetails, error: null }
  } catch (error: any) {
    console.error('Error fetching customer details:', error)
    return { data: null, error: error.message }
  }
}

/**
 * Get complete helper details
 */
export async function getHelperFullDetails(userId: string): Promise<{ data: HelperFullDetails | null, error: string | null }> {
  try {
    const supabase = await createClient()
    
    // First get basic customer details
    const customerResult = await getCustomerFullDetails(userId)
    if (customerResult.error || !customerResult.data) {
      return { data: null, error: customerResult.error || 'User not found' }
    }
    
    // Helper profile first (needed for helper_location_history FK)
    const helperProfileResult = await supabase
      .from('helper_profiles')
      .select('*')
      .eq('user_id', userId)
      .single()

    const helperProfile = safeSingle(helperProfileResult as any) as AnyRecord | null
    const helperProfileId: string | null = helperProfile?.id ? String(helperProfile.id) : null

    // Fetch helper-specific data
    const [
      jobsResult,
      paymentOrdersResult,
      helperReviewsResult,
      locationHistoryResult,
      backgroundChecksResult,
      trustScoreResult,
      badgesResult,
      earningsResult,
      subscriptionResult,
      bankAccountsResult,
      serviceCategoriesLookupResult
    ] = await Promise.all([
      // Jobs assigned to helper
      supabase
        .from('service_requests')
        .select(`
          id,
          title,
          description,
          status,
          estimated_price,
          created_at,
          job_completed_at,
          service_address,
          service_city,
          service_state,
          service_pincode,
          service_location_lat,
          service_location_lng,
          images,
          customer_id,
          category_id,
          service_categories!left(name),
          customer:profiles!service_requests_customer_id_fkey(full_name)
        `)
        .eq('assigned_helper_id', userId)
        .order('created_at', { ascending: false }),

      // Payment orders related to helper
      supabase
        .from('payment_orders')
        .select('request_id, order_amount, payment_status, payment_method, payment_time, created_at')
        .eq('helper_id', userId)
        .order('created_at', { ascending: false })
        .limit(200),
      
      // Reviews received
      supabase
        .from('reviews')
        .select(`
          id,
          rating,
          comment,
          created_at,
          customer:profiles!reviews_customer_id_fkey(full_name)
        `)
        .eq('helper_id', userId)
        .order('created_at', { ascending: false }),
      
      // Location History
      supabase
        .from('helper_location_history')
        .select('latitude, longitude, recorded_at, request_id')
        .eq('helper_id', helperProfileId || userId)
        .order('recorded_at', { ascending: false })
        .limit(100),
      
      // Background Checks
      supabase
        .from('background_check_results')
        .select('*')
        .eq('helper_id', userId),
      
      // Trust Score
      supabase
        .from('helper_trust_scores')
        .select('*')
        .eq('helper_id', userId)
        .single(),
      
      // Badges
      supabase
        .from('helper_badges')
        .select(`
          earned_at,
          badge_definitions!inner(name, description, icon_url)
        `)
        .eq('helper_id', userId),
      
      // Earnings History
      supabase
        .from('helper_earnings')
        .select('*')
        .eq('helper_id', userId)
        .order('created_at', { ascending: false })
        .limit(50),
      
      // Subscription
      supabase
        .from('helper_subscriptions')
        .select(`
          status,
          started_at,
          expires_at,
          subscription_plans!inner(name)
        `)
        .eq('helper_id', userId)
        .eq('status', 'active')
        .single(),

      // Bank Accounts
      supabase
        .from('helper_bank_accounts')
        .select('*')
        .eq('helper_id', userId)
        .order('created_at', { ascending: false }),

      // Lookup service category names for any UUID-like values in helper_profiles.service_categories
      (async () => {
        const raw = (helperProfile?.service_categories || []) as unknown
        const arr = Array.isArray(raw) ? raw.map(String) : []
        const uuidLike = arr.filter(v => /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(v))
        const ids = Array.from(new Set(uuidLike))
        if (ids.length === 0) return { data: [], error: null }
        return supabase.from('service_categories').select('id, name').in('id', ids)
      })()
    ])

    const jobs = safeArray(jobsResult as any) as AnyRecord[]
    const helperPaymentOrders = safeArray(paymentOrdersResult as any) as AnyRecord[]
    const helperReviews = safeArray(helperReviewsResult as any) as AnyRecord[]
    const locationHistory = safeArray(locationHistoryResult as any) as AnyRecord[]
    const backgroundChecks = safeArray(backgroundChecksResult as any) as AnyRecord[]
    const trustScore = safeSingle(trustScoreResult as any) as AnyRecord | null
    const badges = safeArray(badgesResult as any) as AnyRecord[]
    const earnings = safeArray(earningsResult as any) as AnyRecord[]
    const subscription = safeSingle(subscriptionResult as any) as AnyRecord | null
    const bankAccounts = safeArray(bankAccountsResult as any) as AnyRecord[]

    // Resolve UUID category ids into names
    const serviceCategoryLookupRows = safeArray(serviceCategoriesLookupResult as any) as AnyRecord[]
    const categoryIdToName = new Map<string, string>()
    for (const row of serviceCategoryLookupRows) {
      if (row?.id && row?.name) categoryIdToName.set(String(row.id), String(row.name))
    }
    const normalizeCategoryTokens = (tokens: unknown): string[] => {
      const arr = Array.isArray(tokens) ? tokens.map(String) : []
      const out: string[] = []
      for (const t of arr) {
        const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(t)
        if (isUuid) {
          const name = categoryIdToName.get(t)
          if (name) out.push(name)
          continue
        }
        out.push(t)
      }
      // de-dupe while preserving order
      return Array.from(new Set(out)).filter(Boolean)
    }

    const helperPaymentByRequest: Record<string, AnyRecord> = {}
    for (const po of helperPaymentOrders) {
      if (!po?.request_id) continue
      if (!helperPaymentByRequest[po.request_id]) helperPaymentByRequest[po.request_id] = po
    }
    
    // Calculate job stats
    const completedJobs = jobs.filter(j => j.status === 'completed')
    const pendingJobs = jobs.filter(j => ['open', 'assigned'].includes(j.status))
    const inProgressJobs = jobs.filter(j => j.status === 'in_progress')
    const cancelledJobs = jobs.filter(j => j.status === 'cancelled')
    const totalEarnings = helperPaymentOrders
      .filter(po => ['paid', 'success', 'completed'].includes(String(po.payment_status || '').toLowerCase()))
      .reduce((sum, po) => sum + (Number(po.order_amount) || 0) / 100, 0)
    
    // Calculate average rating
    const avgRating = helperReviews.length > 0
      ? helperReviews.reduce((sum, r) => sum + r.rating, 0) / helperReviews.length
      : 0
    
    // Override orders with jobs for helper
    const helperDetails: HelperFullDetails = {
      ...customerResult.data,
      
      // Override orders with helper jobs
      orders: jobs.map(j => {
        const pay = helperPaymentByRequest[j.id]
        const orderAmountRupees = pay?.order_amount != null ? Number(pay.order_amount) / 100 : null
        return {
        id: j.id,
        title: j.title,
        description: j.description,
        status: j.status,
        category_name: (j.service_categories as any)?.name || null,
        estimated_price: j.estimated_price,
        final_price: orderAmountRupees,
        created_at: j.created_at,
        completed_at: j.job_completed_at,
        helper_name: null,
        helper_id: null,
        payment_method: pay?.payment_method || null,
        payment_status: pay?.payment_status || null,
        address: j.service_address || null,
        latitude: j.service_location_lat || null,
        longitude: j.service_location_lng || null
      }
      }),
      total_orders: jobs.length,
      completed_orders: completedJobs.length,
      cancelled_orders: cancelledJobs.length,
      pending_orders: pendingJobs.length,
      
      // Helper Specific
      helper_profile_id: helperProfile?.id || null,
      service_categories: normalizeCategoryTokens(helperProfile?.service_categories || []),
      skills: normalizeCategoryTokens(helperProfile?.skills || []),
      experience_years: helperProfile?.experience_years,
      hourly_rate: helperProfile?.hourly_rate,
      service_radius: helperProfile?.service_radius,
      is_approved: helperProfile?.is_approved || false,
      verification_status: helperProfile?.verification_status,
      bio: helperProfile?.bio,
      
      // Helper Stats
      total_jobs_completed: completedJobs.length,
      total_jobs_assigned: jobs.length,
      pending_jobs: pendingJobs.length,
      in_progress_jobs: inProgressJobs.length,
      cancelled_jobs: cancelledJobs.length,
      total_earnings: totalEarnings,
      average_rating: Math.round(avgRating * 10) / 10,
      total_reviews: helperReviews.length,
      response_rate: helperProfile?.response_rate || null,
      acceptance_rate: helperProfile?.acceptance_rate || null,
      completion_rate: jobs.length > 0 ? Math.round((completedJobs.length / jobs.length) * 100) : null,
      
      // Current Location
      current_location_lat: helperProfile?.current_location_lat ?? helperProfile?.latitude ?? null,
      current_location_lng: helperProfile?.current_location_lng ?? helperProfile?.longitude ?? null,
      current_location_updated_at: helperProfile?.location_updated_at ?? helperProfile?.updated_at ?? null,
      is_online: helperProfile?.is_online ?? helperProfile?.is_available_now ?? false,
      
      // Location History
      location_history: locationHistory.map(l => ({
        latitude: l.latitude,
        longitude: l.longitude,
        recorded_at: l.recorded_at,
        request_id: l.request_id
      })),
      
      // Documents
      documents: [],
      
      // Background Checks
      background_checks: backgroundChecks.map(b => ({
        id: b.id,
        check_type: b.check_type,
        status: b.status,
        verification_score: b.verification_score,
        verified_at: b.verified_at,
        expires_at: b.expires_at
      })),
      
      // Trust Score
      trust_score: trustScore?.overall_score || null,
      trust_score_breakdown: trustScore ? {
        verification_score: trustScore.verification_score || 0,
        rating_score: trustScore.rating_score || 0,
        completion_score: trustScore.completion_score || 0,
        response_score: trustScore.response_score || 0
      } : null,
      
      // Badges
      badges: badges.map(b => ({
        name: (b.badge_definitions as any)?.name || '',
        description: (b.badge_definitions as any)?.description,
        icon_url: (b.badge_definitions as any)?.icon_url,
        earned_at: b.earned_at
      })),
      
      // Availability
      availability: [],
      
      // Earnings History
      earnings_history: earnings.map(e => ({
        amount: e.amount,
        type: e.type,
        description: e.description,
        created_at: e.created_at,
        request_id: e.request_id
      })),
      
      // Subscription
      subscription: subscription ? {
        plan_name: (subscription.subscription_plans as any)?.name || '',
        status: subscription.status,
        started_at: subscription.started_at,
        expires_at: subscription.expires_at
      } : null,
      
      // Service Areas
      service_areas: (helperProfile?.service_areas || []).map((name: any) => ({
        area_name: String(name),
        pincode: null
      })),

      bank_accounts: bankAccounts,
    }
    
    return { data: helperDetails, error: null }
  } catch (error: any) {
    console.error('Error fetching helper details:', error)
    return { data: null, error: error.message }
  }
}
