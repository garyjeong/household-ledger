'use client'

import React, { useState } from 'react'
import { Repeat, Plus, AlertCircle } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { RecurringRulesList } from '@/components/recurring/RecurringRulesList'
import { RecurringRuleForm } from '@/components/recurring/RecurringRuleForm'
import { useAuth } from '@/contexts/auth-context'
import { useAlert } from '@/contexts/alert-context'
import {
  useCreateRecurringRule,
  CreateRecurringRuleData,
} from '@/hooks/use-recurring-rules'

export default function RecurringSettingsPage() {
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false)
  const { user } = useAuth()
  const { showSuccess, showError } = useAlert()

  // 반복 거래 규칙 생성
  const createRuleMutation = useCreateRecurringRule()

  const handleCreateSubmit = async (data: CreateRecurringRuleData) => {
    try {
      await createRuleMutation.mutateAsync(data)
      showSuccess('새 반복 거래 규칙이 생성되었습니다')
      setIsCreateModalOpen(false)
    } catch (error) {
      showError('반복 거래 규칙 생성에 실패했습니다')
      throw error
    }
  }

  return (
    <div className='space-y-6'>
      <div className='flex items-center justify-between'>
        <div>
          <h2 className='text-xl font-bold'>반복 거래 관리</h2>
          <p className='text-gray-500'>정기적으로 발생하는 수입과 지출을 설정합니다.</p>
        </div>
        <Button onClick={() => setIsCreateModalOpen(true)} className='flex items-center gap-2'>
          <Plus className='h-4 w-4' />
          새 규칙 추가
        </Button>
      </div>

      <Card className='border-blue-200 bg-blue-50'>
        <CardContent className='p-4'>
          <div className='flex items-start gap-3'>
            <AlertCircle className='h-5 w-5 text-blue-600 mt-0.5' />
            <div>
              <h3 className='font-medium text-blue-900 mb-1'>빠른 입력과 통합</h3>
              <p className='text-sm text-blue-700'>
                이제 반복 거래는 &apos;빠른 입력&apos; 시 &quot;반복 거래로 등록&quot; 옵션을 통해 추가할 수 있습니다.
                이곳에서는 생성된 규칙을 확인하고 관리할 수 있습니다.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
      
      <RecurringRulesList onCreateNew={() => setIsCreateModalOpen(true)} />

      <RecurringRuleForm
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        onSubmit={handleCreateSubmit}
      />
    </div>
  )
}
