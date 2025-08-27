import useSWR, { mutate } from 'swr'
import { CACHE_KEYS, CACHE_INVALIDATION_PATTERNS } from '@/lib/swr-config'

interface Transaction {
  id: string
  amount: number
  description: string
  category: string
  date: string
  type: 'INCOME' | 'EXPENSE'
  currency: string
  ownerType: 'USER' | 'GROUP'
  ownerId: string
}

interface TransactionListResponse {
  transactions: Transaction[]
  total: number
  page: number
  limit: number
  hasMore: boolean
}

interface UseTransactionsOptions {
  page?: number
  limit?: number
  refreshInterval?: number
  revalidateOnFocus?: boolean
}

export function useTransactions(
  ownerType: 'USER' | 'GROUP',
  ownerId: string,
  options: UseTransactionsOptions = {}
) {
  const { page = 1, limit = 20, ...swrOptions } = options
  const cacheKey = CACHE_KEYS.TRANSACTIONS(ownerType, ownerId, page, limit)

  const {
    data,
    error,
    isLoading,
    isValidating,
    mutate: mutateSingle,
  } = useSWR<TransactionListResponse>(ownerId ? cacheKey : null, {
    // 거래 내역은 실시간성이 중요하므로 포커스 시 재검증
    revalidateOnFocus: true,

    // 거래 데이터는 빈번히 변경되므로 오래된 데이터 즉시 재검증
    revalidateIfStale: true,

    // 페이지네이션된 데이터는 에러 시 재시도
    shouldRetryOnError: true,
    errorRetryCount: 2,

    ...swrOptions,
  })

  // 새 거래 추가 후 캐시 무효화
  const invalidateAfterTransaction = async () => {
    const keys = CACHE_INVALIDATION_PATTERNS.TRANSACTION_CHANGE(ownerType, ownerId)
    await Promise.all(keys.map(key => mutate(key)))
  }

  // 낙관적 업데이트 - 새 거래 추가
  const optimisticAddTransaction = async (newTransaction: Omit<Transaction, 'id'>) => {
    if (!data) return

    const optimisticTransaction: Transaction = {
      ...newTransaction,
      id: `temp-${Date.now()}`, // 임시 ID
    }

    const optimisticData: TransactionListResponse = {
      ...data,
      transactions: [optimisticTransaction, ...data.transactions],
      total: data.total + 1,
    }

    // 즉시 UI 업데이트
    await mutateSingle(optimisticData, false)

    // 서버 동기화 (1초 후)
    setTimeout(() => {
      invalidateAfterTransaction()
    }, 1000)
  }

  // 낙관적 업데이트 - 거래 삭제
  const optimisticDeleteTransaction = async (transactionId: string) => {
    if (!data) return

    const optimisticData: TransactionListResponse = {
      ...data,
      transactions: data.transactions.filter(t => t.id !== transactionId),
      total: data.total - 1,
    }

    // 즉시 UI 업데이트
    await mutateSingle(optimisticData, false)

    // 서버 동기화
    setTimeout(() => {
      invalidateAfterTransaction()
    }, 1000)
  }

  return {
    // 데이터
    transactions: data?.transactions || [],
    total: data?.total || 0,
    hasMore: data?.hasMore || false,
    currentPage: page,

    // 상태
    isLoading,
    isValidating,
    error,

    // 액션
    refresh: mutateSingle,
    invalidateAfterTransaction,
    optimisticAddTransaction,
    optimisticDeleteTransaction,

    // 유틸리티
    isEmpty: data ? data.transactions.length === 0 : null,
    totalIncome: data
      ? data.transactions.filter(t => t.type === 'INCOME').reduce((sum, t) => sum + t.amount, 0)
      : 0,
    totalExpense: data
      ? data.transactions.filter(t => t.type === 'EXPENSE').reduce((sum, t) => sum + t.amount, 0)
      : 0,
  }
}

// 최근 거래 조회용 훅 (대시보드용)
export function useRecentTransactions(
  ownerType: 'USER' | 'GROUP',
  ownerId: string,
  limit: number = 5
) {
  return useTransactions(ownerType, ownerId, {
    page: 1,
    limit,
    refreshInterval: 30000, // 30초마다 자동 새로고침
  })
}
