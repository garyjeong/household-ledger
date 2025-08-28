/**
 * React Query Provider
 */

'use client'

import React, { useState } from 'react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { ReactQueryDevtools } from '@tanstack/react-query-devtools'

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
  )

  return (
    <QueryClientProvider client={queryClient}>
      {children}
      {/* 개발 환경에서만 DevTools 표시 */}
      {process.env.NODE_ENV === 'development' && (
        <ReactQueryDevtools initialIsOpen={false} buttonPosition='bottom-right' />
      )}
    </QueryClientProvider>
  )
}
