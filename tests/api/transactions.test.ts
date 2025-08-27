/**
 * @jest-environment node
 */

import { NextRequest } from 'next/server'
import {
  GET as getTransactionsHandler,
  POST as createTransactionHandler,
} from '@/app/api/transactions/route'
import {
  PUT as updateTransactionHandler,
  DELETE as deleteTransactionHandler,
} from '@/app/api/transactions/[id]/route'
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

describe('Transactions API Routes', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    mockVerifyAccessToken.mockReturnValue(mockTokenPayload)
    mockFindUserById.mockResolvedValue(mockUser)
  })

  describe('GET /api/transactions', () => {
    it('should get transactions successfully with valid auth', async () => {
      const request = createMockRequest({
        method: 'GET',
        url: '/api/transactions?groupId=1',
        cookies: { accessToken: 'valid-token' },
      }) as NextRequest

      const response = await getTransactionsHandler(request)
      const responseData = await response.json()

      expect(response.status).toBe(200)
      expect(responseData.success).toBe(true)
      expect(Array.isArray(responseData.transactions)).toBe(true)
    })

    it('should reject request without auth token', async () => {
      const request = createMockRequest({
        method: 'GET',
        url: '/api/transactions?groupId=1',
        cookies: {},
      }) as NextRequest

      const response = await getTransactionsHandler(request)
      const responseData = await response.json()

      expect(response.status).toBe(401)
      expect(responseData.error).toContain('인증')
    })

    it('should require groupId parameter', async () => {
      const request = createMockRequest({
        method: 'GET',
        url: '/api/transactions',
        cookies: { accessToken: 'valid-token' },
      }) as NextRequest

      const response = await getTransactionsHandler(request)
      const responseData = await response.json()

      expect(response.status).toBe(400)
      expect(responseData.error).toContain('그룹 ID')
    })
  })

  describe('POST /api/transactions', () => {
    const validTransactionData = {
      groupId: '1',
      accountId: '1',
      categoryId: '1',
      amount: 10000,
      description: '테스트 거래',
      transactionDate: '2024-01-01',
      type: 'EXPENSE' as const,
    }

    it('should create transaction successfully', async () => {
      const request = createMockRequest({
        method: 'POST',
        body: validTransactionData,
        cookies: { accessToken: 'valid-token' },
      }) as NextRequest

      const response = await createTransactionHandler(request)
      const responseData = await response.json()

      expect(response.status).toBe(201)
      expect(responseData.success).toBe(true)
      expect(responseData.transaction).toBeDefined()
    })

    it('should validate required fields', async () => {
      const incompleteData = {
        groupId: '1',
        amount: 10000,
        // missing required fields
      }

      const request = createMockRequest({
        method: 'POST',
        body: incompleteData,
        cookies: { accessToken: 'valid-token' },
      }) as NextRequest

      const response = await createTransactionHandler(request)
      const responseData = await response.json()

      expect(response.status).toBe(400)
      expect(responseData.error).toBeDefined()
    })

    it('should validate amount is positive number', async () => {
      const invalidData = {
        ...validTransactionData,
        amount: -1000,
      }

      const request = createMockRequest({
        method: 'POST',
        body: invalidData,
        cookies: { accessToken: 'valid-token' },
      }) as NextRequest

      const response = await createTransactionHandler(request)
      const responseData = await response.json()

      expect(response.status).toBe(400)
      expect(responseData.error).toContain('금액')
    })

    it('should validate transaction type', async () => {
      const invalidData = {
        ...validTransactionData,
        type: 'INVALID_TYPE',
      }

      const request = createMockRequest({
        method: 'POST',
        body: invalidData,
        cookies: { accessToken: 'valid-token' },
      }) as NextRequest

      const response = await createTransactionHandler(request)
      const responseData = await response.json()

      expect(response.status).toBe(400)
      expect(responseData.error).toBeDefined()
    })
  })

  describe('PUT /api/transactions/[id]', () => {
    const updateData = {
      amount: 15000,
      description: '수정된 거래',
      categoryId: '2',
    }

    it('should update transaction successfully', async () => {
      const request = createMockRequest({
        method: 'PUT',
        body: updateData,
        cookies: { accessToken: 'valid-token' },
      }) as NextRequest

      const response = await updateTransactionHandler(request, { params: { id: '1' } })
      const responseData = await response.json()

      expect(response.status).toBe(200)
      expect(responseData.success).toBe(true)
      expect(responseData.transaction).toBeDefined()
    })

    it('should reject update without auth', async () => {
      const request = createMockRequest({
        method: 'PUT',
        body: updateData,
        cookies: {},
      }) as NextRequest

      const response = await updateTransactionHandler(request, { params: { id: '1' } })
      const responseData = await response.json()

      expect(response.status).toBe(401)
      expect(responseData.error).toContain('인증')
    })

    it('should validate transaction ID format', async () => {
      const request = createMockRequest({
        method: 'PUT',
        body: updateData,
        cookies: { accessToken: 'valid-token' },
      }) as NextRequest

      const response = await updateTransactionHandler(request, { params: { id: 'invalid-id' } })
      const responseData = await response.json()

      expect(response.status).toBe(400)
      expect(responseData.error).toContain('ID')
    })
  })

  describe('DELETE /api/transactions/[id]', () => {
    it('should delete transaction successfully', async () => {
      const request = createMockRequest({
        method: 'DELETE',
        cookies: { accessToken: 'valid-token' },
      }) as NextRequest

      const response = await deleteTransactionHandler(request, { params: { id: '1' } })
      const responseData = await response.json()

      expect(response.status).toBe(200)
      expect(responseData.success).toBe(true)
    })

    it('should reject delete without auth', async () => {
      const request = createMockRequest({
        method: 'DELETE',
        cookies: {},
      }) as NextRequest

      const response = await deleteTransactionHandler(request, { params: { id: '1' } })
      const responseData = await response.json()

      expect(response.status).toBe(401)
      expect(responseData.error).toContain('인증')
    })

    it('should handle non-existing transaction', async () => {
      const request = createMockRequest({
        method: 'DELETE',
        cookies: { accessToken: 'valid-token' },
      }) as NextRequest

      const response = await deleteTransactionHandler(request, { params: { id: '999' } })
      const responseData = await response.json()

      expect(response.status).toBe(404)
      expect(responseData.error).toContain('거래를 찾을 수 없습니다')
    })
  })
})
