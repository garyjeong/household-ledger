/**
 * @jest-environment node
 */

import { NextRequest } from 'next/server'
import { POST as forgotPasswordHandler } from '@/app/api/auth/forgot-password/route'
import { createMockRequest } from '../utils/test-helpers'

// Mock the auth module
jest.mock('@/lib/auth', () => ({
  ...jest.requireActual('@/lib/auth'),
  findUserByEmail: jest.fn(),
  hashPassword: jest.fn(),
}))

import { findUserByEmail, hashPassword } from '@/lib/auth'

const mockFindUserByEmail = findUserByEmail as jest.MockedFunction<typeof findUserByEmail>
const mockHashPassword = hashPassword as jest.MockedFunction<typeof hashPassword>

// Mock Prisma
const mockPrismaUpdate = jest.fn()
jest.mock('@/lib/prisma', () => ({
  prisma: {
    user: {
      update: mockPrismaUpdate,
    },
  },
}))

describe('Forgot Password API', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  describe('POST /api/auth/forgot-password', () => {
    const validEmail = 'smat91@naver.com'
    const mockUser = {
      id: '1',
      email: validEmail,
      nickname: 'Gary',
      createdAt: new Date(),
    }

    it('should generate temporary password for existing user', async () => {
      mockFindUserByEmail.mockResolvedValue(mockUser)
      mockHashPassword.mockResolvedValue('hashed-temp-password')
      mockPrismaUpdate.mockResolvedValue({
        id: BigInt(1),
        email: validEmail,
        nickname: 'Gary',
        passwordHash: 'hashed-temp-password',
        createdAt: new Date(),
      })

      const request = createMockRequest({
        method: 'POST',
        body: { email: validEmail },
      }) as NextRequest

      const response = await forgotPasswordHandler(request)
      const responseData = await response.json()

      expect(response.status).toBe(200)
      expect(responseData.success).toBe(true)
      expect(responseData.message).toContain('임시 비밀번호가 생성')
      expect(responseData.tempPassword).toBeDefined()
      expect(typeof responseData.tempPassword).toBe('string')
      expect(responseData.tempPassword.length).toBe(8)

      // 임시 비밀번호가 복잡성 요구사항을 만족하는지 확인
      const tempPassword = responseData.tempPassword
      expect(tempPassword).toMatch(/[a-z]/) // 소문자
      expect(tempPassword).toMatch(/[A-Z]/) // 대문자
      expect(tempPassword).toMatch(/[0-9]/) // 숫자
      expect(tempPassword).toMatch(/[!@#$%^&*]/) // 특수문자

      expect(mockFindUserByEmail).toHaveBeenCalledWith(validEmail)
      expect(mockHashPassword).toHaveBeenCalledWith(expect.any(String))
      expect(mockPrismaUpdate).toHaveBeenCalledWith({
        where: { email: validEmail },
        data: { passwordHash: 'hashed-temp-password' },
      })
    })

    it('should reject non-existing user', async () => {
      mockFindUserByEmail.mockResolvedValue(null)

      const request = createMockRequest({
        method: 'POST',
        body: { email: 'nonexistent@example.com' },
      }) as NextRequest

      const response = await forgotPasswordHandler(request)
      const responseData = await response.json()

      expect(response.status).toBe(404)
      expect(responseData.success).toBe(false)
      expect(responseData.message).toContain('등록되지 않은 이메일')
      expect(mockHashPassword).not.toHaveBeenCalled()
      expect(mockPrismaUpdate).not.toHaveBeenCalled()
    })

    it('should validate email format', async () => {
      const request = createMockRequest({
        method: 'POST',
        body: { email: 'invalid-email' },
      }) as NextRequest

      const response = await forgotPasswordHandler(request)
      const responseData = await response.json()

      expect(response.status).toBe(400)
      expect(responseData.success).toBe(false)
      expect(responseData.message).toContain('올바른 이메일')
      expect(mockFindUserByEmail).not.toHaveBeenCalled()
    })

    it('should handle missing email', async () => {
      const request = createMockRequest({
        method: 'POST',
        body: {},
      }) as NextRequest

      const response = await forgotPasswordHandler(request)
      const responseData = await response.json()

      expect(response.status).toBe(400)
      expect(responseData.success).toBe(false)
      expect(responseData.message).toContain('올바른 이메일')
    })

    it('should handle database errors', async () => {
      mockFindUserByEmail.mockResolvedValue(mockUser)
      mockHashPassword.mockResolvedValue('hashed-temp-password')
      mockPrismaUpdate.mockRejectedValue(new Error('Database error'))

      const request = createMockRequest({
        method: 'POST',
        body: { email: validEmail },
      }) as NextRequest

      const response = await forgotPasswordHandler(request)
      const responseData = await response.json()

      expect(response.status).toBe(500)
      expect(responseData.success).toBe(false)
      expect(responseData.message).toContain('서버 오류')
    })
  })
})
