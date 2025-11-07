/**
 * Structured logging utility
 * Replaces console.log/error with proper logging
 */

type LogLevel = 'debug' | 'info' | 'warn' | 'error'

interface LogContext {
  [key: string]: any
}

class Logger {
  private isDevelopment = process.env.NODE_ENV === 'development'
  
  private log(level: LogLevel, message: string, context?: LogContext) {
    const timestamp = new Date().toISOString()
    const logEntry = {
      timestamp,
      level,
      message,
      ...context
    }
    
    // In development, use console for better readability
    if (this.isDevelopment) {
      const color = {
        debug: '\x1b[36m', // Cyan
        info: '\x1b[32m',  // Green
        warn: '\x1b[33m',  // Yellow
        error: '\x1b[31m'  // Red
      }[level]
      const reset = '\x1b[0m'
      
      console.log(
        `${color}[${level.toUpperCase()}]${reset} ${timestamp} - ${message}`,
        context ? context : ''
      )
      return
    }
    
    // In production, output structured JSON logs
    // These can be easily parsed by log aggregation services
    console.log(JSON.stringify(logEntry))
  }
  
  debug(message: string, context?: LogContext) {
    if (this.isDevelopment) {
      this.log('debug', message, context)
    }
  }
  
  info(message: string, context?: LogContext) {
    this.log('info', message, context)
  }
  
  warn(message: string, context?: LogContext) {
    this.log('warn', message, context)
  }
  
  error(message: string, error?: any, context?: LogContext) {
    const errorContext: LogContext = {
      ...context,
      error: error instanceof Error ? {
        name: error.name,
        message: error.message,
        stack: this.isDevelopment ? error.stack : undefined
      } : error
    }
    
    this.log('error', message, errorContext)
  }
  
  // Specific logging methods for common scenarios
  auth(action: string, userId?: string, success: boolean = true, context?: LogContext) {
    this.info(`Auth: ${action}`, {
      userId,
      success,
      ...context
    })
  }
  
  payment(action: string, amount: number, userId: string, context?: LogContext) {
    this.info(`Payment: ${action}`, {
      userId,
      amount,
      ...context
    })
  }
  
  security(event: string, severity: 'low' | 'medium' | 'high' | 'critical', context?: LogContext) {
    this.warn(`Security: ${event}`, {
      severity,
      ...context
    })
  }
}

// Export singleton instance
export const logger = new Logger()

// Convenience function to replace console.error throughout the codebase
export function logError(message: string, error?: any, context?: LogContext) {
  logger.error(message, error, context)
}
