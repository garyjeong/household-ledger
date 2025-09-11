import { NextRequest } from 'next/server'
import { GET } from '@/app/api/dashboard/monthly-stats/route'

// Mock the auth verification
const mockVerifyAccessToken = jest.fn()
jest.mock('@/lib/auth', () => ({
  verifyAccessToken: mockVerifyAccessToken,
}))

// Mock the optimized stats
const mockGetOptimizedMonthlyStats = jest.fn()
jest.mock('@/lib/optimized-stats', () => ({
  getOptimizedMonthlyStats: mockGetOptimizedMonthlyStats,
}))

// Mock security utils
const mockSafeConsole = {
  log: jest.fn(),
  warn: jest.fn(),
  error: jest.fn(),
  info: jest.fn(),
}
jest.mock('@/lib/security-utils', () => ({
  safeConsole: mockSafeConsole,
}))

describe('Monthly Stats API', () => {
  beforeEach(() => {
    jest.clearAllMocks()

    // Default mock for authenticated user
    mockVerifyAccessToken.mockReturnValue({
      userId: 'user1',
      email: 'test@example.com',
      nickname: 'Test User',
    })

    // Default mock for stats
    mockGetOptimizedMonthlyStats.mockResolvedValue({
      totalIncome: 3000000,
      totalExpense: 2000000,
      netAmount: 1000000,
      transactionCount: 25,
      categoryBreakdown: [
        { categoryId: '1', categoryName: '식비', amount: 800000, percentage: 40, color: '#FF6B6B' },
        {
          categoryId: '2',
          categoryName: '교통비',
          amount: 400000,
          percentage: 20,
          color: '#4ECDC4',
        },
      ],
      dailyTrend: [
        { date: '2024-01-01', amount: 50000, type: 'expense' as const },
        { date: '2024-01-02', amount: 30000, type: 'expense' as const },
      ],
      comparisonWithPrevious: {
        incomeChange: 5.2,
        expenseChange: -3.1,
        netChange: 12.8,
      },
    })
  })

  describe('Parameter Handling', () => {
    it('should accept year and month parameters correctly', async () => {
      const url = 'http://localhost:3001/api/dashboard/monthly-stats?year=2024&month=3'
      const request = new NextRequest(url)
      request.cookies.set('accessToken', 'valid-token')

      const response = await GET(request)

      expect(response.status).toBe(200)
      expect(mockGetOptimizedMonthlyStats).toHaveBeenCalledWith({
        year: 2024,
        month: 3,
        userId: 'user1',
        groupId: undefined,
      })
    })

    it('should handle groupId parameter', async () => {
      const url =
        'http://localhost:3001/api/dashboard/monthly-stats?year=2024&month=3&groupId=group123'
      const request = new NextRequest(url)
      request.cookies.set('accessToken', 'valid-token')

      const response = await GET(request)

      expect(response.status).toBe(200)
      expect(mockGetOptimizedMonthlyStats).toHaveBeenCalledWith({
        year: 2024,
        month: 3,
        userId: 'user1',
        groupId: 'group123',
      })
    })

    it('should use current date when year/month not provided', async () => {
      const currentDate = new Date()
      const currentYear = currentDate.getFullYear()
      const currentMonth = currentDate.getMonth() + 1

      const url = 'http://localhost:3001/api/dashboard/monthly-stats'
      const request = new NextRequest(url)
      request.cookies.set('accessToken', 'valid-token')

      const response = await GET(request)

      expect(response.status).toBe(200)
      expect(mockGetOptimizedMonthlyStats).toHaveBeenCalledWith({
        year: currentYear,
        month: currentMonth,
        userId: 'user1',
        groupId: undefined,
      })
    })

    it('should validate year parameter range', async () => {
      const url = 'http://localhost:3001/api/dashboard/monthly-stats?year=1999&month=3'
      const request = new NextRequest(url)
      request.cookies.set('accessToken', 'valid-token')

      const response = await GET(request)

      expect(response.status).toBe(400)
      const json = await response.json()
      expect(json.error).toContain('유효하지 않은 연도')
    })

    it('should validate month parameter range', async () => {
      const url = 'http://localhost:3001/api/dashboard/monthly-stats?year=2024&month=13'
      const request = new NextRequest(url)
      request.cookies.set('accessToken', 'valid-token')

      const response = await GET(request)

      expect(response.status).toBe(400)
      const json = await response.json()
      expect(json.error).toContain('유효하지 않은 월')
    })

    it('should handle invalid year format', async () => {
      const url = 'http://localhost:3001/api/dashboard/monthly-stats?year=invalid&month=3'
      const request = new NextRequest(url)
      request.cookies.set('accessToken', 'valid-token')

      const response = await GET(request)

      expect(response.status).toBe(400)
      const json = await response.json()
      expect(json.error).toContain('유효하지 않은 연도')
    })

    it('should handle invalid month format', async () => {
      const url = 'http://localhost:3001/api/dashboard/monthly-stats?year=2024&month=invalid'
      const request = new NextRequest(url)
      request.cookies.set('accessToken', 'valid-token')

      const response = await GET(request)

      expect(response.status).toBe(400)
      const json = await response.json()
      expect(json.error).toContain('유효하지 않은 월')
    })
  })

  describe('Authentication', () => {
    it('should return 401 when no access token provided', async () => {
      const url = 'http://localhost:3001/api/dashboard/monthly-stats?year=2024&month=3'
      const request = new NextRequest(url)

      const response = await GET(request)

      expect(response.status).toBe(401)
      const json = await response.json()
      expect(json.error).toContain('인증이 필요합니다')
    })

    it('should return 401 when invalid access token provided', async () => {
      mockVerifyAccessToken.mockReturnValue(null)

      const url = 'http://localhost:3001/api/dashboard/monthly-stats?year=2024&month=3'
      const request = new NextRequest(url)
      request.cookies.set('accessToken', 'invalid-token')

      const response = await GET(request)

      expect(response.status).toBe(401)
    })
  })

  describe('Data Response', () => {
    it('should return proper response structure', async () => {
      const url = 'http://localhost:3001/api/dashboard/monthly-stats?year=2024&month=3'
      const request = new NextRequest(url)
      request.cookies.set('accessToken', 'valid-token')

      const response = await GET(request)

      expect(response.status).toBe(200)
      const json = await response.json()

      expect(json.success).toBe(true)
      expect(json.data).toBeDefined()
      expect(json.data.totalIncome).toBe(3000000)
      expect(json.data.totalExpense).toBe(2000000)
      expect(json.data.netAmount).toBe(1000000)
      expect(json.data.categoryBreakdown).toHaveLength(2)
      expect(json.data.dailyTrend).toHaveLength(2)
    })

    it('should handle database errors gracefully', async () => {
      mockGetOptimizedMonthlyStats.mockRejectedValue(new Error('Database connection failed'))

      const url = 'http://localhost:3001/api/dashboard/monthly-stats?year=2024&month=3'
      const request = new NextRequest(url)
      request.cookies.set('accessToken', 'valid-token')

      const response = await GET(request)

      expect(response.status).toBe(500)
      const json = await response.json()
      expect(json.success).toBe(false)
      expect(json.error).toContain('월별 통계를 가져오는데 실패했습니다')
    })
  })

  describe('Logging', () => {
    it('should log API calls with parameters', async () => {
      const url =
        'http://localhost:3001/api/dashboard/monthly-stats?year=2024&month=3&groupId=group123'
      const request = new NextRequest(url)
      request.cookies.set('accessToken', 'valid-token')

      await GET(request)

      expect(mockSafeConsole.info).toHaveBeenCalledWith(
        'API /api/dashboard/monthly-stats 호출됨',
        expect.objectContaining({
          year: 2024,
          month: 3,
          groupId: 'group123',
          userId: 'user1',
        })
      )
    })
  })
})
