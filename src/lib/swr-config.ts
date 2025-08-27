import { SWRConfiguration } from 'swr'
import { apiGet } from './api-client'

// SWR fetcher 함수
export const fetcher = async (url: string) => {
  const response = await apiGet(url)
  return response.data
}

// SWR 전역 설정
export const swrConfig: SWRConfiguration = {
  fetcher,

  // 캐시 설정
  dedupingInterval: 2000, // 2초 내 중복 요청 방지
  focusThrottleInterval: 5000, // 5초 내 포커스 시 재검증 방지

  // 재검증 설정
  revalidateOnFocus: true, // 포커스 시 재검증
  revalidateOnReconnect: true, // 재연결 시 재검증
  revalidateIfStale: true, // 오래된 데이터 재검증

  // 오류 처리
  shouldRetryOnError: true, // 오류 시 재시도
  errorRetryCount: 3, // 최대 3회 재시도
  errorRetryInterval: 1000, // 1초 간격으로 재시도

  // 성능 최적화
  refreshInterval: 0, // 자동 새로고침 비활성화 (필요시 개별 설정)
  refreshWhenHidden: false, // 화면이 숨겨진 상태에서는 새로고침 안함
  refreshWhenOffline: false, // 오프라인 상태에서는 새로고침 안함

  // 로딩 최적화
  loadingTimeout: 3000, // 3초 후 로딩 타임아웃

  // 캐시 제공자 (선택사항: 복잡한 캐시 전략 필요시)
  // provider: () => new Map(),

  // 오류 처리 함수
  onError: (error, key) => {
    console.error(`SWR Error for key "${key}":`, error)

    // Sentry에 오류 전송 (개발 환경에서는 제외)
    if (process.env.NODE_ENV === 'production') {
      // 동적 import로 Sentry 로드 (성능 최적화)
      import('@sentry/nextjs').then(Sentry => {
        Sentry.captureException(error, {
          tags: {
            swrKey: key,
            source: 'swr-error',
          },
        })
      })
    }
  },

  // 성공 처리 함수
  onSuccess: (data, key) => {
    // 개발 환경에서만 로깅
    if (process.env.NODE_ENV === 'development') {
      console.log(`✅ SWR Success for "${key}":`, data)
    }
  },
}

// 캐시 키 생성 헬퍼
export const createCacheKey = (endpoint: string, params?: Record<string, any>) => {
  if (!params) return endpoint

  const searchParams = new URLSearchParams()
  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined && value !== null) {
      searchParams.append(key, String(value))
    }
  })

  const queryString = searchParams.toString()
  return queryString ? `${endpoint}?${queryString}` : endpoint
}

// 일반적인 캐시 키 패턴들
export const CACHE_KEYS = {
  // 잔액 관련
  BALANCE: (ownerType: string, ownerId: string) =>
    createCacheKey('/api/balance', { ownerType, ownerId }),

  // 거래 내역
  TRANSACTIONS: (ownerType: string, ownerId: string, page?: number, limit?: number) =>
    createCacheKey('/api/transactions', { ownerType, ownerId, page, limit }),

  // 카테고리
  CATEGORIES: (ownerType: string, ownerId: string) =>
    createCacheKey('/api/categories', { ownerType, ownerId }),

  // 고정 지출
  RECURRING_RULES: (groupId: string) => createCacheKey('/api/recurring-rules', { groupId }),

  // 사용자 프로필
  USER_PROFILE: () => '/api/auth/profile',

  // 그룹 정보
  GROUP_INFO: (groupId: string) => createCacheKey('/api/groups', { groupId }),
}

// 캐시 무효화 패턴
export const CACHE_INVALIDATION_PATTERNS = {
  // 잔액 업데이트 시 관련 캐시 무효화
  BALANCE_UPDATE: (ownerType: string, ownerId: string) => [
    CACHE_KEYS.BALANCE(ownerType, ownerId),
    CACHE_KEYS.TRANSACTIONS(ownerType, ownerId),
  ],

  // 거래 추가/수정/삭제 시
  TRANSACTION_CHANGE: (ownerType: string, ownerId: string) => [
    CACHE_KEYS.BALANCE(ownerType, ownerId),
    CACHE_KEYS.TRANSACTIONS(ownerType, ownerId),
  ],

  // 카테고리 변경 시
  CATEGORY_CHANGE: (ownerType: string, ownerId: string) => [
    CACHE_KEYS.CATEGORIES(ownerType, ownerId),
    CACHE_KEYS.TRANSACTIONS(ownerType, ownerId),
  ],
}
