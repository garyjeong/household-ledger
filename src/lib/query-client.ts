/**
 * React Query Client Configuration
 */

import { QueryClient } from '@tanstack/react-query'

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      // 5분 동안 캐시 유지
      staleTime: 5 * 60 * 1000,
      // 환율 정보는 자주 변하지 않으므로 10분 동안 캐시
      gcTime: 10 * 60 * 1000,
      // 에러 시 3회 재시도
      retry: 3,
      // 재시도 간격 (지수 백오프)
      retryDelay: attemptIndex => Math.min(1000 * 2 ** attemptIndex, 30000),
      // 네트워크 에러나 서버 에러만 재시도
      retryOnMount: true,
      // 백그라운드에서 자동 새로고침 비활성화 (환율은 실시간성이 중요하지 않음)
      refetchOnWindowFocus: false,
      refetchOnMount: false,
      refetchOnReconnect: true,
    },
    mutations: {
      retry: 1,
      retryDelay: 1000,
    },
  },
})

// Query Keys for consistent caching
export const queryKeys = {
  // 환율 관련
  exchangeRates: (baseCurrency = 'KRW') => ['exchange-rates', baseCurrency] as const,
  currencyPair: (from: string, to: string) => ['currency-pair', from, to] as const,

  // 거래 관련
  transactions: (filters?: Record<string, any>) => ['transactions', filters] as const,
  transaction: (id: string) => ['transaction', id] as const,

  // 카테고리 관련
  categories: (groupId?: string) => ['categories', groupId] as const,

  // 그룹 관련
  groups: () => ['groups'] as const,
  group: (id: string) => ['group', id] as const,
} as const
