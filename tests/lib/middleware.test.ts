// Mock the auth module
const mockVerifyAccessToken = jest.fn()
jest.mock('@/lib/auth', () => ({
  verifyAccessToken: mockVerifyAccessToken,
}))

// Mock the security utils
const mockSafeConsole = {
  log: jest.fn(),
  warn: jest.fn(),
  error: jest.fn(),
  info: jest.fn(),
}
jest.mock('@/lib/security-utils', () => ({
  safeConsole: mockSafeConsole,
}))

import { NextRequest, NextResponse } from 'next/server'
import { middleware } from '@/src/middleware'

describe('Middleware', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  describe('Public Paths', () => {
    it('should allow access to login page without auth', async () => {
      const request = new NextRequest('http://localhost:3001/login')
      const response = await middleware(request)

      expect(response.status).toBe(200)
      expect(response.headers.get('X-Request-ID')).toBeDefined()
    })

    it('should allow access to signup page without auth', async () => {
      const request = new NextRequest('http://localhost:3001/signup')
      const response = await middleware(request)

      expect(response.status).toBe(200)
    })

    it('should allow access to forgot-password page without auth', async () => {
      const request = new NextRequest('http://localhost:3001/forgot-password')
      const response = await middleware(request)

      expect(response.status).toBe(200)
    })

    it('should redirect authenticated users from login to home', async () => {
      mockVerifyAccessToken.mockReturnValue({
        userId: '1',
        email: 'test@example.com',
        nickname: 'Test User',
      })

      const request = new NextRequest('http://localhost:3001/login')
      request.cookies.set('accessToken', 'valid-token')

      const response = await middleware(request)

      expect(response.status).toBe(307) // Temporary redirect
      expect(response.headers.get('Location')).toBe('http://localhost:3001/')
    })
  })

  describe('Public API Paths', () => {
    it('should allow access to auth APIs without token', async () => {
      const endpoints = [
        '/api/auth/login',
        '/api/auth/signup',
        '/api/auth/forgot-password',
        '/api/auth/check-email',
        '/api/auth/refresh',
        '/api/health',
      ]

      for (const endpoint of endpoints) {
        const request = new NextRequest(`http://localhost:3001${endpoint}`)
        const response = await middleware(request)

        expect(response.status).toBe(200)
        expect(response.headers.get('X-Request-ID')).toBeDefined()
      }
    })
  })

  describe('Protected Paths', () => {
    it('should redirect unauthenticated users to login', async () => {
      mockVerifyAccessToken.mockReturnValue(null)

      const protectedPaths = ['/', '/dashboard', '/ledger', '/transactions', '/statistics']

      for (const path of protectedPaths) {
        const request = new NextRequest(`http://localhost:3001${path}`)
        const response = await middleware(request)

        expect(response.status).toBe(307) // Temporary redirect
        expect(response.headers.get('Location')).toContain('/login')
        expect(response.headers.get('Location')).toContain(`returnUrl=${encodeURIComponent(path)}`)
      }
    })

    it('should allow authenticated users to access protected paths', async () => {
      mockVerifyAccessToken.mockReturnValue({
        userId: '1',
        email: 'test@example.com',
        nickname: 'Test User',
      })

      const request = new NextRequest('http://localhost:3001/')
      request.cookies.set('accessToken', 'valid-token')

      const response = await middleware(request)

      expect(response.status).toBe(200)
    })
  })

  describe('Protected API Paths', () => {
    it('should return 401 for unauthenticated API requests', async () => {
      mockVerifyAccessToken.mockReturnValue(null)

      const protectedAPIEndpoints = [
        '/api/transactions',
        '/api/categories',
        '/api/groups',
        '/api/balance',
        '/api/dashboard/monthly-stats',
        '/api/statistics',
      ]

      for (const endpoint of protectedAPIEndpoints) {
        const request = new NextRequest(`http://localhost:3001${endpoint}`)
        const response = await middleware(request)

        expect(response.status).toBe(401)

        const json = await response.json()
        expect(json.error).toContain('인증이 필요합니다')
        expect(json.code).toBe('AUTHENTICATION_REQUIRED')
      }
    })

    it('should allow authenticated API requests', async () => {
      mockVerifyAccessToken.mockReturnValue({
        userId: '1',
        email: 'test@example.com',
        nickname: 'Test User',
      })

      const request = new NextRequest('http://localhost:3001/api/transactions')
      request.cookies.set('accessToken', 'valid-token')

      const response = await middleware(request)

      expect(response.status).toBe(200)
      expect(response.headers.get('X-Request-ID')).toBeDefined()
    })

    it('should handle refresh token only scenario for API requests', async () => {
      mockVerifyAccessToken.mockReturnValue(null)

      const request = new NextRequest('http://localhost:3001/api/transactions')
      request.cookies.set('refreshToken', 'valid-refresh-token')

      const response = await middleware(request)

      expect(response.status).toBe(200)
      expect(response.headers.get('X-Token-Status')).toBe('refresh-required')
    })
  })

  describe('Bypass Paths', () => {
    it('should bypass middleware for static files', async () => {
      const staticPaths = [
        '/_next/static/css/app.css',
        '/_next/image/logo.png',
        '/favicon.ico',
        '/sw.js',
        '/manifest.json',
      ]

      for (const path of staticPaths) {
        const request = new NextRequest(`http://localhost:3001${path}`)
        const response = await middleware(request)

        expect(response.status).toBe(200)
        // Should not have middleware-specific headers
        expect(response.headers.get('X-Request-ID')).toBeUndefined()
      }
    })
  })

  describe('Security Headers', () => {
    it('should add security headers to API responses', async () => {
      mockVerifyAccessToken.mockReturnValue({
        userId: '1',
        email: 'test@example.com',
        nickname: 'Test User',
      })

      const request = new NextRequest('http://localhost:3001/api/transactions')
      request.cookies.set('accessToken', 'valid-token')

      const response = await middleware(request)

      expect(response.headers.get('X-Content-Type-Options')).toBe('nosniff')
      expect(response.headers.get('X-Frame-Options')).toBe('DENY')
      expect(response.headers.get('X-XSS-Protection')).toBe('1; mode=block')
      expect(response.headers.get('Referrer-Policy')).toBe('strict-origin-when-cross-origin')
    })

    it('should add CORS headers for allowed origins', async () => {
      const request = new NextRequest('http://localhost:3001/api/health')
      request.headers.set('Origin', 'http://localhost:3001')

      const response = await middleware(request)

      expect(response.headers.get('Access-Control-Allow-Origin')).toBe('http://localhost:3001')
      expect(response.headers.get('Access-Control-Allow-Credentials')).toBe('true')
    })
  })

  describe('Admin Paths', () => {
    it('should return 403 for admin paths', async () => {
      mockVerifyAccessToken.mockReturnValue({
        userId: '1',
        email: 'test@example.com',
        nickname: 'Test User',
      })

      const request = new NextRequest('http://localhost:3001/admin')
      request.cookies.set('accessToken', 'valid-token')

      const response = await middleware(request)

      expect(response.status).toBe(403)

      const json = await response.json()
      expect(json.error).toContain('관리자 권한이 필요합니다')
      expect(json.code).toBe('ACCESS_FORBIDDEN')
    })
  })

  describe('Error Handling', () => {
    it('should handle errors gracefully', async () => {
      mockVerifyAccessToken.mockImplementation(() => {
        throw new Error('JWT verification failed')
      })

      const request = new NextRequest('http://localhost:3001/')
      request.cookies.set('accessToken', 'malformed-token')

      const response = await middleware(request)

      expect(response.status).toBe(500)

      const json = await response.json()
      expect(json.error).toBe('서버 오류가 발생했습니다')
      expect(json.code).toBe('MIDDLEWARE_ERROR')
    })
  })
})
