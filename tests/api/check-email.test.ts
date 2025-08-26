/**
 * @jest-environment node
 */

import { NextRequest } from 'next/server'
import { POST as checkEmailHandler } from '@/app/api/auth/check-email/route'
import { createMockRequest } from '../utils/test-helpers'

// Mock the auth module
jest.mock('@/lib/auth', () => ({
  ...jest.requireActual('@/lib/auth'),
  findUserByEmail: jest.fn(),
}))

import { findUserByEmail } from '@/lib/auth'

const mockFindUserByEmail = findUserByEmail as jest.MockedFunction<typeof findUserByEmail>

describe('Check Email API', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  describe('POST /api/auth/check-email', () => {
    const existingEmail = 'smat91@naver.com'
    const newEmail = 'newuser@example.com'

    const mockUser = {
      id: '1',
      email: existingEmail,
      nickname: 'Gary',
      createdAt: new Date(),
    }

    it('should return exists: true for existing email', async () => {
      mockFindUserByEmail.mockResolvedValue(mockUser)

      const request = createMockRequest({
        method: 'POST',
        body: { email: existingEmail },
      }) as NextRequest

      const response = await checkEmailHandler(request)
      const responseData = await response.json()

      expect(response.status).toBe(200)
      expect(responseData.exists).toBe(true)
      expect(mockFindUserByEmail).toHaveBeenCalledWith(existingEmail)
    })

    it('should return exists: false for new email', async () => {
      mockFindUserByEmail.mockResolvedValue(null)

      const request = createMockRequest({
        method: 'POST',
        body: { email: newEmail },
      }) as NextRequest

      const response = await checkEmailHandler(request)
      const responseData = await response.json()

      expect(response.status).toBe(200)
      expect(responseData.exists).toBe(false)
      expect(mockFindUserByEmail).toHaveBeenCalledWith(newEmail)
    })

    it('should validate email format', async () => {
      const request = createMockRequest({
        method: 'POST',
        body: { email: 'invalid-email' },
      }) as NextRequest

      const response = await checkEmailHandler(request)
      const responseData = await response.json()

      expect(response.status).toBe(400)
      expect(responseData.error).toContain('유효한 이메일')
      expect(mockFindUserByEmail).not.toHaveBeenCalled()
    })

    it('should handle missing email', async () => {
      const request = createMockRequest({
        method: 'POST',
        body: {},
      }) as NextRequest

      const response = await checkEmailHandler(request)
      const responseData = await response.json()

      expect(response.status).toBe(400)
      expect(responseData.error).toContain('유효한 이메일')
      expect(mockFindUserByEmail).not.toHaveBeenCalled()
    })

    it('should handle database errors', async () => {
      mockFindUserByEmail.mockRejectedValue(new Error('Database error'))

      const request = createMockRequest({
        method: 'POST',
        body: { email: existingEmail },
      }) as NextRequest

      const response = await checkEmailHandler(request)
      const responseData = await response.json()

      expect(response.status).toBe(500)
      expect(responseData.error).toContain('서버 오류')
    })
  })
})

