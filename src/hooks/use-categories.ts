import { useState, useEffect, useCallback, useMemo, useRef } from 'react'
import { CategoryResponse, CreateCategoryData, UpdateCategoryData } from '@/lib/schemas/category'
import { apiGet, apiPost, apiPut, apiDelete } from '@/lib/api-client'

// 카테고리 타입 정의 (기존 호환성 유지)
export interface Category {
  id: string
  groupId: string | null
  createdBy: string
  name: string
  type: 'EXPENSE' | 'INCOME' | 'TRANSFER'
  color: string | null
  isDefault: boolean
  createdAt: string
  updatedAt: string
}

// 카테고리 필터 타입
export interface CategoryFilters {
  groupId?: string
  type?: 'EXPENSE' | 'INCOME' | 'TRANSFER'
  isDefault?: boolean
}

interface UseCategoriesReturn {
  categories: CategoryResponse[]
  loading: boolean
  error: string | null
  refetch: () => Promise<void>
}

// CategoryManagement를 위한 오버로드된 return 타입
interface UseCategoriesWithDataReturn {
  data: { categories: CategoryResponse[] }
  isLoading: boolean
  error: string | null
  refetch: () => Promise<void>
}

// 간단한 메모리 캐시 (컴포넌트 언마운트 시 자동 해제됨)
const categoriesCache = new Map<string, { data: CategoryResponse[]; timestamp: number }>()
const CACHE_DURATION = 5 * 60 * 1000 // 5분

// 캐시 클리어 함수 (새 카테고리 추가/수정/삭제 시 사용)
export const clearCategoriesCache = () => {
  categoriesCache.clear()
}

// 오버로드된 useCategories 함수
export function useCategories(filters: CategoryFilters | null): UseCategoriesWithDataReturn
export function useCategories(type?: 'EXPENSE' | 'INCOME' | 'TRANSFER'): UseCategoriesReturn
export function useCategories(
  typeOrFilters?: 'EXPENSE' | 'INCOME' | 'TRANSFER' | CategoryFilters | null
): UseCategoriesReturn | UseCategoriesWithDataReturn {
  const [categories, setCategories] = useState<CategoryResponse[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const isFetchingRef = useRef(false)

  // 파라미터 문자열 생성을 메모이제이션
  const paramString = useMemo(() => {
    const params = new URLSearchParams()

    // typeOrFilters가 문자열이면 기존 type 처리
    if (typeof typeOrFilters === 'string') {
      params.append('type', typeOrFilters)
    }
    // typeOrFilters가 객체이면 filters 처리
    else if (typeOrFilters && typeof typeOrFilters === 'object') {
      if (typeOrFilters.groupId) params.append('groupId', typeOrFilters.groupId)
      if (typeOrFilters.type) params.append('type', typeOrFilters.type)
      if (typeOrFilters.isDefault !== undefined)
        params.append('isDefault', typeOrFilters.isDefault.toString())
    }

    return params.toString()
  }, [typeOrFilters])

  const fetchCategories = useCallback(
    async (_isRetry = false, forceRefresh = false) => {
      // null이 전달되면 API 호출하지 않음
      if (typeOrFilters === null) {
        setCategories([])
        setLoading(false)
        setError(null)
        return
      }

      // 캐시 확인 (강제 새로고침이 아닌 경우)
      if (!forceRefresh) {
        const cacheKey = paramString
        const cachedData = categoriesCache.get(cacheKey)

        if (cachedData && Date.now() - cachedData.timestamp < CACHE_DURATION) {
          // 캐시된 데이터가 유효한 경우
          setCategories(cachedData.data)
          setLoading(false)
          setError(null)
          return
        }
      }

      try {
        if (isFetchingRef.current) return
        isFetchingRef.current = true
        setLoading(true)
        setError(null)

        const response = await apiGet(`/api/categories?${paramString}`)

        if (!response.ok) {
          // 400 에러인 경우 재시도하지 않음 (잘못된 요청)
          if (response.status === 400) {
            throw new Error(`잘못된 요청입니다 (${response.status})`)
          }
          throw new Error(`카테고리를 불러오는데 실패했습니다 (${response.status})`)
        }

        const categoriesData = response.data?.categories || []

        // 캐시에 저장
        categoriesCache.set(paramString, {
          data: categoriesData,
          timestamp: Date.now(),
        })

        setCategories(categoriesData)
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : '알 수 없는 오류가 발생했습니다'
        setError(errorMessage)
        console.error('카테고리 로딩 오류:', err)
      } finally {
        isFetchingRef.current = false
        setLoading(false)
      }
    },
    [paramString]
  )

  useEffect(() => {
    fetchCategories()
    // 의존성은 안정적인 파라미터 문자열만 사용해 불필요한 재호출 방지
  }, [paramString])

  // 수동 재시도 함수 (재시도 카운트 리셋, 캐시 무시)
  const manualRefetch = useCallback(async () => {
    await fetchCategories(false, true)
  }, [fetchCategories])

  // filters 객체가 전달된 경우 data 형태로 반환
  if (typeOrFilters && typeof typeOrFilters === 'object') {
    return {
      data: { categories },
      isLoading: loading,
      error,
      refetch: manualRefetch,
    }
  }

  // 기본 반환 형태
  return {
    categories,
    loading,
    error,
    refetch: manualRefetch,
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

      const response = await apiPost('/api/categories', data)

      if (!response.ok) {
        throw new Error(response.error || '카테고리 생성에 실패했습니다')
      }

      // 캐시 클리어 (새 카테고리 추가됨)
      clearCategoriesCache()

      return response.data?.category
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

      const response = await apiPut(`/api/categories/${id}`, data)

      if (!response.ok) {
        throw new Error(response.error || '카테고리 수정에 실패했습니다')
      }

      // 캐시 클리어 (카테고리 수정됨)
      clearCategoriesCache()

      return response.data?.category
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

      const response = await apiDelete(`/api/categories/${id}`)

      if (!response.ok) {
        throw new Error(response.error || '카테고리 삭제에 실패했습니다')
      }

      // 캐시 클리어 (카테고리 삭제됨)
      clearCategoriesCache()

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
