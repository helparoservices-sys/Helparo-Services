'use server'
import { requireAdmin } from '@/lib/auth'
import { handleServerActionError } from '@/lib/errors'
import { rateLimit, RATE_LIMITS } from '@/lib/rate-limit'
import { validateFormData, banUserSchema, approveHelperSchema } from '@/lib/validation'
import { sanitizeText } from '@/lib/sanitize'
import { UserRole } from '@/lib/constants'

export async function approveWithdrawal(id: string) {
  try {
    const { user, supabase } = await requireAdmin()
    await rateLimit('admin-approve-withdrawal', user.id, RATE_LIMITS.ADMIN_APPROVE)
    
    const { data, error } = await supabase.rpc('approve_withdrawal', { 
      p_withdrawal_id: id 
    } as any)
    
    if (error) throw error
    return { success: true, data }
  } catch (error: any) {
    return handleServerActionError(error)
  }
}

export async function updateWithdrawalStatus(id: string, status: string, failureReason?: string) {
  try {
    const { user, supabase } = await requireAdmin()
    await rateLimit('admin-update-withdrawal', user.id, RATE_LIMITS.ADMIN_APPROVE)
    
    const sanitizedReason = failureReason ? sanitizeText(failureReason) : null
    
    const { data, error } = await supabase.rpc('update_withdrawal_status', { 
      p_withdrawal_id: id, 
      p_new_status: status, 
      p_failure_reason: sanitizedReason 
    } as any)
    
    if (error) throw error
    return { success: true, data }
  } catch (error: any) {
    return handleServerActionError(error)
  }
}

export async function createCategory(name: string, slug: string, description?: string, parentId?: string) {
  try {
    const { user, supabase } = await requireAdmin()
    await rateLimit('admin-create-category', user.id, RATE_LIMITS.ADMIN_APPROVE)
    
    const sanitizedName = sanitizeText(name)
    const sanitizedSlug = sanitizeText(slug)
    const sanitizedDescription = description ? sanitizeText(description) : null
    
    const { error } = await supabase.from('service_categories').insert({ 
      name: sanitizedName, 
      slug: sanitizedSlug, 
      description: sanitizedDescription, 
      parent_id: parentId || null 
    })
    
    if (error) throw error
    return { success: true }
  } catch (error: any) {
    return handleServerActionError(error)
  }
}

export async function toggleCategoryActive(id: string, active: boolean) {
  try {
    const { user, supabase } = await requireAdmin()
    await rateLimit('admin-toggle-category', user.id, RATE_LIMITS.ADMIN_APPROVE)
    
    const { error } = await supabase
      .from('service_categories')
      .update({ is_active: active })
      .eq('id', id)
    
    if (error) throw error
    return { success: true }
  } catch (error: any) {
    return handleServerActionError(error)
  }
}

export async function approveHelper(formData: FormData) {
  try {
    const { user, supabase } = await requireAdmin()
    await rateLimit('admin-approve-helper', user.id, RATE_LIMITS.ADMIN_APPROVE)
    
    const validation = validateFormData(formData, approveHelperSchema)
    if (!validation.success) {
      return { error: validation.error }
    }
    
    const { helper_id, admin_notes } = validation.data
    
    const { error } = await supabase
      .from('helper_profiles')
      .update({ 
        verification_status: 'approved' as any, 
        is_approved: true 
      })
      .eq('user_id', helper_id)
    
    if (error) throw error
    return { success: true }
  } catch (error: any) {
    return handleServerActionError(error)
  }
}

export async function updateUserRole(userId: string, newRole: string) {
  try {
    const { user, supabase } = await requireAdmin()
    await rateLimit('admin-update-role', user.id, RATE_LIMITS.ADMIN_APPROVE)
    
    // Validate role
    if (![UserRole.ADMIN, UserRole.HELPER, UserRole.CUSTOMER].includes(newRole as UserRole)) {
      return { error: 'Invalid role specified' }
    }
    
    const { error } = await supabase
      .from('profiles')
      .update({ role: newRole })
      .eq('id', userId)
    
    if (error) throw error
    return { success: true }
  } catch (error: any) {
    return handleServerActionError(error)
  }
}

export async function banUser(formData: FormData) {
  try {
    const { user, supabase } = await requireAdmin()
    await rateLimit('admin-ban-user', user.id, RATE_LIMITS.ADMIN_BAN)
    
    const validation = validateFormData(formData, banUserSchema)
    if (!validation.success) {
      return { error: validation.error }
    }
    
    const { user_id, reason, duration_hours, is_permanent } = validation.data
    
    let banned_until = null
    if (!is_permanent && duration_hours) {
      banned_until = new Date()
      banned_until.setHours(banned_until.getHours() + duration_hours)
    }

    const { error } = await supabase.from('profiles').update({ 
      is_banned: true,
      ban_reason: sanitizeText(reason),
      banned_until: banned_until?.toISOString(),
      banned_at: new Date().toISOString(),
      banned_by: user.id
    }).eq('id', user_id)
    
    if (error) throw error
    return { success: true }
  } catch (error: any) {
    return handleServerActionError(error)
  }
}

export async function unbanUser(userId: string) {
  try {
    const { user, supabase } = await requireAdmin()
    await rateLimit('admin-unban-user', user.id, RATE_LIMITS.ADMIN_BAN)
    
    const { error } = await supabase.from('profiles').update({ 
      is_banned: false,
      ban_reason: null,
      banned_until: null,
      banned_at: null,
      banned_by: null
    }).eq('id', userId)
    
    if (error) throw error
    return { success: true }
  } catch (error: any) {
    return handleServerActionError(error)
  }
}
