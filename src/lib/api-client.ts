/**
 * API 클라이언트 유틸리티
 * JWT 토큰 자동 갱신 및 재시도 로직 포함
 * 전역 에러 처리 및 로깅 통합
 */

import { handleApiError, handleNetworkError, withRetry, type ErrorReport } from './error-handler'

interface ApiResponse<T = any> {
  ok: boolean
  status: number
  data?: T
  error?: string
  errorReport?: ErrorReport
}

/**
 * API 호출 함수 (인증 에러 처리 포함)
 */
export async function apiCall<T = any>(
  url: string,
  options: RequestInit = {}
): Promise<ApiResponse<T>> {
  const defaultOptions: RequestInit = {
    credentials: 'include',
    headers: {
      'Content-Type': 'application/json',
      ...options.headers,
    },
    ...options,
  }

  // 요청 시작 시간 기록
  const startTime = Date.now()
  let errorReport: ErrorReport | undefined

  try {
    // API 호출 시도
    const response = await fetch(url, defaultOptions)

    // 401 에러 (인증 실패)인 경우 즉시 로그인 페이지로 리다이렉트
    if (response.status === 401) {
      console.log('인증 실패. 로그인 페이지로 리다이렉트')

      // 인증 에러 처리
      const authError = new Error('인증이 필요합니다. 다시 로그인해주세요.')
      errorReport = handleApiError(authError, url)

      // 로그인 페이지로 리다이렉트 (브라우저 환경에서만)
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

    let data: T | undefined
    const contentType = response.headers.get('content-type')

    try {
      if (contentType && contentType.includes('application/json')) {
        data = await response.json()
      }
    } catch (parseError) {
      console.warn('JSON 파싱 실패:', parseError)
      // JSON 파싱 실패는 무시하고 빈 데이터로 처리
    }

    // 응답 성공 여부 확인
    if (!response.ok) {
      const errorMessage =
        (data as any)?.error || `HTTP ${response.status}: 요청 처리 중 오류가 발생했습니다.`
      const apiError = new Error(errorMessage)

      errorReport = handleApiError(apiError, url, undefined)

      return {
        ok: false,
        status: response.status,
        data,
        error: errorMessage,
        errorReport,
      }
    }

    // 성공적인 응답 로깅 (개발 환경에서만)
    if (process.env.NODE_ENV === 'development') {
      const duration = Date.now() - startTime
      console.log(`[API Success] ${options.method || 'GET'} ${url} (${duration}ms)`)
    }

    return {
      ok: true,
      status: response.status,
      data,
    }
  } catch (error) {
    // 네트워크 에러 처리
    const networkError = error instanceof Error ? error : new Error('알 수 없는 네트워크 오류')
    errorReport = handleNetworkError(networkError, url)

    const duration = Date.now() - startTime
    console.error(`[API Error] ${options.method || 'GET'} ${url} (${duration}ms):`, error)

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
export async function apiGet<T = any>(url: string): Promise<ApiResponse<T>> {
  return apiCall<T>(url, { method: 'GET' })
}

/**
 * POST 요청
 */
export async function apiPost<T = any>(url: string, data?: any): Promise<ApiResponse<T>> {
  return apiCall<T>(url, {
    method: 'POST',
    body: data ? JSON.stringify(data) : undefined,
  })
}

/**
 * PUT 요청
 */
export async function apiPut<T = any>(url: string, data?: any): Promise<ApiResponse<T>> {
  return apiCall<T>(url, {
    method: 'PUT',
    body: data ? JSON.stringify(data) : undefined,
  })
}

/**
 * DELETE 요청
 */
export async function apiDelete<T = any>(url: string): Promise<ApiResponse<T>> {
  return apiCall<T>(url, { method: 'DELETE' })
}

/**
 * 재시도가 포함된 API 호출
 */
export async function apiCallWithRetry<T = any>(
  url: string,
  options: RequestInit = {},
  maxRetries = 3
): Promise<ApiResponse<T>> {
  return withRetry(() => apiCall<T>(url, options), maxRetries)
}

/**
 * 배치 API 요청 (병렬 처리)
 */
export async function apiBatch<T = any>(
  requests: Array<{ url: string; options?: RequestInit }>
): Promise<ApiResponse<T>[]> {
  const promises = requests.map(({ url, options }) => apiCall<T>(url, options))

  return Promise.all(promises)
}

/**
 * 파일 업로드 API 호출
 */
export async function apiUpload<T = any>(
  url: string,
  file: File,
  onProgress?: (progress: number) => void
): Promise<ApiResponse<T>> {
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
        const data = JSON.parse(xhr.responseText)
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
  private cache = new Map<string, { data: any; timestamp: number; ttl: number }>()

  set(key: string, data: any, ttl = 5 * 60 * 1000) {
    // 기본 5분 TTL
    this.cache.set(key, {
      data,
      timestamp: Date.now(),
      ttl,
    })
  }

  get(key: string): any | null {
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
export async function apiGetCached<T = any>(url: string, ttl?: number): Promise<ApiResponse<T>> {
  const cacheKey = `GET:${url}`
  const cached = apiCache.get(cacheKey)

  if (cached) {
    return {
      ok: true,
      status: 200,
      data: cached,
    }
  }

  const response = await apiGet<T>(url)

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
