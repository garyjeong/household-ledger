/**
 * @jest-environment node
 */

import { NextRequest } from 'next/server'
import { GET as getAccountsHandler, POST as createAccountHandler } from '@/app/api/accounts/route'
import {
  PUT as updateAccountHandler,
  DELETE as deleteAccountHandler,
} from '@/app/api/accounts/[id]/route'
import { createMockRequest, expectApiSuccess, expectApiError } from '../utils/test-helpers'

// Mock the auth module
jest.mock('@/lib/auth', () => ({
  verifyAccessToken: jest.fn(),
  findUserById: jest.fn(),
}))

import { verifyAccessToken, findUserById } from '@/lib/auth'

const mockVerifyAccessToken = verifyAccessToken as jest.MockedFunction<typeof verifyAccessToken>
const mockFindUserById = findUserById as jest.MockedFunction<typeof findUserById>

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

describe('Accounts API Routes', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    mockVerifyAccessToken.mockReturnValue(mockTokenPayload)
    mockFindUserById.mockResolvedValue(mockUser)
  })

  describe('GET /api/accounts', () => {
    it('should get accounts successfully with valid auth', async () => {
      const request = createMockRequest({
        method: 'GET',
        url: '/api/accounts?groupId=1',
        cookies: { accessToken: 'valid-token' },
      }) as NextRequest

      const response = await getAccountsHandler(request)
      const responseData = await response.json()

      expect(response.status).toBe(200)
      expect(responseData.success).toBe(true)
      expect(Array.isArray(responseData.accounts)).toBe(true)
    })

    it('should reject request without auth token', async () => {
      const request = createMockRequest({
        method: 'GET',
        url: '/api/accounts?groupId=1',
        cookies: {},
      }) as NextRequest

      const response = await getAccountsHandler(request)
      const responseData = await response.json()

      expect(response.status).toBe(401)
      expect(responseData.error).toContain('인증')
    })

    it('should require groupId parameter', async () => {
      const request = createMockRequest({
        method: 'GET',
        url: '/api/accounts',
        cookies: { accessToken: 'valid-token' },
      }) as NextRequest

      const response = await getAccountsHandler(request)
      const responseData = await response.json()

      expect(response.status).toBe(400)
      expect(responseData.error).toContain('그룹 ID')
    })

    it('should filter by type when specified', async () => {
      const request = createMockRequest({
        method: 'GET',
        url: '/api/accounts?groupId=1&type=BANK',
        cookies: { accessToken: 'valid-token' },
      }) as NextRequest

      const response = await getAccountsHandler(request)
      const responseData = await response.json()

      expect(response.status).toBe(200)
      expect(responseData.success).toBe(true)
    })
  })

  describe('POST /api/accounts', () => {
    const validAccountData = {
      groupId: '1',
      name: '새로운 계좌',
      type: 'BANK' as const,
      bankName: '신한은행',
      accountNumber: '110-123-456789',
      initialBalance: 1000000,
      color: '#0066CC',
    }

    it('should create account successfully', async () => {
      const request = createMockRequest({
        method: 'POST',
        body: validAccountData,
        cookies: { accessToken: 'valid-token' },
      }) as NextRequest

      const response = await createAccountHandler(request)
      const responseData = await response.json()

      expect(response.status).toBe(201)
      expect(responseData.success).toBe(true)
      expect(responseData.account).toBeDefined()
      expect(responseData.account.name).toBe(validAccountData.name)
    })

    it('should validate required fields', async () => {
      const incompleteData = {
        groupId: '1',
        name: '계좌',
        // missing type
      }

      const request = createMockRequest({
        method: 'POST',
        body: incompleteData,
        cookies: { accessToken: 'valid-token' },
      }) as NextRequest

      const response = await createAccountHandler(request)
      const responseData = await response.json()

      expect(response.status).toBe(400)
      expect(responseData.error).toBeDefined()
    })

    it('should validate account name length', async () => {
      const invalidData = {
        ...validAccountData,
        name: '', // empty name
      }

      const request = createMockRequest({
        method: 'POST',
        body: invalidData,
        cookies: { accessToken: 'valid-token' },
      }) as NextRequest

      const response = await createAccountHandler(request)
      const responseData = await response.json()

      expect(response.status).toBe(400)
      expect(responseData.error).toContain('이름')
    })

    it('should validate account type', async () => {
      const invalidData = {
        ...validAccountData,
        type: 'INVALID_TYPE',
      }

      const request = createMockRequest({
        method: 'POST',
        body: invalidData,
        cookies: { accessToken: 'valid-token' },
      }) as NextRequest

      const response = await createAccountHandler(request)
      const responseData = await response.json()

      expect(response.status).toBe(400)
      expect(responseData.error).toBeDefined()
    })

    it('should validate initial balance', async () => {
      const invalidData = {
        ...validAccountData,
        initialBalance: -1000, // negative balance
      }

      const request = createMockRequest({
        method: 'POST',
        body: invalidData,
        cookies: { accessToken: 'valid-token' },
      }) as NextRequest

      const response = await createAccountHandler(request)
      const responseData = await response.json()

      expect(response.status).toBe(400)
      expect(responseData.error).toContain('잔액')
    })

    it('should validate color format', async () => {
      const invalidData = {
        ...validAccountData,
        color: 'invalid-color',
      }

      const request = createMockRequest({
        method: 'POST',
        body: invalidData,
        cookies: { accessToken: 'valid-token' },
      }) as NextRequest

      const response = await createAccountHandler(request)
      const responseData = await response.json()

      expect(response.status).toBe(400)
      expect(responseData.error).toContain('색상')
    })

    it('should reject duplicate account names within group', async () => {
      const request = createMockRequest({
        method: 'POST',
        body: {
          ...validAccountData,
          name: '신한은행 주계좌', // 이미 존재하는 계좌 이름
        },
        cookies: { accessToken: 'valid-token' },
      }) as NextRequest

      const response = await createAccountHandler(request)
      const responseData = await response.json()

      expect(response.status).toBe(409)
      expect(responseData.error).toContain('이미 존재')
    })
  })

  describe('PUT /api/accounts/[id]', () => {
    const updateData = {
      name: '수정된 계좌',
      bankName: '카카오뱅크',
      color: '#FFCC00',
    }

    it('should update account successfully', async () => {
      const request = createMockRequest({
        method: 'PUT',
        body: updateData,
        cookies: { accessToken: 'valid-token' },
      }) as NextRequest

      const response = await updateAccountHandler(request, { params: { id: '1' } })
      const responseData = await response.json()

      expect(response.status).toBe(200)
      expect(responseData.success).toBe(true)
      expect(responseData.account).toBeDefined()
    })

    it('should reject update without auth', async () => {
      const request = createMockRequest({
        method: 'PUT',
        body: updateData,
        cookies: {},
      }) as NextRequest

      const response = await updateAccountHandler(request, { params: { id: '1' } })
      const responseData = await response.json()

      expect(response.status).toBe(401)
      expect(responseData.error).toContain('인증')
    })

    it('should validate account ID format', async () => {
      const request = createMockRequest({
        method: 'PUT',
        body: updateData,
        cookies: { accessToken: 'valid-token' },
      }) as NextRequest

      const response = await updateAccountHandler(request, { params: { id: 'invalid-id' } })
      const responseData = await response.json()

      expect(response.status).toBe(400)
      expect(responseData.error).toContain('ID')
    })

    it('should handle non-existing account', async () => {
      const request = createMockRequest({
        method: 'PUT',
        body: updateData,
        cookies: { accessToken: 'valid-token' },
      }) as NextRequest

      const response = await updateAccountHandler(request, { params: { id: '999' } })
      const responseData = await response.json()

      expect(response.status).toBe(404)
      expect(responseData.error).toContain('계좌를 찾을 수 없습니다')
    })

    it('should prevent changing account type after creation', async () => {
      const request = createMockRequest({
        method: 'PUT',
        body: {
          ...updateData,
          type: 'CREDIT_CARD', // 타입 변경 시도
        },
        cookies: { accessToken: 'valid-token' },
      }) as NextRequest

      const response = await updateAccountHandler(request, { params: { id: '1' } })
      const responseData = await response.json()

      expect(response.status).toBe(400)
      expect(responseData.error).toContain('타입')
    })
  })

  describe('DELETE /api/accounts/[id]', () => {
    it('should delete account successfully', async () => {
      const request = createMockRequest({
        method: 'DELETE',
        cookies: { accessToken: 'valid-token' },
      }) as NextRequest

      const response = await deleteAccountHandler(request, { params: { id: '1' } })
      const responseData = await response.json()

      expect(response.status).toBe(200)
      expect(responseData.success).toBe(true)
    })

    it('should reject delete without auth', async () => {
      const request = createMockRequest({
        method: 'DELETE',
        cookies: {},
      }) as NextRequest

      const response = await deleteAccountHandler(request, { params: { id: '1' } })
      const responseData = await response.json()

      expect(response.status).toBe(401)
      expect(responseData.error).toContain('인증')
    })

    it('should prevent deletion of accounts with transactions', async () => {
      const request = createMockRequest({
        method: 'DELETE',
        cookies: { accessToken: 'valid-token' },
      }) as NextRequest

      // 거래가 있는 계좌 삭제 시도
      const response = await deleteAccountHandler(request, { params: { id: '1' } })
      const responseData = await response.json()

      expect(response.status).toBe(400)
      expect(responseData.error).toContain('거래가 있는')
    })

    it('should handle non-existing account', async () => {
      const request = createMockRequest({
        method: 'DELETE',
        cookies: { accessToken: 'valid-token' },
      }) as NextRequest

      const response = await deleteAccountHandler(request, { params: { id: '999' } })
      const responseData = await response.json()

      expect(response.status).toBe(404)
      expect(responseData.error).toContain('계좌를 찾을 수 없습니다')
    })

    it('should prevent deletion of last account in group', async () => {
      const request = createMockRequest({
        method: 'DELETE',
        cookies: { accessToken: 'valid-token' },
      }) as NextRequest

      // 그룹의 마지막 계좌 삭제 시도
      const response = await deleteAccountHandler(request, { params: { id: '1' } })
      const responseData = await response.json()

      expect(response.status).toBe(400)
      expect(responseData.error).toContain('마지막 계좌')
    })
  })
})
