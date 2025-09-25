/**
 * React Query Provider
 */

'use client'

import React, { useState } from 'react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'

interface QueryProviderProps {
  children: React.ReactNode
}

export function QueryProvider({ children }: QueryProviderProps) {
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            // 5분 동안 캐시 유지
            staleTime: 5 * 60 * 1000,
            // 환율 정보는 자주 변하지 않으므로 10분 동안 캐시
            gcTime: 10 * 60 * 1000,
            // 자동 재시도 비활성화
            retry: 0,
            // 재시도 간격 (지수 백오프)
            retryDelay: attemptIndex => Math.min(1000 * 2 ** attemptIndex, 30000),
            // 네트워크 에러나 서버 에러만 재시도
            retryOnMount: true,
            // 자동 재호출 모두 비활성화
            refetchOnWindowFocus: false,
            refetchOnMount: false,
            refetchOnReconnect: false,
          },
          mutations: {
            retry: 0,
          },
        },
      })
  )

  return (
    <QueryClientProvider client={queryClient}>
      {children}
    </QueryClientProvider>
  )
}
