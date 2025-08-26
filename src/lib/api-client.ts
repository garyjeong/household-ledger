/**
 * API 클라이언트 유틸리티
 * JWT 토큰 자동 갱신 및 재시도 로직 포함
 */

interface ApiResponse<T = any> {
  ok: boolean
  status: number
  data?: T
  error?: string
}

/**
 * 토큰 갱신 함수
 */
async function refreshAccessToken(): Promise<boolean> {
  try {
    const response = await fetch('/api/auth/refresh', {
      method: 'POST',
      credentials: 'include',
    })

    return response.ok
  } catch (error) {
    console.error('토큰 갱신 실패:', error)
    return false
  }
}

/**
 * API 호출 함수 (토큰 자동 갱신 포함)
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

  try {
    // 첫 번째 API 호출 시도
    let response = await fetch(url, defaultOptions)

    // 401 에러 (토큰 만료)인 경우 토큰 갱신 후 재시도
    if (response.status === 401) {
      console.log('토큰 만료됨. 토큰 갱신 시도...')

      const refreshSuccess = await refreshAccessToken()

      if (refreshSuccess) {
        console.log('토큰 갱신 성공. API 재시도...')
        // 토큰 갱신 성공 시 원래 요청 재시도
        response = await fetch(url, defaultOptions)
      } else {
        console.log('토큰 갱신 실패. 로그인 페이지로 리다이렉트 필요')
        // 토큰 갱신 실패 시 로그인 페이지로 리다이렉트
        window.location.href = '/login'
        return {
          ok: false,
          status: 401,
          error: '인증이 필요합니다. 다시 로그인해주세요.',
        }
      }
    }

    let data: T | undefined
    const contentType = response.headers.get('content-type')

    if (contentType && contentType.includes('application/json')) {
      data = await response.json()
    }

    return {
      ok: response.ok,
      status: response.status,
      data,
      error: !response.ok ? (data as any)?.error || '요청 처리 중 오류가 발생했습니다.' : undefined,
    }
  } catch (error) {
    console.error('API 호출 중 오류:', error)
    return {
      ok: false,
      status: 500,
      error: '네트워크 오류가 발생했습니다.',
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
