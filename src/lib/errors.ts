/**
 * Error Handling Utilities
 * Provides consistent error handling and user-friendly error messages
 */

import { ErrorCode } from './constants'

/**
 * Application Error Class
 */
export class AppError extends Error {
  constructor(
    public code: ErrorCode,
    public message: string,
    public userMessage: string,
    public statusCode: number = 400,
    public details?: any
  ) {
    super(message)
    this.name = 'AppError'
  }
}

/**
 * Map database/technical errors to user-friendly messages
 */
const ERROR_MESSAGES: Record<string, string> = {
  // Authentication Errors
  'jwt expired': 'Your session has expired. Please log in again.',
  'invalid jwt': 'Your session is invalid. Please log in again.',
  'not authenticated': 'Please log in to continue.',
  'unauthorized': 'You don\'t have permission to access this.',
  
  // Database Errors
  'foreign key constraint': 'This item is no longer available. Please refresh the page.',
  'not-null constraint': 'Required information is missing. Please fill all required fields.',
  'unique constraint': 'This already exists in your account.',
  'violates check constraint': 'Invalid data provided. Please check your input.',
  '23505': 'This record already exists.',
  '23503': 'Related item not found.',
  '23502': 'Required field is missing.',
  
  // Network Errors
  'network error': 'Connection issue. Please check your internet and try again.',
  'timeout': 'Request timed out. Please try again.',
  'failed to fetch': 'Unable to connect. Please check your internet connection.',
  
  // Validation Errors
  'invalid email': 'Please enter a valid email address.',
  'invalid password': 'Password must be at least 8 characters.',
  'passwords do not match': 'Passwords don\'t match. Please try again.',
  'invalid phone': 'Please enter a valid phone number.',
  
  // Business Logic Errors
  'insufficient funds': 'Insufficient balance in your wallet.',
  'insufficient points': 'You don\'t have enough points for this action.',
  'already exists': 'This already exists in your account.',
  'not found': 'The requested item was not found.',
  'already reviewed': 'You have already reviewed this service.',
  'already applied': 'You have already applied for this request.',
  'invalid status': 'This action cannot be performed at this time.',
  'max redemptions': 'You have reached the maximum number of redemptions.',
  
  // Generic Errors
  'internal server error': 'Something went wrong. Please try again later.',
  'service unavailable': 'Service temporarily unavailable. Please try again later.',
}

/**
 * Convert technical error to user-friendly message
 */
export function getUserFriendlyError(error: any): string {
  if (!error) return 'An unexpected error occurred. Please try again.'
  
  const message = (error.message || error.toString()).toLowerCase()
  
  // Check for specific error patterns
  for (const [key, friendlyMsg] of Object.entries(ERROR_MESSAGES)) {
    if (message.includes(key.toLowerCase())) {
      return friendlyMsg
    }
  }
  
  // Check error code
  if (error.code) {
    const code = error.code.toString()
    if (ERROR_MESSAGES[code]) {
      return ERROR_MESSAGES[code]
    }
  }
  
  // Default message
  return 'Something went wrong. Please try again or contact support if the problem persists.'
}

/**
 * Format error for logging (includes technical details)
 */
export function formatErrorForLogging(error: any, context?: Record<string, any>) {
  return {
    message: error.message || 'Unknown error',
    code: error.code,
    stack: error.stack,
    timestamp: new Date().toISOString(),
    context
  }
}

/**
 * Handle server action error with proper formatting
 */
export function handleServerActionError(error: any, userContext?: string) {
  // Log full error for debugging (in development)
  if (process.env.NODE_ENV === 'development') {
    console.error('Server Action Error:', formatErrorForLogging(error))
  }
  
  // Return user-friendly error
  return {
    error: getUserFriendlyError(error),
    code: error.code || ErrorCode.DATABASE_ERROR
  }
}

/**
 * Validation error helper
 */
export function createValidationError(message: string, details?: any): AppError {
  return new AppError(
    ErrorCode.VALIDATION_ERROR,
    'Validation failed',
    message,
    400,
    details
  )
}

/**
 * Authorization error helper
 */
export function createUnauthorizedError(message?: string): AppError {
  return new AppError(
    ErrorCode.UNAUTHORIZED,
    'Unauthorized',
    message || 'Please log in to continue.',
    401
  )
}

/**
 * Forbidden error helper
 */
export function createForbiddenError(message?: string): AppError {
  return new AppError(
    ErrorCode.FORBIDDEN,
    'Forbidden',
    message || 'You don\'t have permission to perform this action.',
    403
  )
}

/**
 * Not found error helper
 */
export function createNotFoundError(resource: string): AppError {
  return new AppError(
    ErrorCode.NOT_FOUND,
    `${resource} not found`,
    `The requested ${resource.toLowerCase()} was not found.`,
    404
  )
}

/**
 * Rate limit error helper
 */
export function createRateLimitError(): AppError {
  return new AppError(
    ErrorCode.RATE_LIMIT_EXCEEDED,
    'Rate limit exceeded',
    'Too many requests. Please try again in a few minutes.',
    429
  )
}
