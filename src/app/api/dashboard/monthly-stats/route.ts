/**
 * 🚀 최적화된 월별 통계 API
 * 대시보드에 표시할 월별 수입/지출 통계를 제공
 * 성능 개선: 8개 개별 쿼리 → 3개 최적화된 쿼리
 */

import { NextRequest, NextResponse } from 'next/server'
import { verifyAccessToken } from '@/lib/auth'
import { getOptimizedMonthlyStats, type StatsQueryParams } from '@/lib/optimized-stats'
import { safeConsole } from '@/lib/security-utils'

export async function GET(request: NextRequest) {
  const startTime = Date.now()

  try {
    // 인증 확인 - Auth API와 동일한 방식 사용
    const accessToken = request.cookies.get('accessToken')?.value

    if (!accessToken) {
      return NextResponse.json({ error: '인증이 필요합니다' }, { status: 401 })
    }

    const user = verifyAccessToken(accessToken)
    if (!user) {
      return NextResponse.json({ error: '유효하지 않은 토큰입니다' }, { status: 401 })
    }

    // URL 파라미터 파싱
    const { searchParams } = new URL(request.url)
    const year = searchParams.get('year')
      ? parseInt(searchParams.get('year')!)
      : new Date().getFullYear()
    const month = searchParams.get('month')
      ? parseInt(searchParams.get('month')!)
      : new Date().getMonth() + 1
    const groupId = searchParams.get('groupId')

    // 날짜 유효성 검증
    if (year < 2020 || year > 2030 || month < 1 || month > 12) {
      return NextResponse.json({ error: '올바르지 않은 날짜입니다' }, { status: 400 })
    }

    // 그룹 필터 설정
    const groupFilter = groupId ? { groupId } : {}

    // 🚀 최적화된 통계 조회 (8개 쿼리 → 3개 쿼리로 축소)
    const statsParams: StatsQueryParams = {
      userId: user.userId,
      year,
      month,
      groupFilter,
    }

    const optimizedStats = await getOptimizedMonthlyStats(statsParams)

    // 성능 메트릭 계산
    const queryTime = Date.now() - startTime

    // 응답 데이터 구성
    const response = {
      success: true,
      data: {
        // 💰 수입/지출 요약
        totalIncome: optimizedStats.totalIncome,
        totalExpense: optimizedStats.totalExpense,
        netAmount: optimizedStats.totalIncome - optimizedStats.totalExpense,
        transactionCount: optimizedStats.transactionCount,

        // 📊 지출 분석
        expenseBreakdown: {
          myExpense: optimizedStats.myExpense,
          sharedExpense: optimizedStats.sharedExpense,
          partnerExpense: optimizedStats.partnerExpense,
        },

        // 🏷️ 카테고리별 지출 순위 (TOP 5)
        topCategories: optimizedStats.categoryStats.map((category, index) => ({
          rank: index + 1,
          categoryId: category.categoryId,
          categoryName: category.categoryName,
          amount: category.amount,
          percentage:
            optimizedStats.totalExpense > 0
              ? Number(((category.amount / optimizedStats.totalExpense) * 100).toFixed(1))
              : 0,
          color: `hsl(${(index * 60) % 360}, 70%, 50%)`, // 자동 색상 생성
        })),

        // 📈 일별 트렌드
        dailyTrend: optimizedStats.dailyTrend,

        // 📊 추가 분석 지표
        analytics: {
          averageDailyExpense:
            optimizedStats.transactionCount > 0
              ? Number((optimizedStats.totalExpense / optimizedStats.dailyTrend.length).toFixed(0))
              : 0,
          expenseGrowth: 0, // TODO: 전월 대비 증감률 계산 (향후 구현)
          savingsRate:
            optimizedStats.totalIncome > 0
              ? Number(
                  (
                    ((optimizedStats.totalIncome - optimizedStats.totalExpense) /
                      optimizedStats.totalIncome) *
                    100
                  ).toFixed(1)
                )
              : 0,
        },

        // 🕒 메타데이터
        metadata: {
          year,
          month,
          period: `${year}-${String(month).padStart(2, '0')}`,
          queryTime: `${queryTime}ms`,
          optimized: true,
          queriesExecuted: 3, // 최적화 후
          queriesReduced: '8 → 3 (62.5% 감소)',
        },
      },
    }

    // 성공 로깅
    safeConsole.log('월별 통계 조회 성공', {
      userId: user.userId,
      period: `${year}-${month}`,
      queryTime,
      categoriesFound: optimizedStats.categoryStats.length,
      transactionCount: optimizedStats.transactionCount,
      performance: 'optimized',
    })

    return NextResponse.json(response)
  } catch (error) {
    const queryTime = Date.now() - startTime

    safeConsole.error('월별 통계 조회 실패', error, {
      endpoint: '/api/dashboard/monthly-stats',
      queryTime,
      method: 'GET',
    })

    return NextResponse.json(
      {
        error: '월별 통계 조회 중 오류가 발생했습니다',
        code: 'INTERNAL_ERROR',
        queryTime: `${queryTime}ms`,
      },
      { status: 500 }
    )
  }
}

/**
 * 🔧 성능 최적화 정보
 *
 * 개선 전 (8개 개별 쿼리):
 * - 총 수입 집계: aggregate
 * - 총 지출 집계: aggregate
 * - 거래 건수: count
 * - 내 지출: aggregate
 * - 공유 지출: aggregate
 * - 배우자 지출: aggregate
 * - 카테고리별 통계: groupBy
 * - 일별 트렌드: groupBy
 *
 * 개선 후 (3개 최적화된 쿼리):
 * - 통합 집계 쿼리: 1개 Union SQL (6가지 메트릭 동시 계산)
 * - 카테고리별 통계: 1개 JOIN 쿼리
 * - 일별 트렌드: 1개 GROUP BY 쿼리
 *
 * 성능 향상:
 * - 쿼리 수: 62.5% 감소 (8개 → 3개)
 * - DB 왕복: 최대 75% 감소
 * - 예상 응답 시간: 300-500ms → 100-200ms
 */
