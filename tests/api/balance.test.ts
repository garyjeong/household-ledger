/**
 * @jest-environment node
 */

import { NextRequest } from 'next/server'
import {
  GET as getBalanceHandler,
  POST as recalculateBalanceHandler,
} from '@/app/api/balance/route'
import { createMockRequest, expectApiSuccess, expectApiError } from '../utils/test-helpers'

// Mock 모듈들
jest.mock('@/lib/auth', () => ({
  ...jest.requireActual('@/lib/auth'),
  verifyToken: jest.fn(),
  verifyResourceOwnership: jest.fn(),
}))

jest.mock('@/lib/prisma', () => ({
  prisma: {
    account: {
      findMany: jest.fn(),
      update: jest.fn(),
    },
    recurringRule: {
      findMany: jest.fn(),
    },
    transaction: {
      findMany: jest.fn(),
    },
    $transaction: jest.fn(),
  },
}))

import { verifyToken, verifyResourceOwnership } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

const mockVerifyToken = verifyToken as jest.MockedFunction<typeof verifyToken>
const mockVerifyResourceOwnership = verifyResourceOwnership as jest.MockedFunction<
  typeof verifyResourceOwnership
>

// Mock 데이터
const mockUser = {
  userId: '1',
  email: 'test@example.com',
  nickname: 'testuser',
}

const mockAccounts = [
  {
    id: BigInt(1),
    name: '신한은행 주계좌',
    type: 'BANK',
    currency: 'KRW',
    balance: BigInt(1500000),
    isActive: true,
    ownerType: 'USER',
    ownerId: BigInt(1),
  },
  {
    id: BigInt(2),
    name: '카카오뱅크',
    type: 'BANK',
    currency: 'KRW',
    balance: BigInt(500000),
    isActive: true,
    ownerType: 'USER',
    ownerId: BigInt(1),
  },
]

const mockRecurringExpenses = [
  {
    id: BigInt(1),
    frequency: 'MONTHLY',
    dayRule: 'D25',
    amount: BigInt(50000),
    merchant: '넷플릭스',
    isActive: true,
  },
  {
    id: BigInt(2),
    frequency: 'WEEKLY',
    dayRule: 'SUN',
    amount: BigInt(15000),
    merchant: '스타벅스',
    isActive: true,
  },
]

const mockTransactions = [
  {
    id: BigInt(1),
    type: 'INCOME',
    amount: BigInt(1000000),
    accountId: BigInt(1),
    createdAt: new Date('2024-01-01'),
  },
  {
    id: BigInt(2),
    type: 'EXPENSE',
    amount: BigInt(300000),
    accountId: BigInt(1),
    createdAt: new Date('2024-01-02'),
  },
]

describe('/api/balance', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  describe('GET /api/balance', () => {
    it('인증되지 않은 요청을 거부해야 한다', async () => {
      const request = createMockRequest('GET', '/api/balance')

      const response = await getBalanceHandler(request)

      expectApiError(response, 401, 'AUTH_REQUIRED')
    })

    it('기본 잔액 정보를 성공적으로 반환해야 한다', async () => {
      mockVerifyToken.mockResolvedValue(mockUser)
      mockVerifyResourceOwnership.mockResolvedValue({ isValid: true })
      ;(prisma.account.findMany as jest.Mock).mockResolvedValue(mockAccounts)

      const request = createMockRequest('GET', '/api/balance', undefined, {
        cookies: { accessToken: 'valid-token' },
      })

      const response = await getBalanceHandler(request)

      expectApiSuccess(response, 200)
      const data = await response.json()

      expect(data.totalBalance).toBe(2000000) // 1,500,000 + 500,000
      expect(data.accountBalances).toHaveLength(2)
      expect(data.currency).toBe('KRW')
      expect(data.lastUpdated).toBeDefined()
    })

    it('예상 잔액 정보를 포함해서 반환해야 한다', async () => {
      mockVerifyToken.mockResolvedValue(mockUser)
      mockVerifyResourceOwnership.mockResolvedValue({ isValid: true })
      ;(prisma.account.findMany as jest.Mock).mockResolvedValue(mockAccounts)
      ;(prisma.recurringRule.findMany as jest.Mock).mockResolvedValue(mockRecurringExpenses)

      const request = createMockRequest(
        'GET',
        '/api/balance?includeProjection=true&projectionMonths=3',
        undefined,
        { cookies: { accessToken: 'valid-token' } }
      )

      const response = await getBalanceHandler(request)

      expectApiSuccess(response, 200)
      const data = await response.json()

      expect(data.totalBalance).toBe(2000000)
      expect(data.recurringExpenses).toBeDefined()
      expect(data.recurringExpenses.monthly).toBe(50000)
      expect(data.recurringExpenses.weekly).toBe(15000)
      expect(data.projection).toBeDefined()
      expect(data.projection.months).toHaveLength(3)
    })

    it('특정 계좌 잔액만 조회할 수 있어야 한다', async () => {
      mockVerifyToken.mockResolvedValue(mockUser)
      mockVerifyResourceOwnership.mockResolvedValue({ isValid: true })
      ;(prisma.account.findMany as jest.Mock).mockResolvedValue([mockAccounts[0]])

      const request = createMockRequest('GET', '/api/balance?accountId=1', undefined, {
        cookies: { accessToken: 'valid-token' },
      })

      const response = await getBalanceHandler(request)

      expectApiSuccess(response, 200)
      const data = await response.json()

      expect(data.totalBalance).toBe(1500000)
      expect(data.accountBalances).toHaveLength(1)
      expect(data.accountBalances[0].id).toBe('1')
    })

    it('계좌가 없을 때 빈 잔액 정보를 반환해야 한다', async () => {
      mockVerifyToken.mockResolvedValue(mockUser)
      mockVerifyResourceOwnership.mockResolvedValue({ isValid: true })
      ;(prisma.account.findMany as jest.Mock).mockResolvedValue([])

      const request = createMockRequest('GET', '/api/balance', undefined, {
        cookies: { accessToken: 'valid-token' },
      })

      const response = await getBalanceHandler(request)

      expectApiSuccess(response, 200)
      const data = await response.json()

      expect(data.totalBalance).toBe(0)
      expect(data.accountBalances).toHaveLength(0)
      expect(data.currency).toBe('KRW')
    })

    it('접근 권한이 없는 경우 403을 반환해야 한다', async () => {
      mockVerifyToken.mockResolvedValue(mockUser)
      mockVerifyResourceOwnership.mockResolvedValue({
        isValid: false,
        error: '접근 권한이 없습니다',
      })

      const request = createMockRequest('GET', '/api/balance', undefined, {
        cookies: { accessToken: 'valid-token' },
      })

      const response = await getBalanceHandler(request)

      expectApiError(response, 403, 'ACCESS_DENIED')
    })

    it('잘못된 쿼리 파라미터를 거부해야 한다', async () => {
      mockVerifyToken.mockResolvedValue(mockUser)

      const request = createMockRequest('GET', '/api/balance?projectionMonths=invalid', undefined, {
        cookies: { accessToken: 'valid-token' },
      })

      const response = await getBalanceHandler(request)

      expectApiError(response, 400, 'VALIDATION_ERROR')
    })
  })

  describe('POST /api/balance/recalculate', () => {
    it('인증되지 않은 요청을 거부해야 한다', async () => {
      const request = createMockRequest('POST', '/api/balance', {})

      const response = await recalculateBalanceHandler(request)

      expectApiError(response, 401, 'AUTH_REQUIRED')
    })

    it('잔액을 성공적으로 재계산해야 한다', async () => {
      mockVerifyToken.mockResolvedValue(mockUser)
      mockVerifyResourceOwnership.mockResolvedValue({ isValid: true })
      ;(prisma.account.findMany as jest.Mock).mockResolvedValue(mockAccounts)
      ;(prisma.transaction.findMany as jest.Mock).mockResolvedValue(mockTransactions)
      ;(prisma.account.update as jest.Mock).mockResolvedValue(mockAccounts[0])

      const request = createMockRequest(
        'POST',
        '/api/balance',
        { ownerType: 'USER', ownerId: '1' },
        { cookies: { accessToken: 'valid-token' } }
      )

      const response = await recalculateBalanceHandler(request)

      expectApiSuccess(response, 200)
      const data = await response.json()

      expect(data.success).toBe(true)
      expect(data.results).toBeDefined()
      expect(data.message).toContain('계좌')
    })

    it('잔액 불일치가 있는 계좌만 업데이트해야 한다', async () => {
      mockVerifyToken.mockResolvedValue(mockUser)
      mockVerifyResourceOwnership.mockResolvedValue({ isValid: true })

      // 잔액이 맞지 않는 계좌
      const incorrectAccount = {
        ...mockAccounts[0],
        balance: BigInt(1000000), // 실제 계산값과 다름
      }

      ;(prisma.account.findMany as jest.Mock).mockResolvedValue([incorrectAccount])
      ;(prisma.transaction.findMany as jest.Mock).mockResolvedValue(mockTransactions)
      ;(prisma.account.update as jest.Mock).mockResolvedValue(incorrectAccount)

      const request = createMockRequest(
        'POST',
        '/api/balance',
        { ownerType: 'USER', ownerId: '1' },
        { cookies: { accessToken: 'valid-token' } }
      )

      const response = await recalculateBalanceHandler(request)

      expectApiSuccess(response, 200)
      const data = await response.json()

      expect(data.success).toBe(true)
      expect(data.results[0].wasUpdated).toBe(true)
      expect(data.results[0].difference).not.toBe(0)
    })

    it('특정 계좌만 재계산할 수 있어야 한다', async () => {
      mockVerifyToken.mockResolvedValue(mockUser)
      mockVerifyResourceOwnership.mockResolvedValue({ isValid: true })
      ;(prisma.account.findMany as jest.Mock).mockResolvedValue([mockAccounts[0]])
      ;(prisma.transaction.findMany as jest.Mock).mockResolvedValue(mockTransactions)

      const request = createMockRequest(
        'POST',
        '/api/balance',
        { ownerType: 'USER', ownerId: '1', accountId: '1' },
        { cookies: { accessToken: 'valid-token' } }
      )

      const response = await recalculateBalanceHandler(request)

      expectApiSuccess(response, 200)

      // 특정 계좌만 조회되었는지 확인
      expect(prisma.account.findMany).toHaveBeenCalledWith({
        where: {
          ownerType: 'USER',
          ownerId: BigInt(1),
          id: BigInt(1),
        },
      })
    })
  })
})
