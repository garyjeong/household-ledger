/**
 * @jest-environment node
 */

import { NextRequest } from 'next/server'
import { POST as quickAddHandler } from '@/app/api/transactions/quick-add/route'
import { createMockRequest } from '../utils/test-helpers'

// Mock the auth module
jest.mock('@/lib/auth', () => ({
  verifyCookieToken: jest.fn(),
  findUserById: jest.fn(),
}))

// Mock Prisma
jest.mock('@/lib/prisma', () => ({
  prisma: {
    user: {
      findUnique: jest.fn(),
    },
    category: {
      findFirst: jest.fn(),
      create: jest.fn(),
    },
    transaction: {
      create: jest.fn(),
    },
  },
}))

import { verifyCookieToken, findUserById } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

const mockVerifyCookieToken = verifyCookieToken as jest.MockedFunction<typeof verifyCookieToken>
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

const mockUserWithGroup = {
  id: BigInt(1),
  groupId: BigInt(1),
}

const mockCategory = {
  id: BigInt(1),
  name: '식비',
  type: 'EXPENSE',
  color: '#ef4444',
  groupId: BigInt(1),
  createdBy: BigInt(1),
}

const mockTransaction = {
  id: BigInt(1),
  type: 'EXPENSE',
  date: new Date('2025-09-10'),
  amount: BigInt(-10000),
  categoryId: BigInt(1),
  memo: '점심식사',
  ownerUserId: BigInt(1),
  groupId: BigInt(1),
  createdAt: new Date(),
  updatedAt: new Date(),
  category: {
    id: BigInt(1),
    name: '식비',
    color: '#ef4444',
    type: 'EXPENSE',
  },
}

describe('Quick Add Transaction API', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    mockVerifyCookieToken.mockReturnValue(mockTokenPayload)
    mockFindUserById.mockResolvedValue(mockUser)
    ;(prisma.user.findUnique as jest.Mock).mockResolvedValue(mockUserWithGroup)
    ;(prisma.category.findFirst as jest.Mock).mockResolvedValue(mockCategory)
    ;(prisma.transaction.create as jest.Mock).mockResolvedValue(mockTransaction)
  })

  describe('POST /api/transactions/quick-add', () => {
    const validQuickAddData = {
      type: 'EXPENSE',
      amount: 10000,
      categoryName: '식비',
      memo: '점심식사',
      date: '2025-09-10',
      groupId: '1',
    }

    it('should create transaction successfully with valid data', async () => {
      const request = createMockRequest({
        method: 'POST',
        body: validQuickAddData,
        cookies: { accessToken: 'valid-token' },
      }) as NextRequest

      const response = await quickAddHandler(request)
      const responseData = await response.json()

      expect(response.status).toBe(201)
      expect(responseData.success).toBe(true)
      expect(responseData.transaction).toBeDefined()
      expect(responseData.message).toBe('거래가 성공적으로 추가되었습니다')
    })

    it('should reject request without auth token', async () => {
      const request = createMockRequest({
        method: 'POST',
        body: validQuickAddData,
        cookies: {},
      }) as NextRequest

      const response = await quickAddHandler(request)
      const responseData = await response.json()

      expect(response.status).toBe(401)
      expect(responseData.error).toBe('인증이 필요합니다')
      expect(responseData.code).toBe('AUTH_REQUIRED')
    })

    it('should reject request with invalid token', async () => {
      mockVerifyCookieToken.mockReturnValue(null)

      const request = createMockRequest({
        method: 'POST',
        body: validQuickAddData,
        cookies: { accessToken: 'invalid-token' },
      }) as NextRequest

      const response = await quickAddHandler(request)
      const responseData = await response.json()

      expect(response.status).toBe(401)
      expect(responseData.error).toBe('유효하지 않은 토큰입니다')
      expect(responseData.code).toBe('INVALID_TOKEN')
    })

    it('should validate required fields', async () => {
      const incompleteData = {
        type: 'EXPENSE',
        amount: 10000,
        // missing categoryName, date, groupId
      }

      const request = createMockRequest({
        method: 'POST',
        body: incompleteData,
        cookies: { accessToken: 'valid-token' },
      }) as NextRequest

      const response = await quickAddHandler(request)
      const responseData = await response.json()

      expect(response.status).toBe(400)
      expect(responseData.error).toBe('입력 데이터가 올바르지 않습니다')
      expect(responseData.code).toBe('VALIDATION_ERROR')
      expect(responseData.details).toBeDefined()
    })

    it('should validate transaction type', async () => {
      const invalidData = {
        ...validQuickAddData,
        type: 'INVALID_TYPE',
      }

      const request = createMockRequest({
        method: 'POST',
        body: invalidData,
        cookies: { accessToken: 'valid-token' },
      }) as NextRequest

      const response = await quickAddHandler(request)
      const responseData = await response.json()

      expect(response.status).toBe(400)
      expect(responseData.error).toBe('입력 데이터가 올바르지 않습니다')
    })

    it('should validate amount is positive integer', async () => {
      const invalidData = {
        ...validQuickAddData,
        amount: -1000,
      }

      const request = createMockRequest({
        method: 'POST',
        body: invalidData,
        cookies: { accessToken: 'valid-token' },
      }) as NextRequest

      const response = await quickAddHandler(request)
      const responseData = await response.json()

      expect(response.status).toBe(400)
      expect(responseData.error).toBe('입력 데이터가 올바르지 않습니다')
    })

    it('should validate date format', async () => {
      const invalidData = {
        ...validQuickAddData,
        date: 'invalid-date-format',
      }

      const request = createMockRequest({
        method: 'POST',
        body: invalidData,
        cookies: { accessToken: 'valid-token' },
      }) as NextRequest

      const response = await quickAddHandler(request)
      const responseData = await response.json()

      expect(response.status).toBe(400)
      expect(responseData.error).toBe('입력 데이터가 올바르지 않습니다')
    })

    it('should check group membership', async () => {
      // Mock user without group access
      ;(prisma.user.findUnique as jest.Mock).mockResolvedValue({
        id: BigInt(1),
        groupId: BigInt(999), // Different group
      })

      const request = createMockRequest({
        method: 'POST',
        body: validQuickAddData,
        cookies: { accessToken: 'valid-token' },
      }) as NextRequest

      const response = await quickAddHandler(request)
      const responseData = await response.json()

      expect(response.status).toBe(403)
      expect(responseData.error).toBe('그룹에 접근 권한이 없습니다')
      expect(responseData.code).toBe('ACCESS_DENIED')
    })

    it('should create new category if not exists', async () => {
      // Mock category not found
      ;(prisma.category.findFirst as jest.Mock).mockResolvedValue(null)
      ;(prisma.category.create as jest.Mock).mockResolvedValue(mockCategory)

      const request = createMockRequest({
        method: 'POST',
        body: validQuickAddData,
        cookies: { accessToken: 'valid-token' },
      }) as NextRequest

      const response = await quickAddHandler(request)
      const responseData = await response.json()

      expect(response.status).toBe(201)
      expect(prisma.category.create).toHaveBeenCalledWith({
        data: {
          name: '식비',
          type: 'EXPENSE',
          color: expect.any(String),
          groupId: BigInt(1),
          createdBy: BigInt(1),
        },
      })
    })

    it('should handle INCOME transaction type correctly', async () => {
      const incomeData = {
        ...validQuickAddData,
        type: 'INCOME',
        categoryName: '급여',
      }

      const incomeCategory = {
        ...mockCategory,
        name: '급여',
        type: 'INCOME',
      }

      const incomeTransaction = {
        ...mockTransaction,
        type: 'INCOME',
        amount: BigInt(10000), // Positive for income
        category: {
          ...mockTransaction.category,
          name: '급여',
          type: 'INCOME',
        },
      }

      ;(prisma.category.findFirst as jest.Mock).mockResolvedValue(incomeCategory)
      ;(prisma.transaction.create as jest.Mock).mockResolvedValue(incomeTransaction)

      const request = createMockRequest({
        method: 'POST',
        body: incomeData,
        cookies: { accessToken: 'valid-token' },
      }) as NextRequest

      const response = await quickAddHandler(request)
      const responseData = await response.json()

      expect(response.status).toBe(201)
      expect(prisma.transaction.create).toHaveBeenCalledWith({
        data: {
          type: 'INCOME',
          date: new Date('2025-09-10'),
          amount: BigInt(10000), // Positive amount for income
          categoryId: BigInt(1),
          memo: '점심식사',
          ownerUserId: BigInt(1),
          groupId: BigInt(1),
        },
        include: {
          category: {
            select: { id: true, name: true, color: true, type: true },
          },
        },
      })
    })

    it('should handle memo as optional field', async () => {
      const dataWithoutMemo = {
        ...validQuickAddData,
        memo: undefined,
      }

      const request = createMockRequest({
        method: 'POST',
        body: dataWithoutMemo,
        cookies: { accessToken: 'valid-token' },
      }) as NextRequest

      const response = await quickAddHandler(request)
      const responseData = await response.json()

      expect(response.status).toBe(201)
      expect(prisma.transaction.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          memo: null,
        }),
        include: expect.any(Object),
      })
    })

    it('should format response correctly', async () => {
      const request = createMockRequest({
        method: 'POST',
        body: validQuickAddData,
        cookies: { accessToken: 'valid-token' },
      }) as NextRequest

      const response = await quickAddHandler(request)
      const responseData = await response.json()

      expect(response.status).toBe(201)
      expect(responseData).toMatchObject({
        success: true,
        transaction: {
          id: '1',
          type: 'EXPENSE',
          date: expect.any(String),
          amount: '10000', // Absolute value as string
          category: {
            id: '1',
            name: '식비',
            color: '#ef4444',
            type: 'EXPENSE',
          },
          memo: '점심식사',
          createdAt: expect.any(String),
          updatedAt: expect.any(String),
        },
        message: '거래가 성공적으로 추가되었습니다',
      })
    })

    it('should handle database errors gracefully', async () => {
      ;(prisma.transaction.create as jest.Mock).mockRejectedValue(new Error('Database error'))

      const request = createMockRequest({
        method: 'POST',
        body: validQuickAddData,
        cookies: { accessToken: 'valid-token' },
      }) as NextRequest

      const response = await quickAddHandler(request)
      const responseData = await response.json()

      expect(response.status).toBe(500)
      expect(responseData.error).toBe('거래 생성 중 오류가 발생했습니다')
      expect(responseData.code).toBe('INTERNAL_ERROR')
    })
  })
})
