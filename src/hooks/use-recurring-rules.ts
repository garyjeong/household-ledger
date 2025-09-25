import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { apiGet, apiPost, apiPut, apiDelete } from '@/lib/api-client'

// 반복 거래 규칙 타입 정의
export interface RecurringRule {
  id: string
  groupId: string | null
  createdBy: string
  startDate: string
  frequency: 'MONTHLY' | 'WEEKLY' | 'DAILY'
  dayRule: string
  amount: string
  categoryId: string | null
  merchant: string | null
  memo: string | null
  isActive: boolean
  createdAt: string
  updatedAt: string
  category?: {
    id: string
    name: string
    type: string
    color: string | null
  } | null
  group?: {
    id: string
    name: string
  } | null
}

export interface CreateRecurringRuleData {
  startDate: string
  frequency: 'MONTHLY' | 'WEEKLY' | 'DAILY'
  dayRule?: string
  amount: number
  categoryId?: string
  merchant?: string
  memo?: string
}

export interface UpdateRecurringRuleData extends Partial<CreateRecurringRuleData> {
  isActive?: boolean
}

// 반복 거래 규칙 조회
export function useRecurringRules(isActive?: boolean, groupId?: string) {
  return useQuery<RecurringRule[]>({
    queryKey: ['recurring-rules', { isActive, groupId }],
    queryFn: async () => {
      const params = new URLSearchParams()
      if (isActive !== undefined) params.append('isActive', isActive.toString())
      if (groupId) params.append('groupId', groupId)

      const response = await apiGet(`/api/recurring-rules?${params.toString()}`)
      return Array.isArray(response.data) ? response.data : []
    },
    select: data => (Array.isArray(data) ? data : []),
  })
}

// 반복 거래 규칙 상세 조회
export function useRecurringRule(id: string) {
  return useQuery<RecurringRule>({
    queryKey: ['recurring-rule', id],
    queryFn: async () => {
      const response = await apiGet(`/api/recurring-rules/${id}`)
      return response.data
    },
    enabled: !!id,
  })
}

// 반복 거래 규칙 생성
export function useCreateRecurringRule() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (data: CreateRecurringRuleData) => {
      const response = await apiPost('/api/recurring-rules', data)
      return response.data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['recurring-rules'] })
    },
  })
}

// 반복 거래 규칙 수정
export function useUpdateRecurringRule() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({ id, data }: { id: string; data: UpdateRecurringRuleData }) => {
      const response = await apiPut(`/api/recurring-rules/${id}`, data)
      return response.data
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['recurring-rules'] })
      queryClient.invalidateQueries({ queryKey: ['recurring-rule', variables.id] })
    },
  })
}

// 반복 거래 규칙 삭제
export function useDeleteRecurringRule() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (id: string) => {
      const response = await apiDelete(`/api/recurring-rules/${id}`)
      return response.data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['recurring-rules'] })
    },
  })
}

// 반복 거래에서 실제 거래 생성
export function useGenerateTransactionFromRule() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({ id, date }: { id: string; date: string }) => {
      const response = await apiPost(`/api/recurring-rules/${id}/generate`, { date })
      return response.data
    },
    onSuccess: () => {
      // 거래 목록과 대시보드 데이터 갱신
      queryClient.invalidateQueries({ queryKey: ['transactions'] })
      queryClient.invalidateQueries({ queryKey: ['dashboard'] })
      queryClient.invalidateQueries({ queryKey: ['balance'] })
    },
  })
}

// 반복 거래 규칙 일괄 처리
export function useProcessRecurringRules() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (data: { date?: string; startDate?: string; endDate?: string }) => {
      const response = await apiPost('/api/recurring-rules/process', data)
      return response.data
    },
    onSuccess: () => {
      // 거래 목록과 대시보드 데이터 갱신
      queryClient.invalidateQueries({ queryKey: ['transactions'] })
      queryClient.invalidateQueries({ queryKey: ['dashboard'] })
      queryClient.invalidateQueries({ queryKey: ['balance'] })
    },
  })
}
