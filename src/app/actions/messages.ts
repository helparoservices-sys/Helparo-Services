/**
 * SECURE MESSAGING ACTIONS
 * Server-side actions for chat with validation, sanitization, rate limiting
 */

'use server'

import { createClient } from '@/lib/supabase/server'
import { checkRateLimit } from '@/lib/rate-limit'
import { sanitizeText } from '@/lib/sanitize'
import { logger } from '@/lib/logger'
import { z } from 'zod'

const sendMessageSchema = z.object({
  request_id: z.string().uuid(),
  content: z.string().min(1).max(2000),
})

/**
 * SEND CHAT MESSAGE - Secure version
 * ✅ Authentication required
 * ✅ Rate limited (30 messages per minute)
 * ✅ Input validation
 * ✅ Input sanitization (XSS prevention)
 * ✅ Structured logging
 */
export async function sendChatMessage(formData: z.infer<typeof sendMessageSchema>) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    
    if (!user) {
      return { error: 'Not authenticated' }
    }

    // Rate limiting: 30 messages per minute
    const rateLimitResult = await checkRateLimit(`chat:${user.id}`, { 
      maxRequests: 30, 
      windowMs: 60000 
    })
    if (!rateLimitResult.allowed) {
      return { error: 'Slow down! Too many messages. Please wait a moment.' }
    }

    // Validate input
    const validatedData = sendMessageSchema.parse(formData)

    // Sanitize content (prevent XSS)
    const sanitizedContent = sanitizeText(validatedData.content)

    // Verify user has access to this request
    const { data: request } = await supabase
      .from('service_requests')
      .select('customer_id, helper_id')
      .eq('id', validatedData.request_id)
      .single()

    if (!request) {
      return { error: 'Service request not found' }
    }

    // Check if user is part of this conversation
    if (request.customer_id !== user.id && request.helper_id !== user.id) {
      return { error: 'Unauthorized access to this conversation' }
    }

    // Insert message
    const { data: message, error } = await supabase
      .from('messages')
      .insert({
        request_id: validatedData.request_id,
        sender_id: user.id,
        content: sanitizedContent,
        created_at: new Date().toISOString(),
      })
      .select('id, request_id, sender_id, content, created_at, read_at')
      .single()

    if (error) {
      logger.error('Failed to send message', { error, user_id: user.id })
      return { error: 'Failed to send message. Please try again.' }
    }

    logger.info('Message sent', {
      message_id: message.id,
      sender_id: user.id,
      request_id: validatedData.request_id,
    })

    return { success: true, data: message }
  } catch (error) {
    if (error instanceof z.ZodError) {
      return { error: error.errors[0].message }
    }
    logger.error('Send message error', { error })
    return { error: 'An unexpected error occurred' }
  }
}

/**
 * GET MESSAGES FOR REQUEST
 * User must be part of the conversation
 */
export async function getMessages(requestId: string) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    
    if (!user) {
      return { error: 'Not authenticated' }
    }

    // Verify user has access
    const { data: request } = await supabase
      .from('service_requests')
      .select('customer_id, helper_id')
      .eq('id', requestId)
      .single()

    if (!request || (request.customer_id !== user.id && request.helper_id !== user.id)) {
      return { error: 'Unauthorized access' }
    }

    // Get messages
    const { data, error } = await supabase
      .from('messages')
      .select('id, sender_id, content, created_at')
      .eq('request_id', requestId)
      .order('created_at', { ascending: true })

    if (error) {
      logger.error('Failed to load messages', { error })
      return { error: 'Failed to load messages' }
    }

    return { success: true, data }
  } catch (error) {
    logger.error('Get messages error', { error })
    return { error: 'An unexpected error occurred' }
  }
}
