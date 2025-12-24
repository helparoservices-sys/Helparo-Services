'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidateTag } from 'next/cache'

type LegalDocumentType = 'terms' | 'privacy'

interface CreateDocumentInput {
  type: LegalDocumentType
  version: number
  title: string
  content_md: string
  is_active: boolean
}

interface UpdateDocumentInput {
  id: string
  title: string
  content_md: string
  is_active: boolean
}

export async function createLegalDocument(input: CreateDocumentInput) {
  const supabase = await createClient()

  // Verify admin - auth handled by middleware but double-check role
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return { error: 'Unauthorized' }
  }

  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single()

  if (profile?.role !== 'admin') {
    return { error: 'Admin access required' }
  }

  // Check if version already exists for this type
  const { data: existing } = await supabase
    .from('legal_documents')
    .select('id')
    .eq('type', input.type)
    .eq('version', input.version)
    .maybeSingle()

  if (existing) {
    return { error: `Version ${input.version} already exists for ${input.type}` }
  }

  // If setting as active, deactivate other documents of the same type
  if (input.is_active) {
    await supabase
      .from('legal_documents')
      .update({ is_active: false })
      .eq('type', input.type)
  }

  const { data, error } = await supabase
    .from('legal_documents')
    .insert([{
      type: input.type,
      version: input.version,
      title: input.title,
      content_md: input.content_md,
      is_active: input.is_active,
      published_at: input.is_active ? new Date().toISOString() : null
    }])
    .select()
    .single()

  if (error) {
    console.error('Failed to create legal document:', error)
    return { error: error.message }
  }

  // Revalidate cache
  revalidateTag('legal-docs')

  return { data }
}

export async function updateLegalDocument(input: UpdateDocumentInput) {
  const supabase = await createClient()

  // Verify admin
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return { error: 'Unauthorized' }
  }

  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single()

  if (profile?.role !== 'admin') {
    return { error: 'Admin access required' }
  }

  // Get current document to check type
  const { data: current } = await supabase
    .from('legal_documents')
    .select('type, is_active')
    .eq('id', input.id)
    .single()

  if (!current) {
    return { error: 'Document not found' }
  }

  // If setting as active, deactivate other documents of the same type
  if (input.is_active && !current.is_active) {
    await supabase
      .from('legal_documents')
      .update({ is_active: false })
      .eq('type', current.type)
      .neq('id', input.id)
  }

  const { data, error } = await supabase
    .from('legal_documents')
    .update({
      title: input.title,
      content_md: input.content_md,
      is_active: input.is_active,
      published_at: input.is_active && !current.is_active ? new Date().toISOString() : undefined
    })
    .eq('id', input.id)
    .select()
    .single()

  if (error) {
    console.error('Failed to update legal document:', error)
    return { error: error.message }
  }

  // Revalidate cache
  revalidateTag('legal-docs')

  return { data }
}

export async function deleteLegalDocument(id: string) {
  const supabase = await createClient()

  // Verify admin
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return { error: 'Unauthorized' }
  }

  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single()

  if (profile?.role !== 'admin') {
    return { error: 'Admin access required' }
  }

  const { error } = await supabase
    .from('legal_documents')
    .delete()
    .eq('id', id)

  if (error) {
    console.error('Failed to delete legal document:', error)
    return { error: error.message }
  }

  // Revalidate cache
  revalidateTag('legal-docs')

  return { success: true }
}

export async function getLegalDocument(id: string) {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from('legal_documents')
    .select('id, title, slug, content, document_type, version, is_active, effective_date, created_at, updated_at')
    .eq('id', id)
    .single()

  if (error) {
    return { error: error.message }
  }

  return { data }
}

export async function getNextVersion(type: LegalDocumentType) {
  const supabase = await createClient()

  const { data } = await supabase
    .from('legal_documents')
    .select('version')
    .eq('type', type)
    .order('version', { ascending: false })
    .limit(1)
    .maybeSingle()

  return (data?.version || 0) + 1
}
