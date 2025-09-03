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

  describe('Cursor Pagination Features', () => {
    describe('GET /api/transactions with cursor pagination', () => {
      it('should support cursor-based pagination', async () => {
        const cursor = Buffer.from('123').toString('base64')
        const request = createMockRequest({
          method: 'GET',
          url: `/api/transactions?cursor=${cursor}&limit=10`,
          cookies: { accessToken: 'valid-token' },
        }) as NextRequest

        const response = await getTransactionsHandler(request)
        const responseData = await response.json()

        expect(response.status).toBe(200)
        expect(responseData.success).toBe(true)
        expect(responseData.pagination).toHaveProperty('nextCursor')
        expect(responseData.pagination).toHaveProperty('prevCursor')
        expect(responseData.pagination).toHaveProperty('hasMore')
        expect(responseData.meta.paginationType).toBe('cursor')
        expect(responseData.meta.optimized).toBe(true)
      })

      it('should support forward and backward directions', async () => {
        const cursor = Buffer.from('123').toString('base64')

        // Forward direction
        const forwardRequest = createMockRequest({
          method: 'GET',
          url: `/api/transactions?cursor=${cursor}&direction=forward&limit=10`,
          cookies: { accessToken: 'valid-token' },
        }) as NextRequest

        const forwardResponse = await getTransactionsHandler(forwardRequest)
        const forwardData = await forwardResponse.json()

        expect(forwardResponse.status).toBe(200)
        expect(forwardData.meta.paginationType).toBe('cursor')

        // Backward direction
        const backwardRequest = createMockRequest({
          method: 'GET',
          url: `/api/transactions?cursor=${cursor}&direction=backward&limit=10`,
          cookies: { accessToken: 'valid-token' },
        }) as NextRequest

        const backwardResponse = await getTransactionsHandler(backwardRequest)
        const backwardData = await backwardResponse.json()

        expect(backwardResponse.status).toBe(200)
        expect(backwardData.meta.paginationType).toBe('cursor')
      })

      it('should include performance metrics in cursor pagination', async () => {
        const request = createMockRequest({
          method: 'GET',
          url: '/api/transactions?cursor=' + Buffer.from('123').toString('base64'),
          cookies: { accessToken: 'valid-token' },
        }) as NextRequest

        const response = await getTransactionsHandler(request)
        const responseData = await response.json()

        expect(response.status).toBe(200)
        expect(responseData.pagination.performance).toHaveProperty('queryTime')
        expect(responseData.meta.queryTime).toMatch(/\d+ms/)
        expect(responseData.meta.optimized).toBe(true)
      })

      it('should handle invalid cursor gracefully', async () => {
        const invalidCursor = 'invalid-cursor-data'
        const request = createMockRequest({
          method: 'GET',
          url: `/api/transactions?cursor=${invalidCursor}`,
          cookies: { accessToken: 'valid-token' },
        }) as NextRequest

        const response = await getTransactionsHandler(request)

        // Should still work but might fall back to first page or handle error
        expect(response.status).toBeLessThanOrEqual(400)
      })
    })

    describe('Legacy Pagination Compatibility', () => {
      it('should support legacy offset pagination with warning', async () => {
        const request = createMockRequest({
          method: 'GET',
          url: '/api/transactions?page=2&limit=10',
          cookies: { accessToken: 'valid-token' },
        }) as NextRequest

        const response = await getTransactionsHandler(request)
        const responseData = await response.json()

        expect(response.status).toBe(200)
        expect(responseData.success).toBe(true)
        expect(responseData.meta.paginationType).toBe('offset')
        expect(responseData.meta.optimized).toBe(false)
        expect(responseData.meta.warning).toContain('레거시 페이지네이션')
        expect(responseData.meta.recommendation).toHaveProperty('message')
        expect(responseData.meta.recommendation.benefits).toBeInstanceOf(Array)
      })

      it('should provide migration guidance in legacy mode', async () => {
        const request = createMockRequest({
          method: 'GET',
          url: '/api/transactions?page=1&limit=20',
          cookies: { accessToken: 'valid-token' },
        }) as NextRequest

        const response = await getTransactionsHandler(request)
        const responseData = await response.json()

        expect(responseData.meta.recommendation).toMatchObject({
          message: expect.stringContaining('cursor 기반 페이지네이션'),
          example: expect.stringContaining('?cursor='),
          benefits: expect.arrayContaining([
            expect.stringContaining('일정한 성능'),
            expect.stringContaining('실시간 데이터'),
            expect.stringContaining('깊은 페이지'),
          ]),
        })
      })

      it('should convert legacy pagination to consistent format', async () => {
        const request = createMockRequest({
          method: 'GET',
          url: '/api/transactions?page=3&limit=15',
          cookies: { accessToken: 'valid-token' },
        }) as NextRequest

        const response = await getTransactionsHandler(request)
        const responseData = await response.json()

        expect(responseData.pagination).toHaveProperty('page', 3)
        expect(responseData.pagination).toHaveProperty('limit', 15)
        expect(responseData.pagination).toHaveProperty('hasNext')
        expect(responseData.pagination).toHaveProperty('hasPrev')

        if (responseData.pagination.total) {
          expect(responseData.pagination).toHaveProperty('totalPages')
          expect(typeof responseData.pagination.totalPages).toBe('number')
        }
      })
    })

    describe('Performance Improvements', () => {
      it('should demonstrate cursor pagination performance benefits', async () => {
        const startTime = Date.now()

        // Simulate deep pagination with cursor (should be consistent)
        const deepCursor = Buffer.from('1000').toString('base64')
        const cursorRequest = createMockRequest({
          method: 'GET',
          url: `/api/transactions?cursor=${deepCursor}&limit=20`,
          cookies: { accessToken: 'valid-token' },
        }) as NextRequest

        const cursorResponse = await getTransactionsHandler(cursorRequest)
        const cursorData = await cursorResponse.json()

        const cursorTime = Date.now() - startTime

        expect(cursorResponse.status).toBe(200)
        expect(cursorData.meta.optimized).toBe(true)
        expect(cursorData.pagination.performance.queryTime).toBeGreaterThan(0)
      })

      it('should handle concurrent cursor requests efficiently', async () => {
        const cursors = [
          Buffer.from('100').toString('base64'),
          Buffer.from('200').toString('base64'),
          Buffer.from('300').toString('base64'),
        ]

        const requests = cursors.map(cursor =>
          getTransactionsHandler(
            createMockRequest({
              method: 'GET',
              url: `/api/transactions?cursor=${cursor}&limit=10`,
              cookies: { accessToken: 'valid-token' },
            }) as NextRequest
          )
        )

        const responses = await Promise.all(requests)
        const responseData = await Promise.all(responses.map(r => r.json()))

        // All requests should succeed
        responses.forEach(response => {
          expect(response.status).toBe(200)
        })

        // All should use cursor pagination
        responseData.forEach(data => {
          expect(data.meta.paginationType).toBe('cursor')
          expect(data.meta.optimized).toBe(true)
        })
      })
    })

    describe('Filtering with Pagination', () => {
      it('should combine filters with cursor pagination', async () => {
        const cursor = Buffer.from('123').toString('base64')
        const request = createMockRequest({
          method: 'GET',
          url: `/api/transactions?cursor=${cursor}&type=EXPENSE&categoryId=5&startDate=2024-01-01&endDate=2024-01-31`,
          cookies: { accessToken: 'valid-token' },
        }) as NextRequest

        const response = await getTransactionsHandler(request)
        const responseData = await response.json()

        expect(response.status).toBe(200)
        expect(responseData.meta.paginationType).toBe('cursor')
        expect(responseData.pagination).toHaveProperty('nextCursor')
        expect(responseData.pagination).toHaveProperty('prevCursor')
      })

      it('should handle search with cursor pagination', async () => {
        const cursor = Buffer.from('456').toString('base64')
        const searchQuery = encodeURIComponent('coffee')
        const request = createMockRequest({
          method: 'GET',
          url: `/api/transactions?cursor=${cursor}&search=${searchQuery}&limit=5`,
          cookies: { accessToken: 'valid-token' },
        }) as NextRequest

        const response = await getTransactionsHandler(request)
        const responseData = await response.json()

        expect(response.status).toBe(200)
        expect(responseData.meta.paginationType).toBe('cursor')
        expect(responseData.pagination.performance).toHaveProperty('queryTime')
      })
    })

    describe('Edge Cases', () => {
      it('should handle empty result set with cursor', async () => {
        const cursor = Buffer.from('999999').toString('base64') // Non-existent cursor
        const request = createMockRequest({
          method: 'GET',
          url: `/api/transactions?cursor=${cursor}`,
          cookies: { accessToken: 'valid-token' },
        }) as NextRequest

        const response = await getTransactionsHandler(request)
        const responseData = await response.json()

        expect(response.status).toBe(200)
        expect(responseData.transactions).toBeInstanceOf(Array)
        expect(responseData.pagination.hasMore).toBe(false)
        expect(responseData.pagination.nextCursor).toBe(null)
      })

      it('should handle malformed cursor parameter', async () => {
        const malformedCursor = 'not-base64-encoded!'
        const request = createMockRequest({
          method: 'GET',
          url: `/api/transactions?cursor=${malformedCursor}`,
          cookies: { accessToken: 'valid-token' },
        }) as NextRequest

        const response = await getTransactionsHandler(request)

        // Should handle gracefully (either work or return meaningful error)
        expect([200, 400].includes(response.status)).toBe(true)
      })

      it('should handle extremely large limit values', async () => {
        const request = createMockRequest({
          method: 'GET',
          url: '/api/transactions?limit=10000', // Very large limit
          cookies: { accessToken: 'valid-token' },
        }) as NextRequest

        const response = await getTransactionsHandler(request)
        const responseData = await response.json()

        expect(response.status).toBe(200)
        // Limit should be capped or handled appropriately
      })
    })
  })
})
