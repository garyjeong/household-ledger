import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { apiGet, apiPost } from '@/lib/api-client'
import { queryKeys } from '@/lib/query-client'

interface BalanceData {
  totalBalance: number
  monthlyIncome: number
  monthlyExpense: number
  projectedBalance?: number
  currency: string
}

interface UseBalanceOptions {
  // 자동 새로고침 간격 (밀리초, 0이면 비활성화)
  refreshInterval?: number
  // 포커스 시 재검증 여부
  revalidateOnFocus?: boolean
  // 에러 시 재시도 여부
  retry?: boolean
}

export function useBalance(
  ownerType: 'USER' | 'GROUP',
  ownerId: string,
  options: UseBalanceOptions = {}
) {
  const queryClient = useQueryClient()

  const balanceQuery = useQuery({
    queryKey: ['balance', ownerType, ownerId],
    queryFn: async (): Promise<BalanceData> => {
      const params = new URLSearchParams({
        ownerType,
        ownerId,
      })

      const response = await apiGet(`/api/balance?${params}`)

      if (!response.ok) {
        throw new Error(response.error || 'Failed to fetch balance')
      }

      return response.data
    },
    enabled: !!ownerId,
    staleTime: 30 * 1000, // 30초간 fresh
    gcTime: 5 * 60 * 1000, // 5분간 캐시 유지
    refetchInterval:
      options.refreshInterval && options.refreshInterval > 0 ? options.refreshInterval : undefined,
    refetchOnWindowFocus: false,
    retry: 0,
    retryDelay: 2000,
  })

  // 잔액 새로고침
  const refreshBalance = async () => {
    await balanceQuery.refetch()
  }

  // 관련 캐시 무효화 (거래 추가/수정 후 호출)
  const invalidateRelatedCache = async () => {
    await Promise.all([
      queryClient.invalidateQueries({ queryKey: ['balance', ownerType, ownerId] }),
      queryClient.invalidateQueries({ queryKey: ['transactions'] }),
    ])
  }

  // 낙관적 업데이트 (거래 추가 시 즉시 잔액 반영)
  const optimisticUpdate = async (balanceChange: number) => {
    if (!balanceQuery.data) return

    const optimisticData: BalanceData = {
      ...balanceQuery.data,
      totalBalance: balanceQuery.data.totalBalance + balanceChange,
    }

    // 즉시 UI 업데이트 (서버 검증 없이)
    queryClient.setQueryData(['balance', ownerType, ownerId], optimisticData)

    // 서버 동기화
    setTimeout(() => {
      balanceQuery.refetch()
    }, 1000)
  }

  return {
    // 데이터
    balance: balanceQuery.data,

    // 상태
    isLoading: balanceQuery.isLoading,
    isValidating: balanceQuery.isFetching,
    error: balanceQuery.error,

    // 액션
    refreshBalance,
    invalidateRelatedCache,
    optimisticUpdate,

    // 유틸리티
    isPositive: balanceQuery.data ? balanceQuery.data.totalBalance >= 0 : null,
    formattedBalance: balanceQuery.data
      ? new Intl.NumberFormat('ko-KR', {
          style: 'currency',
          currency: balanceQuery.data.currency || 'KRW',
        }).format(balanceQuery.data.totalBalance)
      : null,
  }
}
