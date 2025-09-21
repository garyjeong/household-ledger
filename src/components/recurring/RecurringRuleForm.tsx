'use client'

import React, { useState, useEffect } from 'react'
import { useForm, Controller } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import {
  Calendar,
  Clock,
  DollarSign,
  Save,
  Loader2,
  AlertCircle,
  Repeat,
} from 'lucide-react'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { useCategories } from '@/hooks/use-categories'
import { useAlert } from '@/contexts/alert-context'
import { RecurringRule } from '@/hooks/use-recurring-rules'

// 반복 거래 규칙 폼 스키마
const recurringRuleSchema = z.object({
  startDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, '올바른 날짜 형식이 아닙니다'),
  frequency: z.enum(['MONTHLY', 'WEEKLY', 'DAILY']),
  dayRule: z.string().min(1, '날짜 규칙을 입력해주세요').max(20, '날짜 규칙은 20자 이하로 입력해주세요'),
  amount: z.number().positive('금액은 0보다 커야 합니다'),
  categoryId: z.string().optional(),
  merchant: z.string().max(160, '가맹점명은 160자 이하로 입력해주세요').optional(),
  memo: z.string().max(1000, '메모는 1000자 이하로 입력해주세요').optional(),
})

type RecurringRuleFormData = z.infer<typeof recurringRuleSchema>

interface RecurringRuleFormProps {
  isOpen: boolean
  onClose: () => void
  onSubmit: (data: RecurringRuleFormData) => Promise<void>
  initialData?: Partial<RecurringRule>
  isEdit?: boolean
}

const FREQUENCY_LABELS = {
  MONTHLY: '매월',
  WEEKLY: '매주',
  DAILY: '매일',
} as const

const DAY_RULE_EXAMPLES = {
  MONTHLY: '매월 5일, 매월 말일, 매월 첫째주 금요일',
  WEEKLY: '매주 월요일, 매주 금요일',
  DAILY: '매일, 평일만, 주말만',
} as const

export function RecurringRuleForm({
  isOpen,
  onClose,
  onSubmit,
  initialData,
  isEdit = false,
}: RecurringRuleFormProps) {
  const [isSubmitting, setIsSubmitting] = useState(false)
  const { showError } = useAlert()

  const {
    control,
    handleSubmit,
    reset,
    watch,
    formState: { errors, isValid },
  } = useForm<RecurringRuleFormData>({
    resolver: zodResolver(recurringRuleSchema),
    defaultValues: {
      startDate: new Date().toISOString().split('T')[0],
      frequency: 'MONTHLY',
      dayRule: '',
      amount: 0,
      categoryId: '',
      merchant: '',
      memo: '',
    },
  })

  const frequency = watch('frequency')

  // 카테고리 목록 조회
  const { data: categories = [] } = useCategories()

  // 초기 데이터 설정
  useEffect(() => {
    if (initialData && isOpen) {
      reset({
        startDate: initialData.startDate?.split('T')[0] || new Date().toISOString().split('T')[0],
        frequency: initialData.frequency || 'MONTHLY',
        dayRule: initialData.dayRule || '',
        amount: initialData.amount ? parseFloat(initialData.amount) / 100 : 0,
        categoryId: initialData.categoryId || '',
        merchant: initialData.merchant || '',
        memo: initialData.memo || '',
      })
    } else if (!initialData && isOpen) {
      reset({
        startDate: new Date().toISOString().split('T')[0],
        frequency: 'MONTHLY',
        dayRule: '',
        amount: 0,
        categoryId: '',
        merchant: '',
        memo: '',
      })
    }
  }, [initialData, isOpen, reset])

  const handleFormSubmit = async (data: RecurringRuleFormData) => {
    try {
      setIsSubmitting(true)
      await onSubmit(data)
      onClose()
    } catch (error) {
      console.error('반복 거래 규칙 저장 오류:', error)
      showError('반복 거래 규칙 저장에 실패했습니다')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className='sm:max-w-[500px] max-h-[90vh] overflow-y-auto'>
        <DialogHeader>
          <DialogTitle className='flex items-center gap-2'>
            <Repeat className='h-5 w-5' />
            {isEdit ? '반복 거래 수정' : '새 반복 거래 추가'}
          </DialogTitle>
          <DialogDescription>
            {isEdit ? '반복 거래 규칙을 수정하세요' : '정기적으로 발생하는 수입이나 지출을 등록하세요'}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit(handleFormSubmit)} className='space-y-6'>
          {/* 시작 날짜 */}
          <div className='space-y-2'>
            <Label htmlFor='startDate' className='flex items-center gap-2'>
              <Calendar className='h-4 w-4' />
              시작 날짜 *
            </Label>
            <Controller
              name='startDate'
              control={control}
              render={({ field }) => (
                <Input
                  {...field}
                  type='date'
                  className={errors.startDate ? 'border-red-500' : ''}
                />
              )}
            />
            {errors.startDate && (
              <p className='text-sm text-red-600'>{errors.startDate.message}</p>
            )}
          </div>

          {/* 반복 주기 */}
          <div className='space-y-2'>
            <Label className='flex items-center gap-2'>
              <Clock className='h-4 w-4' />
              반복 주기 *
            </Label>
            <Controller
              name='frequency'
              control={control}
              render={({ field }) => (
                <Select onValueChange={field.onChange} value={field.value}>
                  <SelectTrigger>
                    <SelectValue placeholder='반복 주기를 선택하세요' />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value='MONTHLY'>매월</SelectItem>
                    <SelectItem value='WEEKLY'>매주</SelectItem>
                    <SelectItem value='DAILY'>매일</SelectItem>
                  </SelectContent>
                </Select>
              )}
            />
            {errors.frequency && (
              <p className='text-sm text-red-600'>{errors.frequency.message}</p>
            )}
          </div>

          {/* 날짜 규칙 */}
          <div className='space-y-2'>
            <Label htmlFor='dayRule'>
              날짜 규칙 * 
              <span className='text-xs text-gray-500 ml-2'>
                예: {DAY_RULE_EXAMPLES[frequency]}
              </span>
            </Label>
            <Controller
              name='dayRule'
              control={control}
              render={({ field }) => (
                <Input
                  {...field}
                  placeholder={`예: ${DAY_RULE_EXAMPLES[frequency].split(', ')[0]}`}
                  className={errors.dayRule ? 'border-red-500' : ''}
                />
              )}
            />
            {errors.dayRule && (
              <p className='text-sm text-red-600'>{errors.dayRule.message}</p>
            )}
          </div>

          {/* 금액 */}
          <div className='space-y-2'>
            <Label htmlFor='amount' className='flex items-center gap-2'>
              <DollarSign className='h-4 w-4' />
              금액 *
            </Label>
            <Controller
              name='amount'
              control={control}
              render={({ field }) => (
                <Input
                  {...field}
                  type='number'
                  placeholder='0'
                  onChange={e => field.onChange(Number(e.target.value))}
                  className={errors.amount ? 'border-red-500' : ''}
                />
              )}
            />
            {errors.amount && (
              <p className='text-sm text-red-600'>{errors.amount.message}</p>
            )}
          </div>

          {/* 카테고리 */}
          <div className='space-y-2'>
            <Label>카테고리 (선택사항)</Label>
            <Controller
              name='categoryId'
              control={control}
              render={({ field }) => (
                <Select onValueChange={field.onChange} value={field.value}>
                  <SelectTrigger>
                    <SelectValue placeholder='카테고리를 선택하세요' />
                  </SelectTrigger>
                  <SelectContent>
                    {categories.map(category => (
                      <SelectItem key={category.id} value={category.id}>
                        <div className='flex items-center gap-2'>
                          {category.color && (
                            <div
                              className='w-3 h-3 rounded-full'
                              style={{ backgroundColor: category.color }}
                            />
                          )}
                          <span>{category.name}</span>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            />
          </div>

          {/* 가맹점명 */}
          <div className='space-y-2'>
            <Label htmlFor='merchant'>가맹점명 (선택사항)</Label>
            <Controller
              name='merchant'
              control={control}
              render={({ field }) => (
                <Input
                  {...field}
                  placeholder='예: 스타벅스, 넷플릭스, 월세 등'
                  className={errors.merchant ? 'border-red-500' : ''}
                />
              )}
            />
            {errors.merchant && (
              <p className='text-sm text-red-600'>{errors.merchant.message}</p>
            )}
          </div>

          {/* 메모 */}
          <div className='space-y-2'>
            <Label htmlFor='memo'>메모 (선택사항)</Label>
            <Controller
              name='memo'
              control={control}
              render={({ field }) => (
                <Textarea
                  {...field}
                  placeholder='반복 거래에 대한 추가 정보를 입력하세요...'
                  className='h-20 resize-none'
                />
              )}
            />
            {errors.memo && (
              <p className='text-sm text-red-600'>{errors.memo.message}</p>
            )}
          </div>

          <DialogFooter>
            <Button type='button' variant='outline' onClick={onClose}>
              취소
            </Button>
            <Button type='submit' disabled={!isValid || isSubmitting} className='min-w-24'>
              {isSubmitting ? (
                <>
                  <Loader2 className='h-4 w-4 mr-2 animate-spin' />
                  저장 중...
                </>
              ) : (
                <>
                  <Save className='h-4 w-4 mr-2' />
                  {isEdit ? '수정' : '추가'}
                </>
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
