// tests/lib/security-utils.test.ts
import {
  safeConsole,
  logApiCall,
  sanitizeObject,
  sanitizeString,
  sanitizeURL,
} from '@/lib/security-utils'

describe('Security Utils', () => {
  // Console mock setup
  const originalConsole = console
  let mockConsole: jest.Mocked<Console>

  beforeEach(() => {
    mockConsole = {
      log: jest.fn(),
      info: jest.fn(),
      warn: jest.fn(),
      error: jest.fn(),
    } as any
    global.console = mockConsole
  })

  afterEach(() => {
    global.console = originalConsole
    jest.clearAllMocks()
  })

  describe('safeConsole', () => {
    describe('in development environment', () => {
      beforeEach(() => {
        process.env.NODE_ENV = 'development'
      })

      it('should log all levels in development', () => {
        safeConsole.log('test log')
        safeConsole.info('test info')
        safeConsole.warn('test warn')
        safeConsole.error('test error')

        expect(mockConsole.log).toHaveBeenCalledWith('test log', '')
        expect(mockConsole.info).toHaveBeenCalledWith('test info', '')
        expect(mockConsole.warn).toHaveBeenCalledWith('test warn', '')
        expect(mockConsole.error).toHaveBeenCalled()
      })
    })

    describe('in production environment', () => {
      beforeEach(() => {
        process.env.NODE_ENV = 'production'
      })

      it('should only log warn and error in production', () => {
        safeConsole.log('test log')
        safeConsole.info('test info')
        safeConsole.warn('test warn')
        safeConsole.error('test error')

        expect(mockConsole.log).not.toHaveBeenCalled()
        expect(mockConsole.info).not.toHaveBeenCalled()
        expect(mockConsole.warn).toHaveBeenCalledWith('test warn', '')
        expect(mockConsole.error).toHaveBeenCalled()
      })
    })

    describe('sensitive data masking', () => {
      beforeEach(() => {
        process.env.NODE_ENV = 'development'
      })

      it('should mask sensitive object properties', () => {
        const sensitiveData = {
          username: 'testuser',
          password: 'secret123',
          token: 'abc123',
          refreshToken: 'def456',
          normal: 'visible',
        }

        safeConsole.log('User data:', sensitiveData)

        expect(mockConsole.log).toHaveBeenCalledWith('User data:', {
          username: 'testuser',
          password: '[REDACTED]',
          token: '[REDACTED]',
          refreshToken: '[REDACTED]',
          normal: 'visible',
        })
      })

      it('should handle nested objects with depth limit', () => {
        const nestedData = {
          users: [
            { id: 1, password: 'secret1' },
            { id: 2, token: 'token123' },
          ],
          config: {
            api: { key: 'visible' },
            auth: { secret: 'hidden' },
          },
        }

        safeConsole.log('Nested data:', nestedData)

        // The actual implementation has depth limits and masks all keys containing sensitive keywords
        expect(mockConsole.log).toHaveBeenCalledWith(
          'Nested data:',
          expect.objectContaining({
            users: expect.arrayContaining([
              expect.objectContaining({ password: '[REDACTED]' }),
              expect.objectContaining({ token: '[REDACTED]' }),
            ]),
            config: expect.objectContaining({
              auth: expect.objectContaining({ secret: '[REDACTED]' }),
            }),
          })
        )
      })

      it('should handle email masking in strings', () => {
        const normalData = {
          id: 123,
          name: 'Test User',
          email: 'test@example.com',
          settings: { theme: 'dark' },
        }

        safeConsole.log('Normal data:', normalData)

        // Email gets partially masked due to sanitizeString
        expect(mockConsole.log).toHaveBeenCalledWith(
          'Normal data:',
          expect.objectContaining({
            id: 123,
            name: 'Test User',
            email: 'te**@example.com', // Email gets masked
            settings: { theme: 'dark' },
          })
        )
      })
    })

    describe('sanitizeString function', () => {
      it('should mask JWT tokens in strings', () => {
        const jwt =
          'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIiwibmFtZSI6IkpvaG4gRG9lIiwiaWF0IjoxNTE2MjM5MDIyfQ.SflKxwRJSMeKKF2QT4fwpMeJf36POk6yJV_adQssw5c'

        const result = sanitizeString(jwt)

        expect(result).toBe('[JWT_TOKEN_REDACTED]')
      })

      it('should mask email addresses', () => {
        const email = 'user@example.com'

        const result = sanitizeString(email)

        expect(result).toBe('us**@example.com') // Correct pattern
      })

      it('should mask bearer tokens', () => {
        const bearerToken = 'Bearer abc123def456'

        const result = sanitizeString(bearerToken)

        expect(result).toBe('Bearer [TOKEN_REDACTED]')
      })
    })

    describe('sanitizeURL function', () => {
      it('should mask sensitive query parameters', () => {
        const url = '/api/auth?token=secret123&password=abc&normal=visible'

        const result = sanitizeURL(url)

        expect(result).toContain('%5BREDACTED%5D') // URL encoded version
        expect(result).toContain('normal=visible')
      })
    })
  })

  describe('logApiCall', () => {
    beforeEach(() => {
      process.env.NODE_ENV = 'development'
    })

    it('should log successful API calls in development', () => {
      logApiCall('GET', '/api/users', 200, 150)

      expect(mockConsole.log).toHaveBeenCalledWith('[API Success] GET /api/users (200) (150ms)', '')
    })

    it('should log failed API calls in development', () => {
      const error = new Error('Network error')
      logApiCall('POST', '/api/auth/login', 500, 300, error)

      expect(mockConsole.error).toHaveBeenCalledWith(
        '[API Error] POST /api/auth/login (500) (300ms)',
        expect.objectContaining({
          error: expect.objectContaining({
            name: 'Error',
            message: 'Network error',
          }),
          timestamp: expect.stringMatching(/\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z/),
          environment: 'development',
        })
      )
    })

    it('should not log success in production', () => {
      process.env.NODE_ENV = 'production'

      logApiCall('GET', '/api/users', 200, 150)

      expect(mockConsole.log).not.toHaveBeenCalled()
    })

    it('should still log errors in production', () => {
      process.env.NODE_ENV = 'production'
      const error = new Error('Server error')

      logApiCall('POST', '/api/auth/login', 500, 300, error)

      expect(mockConsole.error).toHaveBeenCalled()
    })

    it('should mask sensitive data in URLs and errors', () => {
      const sensitiveError = new Error(
        'JWT token expired: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIiwibmFtZSI6IkpvaG4gRG9lIiwiaWF0IjoxNTE2MjM5MDIyfQ.SflKxwRJSMeKKF2QT4fwpMeJf36POk6yJV_adQssw5c'
      )
      logApiCall('POST', '/api/auth/refresh?token=secret123', 401, 200, sensitiveError)

      expect(mockConsole.error).toHaveBeenCalledWith(
        expect.stringContaining(
          '[API Error] POST /api/auth/refresh?token=%5BREDACTED%5D (401) (200ms)'
        ), // URL encoded
        expect.objectContaining({
          error: expect.objectContaining({
            message: expect.stringContaining('[JWT_TOKEN_REDACTED]'),
          }),
        })
      )
    })

    it('should handle missing parameters gracefully', () => {
      logApiCall('GET', '/api/test')

      expect(mockConsole.log).toHaveBeenCalledWith('[API Success] GET /api/test  ', '') // Extra spaces when status/duration missing
    })

    it('should include proper timestamp format', () => {
      const error = new Error('Test error')
      logApiCall('POST', '/api/test', 500, 100, error)

      const errorCall = mockConsole.error.mock.calls[0][1]
      expect(errorCall.timestamp).toMatch(/\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z/)
      expect(errorCall.environment).toBe('development')
    })
  })
})
