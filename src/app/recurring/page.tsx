'use client'

import React, { useState } from 'react'
import { Repeat, Plus, Calendar, TrendingUp, AlertCircle } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { RecurringRulesList } from '@/components/recurring/RecurringRulesList'
import { RecurringRuleForm } from '@/components/recurring/RecurringRuleForm'
import { useAuth } from '@/contexts/auth-context'
import { useAlert } from '@/contexts/alert-context'
import {
  useRecurringRules,
  useCreateRecurringRule,
  useProcessRecurringRules,
  CreateRecurringRuleData,
} from '@/hooks/use-recurring-rules'

export default function RecurringPage() {
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false)
  const { user } = useAuth()
  const { showSuccess, showError } = useAlert()

  // 반복 거래 규칙 조회
  const { data: recurringRules = [] } = useRecurringRules()

  // 반복 거래 규칙 생성
  const createRuleMutation = useCreateRecurringRule()

  // 반복 거래 일괄 처리
  const processRulesMutation = useProcessRecurringRules()

  // 통계 계산
  const activeRules = recurringRules.filter(rule => rule.isActive)
  const monthlyTotal = activeRules
    .filter(rule => rule.frequency === 'MONTHLY')
    .reduce((sum, rule) => sum + parseInt(rule.amount), 0)
  const weeklyTotal = activeRules
    .filter(rule => rule.frequency === 'WEEKLY')
    .reduce((sum, rule) => sum + parseInt(rule.amount), 0)
  const dailyTotal = activeRules
    .filter(rule => rule.frequency === 'DAILY')
    .reduce((sum, rule) => sum + parseInt(rule.amount), 0)

  const estimatedMonthlyTotal = monthlyTotal + (weeklyTotal * 4.33) + (dailyTotal * 30)

  const handleCreateSubmit = async (data: CreateRecurringRuleData) => {
    try {
      await createRuleMutation.mutateAsync(data)
      showSuccess('반복 거래 규칙이 생성되었습니다')
      setIsCreateModalOpen(false)
    } catch (error) {
      showError('반복 거래 규칙 생성에 실패했습니다')
      throw error
    }
  }

  const handleProcessToday = async () => {
    try {
      const result = await processRulesMutation.mutateAsync({})
      showSuccess(`오늘의 반복 거래 처리 완료: ${result.data.created}개 생성`)
    } catch (error) {
      showError('반복 거래 처리에 실패했습니다')
    }
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('ko-KR', {
      style: 'currency',
      currency: 'KRW',
    }).format(amount / 100)
  }

  return (
    <div className='container mx-auto p-6 space-y-6'>
      {/* 헤더 */}
      <div className='flex items-center justify-between'>
        <div className='flex items-center gap-3'>
          <div className='p-2 bg-blue-100 rounded-lg'>
            <Repeat className='h-6 w-6 text-blue-600' />
          </div>
          <div>
            <h1 className='text-2xl font-bold text-gray-900'>반복 거래 관리</h1>
            <p className='text-gray-600'>정기적으로 발생하는 수입과 지출을 관리하세요</p>
          </div>
        </div>
        <div className='flex items-center gap-2'>
          <Button
            onClick={handleProcessToday}
            variant='outline'
            disabled={processRulesMutation.isPending || activeRules.length === 0}
            className='flex items-center gap-2'
          >
            <Calendar className='h-4 w-4' />
            {processRulesMutation.isPending ? '처리 중...' : '오늘 처리'}
          </Button>
          <Button onClick={() => setIsCreateModalOpen(true)} className='flex items-center gap-2'>
            <Plus className='h-4 w-4' />
            새 반복 거래
          </Button>
        </div>
      </div>

      {/* 통계 카드 */}
      <div className='grid grid-cols-1 md:grid-cols-4 gap-4'>
        <Card>
          <CardHeader className='flex flex-row items-center justify-between space-y-0 pb-2'>
            <CardTitle className='text-sm font-medium'>활성 규칙</CardTitle>
            <Repeat className='h-4 w-4 text-muted-foreground' />
          </CardHeader>
          <CardContent>
            <div className='text-2xl font-bold'>{activeRules.length}</div>
            <p className='text-xs text-muted-foreground'>
              전체 {recurringRules.length}개 중
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className='flex flex-row items-center justify-between space-y-0 pb-2'>
            <CardTitle className='text-sm font-medium'>월간 예상 총액</CardTitle>
            <TrendingUp className='h-4 w-4 text-muted-foreground' />
          </CardHeader>
          <CardContent>
            <div className='text-2xl font-bold'>
              {formatCurrency(estimatedMonthlyTotal)}
            </div>
            <p className='text-xs text-muted-foreground'>
              활성 반복 거래 기준
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className='flex flex-row items-center justify-between space-y-0 pb-2'>
            <CardTitle className='text-sm font-medium'>매월</CardTitle>
            <Calendar className='h-4 w-4 text-muted-foreground' />
          </CardHeader>
          <CardContent>
            <div className='text-2xl font-bold'>
              {formatCurrency(monthlyTotal)}
            </div>
            <p className='text-xs text-muted-foreground'>
              {activeRules.filter(r => r.frequency === 'MONTHLY').length}개 규칙
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className='flex flex-row items-center justify-between space-y-0 pb-2'>
            <CardTitle className='text-sm font-medium'>매주/매일</CardTitle>
            <Calendar className='h-4 w-4 text-muted-foreground' />
          </CardHeader>
          <CardContent>
            <div className='text-2xl font-bold'>
              {formatCurrency(weeklyTotal + dailyTotal)}
            </div>
            <p className='text-xs text-muted-foreground'>
              {activeRules.filter(r => r.frequency !== 'MONTHLY').length}개 규칙
            </p>
          </CardContent>
        </Card>
      </div>

      {/* 안내 메시지 */}
      {recurringRules.length > 0 && (
        <Card className='border-blue-200 bg-blue-50'>
          <CardContent className='p-4'>
            <div className='flex items-start gap-3'>
              <AlertCircle className='h-5 w-5 text-blue-600 mt-0.5' />
              <div>
                <h3 className='font-medium text-blue-900 mb-1'>반복 거래 사용 팁</h3>
                <ul className='text-sm text-blue-700 space-y-1'>
                  <li>• 각 반복 거래에서 "생성" 버튼을 클릭하여 실제 거래를 만들 수 있습니다</li>
                  <li>• 비활성화된 규칙은 자동 생성되지 않지만 수동으로 생성할 수 있습니다</li>
                  <li>• 날짜 규칙은 "매월 5일", "매주 금요일", "매일" 등으로 작성하세요</li>
                </ul>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* 반복 거래 목록 */}
      <RecurringRulesList onCreateNew={() => setIsCreateModalOpen(true)} />

      {/* 생성 모달 */}
      <RecurringRuleForm
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        onSubmit={handleCreateSubmit}
      />
    </div>
  )
}
