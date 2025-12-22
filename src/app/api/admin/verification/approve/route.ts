import { NextResponse } from 'next/server'
import { requireAdmin } from '@/lib/auth'
import { createAdminClient } from '@/lib/supabase/admin'
import { sanitizeText } from '@/lib/sanitize'
import { rateLimit, RATE_LIMITS } from '@/lib/rate-limit'
import { AppError } from '@/lib/errors'

export const dynamic = 'force-dynamic'
export const revalidate = 0

export async function POST(request: Request) {
  try {
    const { user } = await requireAdmin()
    await rateLimit('admin-approve-helper', user.id, RATE_LIMITS.ADMIN_APPROVE)

    const body = await request.json().catch(() => ({})) as { helperId?: string; comment?: string }
    const helperId = body.helperId
    const adminComment = body.comment ? sanitizeText(body.comment) : null

    if (!helperId) {
      return NextResponse.json({ error: 'helperId is required' }, { status: 400 })
    }

    const adminClient = createAdminClient()

    const { data: helperProfile } = await adminClient
      .from('profiles')
      .select('full_name, email')
      .eq('id', helperId)
      .single()

    const { error: helperError } = await adminClient
      .from('helper_profiles')
      .update({ verification_status: 'approved' as unknown, is_approved: true })
      .eq('user_id', helperId)

    if (helperError) {
      return NextResponse.json({ error: helperError.message || 'Failed to update helper' }, { status: 400 })
    }

    await adminClient
      .from('helper_bank_accounts')
      .update({ status: 'verified' as unknown })
      .eq('helper_id', helperId)

    await adminClient
      .from('verification_documents')
      .update({ status: 'approved' })
      .eq('helper_id', helperId)

    await adminClient
      .from('verification_reviews')
      .insert({
        helper_user_id: helperId,
        admin_user_id: user.id,
        decision: 'approved',
        comment: adminComment
      })

    // Email sending is handled separately in server actions; keep the core approval unblocked here.
    return NextResponse.json({ success: true, email: helperProfile?.email || null })
  } catch (error: unknown) {
    if (error instanceof AppError) {
      console.error('[API Approve] AppError', { code: error.code, message: error.message, status: error.statusCode })
      return NextResponse.json({ error: error.userMessage || error.message }, { status: error.statusCode })
    }
    const message = error instanceof Error ? error.message : 'Unknown error'
    console.error('[API Approve] Failed', { message, error })
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
