'use client'

import { useState, useEffect } from 'react'
import { Plus, AlertCircle } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { useToast } from '@/hooks/use-toast'
import { RecurringExpenseList, type RecurringExpense } from '@/components/recurring-expenses/RecurringExpenseList'
import { RecurringExpenseDialog } from '@/components/recurring-expenses/RecurringExpenseDialog'
import { type RecurringExpenseData, type Account, type Category } from '@/components/recurring-expenses/RecurringExpenseForm'
import { useAuth } from '@/contexts/auth-context'
import { useGroup } from '@/contexts/group-context'

export default function RecurringExpensesPage() {
  const { user } = useAuth()
  const { currentGroup } = useGroup()
  const { toast } = useToast()

  // 상태 관리
  const [recurringExpenses, setRecurringExpenses] = useState<RecurringExpense[]>([])
  const [accounts, setAccounts] = useState<Account[]>([])
  const [categories, setCategories] = useState<Category[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isSubmitting, setIsSubmitting] = useState(false)

  // Dialog 상태
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [dialogMode, setDialogMode] = useState<'create' | 'edit'>('create')
  const [selectedExpense, setSelectedExpense] = useState<RecurringExpense | undefined>()

  // 소유자 정보
  const ownerType = currentGroup ? 'GROUP' : 'USER'
  const ownerId = currentGroup ? currentGroup.id : user?.id || ''

  // 데이터 로드
  useEffect(() => {
    loadData()
  }, [currentGroup, user])

  const loadData = async () => {
    if (!user) return

    setIsLoading(true)
    try {
      await Promise.all([
        loadRecurringExpenses(),
        loadAccounts(),
        loadCategories(),
      ])
    } catch (error) {
      console.error('Data loading error:', error)
      toast({
        title: '데이터 로드 실패',
        description: '데이터를 불러오는 중 오류가 발생했습니다.',
        variant: 'destructive',
      })
    } finally {
      setIsLoading(false)
    }
  }

  const loadRecurringExpenses = async () => {
    try {
      const params = new URLSearchParams({
        ownerType,
        ownerId,
        page: '1',
        limit: '100',
      })

      const response = await fetch(`/api/recurring-rules?${params}`, {
        credentials: 'include',
      })

      if (!response.ok) {
        throw new Error('Failed to fetch recurring expenses')
      }

      const data = await response.json()
      setRecurringExpenses(data.recurringRules || [])
    } catch (error) {
      console.error('Recurring expenses loading error:', error)
      throw error
    }
  }

  const loadAccounts = async () => {
    try {
      const params = new URLSearchParams({
        ownerType,
        ownerId,
      })

      const response = await fetch(`/api/accounts?${params}`, {
        credentials: 'include',
      })

      if (!response.ok) {
        throw new Error('Failed to fetch accounts')
      }

      const data = await response.json()
      setAccounts(data.accounts || [])
    } catch (error) {
      console.error('Accounts loading error:', error)
      throw error
    }
  }

  const loadCategories = async () => {
    try {
      const params = new URLSearchParams({
        ownerType,
        ownerId,
        type: 'EXPENSE', // 지출 카테고리만 로드
      })

      const response = await fetch(`/api/categories?${params}`, {
        credentials: 'include',
      })

      if (!response.ok) {
        throw new Error('Failed to fetch categories')
      }

      const data = await response.json()
      setCategories(data.categories || [])
    } catch (error) {
      console.error('Categories loading error:', error)
      throw error
    }
  }

  // 고정 지출 생성
  const handleCreate = async (data: RecurringExpenseData) => {
    setIsSubmitting(true)
    try {
      const response = await fetch('/api/recurring-rules', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify(data),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to create recurring expense')
      }

      await loadRecurringExpenses() // 목록 새로고침
      toast({
        title: '고정 지출 추가 완료',
        description: '새로운 고정 지출이 성공적으로 추가되었습니다.',
      })
    } catch (error) {
      console.error('Create error:', error)
      toast({
        title: '고정 지출 추가 실패',
        description: error instanceof Error ? error.message : '알 수 없는 오류가 발생했습니다.',
        variant: 'destructive',
      })
      throw error
    } finally {
      setIsSubmitting(false)
    }
  }

  // 고정 지출 수정
  const handleEdit = async (data: RecurringExpenseData) => {
    if (!selectedExpense) return

    setIsSubmitting(true)
    try {
      const response = await fetch(`/api/recurring-rules/${selectedExpense.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify(data),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to update recurring expense')
      }

      await loadRecurringExpenses() // 목록 새로고침
      toast({
        title: '고정 지출 수정 완료',
        description: '고정 지출이 성공적으로 수정되었습니다.',
      })
    } catch (error) {
      console.error('Edit error:', error)
      toast({
        title: '고정 지출 수정 실패',
        description: error instanceof Error ? error.message : '알 수 없는 오류가 발생했습니다.',
        variant: 'destructive',
      })
      throw error
    } finally {
      setIsSubmitting(false)
    }
  }

  // 고정 지출 삭제
  const handleDelete = async (expenseId: string) => {
    if (!confirm('정말로 이 고정 지출을 삭제하시겠습니까?')) {
      return
    }

    try {
      const response = await fetch(`/api/recurring-rules/${expenseId}`, {
        method: 'DELETE',
        credentials: 'include',
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to delete recurring expense')
      }

      await loadRecurringExpenses() // 목록 새로고침
      toast({
        title: '고정 지출 삭제 완료',
        description: '고정 지출이 성공적으로 삭제되었습니다.',
      })
    } catch (error) {
      console.error('Delete error:', error)
      toast({
        title: '고정 지출 삭제 실패',
        description: error instanceof Error ? error.message : '알 수 없는 오류가 발생했습니다.',
        variant: 'destructive',
      })
    }
  }

  // 활성 상태 토글
  const handleToggleActive = async (expenseId: string, isActive: boolean) => {
    try {
      const response = await fetch(`/api/recurring-rules/${expenseId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({ isActive }),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to toggle active status')
      }

      await loadRecurringExpenses() // 목록 새로고침
      toast({
        title: '상태 변경 완료',
        description: `고정 지출이 ${isActive ? '활성화' : '비활성화'}되었습니다.`,
      })
    } catch (error) {
      console.error('Toggle active error:', error)
      toast({
        title: '상태 변경 실패',
        description: error instanceof Error ? error.message : '알 수 없는 오류가 발생했습니다.',
        variant: 'destructive',
      })
    }
  }

  // Dialog 핸들러
  const openCreateDialog = () => {
    setDialogMode('create')
    setSelectedExpense(undefined)
    setIsDialogOpen(true)
  }

  const openEditDialog = (expense: RecurringExpense) => {
    setDialogMode('edit')
    setSelectedExpense(expense)
    setIsDialogOpen(true)
  }

  const closeDialog = () => {
    setIsDialogOpen(false)
    setSelectedExpense(undefined)
  }

  const handleSubmit = async (data: RecurringExpenseData) => {
    if (dialogMode === 'create') {
      await handleCreate(data)
    } else {
      await handleEdit(data)
    }
  }

  // 계좌나 카테고리가 없는 경우 경고 표시
  const hasRequiredData = accounts.length > 0

  if (!user) {
    return null
  }

  return (
    <div className="space-y-6">
      {/* 페이지 헤더 */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">고정 지출 관리</h1>
          <p className="text-gray-600 mt-1">
            정기적으로 발생하는 지출을 등록하고 관리하세요
          </p>
        </div>
        
        <Button
          onClick={openCreateDialog}
          disabled={!hasRequiredData}
          className="flex items-center gap-2"
        >
          <Plus className="h-4 w-4" />
          고정 지출 추가
        </Button>
      </div>

      {/* 필수 데이터 확인 경고 */}
      {!hasRequiredData && (
        <Card className="border-orange-200 bg-orange-50">
          <CardContent className="p-4">
            <div className="flex items-start gap-3">
              <AlertCircle className="h-5 w-5 text-orange-600 mt-0.5" />
              <div>
                <h3 className="font-medium text-orange-800">
                  고정 지출을 추가하려면 계좌가 필요합니다
                </h3>
                <p className="text-sm text-orange-700 mt-1">
                  먼저 계좌를 추가한 후 고정 지출을 등록해보세요.
                </p>
                <Button
                  variant="outline"
                  size="sm"
                  className="mt-2 border-orange-300 text-orange-700 hover:bg-orange-100"
                  onClick={() => window.location.href = '/settings/accounts'}
                >
                  계좌 관리로 이동
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* 고정 지출 목록 */}
      <RecurringExpenseList
        expenses={recurringExpenses}
        isLoading={isLoading}
        onEdit={openEditDialog}
        onDelete={handleDelete}
        onToggleActive={handleToggleActive}
      />

      {/* 고정 지출 추가/수정 Dialog */}
      <RecurringExpenseDialog
        isOpen={isDialogOpen}
        onClose={closeDialog}
        mode={dialogMode}
        initialData={selectedExpense ? {
          id: selectedExpense.id,
          ownerType,
          ownerId,
          startDate: selectedExpense.startDate,
          frequency: selectedExpense.frequency,
          dayRule: selectedExpense.dayRule,
          amount: selectedExpense.amount,
          accountId: selectedExpense.accountId,
          categoryId: selectedExpense.categoryId,
          merchant: selectedExpense.merchant,
          memo: selectedExpense.memo,
          isActive: selectedExpense.isActive,
        } : undefined}
        accounts={accounts}
        categories={categories}
        ownerType={ownerType}
        ownerId={ownerId}
        onSubmit={handleSubmit}
        isLoading={isSubmitting}
      />
    </div>
  )
}
