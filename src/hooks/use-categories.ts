/**
 * 카테고리 관련 React Query hooks
 * T-022: 카테고리 관리 페이지 구현
 */

'use client'

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useGroup } from '@/contexts/group-context'
import { TransactionType } from '@/types/couple-ledger'

// 카테고리 타입 정의
export interface Category {
  id: string
  name: string
  type: TransactionType | 'INCOME' | 'EXPENSE'
  color: string
  ownerType: 'USER' | 'GROUP'
  ownerId: string
  isDefault: boolean
  createdAt?: string
  updatedAt?: string
}

export interface CreateCategoryData {
  name: string
  type: 'INCOME' | 'EXPENSE'
  color: string
  ownerType: 'USER' | 'GROUP'
  ownerId: number
}

export interface UpdateCategoryData {
  name?: string
  type?: 'INCOME' | 'EXPENSE'
  color?: string
}

export interface CategoryFilters {
  ownerType?: 'USER' | 'GROUP'
  ownerId?: string
  type?: 'INCOME' | 'EXPENSE'
  isDefault?: boolean
}

/**
 * 카테고리 목록 조회 hook
 */
export function useCategories(filters?: CategoryFilters) {
  const { currentGroup } = useGroup()

  return useQuery({
    queryKey: ['categories', filters],
    queryFn: async () => {
      const params = new URLSearchParams()

      if (filters?.ownerType) params.set('ownerType', filters.ownerType)
      if (filters?.ownerId) params.set('ownerId', filters.ownerId)
      if (filters?.type) params.set('type', filters.type)
      if (filters?.isDefault !== undefined) params.set('isDefault', filters.isDefault.toString())

      const response = await fetch(`/api/categories?${params}`, {
        credentials: 'include',
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Failed to fetch categories')
      }

      const data = await response.json()
      return data
    },
    enabled: true,
  })
}

/**
 * 특정 카테고리 조회 hook
 */
export function useCategory(categoryId: string) {
  return useQuery({
    queryKey: ['category', categoryId],
    queryFn: async () => {
      const response = await fetch(`/api/categories/${categoryId}`, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem('accessToken')}`,
        },
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Failed to fetch category')
      }

      const data = await response.json()
      return data.category
    },
    enabled: !!categoryId,
  })
}

/**
 * 카테고리 생성 hook
 */
export function useCreateCategory() {
  const queryClient = useQueryClient()
  const { currentGroup } = useGroup()

  return useMutation({
    mutationFn: async (categoryData: CreateCategoryData) => {
      const response = await fetch('/api/categories', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify(categoryData),
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Failed to create category')
      }

      return response.json()
    },
    onSuccess: () => {
      // 카테고리 목록 쿼리 무효화
      queryClient.invalidateQueries({ queryKey: ['categories'] })
    },
  })
}

/**
 * 카테고리 수정 hook
 */
export function useUpdateCategory() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({ id, data }: { id: string; data: UpdateCategoryData }) => {
      const response = await fetch(`/api/categories/${id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${localStorage.getItem('accessToken')}`,
        },
        body: JSON.stringify(data),
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Failed to update category')
      }

      return response.json()
    },
    onSuccess: (_, { id }) => {
      // 카테고리 목록 및 개별 카테고리 쿼리 무효화
      queryClient.invalidateQueries({ queryKey: ['categories'] })
      queryClient.invalidateQueries({ queryKey: ['category', id] })
    },
  })
}

/**
 * 카테고리 삭제 hook
 */
export function useDeleteCategory() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (categoryId: string) => {
      const response = await fetch(`/api/categories/${categoryId}`, {
        method: 'DELETE',
        headers: {
          Authorization: `Bearer ${localStorage.getItem('accessToken')}`,
        },
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Failed to delete category')
      }

      return response.json()
    },
    onSuccess: () => {
      // 카테고리 목록 쿼리 무효화
      queryClient.invalidateQueries({ queryKey: ['categories'] })
    },
  })
}

/**
 * 그룹 카테고리 조회 hook (현재 그룹 기준)
 */
export function useGroupCategories(type?: 'INCOME' | 'EXPENSE') {
  const { currentGroup } = useGroup()

  return useCategories({
    ownerType: 'GROUP',
    ownerId: currentGroup?.id,
    type,
  })
}

/**
 * 사용자 카테고리 조회 hook
 */
export function useUserCategories(type?: 'INCOME' | 'EXPENSE') {
  return useCategories({
    ownerType: 'USER',
    type,
  })
}

/**
 * 기본 카테고리 조회 hook
 */
export function useDefaultCategories(type?: 'INCOME' | 'EXPENSE') {
  return useCategories({
    type,
    isDefault: true,
  })
}

/**
 * 커스텀 카테고리 조회 hook
 */
export function useCustomCategories(type?: 'INCOME' | 'EXPENSE') {
  const { currentGroup } = useGroup()

  return useCategories({
    ownerType: 'GROUP',
    ownerId: currentGroup?.id,
    type,
    isDefault: false,
  })
}
