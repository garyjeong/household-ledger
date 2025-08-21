/**
 * @jest-environment node
 */

import { NextRequest } from 'next/server'
import { POST as signupHandler } from '@/app/api/auth/signup/route'
import { POST as loginHandler } from '@/app/api/auth/login/route'
import { POST as logoutHandler } from '@/app/api/auth/logout/route'
import { GET as meHandler } from '@/app/api/auth/me/route'
import { POST as refreshHandler } from '@/app/api/auth/refresh/route'
import {
  createMockRequest,
  expectApiSuccess,
  expectApiError,
  createMockToken,
} from '../utils/test-helpers'

// Mock the auth module
jest.mock('@/lib/auth', () => ({
  ...jest.requireActual('@/lib/auth'),
  findUserByEmail: jest.fn(),
  createUser: jest.fn(),
  verifyUserPassword: jest.fn(),
  findUserById: jest.fn(),
  generateAccessToken: jest.fn(),
  generateRefreshToken: jest.fn(),
  verifyAccessToken: jest.fn(),
  verifyRefreshToken: jest.fn(),
}))

import {
  findUserByEmail,
  createUser,
  verifyUserPassword,
  findUserById,
  generateAccessToken,
  generateRefreshToken,
  verifyAccessToken,
  verifyRefreshToken,
} from '@/lib/auth'

const mockFindUserByEmail = findUserByEmail as jest.MockedFunction<typeof findUserByEmail>
const mockCreateUser = createUser as jest.MockedFunction<typeof createUser>
const mockVerifyUserPassword = verifyUserPassword as jest.MockedFunction<typeof verifyUserPassword>
const mockFindUserById = findUserById as jest.MockedFunction<typeof findUserById>
const mockGenerateAccessToken = generateAccessToken as jest.MockedFunction<
  typeof generateAccessToken
>
const mockGenerateRefreshToken = generateRefreshToken as jest.MockedFunction<
  typeof generateRefreshToken
>
const mockVerifyAccessToken = verifyAccessToken as jest.MockedFunction<typeof verifyAccessToken>
const mockVerifyRefreshToken = verifyRefreshToken as jest.MockedFunction<typeof verifyRefreshToken>

describe('Auth API Routes', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  describe('POST /api/auth/signup', () => {
    const validSignupData = {
      email: 'newuser@example.com',
      password: 'Password123!',
      nickname: '새로운유저',
    }

    it('should create new user successfully', async () => {
      // Mock implementations
      mockFindUserByEmail.mockResolvedValue(null) // User doesn't exist
      mockCreateUser.mockResolvedValue({
        id: '1',
        email: validSignupData.email,
        nickname: validSignupData.nickname,
        createdAt: new Date(),
      })
      mockGenerateAccessToken.mockReturnValue('mock-access-token')
      mockGenerateRefreshToken.mockReturnValue('mock-refresh-token')

      const request = createMockRequest({
        method: 'POST',
        body: validSignupData,
      }) as NextRequest

      const response = await signupHandler(request)
      const responseData = await response.json()

      expect(response.status).toBe(201)
      expect(responseData.success).toBe(true)
      expect(responseData.user.email).toBe(validSignupData.email)
      expect(responseData.user.nickname).toBe(validSignupData.nickname)
      expect(mockCreateUser).toHaveBeenCalledWith(validSignupData)
    })

    it('should reject if email already exists', async () => {
      mockFindUserByEmail.mockResolvedValue({
        id: '1',
        email: validSignupData.email,
        nickname: 'Existing User',
        createdAt: new Date(),
      })

      const request = createMockRequest({
        method: 'POST',
        body: validSignupData,
      }) as NextRequest

      const response = await signupHandler(request)
      const responseData = await response.json()

      expect(response.status).toBe(409)
      expect(responseData.error).toContain('이미 사용 중인 이메일')
      expect(mockCreateUser).not.toHaveBeenCalled()
    })

    it('should validate email format', async () => {
      const invalidData = {
        ...validSignupData,
        email: 'invalid-email',
      }

      const request = createMockRequest({
        method: 'POST',
        body: invalidData,
      }) as NextRequest

      const response = await signupHandler(request)
      const responseData = await response.json()

      expect(response.status).toBe(400)
      expect(responseData.error).toContain('올바른 이메일 형식')
    })

    it('should validate password complexity', async () => {
      const weakPasswordData = {
        ...validSignupData,
        password: 'weak',
      }

      const request = createMockRequest({
        method: 'POST',
        body: weakPasswordData,
      }) as NextRequest

      const response = await signupHandler(request)
      const responseData = await response.json()

      expect(response.status).toBe(400)
      expect(responseData.error).toContain('비밀번호')
    })

    it('should validate nickname length', async () => {
      const shortNicknameData = {
        ...validSignupData,
        nickname: 'a',
      }

      const request = createMockRequest({
        method: 'POST',
        body: shortNicknameData,
      }) as NextRequest

      const response = await signupHandler(request)
      const responseData = await response.json()

      expect(response.status).toBe(400)
      expect(responseData.error).toContain('닉네임')
    })

    it('should handle missing required fields', async () => {
      const incompleteData = {
        email: validSignupData.email,
        // missing password and nickname
      }

      const request = createMockRequest({
        method: 'POST',
        body: incompleteData,
      }) as NextRequest

      const response = await signupHandler(request)
      const responseData = await response.json()

      expect(response.status).toBe(400)
      expect(responseData.error).toBeDefined()
    })
  })

  describe('POST /api/auth/login', () => {
    const validLoginData = {
      email: 'test@example.com',
      password: 'password123',
      rememberMe: false,
    }

    const mockUser = {
      id: '1',
      email: validLoginData.email,
      nickname: '테스트유저',
      createdAt: new Date(),
    }

    it('should login successfully with valid credentials', async () => {
      mockFindUserByEmail.mockResolvedValue(mockUser)
      mockVerifyUserPassword.mockResolvedValue(true)
      mockGenerateAccessToken.mockReturnValue('mock-access-token')
      mockGenerateRefreshToken.mockReturnValue('mock-refresh-token')

      const request = createMockRequest({
        method: 'POST',
        body: validLoginData,
      }) as NextRequest

      const response = await loginHandler(request)
      const responseData = await response.json()

      expect(response.status).toBe(200)
      expect(responseData.success).toBe(true)
      expect(responseData.user.email).toBe(validLoginData.email)
      expect(mockVerifyUserPassword).toHaveBeenCalledWith(
        validLoginData.email,
        validLoginData.password
      )
    })

    it('should reject non-existing user', async () => {
      mockFindUserByEmail.mockResolvedValue(null)

      const request = createMockRequest({
        method: 'POST',
        body: validLoginData,
      }) as NextRequest

      const response = await loginHandler(request)
      const responseData = await response.json()

      expect(response.status).toBe(401)
      expect(responseData.error).toContain('이메일 또는 비밀번호')
      expect(mockVerifyUserPassword).not.toHaveBeenCalled()
    })

    it('should reject invalid password', async () => {
      mockFindUserByEmail.mockResolvedValue(mockUser)
      mockVerifyUserPassword.mockResolvedValue(false)

      const request = createMockRequest({
        method: 'POST',
        body: validLoginData,
      }) as NextRequest

      const response = await loginHandler(request)
      const responseData = await response.json()

      expect(response.status).toBe(401)
      expect(responseData.error).toContain('이메일 또는 비밀번호')
    })

    it('should validate email format', async () => {
      const invalidEmailData = {
        ...validLoginData,
        email: 'invalid-email',
      }

      const request = createMockRequest({
        method: 'POST',
        body: invalidEmailData,
      }) as NextRequest

      const response = await loginHandler(request)
      const responseData = await response.json()

      expect(response.status).toBe(400)
      expect(responseData.error).toContain('올바른 이메일 형식')
    })

    it('should handle remember me option', async () => {
      const rememberMeData = {
        ...validLoginData,
        rememberMe: true,
      }

      mockFindUserByEmail.mockResolvedValue(mockUser)
      mockVerifyUserPassword.mockResolvedValue(true)
      mockGenerateAccessToken.mockReturnValue('mock-access-token')
      mockGenerateRefreshToken.mockReturnValue('mock-refresh-token')

      const request = createMockRequest({
        method: 'POST',
        body: rememberMeData,
      }) as NextRequest

      const response = await loginHandler(request)
      const responseData = await response.json()

      expect(response.status).toBe(200)
      expect(responseData.success).toBe(true)
      // Remember me should affect cookie expiration (implementation detail)
    })
  })

  describe('POST /api/auth/logout', () => {
    it('should logout successfully', async () => {
      const request = createMockRequest({
        method: 'POST',
      }) as NextRequest

      const response = await logoutHandler()
      const responseData = await response.json()

      expect(response.status).toBe(200)
      expect(responseData.success).toBe(true)
      expect(responseData.message).toContain('로그아웃')
    })
  })

  describe('GET /api/auth/me', () => {
    const mockUser = {
      id: '1',
      email: 'test@example.com',
      nickname: '테스트유저',
      createdAt: new Date(),
    }

    const mockTokenPayload = {
      userId: mockUser.id,
      email: mockUser.email,
      nickname: mockUser.nickname,
    }

    it('should return user info with valid token', async () => {
      const accessToken = 'valid-access-token'

      mockVerifyAccessToken.mockReturnValue(mockTokenPayload)
      mockFindUserById.mockResolvedValue(mockUser)

      const request = createMockRequest({
        method: 'GET',
        cookies: { accessToken },
      }) as NextRequest

      const response = await meHandler(request)
      const responseData = await response.json()

      expect(response.status).toBe(200)
      expect(responseData.success).toBe(true)
      expect(responseData.user.id).toBe(mockUser.id)
      expect(responseData.user.email).toBe(mockUser.email)
    })

    it('should reject request without token', async () => {
      const request = createMockRequest({
        method: 'GET',
        cookies: {},
      }) as NextRequest

      const response = await meHandler(request)
      const responseData = await response.json()

      expect(response.status).toBe(401)
      expect(responseData.error).toContain('인증 토큰')
    })

    it('should reject invalid token', async () => {
      const accessToken = 'invalid-access-token'

      mockVerifyAccessToken.mockReturnValue(null)

      const request = createMockRequest({
        method: 'GET',
        cookies: { accessToken },
      }) as NextRequest

      const response = await meHandler(request)
      const responseData = await response.json()

      expect(response.status).toBe(401)
      expect(responseData.error).toContain('유효하지 않은 토큰')
    })

    it('should handle user not found', async () => {
      const accessToken = 'valid-access-token'

      mockVerifyAccessToken.mockReturnValue(mockTokenPayload)
      mockFindUserById.mockResolvedValue(null)

      const request = createMockRequest({
        method: 'GET',
        cookies: { accessToken },
      }) as NextRequest

      const response = await meHandler(request)
      const responseData = await response.json()

      expect(response.status).toBe(404)
      expect(responseData.error).toContain('사용자를 찾을 수 없습니다')
    })
  })

  describe('POST /api/auth/refresh', () => {
    const mockUser = {
      id: '1',
      email: 'test@example.com',
      nickname: '테스트유저',
      createdAt: new Date(),
    }

    const mockTokenPayload = {
      userId: mockUser.id,
      email: mockUser.email,
      nickname: mockUser.nickname,
    }

    it('should refresh token successfully', async () => {
      const refreshToken = 'valid-refresh-token'

      mockVerifyRefreshToken.mockReturnValue(mockTokenPayload)
      mockFindUserById.mockResolvedValue(mockUser)
      mockGenerateAccessToken.mockReturnValue('new-access-token')

      const request = createMockRequest({
        method: 'POST',
        cookies: { refreshToken },
      }) as NextRequest

      const response = await refreshHandler(request)
      const responseData = await response.json()

      expect(response.status).toBe(200)
      expect(responseData.success).toBe(true)
      expect(responseData.user.id).toBe(mockUser.id)
      expect(mockGenerateAccessToken).toHaveBeenCalledWith(mockTokenPayload)
    })

    it('should reject request without refresh token', async () => {
      const request = createMockRequest({
        method: 'POST',
        cookies: {},
      }) as NextRequest

      const response = await refreshHandler(request)
      const responseData = await response.json()

      expect(response.status).toBe(401)
      expect(responseData.error).toContain('리프레시 토큰')
    })

    it('should reject invalid refresh token', async () => {
      const refreshToken = 'invalid-refresh-token'

      mockVerifyRefreshToken.mockReturnValue(null)

      const request = createMockRequest({
        method: 'POST',
        cookies: { refreshToken },
      }) as NextRequest

      const response = await refreshHandler(request)
      const responseData = await response.json()

      expect(response.status).toBe(401)
      expect(responseData.error).toContain('유효하지 않은 리프레시 토큰')
    })

    it('should handle user not found during refresh', async () => {
      const refreshToken = 'valid-refresh-token'

      mockVerifyRefreshToken.mockReturnValue(mockTokenPayload)
      mockFindUserById.mockResolvedValue(null)

      const request = createMockRequest({
        method: 'POST',
        cookies: { refreshToken },
      }) as NextRequest

      const response = await refreshHandler(request)
      const responseData = await response.json()

      expect(response.status).toBe(404)
      expect(responseData.error).toContain('사용자를 찾을 수 없습니다')
    })
  })
})
