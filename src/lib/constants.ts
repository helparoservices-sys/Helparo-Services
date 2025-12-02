/**
 * Application Constants & Enums
 * Centralized constants to avoid magic strings and improve type safety
 */

// User Roles
export enum UserRole {
  ADMIN = 'admin',
  HELPER = 'helper',
  CUSTOMER = 'customer'
}

// Service Request Statuses
export enum RequestStatus {
  OPEN = 'open',
  ASSIGNED = 'assigned',
  IN_PROGRESS = 'in_progress',
  COMPLETED = 'completed',
  CANCELLED = 'cancelled',
  DISPUTED = 'disputed'
}

// Payment Statuses
export enum PaymentStatus {
  PENDING = 'pending',
  COMPLETED = 'completed',
  FAILED = 'failed',
  REFUNDED = 'refunded'
}

// Verification Statuses
export enum VerificationStatus {
  PENDING = 'pending',
  APPROVED = 'approved',
  REJECTED = 'rejected',
  EXPIRED = 'expired'
}

// Insurance Claim Statuses
export enum ClaimStatus {
  SUBMITTED = 'submitted',
  UNDER_REVIEW = 'under_review',
  APPROVED = 'approved',
  REJECTED = 'rejected',
  SETTLED = 'settled'
}

// Background Check Types
export enum BackgroundCheckType {
  IDENTITY = 'identity_verification',
  CRIMINAL = 'criminal_record',
  ADDRESS = 'address_verification',
  EMPLOYMENT = 'employment_history'
}

// Badge Types
export enum BadgeType {
  TOP_PERFORMER = 'top_performer',
  QUICK_RESPONDER = 'quick_responder',
  CUSTOMER_FAVORITE = 'customer_favorite',
  VERIFIED_PRO = 'verified_pro',
  FIVE_STAR = 'five_star'
}

// Transaction Types
export enum TransactionType {
  DEPOSIT = 'deposit',
  WITHDRAWAL = 'withdrawal',
  ESCROW = 'escrow',
  PAYMENT = 'payment',
  REFUND = 'refund',
  COMMISSION = 'commission'
}

// Notification Types
export enum NotificationType {
  INFO = 'info',
  SUCCESS = 'success',
  WARNING = 'warning',
  ERROR = 'error',
  NEW_REQUEST = 'new_request',
  BOOKING_CONFIRMED = 'booking_confirmed',
  PAYMENT_RECEIVED = 'payment_received'
}

// Priority Levels
export enum PriorityLevel {
  LOW = 'low',
  MEDIUM = 'medium',
  HIGH = 'high',
  URGENT = 'urgent'
}

// Support Ticket Statuses
export enum TicketStatus {
  OPEN = 'open',
  IN_PROGRESS = 'in_progress',
  RESOLVED = 'resolved',
  CLOSED = 'closed'
}

// Campaign Types
export enum CampaignType {
  PERCENTAGE_DISCOUNT = 'percentage_discount',
  FLAT_DISCOUNT = 'flat_discount',
  BUNDLE_OFFER = 'bundle_offer',
  SEASONAL = 'seasonal'
}

// Trust Score Levels
export enum TrustLevel {
  EXCELLENT = 'excellent',
  GOOD = 'good',
  FAIR = 'fair',
  POOR = 'poor',
  UNRATED = 'unrated'
}

// API Error Codes
export enum ErrorCode {
  UNAUTHORIZED = 'UNAUTHORIZED',
  FORBIDDEN = 'FORBIDDEN',
  NOT_FOUND = 'NOT_FOUND',
  VALIDATION_ERROR = 'VALIDATION_ERROR',
  DATABASE_ERROR = 'DATABASE_ERROR',
  RATE_LIMIT_EXCEEDED = 'RATE_LIMIT_EXCEEDED',
  INSUFFICIENT_FUNDS = 'INSUFFICIENT_FUNDS',
  ALREADY_EXISTS = 'ALREADY_EXISTS'
}

// Application Configuration
export const APP_CONFIG = {
  MAX_FILE_SIZE: 5 * 1024 * 1024, // 5MB
  MAX_IMAGES_PER_REVIEW: 5,
  SESSION_TIMEOUT: 24 * 60 * 60 * 1000, // 24 hours
  OTP_EXPIRY: 10 * 60 * 1000, // 10 minutes
  MAX_LOGIN_ATTEMPTS: 5,
  RATE_LIMIT_WINDOW: 15 * 60 * 1000, // 15 minutes
  RATE_LIMIT_MAX_REQUESTS: 100,
  MIN_PASSWORD_LENGTH: 8,
  MAX_PASSWORD_LENGTH: 128
} as const

// Currency Configuration
export const CURRENCY = {
  CODE: 'INR',
  SYMBOL: '₹',
  LOCALE: 'en-IN'
} as const

// Commission Configuration
export const COMMISSION = {
  PLATFORM_PERCENTAGE: 12, // 12% platform fee
  MIN_AMOUNT: 10 // Minimum ₹10
} as const

// Pagination Defaults
export const PAGINATION = {
  DEFAULT_PAGE_SIZE: 20,
  MAX_PAGE_SIZE: 100
} as const
