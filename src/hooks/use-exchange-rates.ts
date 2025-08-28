/**
 * Exchange Rates Hooks
 * React Query를 사용한 환율 정보 관리
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import {
  fetchExchangeRates,
  fetchCurrencyPair,
  convertAmount,
  CurrencyApiError,
  type ExchangeRate,
} from '@/lib/currency-api'
import { queryKeys } from '@/lib/query-client'

/**
 * 환율 정보 조회 hook
 */
export function useExchangeRates(baseCurrency = 'KRW') {
  return useQuery({
    queryKey: queryKeys.exchangeRates(baseCurrency),
    queryFn: () => fetchExchangeRates(baseCurrency),
    staleTime: 15 * 60 * 1000, // 15분 동안 fresh 상태 유지
    gcTime: 30 * 60 * 1000, // 30분 동안 캐시 유지
    retry: (failureCount, error) => {
      // API 한도 초과나 서버 에러는 재시도하지 않음
      if (error instanceof CurrencyApiError && error.status === 429) {
        return false
      }
      return failureCount < 3
    },
    retryDelay: attemptIndex => Math.min(1000 * 2 ** attemptIndex, 10000),
  })
}

/**
 * 특정 통화쌍 환율 조회 hook
 */
export function useCurrencyPair(from: string, to: string, enabled = true) {
  return useQuery({
    queryKey: queryKeys.currencyPair(from, to),
    queryFn: () => fetchCurrencyPair(from, to),
    enabled: enabled && from !== to && !!from && !!to,
    staleTime: 10 * 60 * 1000, // 10분
    gcTime: 20 * 60 * 1000, // 20분
  })
}

/**
 * 환율 새로고침 mutation
 */
export function useRefreshExchangeRates() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (baseCurrency = 'KRW') => {
      const data = await fetchExchangeRates(baseCurrency)
      return data
    },
    onSuccess: (data, baseCurrency) => {
      // 캐시 업데이트
      queryClient.setQueryData(queryKeys.exchangeRates(baseCurrency), data)

      // 관련 쿼리들도 invalidate
      queryClient.invalidateQueries({
        queryKey: ['currency-pair'],
      })
    },
    onError: error => {
      console.error('Failed to refresh exchange rates:', error)
    },
  })
}

/**
 * 환율 계산 hook
 */
export function useCurrencyConverter(baseCurrency = 'KRW') {
  const { data: rates, isLoading, error } = useExchangeRates(baseCurrency)

  const convert = (amount: number, fromCurrency: string, toCurrency: string): number | null => {
    if (!rates || !rates.rates) return null

    try {
      return convertAmount(amount, fromCurrency, toCurrency, rates.rates, baseCurrency)
    } catch (error) {
      console.error('Currency conversion error:', error)
      return null
    }
  }

  const getRate = (currency: string): number | null => {
    if (!rates || !rates.rates) return null
    return rates.rates[currency] || null
  }

  return {
    convert,
    getRate,
    rates: rates?.rates || {},
    lastUpdated: rates?.date,
    isLoading,
    error,
  }
}

/**
 * 실시간 환율 업데이트 hook
 * 브라우저 포커스 시 자동으로 환율 업데이트
 */
export function useAutoRefreshRates(baseCurrency = 'KRW', interval?: number) {
  const queryClient = useQueryClient()

  // 브라우저 포커스 시 환율 업데이트
  React.useEffect(() => {
    const handleFocus = () => {
      queryClient.invalidateQueries({
        queryKey: queryKeys.exchangeRates(baseCurrency),
      })
    }

    const handleVisibilityChange = () => {
      if (!document.hidden) {
        queryClient.invalidateQueries({
          queryKey: queryKeys.exchangeRates(baseCurrency),
        })
      }
    }

    window.addEventListener('focus', handleFocus)
    document.addEventListener('visibilitychange', handleVisibilityChange)

    return () => {
      window.removeEventListener('focus', handleFocus)
      document.removeEventListener('visibilitychange', handleVisibilityChange)
    }
  }, [queryClient, baseCurrency])

  // 선택적 인터벌 업데이트 (예: 30분마다)
  React.useEffect(() => {
    if (!interval) return

    const intervalId = setInterval(() => {
      queryClient.invalidateQueries({
        queryKey: queryKeys.exchangeRates(baseCurrency),
      })
    }, interval)

    return () => clearInterval(intervalId)
  }, [queryClient, baseCurrency, interval])
}

/**
 * 오프라인 상태 감지 및 환율 캐시 관리
 */
export function useOfflineExchangeRates(baseCurrency = 'KRW') {
  const [isOnline, setIsOnline] = React.useState(navigator.onLine)
  const { data, isLoading, error, refetch } = useExchangeRates(baseCurrency)

  React.useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true)
      // 온라인 복구 시 환율 정보 새로고침
      refetch()
    }

    const handleOffline = () => {
      setIsOnline(false)
    }

    window.addEventListener('online', handleOnline)
    window.addEventListener('offline', handleOffline)

    return () => {
      window.removeEventListener('online', handleOnline)
      window.removeEventListener('offline', handleOffline)
    }
  }, [refetch])

  return {
    rates: data,
    isLoading,
    error,
    isOnline,
    isCacheData: !isOnline && !!data, // 오프라인이지만 캐시 데이터가 있는 경우
  }
}

import React from 'react'
