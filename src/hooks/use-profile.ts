/**
 * 프로필 관련 React Query hooks
 * T-023: 내 정보 페이지 개발
 */

'use client'

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useAuth } from '@/contexts/auth-context'

// 프로필 타입 정의
export interface UserProfile {
  id: string
  name: string
  email: string
  createdAt: string
  avatarUrl?: string
}

export interface UpdateProfileData {
  name: string
  email: string
}

export interface ChangePasswordData {
  currentPassword: string
  newPassword: string
}

/**
 * 프로필 정보 조회 hook
 */
export function useProfile() {
  const { isAuthenticated } = useAuth()

  return useQuery({
    queryKey: ['profile'],
    queryFn: async (): Promise<UserProfile> => {
      const response = await fetch('/api/auth/profile', {
        credentials: 'include',
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Failed to fetch profile')
      }

      const data = await response.json()
      return data.user
    },
    enabled: isAuthenticated,
  })
}

/**
 * 프로필 정보 수정 hook
 */
export function useUpdateProfile() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (data: UpdateProfileData): Promise<UserProfile> => {
      const response = await fetch('/api/auth/profile', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify(data),
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Failed to update profile')
      }

      const result = await response.json()
      return result.user
    },
    onSuccess: updatedProfile => {
      // 프로필 쿼리 캐시 업데이트
      queryClient.setQueryData(['profile'], updatedProfile)
    },
  })
}

/**
 * 비밀번호 변경 hook
 */
export function useChangePassword() {
  return useMutation({
    mutationFn: async (data: ChangePasswordData): Promise<void> => {
      const response = await fetch('/api/auth/change-password', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify(data),
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Failed to change password')
      }
    },
  })
}
