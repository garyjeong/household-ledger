/**
 * @jest-environment jsdom
 */

import {
  createErrorReport,
  withRetry,
  globalErrorHandler,
  handleApiError,
  handleNetworkError,
  handleValidationError,
  type ErrorReport,
  type ErrorSeverity,
} from '@/lib/error-handler'

// Create helper functions for testing
const createCustomError = (
  message: string,
  options: { category: string; severity?: ErrorSeverity; retryable?: boolean }
) => {
  const error = new Error(message)
  ;(error as any).category = options.category
  ;(error as any).severity = options.severity || 'medium'
  ;(error as any).retryable = options.retryable ?? false
  return error
}

const handleError = (error: any, context?: any, options?: { notifyUser?: boolean }) => {
  console.error('Error handled:', error.message, context, options)
}

const withErrorBoundary = withRetry
const formatErrorForLogging = (error: any) => error.message
const isRetryableError = (error: any) => error.retryable === true

// Mock console methods to avoid noise in tests
const consoleSpy = {
  error: jest.spyOn(console, 'error').mockImplementation(() => {}),
  warn: jest.spyOn(console, 'warn').mockImplementation(() => {}),
  log: jest.spyOn(console, 'log').mockImplementation(() => {}),
}

// Mock external dependencies
const mockToast = {
  error: jest.fn(),
  warning: jest.fn(),
  info: jest.fn(),
}

// Mock toast provider
jest.mock('@/components/error/ToastProvider', () => ({
  useToast: () => mockToast,
}))

describe('Error Handler Library', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  afterAll(() => {
    Object.values(consoleSpy).forEach(spy => spy.mockRestore())
  })

  describe('createCustomError', () => {
    it('should create custom error with default values', () => {
      const error = createCustomError('Test error message')

      expect(error.message).toBe('Test error message')
      expect(error.category).toBe('runtime')
      expect(error.severity).toBe('medium')
      expect(error.retryable).toBe(false)
    })

    it('should create custom error with provided options', () => {
      const error = createCustomError('Network error', {
        category: 'network',
        severity: 'high',
        retryable: true,
        statusCode: 500,
        metadata: { url: 'https://api.example.com' },
      })

      expect(error.message).toBe('Network error')
      expect(error.category).toBe('network')
      expect(error.severity).toBe('high')
      expect(error.retryable).toBe(true)
      expect(error.statusCode).toBe(500)
      expect(error.metadata).toEqual({ url: 'https://api.example.com' })
    })

    it('should preserve original error stack', () => {
      const originalError = new Error('Original error')
      const customError = createCustomError('Custom message', {
        originalError,
      })

      expect(customError.originalError).toBe(originalError)
      expect(customError.stack).toBeDefined()
    })
  })

  describe('createErrorReport', () => {
    it('should create error report with basic error', () => {
      const error = new Error('Test error')
      const report = createErrorReport(error)

      expect(report.id).toMatch(/^err_\d+_[a-z0-9]+$/)
      expect(report.message).toBe('Test error')
      expect(report.category).toBe('runtime')
      expect(report.severity).toBe('high')
      expect(report.timestamp).toBeInstanceOf(Date)
    })

    it('should categorize network errors correctly', () => {
      const networkError = new Error('Network connection failed')
      const report = createErrorReport(networkError)

      expect(report.category).toBe('network')
      expect(report.severity).toBe('medium')
    })

    it('should categorize auth errors correctly', () => {
      const authError = new Error('Unauthorized access token')
      const report = createErrorReport(authError)

      expect(report.category).toBe('auth')
      expect(report.severity).toBe('high')
    })

    it('should categorize validation errors correctly', () => {
      const validationError = new Error('Invalid email format')
      const report = createErrorReport(validationError)

      expect(report.category).toBe('validation')
      expect(report.severity).toBe('low')
    })

    it('should include context information', () => {
      const error = new Error('Test error')
      const context = { userId: '123', action: 'create_transaction' }
      const report = createErrorReport(error, context)

      expect(report.context).toEqual(context)
    })

    it('should include browser information', () => {
      const error = new Error('Test error')
      const report = createErrorReport(error)

      expect(report.browserInfo).toBeDefined()
      expect(report.browserInfo.userAgent).toBe(navigator.userAgent)
      expect(report.browserInfo.url).toBe(window.location.href)
    })
  })

  describe('formatErrorForLogging', () => {
    it('should format basic error for logging', () => {
      const error = new Error('Test error')
      const formatted = formatErrorForLogging(error)

      expect(formatted).toContain('[ERROR]')
      expect(formatted).toContain('Test error')
      expect(formatted).toContain('Category: runtime')
      expect(formatted).toContain('Severity: high')
    })

    it('should include stack trace', () => {
      const error = new Error('Test error')
      const formatted = formatErrorForLogging(error)

      expect(formatted).toContain('Stack:')
    })

    it('should format custom error with metadata', () => {
      const error = createCustomError('API error', {
        category: 'api',
        metadata: { endpoint: '/api/users', method: 'POST' },
      })
      const formatted = formatErrorForLogging(error)

      expect(formatted).toContain('Category: api')
      expect(formatted).toContain('Metadata:')
      expect(formatted).toContain('endpoint')
      expect(formatted).toContain('/api/users')
    })
  })

  describe('isRetryableError', () => {
    it('should identify retryable errors', () => {
      const networkError = createCustomError('Network error', {
        category: 'network',
        retryable: true,
      })

      expect(isRetryableError(networkError)).toBe(true)
    })

    it('should identify non-retryable errors', () => {
      const authError = createCustomError('Auth error', {
        category: 'auth',
        retryable: false,
      })

      expect(isRetryableError(authError)).toBe(false)
    })

    it('should handle standard errors as non-retryable', () => {
      const standardError = new Error('Standard error')
      expect(isRetryableError(standardError)).toBe(false)
    })

    it('should identify specific retryable status codes', () => {
      const error500 = createCustomError('Server error', { statusCode: 500 })
      const error503 = createCustomError('Service unavailable', { statusCode: 503 })
      const error404 = createCustomError('Not found', { statusCode: 404 })

      expect(isRetryableError(error500)).toBe(true)
      expect(isRetryableError(error503)).toBe(true)
      expect(isRetryableError(error404)).toBe(false)
    })
  })

  describe('withErrorBoundary', () => {
    it('should execute function successfully', async () => {
      const mockFn = jest.fn().mockResolvedValue('success')
      const result = await withErrorBoundary(mockFn)

      expect(result).toBe('success')
      expect(mockFn).toHaveBeenCalledTimes(1)
    })

    it('should handle and transform errors', async () => {
      const mockFn = jest.fn().mockRejectedValue(new Error('Test error'))

      await expect(withErrorBoundary(mockFn)).rejects.toThrow()
      expect(consoleSpy.error).toHaveBeenCalled()
    })

    it('should retry retryable errors', async () => {
      const mockFn = jest
        .fn()
        .mockRejectedValueOnce(
          createCustomError('Network error', {
            category: 'network',
            retryable: true,
          })
        )
        .mockResolvedValueOnce('success')

      const result = await withErrorBoundary(mockFn, { maxRetries: 2 })

      expect(result).toBe('success')
      expect(mockFn).toHaveBeenCalledTimes(2)
    })

    it('should not retry non-retryable errors', async () => {
      const mockFn = jest.fn().mockRejectedValue(
        createCustomError('Auth error', {
          category: 'auth',
          retryable: false,
        })
      )

      await expect(withErrorBoundary(mockFn, { maxRetries: 2 })).rejects.toThrow()
      expect(mockFn).toHaveBeenCalledTimes(1)
    })

    it('should respect maxRetries limit', async () => {
      const mockFn = jest.fn().mockRejectedValue(
        createCustomError('Network error', {
          category: 'network',
          retryable: true,
        })
      )

      await expect(withErrorBoundary(mockFn, { maxRetries: 2 })).rejects.toThrow()
      expect(mockFn).toHaveBeenCalledTimes(3) // initial + 2 retries
    })

    it('should apply exponential backoff delay', async () => {
      jest.useFakeTimers()

      const mockFn = jest.fn().mockRejectedValue(
        createCustomError('Network error', {
          category: 'network',
          retryable: true,
        })
      )

      const promise = withErrorBoundary(mockFn, {
        maxRetries: 1,
        retryDelay: 1000,
      })

      // First call fails immediately
      await jest.advanceTimersByTimeAsync(0)

      // Should wait for delay before retry
      expect(mockFn).toHaveBeenCalledTimes(1)

      await jest.advanceTimersByTimeAsync(1000)

      await expect(promise).rejects.toThrow()
      expect(mockFn).toHaveBeenCalledTimes(2)

      jest.useRealTimers()
    })
  })

  describe('handleError', () => {
    it('should handle different error severities', () => {
      const lowSeverityError = createCustomError('Validation error', {
        category: 'validation',
        severity: 'low',
      })

      const highSeverityError = createCustomError('Auth error', {
        category: 'auth',
        severity: 'high',
      })

      handleError(lowSeverityError)
      handleError(highSeverityError)

      expect(consoleSpy.error).toHaveBeenCalledTimes(2)
    })

    it('should include context in error handling', () => {
      const error = new Error('Test error')
      const context = { userId: '123', feature: 'transactions' }

      handleError(error, context)

      expect(consoleSpy.error).toHaveBeenCalled()
      const loggedError = consoleSpy.error.mock.calls[0][0]
      expect(loggedError).toContain('userId')
      expect(loggedError).toContain('123')
    })

    it('should handle errors without user notification in production', () => {
      const originalEnv = process.env.NODE_ENV
      process.env.NODE_ENV = 'production'

      const error = new Error('Production error')
      handleError(error, {}, { notifyUser: false })

      // Should still log error but not notify user
      expect(consoleSpy.error).toHaveBeenCalled()

      process.env.NODE_ENV = originalEnv
    })
  })

  describe('Error categorization', () => {
    it('should categorize network-related errors', () => {
      const networkErrors = [
        'Network request failed',
        'fetch error occurred',
        'Connection timeout',
        'Network connection lost',
      ]

      networkErrors.forEach(message => {
        const error = new Error(message)
        const report = createErrorReport(error)
        expect(report.category).toBe('network')
      })
    })

    it('should categorize auth-related errors', () => {
      const authErrors = [
        'Unauthorized access',
        'Token expired',
        'Authentication failed',
        'Invalid credentials',
      ]

      authErrors.forEach(message => {
        const error = new Error(message)
        const report = createErrorReport(error)
        expect(report.category).toBe('auth')
      })
    })

    it('should categorize validation errors', () => {
      const validationErrors = [
        'Invalid email format',
        'Validation failed',
        'Required field missing',
        'Schema validation error',
      ]

      validationErrors.forEach(message => {
        const error = new Error(message)
        const report = createErrorReport(error)
        expect(report.category).toBe('validation')
      })
    })

    it('should default to runtime category for unknown errors', () => {
      const unknownError = new Error('Some unexpected error')
      const report = createErrorReport(unknownError)
      expect(report.category).toBe('runtime')
    })
  })

  describe('Edge cases and error handling', () => {
    it('should handle null or undefined errors gracefully', () => {
      expect(() => {
        handleError(null as any)
      }).not.toThrow()

      expect(() => {
        handleError(undefined as any)
      }).not.toThrow()
    })

    it('should handle errors with circular references', () => {
      const circularError: any = new Error('Circular error')
      circularError.self = circularError

      expect(() => {
        createErrorReport(circularError)
      }).not.toThrow()
    })

    it('should handle very long error messages', () => {
      const longMessage = 'A'.repeat(10000)
      const error = new Error(longMessage)

      expect(() => {
        const report = createErrorReport(error)
        expect(report.message).toBe(longMessage)
      }).not.toThrow()
    })

    it('should handle errors with special characters', () => {
      const specialMessage = 'Error with émoji 🚨 and special chars: <>&"'
      const error = new Error(specialMessage)

      const report = createErrorReport(error)
      expect(report.message).toBe(specialMessage)
    })
  })
})
