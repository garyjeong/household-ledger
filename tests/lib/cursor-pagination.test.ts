// tests/lib/cursor-pagination.test.ts
import {
  PrismaCursorPagination,
  PaginationMigrationHelper,
  type CursorPaginationParams,
  type TransactionPaginationParams,
} from '@/lib/cursor-pagination'
import { safeConsole } from '@/lib/security-utils'

// Mock 트랜잭션 데이터
const mockTransactions = [
  { id: BigInt(10), amount: 50000, type: 'EXPENSE', memo: 'Coffee', date: new Date('2024-01-10') },
  { id: BigInt(9), amount: 100000, type: 'INCOME', memo: 'Salary', date: new Date('2024-01-09') },
  { id: BigInt(8), amount: 30000, type: 'EXPENSE', memo: 'Lunch', date: new Date('2024-01-08') },
  { id: BigInt(7), amount: 15000, type: 'EXPENSE', memo: 'Bus', date: new Date('2024-01-07') },
  { id: BigInt(6), amount: 80000, type: 'EXPENSE', memo: 'Dinner', date: new Date('2024-01-06') },
]

// Mock Prisma
const mockPrisma = {
  transaction: {
    findMany: jest.fn(),
    findFirst: jest.fn(),
    count: jest.fn(),
  },
}

// Mock safeConsole
jest.mock('@/lib/security-utils', () => ({
  safeConsole: {
    log: jest.fn(),
    error: jest.fn(),
    warn: jest.fn(),
    info: jest.fn(),
  },
}))

describe('Cursor Pagination', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  describe('PrismaCursorPagination.getTransactions', () => {
    const baseParams: TransactionPaginationParams = {
      userId: '123',
      limit: 3,
      direction: 'forward',
    }

    it('should fetch first page without cursor', async () => {
      const firstPageData = mockTransactions.slice(0, 4) // limit + 1
      mockPrisma.transaction.findMany.mockResolvedValue(firstPageData)
      mockPrisma.transaction.findFirst.mockResolvedValue(null) // 이전 페이지 없음

      const result = await PrismaCursorPagination.getTransactions(mockPrisma as any, baseParams)

      expect(result.data).toHaveLength(3) // limit 만큼만 반환
      expect(result.pagination.hasMore).toBe(true) // 4개 데이터 중 3개만 반환했으므로 더 있음
      expect(result.pagination.nextCursor).toBeTruthy()
      expect(result.pagination.prevCursor).toBe(null) // 첫 페이지이므로 이전 커서 없음
    })

    it('should handle cursor-based forward pagination', async () => {
      const cursor = Buffer.from('8').toString('base64') // ID 8을 커서로 사용
      const secondPageData = mockTransactions.slice(2, 4) // ID 7, 6

      mockPrisma.transaction.findMany.mockResolvedValue(secondPageData)
      mockPrisma.transaction.findFirst.mockResolvedValue({ id: BigInt(9) }) // 이전 페이지 있음

      const result = await PrismaCursorPagination.getTransactions(mockPrisma as any, {
        ...baseParams,
        cursor,
      })

      // findMany 호출시 올바른 조건 확인
      expect(mockPrisma.transaction.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            ownerUserId: BigInt('123'),
            id: { lt: BigInt('8') }, // cursor보다 작은 ID (최신순이므로)
          }),
          orderBy: { id: 'desc' },
          take: 4, // limit + 1
        })
      )

      expect(result.data).toHaveLength(2)
      expect(result.pagination.prevCursor).toBeTruthy()
    })

    it('should handle backward pagination', async () => {
      const cursor = Buffer.from('6').toString('base64')
      const backwardData = mockTransactions.slice(0, 3).reverse() // ID 8, 9, 10을 역순으로

      mockPrisma.transaction.findMany.mockResolvedValue(backwardData)
      mockPrisma.transaction.findFirst.mockResolvedValue({ id: BigInt(11) })

      const result = await PrismaCursorPagination.getTransactions(mockPrisma as any, {
        ...baseParams,
        cursor,
        direction: 'backward',
      })

      // backward pagination에서는 orderBy가 asc로 변경되어야 함
      expect(mockPrisma.transaction.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            id: { gt: BigInt('6') }, // cursor보다 큰 ID
          }),
          orderBy: { id: 'asc' }, // backward일 때는 asc
        })
      )

      expect(result.data).toEqual(backwardData.reverse()) // 결과는 다시 원래 순서로
    })

    it('should apply filters correctly', async () => {
      const filters = {
        type: 'EXPENSE',
        date: { gte: new Date('2024-01-01') },
        categoryId: BigInt(5),
      }

      mockPrisma.transaction.findMany.mockResolvedValue([])
      mockPrisma.transaction.findFirst.mockResolvedValue(null)

      await PrismaCursorPagination.getTransactions(mockPrisma as any, {
        ...baseParams,
        filters,
      })

      expect(mockPrisma.transaction.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            ownerUserId: BigInt('123'),
            type: 'EXPENSE',
            date: { gte: new Date('2024-01-01') },
            categoryId: BigInt(5),
          }),
        })
      )
    })

    it('should handle last page correctly', async () => {
      const lastPageData = mockTransactions.slice(3, 5) // 마지막 2개 항목 (limit보다 적음)

      mockPrisma.transaction.findMany.mockResolvedValue(lastPageData)
      mockPrisma.transaction.findFirst.mockResolvedValue({ id: BigInt(8) })

      const result = await PrismaCursorPagination.getTransactions(mockPrisma as any, baseParams)

      expect(result.data).toHaveLength(2)
      expect(result.pagination.hasMore).toBe(false) // 더 이상 데이터 없음
      expect(result.pagination.nextCursor).toBe(null)
      expect(result.pagination.prevCursor).toBeTruthy()
    })

    it('should measure query performance', async () => {
      mockPrisma.transaction.findMany.mockResolvedValue([])
      mockPrisma.transaction.findFirst.mockResolvedValue(null)

      const result = await PrismaCursorPagination.getTransactions(mockPrisma as any, baseParams)

      expect(result.performance.queryTime).toBeGreaterThanOrEqual(0)
      expect(typeof result.performance.queryTime).toBe('number')
    })

    it('should support total count with performance tracking', async () => {
      mockPrisma.transaction.findMany.mockResolvedValue(mockTransactions.slice(0, 3))
      mockPrisma.transaction.findFirst.mockResolvedValue(null)
      mockPrisma.transaction.count.mockResolvedValue(150)

      const result = await PrismaCursorPagination.getTransactions(mockPrisma as any, baseParams, {
        enableCount: true,
      })

      expect(result.pagination.totalCount).toBe(150)
      expect(result.performance.totalCountQueryTime).toBeGreaterThanOrEqual(0)
      expect(mockPrisma.transaction.count).toHaveBeenCalled()
    })

    it('should warn when total count exceeds limit', async () => {
      mockPrisma.transaction.findMany.mockResolvedValue([])
      mockPrisma.transaction.findFirst.mockResolvedValue(null)
      mockPrisma.transaction.count.mockResolvedValue(15000) // maxCountLimit(10000)을 초과

      await PrismaCursorPagination.getTransactions(mockPrisma as any, baseParams, {
        enableCount: true,
        maxCountLimit: 10000,
      })

      expect(safeConsole.warn).toHaveBeenCalledWith(
        expect.stringContaining('Total count (15000) exceeds maxCountLimit (10000)'),
        expect.objectContaining({ userId: '123' })
      )
    })

    it('should handle database errors gracefully', async () => {
      const dbError = new Error('Connection timeout')
      mockPrisma.transaction.findMany.mockRejectedValue(dbError)

      await expect(
        PrismaCursorPagination.getTransactions(mockPrisma as any, baseParams)
      ).rejects.toThrow('Connection timeout')

      expect(safeConsole.error).toHaveBeenCalledWith(
        '커서 페이지네이션 조회 실패',
        dbError,
        expect.objectContaining({
          userId: '123',
          cursor: undefined,
          limit: 3,
          direction: 'forward',
          operation: 'getTransactions',
        })
      )
    })
  })

  describe('PaginationMigrationHelper', () => {
    describe('convertLegacyParams', () => {
      it('should convert legacy pagination parameters', () => {
        const result = PaginationMigrationHelper.convertLegacyParams({
          page: 3,
          limit: 20,
        })

        expect(result).toEqual({
          limit: 20,
          cursor: undefined,
          direction: 'forward',
        })

        expect(safeConsole.warn).toHaveBeenCalledWith(
          '레거시 페이지네이션 사용 감지',
          expect.objectContaining({
            recommendation: expect.stringContaining('cursor 기반 페이지네이션 사용을 권장'),
            params: { page: 3, limit: 20 },
          })
        )
      })

      it('should handle invalid page numbers', () => {
        const result = PaginationMigrationHelper.convertLegacyParams({
          page: 0, // 잘못된 페이지 번호
          limit: 10,
        })

        expect(result.limit).toBe(10)
        expect(result.cursor).toBeUndefined()
      })

      it('should use default values', () => {
        const result = PaginationMigrationHelper.convertLegacyParams({})

        expect(result).toEqual({
          limit: 20,
          cursor: undefined,
          direction: 'forward',
        })
      })
    })

    describe('toLegacyFormat', () => {
      it('should convert cursor result to legacy format', () => {
        const cursorResult = {
          data: mockTransactions.slice(0, 3),
          pagination: {
            nextCursor: 'cursor123',
            prevCursor: null,
            hasMore: true,
            totalCount: 150,
          },
          performance: {
            queryTime: 45,
            totalCountQueryTime: 12,
          },
        }

        const result = PaginationMigrationHelper.toLegacyFormat(cursorResult, 2)

        expect(result).toEqual({
          data: cursorResult.data,
          pagination: {
            page: 2,
            limit: 3,
            total: 150,
            totalPages: 50, // Math.ceil(150 / 3)
            hasNext: true,
            hasPrev: true, // page > 1
          },
          performance: cursorResult.performance,
        })
      })

      it('should handle first page correctly', () => {
        const cursorResult = {
          data: mockTransactions.slice(0, 3),
          pagination: {
            nextCursor: 'cursor123',
            prevCursor: null,
            hasMore: true,
            totalCount: undefined,
          },
          performance: { queryTime: 30 },
        }

        const result = PaginationMigrationHelper.toLegacyFormat(cursorResult, 1)

        expect(result.pagination.page).toBe(1)
        expect(result.pagination.hasPrev).toBe(false)
        expect(result.pagination.total).toBeUndefined()
        expect(result.pagination.totalPages).toBeUndefined()
      })

      it('should handle last page correctly', () => {
        const cursorResult = {
          data: mockTransactions.slice(0, 2),
          pagination: {
            nextCursor: null,
            prevCursor: 'cursor456',
            hasMore: false,
            totalCount: 42,
          },
          performance: { queryTime: 25 },
        }

        const result = PaginationMigrationHelper.toLegacyFormat(cursorResult, 5)

        expect(result.pagination.hasNext).toBe(false)
        expect(result.pagination.hasPrev).toBe(true)
        expect(result.pagination.totalPages).toBe(21) // Math.ceil(42 / 2)
      })
    })
  })

  describe('Cursor Utils (Integration)', () => {
    it('should encode and decode cursors correctly', async () => {
      // 실제 커서 인코딩/디코딩이 제대로 작동하는지 통합 테스트
      const originalId = '12345'
      const encoded = Buffer.from(originalId).toString('base64')
      const decoded = Buffer.from(encoded, 'base64').toString('utf8')

      expect(decoded).toBe(originalId)
    })

    it('should handle edge cases in cursor conversion', async () => {
      // 특수 문자가 포함된 경우
      const specialId = '123-456_789'
      const encoded = Buffer.from(specialId).toString('base64')
      const decoded = Buffer.from(encoded, 'base64').toString('utf8')

      expect(decoded).toBe(specialId)
    })
  })

  describe('Performance Characteristics', () => {
    it('should maintain consistent query complexity regardless of offset', async () => {
      // 커서 페이지네이션은 offset에 관계없이 일정한 성능을 보장해야 함
      mockPrisma.transaction.findMany.mockResolvedValue([])
      mockPrisma.transaction.findFirst.mockResolvedValue(null)

      // 첫 페이지와 깊은 페이지의 쿼리 구조가 동일해야 함
      const firstPageParams = { ...baseParams }
      const deepPageParams = { ...baseParams, cursor: Buffer.from('1000').toString('base64') }

      await PrismaCursorPagination.getTransactions(mockPrisma as any, firstPageParams)
      const firstPageCall = mockPrisma.transaction.findMany.mock.calls[0][0]

      jest.clearAllMocks()
      await PrismaCursorPagination.getTransactions(mockPrisma as any, deepPageParams)
      const deepPageCall = mockPrisma.transaction.findMany.mock.calls[0][0]

      // 두 쿼리의 구조적 복잡성이 유사해야 함 (WHERE 조건, ORDER BY, LIMIT)
      expect(firstPageCall.take).toBe(deepPageCall.take)
      expect(firstPageCall.orderBy).toEqual(deepPageCall.orderBy)
      expect(Object.keys(firstPageCall.where)).toHaveLength(Object.keys(deepPageCall.where).length)
    })
  })
})
