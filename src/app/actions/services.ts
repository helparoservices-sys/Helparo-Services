'use server'

import { createClient } from '@/lib/supabase/server'
import { requireAuth } from '@/lib/auth-middleware'
import { UserRole } from '@/lib/constants'

export interface ServiceCategory {
  id: string
  name: string
  slug: string
  description: string | null
  parent_id: string | null
  is_active: boolean
  icon: string | null
  base_price: number
  price_type: string
  unit_name: string | null
  requires_location: boolean
  supports_emergency: boolean
  display_order: number
  created_at: string
  updated_at?: string
  children: ServiceCategory[]
}

type TreeResult = { categories?: ServiceCategory[]; error?: string }

const SELECT_COLUMNS = `
  id,
  name,
  slug,
  description,
  parent_id,
  is_active,
  icon,
  base_price,
  price_type,
  unit_name,
  requires_location,
  supports_emergency,
  display_order,
  created_at,
  updated_at
`

function buildTree(rows: any[], includeInactive: boolean): ServiceCategory[] {
  const map: Record<string, ServiceCategory> = {}
  const roots: ServiceCategory[] = []

  // Initialize map entries with empty children arrays
  for (const r of rows) {
    map[r.id] = {
      id: r.id,
      name: r.name,
      slug: r.slug,
      description: r.description || null,
      parent_id: r.parent_id,
      is_active: !!r.is_active,
      icon: r.icon || null,
      base_price: Number(r.base_price) || 0,
      price_type: r.price_type || 'fixed',
      unit_name: r.unit_name || null,
      requires_location: !!r.requires_location,
      supports_emergency: !!r.supports_emergency,
      display_order: r.display_order ?? 0,
      created_at: r.created_at,
      updated_at: r.updated_at,
      children: []
    }
  }

  // Attach children
  for (const r of rows) {
    const node = map[r.id]
    if (node.parent_id) {
      const parent = map[node.parent_id]
      if (parent) {
        if (includeInactive || node.is_active) parent.children.push(node)
      }
    } else {
      if (includeInactive || node.is_active) roots.push(node)
    }
  }

  // Sort children & roots
  const sortFn = (a: ServiceCategory, b: ServiceCategory) => (a.display_order - b.display_order) || a.name.localeCompare(b.name)
  for (const r of roots) {
    r.children.sort(sortFn)
  }
  roots.sort(sortFn)
  return roots
}

/**
 * Admin-only: full service category tree.
 * @param includeInactive whether to include inactive categories & children
 */
export async function getServiceCategoryTree(includeInactive = false): Promise<TreeResult> {
  try {
    await requireAuth(UserRole.ADMIN)
    const supabase = await createClient()
    const { data, error } = await supabase
      .from('service_categories')
      .select(SELECT_COLUMNS)
      .order('display_order', { ascending: true })
      .order('name', { ascending: true })

    if (error) return { error: 'Failed to fetch service categories' }
    const tree = buildTree(data || [], includeInactive)
    return { categories: tree }
  } catch (e: any) {
    return { error: e.message || 'Unexpected error fetching categories' }
  }
}

/**
 * Public: active parent categories with active children only.
 */
export async function getPublicServiceCategories(): Promise<TreeResult> {
  try {
    const supabase = await createClient()
    const { data, error } = await supabase
      .from('service_categories')
      .select(SELECT_COLUMNS)
      .eq('is_active', true) // only active rows
      .order('display_order', { ascending: true })
      .order('name', { ascending: true })

    if (error) return { error: 'Failed to fetch public categories' }
    // Since we filtered is_active = true, we can pass includeInactive=false
    const tree = buildTree(data || [], false)
    return { categories: tree }
  } catch (e: any) {
    return { error: e.message || 'Unexpected error fetching public categories' }
  }
}

/**
 * Single category fetch (admin) with children flattened.
 */
export async function getServiceCategoryById(id: string): Promise<{ category?: ServiceCategory; error?: string }> {
  try {
    await requireAuth(UserRole.ADMIN)
    const supabase = await createClient()
    const { data, error } = await supabase
      .from('service_categories')
      .select(SELECT_COLUMNS)
      .or(`id.eq.${id},parent_id.eq.${id}`)

    if (error) return { error: 'Failed to fetch category' }
    if (!data || data.length === 0) return { error: 'Category not found' }

    // Separate parent row and children
    const parentRow = data.find(r => r.id === id)
    if (!parentRow) return { error: 'Parent category missing' }
    const tree = buildTree(data, true)
    // tree will include only the parent if parentRow.parent_id is null; handle direct assembly
    const parent = tree.find(c => c.id === id) || buildTree([parentRow], true)[0]
    return { category: parent }
  } catch (e: any) {
    return { error: e.message || 'Unexpected error fetching category' }
  }
}

/**
 * Update existing service category or service
 */
export async function updateServiceCategory(
  id: string,
  data: Partial<Omit<ServiceCategory, 'id' | 'created_at' | 'children'>>
): Promise<{ success?: boolean; error?: string }> {
  try {
    await requireAuth(UserRole.ADMIN)
    const supabase = await createClient()

    const { error } = await supabase
      .from('service_categories')
      .update({
        name: data.name,
        slug: data.slug,
        description: data.description,
        parent_id: data.parent_id,
        is_active: data.is_active,
        icon: data.icon,
        base_price: data.base_price,
        price_type: data.price_type,
        unit_name: data.unit_name,
        requires_location: data.requires_location,
        supports_emergency: data.supports_emergency,
        display_order: data.display_order,
      })
      .eq('id', id)

    if (error) return { error: error.message }
    return { success: true }
  } catch (e: any) {
    return { error: e.message || 'Failed to update category' }
  }
}

/**
 * Soft delete service category (sets is_active = false)
 */
export async function deleteServiceCategory(id: string): Promise<{ success?: boolean; error?: string }> {
  try {
    await requireAuth(UserRole.ADMIN)
    const supabase = await createClient()

    // Soft delete - just set is_active to false
    const { error } = await supabase
      .from('service_categories')
      .update({ is_active: false })
      .eq('id', id)

    if (error) return { error: error.message }
    return { success: true }
  } catch (e: any) {
    return { error: e.message || 'Failed to delete category' }
  }
}

/**
 * Toggle service category active status
 */
export async function toggleServiceStatus(id: string, currentStatus: boolean): Promise<{ success?: boolean; error?: string }> {
  try {
    await requireAuth(UserRole.ADMIN)
    const supabase = await createClient()

    const { error } = await supabase
      .from('service_categories')
      .update({ is_active: !currentStatus })
      .eq('id', id)

    if (error) return { error: error.message }
    return { success: true }
  } catch (e: any) {
    return { error: e.message || 'Failed to toggle status' }
  }
}
