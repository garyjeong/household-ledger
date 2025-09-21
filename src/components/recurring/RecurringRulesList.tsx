'use client'

import React, { useState } from 'react'
import {
  Plus,
  Repeat,
  Calendar,
  DollarSign,
  Edit2,
  Trash2,
  Play,
  Pause,
  MoreVertical,
  Clock,
} from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { formatCurrency } from '@/lib/utils/account'
import { useAlert } from '@/contexts/alert-context'
import {
  useRecurringRules,
  useUpdateRecurringRule,
  useDeleteRecurringRule,
  useGenerateTransactionFromRule,
  RecurringRule,
} from '@/hooks/use-recurring-rules'
import { RecurringRuleForm } from './RecurringRuleForm'

interface RecurringRulesListProps {
  onCreateNew?: () => void
}

const FREQUENCY_LABELS = {
  MONTHLY: '매월',
  WEEKLY: '매주',
  DAILY: '매일',
} as const

export function RecurringRulesList({ onCreateNew }: RecurringRulesListProps) {
  const [selectedRule, setSelectedRule] = useState<RecurringRule | null>(null)
  const [isEditModalOpen, setIsEditModalOpen] = useState(false)
  const { showSuccess, showError } = useAlert()

  // 반복 거래 규칙 조회
  const { data: recurringRules = [], isLoading, refetch } = useRecurringRules()

  // 반복 거래 규칙 수정
  const updateRuleMutation = useUpdateRecurringRule()

  // 반복 거래 규칙 삭제
  const deleteRuleMutation = useDeleteRecurringRule()

  // 반복 거래에서 실제 거래 생성
  const generateTransactionMutation = useGenerateTransactionFromRule()

  const handleEdit = (rule: RecurringRule) => {
    setSelectedRule(rule)
    setIsEditModalOpen(true)
  }

  const handleToggleActive = async (rule: RecurringRule) => {
    try {
      await updateRuleMutation.mutateAsync({
        id: rule.id,
        data: { isActive: !rule.isActive },
      })
      showSuccess(rule.isActive ? '반복 거래가 비활성화되었습니다' : '반복 거래가 활성화되었습니다')
    } catch (error) {
      showError('반복 거래 상태 변경에 실패했습니다')
    }
  }

  const handleDelete = async (rule: RecurringRule) => {
    if (confirm('정말로 이 반복 거래 규칙을 삭제하시겠습니까?')) {
      try {
        await deleteRuleMutation.mutateAsync(rule.id)
        showSuccess('반복 거래 규칙이 삭제되었습니다')
      } catch (error) {
        showError('반복 거래 규칙 삭제에 실패했습니다')
      }
    }
  }

  const handleGenerateTransaction = async (rule: RecurringRule) => {
    const today = new Date().toISOString().split('T')[0]
    try {
      await generateTransactionMutation.mutateAsync({
        id: rule.id,
        date: today,
      })
      showSuccess('반복 거래에서 실제 거래가 생성되었습니다')
    } catch (error) {
      showError('거래 생성에 실패했습니다')
    }
  }

  const handleEditSubmit = async (data: any) => {
    if (!selectedRule) return

    try {
      await updateRuleMutation.mutateAsync({
        id: selectedRule.id,
        data,
      })
      showSuccess('반복 거래 규칙이 수정되었습니다')
      setIsEditModalOpen(false)
      setSelectedRule(null)
    } catch (error) {
      showError('반복 거래 규칙 수정에 실패했습니다')
      throw error
    }
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('ko-KR')
  }

  if (isLoading) {
    return (
      <div className='space-y-4'>
        {[...Array(3)].map((_, index) => (
          <Card key={index} className='animate-pulse'>
            <CardContent className='p-6'>
              <div className='h-4 bg-gray-200 rounded w-3/4 mb-2'></div>
              <div className='h-3 bg-gray-200 rounded w-1/2'></div>
            </CardContent>
          </Card>
        ))}
      </div>
    )
  }

  return (
    <div className='space-y-4'>
      {/* 헤더 */}
      <div className='flex items-center justify-between'>
        <div className='flex items-center gap-2'>
          <Repeat className='h-5 w-5' />
          <h2 className='text-lg font-semibold'>반복 거래</h2>
          <Badge variant='secondary'>{recurringRules.length}</Badge>
        </div>
        {onCreateNew && (
          <Button onClick={onCreateNew} className='flex items-center gap-2'>
            <Plus className='h-4 w-4' />
            새 반복 거래
          </Button>
        )}
      </div>

      {/* 반복 거래 목록 */}
      {recurringRules.length === 0 ? (
        <Card>
          <CardContent className='p-8 text-center'>
            <Repeat className='h-12 w-12 mx-auto text-gray-400 mb-4' />
            <h3 className='text-lg font-medium text-gray-900 mb-2'>반복 거래가 없습니다</h3>
            <p className='text-gray-500 mb-4'>
              월세, 구독료 등 정기적으로 발생하는 거래를 등록해보세요
            </p>
            {onCreateNew && (
              <Button onClick={onCreateNew}>첫 번째 반복 거래 만들기</Button>
            )}
          </CardContent>
        </Card>
      ) : (
        <div className='space-y-3'>
          {recurringRules.map(rule => (
            <Card key={rule.id} className={`transition-opacity ${!rule.isActive ? 'opacity-60' : ''}`}>
              <CardContent className='p-4'>
                <div className='flex items-start justify-between'>
                  <div className='flex-1'>
                    <div className='flex items-center gap-2 mb-2'>
                      <h3 className='font-medium'>
                        {rule.merchant || rule.memo || '반복 거래'}
                      </h3>
                      <Badge variant={rule.isActive ? 'default' : 'secondary'}>
                        {rule.isActive ? '활성' : '비활성'}
                      </Badge>
                      <Badge variant='outline'>
                        {FREQUENCY_LABELS[rule.frequency]}
                      </Badge>
                    </div>

                    <div className='grid grid-cols-2 md:grid-cols-4 gap-4 text-sm text-gray-600'>
                      <div className='flex items-center gap-1'>
                        <DollarSign className='h-3 w-3' />
                        <span className='font-medium'>
                          {formatCurrency(parseInt(rule.amount) / 100)}
                        </span>
                      </div>
                      
                      <div className='flex items-center gap-1'>
                        <Calendar className='h-3 w-3' />
                        <span>{formatDate(rule.startDate)}</span>
                      </div>
                      
                      <div className='flex items-center gap-1'>
                        <Clock className='h-3 w-3' />
                        <span>{rule.dayRule}</span>
                      </div>

                      {rule.category && (
                        <div className='flex items-center gap-1'>
                          {rule.category.color && (
                            <div
                              className='w-3 h-3 rounded-full'
                              style={{ backgroundColor: rule.category.color }}
                            />
                          )}
                          <span>{rule.category.name}</span>
                        </div>
                      )}
                    </div>

                    {rule.memo && (
                      <p className='text-sm text-gray-500 mt-2 line-clamp-2'>
                        {rule.memo}
                      </p>
                    )}
                  </div>

                  <div className='flex items-center gap-2 ml-4'>
                    {rule.isActive && (
                      <Button
                        size='sm'
                        variant='outline'
                        onClick={() => handleGenerateTransaction(rule)}
                        disabled={generateTransactionMutation.isPending}
                        className='flex items-center gap-1'
                      >
                        <Play className='h-3 w-3' />
                        생성
                      </Button>
                    )}

                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant='ghost' size='sm'>
                          <MoreVertical className='h-4 w-4' />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align='end'>
                        <DropdownMenuItem onClick={() => handleEdit(rule)}>
                          <Edit2 className='h-4 w-4 mr-2' />
                          수정
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => handleToggleActive(rule)}>
                          {rule.isActive ? (
                            <>
                              <Pause className='h-4 w-4 mr-2' />
                              비활성화
                            </>
                          ) : (
                            <>
                              <Play className='h-4 w-4 mr-2' />
                              활성화
                            </>
                          )}
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          onClick={() => handleDelete(rule)}
                          className='text-red-600'
                        >
                          <Trash2 className='h-4 w-4 mr-2' />
                          삭제
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* 수정 모달 */}
      <RecurringRuleForm
        isOpen={isEditModalOpen}
        onClose={() => {
          setIsEditModalOpen(false)
          setSelectedRule(null)
        }}
        onSubmit={handleEditSubmit}
        initialData={selectedRule || undefined}
        isEdit={true}
      />
    </div>
  )
}
