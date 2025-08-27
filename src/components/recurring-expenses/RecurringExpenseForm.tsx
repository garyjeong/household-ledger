'use client'

import { useState, useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import {
  Calendar,
  Clock,
  DollarSign,
  Building,
  Tag,
  FileText,
  ToggleLeft,
  ToggleRight,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'

// 폼 데이터 스키마
const recurringExpenseFormSchema = z.object({
  startDate: z.string().min(1, '시작 날짜를 선택해주세요'),
  frequency: z.enum(['MONTHLY', 'WEEKLY'], {
    message: '반복 주기를 선택해주세요',
  }),
  dayRule: z.string().min(1, '반복 일정을 선택해주세요'),
  amount: z.string().min(1, '금액을 입력해주세요'),
  accountId: z.string().min(1, '계좌를 선택해주세요'),
  categoryId: z.string().optional(),
  merchant: z.string().max(160, '상점명은 160자 이하로 입력해주세요').optional(),
  memo: z.string().max(1000, '메모는 1000자 이하로 입력해주세요').optional(),
  isActive: z.boolean().default(true),
})

type RecurringExpenseFormData = z.infer<typeof recurringExpenseFormSchema>

// 외부에서 받을 데이터 타입
export interface RecurringExpenseData {
  id?: string
  ownerType: 'USER' | 'GROUP'
  ownerId: string
  startDate: string
  frequency: 'MONTHLY' | 'WEEKLY'
  dayRule: string
  amount: number
  accountId: string
  categoryId?: string
  merchant?: string
  memo?: string
  isActive: boolean
}

export interface Account {
  id: string
  name: string
  type: string
}

export interface Category {
  id: string
  name: string
  color?: string
  type: string
}

interface RecurringExpenseFormProps {
  mode: 'create' | 'edit'
  initialData?: RecurringExpenseData
  accounts: Account[]
  categories: Category[]
  ownerType: 'USER' | 'GROUP'
  ownerId: string
  onSubmit: (data: RecurringExpenseData) => Promise<void>
  onCancel?: () => void
  isLoading?: boolean
}

// 반복 주기 옵션
const frequencyOptions = [
  { value: 'MONTHLY', label: '매월' },
  { value: 'WEEKLY', label: '매주' },
]

// 월별 날짜 옵션 (1-31일)
const monthlyDayOptions = Array.from({ length: 31 }, (_, i) => ({
  value: `D${i + 1}`,
  label: `${i + 1}일`,
}))

// 주별 요일 옵션
const weeklyDayOptions = [
  { value: 'MON', label: '월요일' },
  { value: 'TUE', label: '화요일' },
  { value: 'WED', label: '수요일' },
  { value: 'THU', label: '목요일' },
  { value: 'FRI', label: '금요일' },
  { value: 'SAT', label: '토요일' },
  { value: 'SUN', label: '일요일' },
]

export function RecurringExpenseForm({
  mode,
  initialData,
  accounts,
  categories,
  ownerType,
  ownerId,
  onSubmit,
  onCancel,
  isLoading = false,
}: RecurringExpenseFormProps) {
  const [selectedFrequency, setSelectedFrequency] = useState<'MONTHLY' | 'WEEKLY'>('MONTHLY')

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors, isSubmitting },
    reset,
  } = useForm<RecurringExpenseFormData>({
    resolver: zodResolver(recurringExpenseFormSchema),
    defaultValues: {
      startDate: initialData?.startDate || '',
      frequency: initialData?.frequency || 'MONTHLY',
      dayRule: initialData?.dayRule || '',
      amount: initialData?.amount ? initialData.amount.toString() : '',
      accountId: initialData?.accountId || '',
      categoryId: initialData?.categoryId || '',
      merchant: initialData?.merchant || '',
      memo: initialData?.memo || '',
      isActive: initialData?.isActive ?? true,
    },
  })

  const watchedFrequency = watch('frequency')
  const watchedIsActive = watch('isActive')

  // 반복 주기 변경 시 날짜 규칙 초기화
  useEffect(() => {
    setSelectedFrequency(watchedFrequency as 'MONTHLY' | 'WEEKLY')
    setValue('dayRule', '') // 규칙 초기화
  }, [watchedFrequency, setValue])

  // 숫자 입력 포맷팅
  const formatNumberInput = (value: string) => {
    const number = value.replace(/[^\d]/g, '')
    return number ? parseInt(number, 10).toLocaleString() : ''
  }

  const parseNumberInput = (value: string) => {
    return value.replace(/[^\d]/g, '')
  }

  const handleFormSubmit = async (data: RecurringExpenseFormData) => {
    try {
      const submitData: RecurringExpenseData = {
        ...initialData,
        ownerType,
        ownerId,
        startDate: data.startDate,
        frequency: data.frequency,
        dayRule: data.dayRule,
        amount: parseInt(parseNumberInput(data.amount), 10),
        accountId: data.accountId,
        categoryId: data.categoryId || undefined,
        merchant: data.merchant || undefined,
        memo: data.memo || undefined,
        isActive: data.isActive,
      }

      await onSubmit(submitData)
    } catch (error) {
      console.error('Form submission error:', error)
    }
  }

  // 날짜 규칙 옵션
  const dayRuleOptions = selectedFrequency === 'MONTHLY' ? monthlyDayOptions : weeklyDayOptions

  return (
    <Card className='w-full max-w-2xl mx-auto'>
      <CardHeader>
        <CardTitle className='flex items-center gap-2'>
          <Clock className='h-5 w-5' />
          {mode === 'create' ? '고정 지출 추가' : '고정 지출 수정'}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit(handleFormSubmit)} className='space-y-6'>
          {/* 시작 날짜 */}
          <div className='space-y-2'>
            <Label htmlFor='startDate' className='flex items-center gap-2'>
              <Calendar className='h-4 w-4' />
              시작 날짜 *
            </Label>
            <Input
              id='startDate'
              type='date'
              {...register('startDate')}
              className={errors.startDate ? 'border-red-500' : ''}
            />
            {errors.startDate && <p className='text-sm text-red-500'>{errors.startDate.message}</p>}
          </div>

          {/* 반복 주기 */}
          <div className='space-y-2'>
            <Label className='flex items-center gap-2'>
              <Clock className='h-4 w-4' />
              반복 주기 *
            </Label>
            <Select
              value={watchedFrequency}
              onValueChange={value => setValue('frequency', value as 'MONTHLY' | 'WEEKLY')}
            >
              <SelectTrigger>
                <SelectValue placeholder='반복 주기 선택' />
              </SelectTrigger>
              <SelectContent>
                {frequencyOptions.map(option => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {errors.frequency && <p className='text-sm text-red-500'>{errors.frequency.message}</p>}
          </div>

          {/* 반복 날짜 */}
          <div className='space-y-2'>
            <Label className='flex items-center gap-2'>
              <Calendar className='h-4 w-4' />
              반복 날짜 *
            </Label>
            <Select value={watch('dayRule')} onValueChange={value => setValue('dayRule', value)}>
              <SelectTrigger>
                <SelectValue
                  placeholder={selectedFrequency === 'MONTHLY' ? '매월 몇 일' : '매주 무슨 요일'}
                />
              </SelectTrigger>
              <SelectContent>
                {dayRuleOptions.map(option => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {errors.dayRule && <p className='text-sm text-red-500'>{errors.dayRule.message}</p>}
          </div>

          {/* 금액 */}
          <div className='space-y-2'>
            <Label htmlFor='amount' className='flex items-center gap-2'>
              <DollarSign className='h-4 w-4' />
              금액 *
            </Label>
            <Input
              id='amount'
              type='text'
              placeholder='0'
              {...register('amount')}
              onChange={e => {
                const formatted = formatNumberInput(e.target.value)
                setValue('amount', formatted)
              }}
              className={errors.amount ? 'border-red-500' : ''}
            />
            {errors.amount && <p className='text-sm text-red-500'>{errors.amount.message}</p>}
          </div>

          {/* 계좌 선택 */}
          <div className='space-y-2'>
            <Label className='flex items-center gap-2'>
              <Building className='h-4 w-4' />
              계좌 *
            </Label>
            <Select
              value={watch('accountId')}
              onValueChange={value => setValue('accountId', value)}
            >
              <SelectTrigger>
                <SelectValue placeholder='계좌 선택' />
              </SelectTrigger>
              <SelectContent>
                {accounts.map(account => (
                  <SelectItem key={account.id} value={account.id}>
                    {account.name} ({account.type})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {errors.accountId && <p className='text-sm text-red-500'>{errors.accountId.message}</p>}
          </div>

          {/* 카테고리 선택 */}
          <div className='space-y-2'>
            <Label className='flex items-center gap-2'>
              <Tag className='h-4 w-4' />
              카테고리
            </Label>
            <Select
              value={watch('categoryId')}
              onValueChange={value => setValue('categoryId', value)}
            >
              <SelectTrigger>
                <SelectValue placeholder='카테고리 선택 (선택사항)' />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value=''>카테고리 없음</SelectItem>
                {categories.map(category => (
                  <SelectItem key={category.id} value={category.id}>
                    <div className='flex items-center gap-2'>
                      {category.color && (
                        <div
                          className='w-3 h-3 rounded-full'
                          style={{ backgroundColor: category.color }}
                        />
                      )}
                      {category.name}
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* 상점명 */}
          <div className='space-y-2'>
            <Label htmlFor='merchant' className='flex items-center gap-2'>
              <Building className='h-4 w-4' />
              상점명
            </Label>
            <Input
              id='merchant'
              type='text'
              placeholder='예: 스타벅스, 넷플릭스'
              {...register('merchant')}
              className={errors.merchant ? 'border-red-500' : ''}
            />
            {errors.merchant && <p className='text-sm text-red-500'>{errors.merchant.message}</p>}
          </div>

          {/* 메모 */}
          <div className='space-y-2'>
            <Label htmlFor='memo' className='flex items-center gap-2'>
              <FileText className='h-4 w-4' />
              메모
            </Label>
            <Input
              id='memo'
              type='text'
              placeholder='추가 설명이나 메모'
              {...register('memo')}
              className={errors.memo ? 'border-red-500' : ''}
            />
            {errors.memo && <p className='text-sm text-red-500'>{errors.memo.message}</p>}
          </div>

          {/* 활성 상태 */}
          <div className='space-y-2'>
            <Label className='flex items-center gap-2'>
              {watchedIsActive ? (
                <ToggleRight className='h-4 w-4 text-green-600' />
              ) : (
                <ToggleLeft className='h-4 w-4 text-gray-400' />
              )}
              활성 상태
            </Label>
            <div className='flex items-center space-x-2'>
              <button
                type='button'
                onClick={() => setValue('isActive', !watchedIsActive)}
                className={`
                  relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-slate-500 focus:ring-offset-2
                  ${watchedIsActive ? 'bg-green-600' : 'bg-gray-200'}
                `}
              >
                <span
                  className={`
                    inline-block h-4 w-4 transform rounded-full bg-white transition-transform
                    ${watchedIsActive ? 'translate-x-6' : 'translate-x-1'}
                  `}
                />
              </button>
              <span className='text-sm text-gray-700'>{watchedIsActive ? '활성' : '비활성'}</span>
            </div>
          </div>

          {/* 버튼 */}
          <div className='flex gap-3 pt-4'>
            <Button type='submit' disabled={isSubmitting || isLoading} className='flex-1'>
              {isSubmitting || isLoading ? '처리 중...' : mode === 'create' ? '추가' : '수정'}
            </Button>
            {onCancel && (
              <Button
                type='button'
                variant='outline'
                onClick={onCancel}
                disabled={isSubmitting || isLoading}
                className='flex-1'
              >
                취소
              </Button>
            )}
          </div>
        </form>
      </CardContent>
    </Card>
  )
}
