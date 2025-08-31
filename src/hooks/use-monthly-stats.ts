'use client'

import { useQuery, useQueryClient } from '@tanstack/react-query'
import { MonthlyStats } from '@/types/couple-ledger'
import { useGroup } from '@/contexts/group-context'

interface UseMonthlyStatsOptions {
  period: string // YYYY-MM 형식
  refetchInterval?: number
}

interface MonthlyStatsResponse {
  success: boolean
  data: MonthlyStats
  error?: string
}

// 월별 통계 데이터 조회
export function useMonthlyStats({ period, refetchInterval = 30000 }: UseMonthlyStatsOptions) {
  const { currentGroup } = useGroup()

  return useQuery({
    queryKey: ['monthly-stats', period, currentGroup?.id],
    queryFn: async (): Promise<MonthlyStats> => {
      const params = new URLSearchParams({
        period,
      })

      if (currentGroup?.id) {
        params.append('groupId', currentGroup.id)
      }

      const response = await fetch(`/api/dashboard/monthly-stats?${params}`, {
        credentials: 'include',
      })

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }

      const result: MonthlyStatsResponse = await response.json()

      if (!result.success || !result.data) {
        throw new Error(result.error || 'Failed to fetch monthly stats')
      }

      return result.data
    },
    enabled: true,
    staleTime: 5 * 60 * 1000, // 5분간 fresh 상태 유지
    gcTime: 10 * 60 * 1000, // 10분간 캐시 유지
    refetchInterval, // 30초마다 자동 갱신 (실시간 업데이트)
    refetchIntervalInBackground: false,
    refetchOnWindowFocus: true,
    refetchOnMount: true,
    retry: 3,
    retryDelay: attemptIndex => Math.min(1000 * 2 ** attemptIndex, 30000),
  })
}

// 월별 통계 갱신
export function useRefreshMonthlyStats() {
  const queryClient = useQueryClient()

  return (period?: string, groupId?: string) => {
    if (period && groupId) {
      // 특정 기간과 그룹의 통계만 갱신
      queryClient.invalidateQueries({
        queryKey: ['monthly-stats', period, groupId],
      })
    } else {
      // 모든 월별 통계 갱신
      queryClient.invalidateQueries({
        queryKey: ['monthly-stats'],
      })
    }
  }
}

// 통계 데이터 미리 로드 (이전/다음 달)
export function usePrefetchMonthlyStats() {
  const queryClient = useQueryClient()
  const { currentGroup } = useGroup()

  return (currentPeriod: string) => {
    const [year, month] = currentPeriod.split('-').map(Number)

    // 이전 달
    const prevDate = new Date(year, month - 2)
    const prevPeriod = `${prevDate.getFullYear()}-${String(prevDate.getMonth() + 1).padStart(2, '0')}`

    // 다음 달
    const nextDate = new Date(year, month)
    const nextPeriod = `${nextDate.getFullYear()}-${String(nextDate.getMonth() + 1).padStart(2, '0')}`

    // 이전 달 데이터 미리 로드
    queryClient.prefetchQuery({
      queryKey: ['monthly-stats', prevPeriod, currentGroup?.id],
      queryFn: async (): Promise<MonthlyStats> => {
        const params = new URLSearchParams({ period: prevPeriod })
        if (currentGroup?.id) {
          params.append('groupId', currentGroup.id)
        }

        const response = await fetch(`/api/dashboard/monthly-stats?${params}`, {
          credentials: 'include',
        })

        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`)
        }

        const result: MonthlyStatsResponse = await response.json()

        if (!result.success || !result.data) {
          throw new Error(result.error || 'Failed to fetch monthly stats')
        }

        return result.data
      },
      staleTime: 5 * 60 * 1000,
    })

    // 다음 달 데이터 미리 로드 (현재 날짜 이후인 경우만)
    const now = new Date()
    const nextDateTime = new Date(year, month)

    if (nextDateTime <= now) {
      queryClient.prefetchQuery({
        queryKey: ['monthly-stats', nextPeriod, currentGroup?.id],
        queryFn: async (): Promise<MonthlyStats> => {
          const params = new URLSearchParams({ period: nextPeriod })
          if (currentGroup?.id) {
            params.append('groupId', currentGroup.id)
          }

          const response = await fetch(`/api/dashboard/monthly-stats?${params}`, {
            credentials: 'include',
          })

          if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`)
          }

          const result: MonthlyStatsResponse = await response.json()

          if (!result.success || !result.data) {
            throw new Error(result.error || 'Failed to fetch monthly stats')
          }

          return result.data
        },
        staleTime: 5 * 60 * 1000,
      })
    }
  }
}
