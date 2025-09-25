/**
 * API 클라이언트 유틸리티
 * JWT 토큰 자동 갱신 및 재시도 로직 포함
 * 전역 에러 처리 및 보안 로깅 통합
 */

import { handleApiError, handleNetworkError, withRetry, type ErrorReport } from './error-handler'
import { logApiCall, safeConsole } from './security-utils'
import type { JsonValue } from '@/types/json'

interface ApiResponse<TData> {
  ok: boolean
  status: number
  data?: TData
  error?: string
  errorReport?: ErrorReport
}

/**
 * 토큰 갱신 시도 (재귀 호출 방지를 위한 플래그)
 */
let isRefreshing = false
let refreshPromise: Promise<boolean> | null = null

/**
 * Refresh Token을 사용하여 Access Token 갱신
 */
async function refreshAccessToken(): Promise<boolean> {
  if (isRefreshing) {
    return refreshPromise || Promise.resolve(false)
  }

  isRefreshing = true
  refreshPromise = (async () => {
    try {
      const response = await fetch('/api/auth/refresh', {
        method: 'POST',
        credentials: 'include',
      })

      if (response.ok) {
        // safeConsole.log('✅ Access Token 갱신 성공')
        return true
      } else {
        safeConsole.warn('❌ Refresh Token 만료 또는 무효', { status: response.status })
        return false
      }
    } catch (error) {
      safeConsole.error('토큰 갱신 중 네트워크 오류', error)
      return false
    } finally {
      isRefreshing = false
      refreshPromise = null
    }
  })()

  return refreshPromise
}

/**
 * API 호출 함수 (인증 에러 처리 및 자동 토큰 갱신 포함)
 */
export async function apiCall<TData>(
  url: string,
  options?: RequestInit,
  skipRetry: boolean = false,
  retryCount: number = 0
): Promise<ApiResponse<TData>> {
  const method = options?.method || 'GET'
  const startTime = Date.now()
  let errorReport: ErrorReport | undefined

  try {
    const response = await fetch(url, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        ...options?.headers,
      },
      credentials: 'include', // 모든 요청에 쿠키 포함
    })

    if (!response.ok) {
      if (response.status === 401 && !skipRetry && url !== '/api/auth/refresh') {
        safeConsole.info('🔄 401 에러 감지, 토큰 갱신 시도 중...', {
          currentUrl: window.location.href,
          retryCount,
        })

        const refreshSuccessful = await refreshAccessToken()

        if (refreshSuccessful) {
          safeConsole.info('🔄 토큰 갱신 성공, 원래 요청 재시도', {
            url,
            retryCount: retryCount + 1,
          })
          return apiCall<TData>(url, options, true, retryCount + 1) // 재시도 카운트 증가
        } else {
          safeConsole.warn('❌ 토큰 갱신 실패, 로그인 페이지로 리다이렉트', {
            currentUrl: window.location.href,
          })

          const authError = new Error('세션이 만료되었습니다. 다시 로그인해주세요.')
          errorReport = handleApiError(authError, url)

          if (typeof window !== 'undefined' && !window.location.pathname.includes('/login')) {
            window.location.href = '/login'
          }

          return {
            ok: false,
            status: 401,
            error: authError.message,
            errorReport,
          }
        }
      }
      // 401 외의 에러 또는 재시도하지 않는 401 에러 처리
      const errorData: { message?: string; error?: string } = await response
        .json()
        .catch(() => ({ message: response.statusText }))
      const apiError = new Error(errorData.message || '알 수 없는 API 오류')
      errorReport = handleApiError(apiError, url)

      safeConsole.error('API 오류 응답', errorReport, {
        endpoint: url,
        method,
        status: response.status,
        responseBody: errorData,
      })

      return {
        ok: false,
        status: response.status,
        error: errorData.error || apiError.message,
        errorReport,
      }
    }

    // 성공 응답 처리
    const data: TData = await response.json().catch(() => null as unknown as TData) // JSON 파싱 실패해도 진행

    safeConsole.log('API 성공 응답', { endpoint: url, method, status: response.status, data })

    return {
      ok: true,
      status: response.status,
      data,
    }
  } catch (error) {
    const networkError = error instanceof Error ? error : new Error('알 수 없는 네트워크 오류')
    errorReport = handleNetworkError(networkError, url)

    safeConsole.error('네트워크 오류 발생', errorReport, {
      endpoint: url,
      method,
      errorDetails: networkError.message,
    })

    return {
      ok: false,
      status: 500,
      error: '네트워크 오류가 발생했습니다.',
      errorReport,
    }
  }
}

/**
 * GET 요청
 */
export async function apiGet<TData>(url: string): Promise<ApiResponse<TData>> {
  return apiCall<TData>(url, { method: 'GET' })
}

/**
 * POST 요청
 */
export async function apiPost<TData, TBody extends JsonValue | undefined = undefined>(
  url: string,
  data?: TBody
): Promise<ApiResponse<TData>> {
  return apiCall<TData>(url, {
    method: 'POST',
    body: data ? JSON.stringify(data) : undefined,
  })
}

/**
 * PUT 요청
 */
export async function apiPut<TData, TBody extends JsonValue | undefined = undefined>(
  url: string,
  data?: TBody
): Promise<ApiResponse<TData>> {
  return apiCall<TData>(url, {
    method: 'PUT',
    body: data ? JSON.stringify(data) : undefined,
  })
}

/**
 * DELETE 요청
 */
export async function apiDelete<TData>(url: string): Promise<ApiResponse<TData>> {
  return apiCall<TData>(url, { method: 'DELETE' })
}

/**
 * 재시도가 포함된 API 호출
 */
export async function apiCallWithRetry<TData>(
  url: string,
  options: RequestInit = {},
  maxRetries = 3
): Promise<ApiResponse<TData>> {
  return withRetry(() => apiCall<TData>(url, options), maxRetries)
}

/**
 * 배치 API 요청 (병렬 처리)
 */
export async function apiBatch<TData>(
  requests: Array<{ url: string; options?: RequestInit }>
): Promise<ApiResponse<TData>[]> {
  const promises = requests.map(({ url, options }) => apiCall<TData>(url, options))

  return Promise.all(promises)
}

/**
 * 파일 업로드 API 호출
 */
export async function apiUpload<TData>(
  url: string,
  file: File,
  onProgress?: (progress: number) => void
): Promise<ApiResponse<TData>> {
  return new Promise(resolve => {
    const formData = new FormData()
    formData.append('file', file)

    const xhr = new XMLHttpRequest()

    xhr.upload.addEventListener('progress', event => {
      if (event.lengthComputable && onProgress) {
        const progress = (event.loaded / event.total) * 100
        onProgress(progress)
      }
    })

    xhr.addEventListener('load', () => {
      try {
        const data = JSON.parse(xhr.responseText) as TData
        resolve({
          ok: xhr.status >= 200 && xhr.status < 300,
          status: xhr.status,
          data,
          error: !xhr.status || xhr.status >= 400 ? data?.error || '업로드 실패' : undefined,
        })
      } catch (error) {
        const networkError = new Error('파일 업로드 중 오류가 발생했습니다.')
        const errorReport = handleNetworkError(networkError, url)

        resolve({
          ok: false,
          status: 500,
          error: networkError.message,
          errorReport,
        })
      }
    })

    xhr.addEventListener('error', () => {
      const networkError = new Error('파일 업로드 중 네트워크 오류가 발생했습니다.')
      const errorReport = handleNetworkError(networkError, url)

      resolve({
        ok: false,
        status: 500,
        error: networkError.message,
        errorReport,
      })
    })

    xhr.open('POST', url)
    xhr.withCredentials = true
    xhr.send(formData)
  })
}

/**
 * API 응답 캐싱을 위한 헬퍼
 */
class ApiCache {
  private cache = new Map<string, { data: JsonValue; timestamp: number; ttl: number }>()

  set(key: string, data: JsonValue, ttl = 5 * 60 * 1000) {
    // 기본 5분 TTL
    this.cache.set(key, {
      data,
      timestamp: Date.now(),
      ttl,
    })
  }

  get(key: string): JsonValue | null {
    const cached = this.cache.get(key)
    if (!cached) return null

    if (Date.now() - cached.timestamp > cached.ttl) {
      this.cache.delete(key)
      return null
    }

    return cached.data
  }

  clear() {
    this.cache.clear()
  }

  delete(key: string) {
    this.cache.delete(key)
  }
}

const apiCache = new ApiCache()

/**
 * 캐싱이 포함된 GET 요청
 */
export async function apiGetCached<TData>(url: string, ttl?: number): Promise<ApiResponse<TData>> {
  const cacheKey = `GET:${url}`
  const cached = apiCache.get(cacheKey)

  if (cached) {
    return {
      ok: true,
      status: 200,
      data: cached as TData,
    }
  }

  const response = await apiGet<TData>(url)

  if (response.ok && response.data) {
    apiCache.set(cacheKey, response.data, ttl)
  }

  return response
}

/**
 * 캐시 제어 함수들
 */
export const cache = {
  clear: () => apiCache.clear(),
  delete: (url: string) => apiCache.delete(`GET:${url}`),
  invalidatePattern: (pattern: string) => {
    // URL 패턴과 일치하는 캐시 엔트리 삭제
    Array.from(apiCache['cache'].keys())
      .filter(key => key.includes(pattern))
      .forEach(key => apiCache.delete(key.replace('GET:', '')))
  },
}
