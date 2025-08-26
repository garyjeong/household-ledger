/**
 * @jest-environment jsdom
 */

import {
  apiCall,
  apiGet,
  apiPost,
  apiPut,
  apiDelete,
  apiCallWithRetry,
  apiBatch,
  apiGetCached,
  cache,
} from '@/lib/api-client'

// Mock the error handler
jest.mock('@/lib/error-handler', () => ({
  handleApiError: jest.fn(() => ({
    id: 'test-error-id',
    category: 'api',
    severity: 'medium',
    userFriendlyMessage: '요청 처리 중 오류가 발생했습니다.',
  })),
  handleNetworkError: jest.fn(() => ({
    id: 'test-network-error-id',
    category: 'network',
    severity: 'medium',
    userFriendlyMessage: '네트워크 연결을 확인해주세요.',
  })),
  withRetry: jest.fn((operation) => operation()),
}))

// Mock fetch
global.fetch = jest.fn()

// Mock location for redirect tests
Object.defineProperty(window, 'location', {
  value: {
    href: '',
  },
  writable: true,
})

describe('API Client', () => {
  beforeEach(() => {
    ;(fetch as jest.Mock).mockClear()
    cache.clear()
    window.location.href = ''
  })

  describe('apiCall', () => {
    it('성공적인 API 호출을 처리해야 한다', async () => {
      const mockData = { message: 'success', data: [1, 2, 3] }
      ;(fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        status: 200,
        headers: {
          get: jest.fn().mockReturnValue('application/json'),
        },
        json: jest.fn().mockResolvedValue(mockData),
      })

      const response = await apiCall('/api/test')

      expect(response.ok).toBe(true)
      expect(response.status).toBe(200)
      expect(response.data).toEqual(mockData)
      expect(response.error).toBeUndefined()
    })

    it('API 에러를 올바르게 처리해야 한다', async () => {
      const errorData = { error: 'Invalid request' }
      ;(fetch as jest.Mock).mockResolvedValueOnce({
        ok: false,
        status: 400,
        headers: {
          get: jest.fn().mockReturnValue('application/json'),
        },
        json: jest.fn().mockResolvedValue(errorData),
      })

      const response = await apiCall('/api/test')

      expect(response.ok).toBe(false)
      expect(response.status).toBe(400)
      expect(response.error).toBe('Invalid request')
      expect(response.errorReport).toBeDefined()
    })

    it('네트워크 에러를 올바르게 처리해야 한다', async () => {
      ;(fetch as jest.Mock).mockRejectedValueOnce(new Error('Network error'))

      const response = await apiCall('/api/test')

      expect(response.ok).toBe(false)
      expect(response.status).toBe(500)
      expect(response.error).toBe('네트워크 오류가 발생했습니다.')
      expect(response.errorReport).toBeDefined()
    })

    it('401 에러 시 토큰 갱신을 시도해야 한다', async () => {
      // 첫 번째 호출: 401 에러
      // 두 번째 호출: 토큰 갱신 성공
      // 세 번째 호출: 원래 요청 재시도 성공
      ;(fetch as jest.Mock)
        .mockResolvedValueOnce({
          ok: false,
          status: 401,
          headers: { get: jest.fn().mockReturnValue('application/json') },
        })
        .mockResolvedValueOnce({
          ok: true,
          status: 200,
        })
        .mockResolvedValueOnce({
          ok: true,
          status: 200,
          headers: { get: jest.fn().mockReturnValue('application/json') },
          json: jest.fn().mockResolvedValue({ success: true }),
        })

      const response = await apiCall('/api/protected')

      expect(fetch).toHaveBeenCalledTimes(3)
      expect(response.ok).toBe(true)
      expect(response.data).toEqual({ success: true })
    })

    it('토큰 갱신 실패 시 로그인 페이지로 리다이렉트해야 한다', async () => {
      // 첫 번째 호출: 401 에러
      // 두 번째 호출: 토큰 갱신 실패
      ;(fetch as jest.Mock)
        .mockResolvedValueOnce({
          ok: false,
          status: 401,
          headers: { get: jest.fn().mockReturnValue('application/json') },
        })
        .mockResolvedValueOnce({
          ok: false,
          status: 401,
        })

      const response = await apiCall('/api/protected')

      expect(response.ok).toBe(false)
      expect(response.status).toBe(401)
      expect(response.error).toBe('인증이 필요합니다. 다시 로그인해주세요.')
      expect(window.location.href).toBe('/login')
    })

    it('JSON 파싱 실패를 처리해야 한다', async () => {
      ;(fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        status: 200,
        headers: {
          get: jest.fn().mockReturnValue('application/json'),
        },
        json: jest.fn().mockRejectedValue(new Error('Invalid JSON')),
      })

      const response = await apiCall('/api/test')

      expect(response.ok).toBe(true)
      expect(response.status).toBe(200)
      expect(response.data).toBeUndefined()
    })

    it('올바른 기본 옵션을 설정해야 한다', async () => {
      ;(fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        status: 200,
        headers: { get: jest.fn().mockReturnValue('application/json') },
        json: jest.fn().mockResolvedValue({}),
      })

      await apiCall('/api/test', { method: 'POST' })

      expect(fetch).toHaveBeenCalledWith('/api/test', {
        method: 'POST',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
        },
      })
    })
  })

  describe('API 메서드들', () => {
    beforeEach(() => {
      ;(fetch as jest.Mock).mockResolvedValue({
        ok: true,
        status: 200,
        headers: { get: jest.fn().mockReturnValue('application/json') },
        json: jest.fn().mockResolvedValue({ success: true }),
      })
    })

    it('apiGet이 올바르게 작동해야 한다', async () => {
      await apiGet('/api/users')

      expect(fetch).toHaveBeenCalledWith('/api/users', {
        method: 'GET',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
        },
      })
    })

    it('apiPost가 올바르게 작동해야 한다', async () => {
      const data = { name: 'test' }
      await apiPost('/api/users', data)

      expect(fetch).toHaveBeenCalledWith('/api/users', {
        method: 'POST',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      })
    })

    it('apiPut이 올바르게 작동해야 한다', async () => {
      const data = { id: 1, name: 'updated' }
      await apiPut('/api/users/1', data)

      expect(fetch).toHaveBeenCalledWith('/api/users/1', {
        method: 'PUT',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      })
    })

    it('apiDelete가 올바르게 작동해야 한다', async () => {
      await apiDelete('/api/users/1')

      expect(fetch).toHaveBeenCalledWith('/api/users/1', {
        method: 'DELETE',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
        },
      })
    })
  })

  describe('apiBatch', () => {
    it('여러 API 요청을 병렬로 처리해야 한다', async () => {
      ;(fetch as jest.Mock).mockResolvedValue({
        ok: true,
        status: 200,
        headers: { get: jest.fn().mockReturnValue('application/json') },
        json: jest.fn().mockResolvedValue({ success: true }),
      })

      const requests = [
        { url: '/api/users' },
        { url: '/api/posts', options: { method: 'POST' } },
        { url: '/api/comments' },
      ]

      const responses = await apiBatch(requests)

      expect(responses).toHaveLength(3)
      expect(fetch).toHaveBeenCalledTimes(3)
      responses.forEach((response) => {
        expect(response.ok).toBe(true)
      })
    })
  })

  describe('apiGetCached', () => {
    it('캐시가 없을 때 API를 호출하고 결과를 캐시해야 한다', async () => {
      const mockData = { id: 1, name: 'test' }
      ;(fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        status: 200,
        headers: { get: jest.fn().mockReturnValue('application/json') },
        json: jest.fn().mockResolvedValue(mockData),
      })

      const response = await apiGetCached('/api/users/1')

      expect(response.ok).toBe(true)
      expect(response.data).toEqual(mockData)
      expect(fetch).toHaveBeenCalledTimes(1)
    })

    it('캐시가 있을 때 API를 호출하지 않고 캐시된 결과를 반환해야 한다', async () => {
      const mockData = { id: 1, name: 'test' }
      ;(fetch as jest.Mock).mockResolvedValue({
        ok: true,
        status: 200,
        headers: { get: jest.fn().mockReturnValue('application/json') },
        json: jest.fn().mockResolvedValue(mockData),
      })

      // 첫 번째 호출
      await apiGetCached('/api/users/1')
      // 두 번째 호출 (캐시에서 반환되어야 함)
      const response = await apiGetCached('/api/users/1')

      expect(response.ok).toBe(true)
      expect(response.data).toEqual(mockData)
      expect(fetch).toHaveBeenCalledTimes(1) // 한 번만 호출되어야 함
    })
  })

  describe('cache 유틸리티', () => {
    it('캐시를 비울 수 있어야 한다', async () => {
      ;(fetch as jest.Mock).mockResolvedValue({
        ok: true,
        status: 200,
        headers: { get: jest.fn().mockReturnValue('application/json') },
        json: jest.fn().mockResolvedValue({ test: true }),
      })

      // 캐시에 데이터 저장
      await apiGetCached('/api/test')

      // 캐시 비우기
      cache.clear()

      // 다시 호출하면 API가 호출되어야 함
      await apiGetCached('/api/test')

      expect(fetch).toHaveBeenCalledTimes(2)
    })

    it('특정 URL 캐시를 삭제할 수 있어야 한다', async () => {
      ;(fetch as jest.Mock).mockResolvedValue({
        ok: true,
        status: 200,
        headers: { get: jest.fn().mockReturnValue('application/json') },
        json: jest.fn().mockResolvedValue({ test: true }),
      })

      // 두 개의 다른 URL 캐시
      await apiGetCached('/api/users')
      await apiGetCached('/api/posts')

      // 하나만 삭제
      cache.delete('/api/users')

      // 삭제된 URL은 다시 API 호출
      await apiGetCached('/api/users')
      // 삭제되지 않은 URL은 캐시에서 반환
      await apiGetCached('/api/posts')

      expect(fetch).toHaveBeenCalledTimes(3) // 초기 2번 + 재호출 1번
    })

    it('패턴 기반 캐시 무효화가 작동해야 한다', async () => {
      ;(fetch as jest.Mock).mockResolvedValue({
        ok: true,
        status: 200,
        headers: { get: jest.fn().mockReturnValue('application/json') },
        json: jest.fn().mockResolvedValue({ test: true }),
      })

      // 여러 사용자 관련 API 캐시
      await apiGetCached('/api/users/1')
      await apiGetCached('/api/users/2')
      await apiGetCached('/api/posts/1')

      // 사용자 관련 캐시만 무효화
      cache.invalidatePattern('users')

      // 사용자 관련 API는 다시 호출
      await apiGetCached('/api/users/1')
      // posts는 캐시에서 반환
      await apiGetCached('/api/posts/1')

      expect(fetch).toHaveBeenCalledTimes(4) // 초기 3번 + 재호출 1번
    })
  })
})
