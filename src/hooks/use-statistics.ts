/**
 * 통계 관련 React Query hooks
 * T-024: 월별 통계 페이지 구현
 */

'use client'

import { useQuery } from '@tanstack/react-query'
import { useGroup } from '@/contexts/group-context'

// 통계 데이터 타입 정의
export interface CategoryStatistics {
  categoryId: string
  categoryName: string
  totalAmount: number
  transactionCount: number
  percentage: number
  color: string
}

export interface MonthlyComparison {
  period: string
  totalIncome: number
  totalExpense: number
  netAmount: number
}

export interface DailyTrend {
  date: string
  income: number
  expense: number
  netAmount: number
}

export interface StatisticsData {
  period: string
  dateRange: {
    startDate: string
    endDate: string
  }
  summary: {
    totalIncome: number
    totalExpense: number
    netAmount: number
    transactionCount: number
  }
  categoryBreakdown: {
    income: CategoryStatistics[]
    expense: CategoryStatistics[]
  }
  monthlyComparison: MonthlyComparison[]
  dailyTrend: DailyTrend[]
}

export interface StatisticsFilters {
  period?: 'current-month' | 'last-month' | 'last-3-months' | 'last-6-months' | 'year'
  startDate?: string
  endDate?: string
  groupId?: string
}

/**
 * 통계 데이터 조회 hook
 */
export function useStatistics(filters: StatisticsFilters = {}) {
  const { currentGroup } = useGroup()

  return useQuery({
    queryKey: ['statistics', filters],
    queryFn: async (): Promise<StatisticsData> => {
      const params = new URLSearchParams()

      if (filters.period) params.set('period', filters.period)
      if (filters.startDate) params.set('startDate', filters.startDate)
      if (filters.endDate) params.set('endDate', filters.endDate)
      if (filters.groupId) params.set('groupId', filters.groupId)

      // 기본적으로 현재 그룹 사용
      if (!filters.groupId && currentGroup) {
        params.set('groupId', currentGroup.id)
      }

      const response = await fetch(`/api/statistics?${params}`, {
        credentials: 'include',
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Failed to fetch statistics')
      }

      const data = await response.json()
      return data.data
    },
    enabled: true,
    staleTime: 5 * 60 * 1000, // 5분간 캐시 유지
    gcTime: 10 * 60 * 1000, // 10분간 가비지 컬렉션 방지
  })
}

/**
 * 현재 월 통계 hook
 */
export function useCurrentMonthStatistics() {
  return useStatistics({ period: 'current-month' })
}

/**
 * 지난 월 통계 hook
 */
export function useLastMonthStatistics() {
  return useStatistics({ period: 'last-month' })
}

/**
 * 최근 3개월 통계 hook
 */
export function useLast3MonthsStatistics() {
  return useStatistics({ period: 'last-3-months' })
}

/**
 * 최근 6개월 통계 hook
 */
export function useLast6MonthsStatistics() {
  return useStatistics({ period: 'last-6-months' })
}

/**
 * 연간 통계 hook
 */
export function useYearStatistics() {
  return useStatistics({ period: 'year' })
}

/**
 * 커스텀 기간 통계 hook
 */
export function useCustomPeriodStatistics(startDate: string, endDate: string) {
  return useStatistics({
    startDate,
    endDate,
    // 커스텀 기간일 때는 period를 설정하지 않음
  })
}

/**
 * 그룹별 통계 hook
 */
export function useGroupStatistics(groupId: string, period?: string) {
  return useStatistics({
    groupId,
    period: (period as StatisticsFilters['period']) || 'current-month',
  })
}
