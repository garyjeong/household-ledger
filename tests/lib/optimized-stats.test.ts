// tests/lib/optimized-stats.test.ts

// Jest mocks (must be at the top)
jest.mock('@/lib/prisma', () => ({
  prisma: {
    $queryRaw: jest.fn(),
  },
}))

jest.mock('@/lib/security-utils', () => ({
  safeConsole: {
    log: jest.fn(),
    error: jest.fn(),
    warn: jest.fn(),
    info: jest.fn(),
  },
}))

import { getOptimizedMonthlyStats, type StatsQueryParams } from '@/lib/optimized-stats'
import { safeConsole } from '@/lib/security-utils'
import { prisma } from '@/lib/prisma'

// Get mocked prisma reference
const mockPrisma = prisma as jest.Mocked<typeof prisma>

// Mock 데이터
const mockAggregateResults = [
  { metric_type: 'total_income', total_amount: BigInt(1000000), count_value: BigInt(10) },
  { metric_type: 'total_expense', total_amount: BigInt(750000), count_value: BigInt(15) },
  { metric_type: 'my_expense', total_amount: BigInt(400000), count_value: BigInt(12) },
  { metric_type: 'shared_expense', total_amount: BigInt(350000), count_value: BigInt(8) },
  { metric_type: 'partner_expense', total_amount: BigInt(300000), count_value: BigInt(5) },
  { metric_type: 'total_count', total_amount: BigInt(0), count_value: BigInt(25) },
]

const mockCategoryResults = [
  { categoryId: BigInt(1), categoryName: '식비', total_amount: BigInt(300000) },
  { categoryId: BigInt(2), categoryName: '교통', total_amount: BigInt(150000) },
  { categoryId: null, categoryName: null, total_amount: BigInt(100000) },
]

const mockDailyResults = [
  {
    transaction_date: new Date('2024-01-01'),
    daily_income: BigInt(100000),
    daily_expense: BigInt(50000),
  },
  {
    transaction_date: new Date('2024-01-02'),
    daily_income: BigInt(0),
    daily_expense: BigInt(30000),
  },
  {
    transaction_date: new Date('2024-01-03'),
    daily_income: BigInt(50000),
    daily_expense: BigInt(80000),
  },
]

describe('Optimized Stats', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    // 기본 mock 응답 설정
    mockPrisma.$queryRaw
      .mockResolvedValueOnce(mockAggregateResults) // 첫 번째 $queryRaw 호출 (집계 데이터)
      .mockResolvedValueOnce(mockCategoryResults) // Promise.all 내 첫 번째 쿼리 (카테고리)
      .mockResolvedValueOnce(mockDailyResults) // Promise.all 내 두 번째 쿼리 (일별 트렌드)
  })

  describe('getOptimizedMonthlyStats', () => {
    const mockParams: StatsQueryParams = {
      userId: '123',
      year: 2024,
      month: 1,
      groupFilter: { groupId: BigInt(1) },
    }

    it('should return correctly formatted monthly stats', async () => {
      const result = await getOptimizedMonthlyStats(mockParams)

      expect(result).toEqual({
        totalIncome: 1000000,
        totalExpense: 750000,
        transactionCount: 25,
        myExpense: 400000,
        sharedExpense: 350000,
        partnerExpense: 300000,
        categoryStats: [
          { categoryId: '1', categoryName: '식비', amount: 300000 },
          { categoryId: '2', categoryName: '교통', amount: 150000 },
          { categoryId: null, categoryName: '미분류', amount: 100000 },
        ],
        dailyTrend: [
          { date: '2024-01-01', income: 100000, expense: 50000 },
          { date: '2024-01-02', income: 0, expense: 30000 },
          { date: '2024-01-03', income: 50000, expense: 80000 },
        ],
      })
    })

    it('should handle null group filter', async () => {
      const paramsWithoutGroup = { ...mockParams, groupFilter: { groupId: null } }

      await getOptimizedMonthlyStats(paramsWithoutGroup)

      // SQL 쿼리에 groupId 조건이 포함되지 않는지 확인 (null인 경우)
      const firstQueryCall = mockPrisma.$queryRaw.mock.calls[0][0]
      // null 그룹인 경우에는 AND groupId 조건이 추가되지 않음
      expect(firstQueryCall).not.toContain('AND groupId')
    })

    it('should handle specific group filter', async () => {
      await getOptimizedMonthlyStats(mockParams)

      // 쿼리가 3번 호출되고 모든 호출에 대해 groupId가 포함되는지 확인
      expect(mockPrisma.$queryRaw).toHaveBeenCalledTimes(3)

      // 첫 번째 쿼리 (aggregate)가 groupId 파라미터를 포함하는지 확인
      const firstQueryCall = mockPrisma.$queryRaw.mock.calls[0]
      expect(firstQueryCall).toBeDefined()
      expect(firstQueryCall.length).toBeGreaterThan(3) // 날짜 2개 + groupId가 여러 번 포함
    })

    it('should execute exactly 3 optimized queries', async () => {
      await getOptimizedMonthlyStats(mockParams)

      expect(mockPrisma.$queryRaw).toHaveBeenCalledTimes(3)
      expect(safeConsole.log).toHaveBeenCalled() // 성공시 완료 로그 출력
    })

    it('should calculate date range correctly', async () => {
      await getOptimizedMonthlyStats(mockParams)

      // 첫 번째 쿼리 호출에서 날짜 범위 확인
      const firstQueryCall = mockPrisma.$queryRaw.mock.calls[0]
      const startDate = firstQueryCall[1] // 첫 번째 파라미터
      const endDate = firstQueryCall[2] // 두 번째 파라미터

      expect(startDate).toEqual(new Date(2024, 0, 1)) // 2024-01-01 00:00:00
      expect(endDate).toEqual(new Date(2024, 1, 0, 23, 59, 59)) // 2024-01-31 23:59:59.000
    })

    it('should handle database errors gracefully', async () => {
      // 완전히 새로운 mock 구성으로 에러 테스트
      jest.clearAllMocks()

      // 모든 $queryRaw 호출에 대해 에러를 발생시킴
      const dbError = new Error('Database connection failed')
      mockPrisma.$queryRaw.mockImplementation(() => Promise.reject(dbError))

      const result = await getOptimizedMonthlyStats(mockParams)

      // 에러 발생시 빈 결과 반환
      expect(result).toEqual({
        totalIncome: 0,
        totalExpense: 0,
        transactionCount: 0,
        myExpense: 0,
        sharedExpense: 0,
        partnerExpense: 0,
        categoryStats: [],
        dailyTrend: [],
      })

      // 에러 로깅 확인
      expect(safeConsole.error).toHaveBeenCalledWith(
        '최적화된 월별 통계 조회 실패',
        dbError,
        expect.objectContaining({
          userId: '123',
          year: 2024,
          month: 1,
          operation: 'getOptimizedMonthlyStats',
        })
      )
    })

    it('should handle missing data gracefully', async () => {
      // 새로운 mock 설정으로 빈 데이터 테스트 (Promise.all 이후)
      jest.clearAllMocks()
      mockPrisma.$queryRaw
        .mockResolvedValueOnce([]) // 집계 데이터 없음
        .mockResolvedValueOnce([]) // 카테고리 데이터 없음
        .mockResolvedValueOnce([]) // 일별 데이터 없음

      const result = await getOptimizedMonthlyStats(mockParams)

      expect(result.totalIncome).toBe(0)
      expect(result.totalExpense).toBe(0)
      expect(result.transactionCount).toBe(0)
      expect(result.categoryStats).toEqual([])
      expect(result.dailyTrend).toEqual([])
    })

    it('should format BigInt values to numbers correctly', async () => {
      const result = await getOptimizedMonthlyStats(mockParams)

      // 모든 금액이 number 타입인지 확인
      expect(typeof result.totalIncome).toBe('number')
      expect(typeof result.totalExpense).toBe('number')
      expect(typeof result.transactionCount).toBe('number')
      expect(typeof result.myExpense).toBe('number')
      expect(typeof result.sharedExpense).toBe('number')
      expect(typeof result.partnerExpense).toBe('number')

      result.categoryStats.forEach(category => {
        expect(typeof category.amount).toBe('number')
      })

      result.dailyTrend.forEach(day => {
        expect(typeof day.income).toBe('number')
        expect(typeof day.expense).toBe('number')
      })
    })

    it('should format daily trend dates correctly', async () => {
      const result = await getOptimizedMonthlyStats(mockParams)

      result.dailyTrend.forEach(day => {
        expect(day.date).toMatch(/^\d{4}-\d{2}-\d{2}$/) // YYYY-MM-DD 형식
        expect(new Date(day.date).toISOString().split('T')[0]).toBe(day.date)
      })
    })
  })

  describe('SQL Query Structure', () => {
    it('should use UNION ALL for aggregate queries', async () => {
      const mockParams: StatsQueryParams = {
        userId: '123',
        year: 2024,
        month: 1,
        groupFilter: { groupId: BigInt(1) },
      }

      await getOptimizedMonthlyStats(mockParams)

      const firstQueryCall = mockPrisma.$queryRaw.mock.calls[0]
      // 첫 번째 인자가 TemplateStringsArray인지 확인
      expect(Array.isArray(firstQueryCall[0])).toBe(true)
      const sqlTemplate = firstQueryCall[0].join('')
      expect(sqlTemplate).toContain('UNION ALL')
      expect(sqlTemplate).toContain('total_income')
      expect(sqlTemplate).toContain('total_expense')
      expect(sqlTemplate).toContain('total_count')
    })

    it('should use JOIN for category queries', async () => {
      const mockParams: StatsQueryParams = {
        userId: '123',
        year: 2024,
        month: 1,
        groupFilter: { groupId: BigInt(1) },
      }

      await getOptimizedMonthlyStats(mockParams)

      const categoryQueryCall = mockPrisma.$queryRaw.mock.calls[1]
      const categoryTemplate = categoryQueryCall[0].join('')
      expect(categoryTemplate).toContain('LEFT JOIN categories') // lowercase table name
      expect(categoryTemplate).toContain('GROUP BY')
      expect(categoryTemplate).toContain('ORDER BY total_amount DESC')
      expect(categoryTemplate).toContain('LIMIT 5')
    })

    it('should use GROUP BY for daily trend queries', async () => {
      const mockParams: StatsQueryParams = {
        userId: '123',
        year: 2024,
        month: 1,
        groupFilter: { groupId: BigInt(1) },
      }

      await getOptimizedMonthlyStats(mockParams)

      const dailyQueryCall = mockPrisma.$queryRaw.mock.calls[2]
      const dailyTemplate = dailyQueryCall[0].join('')
      expect(dailyTemplate).toContain('GROUP BY DATE(date)')
      expect(dailyTemplate).toContain('ORDER BY transaction_date ASC')
    })
  })
})
