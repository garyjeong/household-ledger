/**
 * @jest-environment node
 */

import { NextRequest } from 'next/server'
import { GET as getBalanceHandler } from '@/app/api/balance/route'
import { createMockRequest, expectApiSuccess, expectApiError } from '../utils/test-helpers'

// Mock 모듈들
jest.mock('@/lib/auth', () => ({
  ...jest.requireActual('@/lib/auth'),
  verifyToken: jest.fn(),
  verifyResourceOwnership: jest.fn(),
}))

jest.mock('@/lib/services/balance-service', () => ({
  BalanceService: {
    calculateBalance: jest.fn(),
    getAmountByType: jest.fn(),
    calculateProjectedBalance: jest.fn(),
    getMonthlyTrend: jest.fn(),
    getBudgetStatus: jest.fn(),
  },
}))

import { verifyToken, verifyResourceOwnership } from '@/lib/auth'
import { BalanceService } from '@/lib/services/balance-service'

const mockVerifyToken = verifyToken as jest.MockedFunction<typeof verifyToken>
const mockVerifyResourceOwnership = verifyResourceOwnership as jest.MockedFunction<
  typeof verifyResourceOwnership
>
const mockBalanceService = BalanceService as jest.Mocked<typeof BalanceService>

// Mock 데이터
const mockUser = {
  userId: '1',
  email: 'test@example.com',
  nickname: 'testuser',
}

const mockMonthlyTrend = [
  { month: '2024-01', balance: 1500000, income: 2000000, expense: 500000 },
  { month: '2024-02', balance: 1800000, income: 1500000, expense: 1200000 },
  { month: '2024-03', balance: 2000000, income: 1800000, expense: 1600000 },
]

const mockBudgetStatus = [
  {
    categoryId: '1',
    categoryName: '식비',
    budgetAmount: 500000,
    spentAmount: 350000,
    percentage: 70,
    color: '#ff6b6b',
  },
  {
    categoryId: '2',
    categoryName: '교통비',
    budgetAmount: 200000,
    spentAmount: 150000,
    percentage: 75,
    color: '#4ecdc4',
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
      mockBalanceService.calculateBalance.mockResolvedValue(2000000)
      mockBalanceService.getAmountByType
        .mockResolvedValueOnce(2500000) // income
        .mockResolvedValueOnce(500000) // expense

      const request = createMockRequest('GET', '/api/balance', undefined, {
        cookies: { accessToken: 'valid-token' },
      })

      const response = await getBalanceHandler(request)

      expectApiSuccess(response, 200)
      const data = await response.json()

      expect(data.totalBalance).toBe(2000000)
      expect(data.totalIncome).toBe(2500000)
      expect(data.totalExpense).toBe(500000)
      expect(data.currency).toBe('KRW')
      expect(data.lastUpdated).toBeDefined()
    })

    it('예상 잔액 정보를 포함해서 반환해야 한다', async () => {
      mockVerifyToken.mockResolvedValue(mockUser)
      mockVerifyResourceOwnership.mockResolvedValue({ isValid: true })
      mockBalanceService.calculateBalance.mockResolvedValue(2000000)
      mockBalanceService.getAmountByType
        .mockResolvedValueOnce(2500000) // income
        .mockResolvedValueOnce(500000) // expense
      mockBalanceService.calculateProjectedBalance.mockResolvedValue(1800000)

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
      expect(data.projectedBalance).toBe(1800000)
      expect(data.projectionMonths).toBe(3)
    })

    it('월별 추세 데이터를 포함해서 반환해야 한다', async () => {
      mockVerifyToken.mockResolvedValue(mockUser)
      mockVerifyResourceOwnership.mockResolvedValue({ isValid: true })
      mockBalanceService.calculateBalance.mockResolvedValue(2000000)
      mockBalanceService.getAmountByType
        .mockResolvedValueOnce(2500000) // income
        .mockResolvedValueOnce(500000) // expense
      mockBalanceService.getMonthlyTrend.mockResolvedValue(mockMonthlyTrend)

      const request = createMockRequest(
        'GET',
        '/api/balance?includeTrend=true&trendMonths=3',
        undefined,
        { cookies: { accessToken: 'valid-token' } }
      )

      const response = await getBalanceHandler(request)

      expectApiSuccess(response, 200)
      const data = await response.json()

      expect(data.totalBalance).toBe(2000000)
      expect(data.monthlyTrend).toEqual(mockMonthlyTrend)
      expect(data.monthlyTrend).toHaveLength(3)
    })

    it('예산 상태 정보를 포함해서 반환해야 한다', async () => {
      mockVerifyToken.mockResolvedValue(mockUser)
      mockVerifyResourceOwnership.mockResolvedValue({ isValid: true })
      mockBalanceService.calculateBalance.mockResolvedValue(2000000)
      mockBalanceService.getAmountByType
        .mockResolvedValueOnce(2500000) // income
        .mockResolvedValueOnce(500000) // expense
      mockBalanceService.getBudgetStatus.mockResolvedValue(mockBudgetStatus)

      const request = createMockRequest(
        'GET',
        '/api/balance?includeBudget=true&budgetPeriod=2024-03',
        undefined,
        { cookies: { accessToken: 'valid-token' } }
      )

      const response = await getBalanceHandler(request)

      expectApiSuccess(response, 200)
      const data = await response.json()

      expect(data.totalBalance).toBe(2000000)
      expect(data.budgetStatus).toEqual(mockBudgetStatus)
      expect(data.budgetStatus).toHaveLength(2)
      expect(data.budgetStatus[0].categoryName).toBe('식비')
    })

    it('그룹 잔액을 조회할 수 있어야 한다', async () => {
      mockVerifyToken.mockResolvedValue(mockUser)
      mockVerifyResourceOwnership.mockResolvedValue({ isValid: true })
      mockBalanceService.calculateBalance.mockResolvedValue(5000000)
      mockBalanceService.getAmountByType
        .mockResolvedValueOnce(6000000) // income
        .mockResolvedValueOnce(1000000) // expense

      const request = createMockRequest('GET', '/api/balance?groupId=1', undefined, {
        cookies: { accessToken: 'valid-token' },
      })

      const response = await getBalanceHandler(request)

      expectApiSuccess(response, 200)
      const data = await response.json()

      expect(data.totalBalance).toBe(5000000)
      expect(data.totalIncome).toBe(6000000)
      expect(data.totalExpense).toBe(1000000)
      expect(mockBalanceService.calculateBalance).toHaveBeenCalledWith({
        userId: '1',
        groupId: '1',
      })
    })

    it('날짜 범위로 잔액을 조회할 수 있어야 한다', async () => {
      mockVerifyToken.mockResolvedValue(mockUser)
      mockVerifyResourceOwnership.mockResolvedValue({ isValid: true })
      mockBalanceService.calculateBalance.mockResolvedValue(1500000)
      mockBalanceService.getAmountByType
        .mockResolvedValueOnce(2000000) // income
        .mockResolvedValueOnce(500000) // expense

      const startDate = '2024-01-01'
      const endDate = '2024-01-31'

      const request = createMockRequest(
        'GET',
        `/api/balance?startDate=${startDate}&endDate=${endDate}`,
        undefined,
        { cookies: { accessToken: 'valid-token' } }
      )

      const response = await getBalanceHandler(request)

      expectApiSuccess(response, 200)
      const data = await response.json()

      expect(data.totalBalance).toBe(1500000)
      expect(mockBalanceService.calculateBalance).toHaveBeenCalledWith({
        userId: '1',
        startDate: new Date(startDate),
        endDate: new Date(endDate),
      })
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

    it('BalanceService 에러를 올바르게 처리해야 한다', async () => {
      mockVerifyToken.mockResolvedValue(mockUser)
      mockVerifyResourceOwnership.mockResolvedValue({ isValid: true })
      mockBalanceService.calculateBalance.mockRejectedValue(new Error('Database connection failed'))

      const request = createMockRequest('GET', '/api/balance', undefined, {
        cookies: { accessToken: 'valid-token' },
      })

      const response = await getBalanceHandler(request)

      expectApiError(response, 500, 'INTERNAL_ERROR')
    })

    it('빈 결과를 올바르게 처리해야 한다', async () => {
      mockVerifyToken.mockResolvedValue(mockUser)
      mockVerifyResourceOwnership.mockResolvedValue({ isValid: true })
      mockBalanceService.calculateBalance.mockResolvedValue(0)
      mockBalanceService.getAmountByType
        .mockResolvedValueOnce(0) // income
        .mockResolvedValueOnce(0) // expense

      const request = createMockRequest('GET', '/api/balance', undefined, {
        cookies: { accessToken: 'valid-token' },
      })

      const response = await getBalanceHandler(request)

      expectApiSuccess(response, 200)
      const data = await response.json()

      expect(data.totalBalance).toBe(0)
      expect(data.totalIncome).toBe(0)
      expect(data.totalExpense).toBe(0)
      expect(data.currency).toBe('KRW')
    })
  })
})
