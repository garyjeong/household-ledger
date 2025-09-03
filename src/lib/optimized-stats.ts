/**
 * 최적화된 통계 조회 서비스
 * N+1 쿼리 문제 해결을 위한 통합 쿼리 시스템
 */

import { prisma } from './prisma'
import { safeConsole } from './security-utils'

export interface OptimizedMonthlyStats {
  totalIncome: number
  totalExpense: number
  transactionCount: number
  myExpense: number
  sharedExpense: number
  partnerExpense: number
  categoryStats: Array<{
    categoryId: string | null
    categoryName: string
    amount: number
  }>
  dailyTrend: Array<{
    date: string
    income: number
    expense: number
  }>
}

export interface StatsQueryParams {
  userId: string
  year: number
  month: number
  groupFilter: any
}

/**
 * 최적화된 월별 통계 조회
 * 8개 개별 쿼리 → 2개 최적화된 쿼리로 축소
 */
export async function getOptimizedMonthlyStats(
  params: StatsQueryParams
): Promise<OptimizedMonthlyStats> {
  const { userId, year, month, groupFilter } = params

  // 월 시작/끝 날짜 계산
  const startDate = new Date(year, month - 1, 1)
  const endDate = new Date(year, month, 0, 23, 59, 59)
  const userIdInt = parseInt(userId)

  try {
    // 🚀 최적화 1: 모든 집계를 단일 Raw SQL로 처리
    const groupCondition = groupFilter.groupId ? `AND groupId = ${groupFilter.groupId}` : ''

    const aggregateResults = await prisma.$queryRaw<
      Array<{
        metric_type: string
        total_amount: bigint | null
        count_value: bigint | null
      }>
    >`
      SELECT 
        'total_income' as metric_type,
        SUM(CASE WHEN type = 'INCOME' THEN amount ELSE 0 END) as total_amount,
        COUNT(CASE WHEN type = 'INCOME' THEN 1 END) as count_value
      FROM transactions 
      WHERE date >= ${startDate} 
        AND date <= ${endDate}
        ${groupCondition}
        
      UNION ALL
      
      SELECT 
        'total_expense' as metric_type,
        ABS(SUM(CASE WHEN type = 'EXPENSE' THEN amount ELSE 0 END)) as total_amount,
        COUNT(CASE WHEN type = 'EXPENSE' THEN 1 END) as count_value
      FROM transactions 
      WHERE date >= ${startDate} 
        AND date <= ${endDate}
        ${groupCondition}
        
      UNION ALL
      
      SELECT 
        'my_expense' as metric_type,
        ABS(SUM(CASE WHEN type = 'EXPENSE' AND ownerUserId = ${userIdInt} THEN amount ELSE 0 END)) as total_amount,
        COUNT(CASE WHEN type = 'EXPENSE' AND ownerUserId = ${userIdInt} THEN 1 END) as count_value
      FROM transactions 
      WHERE date >= ${startDate} 
        AND date <= ${endDate}
        ${groupCondition}
        
      UNION ALL
      
      SELECT 
        'shared_expense' as metric_type,
        ABS(SUM(CASE WHEN type = 'EXPENSE' AND groupId IS NOT NULL THEN amount ELSE 0 END)) as total_amount,
        COUNT(CASE WHEN type = 'EXPENSE' AND groupId IS NOT NULL THEN 1 END) as count_value
      FROM transactions 
      WHERE date >= ${startDate} 
        AND date <= ${endDate}
        ${groupCondition}
        
      UNION ALL
      
      SELECT 
        'partner_expense' as metric_type,
        ABS(SUM(CASE WHEN type = 'EXPENSE' AND ownerUserId != ${userIdInt} AND groupId IS NULL THEN amount ELSE 0 END)) as total_amount,
        COUNT(CASE WHEN type = 'EXPENSE' AND ownerUserId != ${userIdInt} AND groupId IS NULL THEN 1 END) as count_value
      FROM transactions 
      WHERE date >= ${startDate} 
        AND date <= ${endDate}
        ${groupCondition}
        
      UNION ALL
      
      SELECT 
        'total_count' as metric_type,
        0 as total_amount,
        COUNT(*) as count_value
      FROM transactions 
      WHERE date >= ${startDate} 
        AND date <= ${endDate}
        ${groupCondition}
    `

    // 🚀 최적화 2: 카테고리별 통계와 일별 트렌드를 병렬로 조회
    const [categoryResults, dailyResults] = await Promise.all([
      // 카테고리별 지출 통계 (TOP 5)
      prisma.$queryRaw<
        Array<{
          categoryId: bigint | null
          categoryName: string | null
          total_amount: bigint
        }>
      >`
        SELECT 
          t.categoryId,
          c.name as categoryName,
          ABS(SUM(t.amount)) as total_amount
        FROM transactions t
        LEFT JOIN categories c ON t.categoryId = c.id
        WHERE t.date >= ${startDate}
          AND t.date <= ${endDate}
          AND t.type = 'EXPENSE'
          ${groupCondition}
        GROUP BY t.categoryId, c.name
        ORDER BY total_amount DESC
        LIMIT 5
      `,

      // 일별 트렌드 데이터
      prisma.$queryRaw<
        Array<{
          transaction_date: Date
          daily_income: bigint
          daily_expense: bigint
        }>
      >`
        SELECT 
          DATE(date) as transaction_date,
          SUM(CASE WHEN type = 'INCOME' THEN amount ELSE 0 END) as daily_income,
          ABS(SUM(CASE WHEN type = 'EXPENSE' THEN amount ELSE 0 END)) as daily_expense
        FROM transactions
        WHERE date >= ${startDate}
          AND date <= ${endDate}
          ${groupCondition}
        GROUP BY DATE(date)
        ORDER BY transaction_date ASC
      `,
    ])

    // 📊 결과 데이터 가공
    const statsMap = new Map<string, { amount: number; count: number }>()

    aggregateResults.forEach(row => {
      statsMap.set(row.metric_type, {
        amount: Number(row.total_amount || 0),
        count: Number(row.count_value || 0),
      })
    })

    // 카테고리 통계 변환
    const categoryStats = categoryResults.map(row => ({
      categoryId: row.categoryId ? row.categoryId.toString() : null,
      categoryName: row.categoryName || '미분류',
      amount: Number(row.total_amount),
    }))

    // 일별 트렌드 변환
    const dailyTrend = dailyResults.map(row => ({
      date: row.transaction_date.toISOString().split('T')[0],
      income: Number(row.daily_income),
      expense: Number(row.daily_expense),
    }))

    const result: OptimizedMonthlyStats = {
      totalIncome: statsMap.get('total_income')?.amount || 0,
      totalExpense: statsMap.get('total_expense')?.amount || 0,
      transactionCount: statsMap.get('total_count')?.count || 0,
      myExpense: statsMap.get('my_expense')?.amount || 0,
      sharedExpense: statsMap.get('shared_expense')?.amount || 0,
      partnerExpense: statsMap.get('partner_expense')?.amount || 0,
      categoryStats,
      dailyTrend,
    }

    // 성능 로깅
    safeConsole.log('최적화된 월별 통계 조회 완료', {
      userId,
      month: `${year}-${month}`,
      queryCount: 3, // 기존 8개 → 3개로 축소 (1개 Union + 2개 병렬)
      categoriesFound: categoryStats.length,
      daysWithData: dailyTrend.length,
    })

    return result
  } catch (error) {
    safeConsole.error('최적화된 월별 통계 조회 실패', error, {
      userId,
      year,
      month,
      operation: 'getOptimizedMonthlyStats',
    })

    // 실패 시 빈 결과 반환
    return {
      totalIncome: 0,
      totalExpense: 0,
      transactionCount: 0,
      myExpense: 0,
      sharedExpense: 0,
      partnerExpense: 0,
      categoryStats: [],
      dailyTrend: [],
    }
  }
}

/**
 * 캐시된 통계 조회 (향후 Redis 적용 시 사용)
 */
export async function getCachedMonthlyStats(
  params: StatsQueryParams
): Promise<OptimizedMonthlyStats> {
  // TODO: Redis 캐싱 로직 추가
  // 현재는 직접 조회
  return getOptimizedMonthlyStats(params)
}

/**
 * 통계 성능 메트릭 수집
 */
export interface StatsPerformanceMetrics {
  queryTime: number
  queryCount: number
  dataPoints: number
  cacheHit: boolean
}

export async function getStatsPerformanceMetrics(
  params: StatsQueryParams
): Promise<StatsPerformanceMetrics> {
  const startTime = Date.now()

  const stats = await getOptimizedMonthlyStats(params)

  const queryTime = Date.now() - startTime

  return {
    queryTime,
    queryCount: 3, // 최적화 후 쿼리 개수
    dataPoints: stats.categoryStats.length + stats.dailyTrend.length,
    cacheHit: false, // Redis 구현 시 true/false
  }
}
