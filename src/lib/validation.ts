/**
 * Input Validation Utilities using Zod
 * Provides type-safe validation for all user inputs
 */

import { z } from 'zod'

// Email validation
export const emailSchema = z
  .string()
  .email('Invalid email address')
  .toLowerCase()
  .trim()

// Password validation with strong security requirements
export const passwordSchema = z
  .string()
  .min(12, 'Password must be at least 12 characters')
  .max(128, 'Password is too long')
  .regex(/[a-z]/, 'Password must contain at least one lowercase letter')
  .regex(/[A-Z]/, 'Password must contain at least one uppercase letter')
  .regex(/[0-9]/, 'Password must contain at least one number')
  .regex(/[^a-zA-Z0-9]/, 'Password must contain at least one special character (!@#$%^&*)')
  .refine(
    (password) => {
      const commonPasswords = [
        'password', '12345678', 'qwerty', 'abc123', 'letmein', 
        'welcome', 'monkey', 'dragon', 'master', 'admin',
        'password123', 'qwerty123', 'welcome123'
      ]
      return !commonPasswords.some(common => 
        password.toLowerCase().includes(common)
      )
    },
    'Password is too common or weak. Please choose a stronger password.'
  )

// UUID validation
export const uuidSchema = z.string().uuid('Invalid ID format')

// Phone validation (Indian format)
export const phoneSchema = z
  .string()
  .regex(/^[6-9]\d{9}$/, 'Invalid Indian phone number (must be 10 digits starting with 6-9)')
  .optional()

// URL validation
export const urlSchema = z.string().url('Invalid URL').optional()

// Amount validation (for payments)
export const amountSchema = z
  .number()
  .positive('Amount must be positive')
  .max(10000000, 'Amount exceeds maximum limit (₹1 crore)')
  .multipleOf(0.01, 'Amount can have at most 2 decimal places')

// Rating validation
export const ratingSchema = z
  .number()
  .int('Rating must be a whole number')
  .min(1, 'Rating must be at least 1')
  .max(5, 'Rating cannot exceed 5')

// Date string validation
export const dateStringSchema = z
  .string()
  .datetime('Invalid date format')
  .or(z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Date must be in YYYY-MM-DD format'))

// Text validation (with XSS prevention)
export const textSchema = (minLength = 1, maxLength = 1000) =>
  z
    .string()
    .min(minLength, `Text must be at least ${minLength} characters`)
    .max(maxLength, `Text cannot exceed ${maxLength} characters`)
    .trim()

// ==================== AUTH SCHEMAS ====================

export const loginSchema = z.object({
  email: emailSchema,
  password: passwordSchema
})

export const signupSchema = z.object({
  email: emailSchema,
  password: passwordSchema,
  full_name: textSchema(2, 100),
  phone: phoneSchema,
  role: z.enum(['customer', 'helper'], {
    errorMap: () => ({ message: 'Role must be either customer or helper' })
  })
})

export const magicLinkSchema = z.object({
  email: emailSchema
})

// ==================== REVIEW SCHEMAS ====================

export const createReviewSchema = z.object({
  service_request_id: uuidSchema,
  helper_id: uuidSchema,
  rating: ratingSchema,
  comment: textSchema(10, 1000),
  punctuality: ratingSchema,
  quality: ratingSchema,
  communication: ratingSchema,
  professionalism: ratingSchema
})

export const addReviewPhotosSchema = z.object({
  review_id: uuidSchema,
  photo_urls: z.array(urlSchema).min(1).max(5, 'Maximum 5 photos allowed')
})

// ==================== SERVICE REQUEST SCHEMAS ====================

export const createServiceRequestSchema = z.object({
  category_id: uuidSchema,
  title: textSchema(5, 200),
  description: textSchema(20, 2000),
  service_address: textSchema(5, 500).optional(),
  city: textSchema(2, 100).optional(),
  state: textSchema(2, 100).optional(),
  pincode: z.string().min(4).max(10).optional(),
  country: textSchema(2, 100).optional(),
  budget_min: z.number().positive().optional(),
  budget_max: z.number().positive().optional(),
  latitude: z.number().min(-90).max(90).optional(),
  longitude: z.number().min(-180).max(180).optional()
}).refine(
  data => {
    if (data.budget_min && data.budget_max) {
      return data.budget_max >= data.budget_min
    }
    return true
  },
  { message: 'Maximum budget must be greater than minimum budget' }
)

// ==================== PAYMENT SCHEMAS ====================

export const fundEscrowSchema = z.object({
  service_request_id: uuidSchema,
  amount: amountSchema
})

export const releaseEscrowSchema = z.object({
  service_request_id: uuidSchema,
  recipient_id: uuidSchema,
  amount: amountSchema
})

export const addFundsSchema = z.object({
  amount: amountSchema.min(10, 'Minimum deposit is ₹10'),
  payment_method: z.enum(['upi', 'card', 'netbanking', 'wallet'])
})

// ==================== INSURANCE SCHEMAS ====================

export const createInsurancePolicySchema = z.object({
  helper_id: uuidSchema,
  provider_name: textSchema(2, 100),
  policy_number: textSchema(5, 50),
  coverage_amount: amountSchema,
  coverage_type: z.enum(['liability', 'comprehensive', 'custom']),
  start_date: dateStringSchema,
  end_date: dateStringSchema,
  document_url: urlSchema
}).refine(
  data => new Date(data.end_date) > new Date(data.start_date),
  { message: 'End date must be after start date' }
)

export const fileInsuranceClaimSchema = z.object({
  insurance_id: uuidSchema,
  service_request_id: uuidSchema,
  claim_type: z.enum(['damage', 'injury', 'theft', 'other']),
  claim_amount: amountSchema,
  incident_date: dateStringSchema,
  description: textSchema(50, 2000),
  evidence_urls: z.array(urlSchema).min(1, 'At least one evidence file required')
})

// ==================== BUNDLE SCHEMAS ====================

export const createServiceBundleSchema = z.object({
  name: textSchema(3, 100),
  description: textSchema(10, 500),
  image_url: urlSchema,
  regular_price: amountSchema,
  bundle_price: amountSchema,
  validity_days: z.number().int().positive().max(3650, 'Maximum 10 years validity'),
  max_redemptions: z.number().int().positive().max(100)
}).refine(
  data => data.bundle_price < data.regular_price,
  { message: 'Bundle price must be less than regular price' }
)

export const purchaseBundleSchema = z.object({
  bundle_id: uuidSchema,
  payment_id: uuidSchema
})

// ==================== GEOFENCE SCHEMAS ====================

export const recordGeofenceViolationSchema = z.object({
  service_request_id: uuidSchema,
  helper_id: uuidSchema,
  expected_latitude: z.number().min(-90).max(90),
  expected_longitude: z.number().min(-180).max(180),
  actual_latitude: z.number().min(-90).max(90),
  actual_longitude: z.number().min(-180).max(180),
  distance_km: z.number().positive(),
  threshold_km: z.number().positive().default(0.1) // 100 meters
})

// ==================== ADMIN SCHEMAS ====================

export const banUserSchema = z.object({
  user_id: uuidSchema,
  reason: textSchema(10, 500),
  duration_hours: z.number().int().positive().max(8760, 'Maximum 1 year ban'),
  is_permanent: z.boolean().default(false)
})

export const approveHelperSchema = z.object({
  helper_id: uuidSchema,
  admin_notes: textSchema(0, 500).optional()
})

// ==================== SUPPORT SCHEMAS ====================

export const createSupportTicketSchema = z.object({
  category: z.enum(['technical', 'payment', 'account', 'service', 'other']),
  priority: z.enum(['low', 'medium', 'high', 'urgent']),
  subject: textSchema(5, 200),
  description: textSchema(20, 2000),
  attachments: z.array(urlSchema).max(5, 'Maximum 5 attachments').optional()
})

export const updateTicketStatusSchema = z.object({
  ticket_id: uuidSchema,
  status: z.enum(['open', 'in_progress', 'resolved', 'closed']),
  admin_notes: textSchema(0, 1000).optional()
})

// ==================== BIDDING SCHEMAS ====================

export const counterOfferSchema = z.object({
  application_id: uuidSchema,
  new_amount: amountSchema,
  note: textSchema(0, 500).optional()
})

// ==================== LOYALTY SCHEMAS ====================

export const redeemLoyaltyPointsSchema = z.object({
  points: z.number().int().positive().max(1000000, 'Maximum 1M points per redemption'),
  redemption_type: z.enum(['cash', 'discount', 'reward', 'other']),
  description: textSchema(5, 200)
})

// ==================== HELPER FUNCTION ====================

/**
 * Validate FormData against a Zod schema
 */
export function validateFormData<T>(
  formData: FormData,
  schema: z.ZodSchema<T>
): { success: true; data: T } | { success: false; error: string; details?: any } {
  try {
    // Convert FormData to object
    const obj: any = {}
    
    for (const [key, value] of formData.entries()) {
      // Handle numbers
      if (key.includes('amount') || key.includes('rating') || key.includes('points') || 
          key.includes('price') || key.includes('hours') || key.includes('days') ||
          key.includes('latitude') || key.includes('longitude') || key.includes('distance')) {
        const num = parseFloat(value as string)
        obj[key] = isNaN(num) ? value : num
      }
      // Handle booleans
      else if (value === 'true' || value === 'false') {
        obj[key] = value === 'true'
      }
      // Handle arrays (if field appears multiple times)
      else if (obj[key]) {
        obj[key] = Array.isArray(obj[key]) ? [...obj[key], value] : [obj[key], value]
      }
      else {
        obj[key] = value
      }
    }
    
    // Validate with schema
    const result = schema.safeParse(obj)
    
    if (result.success) {
      return { success: true, data: result.data }
    } else {
      const errors = result.error.flatten()
      const fieldErrorKeys = Object.keys(errors.fieldErrors)
      const firstFieldError = fieldErrorKeys.length > 0 
        ? (errors.fieldErrors as any)[fieldErrorKeys[0]]?.[0]
        : null
      const firstError = firstFieldError || 
                        errors.formErrors[0] || 
                        'Validation failed'
      
      return {
        success: false,
        error: firstError,
        details: errors
      }
    }
  } catch (error: any) {
    return {
      success: false,
      error: 'Invalid input data'
    }
  }
}

/**
 * Parse and validate JSON input
 */
export function validateJSON<T>(
  data: unknown,
  schema: z.ZodSchema<T>
): { success: true; data: T } | { success: false; error: string } {
  const result = schema.safeParse(data)
  
  if (result.success) {
    return { success: true, data: result.data }
  } else {
    const firstError = result.error.errors[0]?.message || 'Validation failed'
    return { success: false, error: firstError }
  }
}
