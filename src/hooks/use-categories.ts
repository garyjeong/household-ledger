import { useState, useEffect } from 'react'
import { CategoryResponse, CreateCategoryData, UpdateCategoryData } from '@/lib/schemas/category'

// 카테고리 타입 정의 (기존 호환성 유지)
export interface Category {
  id: string
  name: string
  type: 'EXPENSE' | 'INCOME' | 'TRANSFER'
  color: string | null
  isDefault: boolean
  ownerType: 'USER' | 'GROUP'
  ownerId: string
}

interface UseCategoriesReturn {
  categories: CategoryResponse[]
  loading: boolean
  error: string | null
  refetch: () => Promise<void>
}

export function useCategories(type?: 'EXPENSE' | 'INCOME' | 'TRANSFER'): UseCategoriesReturn {
  const [categories, setCategories] = useState<CategoryResponse[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchCategories = async () => {
    try {
      setLoading(true)
      setError(null)

      const params = new URLSearchParams()
      if (type) {
        params.append('type', type)
      }

      const response = await fetch(`/api/categories?${params.toString()}`, {
        credentials: 'include',
      })

      if (!response.ok) {
        throw new Error('카테고리를 불러오는데 실패했습니다')
      }

      const data = await response.json()
      setCategories(data.categories || [])
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : '알 수 없는 오류가 발생했습니다'
      setError(errorMessage)
      console.error('카테고리 로딩 오류:', err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchCategories()
  }, [type])

  return {
    categories,
    loading,
    error,
    refetch: fetchCategories,
  }
}

// 카테고리 생성 훅
export function useCreateCategory() {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const createCategory = async (data: CreateCategoryData) => {
    try {
      setLoading(true)
      setError(null)

      const response = await fetch('/api/categories', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify(data),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || '카테고리 생성에 실패했습니다')
      }

      const result = await response.json()
      return result.category
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : '알 수 없는 오류가 발생했습니다'
      setError(errorMessage)
      throw err
    } finally {
      setLoading(false)
    }
  }

  return {
    createCategory,
    loading,
    error,
  }
}

// 카테고리 수정 훅
export function useUpdateCategory() {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const updateCategory = async (id: string, data: UpdateCategoryData) => {
    try {
      setLoading(true)
      setError(null)

      const response = await fetch(`/api/categories/${id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify(data),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || '카테고리 수정에 실패했습니다')
      }

      const result = await response.json()
      return result.category
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : '알 수 없는 오류가 발생했습니다'
      setError(errorMessage)
      throw err
    } finally {
      setLoading(false)
    }
  }

  return {
    updateCategory,
    loading,
    error,
  }
}

// 카테고리 삭제 훅
export function useDeleteCategory() {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const deleteCategory = async (id: string) => {
    try {
      setLoading(true)
      setError(null)

      const response = await fetch(`/api/categories/${id}`, {
        method: 'DELETE',
        credentials: 'include',
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || '카테고리 삭제에 실패했습니다')
      }

      return true
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : '알 수 없는 오류가 발생했습니다'
      setError(errorMessage)
      throw err
    } finally {
      setLoading(false)
    }
  }

  return {
    deleteCategory,
    loading,
    error,
  }
}