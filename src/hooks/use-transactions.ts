/**
 * Transaction Management Hooks
 * React Query를 사용한 거래 데이터 관리
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { queryKeys } from '@/lib/query-client'
import { apiGet, apiPost, apiPut, apiDelete } from '@/lib/api-client'
import { useGroup } from '@/contexts/group-context'
import { useAlert } from '@/contexts/alert-context'

export interface Transaction {
  id: string
  type: 'INCOME' | 'EXPENSE'
  amount: number
  currency?: string
  convertedAmount?: number
  categoryId: string
  category?: {
    id: string
    name: string
    color?: string
    type: string
  }
  description: string
  memo?: string
  date: string
  tags?: string[]
  accountId?: string
  account?: {
    id: string
    name: string
    type: string
  }
  createdAt: string
  updatedAt: string
}

export interface TransactionFilters {
  type?: 'INCOME' | 'EXPENSE'
  startDate?: string
  endDate?: string
  categoryId?: string
  search?: string
  page?: number
  limit?: number
}

export interface CreateTransactionData {
  type: 'INCOME' | 'EXPENSE'
  amount: number
  currency?: string
  convertedAmount?: number
  categoryId: string
  description: string
  memo?: string
  date: string
  tags?: string[]
}

/**
 * 거래 목록 조회
 */
export function useTransactions(filters: TransactionFilters = {}) {
  const { currentGroup } = useGroup()

  return useQuery({
    queryKey: queryKeys.transactions(filters),
    queryFn: async () => {
      const params = new URLSearchParams()

      Object.entries(filters).forEach(([key, value]) => {
        if (value !== undefined && value !== null && value !== '') {
          params.append(key, value.toString())
        }
      })

      if (currentGroup) {
        params.append('groupId', currentGroup.id)
      }

      const response = await apiGet(`/api/transactions?${params.toString()}`)

      if (!response.ok) {
        throw new Error(response.error || '거래 목록을 불러올 수 없습니다')
      }

      return response.data
    },
    enabled: !!currentGroup,
    staleTime: 1 * 60 * 1000, // 1분
    gcTime: 5 * 60 * 1000, // 5분
  })
}

/**
 * 단일 거래 조회
 */
export function useTransaction(id: string) {
  return useQuery({
    queryKey: queryKeys.transaction(id),
    queryFn: async () => {
      const response = await apiGet(`/api/transactions/${id}`)

      if (!response.ok) {
        throw new Error(response.error || '거래 정보를 불러올 수 없습니다')
      }

      return response.data
    },
    enabled: !!id,
    staleTime: 2 * 60 * 1000, // 2분
  })
}

/**
 * 거래 생성
 */
export function useCreateTransaction() {
  const queryClient = useQueryClient()
  const { currentGroup } = useGroup()
  const { showSuccess, showError } = useAlert()

  return useMutation({
    mutationFn: async (data: CreateTransactionData) => {
      if (!currentGroup) {
        throw new Error('그룹을 선택해주세요')
      }

      const response = await apiPost('/api/transactions', {
        ...data,
        groupId: currentGroup.id,
      })

      if (!response.ok) {
        throw new Error(response.error || '거래 추가에 실패했습니다')
      }

      return response.data
    },
    onSuccess: data => {
      // 거래 목록 쿼리 무효화
      queryClient.invalidateQueries({
        queryKey: ['transactions'],
      })

      // 잔액 관련 쿼리 무효화
      queryClient.invalidateQueries({
        queryKey: ['balance'],
      })

      // 월별 통계 쿼리 무효화
      queryClient.invalidateQueries({
        queryKey: ['monthly-stats'],
      })

      // 통계 페이지 쿼리 무효화
      queryClient.invalidateQueries({
        queryKey: ['statistics'],
      })

      // 거래 통계 쿼리 무효화
      queryClient.invalidateQueries({
        queryKey: ['transaction-stats'],
      })

      showSuccess('거래가 추가되었습니다')
    },
    onError: (error: Error) => {
      showError(error.message || '거래 추가에 실패했습니다')
    },
  })
}

/**
 * 거래 수정
 */
export function useUpdateTransaction() {
  const queryClient = useQueryClient()
  const { showSuccess, showError } = useAlert()

  return useMutation({
    mutationFn: async ({ id, data }: { id: string; data: Partial<CreateTransactionData> }) => {
      const response = await apiPut(`/api/transactions/${id}`, data)

      if (!response.ok) {
        throw new Error(response.error || '거래 수정에 실패했습니다')
      }

      return response.data
    },
    onSuccess: (data, variables) => {
      // 해당 거래 캐시 업데이트
      queryClient.setQueryData(queryKeys.transaction(variables.id), data)

      // 거래 목록 쿼리 무효화
      queryClient.invalidateQueries({
        queryKey: ['transactions'],
      })

      // 잔액 관련 쿼리 무효화
      queryClient.invalidateQueries({
        queryKey: ['balance'],
      })

      // 월별 통계 쿼리 무효화
      queryClient.invalidateQueries({
        queryKey: ['monthly-stats'],
      })

      // 통계 페이지 쿼리 무효화
      queryClient.invalidateQueries({
        queryKey: ['statistics'],
      })

      // 거래 통계 쿼리 무효화
      queryClient.invalidateQueries({
        queryKey: ['transaction-stats'],
      })

      showSuccess('거래가 수정되었습니다')
    },
    onError: (error: Error) => {
      showError(error.message || '거래 수정에 실패했습니다')
    },
  })
}

/**
 * 거래 삭제
 */
export function useDeleteTransaction() {
  const queryClient = useQueryClient()
  const { showSuccess, showError } = useAlert()

  return useMutation({
    mutationFn: async (id: string) => {
      const response = await apiDelete(`/api/transactions/${id}`)

      if (!response.ok) {
        throw new Error(response.error || '거래 삭제에 실패했습니다')
      }

      return { id }
    },
    onSuccess: data => {
      // 해당 거래 캐시에서 제거
      queryClient.removeQueries({
        queryKey: queryKeys.transaction(data.id),
      })

      // 거래 목록 쿼리 무효화
      queryClient.invalidateQueries({
        queryKey: ['transactions'],
      })

      // 잔액 관련 쿼리 무효화
      queryClient.invalidateQueries({
        queryKey: ['balance'],
      })

      // 월별 통계 쿼리 무효화
      queryClient.invalidateQueries({
        queryKey: ['monthly-stats'],
      })

      // 통계 페이지 쿼리 무효화
      queryClient.invalidateQueries({
        queryKey: ['statistics'],
      })

      // 거래 통계 쿼리 무효화
      queryClient.invalidateQueries({
        queryKey: ['transaction-stats'],
      })

      showSuccess('거래가 삭제되었습니다')
    },
    onError: (error: Error) => {
      showError(error.message || '거래 삭제에 실패했습니다')
    },
  })
}

/**
 * 빠른 거래 추가 (기존 API 사용)
 */
export function useQuickAddTransaction() {
  const queryClient = useQueryClient()
  const { currentGroup } = useGroup()
  const { showSuccess, showError } = useAlert()

  return useMutation({
    mutationFn: async (data: {
      type: 'EXPENSE' | 'INCOME'
      amount: number
      categoryName: string
      memo?: string
      date: string
    }) => {
      if (!currentGroup) {
        throw new Error('그룹을 선택해주세요')
      }

      const response = await apiPost('/api/transactions/quick-add', {
        ...data,
        groupId: currentGroup.id,
      })

      if (!response.ok) {
        throw new Error(response.error || '거래 추가에 실패했습니다')
      }

      return response.data
    },
    onSuccess: () => {
      // 모든 거래 관련 쿼리 무효화
      queryClient.invalidateQueries({
        queryKey: ['transactions'],
      })

      // 카테고리 쿼리 무효화 (새 카테고리 생성 가능성)
      queryClient.invalidateQueries({
        queryKey: ['categories'],
      })

      // 잔액 관련 쿼리 무효화
      queryClient.invalidateQueries({
        queryKey: ['balance'],
      })

      // 월별 통계 쿼리 무효화 (대시보드)
      queryClient.invalidateQueries({
        queryKey: ['monthly-stats'],
      })

      // 통계 페이지 쿼리 무효화
      queryClient.invalidateQueries({
        queryKey: ['statistics'],
      })

      // 거래 통계 쿼리 무효화
      queryClient.invalidateQueries({
        queryKey: ['transaction-stats'],
      })

      // showSuccess('거래가 추가되었습니다') // 빠른 입력에서는 성공 모달이 대신 표시됨
    },
    onError: (error: Error) => {
      showError(error.message || '거래 추가에 실패했습니다')
    },
  })
}

/**
 * 거래 통계 조회
 */
export function useTransactionStats(filters: { startDate?: string; endDate?: string } = {}) {
  const { currentGroup } = useGroup()

  return useQuery({
    queryKey: ['transaction-stats', currentGroup?.id, filters],
    queryFn: async () => {
      const params = new URLSearchParams()

      if (filters.startDate) params.append('startDate', filters.startDate)
      if (filters.endDate) params.append('endDate', filters.endDate)
      if (currentGroup) params.append('groupId', currentGroup.id)

      const response = await apiGet(`/api/transactions/stats?${params.toString()}`)

      if (!response.ok) {
        throw new Error(response.error || '통계 정보를 불러올 수 없습니다')
      }

      return response.data
    },
    enabled: !!currentGroup,
    staleTime: 2 * 60 * 1000, // 2분
  })
}

/**
 * 거래 검색
 */
export function useSearchTransactions(query: string, enabled = true) {
  const { currentGroup } = useGroup()

  return useQuery({
    queryKey: ['transaction-search', currentGroup?.id, query],
    queryFn: async () => {
      if (!query.trim()) return { transactions: [], total: 0 }

      const params = new URLSearchParams({
        search: query.trim(),
        limit: '20',
      })

      if (currentGroup) {
        params.append('groupId', currentGroup.id)
      }

      const response = await apiGet(`/api/transactions?${params.toString()}`)

      if (!response.ok) {
        throw new Error(response.error || '검색에 실패했습니다')
      }

      return response.data
    },
    enabled: enabled && !!currentGroup && query.trim().length >= 2,
    staleTime: 30 * 1000, // 30초
  })
}
