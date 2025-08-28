/**
 * 푸시 알림 관련 React Query hooks
 * T-026: 설정 하위 메뉴 - 프로필 관리 (알림 설정)
 */

'use client'

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useAuth } from '@/contexts/auth-context'

export interface PushToken {
  id: string
  token: string
  endpoint?: string
  userAgent?: string
  isActive: boolean
  lastUsed: string
  createdAt: string
}

export interface PushSubscription {
  endpoint: string
  keys: {
    p256dh: string
    auth: string
  }
}

/**
 * 푸시 토큰 목록 조회 hook
 */
export function usePushTokens() {
  const { isAuthenticated } = useAuth()

  return useQuery({
    queryKey: ['push-tokens'],
    queryFn: async (): Promise<PushToken[]> => {
      const response = await fetch('/api/notifications/push-tokens', {
        credentials: 'include',
      })

      if (!response.ok) {
        if (response.status === 401) {
          throw new Error('인증이 필요합니다')
        }
        const error = await response.json()
        throw new Error(error.error || 'Failed to fetch push tokens')
      }

      const data = await response.json()
      return data.tokens || []
    },
    enabled: isAuthenticated,
    staleTime: 5 * 60 * 1000, // 5분간 캐시 유지
    gcTime: 10 * 60 * 1000, // 10분간 가비지 컬렉션 방지
  })
}

/**
 * 푸시 토큰 등록 hook
 */
export function useRegisterPushToken() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (tokenData: {
      token: string
      endpoint?: string
      keys?: {
        p256dh?: string
        auth?: string
      }
      userAgent?: string
    }): Promise<PushToken> => {
      const response = await fetch('/api/notifications/push-tokens', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify(tokenData),
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Failed to register push token')
      }

      const data = await response.json()
      return data.token
    },
    onSuccess: () => {
      // 푸시 토큰 목록 쿼리 무효화
      queryClient.invalidateQueries({ queryKey: ['push-tokens'] })
    },
  })
}

/**
 * 푸시 토큰 삭제 hook
 */
export function useDeletePushToken() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({
      tokenId,
      permanent = false,
    }: {
      tokenId: string
      permanent?: boolean
    }) => {
      const url = `/api/notifications/push-tokens/${tokenId}${permanent ? '?permanent=true' : ''}`

      const response = await fetch(url, {
        method: 'DELETE',
        credentials: 'include',
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Failed to delete push token')
      }

      return response.json()
    },
    onSuccess: () => {
      // 푸시 토큰 목록 쿼리 무효화
      queryClient.invalidateQueries({ queryKey: ['push-tokens'] })
    },
  })
}

/**
 * 모든 푸시 토큰 비활성화 hook (로그아웃 시 사용)
 */
export function useDeactivateAllPushTokens() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async () => {
      const response = await fetch('/api/notifications/push-tokens', {
        method: 'DELETE',
        credentials: 'include',
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Failed to deactivate push tokens')
      }

      return response.json()
    },
    onSuccess: () => {
      // 푸시 토큰 목록 쿼리 무효화
      queryClient.invalidateQueries({ queryKey: ['push-tokens'] })
    },
  })
}

/**
 * 푸시 토큰 사용 시간 업데이트 hook
 */
export function useUpdatePushTokenUsage() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (tokenId: string) => {
      const response = await fetch(`/api/notifications/push-tokens/${tokenId}`, {
        method: 'PUT',
        credentials: 'include',
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Failed to update push token usage')
      }

      return response.json()
    },
    onSuccess: () => {
      // 푸시 토큰 목록 쿼리 무효화
      queryClient.invalidateQueries({ queryKey: ['push-tokens'] })
    },
  })
}
