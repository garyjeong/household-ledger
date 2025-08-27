import useSWR, { mutate } from 'swr'
import { CACHE_KEYS, CACHE_INVALIDATION_PATTERNS } from '@/lib/swr-config'

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
  shouldRetryOnError?: boolean
}

export function useBalance(
  ownerType: 'USER' | 'GROUP',
  ownerId: string,
  options: UseBalanceOptions = {}
) {
  const cacheKey = CACHE_KEYS.BALANCE(ownerType, ownerId)

  const {
    data,
    error,
    isLoading,
    isValidating,
    mutate: mutateSingle,
  } = useSWR<BalanceData>(
    // ownerId가 있을 때만 요청
    ownerId ? cacheKey : null,
    {
      // 기본 설정 오버라이드
      refreshInterval: options.refreshInterval,
      revalidateOnFocus: options.revalidateOnFocus,
      shouldRetryOnError: options.shouldRetryOnError,

      // 잔액 데이터는 실시간성이 중요하므로 오래된 데이터도 표시
      revalidateIfStale: true,

      // 잔액 조회 실패 시 재시도
      errorRetryCount: 2,
      errorRetryInterval: 2000,
    }
  )

  // 잔액 새로고침
  const refreshBalance = async () => {
    await mutateSingle()
  }

  // 관련 캐시 무효화 (거래 추가/수정 후 호출)
  const invalidateRelatedCache = async () => {
    const keys = CACHE_INVALIDATION_PATTERNS.BALANCE_UPDATE(ownerType, ownerId)
    await Promise.all(keys.map(key => mutate(key)))
  }

  // 낙관적 업데이트 (거래 추가 시 즉시 잔액 반영)
  const optimisticUpdate = async (balanceChange: number) => {
    if (!data) return

    const optimisticData: BalanceData = {
      ...data,
      totalBalance: data.totalBalance + balanceChange,
    }

    // 즉시 UI 업데이트
    await mutateSingle(optimisticData, false)

    // 서버 동기화
    setTimeout(() => {
      mutateSingle()
    }, 1000)
  }

  return {
    // 데이터
    balance: data,

    // 상태
    isLoading,
    isValidating,
    error,

    // 액션
    refreshBalance,
    invalidateRelatedCache,
    optimisticUpdate,

    // 유틸리티
    isPositive: data ? data.totalBalance >= 0 : null,
    formattedBalance: data
      ? new Intl.NumberFormat('ko-KR', {
          style: 'currency',
          currency: data.currency || 'KRW',
        }).format(data.totalBalance)
      : null,
  }
}
